import axios from 'axios';
import { auth } from './FirebaseConfig';

const API_URL = 'https://unihub-backend-ilwv.onrender.com/api'; 

const api = axios.create({
    baseURL: API_URL,
     timeout: 30000
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;