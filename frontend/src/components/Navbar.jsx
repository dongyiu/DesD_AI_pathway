import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Sun,
  Moon,
  Bell,
  Menu,
  X,
  User,
  MessageSquare,
  FileText,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = ({ isDarkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuth();
  
  // Loading state
  if (user.loading) {
    return (
      <header className={`
        ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}
        border-b backdrop-blur-md shadow-sm transition-colors duration-300 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Home className={`w-6 h-6 ${
                isDarkMode ? 'text-purple-400' : 'text-indigo-600'
              } mr-2`} />
              <a href="/" className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-600'}`}>
                GymTracker
              </a>
            </div>
            <div className="flex items-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading...
              </span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`
      ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}
      border-b backdrop-blur-md shadow-sm transition-colors duration-300 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <motion.div 
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Home className={`w-6 h-6 ${
              isDarkMode ? 'text-purple-400' : 'text-indigo-600'
            } mr-2`} />
            <a href="/" className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-600'}`}>
              GymTracker
            </a>
          </motion.div>
          
          <div className="hidden md:flex space-x-6">
            <motion.a 
              href="#features" 
              className={`${isDarkMode ? 'text-white hover:text-purple-400' : 'text-gray-600 hover:text-indigo-500'} 
                font-medium text-sm transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Features
            </motion.a>
            <motion.a 
              href="#how-it-works" 
              className={`${isDarkMode ? 'text-white hover:text-purple-400' : 'text-gray-600 hover:text-indigo-500'} 
                font-medium text-sm transition-colors`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              How It Works
            </motion.a>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${
                isDarkMode ? 'bg-gray-800 text-purple-400' : 'bg-gray-100 text-indigo-600'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.button>
            
            {user.user ? (
              <div className="hidden md:flex items-center space-x-4">
                <motion.button 
                  onClick={() => navigate("/dashboard")} 
                  className={`bg-gradient-to-r ${
                    isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'
                  } text-white font-medium py-2 px-5 rounded-lg text-sm transition duration-300 flex items-center space-x-2`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Dashboard</span>
                  <ArrowRight size={14} />
                </motion.button>
                <motion.button 
                  onClick={() => navigate("/settings")}
                  className={`${
                    isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } font-medium py-2 px-4 rounded-lg text-sm transition duration-300`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings size={18} />
                </motion.button>
              </div>
            ) : (
              <motion.button 
                onClick={() => navigate("/auth")} 
                className={`hidden md:flex bg-gradient-to-r ${
                  isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'
                } text-white font-medium py-2 px-5 rounded-lg text-sm transition duration-300 items-center space-x-2`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Log in</span>
                <ArrowRight size={14} />
              </motion.button>
            )}

            <motion.button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className={`md:hidden fixed inset-x-4 top-20 z-40 ${
              isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'
            } backdrop-blur-md rounded-xl p-4 border shadow-lg`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col space-y-4">
              <a 
                href="#features" 
                className={`${isDarkMode ? 'text-white hover:text-purple-400' : 'text-gray-600 hover:text-indigo-500'} 
                  font-medium text-sm py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className={`${isDarkMode ? 'text-white hover:text-purple-400' : 'text-gray-600 hover:text-indigo-500'} 
                  font-medium text-sm py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="/workout" 
                className={`${isDarkMode ? 'text-white hover:text-purple-400' : 'text-gray-600 hover:text-indigo-500'} 
                  font-medium text-sm py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                Workout
              </a>
              
              {user.user ? (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => {
                      navigate("/dashboard");
                      setIsMenuOpen(false);
                    }} 
                    className={`w-full bg-gradient-to-r ${
                      isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'
                    } text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-300 flex items-center justify-between`}
                  >
                    <span>Dashboard</span>
                    <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      navigate("/settings");
                      setIsMenuOpen(false);
                    }} 
                    className={`w-full ${
                      isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } font-medium py-2 px-4 rounded-lg text-sm transition duration-300 flex items-center justify-between`}
                  >
                    <span>My Account</span>
                    <Settings size={14} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    navigate("/auth");
                    setIsMenuOpen(false);
                  }} 
                  className={`w-full bg-gradient-to-r ${
                    isDarkMode ? 'from-purple-500 to-indigo-600' : 'from-indigo-500 to-purple-600'
                  } text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-300 flex items-center justify-between`}
                >
                  <span>Log in</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default NavBar;