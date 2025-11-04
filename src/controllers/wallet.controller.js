import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";

// Get wallet balance and transaction history
export const getWalletInfo = async (req, res) => {
  try {
    const user = req.user;
    const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json({
      balance: user.walletBalance,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Top up wallet
export const topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = req.user;
    user.walletBalance += amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "TOPUP",
      amount,
      description: `Wallet top-up of ₹${amount}`,
    });

    res.json({ message: "Wallet topped up successfully", balance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
