import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Timer, Weight, TrendingUp, 
  ActivitySquare 
} from 'lucide-react';

const FitnessStats = ({ fitnessStats }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light">Fitness <span className="text-purple-400 font-medium">Overview</span></h2>
        <div className="flex items-center space-x-2 text-purple-400/60 text-sm">
          <Calendar className="w-4 h-4" />
          <span>March 2025</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(fitnessStats.progressMetrics).map(([key, value]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-700 backdrop-blur-sm p-4 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              {key === 'monthlyWorkouts' && <Calendar className="w-4 h-4 text-purple-400" />}
              {key === 'avgDuration' && <Timer className="w-4 h-4 text-purple-400" />}
              {key === 'weightProgress' && <Weight className="w-4 h-4 text-purple-400" />}
              {key === 'streakDays' && <TrendingUp className="w-4 h-4 text-purple-400" />}
            </div>
            <div className="text-2xl font-light">{value}</div>
            <div className="text-xs text-purple-400/60 uppercase tracking-wider mt-1">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-700 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-light mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {fitnessStats.recentWorkouts.map((workout, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-purple-500/5 rounded-lg hover:bg-purple-500/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500/20 p-1.5 rounded-lg">
                    <ActivitySquare className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-light">{workout.type}</div>
                    <div className="text-xs text-gray-400">{workout.date}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-purple-400">{workout.duration}</div>
                  <div className="text-xs text-gray-400">{workout.intensity}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessStats;