import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import {  Shield, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const Payment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, bookId, bookTitle } = location.state || { amount: 0, bookId: '', bookTitle: '' };

  useEffect(() => {
    if (!amount || !bookId) {
      navigate('/dashboard');
    }
  }, [amount, bookId, navigate]);

  const handleKhaltiPayment = async () => {
    setLoading(true);
    try {
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data } = await api.post(`/payment/verify`, { bookId, amount });
      if (data.success) {
        setSuccess(true);
        toast.success('Payment successful!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-16 w-16" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your fine for <span className="font-bold text-gray-900 dark:text-white">"{bookTitle}"</span> has been cleared.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Secure Payment</h1>
          <div className="w-9"></div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Book Title</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{bookTitle}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-base font-bold text-gray-900 dark:text-white">Total Fine</span>
            <span className="text-2xl font-extrabold text-blue-600">NRP {amount.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleKhaltiPayment}
            disabled={loading}
            className="w-full flex items-center justify-center py-4 px-4 bg-[#5C2D91] text-white font-bold rounded-xl hover:bg-[#4a2475] transition-all shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <img 
                  src="https://khalti.com/static/img/logo1.png" 
                  alt="Khalti" 
                  className="h-6 mr-2 invert brightness-0"
                  referrerPolicy="no-referrer"
                />
                Pay with Khalti
              </>
            )}
          </button>

          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-6">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Secure 256-bit SSL Encrypted Payment</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Payment;
