import api from './api';
import { AdminStats, AdminUser, DashboardData, PaginatedResponse, UserRole } from '../types';

export const analyticsService = {
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get('/api/analytics/dashboard/');
    return response.data;
  },

  async getAdminStats(): Promise<AdminStats> {
    const response = await api.get('/api/analytics/admin/');
    return response.data;
  },

  async getAdminUsers(page = 1, search = ''): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get('/api/analytics/admin/users/', {
      params: { page, ...(search ? { search } : {}) },
    });
    return response.data;
  },

  async updateAdminUser(
    id: number,
    data: { is_active?: boolean; role?: UserRole }
  ): Promise<{ id: number; email: string; role: UserRole; is_active: boolean }> {
    const response = await api.patch(`/api/analytics/admin/users/${id}/`, data);
    return response.data;
  },
};