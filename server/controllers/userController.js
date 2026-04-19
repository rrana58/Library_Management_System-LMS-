import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import User from "../models/userModel.js"; 
import Borrow from "../models/borrowModel.js";
import bcrypt from "bcrypt";
import {v2 as cloudinary} from "cloudinary";



export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({accountVerified: true});
    res.status(200).json({
        success: true,
        users,
    });
});


export const registerNewAdmin = catchAsyncErrors(async (req, res, next) => {

  
    if (!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Admin avatar is required.", 400));
    }

    const { name, email, password } = req.body;
    const { avatar } = req.files;


    cloudinary.config({
        cloud_name: "dxpftokjd",
        api_key: "784651168977445",
        api_secret: "EQAN-xhsYa-nP4GWnOgppuQTcHo",
        secure: true,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        
        const cloudinaryResponse = await cloudinary.uploader.upload(
            avatar.tempFilePath, 
            { folder: "LIBRARY_MANAGEMENT_SYSTEM_ADMIN_AVATARS" }
        );

        if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.error("Cloudinary Upload Error:", cloudinaryResponse.error);
            return next(new ErrorHandler("Cloudinary Error: Failed to upload.", 500));
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        const admin = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "Admin",
            accountVerified: true,
            avatar: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url,
            },
        });

        res.status(201).json({
            success: true,
            message: "Admin registered successfully.",
            admin,
        });

    } catch (error) {
        console.error("FULL ERROR DETAILS:", error);
        return next(new ErrorHandler(`Cloudinary Error: ${error.message}`, 500));
    }
});

export const requestAccountDeletion = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // Check if user has active borrowings or reserved books that haven't been returned/cancelled.
    const activeBorrowings = await Borrow.find({
        "user.id": user._id,
        $or: [
            { reservationStatus: "Reserved" },
            { reservationStatus: "Borrowed", returnDate: null },
            { reservationStatus: "PendingReturn" },
            { fine: { $gt: 0 } },
        ]
    });

    if (activeBorrowings.length > 0) {
        return next(new ErrorHandler("Cannot schedule deletion. Please return all books and clear your fines first.", 400));
    }

    user.scheduledForDeletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.deletionRequestedAt = new Date();
    await user.save();

    res.status(200).json({
        success: true,
        message: "Account successfuly scheduled for deletion in 7 days.",
    });
});

export const cancelAccountDeletion = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.scheduledForDeletion = null;
    user.deletionRequestedAt = null;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Account deletion request cancelled.",
    });
});

export const adminDeleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    // Admin can delete immediately regardless of status, but we should inform them if books are out.
    // For now, let's just delete as requested.
    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User permanently deleted.",
    });
});

export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));
    
    user.role = req.body.role || (user.role === 'Admin' ? 'User' : 'Admin');
    await user.save();
    
    res.status(200).json({ success: true, message: "User role updated successfully" });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const { name } = req.body;
    
    if (!name) {
        return next(new ErrorHandler("Please provide a name to update", 400));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    user.name = name;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user
    });
});

export const toggleSaveBook = catchAsyncErrors(async (req, res, next) => {
    if (req.user.role !== "User") {
        return next(new ErrorHandler("Only users can save books for later.", 403));
    }
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const isAlreadySaved = user.savedBooks.includes(id);

    if (isAlreadySaved) {
        user.savedBooks = user.savedBooks.filter(bookId => bookId.toString() !== id);
    } else {
        user.savedBooks.push(id);
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: isAlreadySaved ? "Book removed from saved list" : "Book saved for later",
        savedBooks: user.savedBooks
    });
});

export const getSavedBooks = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate("savedBooks");
    if (!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({
        success: true,
        savedBooks: user.savedBooks
    });
});