import mongoose from "mongoose";

const borrowSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
    },
    price: { type: Number, required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    fine: { type: Number, default: 0 },
    notified: { type: Boolean, default: false },
    reservationStatus: { type: String, enum: ["Reserved", "Borrowed", "PendingReturn", "Cancelled", "Returned"], default: "Borrowed" },
    paymentMethod: { type: String, enum: ["Cash", "Stripe", "None"], default: "None" },
    reservationExpiry: { type: Date, default: null },
}, { timestamps: true });


const Borrow = mongoose.model("Borrow", borrowSchema);
export default Borrow;