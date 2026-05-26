import express from "express";
import {
    borrowedBooks,
    getBorrowedBooksForAdmin,
    recordBorrowedBook,
    returnBorrowBook,
    reserveBook,
    unreserveBook,
    collectReservedBook,
    getAdminStats,
    confirmBookReturn,
    rejectBookReturn,
    getUserStats
} from "../controllers/borrowController.js";
import { 
    isAuthenticated, isAuthorized
 } from "../middlewares/authMiddleware.js";

const router = express.Router();


router.post(
    "/record-borrow-book/:id",
    isAuthenticated,
    recordBorrowedBook
);


router.get(
    "/borrowed-books-by-users",
    isAuthenticated,
    isAuthorized("Admin"),
    getBorrowedBooksForAdmin
);

router.get(
    "/admin/stats",
    isAuthenticated,
    isAuthorized("Admin"),
    getAdminStats
);


router.get("/my-borrowed-books", isAuthenticated, borrowedBooks);
router.get("/my-stats", isAuthenticated, getUserStats);


router.put(
    "/return-borrowed-book/:bookId",
    isAuthenticated,
    returnBorrowBook
);

router.post("/reserve/:id", isAuthenticated, reserveBook);
router.put("/unreserve/:borrowId", isAuthenticated, unreserveBook);

router.post(
    "/collect/:borrowId", 
    isAuthenticated, 
    isAuthorized("Admin"), 
    collectReservedBook
);

router.post(
    "/admin/confirm-return/:borrowId",
    isAuthenticated,
    isAuthorized("Admin"),
    confirmBookReturn
);

router.post(
    "/admin/reject-return/:borrowId",
    isAuthenticated,
    isAuthorized("Admin"),
    rejectBookReturn
);

export default router;