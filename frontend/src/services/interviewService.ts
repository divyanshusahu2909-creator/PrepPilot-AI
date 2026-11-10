import api from './api';
import {
  Difficulty,
  InterviewSession,
  InterviewSessionListItem,
  PaginatedResponse,
  PracticeQuestion,
  QuestionCategory,
  StartInterviewPayload,
  SubmitAnswerResponse,
} from '../types';

export const interviewService = {
  async startSession(payload: StartInterviewPayload): Promise<InterviewSession> {
    const response = await api.post('/api/interviews/sessions/', payload);
    return response.data.session;
  },

  async getSession(id: number): Promise<InterviewSession> {
    const response = await api.get(`/api/interviews/sessions/${id}/`);
    return response.data;
  },

  async getSessions(page = 1): Promise<PaginatedResponse<InterviewSessionListItem>> {
    const response = await api.get('/api/interviews/sessions/', { params: { page } });
    return response.data;
  },

  async submitAnswer(sessionId: number, answerText: string, timeTakenSeconds: number): Promise<SubmitAnswerResponse> {
    const response = await api.post(`/api/interviews/sessions/${sessionId}/answer/`, {
      answer_text: answerText,
      time_taken_seconds: timeTakenSeconds,
    });
    return response.data;
  },

  async completeSession(sessionId: number): Promise<InterviewSession> {
    const response = await api.post(`/api/interviews/sessions/${sessionId}/complete/`);
    return response.data.session;
  },

  async abandonSession(sessionId: number): Promise<InterviewSession> {
    const response = await api.post(`/api/interviews/sessions/${sessionId}/abandon/`);
    return response.data.session;
  },

  async getPracticeQuestions(
    page = 1,
    category?: QuestionCategory,
    difficulty?: Difficulty
  ): Promise<PaginatedResponse<PracticeQuestion>> {
    const response = await api.get('/api/interviews/practice/', {
      params: { page, ...(category ? { category } : {}), ...(difficulty ? { difficulty } : {}) },
    });
    return response.data;
  },

  async generatePractice(
    category: QuestionCategory,
    difficulty: Difficulty,
    role?: string,
    count = 5
  ): Promise<{ questions: PracticeQuestion[]; demo: boolean }> {
    const response = await api.post('/api/interviews/practice/generate/', {
      category, difficulty, ...(role ? { role } : {}), count,
    });
    return response.data;
  },
};