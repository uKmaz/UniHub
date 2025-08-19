import axios from 'axios';
import { auth } from './FirebaseConfig';

const API_URL = 'http://192.168.1.101:8080/api'; 

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