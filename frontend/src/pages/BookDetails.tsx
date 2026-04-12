import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Book as BookIcon, User, DollarSign, Clock, Loader2, ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  quantity: number;
  availability: boolean;
}

const BookDetails: React.FC = () => {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchBook = async () => {
    try {
      const [bookRes, userRes] = await Promise.all([
        api.get(`/book/details/${id}`),
        user ? api.get('/user/saved-books') : Promise.resolve({ data: { success: false, savedBooks: [] } })
      ]);
      
      if (bookRes.data.success) {
        setBook(bookRes.data.book);
      }
      if (userRes.data.success) {
        setIsSaved(userRes.data.savedBooks.some((b: any) => b._id === id));
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const handleToggleSave = async () => {
    if (!user) return toast.error('Please login to save books');
    try {
      const { data } = await api.post(`/user/save-book/${id}`);
      if (data.success) {
        toast.success(data.message);
        setIsSaved(!isSaved);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleReserve = async () => {
    if (!user) return toast.error('Please login to reserve books');
    try {
      const { data } = await api.post(`/borrow/reserve/${id}`);
      if (data.success) {
        toast.success(data.message);
        fetchBook();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reservation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Library
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl shadow-blue-100 dark:shadow-none border border-gray-100 dark:border-gray-700"
            >
              <BookIcon className="w-24 h-24 text-blue-600" />
            </motion.div>
          </div>
          
          <div className="md:w-2/3 p-10 md:p-16">
            <div className="flex justify-between items-start mb-6">
              <span className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest",
                book.availability ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {book.availability ? 'Available' : 'Out of Stock'}
              </span>
              <div className="flex items-center text-gray-900 dark:text-white text-2xl font-black">
                <DollarSign className="h-6 w-6 text-green-600" />
                {book.price.toFixed(2)}
              </div>
            </div>

            <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">{book.title}</h1>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400 text-lg mb-8">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              <span className="font-medium">by {book.author}</span>
            </div>

            <div className="space-y-6 mb-10">
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Description</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                {book.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-10">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                  <Clock className="w-3 h-3 mr-1" />
                  Inventory
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{book.quantity} copies</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Status
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{book.availability ? 'Ready to Borrow' : 'Reserved'}</div>
              </div>
            </div>

            {user?.role === 'User' && (
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleToggleSave}
                  className={cn(
                    "flex-1 flex items-center justify-center px-8 py-4 font-bold rounded-2xl transition-all",
                    isSaved 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none"
                  )}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isSaved ? "Already Saved" : "Save for Later"}
                </button>
                <button
                  onClick={handleReserve}
                  disabled={!book.availability}
                  className="flex-1 flex items-center justify-center px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reserve for 24h
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
