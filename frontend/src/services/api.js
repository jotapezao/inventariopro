import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Endereço do backend
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Inventario:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
