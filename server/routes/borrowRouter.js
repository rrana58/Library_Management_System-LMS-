import express from "express";
import {
    borrowedBooks,
    getBorrowedBooksForAdmin,
    recordBorrowedBook,
    returnBorrowBook,       
} from "../controllers/borrowController.js";
import { 
    isAuthenticated, isAuthorized
 } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Allowed for any logged-in user (Admin check removed)
router.post(
    "/record-borrow-book/:id",
    isAuthenticated,
    recordBorrowedBook
);

// Admin Only (Keep this restricted)
router.get(
    "/borrowed-books-by-users",
    isAuthenticated,
    isAuthorized("Admin"),
    getBorrowedBooksForAdmin
);

// Allowed for any logged-in user
router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);

// Allowed for any logged-in user (Admin check removed)
router.put(
    "/return-borrowed-book/:bookId",
    isAuthenticated,
    returnBorrowBook
);

export default router;