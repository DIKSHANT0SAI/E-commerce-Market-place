'use client';
import React, { useState, useEffect } from 'react';
import { assets } from '@/assets/assets';
import Image from 'next/image';

const UpdateProductModal = ({ product, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    offerPrice: '',
    category: '',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const categories = [
    "Earphone", "Headphone", "Watch", "Smartphone", 
    "Laptop", "Camera", "Accessories"
  ];

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        offerPrice: product.offerPrice || '',
        category: product.category || '',
      });
      // Note: We don't preset image files, the user must select new ones.
    }
  }, [product]);

  if (!product) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, index) => {
    const updatedFiles = [...imageFiles];
    if (e.target.files[0]) {
      updatedFiles[index] = e.target.files[0];
      setImageFiles(updatedFiles);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(product._id, formData, imageFiles);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Update Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Images</label>
            <p className="text-xs text-gray-500 mb-2">Select new images to replace the old ones.</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {[...Array(4)].map((_, index) => (
                <label key={index} htmlFor={`update-image-${index}`} className="w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover:border-orange-400">
                  <input
                    onChange={(e) => handleFileChange(e, index)}
                    type="file"
                    id={`update-image-${index}`}
                    hidden
                  />
                  <Image
                    src={imageFiles[index] ? URL.createObjectURL(imageFiles[index]) : (product.image[index] || assets.upload_area)}
                    alt="Upload"
                    width={80}
                    height={80}
                    className="object-cover rounded-md"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Product Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
              <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
            </div>
            <div>
              <label htmlFor="offerPrice" className="block text-sm font-medium text-gray-700">Offer Price</label>
              <input type="number" name="offerPrice" id="offerPrice" value={formData.offerPrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"/>
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            <select 
              name="category" 
              id="category" 
              value={formData.category} 
              onChange={handleChange} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProductModal;
