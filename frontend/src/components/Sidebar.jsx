import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Users as UsersIcon, Terminal, 
  Brain, ActivitySquare, TrendingUp,
  UserCircle
} from 'lucide-react';

const Sidebar = ({ isMenuOpen, userRole, activePage, setActivePage, setIsMenuOpen }) => {
  const rolePages = {
    user: [
      { id: 'profile', label: 'My Profile', icon: User },
      { id: 'stats', label: 'Fitness Stats', icon: ActivitySquare }
    ],
    admin: [
      { id: 'users', label: 'User Management', icon: UsersIcon },
      { id: 'userDetails', label: 'User Details', icon: UserCircle },
      { id: 'stats', label: 'Analytics', icon: TrendingUp }
    ],
    engineer: [
      { id: 'models', label: 'ML Models', icon: Brain },
      { id: 'api', label: 'API Access', icon: Terminal }
    ]
  };

  return (
    <AnimatePresence>
      <motion.div 
        className={`lg:w-64 ${isMenuOpen ? 'block fixed top-20 left-4 right-4 z-40 bg-gray-900/95 backdrop-blur-md rounded-xl p-4 border border-white/5' : 'hidden'} 
                   lg:block lg:fixed lg:top-24 lg:bottom-6 lg:overflow-y-auto
                   scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="space-y-2">
          {rolePages[userRole].map((page) => (
            <motion.div
              key={page.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                setActivePage(page.id);
                if (window.innerWidth < 1024) setIsMenuOpen(false);
              }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer
                ${activePage === page.id ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <page.icon className="w-4 h-4" />
              <span className="text-sm font-light">{page.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Sidebar;