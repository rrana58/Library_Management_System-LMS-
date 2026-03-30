import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import User from "../models/userModel.js"; 
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