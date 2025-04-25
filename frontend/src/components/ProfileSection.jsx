import React from 'react';
import { motion } from 'framer-motion';

const ProfileSection = ({ title, data, icons, isEditing, setUserData, userData }) => {
  return (
    <div className="bg-gray-700 backdrop-blur-sm rounded-lg p-4">
      <h3 className="text-sm text-purple-400/60 uppercase tracking-wider mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            className="bg-purple-500/5 p-3 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-1">
              {icons[key] && React.createElement(icons[key], { className: "w-4 h-4 text-purple-400" })}
              <span className="text-xs text-purple-400/60 uppercase">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const newData = { ...userData };
                  newData[title.toLowerCase()][key] = e.target.value;
                  setUserData(newData);
                }}
                className="w-full bg-purple-500/5 border border-purple-500/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-purple-500/20 mt-1"
              />
            ) : (
              <div className="font-light text-lg">{value}</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSection;