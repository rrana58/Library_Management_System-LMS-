import { catchAsyncErrors } from "./catchAsyncErrors.js";
import { ErrorHandler } from "./errorMiddlewares.js"; 
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; 

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ErrorHandler("User is not authenticated.", 401));
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        return next(new ErrorHandler("Invalid or expired token.", 401));
    }
});


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