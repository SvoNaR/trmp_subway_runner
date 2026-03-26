import { storage } from '../utils/storage';
import axios from 'axios';

// Change this to your computer's IP address when testing on real device
const API_BASE_URL = 'http://192.168.1.160:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: async (username, email, password) => {
    try {
      const response = await api.post('/register', { username, email, password });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.token) {
        await storage.setItem('token', response.data.token);
        await storage.setItem('user', JSON.stringify(response.data.user));
      }
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  logout: async () => {
    await storage.removeItem('token');
    await storage.removeItem('user');
  },

  getCurrentUser: async () => {
    const userStr = await storage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: async () => {
    return await storage.getItem('token');
  },
};

export const scoreService = {
  saveScore: async (score, coins, distance) => {
    try {
      const response = await api.post('/scores', { score, coins, distance });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to save score' 
      };
    }
  },

  getScores: async () => {
    try {
      const response = await api.get('/scores');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get scores' 
      };
    }
  },

  getLeaderboard: async () => {
    try {
      const response = await api.get('/leaderboard');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get leaderboard' 
      };
    }
  },
};

export const progressService = {
  getProgress: async () => {
    try {
      const response = await api.get('/progress');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get progress' 
      };
    }
  },
};

export default api;
