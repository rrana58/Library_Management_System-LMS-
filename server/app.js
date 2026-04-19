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
import notificationRouter from "./routes/notificationRouter.js";
import chatbotRouter from "./routes/chatbotRouter.js";
import paymentRouter from "./routes/paymentRouter.js";

import { notifyUsers } from "./services/notifyUsers.js";
import {removeUnverifiedAccounts} from "./services/removeUnverifiedAccounts.js";
import {cleanupReservations} from "./services/cleanupReservations.js";
import {deleteScheduledAccounts} from "./services/deleteScheduledAccounts.js";

export const app = express();

config({ path: "./config/config.env" });


app.use(cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(fileupload({
    useTempFiles: true,
    tempFileDir: "tmp", 
    createParentPath: true,
}));






app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/chatbot", chatbotRouter);
app.use("/api/v1/payment", paymentRouter);

notifyUsers();
removeUnverifiedAccounts();
cleanupReservations();
deleteScheduledAccounts();
connectDB();

app.use(errorMiddleware);