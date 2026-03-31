import corn from "node-cron";
import Borrow  from "../models/borrowModel.js";
import { sendEmail } from "../utils/sendEmail.js";
import  User  from "../models/userModel.js";

export const notifyUsers =  () => {
    corn.schedule("*/30 * * * *",async () => {
        try{
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const borrowers = await Borrow.find({
                dueDate:{
                    $lt : oneDayAgo,
                },
                returnDate: null,
                notified: false,
            });

            for(const element of borrowers){
                if(element.user && element.user.email){
                    sendEmail({
                        email: element.user.email,
                        subject: "BOOK RETURN REMINDER",
                        message: `Dear ${element.user.name},\n\nThis is a reminder that the book you borrowed is due for return today. Please return it as soon as possible to avoid any late fees.\n\nThank you,\nMy Library Team`,
                    });
                    element.notified = true;
                    await element.save();
                    console.log(`Email sent to ${element.user.email} regarding overdue book.`);
                }
            }
        }catch (error){
            console.error("Error occured while notifying users.", error);
        }
    });
};
