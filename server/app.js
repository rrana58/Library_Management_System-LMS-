import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileupload from "express-fileupload";

import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";
import authRouter from "./routes/authRouter.js";
import bookRouter from "./routes/bookRouter.js";
import borrowRouter from "./routes/borrowRouter.js";
import userRouter from "./routes/userRouter.js";

export const app = express();

config({ path: "./config/config.env" });

// 1. GLOBAL MIDDLEWARES (Keep this order)
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. FILEUPLOAD (Must be above routes)
app.use(fileupload({
    useTempFiles: true,
    tempFileDir: "tmp", 
    createParentPath: true, // Forces Windows to make the folder
}));

connectDB();

// 3. LOG HEADERS (Temporary debug to see what Postman is doing)
app.use((req, res, next) => {
    console.log("Incoming Content-Type:", req.headers['content-type']);
    next();
});

// 4. ROUTES
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);

app.use(errorMiddleware);