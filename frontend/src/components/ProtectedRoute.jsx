// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, requireEngineer = false}) {
  // Match Navbar.jsx's implementation exactly - note that Navbar doesn't destructure
  const user = useAuth();

  console.log('ProtectedRoute: Auth State', {
    isLoading: user.loading,
    hasUser: !!user.user,
    requireAdmin,
    requireEngineer
  });

  // Show loading state while authentication is being determined
  if (user.loading) {
    console.log("ProtectedRoute: Authentication is still loading");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-white ml-3">Authenticating...</p>
      </div>
    );
  }

  // Check for authentication exactly like Navbar does - Navbar uses { user.user ? (...) : (...) }
  // So we need to check if user.user is truthy, not if it's falsy
  if (!user.user) {
    console.log("ProtectedRoute: Not authenticated, redirecting to /auth");
    return <Navigate to="/auth" />;
  }

  console.log("ProtectedRoute: User authenticated, rendering children");

  // // Check if route requires admin privileges
  // if (requireAdmin && user?.rolename !== 'Admin') {
  //   return <Navigate to="/dashboard" replace />;
  // }

  //   // Check if route requires admin privileges
  // if (requireEngineer && user?.rolename !== 'AIEngineer') {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return children;
}