import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Zap } from 'lucide-react';

/**
 * Mobile Stats Drawer Component
 * Swipeable bottom drawer that shows workout statistics
 * Collapsed by default, swipe up to expand
 */
const MobileStatsDrawer = ({
  isOpen,
  onToggle,
  sessionDuration,
  receivedCount,
  currentWorkout,
  predictedWorkout,
  predictionConfidence,
  predictionThreshold,
  predictedMuscleGroup,
  muscleGroupConfidence,
  feedbackLatency,
  onForceUpdate,
  pendingUpdates,
  workoutMap,
  muscleGroupMap
}) => {
  // Format session duration as MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: -400, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={(e, info) => {
        // If dragged down >100px, collapse
        if (info.offset.y > 100) {
          onToggle(false);
        }
        // If dragged up >-100px, expand
        else if (info.offset.y < -100) {
          onToggle(true);
        }
      }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl
                 rounded-t-3xl shadow-2xl border-t border-white/10 pb-safe"
      initial={false}
      animate={{
        y: isOpen ? 0 : 'calc(100% - 80px)' // Show 80px preview when collapsed
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      {/* Drag Handle */}
      <div
        className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing"
        onClick={() => onToggle(!isOpen)}
      >
        <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
      </div>

      {/* Collapsed Preview (always visible) */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-4 text-center select-none-mobile">
          <div className="touch-manipulation" onClick={() => onToggle(!isOpen)}>
            <div className="text-2xl font-bold text-white">
              {formatDuration(sessionDuration)}
            </div>
            <div className="text-xs text-gray-400">Time</div>
          </div>
          <div className="touch-manipulation" onClick={() => onToggle(!isOpen)}>
            <div className="text-2xl font-bold text-white">{receivedCount}</div>
            <div className="text-xs text-gray-400">Corrections</div>
          </div>
          <div className="touch-manipulation" onClick={() => onToggle(!isOpen)}>
            <div className="text-2xl font-bold text-white">
              {Math.round(predictionConfidence * 100)}%
            </div>
            <div className="text-xs text-gray-400">Confidence</div>
          </div>
        </div>
      </div>

      {/* Expanded Content (only when open) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-8 space-y-4 overflow-y-auto max-h-[60vh]"
          >
            {/* Workout Suggestion */}
            {predictedWorkout !== currentWorkout && predictionConfidence > predictionThreshold && (
              <motion.div
                className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Suggested Exercise</div>
                    <div className="text-white font-medium">{workoutMap[predictedWorkout]}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-purple-400 font-bold text-lg">
                      {Math.round(predictionConfidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-400">Confidence</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Muscle Group */}
            {predictedMuscleGroup > 0 && (
              <motion.div
                className="bg-gray-800/50 rounded-xl p-4"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    muscleGroupConfidence > predictionThreshold
                      ? 'bg-purple-600/30'
                      : 'bg-gray-700/50'
                  }`}>
                    <Zap className={`w-5 h-5 ${
                      muscleGroupConfidence > predictionThreshold
                        ? 'text-purple-400'
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">Active Muscle Group</div>
                    <div className="text-white font-medium">{muscleGroupMap[predictedMuscleGroup]}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      muscleGroupConfidence > predictionThreshold
                        ? 'text-purple-400'
                        : 'text-gray-400'
                    }`}>
                      {Math.round(muscleGroupConfidence * 100)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Technical Stats Grid */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Latency</div>
                <div className="text-white font-medium">{feedbackLatency}ms</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Pending Updates</div>
                <div className="text-white font-medium">{pendingUpdates}</div>
              </div>
            </motion.div>

            {/* Force Update Button */}
            <motion.button
              onClick={onForceUpdate}
              className="w-full bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-medium
                       py-3 rounded-lg flex items-center justify-center space-x-2
                       touch-manipulation transition-colors"
              whileTap={{ scale: 0.98 }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Update Stats Now</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MobileStatsDrawer;
