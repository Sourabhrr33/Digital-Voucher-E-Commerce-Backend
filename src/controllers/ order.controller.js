import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js";
import { generateVoucherCode } from "../utils/generateVoucherCode.js";

export const placeOrder = async (req, res) => {
  try {
    const user = req.user;
    const { items } = req.body; // Array of { voucherId, quantity }

    if (!items || !Array.isArray(items) || items.length === 0) {
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
        voucher.stock -= item.quantity || 1;
        await voucher.save();

        orderItems.push({
          voucherId: voucher._id,
          voucherName: voucher.name,
          price: voucher.price,
          code,
          status: "SUCCESS",
        });

        successCount++;
        totalDeducted += totalPrice;

        // Record purchase transaction
        await Transaction.create({
          userId: user._id,
          type: "PURCHASE",
          amount: totalPrice,
          description: `Purchased ${voucher.name} x${item.quantity || 1}`,
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

    // Save updated balance
    await user.save();

    // Determine order status
    let orderStatus = "FAILED";
    if (successCount === items.length) orderStatus = "SUCCESS";
    else if (successCount > 0) orderStatus = "PARTIAL";

    // Create Order
    const order = await Order.create({
      userId: user._id,
      items: orderItems,
      totalAmount: totalDeducted,
      status: orderStatus,
    });


// Handle refund only for partial success (not total failure)
if (orderStatus === "PARTIAL" && totalDeducted > 0) {
  const refundAmount = orderItems
    .filter((o) => o.status === "FAILED")
    .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  // 🧩 Cap refund so we never exceed what was actually deducted
  const refundable = Math.min(refundAmount, totalDeducted);

  if (refundable > 0) {
    user.walletBalance += refundable;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: "REFUND",
      amount: refundable,
      description: "Refund for failed items in order",
    });
  }
}



    res.json({ message: "Order placed", order });
  } catch (err) {
    console.error(err);
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
