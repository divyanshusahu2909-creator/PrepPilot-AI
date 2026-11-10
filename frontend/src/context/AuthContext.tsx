import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthTokens, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authService.getMe();
        setUser(me);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { tokens, user: loggedIn } = await authService.login(credentials);
    storeTokens(tokens);
    setUser(loggedIn);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const { tokens, user: registered } = await authService.register(data);
    storeTokens(tokens);
    setUser(registered);
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const { tokens, user: loggedIn } = await authService.googleLogin(credential);
    storeTokens(tokens);
    setUser(loggedIn);
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token') || '';
    try {
      await authService.logout(refresh);
    } catch {
      // Token may already be expired — local logout still applies.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, googleLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}