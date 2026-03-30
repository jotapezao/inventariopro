import { createContext, useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, registerAdmin } from '../services/auth';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storagedUser = localStorage.getItem('@Inventario:user');
    const storagedToken = localStorage.getItem('@Inventario:token');

    try {
      if (storagedToken && storagedUser) {
        setUser(JSON.parse(storagedUser));
      }
    } catch (e) {
      localStorage.removeItem('@Inventario:token');
      localStorage.removeItem('@Inventario:user');
    }
    setLoading(false);
  }, []);

  async function login(usuario, senha) {
    const userData = await authLogin(usuario, senha);
    setUser(userData);
  }

  function logout() {
    authLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, login, logout, registerAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
