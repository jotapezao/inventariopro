import axios from 'axios';

const api = axios.create({
  // Em produção no Railway, o backend e frontend estão no mesmo domínio agora.
  // Usar VITE_API_URL se disponível (para desenvolvimento), senão usa '/api' relativo.
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Inventario:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
