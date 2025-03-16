const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  total_transactions: { type: Number, default: 0 },
  total_investment: { type: Number, default: 0 },
  total_profit: { type: Number, default: 0 },
  total_withdrawal: { type: Number, default: 0 }, // Kept only one instance
  total_pending_withdrawal: { type: Number, default: 0 }, // Kept only one instance
  recent_transactions_ammount: { type: Number, default: 0 }, // Kept only one instance
  total_referral_bonus: { type: Number, default: 0 },
  total_referral_earning: { type: Number, default: 0 },
  total_earning: { type: Number, default: 0 },
  total_deposit: { type: Number, default: 0 },
  googleId: { type: String, required: false }, // Optional until Google OAuth is fully configured
  payment: {
    paymentMethod: { type: String, default: "None" },
    total_payments: { type: Number, default: 0 },
  },
});

module.exports = mongoose.model("User", userSchema);
