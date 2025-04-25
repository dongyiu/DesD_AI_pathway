import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Replace with your actual API base URL
const API_URL = 'http://localhost:8000/';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);

  // When token changes, optionally fetch user info (if an endpoint is available)
  useEffect(() => {
    if (token) {
      axios
        .get(`${API_URL}auth/users/me/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => setUser(res.data))
        .catch((err) => {
          console.error('Error fetching user:', err);
          logout();
        });
    }
  }, [token]);

  // Function to log in; expects username and password, and saves tokens on success.
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}auth/jwt/create/`, { username, password });
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      console.log(response.data)
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      setToken(accessToken);
      console.log('set accss tkn')
    } catch (err) {
      throw err;
    }
  };

  // Function to register a new user. Adjust field names to match your backend.
  const register = async (email, username, password) => {
    try {
      const response = await axios.post(`${API_URL}auth/users/`, {
        email,
        username,
        password,
        re_password: password
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Logout clears tokens and user state.
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, setUser }}>
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
  return context;
};
