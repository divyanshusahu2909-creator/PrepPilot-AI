import api from './api';
import {
  CommunicationReport,
  PaginatedResponse,
  VoiceExercises,
  VoiceMessage,
  VoiceMetrics,
  VoiceMode,
  VoiceSession,
  VoiceSessionListItem,
} from '../types';

export const voiceService = {
  async startSession(mode: VoiceMode, topic?: string): Promise<VoiceSession> {
    const response = await api.post('/api/voice/sessions/', { mode, ...(topic ? { topic } : {}) });
    return response.data.session;
  },

  async sendMessage(
    sessionId: number,
    text: string,
    metrics?: VoiceMetrics
  ): Promise<{ user_message: VoiceMessage; ai_message: VoiceMessage }> {
    const response = await api.post(`/api/voice/sessions/${sessionId}/message/`, { text, metrics: metrics || {} });
    return response.data;
  },

  async completeSession(sessionId: number): Promise<{ session: VoiceSession; report: CommunicationReport }> {
    const response = await api.post(`/api/voice/sessions/${sessionId}/complete/`);
    return response.data;
  },

  async abandonSession(sessionId: number): Promise<VoiceSession> {
    const response = await api.post(`/api/voice/sessions/${sessionId}/abandon/`);
    return response.data.session;
  },

  async getSession(id: number): Promise<VoiceSession> {
    const response = await api.get(`/api/voice/sessions/${id}/`);
    return response.data;
  },

  async getSessions(page = 1): Promise<PaginatedResponse<VoiceSessionListItem>> {
    const response = await api.get('/api/voice/sessions/', { params: { page } });
    return response.data;
  },

  async getExercises(): Promise<VoiceExercises> {
    const response = await api.get('/api/voice/exercises/');
    return response.data;
  },
};