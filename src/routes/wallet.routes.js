import express from "express";
import { getWalletInfo, topUpWallet } from "../controllers/wallet.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getWalletInfo);
router.post("/topup", authMiddleware, topUpWallet);

export default router;
