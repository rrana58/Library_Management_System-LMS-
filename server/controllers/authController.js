import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import User from "../models/userModel.js"; 
import bcrypt from "bcrypt";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { createNotification } from "./notificationController.js";


export const register = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    
    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }

   
    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
    }

    
    const existingVerifiedUser = await User.findOne({ 
        email, 
        accountVerified: true,
        isPermanentDeleted: false 
    });
    if (existingVerifiedUser) {
        return next(new ErrorHandler("User already registered with this email. Please login.", 400));
    }

    
    const registrationAttemptsByUser = await User.find({
        email,
        accountVerified: false,
    });

    if (registrationAttemptsByUser.length >= 5) {
        return next(new ErrorHandler("Too many registration attempts. Please contact support.", 400));
    }

   
    await User.deleteOne({ email, accountVerified: false });

   
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
    });

    
    const verificationCode = newUser.generateVerificationCode(); 
    
    await newUser.save();

    
    await sendVerificationCode(verificationCode, email, res);
});


export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
    const { email, otp } = req.body;
    if(!email || !otp){
        return next(new ErrorHandler("Email or OTP is missing.", 400));
    }

    try{ 
        const userAllEntries = await User.find({
             email, 
             accountVerified: false,
         }).sort({ createdAt: -1 });

         if (!userAllEntries || userAllEntries.length === 0) {
            return next(new ErrorHandler("User not found.", 404));
         }


         let user = userAllEntries[0];

         if(userAllEntries.length > 1){
            user = userAllEntries[0];
            await User.deleteMany({
                _id: {$ne: user._id},
                email,
                accountVerified: false,
            });
         } else{
            user = userAllEntries[0];
         }

         if (user.verificationCode !== Number(otp)){
            return next(new ErrorHandler("Invalid OTP.", 400));
         }
         const currentTime = Date.now();

         const verificationCodeExpire = new Date(
            user.verificationCodeExpire
        ).getTime();

        if(currentTime > verificationCodeExpire){
            return next(new ErrorHandler("OTP has expired.", 400));
        }
        user.accountVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await user.save({validateModifiedOnly: true});

        await createNotification(user._id, "Welcome to the Library! Your account is now verified.", "General");

        sendToken(user, 200, res, "Account verified successfully.");


    } catch (error) {
        return next(new ErrorHandler("Internal server error.", 500));
    }
});


export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }
    console.log(`Login attempt for email: ${email}`);
    const user = await User.findOne({ email, accountVerified: true, isPermanentDeleted: false }).select(
        "+password"
    );
    console.log(`User found in DB: ${user ? "Yes" : "No"}`);
    if (user) console.log(`Account status: Verified=${user.accountVerified}, Deleted=${user.isPermanentDeleted}`);

    if (!user) {
        return next(new ErrorHandler("Account not found or permanently deleted.", 401));
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password.", 400));
    }
    
    if (user.scheduledForDeletion) {
        user.scheduledForDeletion = undefined;
        await user.save();
    }

    sendToken(user, 200, res, "Login successful.");

 });


export const logout = catchAsyncErrors(async (req, res, next) => { 
    res.status(200)
    .cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? "None" : "Lax",
        path: "/"
    })
    .json({
        success: true,
        message: "Logged out successfully.",
    });
});


 export const getUser = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
 });


export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
     const { email } = req.body || {}; 

    if (!email) {
        return next(new ErrorHandler("Please provide your email.", 400));
    }  

    console.log(`Forgot password attempt for email: ${email}`);
    const user = await User.findOne({
         email: email, 
         accountVerified: true 
    });
    console.log(`User found for forgot password: ${user ? "Yes" : "No"}`);

    if (!user) {
        return next(new ErrorHandler("Invalid email.", 400));
    }

    const otp = user.generateResetPasswordOTP();
    await user.save({ validateBeforeSave: false});

    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
            <h2 style="color: #fff; text-align: center;">Reset Your Password</h2>
            <p style="font-size: 16px; color: #ccc;">Dear User,</p>
            <p style="font-size: 16px; color: #ccc;">You requested to reset your password. Please use the following OTP (One-Time Password) to proceed:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #000; padding: 15px 30px; background-color: #f1c40f; border-radius: 10px; letter-spacing: 5px;">
                    ${otp}
                </span>
            </div>

            <p style="font-size: 16px; color: #ccc;">This code is valid for 15 minutes. If you did not request this, please ignore this email.</p>
            
            <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #444; padding-top: 10px;">
                <p>Thank you,<br>Library Management Team</p>
            </footer>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Recovery OTP",
            message,
        });
        res.status(200).json({
            success: true,
            message: `OTP sent to ${user.email} successfully.`,
        });

    } catch (error) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpire = undefined;
        await user.save({ validateBeforeSave: false});
        return next(new ErrorHandler(error.message, 500));
    }


});


export const resetPassword = catchAsyncErrors(async (req, res, next) => {
    const { email, otp, password, confirmPassword } = req.body || {};

    if (!email || !otp || !password || !confirmPassword) {
        return next(new ErrorHandler("Please provide all fields.", 400));
    }

    const user = await User.findOne({
        email,
        resetPasswordOTP: otp,
        resetPasswordOTPExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired OTP.", 400));
    }

    if (password !== confirmPassword) {
        return next(new ErrorHandler("Password and Confirm Password do not match.", 400));
    }

    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;

    await user.save();

    await createNotification(user._id, "Your password was successfully reset via the recovery link.", "General");

    sendToken(user, 200, res, "Password reset successful.");
});


export const updatePassword = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user._id).select("+password");
    
    const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }

    const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Current password is incorrect.", 400));
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
    }

    if (newPassword !== confirmNewPassword) {
        return next(new ErrorHandler("New Password and Confirm New Password do not match.", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await createNotification(user._id, "Your password was recently updated.", "General");

    res.status(200).json({
        success: true,
        message: "Password updated successfully.",
    });
});