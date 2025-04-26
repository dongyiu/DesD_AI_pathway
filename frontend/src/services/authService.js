import axios from 'axios';

const API_URL = 'http://localhost:8000/';

// Create a base axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 (Unauthorized) and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to get a new token using the refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, need to login again
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${API_URL}auth/jwt/refresh/`, {
          refresh: refreshToken
        });
        
        // Save the new access token
        localStorage.setItem('access_token', response.data.access);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh token is invalid, need to login again
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location = '/auth';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Login user and get JWT token
const login = async (username, password) => {
  try {
    const response = await apiClient.post('auth/jwt/create/', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Get current user information
const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('api/my_account/');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Register a new user
const register = async (username, email, password) => {
  try {
    const response = await apiClient.post('auth/users/', {
      username,
      email,
      password,
      re_password: password
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user profile
const updateProfile = async (userData) => {
  try {
    const response = await apiClient.patch('api/my_account/', userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Check if user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  return !!token;
};

// Export all auth functions
const authService = {
  login,
  register,
  getCurrentUser,
  updateProfile,
  logout,
  isAuthenticated,
  apiClient
};

export default authService; 