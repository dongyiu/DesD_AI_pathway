import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Home, Settings, LogOut, User, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Mobile Menu Modal
 * Hamburger menu for mobile navigation and settings
 */
const MobileMenuModal = ({
  isOpen,
  onClose,
  isDarkMode,
  toggleDarkMode,
  showMuscleVisualizer,
  toggleMuscleVisualizer,
  user,
  handleLogout
}) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogoutClick = () => {
    handleLogout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Menu Panel (slide from left) */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 border-r border-white/10 pt-safe pb-safe"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-white text-xl font-bold">Menu</h2>
                <motion.button
                  onClick={onClose}
                  className="p-2 -mr-2 touch-manipulation"
                  whileTap={{ scale: 0.9 }}
                >
                  <XCircle className="w-6 h-6 text-white" />
                </motion.button>
              </div>

              {/* User Info */}
              {user && (
                <div className="px-6 py-4 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.username || 'User'}</div>
                      <div className="text-gray-400 text-sm">{user.email || ''}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-4">
                {/* Navigation */}
                <div className="px-3 mb-6">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                    Navigation
                  </div>
                  <motion.button
                    onClick={() => handleNavigation('/')}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                             text-white hover:bg-white/5 active:bg-white/10 touch-manipulation
                             transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <Home className="w-5 h-5" />
                    <span>Home</span>
                  </motion.button>
                  {user && (
                    <motion.button
                      onClick={() => handleNavigation('/settings')}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                               text-white hover:bg-white/5 active:bg-white/10 touch-manipulation
                               transition-colors"
                      whileTap={{ scale: 0.98 }}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </motion.button>
                  )}
                </div>

                {/* Display Options */}
                <div className="px-3 mb-6">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                    Display
                  </div>

                  {/* Dark Mode Toggle */}
                  <motion.button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg
                             text-white hover:bg-white/5 active:bg-white/10 touch-manipulation
                             transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      <span>Dark Mode</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      isDarkMode ? 'bg-purple-600' : 'bg-gray-600'
                    }`}>
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full m-0.5"
                        animate={{ x: isDarkMode ? 22 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.button>

                  {/* Muscle Visualizer Toggle */}
                  <motion.button
                    onClick={toggleMuscleVisualizer}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg
                             text-white hover:bg-white/5 active:bg-white/10 touch-manipulation
                             transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      {showMuscleVisualizer ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      <span>Muscle Visualizer</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors ${
                      showMuscleVisualizer ? 'bg-purple-600' : 'bg-gray-600'
                    }`}>
                      <motion.div
                        className="w-5 h-5 bg-white rounded-full m-0.5"
                        animate={{ x: showMuscleVisualizer ? 22 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.button>
                </div>

                {/* Account Actions */}
                {user && (
                  <div className="px-3">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
                      Account
                    </div>
                    <motion.button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                               text-red-400 hover:bg-red-500/10 active:bg-red-500/20 touch-manipulation
                               transition-colors"
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10">
                <div className="text-gray-500 text-xs text-center">
                  GymTracker Mobile v1.0
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuModal;
