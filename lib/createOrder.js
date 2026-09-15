import connectDB from "@/config/db";
import { inngest } from "@/config/inngest";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { User } from "@/models/user";
import { cartTotal } from "@/lib/pricing";

// Price a cart from SERVER-SIDE prices (source of truth — never trust client amounts).
// Returns { ok:true, amount } or { ok:false, deletedProducts }.
//
// `status: 'active'` is part of the query, not just the UI. The product page hides the
// Add-to-Cart button for a deactivated listing, but that is a browser-side courtesy —
// an item already sitting in a cart when the seller deactivates it, or a direct API
// call, would otherwise still check out. Availability has to be enforced where the
// price is, for the same reason the price itself is never taken from the client.
async function priceCart(items) {
  await connectDB();
  const productIds = items.map((it) => it.product);
  const products = await Product.find({ _id: { $in: productIds }, status: "active" })
    .select("offerPrice")
    .lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  // Unavailable = deleted OR deactivated by the seller. The field keeps its original
  // name because the client already handles it (removes them from the cart + toasts).
  const deletedProducts = items.map((it) => it.product).filter((id) => !productMap.has(String(id)));
  if (deletedProducts.length > 0) return { ok: false, deletedProducts };

  const subtotal = items.reduce(
    (acc, it) => acc + productMap.get(String(it.product)).offerPrice * it.quantity,
    0
  );
  const amount = cartTotal(subtotal); // adds tax + shipping (shared pricing rule)
  return { ok: true, amount };
}

// Compute a cart's total without creating an order (used to size the Razorpay order).
export async function computeCartAmount(items) {
  const r = await priceCart(items);
  if (!r.ok) {
    return { ok: false, status: 400, message: "Some products are no longer available", deletedProducts: r.deletedProducts };
  }
  return { ok: true, amount: r.amount };
}

// Create an order (used by both COD checkout and verified online payments).
// `payment` = { method, status, paymentId, razorpayOrderId }.
export async function createOrderForUser({ userId, address, items, payment = {}, lockedAmount = null, idempotencyKey = "" }) {
  await connectDB();

  // Idempotency: online orders dedupe by Razorpay order id (replayed verify calls);
  // COD orders dedupe by the client-supplied key (double-click / retry on Place Order).
  const dedupeQuery = payment.razorpayOrderId
    ? { razorpayOrderId: payment.razorpayOrderId }
    : idempotencyKey
    ? { idempotencyKey }
    : null;
  if (dedupeQuery) {
    const existing = await Order.findOne(dedupeQuery);
    if (existing) return { ok: true, order: existing, amount: existing.amount, duplicate: true };
  }

  // For online payments the amount is LOCKED at create-order time (exactly what was
  // charged); for COD it's computed fresh from server-side prices.
  let amount;
  if (lockedAmount != null) {
    amount = lockedAmount;
  } else {
    const r = await priceCart(items);
    if (!r.ok) {
      return { ok: false, status: 400, message: "Some products are no longer available", deletedProducts: r.deletedProducts };
    }
    amount = r.amount;
  }

  const date = Date.now();
  let order;
  try {
    order = await Order.create({
      userId,
      items: items.map((it) => ({ product: it.product, quantity: it.quantity })),
      amount,
      address,
      date,
      paymentMethod: payment.method || "COD",
      paymentStatus: payment.status || "Pending",
      paymentId: payment.paymentId || "",
      razorpayOrderId: payment.razorpayOrderId || "",
      idempotencyKey: idempotencyKey || "",
    });
  } catch (err) {
    // Concurrent/replayed request: a unique index (razorpayOrderId or idempotencyKey)
    // rejected the duplicate — return the order that won the race (atomic idempotency).
    if (err?.code === 11000 && dedupeQuery) {
      const existing = await Order.findOne(dedupeQuery);
      if (existing) return { ok: true, order: existing, amount: existing.amount, duplicate: true };
    }
    throw err;
  }

  // Post-write side effects are NON-CRITICAL and must never fail an order that's
  // already persisted — otherwise a flaky email/cart-clear turns a placed order into a
  // "Something went wrong" for the user (who may then retry needlessly).
  try {
    // Confirmation email → async via Inngest.
    await inngest.send({ name: "order.confirmation", data: { userId, address, items, amount, date } });
  } catch (e) {
    console.error("order.confirmation enqueue failed (order still placed):", e?.message || e);
  }
  try {
    // Clear the user's cart.
    await User.updateOne({ _id: userId }, { $set: { cartItems: {} } });
  } catch (e) {
    console.error("cart clear failed (order still placed):", e?.message || e);
  }

  return { ok: true, order, amount };
}
