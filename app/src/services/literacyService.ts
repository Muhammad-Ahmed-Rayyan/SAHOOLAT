/**
 * literacyService.ts — API client for Gamified Financial Literacy (Phase 8).
 */

import { api } from './api';

export interface LessonListItem {
  id: string;
  locale_key: string;
  sequence_order: number;
  category: string;
  estimated_minutes: number;
  card_count: number;
  prerequisite_lesson_id?: string | null;
  is_completed: boolean;
  quiz_score?: number | null;
  is_locked: boolean;
}

export interface QuizQuestion {
  q_key: string;
  options_count: number;
  explanation_key: string;
}

export interface QuizOut {
  lesson_id: string;
  quiz_id: string;
  questions: QuizQuestion[];
}

export interface QuizResultQuestion {
  q_key: string;
  selected_index: number;
  correct_index: number;
  is_correct: boolean;
  explanation_key: string;
}

export interface QuizResultOut {
  score: number;
  correct_count: number;
  total_questions: number;
  results: QuizResultQuestion[];
  streak: number;
  newly_awarded_badges: string[];
}

export interface CompleteOut {
  lesson_id: string;
  lesson_completed: boolean;
  streak: number;
  newly_awarded_badges: string[];
}

export interface BadgeOut {
  id: string;
  badge_key: string;
  icon_ref: string;
  criteria_json: Record<string, any>;
  earned: boolean;
  earned_at?: string | null;
}

export interface ProgressOut {
  total_lessons: number;
  lessons_completed: number;
  current_streak: number;
  longest_streak: number;
  badges_earned: Array<{
    badge_key: string;
    icon_ref: string;
    earned_at: string;
  }>;
  badges_count: number;
}

export const getLessons = async (): Promise<LessonListItem[]> => {
  const response = await api.get<LessonListItem[]>('/literacy/lessons');
  return response.data;
};

export const completeLesson = async (lessonId: string): Promise<CompleteOut> => {
  const response = await api.post<CompleteOut>(`/literacy/lessons/${lessonId}/complete`);
  return response.data;
};

export const getQuiz = async (lessonId: string): Promise<QuizOut> => {
  const response = await api.get<QuizOut>(`/literacy/lessons/${lessonId}/quiz`);
  return response.data;
};

export const submitQuiz = async (lessonId: string, answers: number[]): Promise<QuizResultOut> => {
  const response = await api.post<QuizResultOut>(`/literacy/lessons/${lessonId}/quiz/submit`, { answers });
  return response.data;
};

export const getProgress = async (): Promise<ProgressOut> => {
  const response = await api.get<ProgressOut>('/literacy/progress');
  return response.data;
};

export const getBadges = async (): Promise<BadgeOut[]> => {
  const response = await api.get<BadgeOut[]>('/literacy/badges');
  return response.data;
};
