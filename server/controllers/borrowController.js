import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import Book from "../models/bookModel.js";
import Borrow from "../models/borrowModel.js";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import { calculateFine } from "../utils/fineCalculator.js";
import { createNotification } from "./notificationController.js";


export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
    const borrows = await Borrow.find({ "user.id": req.user._id }).populate("book", "title");
    
    const formattedBorrows = borrows.map(borrow => ({
        _id: borrow._id,
        book: borrow.book ? borrow.book._id : null,
        bookTitle: borrow.book ? borrow.book.title : "Unknown Book",
        borrowDate: borrow.borrowDate || borrow.createdAt,
        dueDate: borrow.dueDate,
        returned: borrow.reservationStatus === "Returned" || borrow.reservationStatus === "Cancelled",
        fine: borrow.fine,
        reservationStatus: borrow.reservationStatus
    }));

    res.status(200).json({
        success: true,
        borrowedBooks: formattedBorrows,
    });
}); 


export const recordBorrowedBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const email = req.body.email || req.user.email;

    const book = await Book.findById(id);
    if (!book) return next(new ErrorHandler("Book not found.", 404));

    const user = await User.findOne({ email, accountVerified: true });
    if (!user) return next(new ErrorHandler("User not found or not verified.", 404));

    if (book.quantity === 0) return next(new ErrorHandler("Book not available.", 400));

    const activeBooksCount = await Borrow.countDocuments({
        "user.id": user._id,
        reservationStatus: { $in: ["Reserved", "Borrowed", "PendingReturn"] }
    });

    if (activeBooksCount >= 5) {
        return next(new ErrorHandler("Maximum limit reached: You can only have up to 5 active books at a time. Please return a book first.", 400));
    }
    
    const isAlreadyBorrowed = user.borrowedBooks.find(
        (b) => b.book?.toString() === id && b.returned === false
    );

    if (isAlreadyBorrowed) return next(new ErrorHandler("Book already borrowed.", 400));

    book.quantity -= 1;
    book.availability = book.quantity > 0;
    await book.save();

    user.borrowedBooks.push({
        book: book._id, 
        bookTitle: book.title,
        borrowDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    await Borrow.create({
        user: { id: user._id, name: user.name, email: user.email },
        book: book._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        price: book.price,
    });

    await createNotification(user._id, `You have successfully borrowed "${book.title}". Your due date is ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.`, "Borrow");

    res.status(200).json({
        success: true,
        message: `Book "${book.title}" has been borrowed successfully`,
    });
});


export const getBorrowedBooksForAdmin = catchAsyncErrors(async (req, res, next) => {
    const borrowedRecords = await Borrow.find().populate("book", "title");
    res.status(200).json({
         success: true, 
         borrowedRecords,
    });
}); 


export const returnBorrowBook = catchAsyncErrors(async (req, res, next) => {
    const { bookId } = req.params;
    const { email, paymentMethod } = req.body;

    const book = await Book.findById(bookId);
    if (!book) return next(new ErrorHandler("Book not found.", 404));

    const user = await User.findOne({ email });
    if (!user) return next(new ErrorHandler("User not found.", 404));

    const borrowedBook = user.borrowedBooks.find(
        (b) => b.book?.toString() === bookId && b.returned === false
    );

    if (!borrowedBook) {
        return next(new ErrorHandler("You have not borrowed this book.", 400));
    }

    const borrow = await Borrow.findOne({
        book: bookId,
        "user.email": email,
        returnDate: null,
    });

    if (borrow) {
        borrow.returnDate = new Date();
        const fine = calculateFine(borrow.dueDate);
        borrow.fine = fine;
        borrow.reservationStatus = "PendingReturn";
        borrow.paymentMethod = paymentMethod || "None";
        await borrow.save();

        if (fine > 0) {
            await createNotification(user._id, `Return requested. You have a penalty fine of $${fine.toFixed(2)} to be paid via ${borrow.paymentMethod}.`, "Fine");
        }

        return res.status(200).json({
            success: true,
            borrow,
            message: fine !== 0 
                ? `Return requested successfully. Total Fine: $${fine.toFixed(2)}. Awaiting admin confirmation.` 
                : `Return requested. Awaiting admin confirmation.`,
        });
    }

    res.status(200).json({ success: true, message: "Return requested." });
});

export const confirmBookReturn = catchAsyncErrors(async (req, res, next) => {
    const { borrowId } = req.params;

    const borrow = await Borrow.findById(borrowId);
    if (!borrow || borrow.reservationStatus !== "PendingReturn") {
        return next(new ErrorHandler("Borrow record not found or not in Pending Return status.", 404));
    }

    const user = await User.findById(borrow.user.id);
    const book = await Book.findById(borrow.book);

    if (book) {
        book.quantity += 1;
        book.availability = true;
        await book.save();
    }

    if (user) {
        const userBorrowedBook = user.borrowedBooks.find(
            (b) => b.book?.toString() === borrow.book.toString() && b.returned === false
        );
        if (userBorrowedBook) {
            userBorrowedBook.returned = true;
            await user.save();
        }
    }

    borrow.reservationStatus = "Returned";
    
    if (borrow.paymentMethod === "Cash") {
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
            paymentMethod: "Cash",
            paymentType: "Book Return",
        });
    }

    // If Admin confirms it, the fine has been collected/waived.
    borrow.fine = 0;
    await borrow.save();

    await createNotification(user._id, "Your book return has been confirmed by the admin successfully.", "Return");

    res.status(200).json({
        success: true,
        message: "Book return confirmed and inventory restored.",
    });
});

export const rejectBookReturn = catchAsyncErrors(async (req, res, next) => {
    const { borrowId } = req.params;

    const borrow = await Borrow.findById(borrowId);
    if (!borrow || borrow.reservationStatus !== "PendingReturn") {
        return next(new ErrorHandler("Borrow record not found or not in Pending Return status.", 404));
    }

    borrow.reservationStatus = "Borrowed";
    borrow.returnDate = null;
    borrow.paymentMethod = "None";
    await borrow.save();

    await createNotification(borrow.user.id, "Your book return request was rejected by the admin. The book remains borrowed.", "Return");

    res.status(200).json({
        success: true,
        message: "Book return rejected.",
    });
});

export const reserveBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params; // book id
    const email = req.user.email;

    const book = await Book.findById(id);
    if (!book) return next(new ErrorHandler("Book not found.", 404));

    if (book.quantity === 0) return next(new ErrorHandler("Book not available.", 400));

    const user = await User.findById(req.user._id);

    const activeBooksCount = await Borrow.countDocuments({
        "user.id": user._id,
        reservationStatus: { $in: ["Reserved", "Borrowed", "PendingReturn"] }
    });

    if (activeBooksCount >= 5) {
        return next(new ErrorHandler("Maximum limit reached: You can only have up to 5 active books at a time. Please return a book first.", 400));
    }

    const isAlreadyBorrowed = user.borrowedBooks.find(
        (b) => b.book?.toString() === id && b.returned === false
    );
    if (isAlreadyBorrowed) return next(new ErrorHandler("Book already borrowed.", 400));

    // Check if genuinely reserved already by same user
    const existingReservation = await Borrow.findOne({
        "user.id": user._id, 
        book: id, 
        reservationStatus: "Reserved"
    });
    if (existingReservation) return next(new ErrorHandler("You have already reserved this book.", 400));

    // Dedicate book
    book.quantity -= 1;
    book.availability = book.quantity > 0;
    await book.save();

    await Borrow.create({
        user: { id: user._id, name: user.name, email: user.email },
        book: book._id,
        price: book.price,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default due date from now, will reset on collect
        reservationStatus: "Reserved",
        reservationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
    });

    await createNotification(user._id, `You have successfully reserved the book: ${book.title}. Please collect within 24 hours.`, "Reservation");

    res.status(200).json({
        success: true,
        message: `Book "${book.title}" has been reserved successfully. Please collect it within 24 hours.`,
    });
});

export const collectReservedBook = catchAsyncErrors(async (req, res, next) => {
    const { borrowId } = req.params; 
    
    // Admin uses borrow record ID directly
    const borrow = await Borrow.findById(borrowId);
    if (!borrow) return next(new ErrorHandler("Borrow record not found.", 404));

    if (borrow.reservationStatus !== "Reserved") {
        return next(new ErrorHandler("This book is not currently reserved.", 400));
    }

    // Mark as borrowed and reset due date
    borrow.reservationStatus = "Borrowed";
    borrow.borrowDate = new Date();
    borrow.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    borrow.reservationExpiry = null;
    await borrow.save();

    const user = await User.findById(borrow.user.id);
    const book = await Book.findById(borrow.book);

    // Sync in user's nested array
    user.borrowedBooks.push({
        book: book._id, 
        bookTitle: book.title,
        borrowDate: borrow.borrowDate,
        dueDate: borrow.dueDate,
    });
    await user.save();

    await createNotification(user._id, `Your reserved book '${book.title}' has been collected and is now borrowed.`, "Borrow");

    res.status(200).json({
        success: true,
        message: `Reservation completed. Book has been assigned to ${user.name}.`,
    });
});

export const getAdminStats = catchAsyncErrors(async (req, res, next) => {
    const inventoryDistribution = await Book.aggregate([
        { $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, value: { $sum: "$quantity" } } },
        { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); 
    sixMonthsAgo.setHours(0,0,0,0);

    const borrowingTrends = await Borrow.aggregate([
        { $match: { borrowDate: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $month: "$borrowDate" },
                borrows: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedTrends = borrowingTrends.map(t => ({
        month: monthNames[t._id - 1],
        borrows: t.borrows
    }));

    // New specific stats requested
    const totalBorrowedCount = await Borrow.countDocuments({
        reservationStatus: { $in: ["Borrowed", "PendingReturn"] }
    });

    const totalOverdueCount = await Borrow.countDocuments({
        reservationStatus: "Borrowed",
        dueDate: { $lt: new Date() }
    });

    res.status(200).json({ 
        success: true, 
        inventoryDistribution, 
        borrowingTrends: formattedTrends,
        totalBorrowed: totalBorrowedCount,
        totalOverdue: totalOverdueCount
    });
});

export const getUserStats = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    const totalBorrowed = await Borrow.countDocuments({
        "user.id": userId,
        reservationStatus: { $in: ["Borrowed", "PendingReturn"] }
    });

    const totalReturned = await Borrow.countDocuments({
        "user.id": userId,
        reservationStatus: "Returned"
    });

    const totalOverdue = await Borrow.countDocuments({
        "user.id": userId,
        reservationStatus: "Borrowed",
        dueDate: { $lt: new Date() }
    });

    res.status(200).json({
        success: true,
        stats: {
            borrowed: totalBorrowed,
            returned: totalReturned,
            overdue: totalOverdue
        }
    });
});

export const unreserveBook = catchAsyncErrors(async (req, res, next) => {
    const { borrowId } = req.params;
    const borrow = await Borrow.findById(borrowId);

    if (!borrow) return next(new ErrorHandler("Record not found.", 404));

    if (borrow.user.id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Unauthorized.", 403));
    }

    if (borrow.reservationStatus !== "Reserved") {
        return next(new ErrorHandler("Only reserved books can be unreserved.", 400));
    }

    // Update the borrow record
    borrow.reservationStatus = "Cancelled";
    await borrow.save();

    // Restore book quantity
    const book = await Book.findById(borrow.book);
    if (book) {
        book.quantity += 1;
        book.availability = true;
        await book.save();
    }

    await createNotification(req.user._id, `You have successfully cancelled the reservation for "${book ? book.title : 'the book'}".`, "Reservation");

    res.status(200).json({
        success: true,
        message: "Reservation cancelled successfully.",
    });
});