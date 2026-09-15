import React from 'react';

const OrderCardSkeleton = () => (
  <div className="border rounded-lg p-4 mb-4 bg-white shadow animate-pulse">
    <div className="flex justify-between items-center mb-2">
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
    </div>
    <div className="h-3 w-1/2 bg-gray-100 rounded mb-2" />
    <div className="flex gap-2 mb-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 w-12 bg-gray-200 rounded" />
      ))}
    </div>
    <div className="flex justify-between items-center mt-2">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>
  </div>
);

export default OrderCardSkeleton; 