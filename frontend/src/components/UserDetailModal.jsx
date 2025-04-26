import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Trash2, Save, Edit3, User, 
  Mail, Calendar, MapPin, Phone, 
  Shield, RefreshCw, Check
} from 'lucide-react';

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const modalVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1,
    y: 0,
    transition: { 
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    scale: 0.9, 
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  }
};

const UserDetailModal = ({ user, onClose, onDelete, onSave, isAdmin = false, isDarkMode = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const [isSaving, setIsSaving] = useState(false);

  // Get icon for each field
  const getFieldIcon = (field) => {
    switch(field) {
      case 'id': return <User size={16} />;
      case 'username': return <User size={16} />;
      case 'email': return <Mail size={16} />;
      case 'rolename': return <Shield size={16} />;
      case 'memberSince': return <Calendar size={16} />;
      case 'lastActive': return <Calendar size={16} />;
      case 'location': return <MapPin size={16} />;
      case 'phoneNumber': return <Phone size={16} />;
      default: return <User size={16} />;
    }
  };

  const handleInputChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate saving
    setTimeout(() => {
      onSave(editedUser);
      setIsEditing(false);
      setIsSaving(false);
    }, 600);
  };

  const renderSection = (title, fields) => (
    <div className={`${
      isDarkMode 
        ? 'bg-gray-800 border border-white/10' 
        : 'bg-white border border-gray-200'
      } rounded-xl p-5 mb-5 shadow-lg`}>
      <h3 className={`text-sm ${
        isDarkMode ? 'text-purple-400' : 'text-indigo-600'
      } uppercase tracking-wider mb-4 font-medium`}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <motion.div 
            key={field} 
            whileHover={isEditing && field !== 'id' && (!isAdmin && field !== 'rolename') ? 
              { scale: 1.02, y: -2 } : { scale: 1.01 }
            }
            className={`${
              isDarkMode 
                ? 'bg-gray-700 border border-white/10' 
                : 'bg-gray-50 border border-gray-200'
            } p-4 rounded-xl transition-all duration-300 ${
              isEditing && field !== 'id' && (!(!isAdmin && field === 'rolename'))
                ? isDarkMode 
                  ? 'hover:border-purple-500/50 hover:bg-purple-500/10' 
                  : 'hover:border-indigo-300 hover:bg-indigo-50'
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded ${
                  isDarkMode ? 'bg-purple-500/20' : 'bg-indigo-100'
                }`}>
                  {getFieldIcon(field)}
                </div>
                <span className={`text-xs ${
                  isDarkMode ? 'text-purple-400' : 'text-indigo-600'
                } uppercase font-medium`}>
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              
              {isEditing && field !== 'id' && (!(!isAdmin && field === 'rolename')) && (
                <div className={`${
                  isDarkMode ? 'text-purple-400/50' : 'text-indigo-400/70'
                } text-xs`}>
                  <Edit3 className="w-3 h-3" />
                </div>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {isEditing && field !== 'id' && (!(!isAdmin && field === 'rolename')) ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={editedUser[field] || ''}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className={`w-full ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 focus:border-purple-500 focus:ring-purple-500/30 text-white' 
                          : 'bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/30 text-gray-800'
                        } border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 transition-all duration-200`}
                      disabled={field === 'id' || (!isAdmin && field === 'rolename')}
                      placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').trim()}`}
                    />
                    {editedUser[field] && (
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
                  {field === 'rolename' ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm ${
                      editedUser[field] === 'Admin' 
                        ? isDarkMode 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-purple-100 text-purple-700'
                        : editedUser[field] === 'Premium' 
                          ? isDarkMode 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-100 text-blue-700'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {editedUser[field]}
                    </span>
                  ) : editedUser[field] || (
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
    </div>
  );

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4 py-10"
      onClick={onClose}
    >
      <motion.div 
        variants={modalVariants}
        className={`${
          isDarkMode 
            ? 'bg-gray-900 border border-white/10' 
            : 'bg-white border border-gray-200'
          } rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between mb-6 pb-4 border-b ${
          isDarkMode 
            ? 'border-white/10' 
            : 'border-gray-200'
          }`}>
          <h2 className={`text-2xl font-light ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>User <span className={`${
            isDarkMode ? 'text-purple-400' : 'text-indigo-600'
          } font-medium`}>Details</span></h2>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
              className={`${
                isEditing
                  ? isDarkMode 
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                    : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
                  : isDarkMode 
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30' 
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200'
                } p-2 rounded-lg shadow-md flex items-center ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : isEditing ? (
                <Save className="w-5 h-5" />
              ) : (
                <Edit3 className="w-5 h-5" />
              )}
              <span className="ml-2 font-medium">{isEditing ? 'Save' : 'Edit'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-white/10' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                } p-2 rounded-lg shadow-md flex items-center`}
            >
              <X className="w-5 h-5" />
              <span className="ml-2 font-medium">Close</span>
            </motion.button>
          </div>
        </div>
        
        {renderSection('Account Information', ['id', 'username', 'email', 'rolename'])}
        
        {(user.memberSince || user.lastActive || user.location || user.phoneNumber) && 
          renderSection('Additional Details', [
            'memberSince', 
            'lastActive', 
            'location',
            'phoneNumber'
          ])}
        
        {isAdmin && (
          <div className={`flex justify-end mt-6 pt-4 border-t ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(user.id)}
              className={`flex items-center space-x-2 ${
                isDarkMode 
                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20' 
                  : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
              } px-4 py-2 rounded-lg text-sm shadow-md`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-medium">Delete Account</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default UserDetailModal;