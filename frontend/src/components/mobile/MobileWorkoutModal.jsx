import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Search } from 'lucide-react';

/**
 * Mobile Workout Selection Modal
 * Full-screen modal for selecting exercises on mobile
 * Features search and grouping by muscle group
 */
const MobileWorkoutModal = ({
  isOpen,
  currentWorkout,
  onSelect,
  onClose,
  isDarkMode,
  workoutMap
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter workouts by search term
  const filteredWorkouts = Object.entries(workoutMap).filter(([id, name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group workouts by muscle group for better organization
  const workoutsByMuscle = {
    'Chest': [1, 2, 4, 7], // Bench Press, Chest Fly, Decline Bench, Incline Bench
    'Arms': [0, 5, 20, 21], // Bicep Curl, Hammer Curl, Tricep Dips, Tricep Pushdown
    'Back': [8, 13, 19], // Lat Pulldown, Pull Up, T Bar Row
    'Legs': [3, 6, 10, 15, 18], // Deadlift, Hip Thrust, Leg Extensions, Romanian Deadlift, Squat
    'Core': [11, 12, 16], // Leg Raises, Plank, Russian Twist
    'Shoulders': [9, 17], // Lateral Raises, Shoulder Press
    'Other': [14] // Push Ups
  };

  const handleSelect = (id) => {
    onSelect(Number(id));
    setSearchTerm(''); // Clear search
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="h-full flex flex-col pt-safe pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <h2 className="text-white text-xl font-bold">Select Exercise</h2>
              <motion.button
                onClick={onClose}
                className="p-2 -mr-2 touch-manipulation"
                whileTap={{ scale: 0.9 }}
              >
                <XCircle className="w-6 h-6 text-white" />
              </motion.button>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-800 text-white rounded-lg
                           border border-gray-700 focus:border-purple-500 outline-none
                           placeholder-gray-500 transition-colors"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Workout List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {searchTerm ? (
                // Flat filtered list when searching
                <div className="space-y-2 mt-4">
                  {filteredWorkouts.length > 0 ? (
                    filteredWorkouts.map(([id, name]) => (
                      <motion.button
                        key={id}
                        onClick={() => handleSelect(id)}
                        className={`w-full text-left p-4 rounded-lg font-medium
                          touch-manipulation transition-all ${
                          Number(id) === currentWorkout
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600'
                        }`}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {name}
                      </motion.button>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No exercises found</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              ) : (
                // Grouped by muscle when not searching
                <div className="space-y-6 mt-4">
                  {Object.entries(workoutsByMuscle).map(([muscle, ids], groupIndex) => (
                    <motion.div
                      key={muscle}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIndex * 0.05 }}
                    >
                      {/* Muscle Group Header */}
                      <div className="flex items-center mb-3">
                        <div className="text-purple-400 text-sm font-bold uppercase tracking-wider">
                          {muscle}
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent ml-3" />
                      </div>

                      {/* Exercises in this muscle group */}
                      <div className="space-y-2">
                        {ids.map((id, index) => (
                          <motion.button
                            key={id}
                            onClick={() => handleSelect(id)}
                            className={`w-full text-left p-4 rounded-lg font-medium
                              touch-manipulation transition-all ${
                              id === currentWorkout
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600'
                            }`}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.05 + index * 0.02 }}
                          >
                            <div className="flex items-center justify-between">
                              <span>{workoutMap[id]}</span>
                              {id === currentWorkout && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileWorkoutModal;
