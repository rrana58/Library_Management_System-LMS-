import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import Borrow from "../models/borrowModel.js";

// Initialize Khalti Payment
export const initiateKhaltiPayment = catchAsyncErrors(async (req, res, next) => {
    const { borrowId } = req.body;

    const borrow = await Borrow.findById(borrowId);
    if (!borrow) {
        return next(new ErrorHandler("Borrow record not found", 404));
    }

    if (borrow.fine <= 0) {
        return next(new ErrorHandler("No fines to pay for this record", 400));
    }

    const payload = {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        website_url: `${process.env.FRONTEND_URL}`,
        amount: Math.round(borrow.fine * 100), // Amount must be in paisa
        purchase_order_id: borrow._id.toString(),
        purchase_order_name: "Library Fine Payment",
        customer_info: {
            name: req.user.name,
            email: req.user.email,
        }
    };

    try {
        const response = await fetch("https://a.khalti.com/api/v2/epayment/initiate/", {
            method: "POST",
            headers: {
                "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
            res.status(200).json({
                success: true,
                payment_url: data.payment_url,
                pidx: data.pidx,
            });
        } else {
            return next(new ErrorHandler(data.detail || "Error initiating Khalti payment", 400));
        }

    } catch (error) {
        return next(new ErrorHandler("Could not connect to Khalti", 500));
    }
});

// Verify Khalti Payment
export const verifyKhaltiPayment = catchAsyncErrors(async (req, res, next) => {
    const { pidx } = req.body;

    if (!pidx) {
        return next(new ErrorHandler("Payment Index (pidx) is required", 400));
    }

    try {
        const response = await fetch("https://a.khalti.com/api/v2/epayment/lookup/", {
            method: "POST",
            headers: {
                "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ pidx }),
        });

        const data = await response.json();

        if (response.ok && data.status === "Completed") {
            const borrowId = data.purchase_order_id;
            const borrow = await Borrow.findById(borrowId);
            
            if (!borrow) {
                return next(new ErrorHandler("Transaction verified, but borrow record not found.", 404));
            }

            // Clear the fine
            borrow.fine = 0;
            await borrow.save();

            res.status(200).json({
                success: true,
                message: "Payment verified and Fine cleared successfully.",
                data,
            });
        } else {
            return next(new ErrorHandler(data.detail || "Payment verification failed", 400));
        }

    } catch (error) {
         return next(new ErrorHandler("Could not verify with Khalti", 500));
    }
});
