import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to attach the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// --- Auth Service ---
export const login = (username, password) => 
    api.post('/login', { username, password });

export const register = (username, password) => 
    api.post('/register', { username, password });

// --- Event Service ---
export const getAllEvents = () => 
    api.get('/events/all');

export const saveAllEvents = (events) => 
    api.post('/events/save_all', events);

// --- Task Service ---
export const getTasks = (year) => 
    api.get(`/tasks/${year}`);

export const saveTasks = (tasks, year) => 
    api.post(`/tasks/${year}`, tasks);

// --- Chatbot Service ---
export const parseImage = (base64Image, prompt) => 
    api.post('/chat/parse_image', { image: base64Image, prompt });

// ✨ NEW FUNCTION: Send text prompt to backend for scheduling
export const scheduleEventFromText = (history) => api.post('/chat/schedule_event', {
    history: history // Send the whole history object
});

// --- Profile Service ---
export const getProfile = () => 
    api.get('/profile');

export const updateProfile = (formData) => {
    // We send formData directly. Axios will set the 'multipart/form-data' header.
    return api.post('/profile', formData);
};

// --- FINAL EXPORT ---
// IMPORTANT: We need to export all these functions within a default object
// so App.jsx can import them all easily.

export default {
    login,
    register,
    getAllEvents,
    saveAllEvents,
    getTasks,
    saveTasks,
    parseImage,
    scheduleEventFromText,
    getProfile,
    updateProfile,
};