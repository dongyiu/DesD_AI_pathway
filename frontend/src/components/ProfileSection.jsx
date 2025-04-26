import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Check } from 'lucide-react';

const ProfileSection = ({ title, data, icons, isEditing, onFieldChange, isDarkMode = true }) => {
  // Format field label for display
  const formatFieldLabel = (key) => {
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <motion.div 
      className={`${
        isDarkMode 
          ? 'bg-gray-800/80 backdrop-blur-md border border-white/5' 
          : 'bg-white/90 backdrop-blur-md border border-gray-100'
      } rounded-xl p-5 shadow-lg`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className={`text-sm ${
        isDarkMode ? 'text-purple-400/70' : 'text-indigo-600'
      } uppercase tracking-wider mb-4 font-medium`}>
        {title.replace(/([A-Z])/g, ' $1').trim()}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(data || {}).map(([key, value]) => (
          <motion.div
            key={key}
            whileHover={isEditing ? { scale: 1.02, y: -2 } : { scale: 1.01 }}
            className={`${
              isDarkMode 
                ? 'bg-gray-700/70 border border-white/5' 
                : 'bg-gray-50 border border-gray-100'
            } p-4 rounded-xl transition-all duration-300 ${
              isEditing 
                ? isDarkMode 
                  ? 'hover:border-purple-500/30 hover:bg-purple-500/5' 
                  : 'hover:border-indigo-200 hover:bg-indigo-50'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {icons[key] && (
                  <div className={`p-1 rounded ${
                    isDarkMode ? 'bg-purple-500/20' : 'bg-indigo-100'
                  }`}>
                    {React.createElement(icons[key], { 
                      className: `w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-indigo-500'}` 
                    })}
                  </div>
                )}
                <span className={`text-xs ${
                  isDarkMode ? 'text-purple-400/70' : 'text-indigo-500'
                } uppercase font-medium`}>
                  {formatFieldLabel(key)}
                </span>
              </div>
              
              {isEditing && (
                <div className={`${
                  isDarkMode ? 'text-purple-400/50' : 'text-indigo-400/70'
                } text-xs`}>
                  <Edit3 className="w-3 h-3" />
                </div>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => onFieldChange(key, e.target.value)}
                      className={`w-full ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500/30 text-white' 
                          : 'bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/30 text-gray-800'
                        } border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 transition-all duration-200`}
                      placeholder={`Enter ${formatFieldLabel(key)}`}
                    />
                    {value && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="viewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`font-light text-lg ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {value || (
                    <span className={`italic text-base ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Not set
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfileSection;