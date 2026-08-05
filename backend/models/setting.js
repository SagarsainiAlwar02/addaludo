import mongoose from "mongoose";

/**
 * setting.js
 * Single-document website settings (website name, support number, etc).
 */
const settingSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      default: "",
    },
    supportNumber: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model("Setting", settingSchema);
