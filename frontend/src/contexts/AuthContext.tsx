import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { getStoredUser, getStoredToken, setAuthData, clearAuthData } from '@/lib/auth';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (name: string, email: string, username: string, password: string, role: 'master' | 'apprentice') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      // Username yoki email ekanligini aniqlash
      const isEmail = usernameOrEmail.includes('@');
      const loginData = isEmail 
        ? { email: usernameOrEmail, password }
        : { username: usernameOrEmail, password };

      // Debug uchun
      
      const response = await api.post('/auth/login', loginData);
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      setAuthData(userData, userToken);
    } catch (error: any) {
      // Debug uchun
      throw new Error(error.response?.data?.message || 'Kirish muvaffaqiyatsiz');
    }
  };

  const register = async (name: string, email: string, username: string, password: string, role: 'master' | 'apprentice') => {
    try {
      const response = await api.post('/auth/register', { name, email, username, password, role });
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      setAuthData(userData, userToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Ro\'yxatdan o\'tish muvaffaqiyatsiz');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthData();
  };

  const refreshUser = async () => {
    try {
      if (token) {
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        setUser(userData);
        setAuthData(userData, token);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};