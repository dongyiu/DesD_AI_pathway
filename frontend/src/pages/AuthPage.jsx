import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AtSign, 
  Lock, 
  User, 
  LogIn, 
  LogOut, 
  Users,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';

import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  console.log('auth page')
  const { login, register, user } = useAuth();
  console.log('error not in first useAuth')
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
    if (user) navigate('/');
  }, [user, navigate]);

  // Reset errors when switching between login and signup
  useEffect(() => {
    setErrors({});
    setGeneralError('');
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setIsLoading(true);
  
    try {
      if (isLogin) {
        await login(username, password);
        console.log('loggedin')
        navigate('/');
      } else {
        await register(email, username, password);
        setIsLogin(true);
        setGeneralError('Account created! Please log in.');
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

  // Helper function to render field errors
  const renderFieldError = (fieldName) => {
    if (!errors[fieldName]) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm flex items-center mt-1 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}
      >
        <AlertCircle className="w-4 h-4 mr-1" />
        {Array.isArray(errors[fieldName]) 
          ? errors[fieldName][0] 
          : errors[fieldName]}
      </motion.div>
    );
  };

  return (
    <div className={`fixed inset-0 ${isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-indigo-500 text-gray-100' 
        : 'bg-gradient-to-br from-gray-100 to-indigo-500 text-gray-900'
      } transition-colors duration-300 overflow-y-auto flex items-center justify-center p-4`}>
      {/* Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 p-2 rounded-full transition-all duration-300 ${
          isDarkMode 
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
            : 'bg-gray-200 text-indigo-600 hover:bg-gray-300'
        }`}
        aria-label="Toggle Dark Mode"
      >
        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-md mx-4 ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700 shadow-2xl' 
            : 'bg-white shadow-2xl'
        } rounded-2xl overflow-hidden`}
      >
        <div className="p-8">
          {/* Logo and Title */}
          <div className="flex items-center justify-center mb-6">
            <Users className={`w-12 h-12 ${
              isDarkMode ? 'text-purple-400' : 'text-indigo-600'
            } mr-3`} />
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
          </div>

          {/* General Error Message */}
          {generalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 mb-4 rounded-lg flex items-center ${
                isDarkMode 
                ? (generalError.includes('successfully') 
                  ? 'bg-green-900 text-green-200' 
                  : 'bg-red-900 text-red-200')
                : (generalError.includes('successfully') 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200')
              }`}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{generalError}</span>
            </motion.div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username field (shown for registration and login) */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <label className={`block mb-2 flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <User className={`w-5 h-5 mr-2 ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                }`} />
                Username
              </label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:ring-purple-500' 
                    : 'bg-white text-gray-900 border border-gray-300 focus:ring-indigo-500'
                } ${errors.username ? (isDarkMode ? 'border-red-500' : 'border-red-600') : ''}`}
                placeholder="Enter your username"
                required
              />
              {renderFieldError('username')}
            </motion.div>

            {/* Email field (only shown for registration) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <label className={`block mb-2 flex items-center ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <AtSign className={`w-5 h-5 mr-2 ${
                    isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                  }`} />
                  Email
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:ring-purple-500' 
                      : 'bg-white text-gray-900 border border-gray-300 focus:ring-indigo-500'
                  } ${errors.email ? (isDarkMode ? 'border-red-500' : 'border-red-600') : ''}`}
                  placeholder="Enter your email"
                  required={!isLogin}
                />
                {renderFieldError('email')}
              </motion.div>
            )}

            {/* Password field */}
            <div className="relative">
              <label className={`block mb-2 flex items-center ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Lock className={`w-5 h-5 mr-2 ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                }`} />
                Password
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:ring-purple-500' 
                    : 'bg-white text-gray-900 border border-gray-300 focus:ring-indigo-500'
                } ${errors.password ? (isDarkMode ? 'border-red-500' : 'border-red-600') : ''}`}
                placeholder="Enter your password"
                required
              />
              {renderFieldError('password')}
              {errors.non_field_errors && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm flex items-center mt-1 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {Array.isArray(errors.non_field_errors) 
                    ? errors.non_field_errors[0] 
                    : errors.non_field_errors}
                </motion.div>
              )}
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center ${
                isDarkMode
                  ? isLoading 
                    ? 'bg-purple-800 text-white cursor-not-allowed' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  : isLoading 
                    ? 'bg-indigo-400 text-white cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              {!isLoading && (isLogin ? <LogIn className="ml-2" /> : <Users className="ml-2" />)}
            </motion.button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="text-center mt-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className={`hover:underline ${
                isDarkMode 
                  ? 'text-purple-400 hover:text-purple-300' 
                  : 'text-blue-600 hover:text-blue-500'
                }`}
              disabled={isLoading}
            >
              {isLogin 
                ? 'Need an account? Sign Up' 
                : 'Already have an account? Log In'}
            </button>
          </div>
          <div className="text-center mt-4">
            <button 
              onClick={()=>navigate("/")}
              className={`hover:underline ${
                isDarkMode 
                  ? 'text-purple-400 hover:text-purple-300' 
                  : 'text-blue-600 hover:text-blue-500'
                }`}
            >
              Return Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;