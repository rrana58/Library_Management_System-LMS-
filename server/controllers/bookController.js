import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";  
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import Book from "../models/bookModel.js"; 
import User from "../models/userModel.js"; 

export const addBook = catchAsyncErrors(async (req, res, next) => {
    const { title, author, description, price, quantity, category } = req.body;
    if (!title || !author || !description || !price || !quantity) {
        return next(new ErrorHandler("Please fill all fields.", 400));
    }
    const bookCategory = category || "Uncategorized";
    const book = await Book.create({ title, author, description, price, quantity, category: bookCategory });
    res.status(200).json({ success: true, message: "Book added successfully.", book });
});

export const getAllBooks = catchAsyncErrors(async (req, res, next) => {
    const books = await Book.find();
    res.status(200).json({ success: true, books });
});

export const getBookDetails = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return next(new ErrorHandler("Book not found", 404));
    res.status(200).json({ success: true, book });
});

export const deleteBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const book = await Book.findById(id);
    if (!book) return next(new ErrorHandler("Book not found", 404));
    await book.deleteOne();
    res.status(200).json({ success: true, message: "Book deleted successfully." });
});

export const updateBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let book = await Book.findById(id);
    if (!book) return next(new ErrorHandler("Book not found", 404));

    book = await Book.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({ success: true, message: "Book updated successfully.", book });
});