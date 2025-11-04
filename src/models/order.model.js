import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher" },
      voucherName: String,
      price: Number,
      code: String, // Generated only if success
      status: { type: String, enum: ["SUCCESS", "FAILED"], default: "FAILED" }
    }
  ],
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ["SUCCESS", "PARTIAL", "FAILED"], default: "FAILED" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", orderSchema);
