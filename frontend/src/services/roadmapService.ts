import api from './api';
import { LearningRoadmap, PaginatedResponse, RoadmapListItem, RoadmapTask, TaskStatus } from '../types';

export const roadmapService = {
  async generateRoadmap(targetRole: string, durationWeeks: number): Promise<LearningRoadmap> {
    const response = await api.post('/api/roadmaps/generate/', {
      target_role: targetRole,
      duration_weeks: durationWeeks,
    });
    return response.data.roadmap;
  },

  async getRoadmaps(page = 1): Promise<PaginatedResponse<RoadmapListItem>> {
    const response = await api.get('/api/roadmaps/', { params: { page } });
    return response.data;
  },

  async getRoadmap(id: number): Promise<LearningRoadmap> {
    const response = await api.get(`/api/roadmaps/${id}/`);
    return response.data;
  },

  async deleteRoadmap(id: number): Promise<void> {
    await api.delete(`/api/roadmaps/${id}/`);
  },

  async updateTaskStatus(
    roadmapId: number,
    taskId: number,
    status: TaskStatus
  ): Promise<{ task: RoadmapTask; completion_percentage: number }> {
    const response = await api.patch(`/api/roadmaps/${roadmapId}/tasks/${taskId}/`, { status });
    return response.data;
  },
};