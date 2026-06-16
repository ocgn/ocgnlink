import axios from 'axios';
import { CONFIG } from '@/config';

const apiClient = axios.create({
  baseURL: CONFIG.apiBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || '网络错误';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
