import React from 'react';
import { motion } from 'framer-motion';
import { Menu, ChevronDown, UserCircle } from 'lucide-react';

/**
 * Mobile Header Component
 * Displays at the top of the workout page on mobile devices
 * Shows: Menu button, current workout, guest mode indicator, connection status
 */
const MobileHeader = ({
  currentWorkout,
  workoutMap,
  connectionStatus,
  isGuestMode,
  onWorkoutSelect,
  onMenuOpen
}) => {
  // Connection status dot color
  const getStatusColor = () => {
    switch(connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 pt-safe"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Menu button */}
        <motion.button
          onClick={onMenuOpen}
          className="p-2 -ml-2 touch-manipulation active:scale-95 transition-transform"
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="w-6 h-6 text-white" />
        </motion.button>

        {/* Center: Current workout (tap to change) */}
        <motion.button
          onClick={onWorkoutSelect}
          className="flex-1 flex items-center justify-center space-x-2 px-3 touch-manipulation select-none-mobile"
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-white font-medium text-sm truncate max-w-[200px]">
            {workoutMap[currentWorkout]}
          </span>
          <ChevronDown className="w-4 h-4 text-white flex-shrink-0" />
        </motion.button>

        {/* Right: Status indicators */}
        <div className="flex items-center space-x-2">
          {/* Guest mode indicator */}
          {isGuestMode && (
            <motion.div
              className="bg-purple-600/60 px-2 py-1 rounded-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <UserCircle className="w-4 h-4 text-white" />
            </motion.div>
          )}

          {/* Connection status dot */}
          <div className="relative">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} shadow-lg`} />
            {connectionStatus === 'connecting' && (
              <motion.div
                className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getStatusColor()}`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0, 1]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MobileHeader;
