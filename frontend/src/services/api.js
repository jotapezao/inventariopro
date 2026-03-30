import axios from 'axios';

const api = axios.create({
  // Em produção no Railway, o backend e frontend podem estar no mesmo domínio (se servidos juntos)
  // ou em domínios diferentes. Usar VITE_API_URL se disponível, senão assume a porta padrão local.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Inventario:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
