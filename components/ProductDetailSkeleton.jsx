import React from 'react';

const ProductDetailSkeleton = () => (
  <div className="px-6 md:px-16 lg:px-32 pt-14 space-y-10 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
      {/* Left: Images */}
      <div className="px-5 lg:px-16 xl:px-20">
        <div className="rounded-lg overflow-hidden bg-gray-200 mb-4 w-full h-80" />
        <div className="grid grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-gray-200 h-20 w-full" />
          ))}
        </div>
      </div>
      {/* Right: Details */}
      <div className="flex flex-col gap-4">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-24 bg-gray-100 rounded w-full mt-4" />
        <div className="flex gap-4 mt-6">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton; 