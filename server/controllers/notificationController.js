import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { ErrorHandler } from "../middlewares/errorMiddlewares.js";
import Notification from "../models/notificationModel.js";

// Fetch all notifications for the logged in user
export const getMyNotifications = catchAsyncErrors(async (req, res, next) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        notifications,
    });
});

// Mark a specific notification as read
export const markAsRead = catchAsyncErrors(async (req, res, next) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
    }

    if (notification.user.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Not authorized", 403));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        success: true,
        message: "Notification marked as read",
    });
});

// Mark all notifications as read
export const markAllAsRead = catchAsyncErrors(async (req, res, next) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        success: true,
        message: "All notifications marked as read",
    });
});

// Helper function to create notification internally (not a route handler)
export const createNotification = async (userId, message, type = "General") => {
    try {
        await Notification.create({
            user: userId,
            message,
            type,
        });
    } catch (error) {
        console.error("Failed to create notification", error);
    }
};
