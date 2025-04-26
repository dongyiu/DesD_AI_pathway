import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Save, Trash2, Eye, AlertCircle, Plus } from 'lucide-react';
import ProfileSection from './ProfileSection';
import UserDetailModal from './UserDetailModal';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// Default user data structure with empty fields
const defaultUserData = {
  basicInfo: {
    fullName: '',
    email: '',
    location: '',
    memberSince: '',
    phoneNumber: ''
  },
  fitnessProfile: {
    height: '',
    weight: '',
    bodyFat: '',
    fitnessLevel: ''
  },
  preferences: {
    primaryGoal: '',
    workoutFrequency: '',
    preferredTime: '',
    focusAreas: ''
  },
  achievements: {
    workoutsCompleted: '',
    daysStreak: '',
    personalBests: '',
    points: ''
  }
};

const ProfileOverview = ({ userData, setUserData, isEditing, setIsEditing, icons, isDarkMode = true }) => {
  // Initialize with userData if available, otherwise use default structure
  const initialUserData = userData || defaultUserData;
  
  // Ensure all expected sections exist in the user data
  const completeUserData = {
    ...defaultUserData,
    ...initialUserData,
    basicInfo: { ...defaultUserData.basicInfo, ...(initialUserData.basicInfo || {}) },
    fitnessProfile: { ...defaultUserData.fitnessProfile, ...(initialUserData.fitnessProfile || {}) },
    preferences: { ...defaultUserData.preferences, ...(initialUserData.preferences || {}) },
    achievements: { ...defaultUserData.achievements, ...(initialUserData.achievements || {}) }
  };
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [localUserData, setLocalUserData] = useState(completeUserData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Create user object format compatible with the UserDetailModal
  const userDetails = {
    id: userData?.id || 1,
    username: userData?.basicInfo?.username || userData?.basicInfo?.fullName?.split(' ')[0]?.toLowerCase() || 'user',
    email: userData?.basicInfo?.email || '',
    rolename: userData?.basicInfo?.role || 'User',
    memberSince: userData?.basicInfo?.memberSince || '',
    lastActive: 'Today',
    location: userData?.basicInfo?.location || '',
    phoneNumber: userData?.basicInfo?.phoneNumber || ''
  };

  const handleUserSave = (updatedUser) => {
    // Update the local user data with values from the user details modal
    const updatedUserData = {
      ...localUserData,
      basicInfo: {
        ...localUserData.basicInfo,
        fullName: updatedUser.fullName || updatedUser.username,
        email: updatedUser.email,
        location: updatedUser.location || localUserData.basicInfo.location,
      }
    };
    
    setLocalUserData(updatedUserData);
  };
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Call the parent component's function to save data to backend
      await setUserData(localUserData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Update local state when userData changes (e.g., from API)
  React.useEffect(() => {
    if (userData && !isEditing) {
      const updatedData = {
        ...defaultUserData,
        ...userData,
        basicInfo: { ...defaultUserData.basicInfo, ...(userData.basicInfo || {}) },
        fitnessProfile: { ...defaultUserData.fitnessProfile, ...(userData.fitnessProfile || {}) },
        preferences: { ...defaultUserData.preferences, ...(userData.preferences || {}) },
        achievements: { ...defaultUserData.achievements, ...(userData.achievements || {}) }
      };
      setLocalUserData(updatedData);
    }
  }, [userData, isEditing]);

  // Handle field changes in the sections
  const handleFieldChange = (section, field, value) => {
    setLocalUserData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Profile <span className="text-purple-400 font-medium">Overview</span>
        </h2>
        <div className="flex space-x-3">
          {isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveChanges}
              disabled={isSaving}
              className={`${
                isDarkMode 
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20' 
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
              } px-4 py-2 rounded-lg flex items-center space-x-2 text-sm shadow-md ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="font-medium">Save Changes</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className={`${
                isDarkMode 
                  ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20' 
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
              } px-4 py-2 rounded-lg flex items-center space-x-2 text-sm shadow-md`}
            >
              <Edit3 className="w-4 h-4" />
              <span className="font-medium">Edit Profile</span>
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 mb-6 rounded-lg flex items-center ${
              isDarkMode 
                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{saveError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!userData && !isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 mb-4 rounded-xl text-center ${
            isDarkMode 
              ? 'bg-gray-800/80 backdrop-blur-md border border-white/5' 
              : 'bg-white/90 backdrop-blur-md border border-gray-100'
          } shadow-lg`}
        >
          <div className="mb-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
            } mb-4`}>
              <Plus className={`w-8 h-8 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <h3 className={`text-xl font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Complete Your Profile
            </h3>
            <p className={`mt-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Your profile is empty. Click "Edit Profile" to start adding your information.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className={`${
              isDarkMode 
                ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20' 
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
            } px-5 py-2 rounded-lg inline-flex items-center space-x-2 shadow-md`}
          >
            <Edit3 className="w-4 h-4" />
            <span className="font-medium">Edit Profile</span>
          </motion.button>
        </motion.div>
      )}

      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <motion.div variants={fadeIn}>
          <ProfileSection 
            title="Basic Info" 
            data={localUserData.basicInfo} 
            icons={icons} 
            isEditing={isEditing}
            onFieldChange={(field, value) => handleFieldChange('basicInfo', field, value)}
            isDarkMode={isDarkMode}
          />
        </motion.div>
        
        <motion.div variants={fadeIn}>
          <ProfileSection 
            title="Fitness Profile" 
            data={localUserData.fitnessProfile} 
            icons={icons} 
            isEditing={isEditing}
            onFieldChange={(field, value) => handleFieldChange('fitnessProfile', field, value)}
            isDarkMode={isDarkMode}
          />
        </motion.div>
        
        <motion.div variants={fadeIn}>
          <ProfileSection 
            title="Preferences" 
            data={localUserData.preferences} 
            icons={icons} 
            isEditing={isEditing}
            onFieldChange={(field, value) => handleFieldChange('preferences', field, value)}
            isDarkMode={isDarkMode}
          />
        </motion.div>
        
        <motion.div variants={fadeIn}>
          <ProfileSection 
            title="Achievements" 
            data={localUserData.achievements} 
            icons={icons} 
            isEditing={isEditing}
            onFieldChange={(field, value) => handleFieldChange('achievements', field, value)}
            isDarkMode={isDarkMode}
          />
        </motion.div>
      </motion.div>

      <motion.div 
        className={`flex justify-end pt-6 mt-6 border-t ${
          isDarkMode ? 'border-white/5' : 'border-gray-200'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.5 } }}
      >
        <motion.button
          whileHover={{ 
            scale: 1.05, 
            y: -2,
            backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'
          }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center space-x-2 ${
            isDarkMode 
              ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10' 
              : 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
          } px-4 py-2 rounded-lg text-sm shadow-md`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="font-medium">Delete Account</span>
        </motion.button>
      </motion.div>
      
      <AnimatePresence>
        {showDetailModal && (
          <UserDetailModal 
            user={userDetails} 
            onClose={() => setShowDetailModal(false)}
            onSave={handleUserSave}
            onDelete={() => console.log("Delete not available for own account")}
            isAdmin={false}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileOverview;