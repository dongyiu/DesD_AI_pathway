import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Edit3, Trash2, User, Mail, Calendar, 
  MapPin, Phone, Shield, Activity, CheckCircle
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

const UserDetailsPage = ({ isDarkMode = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 800);
  };

  // Get icon for each field
  const getFieldIcon = (field) => {
    switch(field) {
      case 'id': return <User size={16} />;
      case 'username': return <User size={16} />;
      case 'email': return <Mail size={16} />;
      case 'rolename': return <Shield size={16} />;
      case 'memberSince': return <Calendar size={16} />;
      case 'lastActive': return <Calendar size={16} />;
      case 'status': return <Activity size={16} />;
      case 'location': return <MapPin size={16} />;
      case 'phoneNumber': return <Phone size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  // Format field label
  const formatFieldLabel = (field) => {
    return field.replace(/([A-Z])/g, ' $1').trim();
  };

  const renderSection = (title, fields) => (
    <motion.div 
      className={`${
        isDarkMode 
          ? 'bg-gray-800/80 backdrop-blur-md border border-white/5' 
          : 'bg-white backdrop-blur-md border border-gray-100'
      } rounded-xl p-5 mb-6 shadow-lg`}
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <h3 className={`text-sm ${
        isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'
      } uppercase tracking-wider mb-5 font-medium`}>
        {title}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field, index) => (
          <motion.div 
            key={field}
            variants={fadeIn}
            className={`${
              isDarkMode 
                ? 'bg-gray-700/50 border border-white/5' 
                : 'bg-gray-50 border border-gray-100'
            } p-4 rounded-xl group transition-all duration-300 ${
              isEditing && field !== 'id' 
                ? isDarkMode 
                  ? 'hover:bg-purple-500/10 hover:border-purple-500/30' 
                  : 'hover:bg-purple-50 hover:border-purple-200' 
                : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`text-xs ${
                isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'
              } uppercase font-medium flex items-center`}>
                <span className={`${
                  isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                } p-1 rounded mr-2`}>
                  {getFieldIcon(field)}
                </span>
                {formatFieldLabel(field)}
              </div>
              
              {isEditing && field !== 'id' && (
                <div className={`text-xs ${
                  isDarkMode ? 'text-purple-400/50' : 'text-purple-600/50'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                  Editable
                </div>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {isEditing && field !== 'id' ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <input
                    type="text"
                    value={user[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`w-full ${
                      isDarkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500' 
                        : 'bg-white text-gray-800 border-gray-200 focus:border-purple-500'
                    } border rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-purple-500`}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`font-light text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                >
                  {field === 'status' ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm ${
                      user.status === 'Active' 
                        ? isDarkMode 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-green-100 text-green-800'
                        : isDarkMode 
                          ? 'bg-gray-500/20 text-gray-400' 
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${
                        user.status === 'Active' ? 'bg-green-400' : 'bg-gray-400'
                      }`}></span>
                      {user[field]}
                    </span>
                  ) : (
                    user[field]
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          User <span className="text-purple-400 font-medium">Details</span>
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          className={`${
            isEditing 
              ? isDarkMode 
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400' 
                : 'bg-green-100 hover:bg-green-200 text-green-600'
              : isDarkMode 
                ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400' 
                : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
          } px-4 py-2 rounded-lg flex items-center space-x-2 text-sm shadow-md`}
        >
          {isSaving ? (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
          ) : (
            isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />
          )}
          <span className="font-medium">{isEditing ? 'Save' : 'Edit'}</span>
        </motion.button>
      </div>

      {renderSection('Account Information', ['id', 'username', 'email', 'rolename'])}
      {renderSection('Additional Details', ['memberSince', 'lastActive', 'status'])}
      {renderSection('Personal Information', ['location', 'phoneNumber'])}
      
      <motion.div 
        className={`flex justify-end pt-6 mt-6 border-t ${
          isDarkMode ? 'border-white/5' : 'border-gray-200'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.5 } }}
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2, backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center space-x-2 ${
            isDarkMode 
              ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' 
              : 'text-red-600 bg-red-50 hover:bg-red-100'
          } px-4 py-2 rounded-lg text-sm shadow-md`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-medium">Delete Account</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default UserDetailsPage;