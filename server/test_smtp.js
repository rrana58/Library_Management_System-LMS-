import nodeMailer from "nodemailer";
import { config } from "dotenv";
import path from "path";

// Load env vars
config({ path: "./config/config.env" });

const testSmtp = async () => {
    console.log("Checking SMTP configuration...");
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`SMTP_MAIL: ${process.env.SMTP_MAIL}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);

    const transporter = nodeMailer.createTransport({
        host: process.env.SMTP_HOST,
        service: process.env.SMTP_SERVICE,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ SMTP connection successful!");

        console.log("Sending test email to verify service...");
        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: process.env.SMTP_MAIL,
            subject: "SMTP Test (MyLibrary)",
            text: "This is a test email to verify your SMTP configuration works correctly.",
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Test email sent successfully! Please check your inbox (rozinar318@gmail.com).");
    } catch (error) {
        console.error("❌ SMTP Error:", error.message);
        if (error.message.includes("Invalid login")) {
            console.log("\nTIP: Your Gmail App Password might be incorrect or revoked.");
            console.log("Go to Google Account -> Security -> 2-Step Verification -> App Passwords to create a new one.");
        }
    }
};

testSmtp();
