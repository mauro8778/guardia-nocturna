import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phone?: string; role?: 'STUDENT' | 'ADMIN' }) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  logout: () => void;
  toggleRole: () => void; // Permite probar la vista entre Alumno y Admin en demo
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('guardia_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch (error) {
          console.error('Error al restaurar sesión:', error);
          localStorage.removeItem('guardia_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('guardia_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (data: { email: string; password: string; fullName: string; phone?: string; role?: 'STUDENT' | 'ADMIN' }) => {
    const res = await authApi.register(data);
    localStorage.setItem('guardia_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const resetPassword = async (email: string, newPassword: string) => {
    const res = await authApi.resetPassword({ email, newPassword });
    if (res.access_token && res.user) {
      localStorage.setItem('guardia_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('guardia_token');
    setToken(null);
    setUser(null);
  };

  const toggleRole = () => {
    if (user) {
      const newRole = user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, resetPassword, logout, toggleRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
