import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: {
    type: String, // Changed to String to match Order model
    required: true,
  },
  userId: { // Changed to userId to match Order model
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String], // Array of image URLs
    default: [],
  },
}, { timestamps: true });

// Ensure a user can only review a product once
reviewSchema.index({ product: 1, userId: 1 }, { unique: true });
// Support listing a product's reviews newest-first without an in-memory sort
reviewSchema.index({ product: 1, createdAt: -1 });

export default mongoose.models.ReviewNew || mongoose.model('ReviewNew', reviewSchema); 