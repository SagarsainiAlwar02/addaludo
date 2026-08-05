import mongoose from "mongoose";

const trackedAccountSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.TrackedAccount || mongoose.model("TrackedAccount", trackedAccountSchema);