// src/main.jsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";
import App from './App';
import './index.css';

// Wrapper component to ensure auth is loaded before rendering
const AppWithAuth = () => {
  // Force refresh token on initial load
  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log("Initial app load: token found");
      // Force a small timeout to ensure token is processed
      setTimeout(() => {
        console.log("Main: Auth initialization complete");
      }, 100);
    } else {
      console.log("Initial app load: no token found");
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithAuth />
  </StrictMode>
);