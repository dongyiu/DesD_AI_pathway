import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AtSign,
  Lock,
  User,
  LogIn,
  Users,
  Sun,
  Moon,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  UserCheck,
  CircleUser,
  UserCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";
import RoleSelection from '../components/RoleSelection';

// Add email validation function
const validateEmail = (email) => {
  // Regex pattern that allows underscores in domain
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-_]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
};

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
  const [title, setTitle] = useState('');
  const [forename, setForename] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState('Customer');
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

  const handleGuestMode = () => {
    user.continueAsGuest();
    navigate('/workout');
  };

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
  
    // Validate email format
    if (!isLogin && !validateEmail(email)) {
      setErrors({
        email: ['Please enter a valid email address']
      });
      setIsLoading(false);
      return;
    }
  
    try {
      if (isLogin) {
        await user.login(username, password);
        navigate('/');
      } else {
        // Check if email domain is valid for company roles
        if ((role === 'AI Engineer' || role === 'Admin') && !email.endsWith('@ufcfur_15_3.com')) {
          setErrors({
            email: ['Company roles require an email with domain @ufcfur_15_3.com']
          });
          setIsLoading(false);
          return;
        }
        
        console.log("Attempting registration with:", { username, email, role, title, forename, surname });
        
        // Call register with the selected role and personal details
        await user.register(email, username, password, role, title, forename, surname);
        setIsLogin(true);
        
        // Show different messages based on role
        if (role === 'Customer') {
          setSuccessMessage('Account created successfully! Please log in.');
        } else {
          setSuccessMessage('Account created! Please wait for admin approval before logging in.');
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        
        // Handle different types of errors
        if (typeof error.response.data === 'object') {
          if (error.response.data.detail) {
            setGeneralError(error.response.data.detail);
          } else if (error.response.data.non_field_errors) {
            setGeneralError(Array.isArray(error.response.data.non_field_errors) ? 
              error.response.data.non_field_errors[0] : error.response.data.non_field_errors);
          } else {
            // Set field-specific errors
            setErrors(error.response.data || {});
            setGeneralError('Please correct the errors below.');
          }
        } else {
          setGeneralError('An unexpected error occurred. Please try again.');
        }
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

  // Handle role change
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // If user had previously entered an email with the wrong domain, clear the error
    if (errors.email) {
      setErrors({...errors, email: null});
    }
  };

  return (
    <div className={`min-h-screen w-full ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900' 
        : 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100'
      } py-16 px-4 overflow-y-auto`}>
      
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

      <div className="flex justify-center mt-12">
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
                  <>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className={`block mb-2 flex items-center text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <AtSign className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                        }`} />
                        Email
                      </label>
                      <div className="relative group">
                        <input 
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                              : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          } ${errors.email ? 'border-red-500' : ''}`}
                          placeholder="Enter your email"
                          required
                        />
                        {errors.email && (
                          <p className={`mt-2 text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                            {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                          </p>
                        )}
                      </div>
                    </motion.div>

                    {/* Title Field */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className={`block mb-2 flex items-center text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <CircleUser className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                        }`} />
                        Title
                      </label>
                      <div className="relative group">
                        <select 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                              : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                        >
                          <option value="">Select a title</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Miss">Miss</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                          <option value="Prof">Professor</option>
                        </select>
                      </div>
                    </motion.div>

                    {/* Forename Field */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className={`block mb-2 flex items-center text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <User className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                        }`} />
                        Forename
                      </label>
                      <div className="relative group">
                        <input 
                          type="text"
                          value={forename}
                          onChange={(e) => setForename(e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                              : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                          placeholder="Enter your first name"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Surname Field */}
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className={`block mb-2 flex items-center text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <User className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                        }`} />
                        Surname
                      </label>
                      <div className="relative group">
                        <input 
                          type="text"
                          value={surname}
                          onChange={(e) => setSurname(e.target.value)}
                          className={`w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-gray-700/70 text-white border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500' 
                              : 'bg-white text-gray-900 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                          }`}
                          placeholder="Enter your last name"
                          required
                        />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className={`block mb-2 flex items-center text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Lock className={`w-4 h-4 mr-2 ${
                    isDarkMode ? 'text-purple-400' : 'text-indigo-500'
                  }`} />
                  Password
                </label>
                <div className="relative group">
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

              {/* Role selection for registration */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <RoleSelection 
                      selectedRole={role}
                      onRoleChange={handleRoleChange}
                      isDarkMode={isDarkMode}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg ${
                  isDarkMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                } transition-colors duration-300 flex items-center justify-center font-medium`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mr-2" />
                    Sign Up
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 space-y-4">
              {/* Guest Mode Button */}
              <motion.button
                onClick={handleGuestMode}
                className={`w-full py-3 px-4 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700/70 hover:bg-gray-600/80 text-white border border-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                } transition-all duration-300 flex items-center justify-center font-medium`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserCircle className="w-5 h-5 mr-2" />
                Continue as Guest
              </motion.button>

              {/* Toggle between Login/Signup */}
              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className={`text-sm font-medium ${
                    isDarkMode
                      ? 'text-purple-400 hover:text-purple-300'
                      : 'text-indigo-600 hover:text-indigo-800'
                  } transition-colors duration-300`}
                >
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;