import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NotPurchasedPage = () => {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Action Not Allowed</h1>
        <p className="text-lg text-gray-600 mb-8">
          Sorry, you must purchase a product before you can leave a review.
        </p>
        <Link href="/all-products" legacyBehavior>
          <a className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors">
            Continue Shopping
          </a>
        </Link>
      </div>
      <Footer />
    </>
  );
};

export default NotPurchasedPage; 