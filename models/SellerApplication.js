import mongoose from "mongoose";

// A user's request to become a seller. Reviewed by an admin who approves (which grants
// the Clerk `role: 'seller'`) or rejects with a reason.
const sellerApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "user" },
  name: { type: String, default: "" },          // applicant name (denormalized from Clerk)
  email: { type: String, default: "" },         // applicant email (denormalized from Clerk)
  storeName: { type: String, required: true },
  phone: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  rejectionReason: { type: String, default: "" },
  reviewedBy: { type: String, default: "" },     // admin userId who actioned it
  reviewedAt: { type: Number, default: null },
  createdAt: { type: Number, default: Date.now },
});

// At most ONE pending application per user (atomic — a double-submit can't create two).
// Partial filter means approved/rejected rows don't count, so a rejected user can re-apply.
sellerApplicationSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
// Admin list: newest first.
sellerApplicationSchema.index({ createdAt: -1 });

const SellerApplication =
  mongoose.models.sellerApplication ||
  mongoose.model("sellerApplication", sellerApplicationSchema);
export default SellerApplication;
