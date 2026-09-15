import React from 'react';

const SellerProductTableSkeleton = () => {
  // Generate 6 skeleton rows
  const skeletonRows = Array.from({ length: 6 }, (_, index) => (
    <tr key={index} className="animate-pulse">
      <td className="p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {/* Product Image Skeleton */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-md"></div>
          {/* Product Name Skeleton */}
          <div className="h-4 bg-gray-200 rounded w-32 sm:w-40"></div>
        </div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="flex items-center gap-2">
          {/* Status Toggle Skeleton */}
          <div className="w-11 h-6 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </td>
      <td className="hidden sm:table-cell p-2 sm:p-3">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="p-2 sm:p-3 text-center">
        <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto"></div>
      </td>
    </tr>
  ));

  return (
    <div className="w-full min-h-screen">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Page Header Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 mt-4 sm:mt-0"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
            
            {/* Table Skeleton */}
            <div className="overflow-x-auto sm:overflow-visible">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Price</th>
                    <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Units Sold</th>
                    <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="hidden sm:table-cell p-2 sm:p-3 text-left font-semibold text-gray-700">Last Updated</th>
                    <th className="p-2 sm:p-3 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {skeletonRows}
                </tbody>
              </table>
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-between items-center mt-6">
              <div className="h-9 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-9 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProductTableSkeleton; 