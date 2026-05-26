import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const verified = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (verified.current) return;
      verified.current = true;

      const queryParams = new URLSearchParams(location.search);
      const session_id = queryParams.get('session_id');

      if (!session_id) {
        setLoading(false);
        setErrorMessage('Invalid payment reference (session ID missing).');
        return;
      }

      try {
        const { data } = await api.post('/payment/verify', { session_id });
        if (data.success) {
          setSuccess(true);
          toast.success('Payment verified successfully!');
        }
      } catch (error: any) {
        setErrorMessage(error.response?.data?.message || 'Payment verification failed');
        toast.error(error.response?.data?.message || 'Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 text-center"
      >
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying Payment...</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we verify your transaction securely.</p>
          </div>
        ) : success ? (
          <div>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-16 w-16" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your payment has been successfully processed and verified.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <XCircle className="h-16 w-16" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Payment Failed</h2>
            <p className="text-red-500 mb-8">{errorMessage}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
