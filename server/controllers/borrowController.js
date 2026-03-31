import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import Book from "../models/bookModel.js";
import Borrow from "../models/borrowModel.js";
import User from "../models/userModel.js";
import { calculateFine } from "../utils/fineCalculator.js";


export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {
    const { borrowedBooks } = req.user;
    res.status(200).json({
        success: true,
        borrowedBooks,
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
    const { email } = req.body;

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

    borrowedBook.returned = true;
    await user.save();

    book.quantity += 1;
    book.availability = true;
    await book.save();

    const borrow = await Borrow.findOne({
        book: bookId,
        "user.email": email,
        returnDate: null,
    });

    if (borrow) {
        borrow.returnDate = new Date();
        const fine = calculateFine(borrow.dueDate);
        borrow.fine = fine;
        await borrow.save();

        return res.status(200).json({
            success: true,
            message: fine !== 0 
                ? `Returned successfully. Total: NRP ${(fine + book.price).toFixed(2)} (Fine: NRP ${fine.toFixed(2)})` 
                : `Returned successfully. Total: NRP ${book.price.toFixed(2)}`,
        });
    }

    res.status(200).json({ success: true, message: "Book returned successfully." });
});