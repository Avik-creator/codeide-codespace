import mongoose from "mongoose";

const containerSchema = new mongoose.Schema({
  containerId: { type: String, required: true },
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

export const Container = mongoose.models?.Container || mongoose.model("Container", containerSchema);
