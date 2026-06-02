import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '../types';
import { getMe, login as apiLogin, register as apiRegister, getToken, setToken, clearToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    getMe()
      .then((response) => {
        if (response.success) {
          setUser(response.data.user);
          connectSocket(token);
        } else {
          clearToken();
        }
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (!response.success) {
      throw new Error('Login failed');
    }
    setToken(response.data.token);
    setUser(response.data.user);
    connectSocket(response.data.token);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await apiRegister(name, email, password);
    if (!response.success) {
      throw new Error('Registration failed');
    }
    setToken(response.data.token);
    setUser(response.data.user);
    connectSocket(response.data.token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    disconnectSocket();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

