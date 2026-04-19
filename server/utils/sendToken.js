export const sendToken = (user, statusCode, res, message) => {
    const token = user.generateToken();

    // Define cookie options
    const options = {
        expires: new Date(
            Date.now() + (process.env.COOKIE_EXPIRE || 3) * 24 * 60 * 60 * 1000 
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only true in production
        sameSite: process.env.NODE_ENV === 'production' ? "None" : "Lax"
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        message,
        token,
    });
};