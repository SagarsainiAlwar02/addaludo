const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 100,
      max: 100000,
    },

    paymentMethod: {
      type: String,
      enum: ["qr", "upi_bank"],
      required: true,
      index: true,
    },

   utr: {
  type: String,
  required: true,
  trim: true,
  unique: true,
  index: true,
  minlength: 6,
  maxlength: 50,
},

   screenshot: {
  type: String,
  required: true,
  trim: true,
},

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

   adminNote: {
  type: String,
  default: "",
  maxlength: 500,
},

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


depositSchema.index({
  userId: 1,
  status: 1,
});

depositSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports =
  mongoose.models.Deposit || mongoose.model("Deposit", depositSchema);