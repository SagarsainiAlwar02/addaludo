const mongoose = require("mongoose");

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
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentSetting", paymentSettingSchema);