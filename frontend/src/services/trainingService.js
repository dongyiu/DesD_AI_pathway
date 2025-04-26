import authService from './authService';

const { apiClient } = authService;

// Get all users (admin only)
const trainModel = async () => {
  try {
    const response = await apiClient.get('api/train_model/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default userService; 