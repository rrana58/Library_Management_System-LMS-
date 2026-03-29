import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import User from "../models/userModel.js"; 
import bcrypt from "bcrypt";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";


export const register = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    // 1. Basic Field Validation
    if (!name || !email || !password) {
        return next(new ErrorHandler("Please enter all fields.", 400));
    }

    // 2. Password Length Validation
    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
    }

    // 3. Check if a VERIFIED user already exists
    const existingVerifiedUser = await User.findOne({ email, accountVerified: true });
    if (existingVerifiedUser) {
        return next(new ErrorHandler("User already registered with this email. Please login.", 400));
    }

    // 4. Rate Limiting: Check for existing UNVERIFIED registration attempts
    const registrationAttemptsByUser = await User.find({
        email,
        accountVerified: false,
    });

    if (registrationAttemptsByUser.length >= 5) {
        return next(new ErrorHandler("Too many registration attempts. Please contact support.", 400));
    }

    /** 
     * 5. Cleanup: Delete existing unverified records for this email.
     * This prevents "Unique Email" index errors and allows the user 
     * to 'retry' registration if they didn't receive their previous OTP.
     */
    await User.deleteOne({ email, accountVerified: false });

    // 6. Security: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Create New User Instance
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
    });

    // 8. Generate OTP/Code (Assuming this method is defined in your User Schema)
    const verificationCode = newUser.generateVerificationCode(); 
    
    // 9. Save to Database
    await newUser.save();

    // 10. Send Verification Email and Respond to Client
    // We await this to ensure the email is sent (or fails) before finishing the request
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
    const user = await User.findOne({ email, accountVerified: true }).select(
        "+password"
    );
    if (!user) {
        return next(new ErrorHandler("Invalid email or password.", 400));
    }
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password.", 400));
    }
    sendToken(user, 200, res, "Login successful.");

 });


 export const logout = catchAsyncErrors(async (req, res, next) => { 
    res
    .status(200)
    .cookie("token", "",{
        expires: new Date(Date.now()),
        httpOnly: true,
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

    const user = await User.findOne({
         email: req.body.email, 
         accountVerified: true 
    });

    if (!user) {
        return next(new ErrorHandler("Invalid email.", 400));
    }

    const resetToken = user.getResetPasswordToken();


    await user.save({ validateBeforeSave: false});

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);


    try {
        await sendEmail({
            email: user.email,
            subject: "My Library Password Recovery",
            message,
        });
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully.`,
        });

    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false});
        return next(new ErrorHandler(error.message, 500));
    }


});


export const resetPassword = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body || {};

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ErrorHandler("Invalid or expired password reset token.", 400));
    }

    if (password !== confirmPassword) {
        return next(new ErrorHandler("Password and Confirm Password do not match.", 400));
    }

    if (password.length < 8 || password.length > 16) {
        return next(new ErrorHandler("Password must be between 8 and 16 characters.", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

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

    res.status(200).json({
        success: true,
        message: "Password updated successfully.",
    });
});