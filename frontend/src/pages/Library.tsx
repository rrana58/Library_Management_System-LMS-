import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Search, Book as BookIcon, User, Clock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

const Library: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBooks = async () => {
    try {
      const [booksRes, userRes] = await Promise.all([
        api.get('/book/all'),
        user ? api.get('/user/saved-books') : Promise.resolve({ data: { success: false, savedBooks: [] } })
      ]);
      
      if (booksRes.data.success) {
        setBooks(booksRes.data.books);
      }
      if (userRes.data.success) {
        setSavedBookIds(userRes.data.savedBooks.map((b: any) => b._id));
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleToggleSave = async (id: string) => {
    if (!user) return toast.error('Please login to save books');
    try {
      const { data } = await api.post(`/user/save-book/${id}`);
      if (data.success) {
        toast.success(data.message);
        if (savedBookIds.includes(id)) {
            setSavedBookIds(prev => prev.filter(bid => bid !== id));
        } else {
            setSavedBookIds(prev => [...prev, id]);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleReserve = async (id: string) => {
    if (!user) return toast.error('Please login to reserve books');
    try {
      const { data } = await api.post(`/borrow/reserve/${id}`);
      if (data.success) {
        toast.success(data.message);
        fetchBooks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reservation failed');
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Library Catalog</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Browse and discover your next favorite read</p>
        </div>
        
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-800 rounded-xl leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <motion.div
              key={book._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all group"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <BookIcon className="h-6 w-6" />
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    book.availability ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {book.availability ? 'Available' : 'Out of Stock'}
                  </span>
                </div>
                
                <Link to={`/book/${book._id}`}>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{book.title}</h3>
                </Link>
                <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400 text-sm">
                  <User className="h-4 w-4 mr-1.5" />
                  {book.author}
                </div>
                
                {expandedBookId === book._id && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
                  >
                    {book.description}
                  </motion.p>
                )}

                <button 
                  onClick={() => setExpandedBookId(expandedBookId === book._id ? null : book._id)}
                  className="mt-4 inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-all"
                >
                  {expandedBookId === book._id ? 'Hide Details' : 'View Details'}
                  <ArrowRight className={cn("w-3 h-3 ml-1 transition-transform", expandedBookId === book._id ? "rotate-90" : "")} />
                </button>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center text-gray-900 dark:text-white font-bold">
                    <span className="mr-1 text-sm font-bold text-green-600">NRP</span>
                    {book.price.toFixed(2)}
                  </div>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Qty: {book.quantity}
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  {user?.role === 'User' && (
                    <button
                      onClick={() => handleToggleSave(book._id)}
                      className={cn(
                          "flex items-center justify-center px-4 py-2.5 border text-sm font-bold rounded-xl transition-all shadow-sm",
                          savedBookIds.includes(book._id)
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      )}
                    >
                      {savedBookIds.includes(book._id) ? 'Saved' : 'Save Later'}
                    </button>
                  )}
                  <button
                    onClick={() => handleReserve(book._id)}
                    disabled={!book.availability || user?.role === 'Admin'}
                    className="flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-100 dark:shadow-none"
                  >
                    Reserve Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No books found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Try adjusting your search or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default Library;
