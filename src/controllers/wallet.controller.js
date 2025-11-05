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
    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid amount" });

    // Always fetch latest clean user data
    const user = await User.findById(req.user._id);

    // ✅ Never add to negative balance — reset to 0 if needed
    const baseBalance = user.walletBalance < 0 ? 0 : user.walletBalance;
    const newBalance = baseBalance + amount;

    await User.updateOne(
      { _id: user._id },
      { $set: { walletBalance: newBalance } }
    );

    await Transaction.create({
      userId: user._id,
      type: "TOPUP",
      amount,
      description: `Wallet top-up of ₹${amount}`,
    });

    const updatedUser = await User.findById(user._id);

    res.json({
      message: "Wallet topped up successfully",
      balance: updatedUser.walletBalance,
    });
  } catch (err) {
    console.error("topUpWallet error:", err);
    res.status(500).json({ error: err.message });
  }
};



