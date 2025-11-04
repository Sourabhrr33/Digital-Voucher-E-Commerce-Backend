import express from "express";
import { createVoucher, getAvailableVouchers, getVoucherById } from "../controllers/voucher.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// For simplicity, assume all logged-in users can create vouchers (for testing)
router.post("/", authMiddleware, createVoucher);
router.get("/", authMiddleware, getAvailableVouchers);
router.get("/:id", authMiddleware, getVoucherById);

export default router;
