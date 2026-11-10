// ============================================================
// Shared API types — these mirror the Django backend exactly.
// ============================================================

export type UserRole = 'user' | 'admin';
export type ExperienceLevel = 'fresher' | 'junior' | 'mid' | 'senior';
export type InterviewType = 'hr' | 'technical' | 'coding' | 'company';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type InterviewStatus = 'in_progress' | 'completed' | 'abandoned';
export type VoiceMode = 'conversation' | 'english_practice' | 'interview_simulation' | 'daily_exercise' | 'topic_challenge';
export type VoiceSessionStatus = 'active' | 'completed' | 'abandoned';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type QuestionCategory = 'hr' | 'technical' | 'coding' | 'behavioral' | 'situational';

// ------------------------------------------------------------
// Auth & profile
// ------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface UserProfile {
  id: number;
  avatar: string | null;
  avatar_url: string | null;
  bio: string;
  phone: string;
  target_role: string;
  experience_level: ExperienceLevel;
  skills: string;
  skills_list: string[];
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  location: string;
  college: string;
  graduation_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  user: User;
  profile: UserProfile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password2: string;
}

export interface ServiceConfig {
  ai_configured: boolean;
  demo_mode: boolean;
  google_oauth_configured: boolean;
  google_client_id: string;
  max_upload_size_mb: number;
}

// ------------------------------------------------------------
// Resumes
// ------------------------------------------------------------

export interface ResumeAnalysis {
  id: number;
  resume_id: number;
  resume_filename: string;
  overall_score: number;
  ats_score: number;
  ats_disclaimer: string;
  skills_found: string[];
  missing_skills: string[];
  education_feedback: string;
  experience_feedback: string;
  grammar_issues: string[];
  formatting_issues: string[];
  improvements: string[];
  improved_summary: string;
  strengths: string[];
  weaknesses: string[];
  demo: boolean;
  analyzed_at: string;
}

export interface Resume {
  id: number;
  filename: string;
  file_url: string | null;
  file_size: number;
  file_size_mb: number;
  is_active: boolean;
  uploaded_at: string;
  has_analysis?: boolean;
  latest_analysis?: ResumeAnalysis | null;
}

export interface ResumeQuestion {
  question: string;
  focus_area: string;
}

// ------------------------------------------------------------
// Interviews
// ------------------------------------------------------------

export interface InterviewAnswer {
  id: number;
  text: string;
  time_taken_seconds: number;
  relevance_score: number;
  clarity_score: number;
  depth_score: number;
  overall_score: number;
  feedback: string;
  suggested_answer: string;
  created_at: string;
}

export interface AnswerEvaluation {
  id: number;
  relevance_score: number;
  clarity_score: number;
  depth_score: number;
  overall_score: number;
  feedback: string;
  suggested_answer: string;
}

export interface InterviewQuestion {
  id: number;
  text: string;
  category: string;
  order_index: number;
  ideal_answer: string;
  keywords: string[];
  answer: InterviewAnswer | null;
}

export interface InterviewReport {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  category_breakdown: {
    technical: number;
    communication: number;
    problem_solving: number;
    confidence: number;
  };
  hiring_recommendation: string;
  demo: boolean;
}

export interface InterviewSession {
  id: number;
  interview_type: InterviewType;
  difficulty: Difficulty;
  role: string;
  company: string;
  resume_id: number | null;
  status: InterviewStatus;
  total_questions: number;
  current_question_index: number;
  answered_count: number;
  overall_score: number | null;
  report: InterviewReport | Record<string, never>;
  demo: boolean;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number;
  questions: InterviewQuestion[];
}

export interface InterviewSessionListItem {
  id: number;
  interview_type: InterviewType;
  difficulty: Difficulty;
  role: string;
  company: string;
  status: InterviewStatus;
  total_questions: number;
  answered_count: number;
  overall_score: number | null;
  demo: boolean;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number;
}

export interface StartInterviewPayload {
  interview_type: InterviewType;
  difficulty: Difficulty;
  role?: string;
  company?: string;
  resume_id?: number | null;
  total_questions?: number;
}

export interface SubmitAnswerResponse {
  evaluation: AnswerEvaluation;
  next_question: InterviewQuestion | null;
  is_last: boolean;
  session: InterviewSession;
}

export interface PracticeQuestion {
  id: number;
  question: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  role: string;
  ideal_answer: string;
  keywords: string[];
  created_at: string;
}

// ------------------------------------------------------------
// Voice coach
// ------------------------------------------------------------

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface VoiceMessage {
  id: number;
  speaker: 'ai' | 'user';
  text: string;
  metrics: {
    word_count?: number;
    duration_seconds?: number;
    wpm?: number | null;
    filler_count?: number;
    stt_confidence?: number | null;
  };
  feedback: {
    grammar_corrections?: GrammarCorrection[];
    fluency_note?: string;
  };
  created_at: string;
}

export interface CommunicationReport {
  id: number;
  fluency_score: number;
  grammar_score: number;
  pronunciation_score: number;
  confidence_score: number;
  vocabulary_score: number;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  grammar_corrections: GrammarCorrection[];
  detailed_feedback: string;
  created_at: string;
}

export interface VoiceSession {
  id: number;
  mode: VoiceMode;
  topic: string;
  status: VoiceSessionStatus;
  demo: boolean;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  messages: VoiceMessage[];
  report: CommunicationReport | null;
}

export interface VoiceSessionListItem {
  id: number;
  mode: VoiceMode;
  topic: string;
  status: VoiceSessionStatus;
  demo: boolean;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  message_count: number;
  overall_score: number | null;
}

export interface DailyExercise {
  title: string;
  prompt: string;
  tip: string;
  duration_minutes: number;
}

export interface VoiceExercises {
  daily_exercise: DailyExercise;
  topics: string[];
  demo: boolean;
}

export interface VoiceMetrics {
  duration_seconds?: number;
  stt_confidence?: number | null;
}

// ------------------------------------------------------------
// Roadmaps
// ------------------------------------------------------------

export interface RoadmapTask {
  id: number;
  title: string;
  description: string;
  week_number: number;
  day_number: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  resource_url: string;
  estimated_hours: number;
  completed_at: string | null;
}

export interface LearningRoadmap {
  id: number;
  target_role: string;
  duration_weeks: number;
  demo: boolean;
  created_at: string;
  completion_percentage: number;
  tasks: RoadmapTask[];
}

export interface RoadmapListItem {
  id: number;
  target_role: string;
  duration_weeks: number;
  demo: boolean;
  created_at: string;
  completion_percentage: number;
  task_count: number;
}

// ------------------------------------------------------------
// Analytics & dashboard
// ------------------------------------------------------------

export interface ScoreTrendPoint {
  date: string;
  interview_score: number | null;
  voice_score: number | null;
}

export interface RecentInterview {
  id: number;
  role: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  overall_score: number | null;
  status: InterviewStatus;
  started_at: string;
  duration_seconds: number;
}

export interface ActivityItem {
  id: number;
  activity_type: string;
  description: string;
  created_at: string;
}

export interface Recommendation {
  title: string;
  description: string;
  type: 'interview' | 'voice' | 'resume' | 'study';
  link: string;
  priority: TaskPriority;
  estimated_minutes: number;
}

export interface DailyGoal {
  id: string;
  title: string;
  type: 'interview' | 'voice' | 'study';
  target: number;
  progress: number;
  completed: boolean;
}

export interface DashboardData {
  total_interviews: number;
  avg_interview_score: number | null;
  communication_score: number | null;
  resume_score: number | null;
  total_voice_sessions: number;
  weekly_scores: ScoreTrendPoint[];
  recent_interviews: RecentInterview[];
  recent_activities: ActivityItem[];
  recommendations: Recommendation[];
  daily_goals: DailyGoal[];
  interview_streak: number;
  learning_progress: number | null;
  ai_configured: boolean;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  new_users_7d: number;
  total_interviews: number;
  completed_interviews: number;
  total_voice_sessions: number;
  total_resumes: number;
  avg_interview_score: number | null;
  signups_per_day: { date: string; count: number }[];
  recent_activities: { id: number; user: string; activity_type: string; description: string; created_at: string }[];
  ai_configured: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  interview_count: number;
  voice_count: number;
}

// ------------------------------------------------------------
// Generic
// ------------------------------------------------------------

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}