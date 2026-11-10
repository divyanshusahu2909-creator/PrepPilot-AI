import api from './api';
import { ServiceConfig } from '../types';

export const configService = {
  async getConfig(): Promise<ServiceConfig> {
    const response = await api.get('/api/config/');
    return response.data;
  },
};