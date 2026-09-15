'use client';
import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';

const starLabels = ["Very Bad", "Bad", "Average", "Good", "Very Good"];

const RateProductForm = ({ productId, onReviewSubmitted }) => {
  const { getToken } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (description.trim() === '') {
      toast.error("Please write a description for your review.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = await getToken();
      
      // Create FormData for image uploads
      const formData = new FormData();
      formData.append('product', productId);
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('description', description);

      // Add image files to FormData
      for (let i = 0; i < files.length; i++) {
        if (files[i]) {
          formData.append('images', files[i]);
        }
      }
      
      const { data } = await axios.post('/api/review/add', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.success) {
        toast.success("Review submitted successfully!");
        onReviewSubmitted(data.review); // Pass the new review up to the parent
        // Reset form
        setRating(0);
        setTitle('');
        setDescription('');
        setFiles([]);
      } else {
        toast.error(data.message || "Failed to submit review.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-xl font-semibold mb-4">Rate this product</h3>
      <div className="flex items-center mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className="text-3xl cursor-pointer"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            {star <= (hoverRating || rating) ? '★' : '☆'}
          </span>
        ))}
        <span className="ml-4 text-gray-600 font-medium">
          {rating > 0 && starLabels[rating - 1]}
        </span>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="Describe your experience..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="4"
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Add Images (optional)</p>
        <div className="flex flex-wrap items-center gap-3">
          {[...Array(5)].map((_, index) => (
            <label key={index} htmlFor={`review-image${index}`}>
              <input
                onChange={(e) => {
                  const updatedFiles = [...files];
                  updatedFiles[index] = e.target.files[0];
                  setFiles(updatedFiles);
                }}
                type="file"
                id={`review-image${index}`}
                accept="image/*"
                hidden
              />
              <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200">
                {files[index] ? (
                  <Image
                    src={URL.createObjectURL(files[index])}
                    alt={`Preview ${index + 1}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <span className="text-3xl text-gray-400">+</span>
                )}
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">You can upload up to 5 images.</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full md:w-auto px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-400"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default RateProductForm; 