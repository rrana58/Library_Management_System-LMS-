import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, BellRing, MessageSquare, Library, Sun, Moon, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';
import api from '../services/api';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/admin/dashboard';
  const dashboardPath = user?.role === 'Admin' ? '/admin/dashboard' : '/dashboard';

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const { data } = await api.get('/notification/me');
          if (data.success) {
            const unread = data.notifications.some((n: any) => !n.isRead);
            setHasUnread(unread);
          }
        } catch (error) {
          console.error('Failed to fetch notifications');
        }
      };
      fetchNotifications();
    }
  }, [user, location.pathname]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <img src={logo} alt="Logo" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">My Library</span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {user?.role !== 'Admin' && (
                <>
                  <Link to="/library" className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-all ${isActive('/library') ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600'}`}>
                    <Library className="w-4 h-4 mr-1.5" />
                    Library
                  </Link>
                  {user && (
                    <Link to="/chatbot" className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-all ${isActive('/chatbot') ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600'}`}>
                      <MessageSquare className="w-4 h-4 mr-1.5" />
                      Assistant
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {user ? (
              <>
                <Link to="/notifications" className={`p-2 transition-colors relative ${isActive('/notifications') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-blue-600'}`}>
                  {hasUnread ? (
                    <>
                      <BellRing className="h-5 w-5 text-red-500" />
                      <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
                    </>
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </Link>

                <Link to="/settings" className={`p-2 transition-colors ${isActive('/settings') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-blue-600'}`} aria-label="Settings">
                  <SettingsIcon className="h-5 w-5" />
                </Link>
                
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>
                
                <Link to={dashboardPath} className={`flex items-center space-x-2 sm:space-x-3 text-sm font-medium transition-colors p-1.5 rounded-full border ${isDashboard ? 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <div className="hidden sm:flex flex-col text-right pl-2">
                    <span className="text-gray-900 dark:text-white font-bold leading-tight truncate max-w-[120px]">{user.name}</span>
                    <span className="text-[10px] uppercase font-black text-blue-600 dark:text-blue-400 tracking-wider font-mono">{user.role}</span>
                  </div>
                  {user.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden ml-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user?.role !== 'Admin' && (
              <>
                <Link
                  to="/library"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/library') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                >
                  <div className="flex items-center">
                    <Library className="w-5 h-5 mr-3" />
                    Library
                  </div>
                </Link>
                {user && (
                  <Link
                    to="/chatbot"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/chatbot') ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-3" />
                      Assistant
                    </div>
                  </Link>
                )}
              </>
            )}
            {!user && (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
