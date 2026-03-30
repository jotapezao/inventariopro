import api from './api';

export const login = async (usuario, senha) => {
  const response = await api.post('/auth/login', { usuario, senha });
  const { token, user } = response.data;
  
  localStorage.setItem('@Inventario:token', token);
  localStorage.setItem('@Inventario:user', JSON.stringify(user));
  
  return user;
};

export const logout = () => {
  localStorage.removeItem('@Inventario:token');
  localStorage.removeItem('@Inventario:user');
};

export const registerAdmin = async (nome, usuario, email, senha) => {
  // Rota auxiliar do MVP para registrar o primeiro admin sem token
  await api.post('/auth/setup-initial-admin', { nome, usuario, email, senha });
};
