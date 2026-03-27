import { isAuthenticated, isAutherorized } from "../middlewares/authMiddleware.js";
import {addBook, deleteBook , getAllBooks} from "../controllers/bookController.js";

import express from "express";

const router = express.Router();

router.post("/admin/add", isAuthenticated ,isAutherorized("Admin"), addBook);
router.get ("/all", isAuthenticated , getAllBooks);
router.delete("/delete/:id", isAuthenticated , isAutherorized("Admin"), deleteBook);

export default router;