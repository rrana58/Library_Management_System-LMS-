import express from "express";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controllers/paymentController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/initiate", isAuthenticated, initiateKhaltiPayment);
router.post("/verify", isAuthenticated, verifyKhaltiPayment);

export default router;
