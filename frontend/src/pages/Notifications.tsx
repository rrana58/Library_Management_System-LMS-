import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Loader2, Info, AlertCircle, ShieldCheck, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notification/me');
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const { data } = await api.put(`/notification/${id}/read`);
      if (data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data } = await api.put('/notification/me/read-all');
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('All notifications cleared');
      }
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Welcome': return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'Password': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'Reservation': return <Bell className="h-5 w-5 text-blue-500" />;
      case 'Payment': return <CreditCard className="h-5 w-5 text-purple-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Notifications</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Stay updated with your library activities.</p>
        </div>
        <div className="flex items-center space-x-4">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
            >
              Mark all as read
            </button>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl text-blue-700 dark:text-blue-400 text-sm font-bold">
            {notifications.filter(n => !n.isRead).length} Unread
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(
                  "p-6 rounded-3xl border transition-all flex items-start space-x-4",
                  n.isRead ? "bg-white border-gray-100 opacity-75" : "bg-blue-50/50 border-blue-100 shadow-sm"
                )}
              >
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <p className={cn("text-sm leading-relaxed", n.isRead ? "text-gray-600" : "text-gray-900 font-medium")}>
                    {n.message}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-2 block font-medium uppercase tracking-wider">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">You don't have any notifications at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
