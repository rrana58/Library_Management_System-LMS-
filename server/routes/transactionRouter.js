import express from "express";
import { getAllTransactions } from "../controllers/transactionController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/all", isAuthenticated, isAuthorized("Admin"), getAllTransactions);

export default router;
