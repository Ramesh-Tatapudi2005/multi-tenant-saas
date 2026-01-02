import axios from 'axios';

const API = axios.create({
    // This pulls the URL from your root .env file
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Interceptor to attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API; // This is the "default export" your error mentions