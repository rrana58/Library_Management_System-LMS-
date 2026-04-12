import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Plus, BookOpen, CheckCircle, Loader2, X, TrendingUp, Users, ShieldAlert, Edit, Trash2, Library, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface BorrowRecord {
  _id: string;
  user: { name: string; email: string };
  book: { title: string };
  reservationStatus: string;
  dueDate: string;
}

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  scheduledForDeletion?: string;
  deletionRequestedAt?: string;
  isPermanentDeleted?: boolean;
  avatar?: {
    url: string;
  };
}

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
}

const AdminDashboard: React.FC = () => {
  const [borrowedRecords, setBorrowedRecords] = useState<BorrowRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<'records' | 'users' | 'inventory' | 'deletions'>('records');
  const [loading, setLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState({ title: '', author: '', description: '', price: 0, quantity: 0, category: 'Fiction' });
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', avatar: null as File | null });
  const [userRoleFilter, setUserRoleFilter] = useState<'All' | 'Admin' | 'User'>('All');

  const [categoryData, setCategoryData] = useState<{ name: string, value: number }[]>([]);
  const [totalBorrowed, setTotalBorrowed] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, usersRes, statsRes, booksRes] = await Promise.all([
        api.get('/borrow/borrowed-books-by-users'),
        api.get('/user/admin/all-users'),
        api.get('/borrow/admin/stats'),
        api.get('/book/all')
      ]);

      if (recordsRes.data.success) {
        setBorrowedRecords(recordsRes.data.borrowedRecords);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }
      if (statsRes.data.success) {
        setCategoryData(statsRes.data.inventoryDistribution);
        setTotalBorrowed(statsRes.data.totalBorrowed);
        setTotalOverdue(statsRes.data.totalOverdue);
      }
      if (booksRes.data.success) {
        setBooks(booksRes.data.books);
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

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/book/admin/add', newBook);
      if (data.success) {
        toast.success('Book added successfully');
        setShowAddBook(false);
        setNewBook({ title: '', author: '', description: '', price: 0, quantity: 0, category: 'Fiction' });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add book');
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.avatar) return toast.error('Please upload an avatar for the admin');

    const formData = new FormData();
    formData.append('name', newAdmin.name);
    formData.append('email', newAdmin.email);
    formData.append('password', newAdmin.password);
    formData.append('avatar', newAdmin.avatar);

    try {
      const { data } = await api.post('/user/add/new-admin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        toast.success('Admin registered successfully');
        setShowAddAdmin(false);
        setNewAdmin({ name: '', email: '', password: '', avatar: null });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register admin');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { data } = await api.put(`/user/admin/update-role/${userId}`, { role: newRole });
      if (data.success) {
        toast.success('User role updated');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
    try {
      const { data } = await api.delete(`/user/admin/delete-user/${userId}`);
      if (data.success) {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleCollect = async (borrowId: string) => {
    try {
      const { data } = await api.post(`/borrow/collect/${borrowId}`);
      if (data.success) {
        toast.success(data.message);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Collection failed');
    }
  };

  const handleApproveReturn = async (borrowId: string) => {
    try {
      const { data } = await api.post(`/borrow/admin/confirm-return/${borrowId}`);
      if (data.success) {
        toast.success(data.message);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve return');
    }
  };

  const handleRejectReturn = async (borrowId: string) => {
    if (!window.confirm("Are you sure you want to reject this return? It will revert to 'Borrowed'.")) return;
    try {
      const { data } = await api.post(`/borrow/admin/reject-return/${borrowId}`);
      if (data.success) {
        toast.success(data.message);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject return');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      const { data } = await api.delete(`/book/delete/${bookId}`);
      if (data.success) {
        toast.success('Book deleted');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete book');
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      const { data } = await api.put(`/book/admin/update/${editingBook._id}`, editingBook);
      if (data.success) {
        toast.success('Book updated successfully');
        setEditingBook(null);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update book');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage library inventory and track system professionalism metrics.</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddAdmin(true)}
            className="inline-flex items-center px-6 py-3 border border-gray-200 dark:border-gray-700 text-sm font-bold rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Add New Admin
          </button>
          <button
            onClick={() => setShowAddBook(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Book
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* Analytics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                    <Library className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory Distribution</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total books across categories</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Pie Chart View</span>
                </div>
              </div>

              <div className="h-80 w-full relative min-h-80">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%" debounce={1}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: 'none',
                          borderRadius: '16px',
                          color: '#fff',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-linear-to-br from-indigo-600 to-blue-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert className="w-24 h-24" />
              </div>
              <div className="flex items-center space-x-2 mb-8 relative z-10">
                <TrendingUp className="w-5 h-5 text-blue-100" />
                <h2 className="text-lg font-bold">Borrowing Status</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
                <div className="space-y-6">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Active Borrowed</div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-black">{totalBorrowed}</span>
                      <span className="text-sm font-medium text-blue-200">Books</span>
                    </div>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur-md p-4 rounded-2xl border border-red-500/20">
                    <div className="text-red-100 text-xs font-bold uppercase tracking-wider mb-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Overdue
                    </div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-4xl font-black text-red-100">{totalOverdue}</span>
                      <span className="text-sm font-medium text-red-200">Pending</span>
                    </div>
                  </div>
                </div>

                <div className="h-56 w-full relative min-h-56">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%" debounce={1}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'On-Time', value: totalBorrowed - totalOverdue },
                            { name: 'Overdue', value: totalOverdue }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          <Cell fill="#60a5fa" />
                          <Cell fill="#f87171" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <span className="text-[10px] font-bold uppercase">On-Time</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      <span className="text-[10px] font-bold uppercase">Overdue</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-[10px] font-bold uppercase tracking-widest flex justify-between">
                <span>Intelligent Monitoring</span>
                <span className="text-blue-200 italic">Sync: Active</span>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('records')}
              className={cn(
                "pb-4 text-sm font-bold transition-all border-b-2",
                activeTab === 'records' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Borrowing Records
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                "pb-4 text-sm font-bold transition-all border-b-2",
                activeTab === 'users' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "pb-4 text-sm font-bold transition-all border-b-2",
                activeTab === 'inventory' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Book Inventory
            </button>
            <button
              onClick={() => setActiveTab('deletions')}
              className={cn(
                "pb-4 text-sm font-bold transition-all border-b-2",
                activeTab === 'deletions' ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Account Deletions
            </button>
          </div>

          {activeTab === 'records' ? (
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center">
                <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Borrowing & Reservation Records</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Book</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {borrowedRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{record.user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{record.user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 font-medium">{record.book?.title || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            record.reservationStatus === 'Reserved' ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300" :
                              record.reservationStatus === 'Returned' ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300" :
                                record.reservationStatus === 'PendingReturn' ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300" :
                                  "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
                          )}>
                            {record.reservationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(record.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.reservationStatus === 'Reserved' && (
                            <button
                              onClick={() => handleCollect(record._id)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-bold flex items-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Collect
                            </button>
                          )}
                          {record.reservationStatus === 'PendingReturn' && (
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleApproveReturn(record._id)}
                                className="text-green-600 hover:text-green-900 text-sm font-bold flex items-center bg-green-50 px-3 py-1 rounded-full w-full justify-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectReturn(record._id)}
                                className="text-red-600 hover:text-red-900 text-sm font-bold flex items-center bg-red-50 px-3 py-1 rounded-full w-full justify-center"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : activeTab === 'users' ? (
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">User Management (RBAC)</h2>
                </div>
                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                  {(['All', 'Admin', 'User'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setUserRoleFilter(role)}
                      className={cn(
                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                        userRoleFilter === role
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      )}
                    >
                      {role}s
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Role</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.filter(u => (userRoleFilter === 'All' || u.role === userRoleFilter) && !u.isPermanentDeleted).map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {u.avatar?.url ? (
                              <img src={u.avatar.url} alt={u.name} className="w-10 h-10 rounded-full object-cover mr-4 border border-gray-200 dark:border-gray-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-4 border border-blue-200 dark:border-blue-800">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</div>
                                {u.scheduledForDeletion && (
                                  <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending Deletion</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            u.role === 'Admin' ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleUpdateRole(u._id, u.role === 'Admin' ? 'User' : 'Admin')}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-bold flex items-center"
                            >
                              <ShieldAlert className="w-4 h-4 mr-1" />
                              Toggle Admin
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-bold flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : activeTab === 'inventory' ? (
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center">
                  <Library className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Global Book Inventory</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Book</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty Overview</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {books.map((b) => (
                      <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900 dark:text-white max-w-xs truncate">{b.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{b.author}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{b.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-300">
                          {b.quantity} Left <span className="text-gray-400 text-xs">(NRP {b.price})</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-4">
                            <button onClick={() => setEditingBook(b)} className="text-blue-600 hover:text-blue-900 flex items-center transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteBook(b._id)} className="text-red-500 hover:text-red-700 flex items-center transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : activeTab === 'deletions' ? (
            <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center">
                <Trash2 className="w-5 h-5 text-red-600 mr-2" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Withdrawal & Erasure Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Created Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permanently Deleted Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {users.filter(u => u.scheduledForDeletion || u.isPermanentDeleted).map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{u.email} ({u.role})</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {u.scheduledForDeletion ? new Date(u.scheduledForDeletion).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            u.isPermanentDeleted
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                              : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                          )}>
                            {u.isPermanentDeleted ? 'Deleted' : 'In Process'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!u.isPermanentDeleted && (
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-red-600 hover:text-red-900 text-xs font-bold"
                            >
                              Force Delete Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      )}

      {showAddBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Book</h2>
              <button onClick={() => setShowAddBook(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddBook} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fiction, Science..."
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (NRP)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newBook.price}
                    onChange={(e) => setNewBook({ ...newBook, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newBook.quantity}
                    onChange={(e) => setNewBook({ ...newBook, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Save Book
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showAddAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register New Admin</h2>
              <button onClick={() => setShowAddAdmin(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleRegisterAdmin} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Profile Image</label>
                <input
                  type="file"
                  required
                  accept="image/*"
                  onChange={(e) => setNewAdmin({ ...newAdmin, avatar: e.target.files?.[0] || null })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
              >
                Register Admin
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-2xl font-bold text-gray-900">Edit Book Overview</h2>
              <button onClick={() => setEditingBook(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateBook} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingBook.title}
                    onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingBook.category}
                    onChange={(e) => setEditingBook({ ...editingBook, category: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingBook.description}
                  onChange={(e) => setEditingBook({ ...editingBook, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (NRP)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingBook.price}
                    onChange={(e) => setEditingBook({ ...editingBook, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editingBook.quantity}
                    onChange={(e) => setEditingBook({ ...editingBook, quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg"
              >
                Apply Changes
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
