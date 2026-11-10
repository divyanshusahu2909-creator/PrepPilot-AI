export const APP_NAME = 'PrepPilot AI';
export const APP_TAGLINE = 'Ace Your Next Interview with AI-Powered Preparation';

export const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher (0-1 yrs)' },
  { value: 'junior', label: 'Junior (1-3 yrs)' },
  { value: 'mid', label: 'Mid-level (3-6 yrs)' },
  { value: 'senior', label: 'Senior (6+ yrs)' },
] as const;

export const INTERVIEW_TYPES = [
  { value: 'hr', label: 'HR Interview', description: 'Soft skills, motivation & culture fit' },
  { value: 'technical', label: 'Technical Interview', description: 'Core concepts & problem solving' },
  { value: 'coding', label: 'Coding Interview', description: 'Algorithms & code explanation' },
  { value: 'company', label: 'Company-specific', description: 'Tailored to a company you target' },
] as const;

export const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

export const VOICE_MODES = [
  { value: 'conversation', label: 'Free Conversation', description: 'Natural chat to build speaking confidence' },
  { value: 'english_practice', label: 'English Practice', description: 'Grammar, fluency & vocabulary coaching' },
  { value: 'interview_simulation', label: 'Interview Simulation', description: 'Spoken interview with a real-feeling AI interviewer' },
  { value: 'daily_exercise', label: 'Daily Exercise', description: "Today's guided speaking exercise" },
  { value: 'topic_challenge', label: 'Topic Challenge', description: 'Impromptu speaking on a random topic' },
] as const;

export const QUESTION_CATEGORIES = [
  { value: 'hr', label: 'HR' },
  { value: 'technical', label: 'Technical' },
  { value: 'coding', label: 'Coding' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'situational', label: 'Situational' },
] as const;

export const ROLE_SUGGESTIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'DevOps Engineer', 'Product Manager',
  'UX Designer', 'Marketing Manager', 'Business Analyst', 'Security Engineer',
] as const;

export const COMPANY_SUGGESTIONS = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Startup', 'TCS', 'Infosys', 'Accenture'] as const;

export const ROADMAP_DURATIONS = [
  { value: 4, label: '1 month (4 weeks)' },
  { value: 8, label: '2 months (8 weeks)' },
  { value: 12, label: '3 months (12 weeks)' },
] as const;

export const MAX_RESUME_SIZE_MB = 5;

export const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  hr: 'HR', technical: 'Technical', coding: 'Coding', company: 'Company-specific',
};

export const VOICE_MODE_LABELS: Record<string, string> = {
  conversation: 'Free Conversation', english_practice: 'English Practice',
  interview_simulation: 'Interview Simulation', daily_exercise: 'Daily Exercise',
  topic_challenge: 'Topic Challenge',
};