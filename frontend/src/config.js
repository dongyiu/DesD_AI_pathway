// Configuration variables for the application

// First check if window._env_ exists (runtime environment variables)
// Then check Vite environment variables (build-time)
// Finally fall back to localhost
export const API_URL =
  (typeof window !== 'undefined' && window._env_?.VITE_API_URL) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

// AI service URL for WebSocket connection
export const AI_URL =
  (typeof window !== 'undefined' && window._env_?.VITE_AI_URL) ||
  import.meta.env.VITE_AI_URL ||
  'http://localhost:8001';

// Other configuration variables can be added here 