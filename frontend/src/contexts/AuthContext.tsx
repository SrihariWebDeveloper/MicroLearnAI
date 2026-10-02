import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isActive = true;
    const storedToken = sessionStorage.getItem('microlearn_token');
    localStorage.removeItem('microlearn_token');
    localStorage.removeItem('microlearn_user');

    const restoreSession = async () => {
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const currentUser = await authApi.getCurrentUser();
        if (isActive) setUser(currentUser);
      } catch {
        sessionStorage.removeItem('microlearn_token');
        if (isActive) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void restoreSession();
    return () => {
      isActive = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      setUser(res.user);
      sessionStorage.setItem('microlearn_token', res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(name, email, password);
      setToken(res.token);
      setUser(res.user);
      sessionStorage.setItem('microlearn_token', res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) await authApi.logout();
    } catch (error) {
      console.warn('Server logout failed; clearing the local session.', error);
    } finally {
      setToken(null);
      setUser(null);
      sessionStorage.removeItem('microlearn_token');
      localStorage.removeItem('microlearn_user');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
