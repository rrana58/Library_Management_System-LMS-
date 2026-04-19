import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js"; 
import { addBook, deleteBook, getAllBooks, updateBook } from "../controllers/bookController.js";

const router = express.Router();

router.post("/admin/add", isAuthenticated, isAuthorized("Admin"), addBook);
router.get("/all", getAllBooks);
router.delete("/delete/:id", isAuthenticated, isAuthorized("Admin"), deleteBook);
router.put("/admin/update/:id", isAuthenticated, isAuthorized("Admin"), updateBook);

export default router;