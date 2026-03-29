import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import User from "../models/userModel.js"; 

export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find({accountVerified: true});
    res.status(200).json({
        success: true,
        users,
    });
});


export const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length == 0){
        return next(new ErrorHandler("Admin avatar is required.", 400));
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password){
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    const isRegistered = await User.findOne({ email, accountVerified: true});
    if (isRegistered){
        return next(new ErrorHandler("User already registered.", 400));
    }
    if (password.length < 8 || password.length > 16){
        return next(
            new ErrorHandler("Password must be between 8 and 16 characters.", 400)
        );
    }
    
    // Continue with admin registration logic
});