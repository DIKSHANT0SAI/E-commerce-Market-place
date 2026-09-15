import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import Product from '@/models/Product';
import connectDB from '@/config/db';
import authSeller from '@/lib/authSeller';
import { cached } from '@/lib/cache';

/**
 * GET /api/seller/analytics
 *
 * Returns analytics for the AUTHENTICATED SELLER ONLY (scoped to their own
 * products/orders). Heavy work is cached per-seller in Redis (5 min) and the
 * computation uses two scoped aggregations + a JS product map (no $lookup /
 * $toObjectId / $toDate), so it stays on the indexed `items.product` path.
 */

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || '₹';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function emptyData() {
  return {
    totalSales: { value: `${CURRENCY}0.00`, percentageChange: '0.0', changeType: 'positive' },
    totalOrders: { value: 0, percentageChange: '0.0', changeType: 'positive' },
    sellThrough: { value: '0.0%' },
    weeklySales: { labels: DAYS, data: [0, 0, 0, 0, 0, 0, 0] },
    categorySales: { labels: [], data: [] },
    monthlyRevenue: { labels: [], data: [] },
    topProducts: [],
  };
}

function pctChange(current, previous) {
  if (previous > 0) return ((current - previous) / previous) * 100;
  return current > 0 ? 100 : 0;
}

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
    }

    // Analytics changes slowly — cache the computed result per seller for 5 min.
    // The `v2` prefix retires payloads cached under the old shape (`conversionRate`),
    // which would otherwise be served to the dashboard for up to 5 min after deploy
    // and blow up on the renamed `sellThrough` field.
    const data = await cached(`analytics:v2:${userId}`, 300, () => computeAnalytics(userId));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching seller analytics:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function computeAnalytics(userId) {
  await connectDB();

  // This seller's products: id -> { category, offerPrice, name, image }
  const products = await Product.find({ userId })
    .select('_id name image category offerPrice')
    .lean();

  if (products.length === 0) return emptyData();

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const sellerProductIds = products.map((p) => p._id.toString());
  const priceOf = (id) => productMap.get(id)?.offerPrice || 0;

  // Time windows (orders store `date` as a ms timestamp).
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).getTime();

  // Two SCOPED aggregations in parallel (both filter to this seller's products):
  //  - recentItems: lightweight rows for the last 6 months (time-based metrics)
  //  - allTimeByProduct: per-product totals all-time (category / top / conversion)
  const [recentItems, allTimeByProduct] = await Promise.all([
    Order.aggregate([
      { $match: { date: { $gte: sixMonthsAgo }, 'items.product': { $in: sellerProductIds } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: sellerProductIds } } },
      { $project: { _id: 0, product: '$items.product', quantity: '$items.quantity', date: 1, orderId: '$_id' } },
    ]),
    Order.aggregate([
      { $match: { 'items.product': { $in: sellerProductIds } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $in: sellerProductIds } } },
      { $group: { _id: '$items.product', totalQty: { $sum: '$items.quantity' } } },
    ]),
  ]);

  // --- Time-based metrics (this month / last month / weekly / monthly) ---
  let thisMonthSales = 0;
  let lastMonthSales = 0;
  const thisMonthOrders = new Set();
  const lastMonthOrders = new Set();
  const weekly = [0, 0, 0, 0, 0, 0, 0]; // index 0=Sun ... 6=Sat
  const monthly = {}; // 'YYYY-M' -> revenue

  for (const row of recentItems) {
    const revenue = row.quantity * priceOf(row.product);
    const ts = row.date;
    const d = new Date(ts);

    if (ts >= oneMonthAgo) {
      thisMonthSales += revenue;
      thisMonthOrders.add(String(row.orderId));
    } else if (ts >= twoMonthsAgo) {
      lastMonthSales += revenue;
      lastMonthOrders.add(String(row.orderId));
    }
    if (ts >= sevenDaysAgo) weekly[d.getDay()] += revenue;

    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthly[key] = (monthly[key] || 0) + revenue;
  }

  // Monthly chart: exactly the last 6 months, in order, zero-filled.
  const monthlyRevenue = { labels: [], data: [] };
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyRevenue.labels.push(MONTHS[d.getMonth()]);
    monthlyRevenue.data.push(monthly[`${d.getFullYear()}-${d.getMonth() + 1}`] || 0);
  }

  // --- All-time metrics (category sales / top products / conversion) ---
  const categoryTotals = {};
  let soldProductCount = 0;
  for (const row of allTimeByProduct) {
    const p = productMap.get(String(row._id));
    if (!p) continue; // product deleted; skip
    soldProductCount += 1;
    categoryTotals[p.category] = (categoryTotals[p.category] || 0) + row.totalQty * (p.offerPrice || 0);
  }
  const categoryEntries = Object.entries(categoryTotals);

  const topProducts = [...allTimeByProduct]
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 3)
    .map((row) => {
      const p = productMap.get(String(row._id));
      return p ? { _id: p._id.toString(), name: p.name, image: p.image } : null;
    })
    .filter(Boolean);

  // Share of this seller's catalogue that has ever sold at least one unit.
  // NOT a visitor-conversion rate — the app has no view tracking to divide by.
  const sellThroughValue = (soldProductCount / products.length) * 100;

  const salesChange = pctChange(thisMonthSales, lastMonthSales);
  const ordersChange = pctChange(thisMonthOrders.size, lastMonthOrders.size);

  return {
    totalSales: {
      value: `${CURRENCY}${thisMonthSales.toFixed(2)}`,
      percentageChange: salesChange.toFixed(1),
      changeType: salesChange >= 0 ? 'positive' : 'negative',
    },
    totalOrders: {
      value: thisMonthOrders.size,
      percentageChange: ordersChange.toFixed(1),
      changeType: ordersChange >= 0 ? 'positive' : 'negative',
    },
    // No percentageChange: there is nothing to compare it against, and the card used
    // to render a hardcoded "0% vs last month".
    sellThrough: { value: `${sellThroughValue.toFixed(1)}%` },
    weeklySales: { labels: DAYS, data: weekly },
    categorySales: {
      labels: categoryEntries.map(([category]) => category),
      data: categoryEntries.map(([, total]) => total),
    },
    monthlyRevenue,
    topProducts,
  };
}
