import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
    },
    bookTitle: { type: String, required: true },
    bookPrice: { type: Number, required: true },
    fineAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["Stripe", "Cash"], required: true },
    paymentType: { type: String, required: true },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
