import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AccountManagement from './pages/AccountManagement';
import Meeting from './pages/Meeting';
import ErrorBoundary from './components/ErrorBoundary';

import './App.css';

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path='/settings' element={<AccountManagement />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/live" element={<ErrorBoundary><Meeting /></ErrorBoundary>} />
        <Route path="*" element={<HomePage/>} />
      </Routes>
  );
}
