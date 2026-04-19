import cron from "node-cron";
import Borrow from "../models/borrowModel.js";
import Book from "../models/bookModel.js";

export const cleanupReservations = () => {
    // Runs every hour
    cron.schedule("0 * * * *", async () => {
        try {
            const expiredReservations = await Borrow.find({
                reservationStatus: "Reserved",
                reservationExpiry: { $lt: new Date() },
            });

            for (const reservation of expiredReservations) {
                // Update reservation status
                reservation.reservationStatus = "Cancelled";
                await reservation.save();

                // Increment book quantity since it's no longer reserved
                const book = await Book.findById(reservation.book);
                if (book) {
                    book.quantity += 1;
                    book.availability = true;
                    await book.save();
                }
            }

            if (expiredReservations.length > 0) {
                console.log(`Cancelled ${expiredReservations.length} expired reservations.`);
            }
        } catch (error) {
            console.error("Error cleaning up reservations:", error);
        }
    });
};
