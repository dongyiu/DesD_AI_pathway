import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

// Create a more robust singleton pattern
export const AuthContext = createContext(null);

// Create a global instance to ensure consistency across components
let globalUserState = null;
let globalSetUserState = null;

export const AuthProvider = ({ children }) => {
  // Initialize user state from localStorage if available
  const initialUser = (() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : globalUserState;
    } catch (e) {
      console.error("Error parsing user data from localStorage:", e);
      return null;
    }
  })();
  
  // Use a reference to the global state if available, or fallback to localStorage
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  // Add loading state to track when auth is fully initialized
  const [loading, setLoading] = useState(!!token);

  // Store the state setters in global variables to ensure singleton pattern
  useEffect(() => {
    globalUserState = user;
    globalSetUserState = setUser;
  }, [user]);

  // When token changes, optionally fetch user info (if an endpoint is available)
  useEffect(() => {
    if (token) {
      console.log("AuthContext: Token found, fetching user data");
      setLoading(true);
      
      // Fetch the user profile using the appropriate endpoint
      const fetchUserData = async () => {
        try {
          // First try to get user data from auth endpoint
          const authRes = await axios.get(`${API_URL}/auth/users/me/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("AuthContext: User auth data:", authRes.data);
          
          // Then get more detailed profile data from my_account endpoint
          try {
            const profileRes = await axios.get(`${API_URL}/api/my_account/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log("AuthContext: User profile data:", profileRes.data);
            
            // Create a merged user data object from both responses
            const mergedBackendUser = {
              ...authRes.data,
              ...profileRes.data, // Overwrite with the profile data
            };
            
            // Now transform the merged backend data into the frontend format using userService
            import('../services/userService').then(userServiceModule => {
              const userService = userServiceModule.default;
              // Use the transformUserData function to get data in proper format
              const transformedUserData = userService.transformUserData(mergedBackendUser);
              console.log("AuthContext: Transformed user data:", transformedUserData);
              
              // Update state and localStorage
              setUser(transformedUserData);
              localStorage.setItem('user', JSON.stringify(transformedUserData));
            }).catch(error => {
              console.error("Failed to load userService:", error);
              
              // Fallback if userService import fails
              const userData = {
                ...authRes.data,
                basicInfo: {
                  fullName: authRes.data.first_name && authRes.data.last_name 
                    ? `${authRes.data.first_name} ${authRes.data.last_name}`
                    : authRes.data.username,
                  email: authRes.data.email,
                  // Add other fields from profileRes.data if available
                  ...profileRes.data.basicInfo
                }
              };
              
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
            });
            
          } catch (profileErr) {
            console.warn("Could not fetch detailed profile, using auth data only", profileErr);
            setUser({
              ...authRes.data,
              isAdmin: authRes.data.groups && authRes.data.groups.some(g => 
                g.name === 'Admin' || g === 'Admin'
              )
            });
            localStorage.setItem('user', JSON.stringify({
              ...authRes.data,
              isAdmin: authRes.data.groups && authRes.data.groups.some(g => 
                g.name === 'Admin' || g === 'Admin'
              )
            }));
          }
        } catch (err) {
          console.error('Error fetching user:', err);
          if (err.response) {
            console.error('Response:', err.response.status, err.response.data);
          }
          logout();
        } finally {
          setLoading(false);
        }
      };
      
      fetchUserData();
    } else {
      // Make sure user is null when token is null
      console.log("AuthContext: No token, setting user to null");
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Function to log in; expects username and password, and saves tokens on success.
  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log("AuthContext: Attempting login");
      const response = await axios.post(`${API_URL}/auth/jwt/create/`, { username, password });
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      setToken(accessToken);
      console.log("AuthContext: Login successful, token set");
      return true;
    } catch (err) {
      console.error("AuthContext: Login failed", err);
      setLoading(false);
      throw err;
    }
  };

  // Function to register a new user with role selection
  const register = async (email, username, password, role = 'Customer', title = '', forename = '', surname = '') => {
    try {
      setLoading(true);
      console.log("AuthContext: Attempting registration with role:", role);
      
      // Use our custom register endpoint that handles role assignment
      const response = await axios.post(`${API_URL}/api/register/`, {
        email,
        username,
        password,
        group: role, // Send the selected role
        title,       // Add title field
        forename,    // Add forename field
        surname     // Add surname field
      });
      
      console.log("AuthContext: Registration successful:", response.data);
      setLoading(false);
      return response.data;
    } catch (err) {
      console.error("AuthContext: Registration failed", err);
      console.error("Error details:", err.response?.data);
      setLoading(false);
      throw err;
    }
  };

  // Check if a user is approved
  const checkApprovalStatus = async () => {
    if (!token) return false;
    
    try {
      const response = await axios.get(`${API_URL}/api/my_account/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if user profile exists and is_approved is true
      return response.data?.profile?.is_approved || false;
    } catch (err) {
      console.error("Error checking approval status:", err);
      return false;
    }
  };

  // Logout clears tokens and user state.
  const logout = () => {
    console.log("AuthContext: Logging out");
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  // Create a consistent auth object to be passed through context
  const auth = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    checkApprovalStatus,
    setUser
  };

  console.log("AuthContext: Current auth state", { hasUser: !!user, hasToken: !!token, isLoading: loading });

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easier consumption of the auth context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Log each time useAuth is called to track where it's being used
  // console.log("useAuth called from component", { hasUser: !!context.user, isLoading: context.loading });
  
  return context;
};
