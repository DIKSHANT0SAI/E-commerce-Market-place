// components/FullScreenLoader.jsx
import React from "react";

const FullScreenLoader = ({ message = "Placing your order..." }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-700 text-lg">{message}</p>
    </div>
  );
};

export default FullScreenLoader;