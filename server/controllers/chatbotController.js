import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import Book from "../models/bookModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// AI Chatbot logic using Gemini
export const askChatbot = catchAsyncErrors(async (req, res, next) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ success: false, message: "Please provide a prompt for the chatbot." });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: "Gemini API key is not configured." });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Optional: Fetch some context from the database if needed
        // For example, recently added books
        const recentBooks = await Book.find().sort({ createdAt: -1 }).limit(5).select("title author");
        const bookContext = recentBooks.length > 0 
            ? `Our latest additions include: ${recentBooks.map(b => `${b.title} by ${b.author}`).join(", ")}.`
            : "We are currently updating our catalog.";

        const systemPrompt = `
            You are a helpful and professional Library Assistant for our Library Management System.
            Your goal is to assist users with their questions about the library, books, hours, and policies.
            
            Library Information:
            - Hours: 8:00 AM to 8:00 PM (Weekdays), 10:00 AM to 4:00 PM (Weekends).
            - Policies: Renew books before they are due to avoid fines. Fines are calculated based on days overdue.
            - Context: ${bookContext}
            
            Please provide concise, friendly, and accurate information. If you don't know the answer, suggest they contact the librarian.
        `;

        const fullPrompt = `${systemPrompt}\n\nUser Question: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const reply = result.response.text();

        return res.status(200).json({
            success: true,
            reply: reply.trim(),
        });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while communicating with the AI. Please try again later.",
            error: error.message
        });
    }
});
