import { catchAsyncErrors } from "./catchAsyncErrors.js";
import { ErrorHandler } from "./errorMiddlewares.js"; 
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // FIX: Removed curly braces

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return next(new ErrorHandler("User is not authenticated.", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();
});

// FIX: Corrected spelling from isAutherorized to isAuthorized
export const isAuthorized = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorHandler(
                   `User with this role (${req.user.role}) is not authorized to access this resource.`,
                   403
                )
            );
        }
        next();
    };
};