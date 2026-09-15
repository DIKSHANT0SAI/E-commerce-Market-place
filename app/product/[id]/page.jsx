import connectDB from "@/config/db";
import ProductModel from "@/models/Product";
import ReviewModel from "@/models/Review";
import ProductClient from "./ProductClient";
import { cache } from "react";

export const revalidate = 60; // Revalidate every 60 seconds

// Server-side fetch for product and review summary.
// cache() dedupes the DB call between generateMetadata and the page render.
const fetchProductAndReview = cache(async (id) => {
  await connectDB();
  const product = await ProductModel.findById(id).lean();
  if (!product) return { product: null, reviewSummary: null };
  // Aggregate review summary
  const summary = await ReviewModel.aggregate([
    { $match: { product: id } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  let reviewSummary = null;
  if (summary.length > 0) {
    reviewSummary = {
      avgRating: Number(summary[0].avgRating.toFixed(2)),
      reviewCount: summary[0].reviewCount,
    };
  }
  // Convert _id to string and ensure plain object
  const plainProduct = {
    ...product,
    _id: product._id.toString(),
  };
  return { product: plainProduct, reviewSummary };
});

export async function generateStaticParams() {
  // Don't fail the build if the DB is unreachable (e.g. in Docker / CI without secrets).
  // Returning [] means product pages are generated on-demand at runtime (ISR via
  // `revalidate`) instead of being pre-rendered — same result, just lazily.
  try {
    await connectDB();
    const products = await ProductModel.find({}, { _id: 1 }).lean();
    return products.map(product => ({ id: product._id.toString() }));
  } catch (e) {
    console.warn("generateStaticParams: DB unavailable at build, skipping prerender:", e?.message || e);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { product } = await fetchProductAndReview(id);
  if (!product) return { title: "Product not found | QuickCart" };
  const description = (product.description || "").slice(0, 160);
  const image = product.image?.[0];
  return {
    title: `${product.name} | QuickCart`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : [],
    },
  };
}

const Product = async ({ params }) => {
  const { id } = await params;
  const { product: productData, reviewSummary } = await fetchProductAndReview(id);
  return <ProductClient productData={productData} reviewSummary={reviewSummary} />;
};

export default Product;
