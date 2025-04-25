import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Save, Trash2, Eye } from 'lucide-react';
import ProfileSection from './ProfileSection';
import UserDetailModal from './UserDetailModal';

const ProfileOverview = ({ userData, setUserData, isEditing, setIsEditing, icons }) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Create user object format compatible with the UserDetailModal
  const userDetails = {
    id: 1, // Example ID
    username: userData.basicInfo.fullName.split(' ')[0].toLowerCase(),
    email: userData.basicInfo.email,
    rolename: 'Customer', // Default role
    memberSince: userData.basicInfo.memberSince,
    lastActive: 'Today',
    location: userData.basicInfo.location,
    phoneNumber: '+1 (555) 123-4567'
  };

  const handleUserSave = (updatedUser) => {
    // Update the userData with values from the user details modal
    setUserData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        fullName: updatedUser.username, // This might need adjustment based on your needs
        email: updatedUser.email,
        location: updatedUser.location || prev.basicInfo.location,
        memberSince: updatedUser.memberSince || prev.basicInfo.memberSince
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light">Profile <span className="text-purple-400 font-medium">Overview</span></h2>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDetailModal(true)}
            className="bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
          >
            <Eye className="w-4 h-4" />
            <span className="font-light">Details</span>
          </motion.button>
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
      </div>

      <div className="space-y-6">
        <ProfileSection 
          title="BasicInfo" 
          data={userData.basicInfo} 
          icons={icons} 
          isEditing={isEditing}
          setUserData={setUserData}
          userData={userData}
        />
        <ProfileSection 
          title="FitnessProfile" 
          data={userData.fitnessProfile} 
          icons={icons} 
          isEditing={isEditing}
          setUserData={setUserData}
          userData={userData}
        />
        <ProfileSection 
          title="Preferences" 
          data={userData.preferences} 
          icons={icons} 
          isEditing={isEditing}
          setUserData={setUserData}
          userData={userData}
        />
        <ProfileSection 
          title="Achievements" 
          data={userData.achievements} 
          icons={icons} 
          isEditing={isEditing}
          setUserData={setUserData}
          userData={userData}
        />
      </div>

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
      
      <AnimatePresence>
        {showDetailModal && (
          <UserDetailModal 
            user={userDetails} 
            onClose={() => setShowDetailModal(false)}
            onSave={handleUserSave}
            onDelete={() => console.log("Delete not available for own account")}
            isAdmin={false}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileOverview;