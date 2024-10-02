import mongoose from "mongoose";

const containerSchema = new mongoose.Schema({
  containers: [
    {
      containerId: { type: String, required: true },
      name: { type: String, required: true, unique: true },
      port: { type: Number, required: true },
    },
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  numberOfContainers: {
    type: Number,
    default: 0,
    required: true,
    max: 5,
    validate: {
      validator: function (value: number) {
        return value <= 5;
      },
      message: "Value cannot exceed 5",
    },
  },
});

export const Container = mongoose.models?.Container || mongoose.model("Container", containerSchema);
