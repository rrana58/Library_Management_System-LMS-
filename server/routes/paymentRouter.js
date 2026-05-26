import express from "express";
import { createStripeCheckoutSession, verifyStripePayment } from "../controllers/paymentController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-checkout-session", isAuthenticated, createStripeCheckoutSession);
router.post("/verify", isAuthenticated, verifyStripePayment);

export default router;
