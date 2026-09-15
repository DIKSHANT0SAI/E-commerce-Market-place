import mongoose from "mongoose";

// A short-lived record of a priced cart, created when a Razorpay order is opened.
// `verify` reads the cart/amount from HERE (server-side) instead of trusting the
// client, so the cart can't be swapped between create-order and verify.
const paymentIntentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  items: [
    {
      product: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  address: { type: String, required: true },
  amount: { type: Number, required: true }, // the amount actually charged (₹)
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // auto-expire after 1h
});

export default mongoose.models.paymentIntent || mongoose.model("paymentIntent", paymentIntentSchema);
