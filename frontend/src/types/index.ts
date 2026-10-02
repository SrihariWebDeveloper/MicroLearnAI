export type UserRole = 'learner' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  avatar_url?: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearnerProfile {
  id?: string;
  user_id: string;
  learning_goal: string;
  topic?: string;
  target_domain: string;
  skill_level: SkillLevel;
  hours_per_day: number;
  preferred_schedule: string;
  preferences?: string[] | Record<string, string | boolean | number>;
  created_at?: string;
}

export type SubtopicStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface Subtopic {
  id: string;
  level_id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  status: SubtopicStatus;
  order: number;
  score?: number;
  attempts_count?: number;
  prerequisites?: string[];
}

export type LevelStatus = 'locked' | 'unlocked' | 'completed';

export interface Level {
  id: string;
  level_number: number;
  title: string;
  description: string;
  status: LevelStatus;
  subtopics: Subtopic[];
}

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_domain: string;
  skill_level: SkillLevel;
  total_levels: number;
  levels: Level[];
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CodeExample {
  title: string;
  code: string;
  explanation: string;
  language: string;
}

export interface Lesson {
  id: string;
  subtopic_id: string;
  title: string;
  overview: string;
  key_concepts: string[];
  detailed_content: string;
  code_examples: CodeExample[];
  summary: string;
  video_script?: string;
  content_source?: 'curated_development' | 'google_adk_openrouter';
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface CodingProblem {
  id: string;
  subtopic_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  initial_code: string;
  language: string;
  function_name?: string;
  test_cases: TestCase[];
  solution_hint?: string;
}

export interface TestResultItem {
  test_case_id: string;
  passed: boolean;
  actual_output: string;
  expected_output: string;
  execution_time_ms: number;
  error?: string;
}

export interface CodeSubmission {
  id: string;
  problem_id: string;
  code: string;
  language: string;
  status: 'passed' | 'failed' | 'error';
  test_results: TestResultItem[];
  execution_time_ms: number;
  memory_kb?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface Assessment {
  id: string;
  subtopic_id: string;
  title: string;
  quiz_questions: QuizQuestion[];
  coding_questions: CodingProblem[];
}

export interface AssessmentResult {
  id: string;
  subtopic_id: string;
  user_id: string;
  overall_score: number;
  quiz_score: number;
  coding_score: number;
  passed: boolean; // >= 85%
  weak_areas: string[];
  recommendations: string[];
  retry_allowed: boolean;
  created_at: string;
}

export type MasteryLevel = 'unavailable' | 'weak' | 'developing' | 'proficient' | 'strong';

export interface PerformanceRecord {
  user_id: string;
  completed_subtopics_count: number;
  total_subtopics_count: number;
  total_learning_hours: number;
  streak_days: number;
  average_score: number | null;
  weak_topics: string[];
  strong_topics: string[];
  recent_scores: number[];
  last_active_at: string | null;
}

export interface MasteryPrediction {
  mastery_score: number | null; // 0.0 to 1.0 when a trained model can predict
  baseline_mastery_score?: number | null;
  mastery_level: MasteryLevel;
  confidence: number | null;
  model_type: string;
  timestamp: string;
  reason?: string | null;
}

export type RecommendationUrgency = 'low' | 'medium' | 'high';
export type RecommendationType = 'revision' | 'practice' | 'next_subtopic' | 'assessment';

export interface Recommendation {
  id: string;
  user_id: string;
  type: RecommendationType;
  title: string;
  description: string;
  target_subtopic_id?: string;
  reasoning: string;
  urgency: RecommendationUrgency;
  created_at: string;
}

export type NotificationType = 'reminder' | 'achievement' | 'recommendation' | 'system';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
