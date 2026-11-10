import api from './api';
import { ProfileResponse } from '../types';

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get('/api/profile/');
    return response.data;
  },

  async updateProfile(data: FormData | Record<string, unknown>): Promise<ProfileResponse> {
    const isForm = data instanceof FormData;
    const response = await api.patch('/api/profile/', data, {
      headers: isForm ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
};