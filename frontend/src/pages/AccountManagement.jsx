import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCircle, Mail, MapPin, Calendar,
  Ruler, Weight, Heart, Medal, Target, 
  Clock, Dumbbell, ActivitySquare, TrendingUp,
  Award, AlertCircle, X, RefreshCw
} from 'lucide-react';

import NavBar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProfileOverview from '../components/ProfileOverview';
import FitnessStats from '../components/FitnessStats';
import UserManagement from '../components/UserManagement';
import UserDetailsPage from '../components/UserDetailsPage';
import UserDetailModal from '../components/UserDetailModal';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import userService from '../services/userService';

// Animation variants
const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  }
};

const errorNotificationVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, type: "spring", stiffness: 300, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.2 }
  }
};

const AccountManagement = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Change this to match Navbar.jsx - don't destructure
  const user = useAuth();
    
  // Check system preference on initial load
  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);
  
  // Update dark mode class on body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activePage, setActivePage] = useState('profile');
  const [fitnessStats, setFitnessStats] = useState({
    recentWorkouts: [
      { date: '2025-03-10', type: 'Upper Body', duration: '45 min', intensity: 'High' },
      { date: '2025-03-08', type: 'Lower Body', duration: '50 min', intensity: 'Medium' },
      { date: '2025-03-06', type: 'Cardio', duration: '30 min', intensity: 'High' }
    ],
    progressMetrics: {
      monthlyWorkouts: 12,
      avgDuration: '45 min',
      weightProgress: '+2.5 kg',
      streakDays: 15
    }
  });
  const [selectedUser, setSelectedUser] = useState(null);

  // Determine user role from backend data
  const getUserRole = () => {
    console.log("User object:", user);
    console.log("User data:", user?.user);
    
    if (!user?.user) {
      console.log("No user data found, defaulting to 'user' role");
      return 'user';
    }
    
    // Check if the user has the is_admin field set to true
    if (user.user.is_admin === true) {
      console.log("User is identified as admin via is_admin field");
      return 'admin';
    }
    
    // Check if the user has admin permissions
    if (user.user.basicInfo?.isAdmin || user.user.basicInfo?.rolename === 'Admin' || 
        user.user.rolename === 'Admin' || user.user.basicInfo?.role === 'Admin') {
      console.log("User is identified as admin");
      return 'admin';
    }
    
    // Check groups directly if available
    if (user.user.groups && Array.isArray(user.user.groups)) {
      const hasAdminGroup = user.user.groups.some(g => {
        return (g && (g.name === 'Admin' || g === 'Admin'));
      });
      
      if (hasAdminGroup) {
        console.log("User is admin via groups array");
        return 'admin';
      }
    }
    
    console.log("User is not admin, defaulting to 'user' role");
    return 'user';
  };
  
  const userRole = getUserRole();
  console.log("Determined user role:", userRole);

  // Set initial active page based on role
  useEffect(() => {
    if (userRole === 'admin') {
      setActivePage('users');
    } else {
      setActivePage('profile');
    }
  }, [userRole]);

  const icons = {
    fullName: UserCircle,
    email: Mail,
    location: MapPin,
    memberSince: Calendar,
    height: Ruler,
    weight: Weight,
    bodyFat: Heart,
    fitnessLevel: Medal,
    primaryGoal: Target,
    workoutFrequency: Calendar,
    preferredTime: Clock,
    focusAreas: Dumbbell,
    workoutsCompleted: ActivitySquare,
    daysStreak: TrendingUp,
    personalBests: Award,
    points: Medal
  };

  // Define the missing updateProfile function
  const updateProfile = async (updatedData) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/';
    try {
      // Log the data being sent to the API for debugging
      console.log('Sending profile update:', updatedData);
      
      const response = await axios.patch(
        `${API_URL}api/my_account/`, 
        updatedData,
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Profile update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Handle the save action when profile is edited
  const handleProfileUpdate = async (updatedData) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('ProfileUpdate: Original user data:', updatedData);
      
      // Transform the data to match backend format
      const formattedData = userService.transformUserDataForBackend(updatedData);
      console.log('ProfileUpdate: Transformed data for backend:', formattedData);
      
      // Send the formatted data to the API
      const response = await updateProfile(formattedData);
      console.log('ProfileUpdate: API response:', response);
      
      // Update the user context with the new data
      if (user && user.setUser) {
        console.log('ProfileUpdate: Updating user context');
        user.setUser({
          ...user.user,
          ...updatedData
        });
      } else {
        console.warn('ProfileUpdate: Unable to update user context - setUser not available');
      }
      
      setIsEditing(false);
      console.log('ProfileUpdate: Profile update successful');
    } catch (err) {
      console.error('Failed to update profile:', err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  // Show loading spinner while user data is being fetched
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-indigo-50'
      }`}>
        <div className="flex flex-col items-center">
          <RefreshCw className={`w-12 h-12 animate-spin mb-4 ${
            isDarkMode ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // Handle user selection from UserManagement
  const handleSelectUser = (user) => {
    console.log("Selected user:", user);
    setSelectedUser(user);
  };

  // Handle user deletion
  const handleDeleteUser = (userId) => {
    console.log("Deleting user:", userId);
    setSelectedUser(null);
    // You might want to refresh the user list after deletion
  };

  // Handle user update
  const handleSaveUser = (updatedUser) => {
    console.log("Updating user:", updatedUser);
    // You might want to refresh the user list after update
  };

  const renderActivePage = () => {
    console.log("Rendering active page:", activePage);
    switch (activePage) {
      case 'profile':
        console.log("Rendering ProfileOverview component");
        return (
          <ProfileOverview 
            userData={user.user}
            setUserData={handleProfileUpdate}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            icons={icons}
            isDarkMode={isDarkMode}
          />
        );
      case 'stats':
        console.log("Rendering FitnessStats component");
        return <FitnessStats fitnessStats={fitnessStats} isDarkMode={isDarkMode} />;
      case 'users':
        console.log("Rendering UserManagement component");
        return (
          <UserManagement 
            isDarkMode={isDarkMode}
            onSelectUser={handleSelectUser}
            onDeleteUser={handleDeleteUser}
            onSaveUser={handleSaveUser}
          />
        );
      case 'userDetails':
        console.log("Rendering UserDetailsPage component");
        return <UserDetailsPage isDarkMode={isDarkMode} />;
      default:
        console.log("No matching component for active page:", activePage);
        return <div>Page not found</div>;
    }
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-indigo-50 text-gray-900'
    }`}>
      <NavBar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* Error Notification - Now fixed at the top, above all content */}
      <AnimatePresence>
        {error && (
          <motion.div 
            variants={errorNotificationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-20 left-0 right-0 mx-auto max-w-4xl px-4 z-50"
          >
            <div className={`${
              isDarkMode 
                ? 'bg-red-900/80 text-red-100 border border-red-800/50' 
                : 'bg-red-50/95 text-red-700 border border-red-200'
            } p-4 rounded-xl flex items-center justify-between shadow-xl backdrop-blur-md`}>
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p>{error}</p>
              </div>
              <button 
                onClick={clearError}
                className={`p-1 rounded-full ${
                  isDarkMode 
                    ? 'hover:bg-red-800/50 text-red-200' 
                    : 'hover:bg-red-100 text-red-500'
                } transition-colors duration-200`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar 
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            userRole={userRole}
            activePage={activePage}
            setActivePage={setActivePage}
            isDarkMode={isDarkMode}
          />

          <div className="lg:ml-72 flex-1">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activePage}
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`rounded-xl ${
                  isDarkMode 
                    ? 'bg-gray-800 border border-white/10' 
                    : 'bg-white shadow-lg border border-gray-200'
                } p-6 sm:p-8`}
              >
                {renderActivePage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* User Detail Modal - Rendered at the page level */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onDelete={handleDeleteUser}
            onSave={handleSaveUser}
            isAdmin={userRole === 'admin'}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
      
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
      </div>
    </div>
  );
};

export default AccountManagement;