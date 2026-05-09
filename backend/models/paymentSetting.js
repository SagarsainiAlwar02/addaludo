const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema(
  {
    // ================= SCANNER PAYMENT =================
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

    // ================= MULTIPLE UPI IDS =================
    upiList: [
      {
        type: String,
        trim: true,
      },
    ],

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

    // ================= BANK DETAILS =================
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

    // ================= GENERAL =================
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentSetting ||
  mongoose.model("PaymentSetting", paymentSettingSchema);