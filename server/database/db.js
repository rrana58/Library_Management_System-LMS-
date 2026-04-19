import mongoose from "mongoose";

export const connectDB = async () => {
    mongoose
    .connect(process.env.MONGO_URI,{
     dbName: "LIBRARY_MANAGEMENT_SYSTEM"
    })
    .then(async () => {
        console.log(`Database connected successfully.`);
        try {
            const userCount = await mongoose.connection.db.collection("users").countDocuments();
            console.log(`System Status: DB connection built-in. There are ${userCount} users registered.`);
        } catch (e) {
            // Silence if users collection doesn't exist yet
        }
    })
    .catch((err) => {
        console.log("Error connecting to database:", err);  
    });
};