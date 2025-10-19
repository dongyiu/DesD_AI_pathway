import axios from 'axios';
import { API_URL } from '../config';

// Create an axios instance with default config
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

// Error logging interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error details for easier debugging
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

// API Services for different endpoints
const subscriptionService = {
  getCurrentSubscription: async () => {
    return apiClient.get('api/subscriptions/my_subscription/');
  },
  subscribe: async (planData) => {
    return apiClient.post('api/subscriptions/subscribe/', planData);
  }
};

const invoiceService = {
  getMyInvoices: async () => {
    return apiClient.get('api/invoices/my_invoices/');
  },
  getInvoiceDetails: async (invoiceId) => {
    // Use apiClient directly with proper error handling in the component
    return apiClient.get(`api/invoices/${invoiceId}/`);
  },
  payInvoice: async (invoiceId) => {
    return apiClient.post(`api/invoices/${invoiceId}/pay/`);
  }
};

const usageService = {
  getSummary: async () => {
    return apiClient.get('api/usage/summary/');
  },
  getUsageSessions: async () => {
    return apiClient.get('api/usage/');
  },
  startSession: async (sessionData) => {
    return apiClient.post('api/usage/start_session/', sessionData);
  }
};

const lastViewedExerciseService = {
  getLastViewed: async () => {
    return apiClient.get('api/last-viewed-exercise/my_last_viewed/');
  },
  updateLastViewed: async (exerciseData) => {
    return apiClient.post('api/last-viewed-exercise/update_last_viewed/', exerciseData);
  }
};

export {
  apiClient,
  subscriptionService,
  invoiceService,
  usageService,
  lastViewedExerciseService
}; 