// Configuration variables for the application

// Priority order:
// 1. Runtime environment variables (window._env_ - for Docker)
// 2. Build-time environment variables (import.meta.env - for Vercel)
// 3. Fallback to localhost for local development
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window._env_?.VITE_API_URL) ||
  'http://localhost:8000';

// AI service URL for WebSocket connection
export const AI_URL =
  import.meta.env.VITE_AI_URL ||
  (typeof window !== 'undefined' && window._env_?.VITE_AI_URL) ||
  'http://localhost:8001';

// Other configuration variables can be added here 