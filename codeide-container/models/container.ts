import mongoose from "mongoose";

const containerSchema = new mongoose.Schema({
  containers: [
    {
      containerId: { type: String, required: true },
      backendContainerId: { type: String, required: true },
      name: { type: String, required: true, unique: true },
    },
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  numberOfContainers: {
    type: Number,
    default: 0,
    required: true,
  },
  maximumContainers: { type: Number, default: 5, required: true },
});

export const Container = mongoose.models?.Container || mongoose.model("Container", containerSchema);
