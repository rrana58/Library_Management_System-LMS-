import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import Library from './pages/Library';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Chatbot from './pages/Chatbot';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Payment from './pages/Payment';
import BookDetails from './pages/BookDetails';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'Admin') return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 antialiased transition-colors">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/password/forgot" element={<ForgotPassword />} />
                <Route path="/password/reset" element={<ResetPassword />} />
                <Route path="/library" element={<Library />} />
                <Route path="/book/:id" element={<BookDetails />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/chatbot" element={
                  <ProtectedRoute>
                    <Chatbot />
                  </ProtectedRoute>
                } />

                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />

                <Route path="/payment" element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'rounded-2xl font-medium text-sm dark:bg-gray-800 dark:text-white',
                duration: 4000,
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
