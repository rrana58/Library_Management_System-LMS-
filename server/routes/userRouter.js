import express from "express";
import { 
    getAllUsers, 
    registerNewAdmin,
    requestAccountDeletion,
    cancelAccountDeletion,
    adminDeleteUser,
    updateUserRole,
    updateProfile,
    toggleSaveBook,
    getSavedBooks
} from "../controllers/userController.js";
import {
     isAuthenticated, 
     isAuthorized, 
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/all", isAuthenticated, isAuthorized("Admin"), getAllUsers);
router.get("/admin/all-users", isAuthenticated, isAuthorized("Admin"), getAllUsers);
router.put("/admin/update-role/:id", isAuthenticated, isAuthorized("Admin"), updateUserRole);
router.post("/add/new-admin", isAuthenticated, isAuthorized("Admin"), registerNewAdmin);
router.put("/me/update", isAuthenticated, updateProfile);
router.delete("/me/delete", isAuthenticated, requestAccountDeletion);
router.put("/me/cancel-deletion", isAuthenticated, cancelAccountDeletion);
router.delete("/admin/delete-user/:id", isAuthenticated, isAuthorized("Admin"), adminDeleteUser);
router.post("/save-book/:id", isAuthenticated, toggleSaveBook);
router.get("/saved-books", isAuthenticated, getSavedBooks);

export default router;
