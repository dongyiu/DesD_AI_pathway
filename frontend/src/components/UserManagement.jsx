import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, User, Mail, Calendar, Activity, 
  ChevronRight, X, CheckCircle, SlashIcon, UserPlus, 
  ArrowUpDown, RefreshCw, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import userService from '../services/userService';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const tableRowVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  }
};

const UserManagement = ({ isDarkMode = true, onSelectUser, onDeleteUser, onSaveUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [users, setUsers] = useState([]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching users...");
      
      const response = await userService.getAllUsers();
      console.log("API response:", response);
      
      if (response) {
        // Transform backend users to frontend format if needed
        const formattedUsers = response.map(user => ({
          id: user.id,
          username: user.username,
          fullName: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username,
          email: user.email || 'No email',
          rolename: user.groups && user.groups.length > 0 ? user.groups[0].name : 'Customer',
          memberSince: new Date(user.date_joined).toLocaleDateString(),
          lastActive: 'Recently',
          status: user.is_active ? 'Active' : 'Inactive',
          location: user.location || 'Not specified',
          phoneNumber: user.phone_number || 'Not specified'
        }));
        
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setIsLoading(true);
      await userService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      
      if (onDeleteUser) {
        onDeleteUser(userId);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserUpdate = async (updatedUser) => {
    try {
      setIsLoading(true);
      // Format user data for backend if needed
      const response = await userService.updateUser(updatedUser.id, updatedUser);
      setUsers(users.map(user => user.id === updatedUser.id ? {...user, ...updatedUser} : user));
      
      if (onSaveUser) {
        onSaveUser(updatedUser);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
  };

  const filteredUsers = users.filter(user => {
    // Apply search filter
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply role filter
    const matchesRole = filterRole === 'All' || user.rolename === filterRole;
    
    // Apply status filter
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roles = ['All', ...new Set(users.map(user => user.rolename))];
  const statuses = ['All', ...new Set(users.map(user => user.status))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className={`text-2xl font-light ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          User <span className="text-purple-400 font-medium">Management</span>
        </h2>
        
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={`${
            isDarkMode 
              ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20' 
              : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
          } px-4 py-2 rounded-lg flex items-center space-x-2 text-sm shadow-md`}
        >
          <UserPlus className="w-4 h-4" />
          <span className="font-medium">Add User</span>
        </motion.button>
      </div>

      {error && (
        <div className={`p-4 mb-4 rounded-lg flex items-center ${
          isDarkMode 
            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
          <button 
            className="ml-auto"
            onClick={() => setError(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-white/10 focus:border-purple-500/50' 
                : 'bg-white text-gray-800 border border-gray-200 focus:border-purple-500'
            } rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 ${
              isDarkMode ? 'focus:ring-purple-500/30' : 'focus:ring-purple-500/50'
            } shadow-md`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFiltering(!isFiltering)}
          className={`${
            isDarkMode 
              ? 'bg-gray-800/80 backdrop-blur-md border border-white/5 text-white' 
              : 'bg-white border border-gray-200 text-gray-700'
          } px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-md ${
            isFiltering ? (isDarkMode ? 'ring-2 ring-purple-500/30' : 'ring-2 ring-purple-500/20') : ''
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter</span>
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
            isDarkMode 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            {(filterRole !== 'All' ? 1 : 0) + (filterStatus !== 'All' ? 1 : 0)}
          </span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshUsers}
          disabled={isLoading}
          className={`${
            isDarkMode 
              ? 'bg-gray-800/80 backdrop-blur-md border border-white/5 text-white' 
              : 'bg-white border border-gray-200 text-gray-700'
          } px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-md`}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">Refresh</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isFiltering && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${
              isDarkMode 
                ? 'bg-gray-800 border border-white/10' 
                : 'bg-gray-50 border border-gray-200'
            } rounded-lg p-4 mb-6 overflow-hidden shadow-md`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role
                </label>
                <select 
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className={`w-full ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border border-gray-600' 
                      : 'bg-white text-gray-800 border border-gray-300'
                  } rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                    isDarkMode ? 'focus:ring-purple-500/30 focus:border-purple-500/50' : 'focus:ring-purple-500/40 focus:border-purple-500'
                  }`}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Status
                </label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border border-gray-600' 
                      : 'bg-white text-gray-800 border border-gray-300'
                  } rounded-lg px-3 py-2 focus:outline-none focus:ring-1 ${
                    isDarkMode ? 'focus:ring-purple-500/30 focus:border-purple-500/50' : 'focus:ring-purple-500/40 focus:border-purple-500'
                  }`}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button 
                onClick={() => {
                  setFilterRole('All');
                  setFilterStatus('All');
                }}
                className={`text-sm ${
                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                } mr-4`}
              >
                Reset Filters
              </button>
              
              <button 
                onClick={() => setIsFiltering(false)}
                className={`text-sm ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${
        isDarkMode 
          ? 'bg-gray-800 border border-white/10' 
          : 'bg-white border border-gray-200'
      } rounded-xl overflow-hidden shadow-lg`}>
        <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b ${
          isDarkMode ? 'border-white/5 bg-black/20' : 'border-gray-200 bg-gray-50'
        } text-xs uppercase tracking-wider font-medium`}>
          <div className="col-span-4 sm:col-span-3 flex items-center space-x-1">
            <span className={isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}>Username</span>
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          </div>
          <div className="col-span-5 sm:col-span-4 flex items-center space-x-1">
            <span className={isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}>Email</span>
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          </div>
          <div className="hidden sm:flex sm:col-span-2 items-center space-x-1">
            <span className={isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}>Role</span>
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          </div>
          <div className="col-span-2 flex items-center space-x-1">
            <span className={isDarkMode ? 'text-purple-400/70' : 'text-purple-600/70'}>Status</span>
            <ArrowUpDown className="w-3 h-3 opacity-50" />
          </div>
          <div className="col-span-1"></div>
        </div>
        
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-20"
            >
              <RefreshCw className={`w-8 h-8 animate-spin ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <span className={`ml-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Loading users...</span>
            </motion.div>
          ) : filteredUsers.length > 0 ? (
            <motion.div 
              className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-gray-200'}`}
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  variants={tableRowVariant}
                  whileHover={{ 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                  }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
                  onClick={() => onSelectUser && onSelectUser(user)}
                >
                  <div className="col-span-4 sm:col-span-3 flex items-center space-x-3">
                    <div className={`${
                      isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                    } p-1.5 rounded-full`}>
                      <User className={`w-4 h-4 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className={`font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {user.username}
                    </div>
                  </div>
                  
                  <div className="col-span-5 sm:col-span-4 flex items-center space-x-2">
                    <Mail className={`w-3 h-3 flex-shrink-0 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`truncate text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {user.email}
                    </span>
                  </div>
                  
                  <div className="hidden sm:flex sm:col-span-2 items-center">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      user.rolename === 'Admin' 
                        ? isDarkMode 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-purple-100 text-purple-700'
                        : user.rolename === 'Premium' 
                          ? isDarkMode 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-blue-100 text-blue-700'
                          : isDarkMode 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.rolename}
                    </span>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      user.status === 'Active' 
                        ? isDarkMode 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-green-100 text-green-700'
                        : isDarkMode 
                          ? 'bg-gray-700 text-gray-400' 
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.status === 'Active' 
                        ? <CheckCircle className="w-3 h-3 mr-1" /> 
                        : <SlashIcon className="w-3 h-3 mr-1" />
                      }
                      {user.status}
                    </span>
                  </div>
                  
                  <div className="col-span-1 flex justify-end">
                    <ChevronRight className={`w-4 h-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`py-16 text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <div className="flex flex-col items-center">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <p className="mb-2 text-lg">No users found</p>
                <p className="text-sm opacity-70">
                  {searchTerm 
                    ? `No matches for "${searchTerm}"` 
                    : 'Try adjusting your filters'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserManagement;