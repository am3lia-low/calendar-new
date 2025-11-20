// frontend/src/services/api.js
import axios from 'axios';

// 1. Create the Axios instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:5001', 
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Request Interceptor for Authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. API Functions (Exported Individually)

// --- Auth Service ---
export const login = (username, password) => 
    api.post('/api/login', { username, password });

export const register = (username, password) => 
    api.post('/api/register', { username, password });

export const getProfile = () => 
    api.get('/api/profile');

export const updateProfile = (formData) => 
    api.post('/api/profile', formData);


// --- Event Service ---
export const getAllEvents = () => 
    api.get('/api/events/all');

export const saveAllEvents = (events) => 
    api.post('/api/events/save_all', events);

export const updateRecurrence = (data) => 
    api.put('/api/events/recurrence', data);


// --- Task / Checklist Service ---
export const loadTasks = () => 
    api.get('/api/tasks');

export const saveTask = (task) => 
    api.post('/api/tasks', task);

export const deleteTask = (taskId) => 
    api.delete(`/api/tasks/${taskId}`);

export const updateTask = (taskId, data) => 
    api.put(`/api/tasks/${taskId}`, data);


// --- Chatbot Service ---
export const parseImage = (base64Image, prompt) => 
    api.post('/api/chat/parse_image', { image: base64Image, prompt });

// Agentic Scheduling (Takes full history)
export const scheduleEventFromText = (history) => 
    api.post('/api/chat/schedule_event', { history });


// 4. Default Export (For backward compatibility)
const exportedApi = {
    login,
    register,
    getProfile,
    updateProfile,
    getAllEvents,
    saveAllEvents,
    updateRecurrence,
    loadTasks,
    saveTask,
    deleteTask,
    updateTask,
    parseImage,
    scheduleEventFromText,
};

export default exportedApi;