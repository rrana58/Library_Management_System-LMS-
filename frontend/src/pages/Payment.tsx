import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Shield, Loader2, ArrowLeft, CreditCard } from 'lucide-react';

const Payment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, paymentType, referenceId, purposeTitle } = location.state || {};

  useEffect(() => {
    if (!amount || !paymentType || !referenceId) {
      navigate('/dashboard');
    }
  }, [amount, paymentType, referenceId, navigate]);

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payment/create-checkout-session', { paymentType, referenceId });
      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initialize checkout');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Secure Checkout</h1>
          <div className="w-9"></div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl mb-8 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Payment For</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[60%]">{purposeTitle || "Online Payment"}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-base font-bold text-gray-900 dark:text-white">Amount</span>
            <span className="text-2xl font-extrabold text-blue-600">USD ${(amount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleStripeCheckout}
            disabled={loading}
            className="w-full flex items-center justify-center py-4 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-6 w-6 mr-2" />
                Proceed to Stripe
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
