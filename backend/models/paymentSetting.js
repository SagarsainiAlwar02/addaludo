import mongoose from "mongoose";

const paymentSettingSchema = new mongoose.Schema(
  {
    scanner: {
      image: {
        type: String,
        default: "",
      },
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 2000,
      },
      active: {
        type: Boolean,
        default: true,
      },
    },

    upiList: {
      type: [String],
      default: [],
    },

    upiLimit: {
      min: {
        type: Number,
        default: 2000,
      },
      max: {
        type: Number,
        default: 100000,
      },
    },

    bank: {
      name: {
        type: String,
        default: "",
      },
      accountNumber: {
        type: String,
        default: "",
      },
      ifsc: {
        type: String,
        default: "",
      },
      active: {
        type: Boolean,
        default: true,
      },
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentSetting || mongoose.model("PaymentSetting", paymentSettingSchema);
