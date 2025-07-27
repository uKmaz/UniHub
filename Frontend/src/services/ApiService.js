import axios from 'axios';
import { auth } from './FirebaseConfig';

const API_URL = 'http://192.168.1.106:8080/api'; // Kendi IP adresinle değiştir

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken(true); // 'true' parametresi token'ı yenilemeye zorlar
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;