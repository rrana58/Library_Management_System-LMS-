import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Book, Clock, Calendar, AlertCircle, CheckCircle2, CreditCard, Loader2, Trash2, BarChart2, Bookmark, ArrowRight, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate, Link } from 'react-router-dom';

interface BorrowedBook {
  _id: string;
  book: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returned: boolean;
  fine?: number;
  reservationStatus: string;
}

const Dashboard: React.FC = () => {
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [savedBooks, setSavedBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnModalBook, setReturnModalBook] = useState<BorrowedBook | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);
   const { user } = useAuth();
   const navigate = useNavigate();
   const [userStats, setUserStats] = useState({ borrowed: 0, returned: 0, overdue: 0 });

  useEffect(() => {
    if (user && user.role === 'Admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);


  const fetchData = async () => {
    try {
      const [borrowedRes, savedRes] = await Promise.all([
        api.get('/borrow/my-borrowed-books'),
        api.get('/user/saved-books')
      ]);
      
      if (borrowedRes.data.success) {
        setBorrowedBooks(borrowedRes.data.borrowedBooks);
      }
      if (savedRes.data.success) {
        setSavedBooks(savedRes.data.savedBooks);
      }

      // Fetch user stats
      const statsRes = await api.get('/borrow/my-stats');
      if (statsRes.data.success) {
        setUserStats(statsRes.data.stats);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const executeReturn = async (method: 'Cash' | 'Stripe') => {
    if (!returnModalBook) return;
    setProcessingReturn(true);
    try {
      const { data } = await api.put(`/borrow/return-borrowed-book/${returnModalBook.book}`, { email: user?.email, paymentMethod: method });
      if (data.success) {
        if (method === 'Stripe') {
           setReturnModalBook(null);
           navigate('/payment', { 
             state: { 
               paymentType: 'book_return',
               referenceId: data.borrow._id, 
               amount: (data.borrow.price || 0) + (data.borrow.fine || 0), 
               purposeTitle: `Book Return: "${returnModalBook.bookTitle}"`
             } 
           });
           return;
        }
        toast.success(data.message);
        setReturnModalBook(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Return request failed');
    } finally {
      setProcessingReturn(false);
    }
  };

  const handleCancelReservation = async (borrowId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const { data } = await api.put(`/borrow/unreserve/${borrowId}`);
      if (data.success) {
        toast.success(data.message);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleRequestDeletion = async () => {
    if (!window.confirm('Are you sure you want to schedule your account for deletion? You will have 7 days to cancel this request before all your data is permanently removed.')) return;
    
    try {
      const { data } = await api.delete('/user/me/delete');
      if (data.success) {
        toast.success(data.message);
        // Refresh the page or user state to show the countdown
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request deletion');
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const { data } = await api.put('/user/me/cancel-deletion');
      if (data.success) {
        toast.success(data.message);
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel deletion');
    }
  };

  const activeBorrows = borrowedBooks.filter(b => !b.returned);
  const history = borrowedBooks.filter(b => b.returned);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0 text-center md:text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">User Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back, {user?.name}. Manage your professional library profile.</p>
        </div>
        {!user?.scheduledForDeletion && (
          <button
            onClick={handleRequestDeletion}
            className="inline-flex items-center px-4 py-2 border border-red-200 dark:border-red-900 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account (Right to Erasure)
          </button>
        )}
      </div>

      {user?.scheduledForDeletion && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-3xl flex flex-col md:flex-row items-center justify-between"
        >
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Scheduled for Deletion</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Requested on: <span className="font-bold">{user.deletionRequestedAt ? new Date(user.deletionRequestedAt).toLocaleDateString() : 'Recently'}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanent removal scheduled for: <span className="font-bold">{new Date(user.scheduledForDeletion).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleCancelDeletion}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            Cancel Deletion Request
          </button>
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-12">
          {/* Borrowing Stats Summary Section */}
          <section className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-8">
                <BarChart2 className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Borrowing Summary</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4">
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 group hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Total Borrowed</div>
                      <div className="text-3xl font-black text-gray-900 dark:text-white">{userStats.borrowed}</div>
                    </div>
                    <Book className="w-10 h-10 text-blue-200 dark:text-blue-900/50" />
                  </div>
                  
                  <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50 group hover:bg-green-100 dark:hover:bg-green-900/30 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Total Returned</div>
                      <div className="text-3xl font-black text-gray-900 dark:text-white">{userStats.returned}</div>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-green-200 dark:text-green-900/50" />
                  </div>
                  
                  <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/50 group hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-between">
                    <div>
                      <div className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Overdue Alerts</div>
                      <div className="text-3xl font-black text-gray-900 dark:text-white">{userStats.overdue}</div>
                    </div>
                    <AlertCircle className="w-10 h-10 text-red-200 dark:text-red-900/50" />
                  </div>
                </div>

                <div className="h-72 w-full relative min-h-72">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                      <PieChart>
                      <Pie
                        data={[
                          { name: 'Active Borrowed', value: userStats.borrowed },
                          { name: 'Returned', value: userStats.returned },
                          { name: 'Overdue', value: userStats.overdue }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1500}
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: 'none', 
                          borderRadius: '16px', 
                          color: '#fff' 
                        }} 
                      />
                      <Legend 
                        verticalAlign="middle" 
                        align="right" 
                        layout="vertical"
                        wrapperStyle={{ paddingLeft: '20px' }}
                      />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Saved for Later */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <Bookmark className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved for Later</h2>
              </div>
              <Link to="/library" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                Browse More <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {savedBooks.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {savedBooks.slice(0, 4).map((book, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="aspect-3/4 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4 overflow-hidden relative">
                      {book.image?.url ? (
                        <img src={book.image.url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Book className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-black/60 to-transparent">
                          <p className="text-white text-xs font-bold line-clamp-1">{book.title}</p>
                      </div>
                    </div>
                    <Link
                      to={`/book/${book._id}`}
                      className="w-full py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all flex items-center justify-center"
                    >
                      View Details
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Bookmark className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">No books saved yet. <Link to="/library" className="text-blue-600 dark:text-blue-400 underline">Explore library</Link> to save some!</p>
              </div>
            )}
          </section>

          {/* Active Borrowings */}
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Borrowings</h2>
            </div>
            
            {activeBorrows.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeBorrows.map((borrow, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{borrow.bookTitle}</h3>
                      {borrow.reservationStatus === 'Reserved' ? (
                        <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Reserved</span>
                      ) : (
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>
                      )}
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {borrow.reservationStatus === 'Reserved' ? 'Reserved' : 'Borrowed'}: {new Date(borrow.borrowDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm font-medium text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Due: {new Date(borrow.dueDate).toLocaleDateString()}
                      </div>
                      {borrow.fine && borrow.fine > 0 && (
                        <div className="flex items-center text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Fine: ${borrow.fine.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {borrow.reservationStatus === 'Reserved' ? (
                        <button
                          onClick={() => handleCancelReservation(borrow._id)}
                          className="w-full py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none"
                        >
                          Cancel Reservation
                        </button>
                      ) : (
                        <button
                          onClick={() => setReturnModalBook(borrow)}
                          className="w-full py-2.5 bg-gray-900 dark:bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-gray-200 dark:shadow-none"
                        >
                          Initiate Return
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Book className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">You don't have any active borrowings.</p>
              </div>
            )}
          </section>

          {/* Reading History */}
          <section>
            <div className="flex items-center space-x-2 mb-6">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reading History</h2>
            </div>

            {history.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Book Title</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Borrowed Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {history.map((borrow, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{borrow.bookTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(borrow.borrowDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            Returned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No history available yet.</p>
            )}
          </section>
        </div>
      )}

      {returnModalBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-8 text-center"
          >
            <Book className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Return "{returnModalBook.bookTitle}"</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Please choose your preferred method to clear any potential dues. The book will be marked as returned once an admin confirms your payment/return.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => executeReturn('Stripe')}
                disabled={processingReturn}
                className="w-full py-4 bg-[#5C2D91] text-white font-bold rounded-xl hover:bg-[#4a2475] transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
              >
                {processingReturn ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Pay Online'}
              </button>
              
              <button
                onClick={() => executeReturn('Cash')}
                disabled={processingReturn}
                className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {processingReturn ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Pay via Cash (In branch)'}
              </button>
            </div>
            
            <button
              onClick={() => !processingReturn && setReturnModalBook(null)}
              className="mt-6 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
