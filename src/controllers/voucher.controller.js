import Voucher from "../models/voucher.model.js";

// Create new voucher (Admin or manual use)
export const createVoucher = async (req, res) => {
  try {
    const { name, price, stock, expiryDate } = req.body;
    console.log(req.body);
    if (!name || !price || stock === undefined || !expiryDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const voucher = await Voucher.create({ name, price, stock, expiryDate });
    res.status(201).json({ message: "Voucher created successfully", voucher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all available vouchers
export const getAvailableVouchers = async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      stock: { $gt: 0 },
      expiryDate: { $gt: now },
    }).sort({ createdAt: -1 });

    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Optional: Get single voucher details
export const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
