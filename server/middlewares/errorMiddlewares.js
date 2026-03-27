// 1. You must define the ErrorHandler class first
export class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// 2. Then the middleware function
export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;

    // Handle Duplicate Key Error (Mongoose)
    if (err.code === 11000) {
        err = new ErrorHandler('Duplicate Field Value Entered', 400);
    }

    // Handle Invalid JWT
    if (err.name === "JsonWebTokenError") {
        err = new ErrorHandler('Json Web Token is Invalid. Try Again!!!', 400);
    }

    // Handle Expired JWT
    if (err.name === "TokenExpiredError") {
        err = new ErrorHandler('Json Web Token is Expired. Try Again!!!', 400);
    } 
    
    // Handle Wrong MongoDB ID (CastError)
    if (err.name === "CastError") {
        err = new ErrorHandler(`Resource not found. Invalid: ${err.path}`, 400);
    }

    // Extract validation errors if they exist
    const errorMessage = err.errors 
        ? Object.values(err.errors).map(error => error.message).join(" ") 
        : err.message;

    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage,
    });
};