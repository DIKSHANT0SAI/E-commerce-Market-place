import React from 'react';

const SellerDashboardSkeleton = () => {
  return (
    <div className="bg-gray-50/50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Title Skeleton */}
        <div className="h-10 bg-gray-200 rounded w-96 mb-8 animate-pulse" style={{ maxWidth: 480 }}></div>

        {/* Stat Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="w-full bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-start gap-4 animate-pulse">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="flex flex-col flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="flex items-center mt-1 gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-10"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Weekly Sales Chart Skeleton */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
              <div className="h-[300px] w-full bg-gray-200 rounded"></div>
            </div>
          </div>
          {/* Category Sales Chart Skeleton */}
          <div className="lg:col-span-1 w-full">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full flex flex-col items-center animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-56 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-40 mb-6"></div>
              {/* Donut chart skeleton */}
              <div className="w-48 h-48 bg-gray-200 rounded-full mb-2"></div>
              {/* Legend skeleton */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Revenue and Top Products Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Monthly Revenue Chart Skeleton */}
          <div className="lg:col-span-2 w-full">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-56 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
              <div className="h-[300px] w-full bg-gray-200 rounded"></div>
            </div>
          </div>
          {/* Top Products Card Skeleton */}
          <div className="lg:col-span-1 w-full">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
              {/* Top Products List Skeleton */}
              <div className="flex-grow my-4 space-y-4 w-full">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0"></div>
                    <div className="h-4 bg-gray-200 rounded w-40 flex-1"></div>
                  </div>
                ))}
              </div>
              {/* View All Products Button Skeleton */}
              <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardSkeleton; 