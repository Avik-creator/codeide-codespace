import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true, enum: ["pending", "completed", "failed"] },
  planName: { type: String, required: true },
  containerLimit: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Payment = mongoose.models?.Payment || mongoose.model("Payment", paymentSchema);
