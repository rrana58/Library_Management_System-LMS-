import express from "express";
import { askChatbot } from "../controllers/chatbotController.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/ask", isAuthenticated, askChatbot);

export default router;
