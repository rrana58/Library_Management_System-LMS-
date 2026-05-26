import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import Book from "../models/bookModel.js";
import User from "../models/userModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// AI Chatbot logic using Gemini + Rule-based fallback
export const askChatbot = catchAsyncErrors(async (req, res, next) => {
    const { prompt } = req.body;
    const userId = req.user._id;

    if (!prompt) {
        return res.status(400).json({ success: false, message: "Please provide a prompt for the chatbot." });
    }

    const lowerPrompt = prompt.toLowerCase();

    // 0. Greeting
    if (lowerPrompt === "hi" || lowerPrompt === "hello" || lowerPrompt === "hey") {
        return res.status(200).json({
            success: true,
            reply: "Hello! I am your Library Assistant. I can help you check your borrowed books, deadlines, library hours, fine policies, or search for book availability. How can I help you today?"
        });
    }

    // 1. Rule-based: Check for user records (deadlines, borrowed books)
    if (lowerPrompt.includes("my book") || lowerPrompt.includes("deadline") || lowerPrompt.includes("due") || lowerPrompt.includes("borrow")) {
        const user = await User.findById(userId);
        const activeBorrows = user.borrowedBooks.filter(b => !b.returned);
        
        if (activeBorrows.length === 0) {
            return res.status(200).json({
                success: true,
                reply: "You currently do not have any active borrowed books or reservations.",
            });
        }

        let replyMessage = "Here are your active books and their deadlines:\n\n";
        activeBorrows.forEach((b, idx) => {
            const dueDate = new Date(b.dueDate).toLocaleDateString();
            const isOverdue = new Date() > new Date(b.dueDate);
            replyMessage += `${idx + 1}. **${b.bookTitle}** - Due on: ${dueDate} ${isOverdue ? '(OVERDUE)' : ''}\n`;
        });

        return res.status(200).json({
            success: true,
            reply: replyMessage,
        });
    }

    // 2. Rule-based: Library hours
    if (lowerPrompt.includes("hour") || lowerPrompt.includes("time") || lowerPrompt.includes("open")) {
         return res.status(200).json({
             success: true,
             reply: "Our library is open from 8:00 AM to 8:00 PM on weekdays, and 10:00 AM to 4:00 PM on weekends."
         });
    }

    // 3. Rule-based: Fines
    if (lowerPrompt.includes("fine") || lowerPrompt.includes("penalty") || lowerPrompt.includes("fee")) {
        return res.status(200).json({
            success: true,
            reply: "Fines are calculated automatically for every day a book is overdue past its return deadline. You can easily pay any pending fines online via Stripe on your dashboard."
        });
    }

    // 4. Rule-based: Book Availability Search
    const cleanedSearch = lowerPrompt.replace(/\b(is|do|you|have|available|book|books|the|a|an|please|tell|me|about|can|i|get|search|for|find|any|looking|how|what|when|where|why)\b/g, "").trim();

    let foundBooks = false;
    let booksReply = "";

    if (cleanedSearch.length > 2) {
        const keywords = cleanedSearch.split(/\s+/).filter(w => w.length > 2);
        
        if (keywords.length > 0) {
            const regexQueries = keywords.map(kw => ({
                $or: [
                    { title: { $regex: kw, $options: "i" } },
                    { author: { $regex: kw, $options: "i" } },
                    { category: { $regex: kw, $options: "i" } }
                ]
            }));

            const books = await Book.find({ $and: regexQueries }).limit(5);

            if (books.length > 0) {
                foundBooks = true;
                booksReply = "Here is what I found in our catalog:\n\n";
                books.forEach(b => {
                    booksReply += `- **${b.title}** by ${b.author}: ${b.availability ? 'Available (' + b.quantity + ' copies)' : 'Out of Stock'}\n`;
                });
            }
        }
    }

    if (foundBooks) {
        return res.status(200).json({
            success: true,
            reply: booksReply
        });
    }

    // 5. Fallback to Gemini AI if API key is present and looks valid
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 20) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
            console.error("Gemini API Error:", error.message);
            // Do not throw 500, fallthrough to default rule-based response
        }
    }

    // 6. Default response if no API key, invalid API key, or Gemini fails
    return res.status(200).json({
        success: true,
        reply: "I am your Library Assistant. I can help you check your borrowed books, deadlines, library hours, fine policies, or search for book availability. Could you please rephrase your question?"
    });
});
