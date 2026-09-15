import React, { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import axios from "axios";

// Size each batch to roughly one screenful of the product grid (columns × visible rows)
// instead of a fixed count. Columns and card height vary by breakpoint, so we estimate.
const MIN_PAGE_SIZE = 8;
const getViewportPageSize = () => {
  if (typeof window === "undefined") return MIN_PAGE_SIZE;
  const w = window.innerWidth;
  const columns = w >= 1280 ? 5 : w >= 1024 ? 4 : w >= 768 ? 3 : 2; // matches the grid classes
  const rowHeight = w >= 768 ? 340 : 300; // approx product-card height incl. grid gap
  const rows = Math.max(2, Math.ceil(window.innerHeight / rowHeight));
  return Math.max(MIN_PAGE_SIZE, columns * rows);
};

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reviewSummaries, setReviewSummaries] = useState({});
  const [pageSize, setPageSize] = useState(null); // one screenful, computed on mount
  const observer = useRef();
  const sentinelRef = useRef();
  // Fetch products
  const fetchProducts = async (pageNum = 1, limit = MIN_PAGE_SIZE) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/product/list?page=${pageNum}&limit=${limit}`);
      if (data.success) {
        if (pageNum === 1) {
          setProducts(data.products);
        } else {
          setProducts((prev) => [...prev, ...data.products]);
        }
        setHasMore(data.hasMore);

        const productIds = data.products.map((p) => p._id);
        if (productIds.length > 0) {
          const { data: reviewData } = await axios.post("/api/review/summary", { productIds });
          if (reviewData.success) {
            setReviewSummaries((prev) => ({ ...prev, ...reviewData.summary }));
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  // Decide the batch size from the viewport once, on mount.
  useEffect(() => {
    setPageSize(getViewportPageSize());
  }, []);

  // Initial fetch once the batch size is known.
  useEffect(() => {
    if (pageSize) {
      fetchProducts(1, pageSize);
    }
  }, [pageSize]);


  // Infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });

    observer.current.observe(currentSentinel);
    return () => observer.current && observer.current.disconnect();
  }, [loading, hasMore, products]);

  // Fetch next page on scroll
  useEffect(() => {
    if (page === 1) return;
    fetchProducts(page, pageSize);
  }, [page]);

  // Show skeletons on initial load
  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center pt-14">
        <p className="text-2xl font-medium text-left w-full">Popular products</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
          {Array.from({ length: pageSize || MIN_PAGE_SIZE }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // No products state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center pt-14">
        <p className="text-2xl font-medium text-left w-full">Popular products</p>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">No products available</p>
        </div>
      </div>
    );
  }

  // Render products
  return (
    <div className="flex flex-col items-center pt-14">
      <p className="text-2xl font-medium text-left w-full">Popular products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
        {products.map((product, index) => (
          <div key={product._id || index}>
            <ProductCard product={product} reviewSummary={reviewSummaries[product._id]} />
          </div>
        ))}
        {loading && products.length > 0 &&
          Array.from({ length: pageSize || MIN_PAGE_SIZE }).map((_, i) => (
            <ProductCardSkeleton key={`loadmore-${i}`} />
          ))}
      </div>
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!hasMore && <p className="text-gray-400 mt-4">No more products to load.</p>}
    </div>
  );
};

export default HomeProducts;

