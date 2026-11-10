import api from './api';
import { AuthResponse, AuthTokens, LoginCredentials, RegisterData, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/api/auth/login/', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
  },

  async googleLogin(credential: string): Promise<AuthResponse> {
    const response = await api.post('/api/auth/google/', { credential });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/api/auth/logout/', { refresh: refreshToken });
  },

  async refreshToken(refresh: string): Promise<AuthTokens> {
    const response = await api.post('/api/auth/token/refresh/', { refresh });
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get('/api/auth/me/');
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/api/auth/password-reset/', { email });
    return response.data;
  },

  async resetPassword(uid: string, token: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/api/auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
      new_password2: newPassword,
    });
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post('/api/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword,
    });
    return response.data;
  },
};