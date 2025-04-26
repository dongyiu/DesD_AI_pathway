import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Timer, Weight, TrendingUp, 
  ActivitySquare, ChevronRight, BarChart3,
  ArrowUpRight
} from 'lucide-react';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const FitnessStats = ({ fitnessStats, isDarkMode = true }) => {
  // Get icon based on metric key
  const getMetricIcon = (key) => {
    switch(key) {
      case 'monthlyWorkouts': return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'avgDuration': return <Timer className="w-4 h-4 text-purple-400" />;
      case 'weightProgress': return <Weight className="w-4 h-4 text-purple-400" />;
      case 'streakDays': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      default: return <BarChart3 className="w-4 h-4 text-purple-400" />;
    }
  };

  // Format metric display name
  const formatMetricName = (key) => {
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Fitness <span className="text-purple-400 font-medium">Overview</span>
        </h2>
        <div className={`flex items-center space-x-2 text-sm ${
          isDarkMode ? 'bg-gray-800/60 text-purple-400' : 'bg-white text-purple-600'
        } px-3 py-1.5 rounded-lg shadow-sm backdrop-blur-sm border ${
          isDarkMode ? 'border-white/5' : 'border-gray-200'
        }`}>
          <Calendar className="w-4 h-4" />
          <span>March 2025</span>
        </div>
      </div>
      
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {Object.entries(fitnessStats.progressMetrics).map(([key, value], index) => (
          <motion.div
            key={key}
            variants={fadeIn}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`${
              isDarkMode 
                ? 'bg-gray-800/80 backdrop-blur-md border border-white/5' 
                : 'bg-white backdrop-blur-md border border-gray-100'
            } p-5 rounded-xl shadow-lg overflow-hidden relative group`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 group-hover:bg-purple-500/10 transition-all duration-300"></div>
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className={`${
                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
              } p-2 rounded-lg`}>
                {getMetricIcon(key)}
              </div>
              <ArrowUpRight className={`w-4 h-4 ${
                isDarkMode ? 'text-purple-400/40' : 'text-purple-600/40'
              } group-hover:${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              } transition-colors duration-300`} />
            </div>
            
            <div className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} relative z-10`}>
              {value}
            </div>
            
            <div className={`text-xs uppercase tracking-wider mt-1 ${
              isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'
            } relative z-10`}>
              {formatMetricName(key)}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className={`${
          isDarkMode 
            ? 'bg-gray-800/80 backdrop-blur-md border border-white/5' 
            : 'bg-white backdrop-blur-md border border-gray-100'
        } rounded-xl overflow-hidden shadow-lg`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Recent Activity
            </h3>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`text-xs flex items-center ${
                isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
              }`}
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3 ml-1" />
            </motion.button>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {fitnessStats.recentWorkouts.map((workout, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10' 
                      : 'bg-purple-50 hover:bg-purple-100 border border-purple-100'
                  } cursor-pointer`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`${
                      isDarkMode ? 'bg-purple-500/20' : 'bg-purple-200'
                    } p-2 rounded-lg`}>
                      <ActivitySquare className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {workout.type}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {workout.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                      {workout.duration}
                    </div>
                    <div className={`text-xs ${
                      workout.intensity === 'High' 
                        ? 'text-green-400' 
                        : workout.intensity === 'Medium' 
                          ? 'text-yellow-400' 
                          : 'text-blue-400'
                    }`}>
                      {workout.intensity} Intensity
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FitnessStats;