import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserCircle, Mail, MapPin, Calendar,
  Ruler, Weight, Heart, Medal, Target, 
  Clock, Dumbbell, ActivitySquare, TrendingUp,
  Award
} from 'lucide-react';

import NavBar from '../components/NavBar';
import Sidebar from '../components/Sidebar';
import ProfileOverview from '../components/ProfileOverview';
import FitnessStats from '../components/FitnessStats';
import UserManagement from '../components/UserManagement';
import UserDetailsPage from '../components/UserDetailsPage';

const AccountManagement = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // Default to admin view for demonstration
  const [activePage, setActivePage] = useState('users'); // Default to user management for demonstration
  const [isEditing, setIsEditing] = useState(false);

  const [userData, setUserData] = useState({
    basicInfo: {
      fullName: 'Alex Johnson',
      email: 'alex@example.com',
      location: 'New York, USA',
      memberSince: 'March 2024'
    },
    fitnessProfile: {
      height: '175 cm',
      weight: '70 kg',
      bodyFat: '15%',
      fitnessLevel: 'Intermediate'
    },
    preferences: {
      primaryGoal: 'Build Muscle',
      workoutFrequency: '4x/week',
      preferredTime: 'Morning',
      focusAreas: 'Full Body'
    },
    achievements: {
      workoutsCompleted: '48',
      daysStreak: '15',
      personalBests: '12',
      points: '2,450'
    }
  });

  const [fitnessStats] = useState({
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

  // Toggle role for demonstration purposes
  const toggleRole = () => {
    if (userRole === 'admin') {
      setUserRole('user');
      setActivePage('profile');
    } else {
      setUserRole('admin');
      setActivePage('users');
    }
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'profile':
        return (
          <ProfileOverview 
            userData={userData}
            setUserData={setUserData}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            icons={icons}
          />
        );
      case 'stats':
        return <FitnessStats fitnessStats={fitnessStats} />;
      case 'users':
        return <UserManagement />;
      case 'userDetails':
        return <UserDetailsPage />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <NavBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <div className="max-w-6xl mx-auto px-4 py-6 relative">
        {/* For demonstration only - role switcher */}
        <div className="mb-4 flex justify-end">
          <button 
            onClick={toggleRole}
            className="text-xs bg-purple-500/20 px-3 py-1 rounded-full text-purple-300"
          >
            Currently: {userRole === 'admin' ? 'Admin View' : 'User View'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar 
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            userRole={userRole}
            activePage={activePage}
            setActivePage={setActivePage}
          />

          <div className="lg:ml-72 flex-1">
            <motion.div 
              className="rounded-xl backdrop-blur-sm bg-white/5 border border-white/5 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={activePage}
            >
              {renderActivePage()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;