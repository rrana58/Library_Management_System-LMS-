import{catchAsyncErrors} from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorHandler.js";
import { Book } from "../models/bookModel.js";
import { Borrow } from "../models/borrowModel.js";
import { User } from "../models/userModel.js";

export const borrowedBooks = catchAsyncErrors(async (req, res, next) => {});

export const recordBorrowedBook = catchAsyncErrors(
    async (req, res, next) => {
        const {id} = req.params;
        const { email } = req.body;

        const book = await Book.findById(id);
        if (!book) {
            return next(new ErrorHandler("Book not found", 404));
        }

        const user = await User.findOne({ email , accountVerified: true });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        if (book.quantity ===  0) {
            return next(new ErrorHandler("Book is currently unavailable", 400));
        }

        const isAlreadyBorrowed = user.borrowedBooks.find(
            (b) => b.book.toString() === id && b.returned === false     
        );
        if (isAlreadyBorrowed) {
            return next(new ErrorHandler("You have already borrowed this book", 400));
        }

        book.quantity -= 1;
        book.availability = book.quantity > 0;
        await book.save();

        user.borrowedBooks.push({
            bookIg: book._id,
            bookTitle: book.title,
            borrowDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await user.save();
        await Borrow.create({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            book: book._id,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            price: book.price,
        });
        res.status(200).json({
            success: true,
            message: `Book "${book.title}" has been borrowed successfully`,
        })
    });



export const getBorrowedBooksForAdmin = catchAsyncErrors(
    async (req, res, next) => {}
);

export const returnBorrowBook = catchAsyncErrors(
    async (req, res, next) => {
        const { bookId } = req.params;
        const {email} = req.body;
        const book = await  Book.findById(bookId);

        if (!book) {
            return next(new ErrorHandler("Book not found", 404));
        }

        const user = await User.findOne({ email, accountVerified: true });
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }
        const borrowedBook = user.borrowedBooks.find(
            ( b )=> b.book.toString() === bookId && b.returned === false
            );
        if (!borrowedBook) {
            return next(new ErrorHandler("You have not borrowed this book", 400));
        }
        borrowedBook.returned = true;
        await user.save();

        book.quantity += 1;
        book.availability = book.quantity > 0;
        await book.save();

        const borrow = await Borrow.findOne({
            book : bookId,
            "user.email": email,
            returnDate: null,
         });
        if (!borrow) {
        })
    }
);

