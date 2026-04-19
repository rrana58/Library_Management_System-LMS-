import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "./models/userModel.js";
import { config } from "dotenv";

config({ path: "./config/config.env" });

const forceReset = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "LIBRARY_MANAGEMENT_SYSTEM"
        });
        console.log("Connected to Database.");

        const email = "rozinar318@gmail.com";
        const newPassword = "newpassword123"; 

        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found in database.");
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.accountVerified = true; // Ensure it's verified too
        
        await user.save();

        console.log(`\n✅ SUCCESS!`);
        console.log(`User: ${email}`);
        console.log(`New Password: ${newPassword}`);
        console.log(`Account Status: Verified & Password Updated.`);
        console.log(`\nYou can now log in with these credentials.`);
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

forceReset();
