import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Our backend URL
});

// Interceptor: This function runs BEFORE every API request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // If a token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Auth Service ---
export const login = (username, password) => api.post('/login', { username, password });
export const register = (username, password) => api.post('/register', { username, password });

// --- Data Service (will be used by the calendar) ---
export const getAllEvents = () => api.get('/api/events/all');
export const saveAllEvents = (events) => api.post('/api/events/save_all', events);

// (Add getTasks, saveTasks, etc. here)

// --- Profile Service ---
export const getProfile = () => api.get('/profile');

export const updateProfile = (formData) => {
  // We send formData directly. Axios will set the 'multipart/form-data' header.
  return api.post('/profile', formData);
};

export default api;