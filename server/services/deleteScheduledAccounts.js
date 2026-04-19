import cron from "node-cron";
import User from "../models/userModel.js";

export const deleteScheduledAccounts = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const currentTime = new Date();
            const usersToDelete = await User.find({ 
                scheduledForDeletion: { $lt: currentTime }, 
                isPermanentDeleted: false 
            });

            if (usersToDelete.length > 0) {
                for (const user of usersToDelete) {
                    user.isPermanentDeleted = true;
                    user.email = `${user.email}_deleted_${Date.now()}`;
                    await user.save();
                }
                console.log(`Soft-deleted ${usersToDelete.length} accounts and anonymized their emails.`);
            }
        } catch (error) {
            console.error("Error running deleteScheduledAccounts cron job:", error);
        }
    });
};
