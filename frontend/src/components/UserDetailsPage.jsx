import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit3, Trash2 } from 'lucide-react';

const UserDetailsPage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    id: 1,
    username: 'alexj',
    email: 'alex@example.com',
    rolename: 'Customer',
    memberSince: 'March 2024',
    lastActive: '2 days ago',
    status: 'Active',
    location: 'New York, USA',
    phoneNumber: '+1 (555) 123-4567'
  });

  const handleInputChange = (field, value) => {
    setUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderSection = (title, fields) => (
    <div className="bg-gray-700 backdrop-blur-sm rounded-lg p-4 mb-6">
      <h3 className="text-sm text-purple-400/60 uppercase tracking-wider mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field} className="bg-purple-500/5 p-3 rounded-lg">
            <div className="text-xs text-purple-400/60 uppercase mb-1">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={user[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full bg-purple-500/5 border border-purple-500/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-purple-500/20 mt-1"
                disabled={field === 'id'}
              />
            ) : (
              <div className="font-light text-lg">{user[field]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light">User <span className="text-purple-400 font-medium">Details</span></h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsEditing(!isEditing)}
          className="bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
        >
          {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          <span className="font-light">{isEditing ? 'Save' : 'Edit'}</span>
        </motion.button>
      </div>

      {renderSection('Account Information', ['id', 'username', 'email', 'rolename'])}
      {renderSection('Additional Details', ['memberSince', 'lastActive', 'status'])}
      {renderSection('Personal Information', ['location', 'phoneNumber'])}
      
      <motion.div 
        className="flex justify-end pt-6 mt-6 border-t border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
          className="flex items-center space-x-2 text-red-400 px-4 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-light">Delete Account</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default UserDetailsPage;