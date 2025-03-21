import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, User, Mail, Calendar, Activity, ChevronRight } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'alexj',
      fullName: 'Alex Johnson',
      email: 'alex@example.com',
      rolename: 'Customer',
      memberSince: 'March 2024',
      lastActive: '2 days ago',
      status: 'Active',
      location: 'New York, USA',
      phoneNumber: '+1 (555) 123-4567'
    },
    {
      id: 2,
      username: 'sarahw',
      fullName: 'Sarah Williams',
      email: 'sarah@example.com',
      rolename: 'Premium',
      memberSince: 'January 2024',
      lastActive: 'Today',
      status: 'Active',
      location: 'Los Angeles, USA',
      phoneNumber: '+1 (555) 987-6543'
    },
    {
      id: 3,
      username: 'michaelc',
      fullName: 'Michael Chen',
      email: 'michael@example.com',
      rolename: 'Customer',
      memberSince: 'February 2024',
      lastActive: '1 week ago',
      status: 'Inactive',
      location: 'Toronto, Canada',
      phoneNumber: '+1 (555) 456-7890'
    },
    {
      id: 4,
      username: 'emilyr',
      fullName: 'Emily Rodriguez',
      email: 'emily@example.com',
      rolename: 'Admin',
      memberSince: 'November 2023',
      lastActive: 'Yesterday',
      status: 'Active',
      location: 'Chicago, USA',
      phoneNumber: '+1 (555) 234-5678'
    }
  ]);

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
    setSelectedUser(null);
  };

  const handleSaveUser = (updatedUser) => {
    setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
    setSelectedUser(updatedUser);
  };

  const filteredUsers = users.filter(user => 
    (user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-light">User <span className="text-purple-400 font-medium">Management</span></h2>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-grow">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-700 px-4 py-2.5 rounded-lg flex items-center space-x-2"
        >
          <Filter className="w-4 h-4" />
          <span>Filter</span>
        </motion.button>
      </div>

      <div className="bg-gray-700 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-black/20 text-xs uppercase text-purple-400/60 tracking-wider font-medium">
          <div className="col-span-4 sm:col-span-3">Username</div>
          <div className="col-span-5 sm:col-span-4">Email</div>
          <div className="hidden sm:block sm:col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>
        
        {filteredUsers.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="col-span-4 sm:col-span-3 flex items-center space-x-3">
                  <div className="bg-purple-500/20 p-1.5 rounded-full">
                    <User className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="font-light truncate">{user.username}</div>
                </div>
                <div className="col-span-5 sm:col-span-4 flex items-center space-x-2 text-gray-300">
                  <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate text-sm">{user.email}</span>
                </div>
                <div className="hidden sm:flex sm:col-span-2 items-center text-gray-300">
                  <span className="text-sm">{user.rolename}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                    user.status === 'Active' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    <Activity className="w-3 h-3 mr-1" />
                    {user.status}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400">
            No users found matching "{searchTerm}"
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onDelete={handleDeleteUser}
            onSave={handleSaveUser}
            isAdmin={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;