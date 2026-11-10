import api from './api';
import { PaginatedResponse, Resume, ResumeAnalysis, ResumeQuestion } from '../types';

export const resumeService = {
  async uploadResume(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<{ message: string; resume: Resume; text_extracted: boolean }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/resumes/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return response.data;
  },

  async analyzeResume(resumeId: number, targetRole?: string): Promise<{ message: string; analysis: ResumeAnalysis }> {
    const response = await api.post(`/api/resumes/${resumeId}/analyze/`, targetRole ? { target_role: targetRole } : {});
    return response.data;
  },

  async getResumes(page = 1): Promise<PaginatedResponse<Resume>> {
    const response = await api.get('/api/resumes/', { params: { page } });
    return response.data;
  },

  async getResume(id: number): Promise<Resume> {
    const response = await api.get(`/api/resumes/${id}/`);
    return response.data;
  },

  async deleteResume(id: number): Promise<void> {
    await api.delete(`/api/resumes/${id}/`);
  },

  async getQuestions(id: number, count = 6): Promise<{ questions: ResumeQuestion[]; demo: boolean }> {
    const response = await api.post(`/api/resumes/${id}/questions/`, { count });
    return response.data;
  },

  async getAnalysisHistory(page = 1): Promise<PaginatedResponse<ResumeAnalysis>> {
    const response = await api.get('/api/resumes/analyses/', { params: { page } });
    return response.data;
  },
};