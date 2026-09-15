import React from 'react';

const ProductCardSkeleton = () => (
  <div className="flex flex-col items-start gap-1 w-full animate-pulse">
    <div className="relative bg-gray-200 rounded-lg w-full h-48 sm:h-52 flex items-center justify-center overflow-hidden">
      <div className="w-4/5 h-4/5 sm:w-full sm:h-full bg-gray-300 rounded" />
      <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 rounded-full" />
    </div>
    <div className="w-full space-y-1 mt-2">
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="flex items-center gap-2 mt-1">
        <div className="h-4 w-12 bg-gray-300 rounded" />
        <div className="h-4 w-8 bg-gray-200 rounded" />
      </div>
      <div className="flex items-end justify-between w-full pt-1">
        <div className="h-4 w-16 bg-gray-300 rounded" />
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton; 