// components/PaymentErrorScreen.jsx
// Full-screen error shown when an online payment fails. It does NOT navigate away —
// the user stays on the cart so they can simply try again.
import React from "react";

const PaymentErrorScreen = ({
  message = "Internal error occurred. Please try again.",
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center space-y-5 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Payment Failed</h2>
      <p className="text-gray-600 max-w-sm">{message}</p>
      <button
        onClick={onRetry}
        className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded"
      >
        Try Again
      </button>
    </div>
  );
};

export default PaymentErrorScreen;
