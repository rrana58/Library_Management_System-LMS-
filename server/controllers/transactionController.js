import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import Transaction from "../models/transactionModel.js";

export const getAllTransactions = catchAsyncErrors(async (req, res, next) => {
    const transactions = await Transaction.find().sort({ date: -1 });
    
    const monthlyStats = await Transaction.aggregate([
        {
            $group: {
                _id: { 
                    month: { $month: "$date" }, 
                    year: { $year: "$date" },
                    method: "$paymentMethod"
                },
                total: { $sum: "$totalAmount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartDataMap = {};
    
    monthlyStats.forEach(stat => {
        const key = `${monthNames[stat._id.month - 1]} ${stat._id.year}`;
        if (!chartDataMap[key]) {
            chartDataMap[key] = { name: key, Cash: 0, Stripe: 0 };
        }
        chartDataMap[key][stat._id.method] = stat.total;
    });
    
    const chartData = Object.values(chartDataMap);

    res.status(200).json({
        success: true,
        transactions,
        chartData
    });
});
