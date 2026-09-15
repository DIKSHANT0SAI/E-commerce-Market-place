import React from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { useRouter } from 'next/navigation';

/**
 * TopProductsCard component
 * 
 * Renders a card that displays a list of the top-selling products.
 * It shows the product image and name, and includes a button to view all products.
 * Handles cases where product images might be missing.
 * 
 * @param {Array<object>} topProducts - An array of top product objects.
 * @param {string} topProducts[].image - The URL for the product image.
 * @param {string} topProducts[].name - The name of the product.
 * @param {string} topProducts[]._id - The unique ID of the product.
 */
const TopProductsCard = React.memo(({ topProducts }) => {
  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Top Products</h3>
      <p className="text-sm text-gray-500 mb-4">Overview of your best-selling items.</p>
      
      {/* List of top products */}
      <div className="flex-grow my-4 space-y-3">
        {topProducts && topProducts.length > 0 ? (
          topProducts.map((product) => (
            <div key={product._id} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                <Image
                  // Safely access the image, falling back to a placeholder if it's missing or invalid.
                  src={product.image && product.image.length > 0 && product.image[0] ? product.image[0] : assets.product_list_icon}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-medium text-gray-700">{product.name}</p>
            </div>
          ))
        ) : (
          // Fallback message when there are no top products to show.
          <div className="flex-grow flex items-center justify-center text-sm text-gray-400">
            No product sales data yet.
          </div>
        )}
      </div>

      {/* Button to navigate to the full product list */}
      <button
        onClick={() => router.push('/seller/product-list')}
        className="w-full text-center py-2 px-4 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition mt-4"
      >
        View All Products
      </button>
    </div>
  );
});

// Add display name for better debugging
TopProductsCard.displayName = 'TopProductsCard';

export default TopProductsCard; 