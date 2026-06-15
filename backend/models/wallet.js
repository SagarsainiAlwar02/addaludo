const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },

  balance: {
    type: Number,
    default: 0,
    min: 0
  },

 bonus: {
  type: Number,
  default: 0,
  min: 0,
},

winnings: {
  type: Number,
  default: 0,
  min: 0,
},
 
referralBalance: {
  type: Number,
  default: 0,
  min: 0,
},

 locked: {
  type: Number,
  default: 0,
  min: 0,
}

}, { timestamps: true });

module.exports = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);