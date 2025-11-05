import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js";
import { generateVoucherCode } from "../utils/generateVoucherCode.js";

export const placeOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { items } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "No items provided" });
    }

    let orderItems = [];
    let totalDeducted = 0;
    let successCount = 0;

    for (const item of items) {
      const voucher = await Voucher.findById(item.voucherId);
      if (!voucher) {
        orderItems.push({ ...item, status: "FAILED", voucherName: "Unknown" });
        continue;
      }

      const totalPrice = voucher.price * (item.quantity || 1);

      // Check expiry, stock, and balance
      if (
        voucher.stock >= (item.quantity || 1) &&
        new Date(voucher.expiryDate) > new Date() &&
        user.walletBalance >= totalPrice
      ) {
        const code = generateVoucherCode();
        user.walletBalance -= totalPrice;

        // ✅ Clamp balance immediately (important)
        if (user.walletBalance < 0) user.walletBalance = 0;

        voucher.stock -= item.quantity || 1;
        await voucher.save();

        orderItems.push({
          voucherId: voucher._id,
          voucherName: voucher.name,
          price: voucher.price,
          code,
          status: "SUCCESS",
        });

        totalDeducted += totalPrice;
        successCount++;

        // Record purchase transaction
        await Transaction.create({
          userId: user._id,
          type: "PURCHASE",
          amount: totalPrice,
          description: `Purchased ${voucher.name}`,
        });
      } else {
        orderItems.push({
          voucherId: voucher._id,
          voucherName: voucher.name,
          price: voucher.price,
          code: null,
          status: "FAILED",
        });
      }
    }

    // ✅ Enforce DB update with correct clamped value
    await User.updateOne(
      { _id: user._id },
      { $set: { walletBalance: Math.max(user.walletBalance, 0) } }
    );

    // Fetch the fresh user from DB (ensures correct data returned)
    const updatedUser = await User.findById(user._id);

    const orderStatus =
      successCount === 0
        ? "FAILED"
        : successCount === items.length
        ? "SUCCESS"
        : "PARTIAL";

    const order = await Order.create({
      userId: user._id,
      items: orderItems,
      totalAmount: totalDeducted,
      status: orderStatus,
    });

    res.json({
      message: "Order placed",
      order,
      walletBalance: updatedUser.walletBalance, // ✅ fresh from DB
    });
  } catch (err) {
    console.error("❌ placeOrder error:", err);
    res.status(500).json({ error: err.message });
  }
};


// Get all orders for user
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
