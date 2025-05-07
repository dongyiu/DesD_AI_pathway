import authService from './authService';

const { apiClient } = authService;

// Get all users (admin only)
const getAllUsers = async () => {
  console.log("Calling getAllUsers API endpoint");
  
  try {
    // Get the current token
    const token = localStorage.getItem('access_token');
    console.log("Using token:", token ? `${token.substring(0, 10)}...` : 'No token');
    
    const response = await apiClient.get('api/manage_accounts/');
    console.log("getAllUsers success:", response);
    return response.data;
  } catch (error) {
    console.error("getAllUsers error:", error);
    if (error.response) {
      console.error("Error details:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw error;
  }
};

// Get user by ID (admin only)
const getUserById = async (id) => {
  try {
    const response = await apiClient.get(`api/manage_accounts/${id}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new user (admin only)
const createUser = async (userData) => {
  try {
    const response = await apiClient.post('api/manage_accounts/', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user (admin only)
const updateUser = async (id, userData) => {
  try {
    const response = await apiClient.patch(`api/manage_accounts/${id}/`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user (admin only)
const deleteUser = async (id) => {
  try {
    await apiClient.delete(`api/manage_accounts/${id}/`);
    return true;
  } catch (error) {
    throw error;
  }
};

// Transform backend user data to frontend format
const transformUserData = (backendUser) => {
  if (!backendUser) return null;

  // Helper function to properly format values for display
  const formatValue = (value, defaultValue = '') => {
    // Only use the default value for null/undefined when displaying in UI
    if (value === undefined || value === null) {
      return defaultValue;
    }
    return value;
  };
  
  return {
    id: backendUser.id,
    username: backendUser.username,
    email: backendUser.email,
    groups: backendUser.groups,
    rolename: backendUser.rolename,
    is_admin: backendUser.is_admin,
    basicInfo: {
      fullName: backendUser.first_name && backendUser.last_name 
        ? `${backendUser.first_name} ${backendUser.last_name}`
        : backendUser.username,
      email: backendUser.email,
      memberSince: backendUser.date_joined 
        ? new Date(backendUser.date_joined).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })
        : ''
    },
    fitnessProfile: {
      height: formatValue(backendUser.height),
      weight: formatValue(backendUser.weight),
      bodyFat: formatValue(backendUser.body_fat),
      fitnessLevel: formatValue(backendUser.fitness_level)
    },
    preferences: {
      primaryGoal: formatValue(backendUser.primary_goal),
      workoutFrequency: formatValue(backendUser.workout_frequency),
      preferredTime: formatValue(backendUser.preferred_time),
      focusAreas: formatValue(backendUser.focus_areas)
    },
    achievements: {
      workoutsCompleted: backendUser.workouts_completed?.toString() || '0',
      daysStreak: backendUser.days_streak?.toString() || '0',
      personalBests: backendUser.personal_bests?.toString() || '0',
      points: backendUser.points?.toString() || '0'
    }
  };
};

// Transform frontend user data to backend format for updates
const transformUserDataForBackend = (frontendUser) => {
  // Extract first and last name from fullName
  let firstName = '';
  let lastName = '';
  
  if (frontendUser.basicInfo?.fullName) {
    const nameParts = frontendUser.basicInfo.fullName.split(' ');
    if (nameParts.length >= 2) {
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    } else {
      firstName = frontendUser.basicInfo.fullName;
    }
  }
  
  return {
    email: frontendUser.basicInfo?.email,
    first_name: firstName,
    last_name: lastName,
    
    // Fitness profile
    height: frontendUser.fitnessProfile?.height,
    weight: frontendUser.fitnessProfile?.weight,
    body_fat: frontendUser.fitnessProfile?.bodyFat,
    fitness_level: frontendUser.fitnessProfile?.fitnessLevel,
    
    // Preferences
    primary_goal: frontendUser.preferences?.primaryGoal,
    workout_frequency: frontendUser.preferences?.workoutFrequency,
    preferred_time: frontendUser.preferences?.preferredTime,
    focus_areas: frontendUser.preferences?.focusAreas,
  };
};

// Export all user functions
const userService = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  transformUserData,
  transformUserDataForBackend
};

export default userService;