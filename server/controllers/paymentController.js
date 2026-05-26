import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import Borrow from "../models/borrowModel.js";
import Book from "../models/bookModel.js";
import Transaction from "../models/transactionModel.js";
import Stripe from "stripe";

let stripeInstance;
const getStripe = () => {
    if (!stripeInstance) {
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return stripeInstance;
};

export const createStripeCheckoutSession = catchAsyncErrors(async (req, res, next) => {
    const { paymentType, referenceId } = req.body;
    const stripe = getStripe();

    if (!paymentType || !referenceId) {
        return next(new ErrorHandler("Payment type and reference ID are required", 400));
    }

    let amountInCents = 0;
    let description = "";

    if (paymentType === "book_return") {
        const borrow = await Borrow.findById(referenceId);
        if (!borrow) {
            return next(new ErrorHandler("Borrow record not found", 404));
        }
        
        const totalAmount = borrow.price + (borrow.fine || 0);
        if (totalAmount <= 0) {
            return next(new ErrorHandler("No payment required for this record", 400));
        }
        
        amountInCents = Math.round(totalAmount * 100);
        amountInCents = amountInCents < 50 ? 50 : amountInCents;
        description = `Book Return Payment for Borrow ID: ${referenceId}`;
    } else {
        return next(new ErrorHandler("Unsupported payment type", 400));
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: description,
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/dashboard`,
            metadata: {
                paymentType,
                referenceId: referenceId.toString(),
                userId: req.user._id.toString()
            }
        });

        res.status(200).json({
            success: true,
            url: session.url,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message || "Stripe checkout session creation failed", 500));
    }
});

export const verifyStripePayment = catchAsyncErrors(async (req, res, next) => {
    const { session_id } = req.body;
    const stripe = getStripe();

    if (!session_id) {
        return next(new ErrorHandler("Session ID is required", 400));
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            const { paymentType, referenceId } = session.metadata;

            if (paymentType === 'book_return') {
                const borrow = await Borrow.findById(referenceId);
                if (borrow) {
                    const book = await Book.findById(borrow.book);
                    const bookTitle = book ? book.title : "Unknown Book";
                    const fineAmount = borrow.fine || 0;
                    const bookPrice = borrow.price || 0;
                    const totalAmount = fineAmount + bookPrice;

                    await Transaction.create({
                        user: borrow.user,
                        bookTitle,
                        bookPrice,
                        fineAmount,
                        totalAmount,
                        paymentMethod: "Stripe",
                        paymentType: "Book Return",
                    });

                    borrow.fine = 0;
                    await borrow.save();
                }
            }

            res.status(200).json({
                success: true,
                message: "Payment verified successfully.",
            });
        } else {
            return next(new ErrorHandler("Payment not successful", 400));
        }
    } catch (error) {
        return next(new ErrorHandler("Could not verify Stripe payment", 500));
    }
});
