import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Replace with your actual API base URL
const API_URL = 'http://localhost:8000/';

// Create a more robust singleton pattern
export const AuthContext = createContext(null);

// Create a global instance to ensure consistency across components
let globalUserState = null;
let globalSetUserState = null;

export const AuthProvider = ({ children }) => {
  // Use a reference to the global state if available
  const [user, setUser] = useState(globalUserState);
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
          const authRes = await axios.get(`${API_URL}auth/users/me/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("AuthContext: User auth data:", authRes.data);
          
          // Then get more detailed profile data from my_account endpoint
          try {
            const profileRes = await axios.get(`${API_URL}api/my_account/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log("AuthContext: User profile data:", profileRes.data);
            
            // Check if the response already includes is_admin field (our serializer adds this)
            const userData = {
              ...authRes.data,
              // Only add these properties if they don't already exist in the response
              basicInfo: authRes.data.basicInfo || profileRes?.data?.basicInfo || {},
            };
            
            // Log the final user data to check its structure
            console.log("AuthContext: Final processed user data:", userData);
            setUser(userData);
          } catch (profileErr) {
            console.warn("Could not fetch detailed profile, using auth data only", profileErr);
            setUser({
              ...authRes.data,
              isAdmin: authRes.data.groups && authRes.data.groups.some(g => 
                g.name === 'Admin' || g === 'Admin'
              )
            });
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
      const response = await axios.post(`${API_URL}auth/jwt/create/`, { username, password });
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

  // Function to register a new user. Adjust field names to match your backend.
  const register = async (email, username, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}auth/users/`, {
        email,
        username,
        password,
        re_password: password
      });
      setLoading(false);
      return response.data;
    } catch (err) {
      setLoading(false);
      throw err;
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
