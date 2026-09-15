import React from 'react';

const AddProductSkeleton = () => {
  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <div className="md:p-10 p-4 space-y-5 max-w-lg">
        {/* Product Image Section Skeleton */}
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="w-24 h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Product Name Input Skeleton */}
        <div className="flex flex-col gap-1 max-w-md">
          <div className="h-5 bg-gray-200 rounded w-28 mb-2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Product Description Section Skeleton */}
        <div className="flex flex-col gap-1 max-w-md">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 bg-gray-200 rounded w-36 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Category, Price, Offer Price Section Skeleton */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <div className="h-5 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="flex flex-col gap-1 w-32">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="flex flex-col gap-1 w-32">
            <div className="h-5 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    </div>
  );
};

export default AddProductSkeleton; 