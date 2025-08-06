import axios from 'axios';

// Create Axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend.herokuapp.com'  // Replace with your Heroku app URL
    : 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    // Get JWT token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        window.location.href = '/auth/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API functions for NFT marketplace
export const nftAPI = {
  // Get all available NFTs
  getNFTs: async (params = {}) => {
    try {
      const response = await api.get('/api/nfts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      throw error;
    }
  },

  // Get NFT by ID
  getNFTById: async (nftId) => {
    try {
      const response = await api.get(`/api/nfts/${nftId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching NFT:', error);
      throw error;
    }
  },

  // Initiate INR purchase
  purchaseINR: async (nftId) => {
    try {
      const response = await api.post(`/api/purchase/inr/${nftId}`);
      return response.data;
    } catch (error) {
      console.error('Error initiating INR purchase:', error);
      throw error;
    }
  },

  // Initiate USD purchase
  purchaseUSD: async (nftId) => {
    try {
      const response = await api.post(`/api/purchase/usd/${nftId}`);
      return response.data;
    } catch (error) {
      console.error('Error initiating USD purchase:', error);
      throw error;
    }
  },

  // Get user purchases
  getUserPurchases: async () => {
    try {
      const response = await api.get('/api/my-purchases');
      return response.data;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      throw error;
    }
  },

  // Get user transactions
  getUserTransactions: async (status = null) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/api/my-transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  },
};

// Auth API functions
export const authAPI = {
  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Verify JWT token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify-token');
      return response.data;
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      localStorage.removeItem('jwt_token');
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('jwt_token');
      throw error;
    }
  },
};

// Admin API functions
export const adminAPI = {
  // Get pending transactions
  getPendingTransactions: async () => {
    try {
      const response = await api.get('/api/admin/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      throw error;
    }
  },

  // Verify transaction
  verifyTransaction: async (transactionId) => {
    try {
      const response = await api.post(`/api/admin/verify-transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw error;
    }
  },
};

export default api;
