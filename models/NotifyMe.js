import mongoose from "mongoose";

const notifyMeSchema = new mongoose.Schema({
  userId: { type: String, required: true },      // Clerk user ID
  productId: { type: String, required: true },   // Product ID
  notified: { type: Boolean, default: false },   // Whether the user has been notified
  createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate requests for the same user/product
notifyMeSchema.index({ userId: 1, productId: 1 }, { unique: true });

const NotifyMe = mongoose.models.NotifyMe || mongoose.model("NotifyMe", notifyMeSchema);
export default NotifyMe; 