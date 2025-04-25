import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Save, Edit3 } from 'lucide-react';

const UserDetailModal = ({ user, onClose, onDelete, onSave, isAdmin = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(editedUser);
    setIsEditing(false);
  };

  const renderSection = (title, fields) => (
    <div className="bg-gray-700 backdrop-blur-sm rounded-lg p-4 mb-4">
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
                value={editedUser[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full bg-purple-500/5 border border-purple-500/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-purple-500/20 mt-1"
                disabled={field === 'id' || (!isAdmin && field === 'rolename')}
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 pt-16"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 bg-gray-800 pb-4 border-b border-white/10">
          <h2 className="text-2xl font-light">User <span className="text-purple-400 font-medium">Details</span></h2>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="bg-purple-500/10 hover:bg-purple-500/20 p-2 rounded-lg text-purple-400"
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="bg-purple-500/10 hover:bg-purple-500/20 p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        {renderSection('Account Information', ['id', 'username', 'email', 'rolename'])}
        
        {user.memberSince && renderSection('Additional Details', [
          'memberSince', 
          'lastActive', 
          'location',
          'phoneNumber'
        ])}
        
        {isAdmin && (
          <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDelete(user.id)}
              className="flex items-center space-x-2 text-red-400 px-4 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default UserDetailModal;