import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AtSign, 
  Lock, 
  User, 
  LogIn, 
  LogOut, 
  Users,
  Sun,
  Moon,
  AlertCircle,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

const AuthPage = () => {
  const user = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();

  // Check system preference on initial load
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  // Update dark mode class on body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user.user) navigate('/');
  }, [user.user, navigate]);

  // Reset errors when switching between login and signup
  useEffect(() => {
    setGeneralError('');
    setSuccessMessage('');
    setErrors({});
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');
    setErrors({});
    setIsLoading(true);
  
    try {
      if (isLogin) {
        await user.login(username, password);
        navigate('/');
      } else {
        await user.register(email, username, password);
        setIsLogin(true);
        setSuccessMessage('Account created successfully! Please log in.');
      }
    } catch (error) {
      if (error.response) {
        setErrors(error.response.data || {});
        setGeneralError('An error occurred. Please try again.');
      } else {
        setGeneralError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`min-h-screen fixed inset-0 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100'
      } flex items-center justify-center p-4 overflow-y-auto`}>
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
      </div>
      
      {/* Navigation and Dark Mode Toggle */}
      <div className="fixed top-4 flex justify-between w-full px-4 z-10">
        <motion.button 
          onClick={() => navigate("/")}
          className={`p-2 rounded-lg flex items-center ${
            isDarkMode 
              ? 'bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-700/80' 
              : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gray-100/80'
          } transition-all duration-300 shadow-md`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">Home</span>
        </motion.button>
        
        <motion.button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-800/80 backdrop-blur-sm text-purple-400 hover:bg-gray-700/80' 
              : 'bg-white/80 backdrop-blur-sm text-indigo-600 hover:bg-gray-100/80'
          } transition-all duration-300 shadow-md`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className={`w-full max-w-md mx-4 ${
          isDarkMode 
            ? 'bg-gray-800/90 backdrop-blur-md border border-white/5' 
            : 'bg-white/90 backdrop-blur-md border border-gray-100'
        } rounded-xl overflow-hidden shadow-xl`}
      >
        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-700' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-700'
              } w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4`}
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className={`mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {isLogin ? 'Log in to access your account' : 'Sign up to get started'}
            </p>
          </div>

          <AnimatePresence>
            {generalError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 mb-6 rounded-lg flex items-center ${
                  isDarkMode 
                  ? 'bg-red-900/50 backdrop-blur-sm text-red-200 border border-red-800/30' 
                  : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{generalError}</span>
              </motion.div>
            )}
            
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 mb-6 rounded-lg flex items-center ${
                  isDarkMode 
                  ? 'bg-green-900/50 backdrop-blur-sm text-green-200 border border-green-800/30' 
                  : 'bg-green-50 text-green-800 border border-green-200'
                }`}
              >
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className={`block mb-2 flex items-center text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <User className={`w-4 h-4 mr-2 ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                }`} />
                Username
              </label>
              <div className={`relative group`}>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                      : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </motion.div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className={`block mb-2 flex items-center text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <AtSign className={`w-4 h-4 mr-2 ${
                      isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                    }`} />
                    Email
                  </label>
                  <div className={`relative group`}>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                          : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                      placeholder="Enter your email"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isLogin ? 0.2 : 0.3 }}
            >
              <label className={`block mb-2 flex items-center text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Lock className={`w-4 h-4 mr-2 ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                }`} />
                Password
              </label>
              <div className={`relative group`}>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                      : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full mt-8 py-3 px-4 rounded-lg flex items-center justify-center 
                font-medium text-white shadow-lg transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
                ${isDarkMode 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-purple-900/20' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-900/20'
                }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-white"></div>
              ) : (
                <>
                  {isLogin ? (
                    <LogIn className="w-5 h-5 mr-2" />
                  ) : (
                    <User className="w-5 h-5 mr-2" />
                  )}
                  {isLogin ? 'Log in' : 'Create Account'}
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <motion.button 
              onClick={() => setIsLogin(!isLogin)}
              className={`inline-flex items-center text-sm ${
                isDarkMode 
                  ? 'text-purple-400 hover:text-purple-300' 
                  : 'text-indigo-600 hover:text-indigo-500'
                } transition-colors duration-300`}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLogin 
                ? 'Need an account? Sign Up' 
                : 'Already have an account? Log In'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;