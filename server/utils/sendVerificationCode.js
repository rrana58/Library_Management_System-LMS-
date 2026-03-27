import { generateVerificationOtpEmailTemplate } from "./emailTemplates.js";
import { sendEmail } from "./sendEmail.js";

export async function sendVerificationCode(code, email, res) {
    try{
        const message = generateVerificationOtpEmailTemplate(code);
        await sendEmail({
            email,
            subject: "Verification Code (MyLibrary)",
            message,
        });
        res.status(200).json({
            success: true,
            message: "Verification code sent successfully.",
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Failed to send verification code.",
         });
    }
}