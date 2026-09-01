/**
 * subsidyBotService.ts — API client for Gov Subsidy & Scheme Eligibility Bot (Phase 7).
 */

import { api } from './api';

export interface SurveyQuestionOption {
  value: number | string | boolean;
  label: string;
  label_ur: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  text_ur: string;
  type: 'numeric' | 'select' | 'boolean';
  default?: any;
  options?: SurveyQuestionOption[];
  min?: number;
  max?: number;
  icon?: string;
  hint?: string;
  hint_ur?: string;
}

export interface SurveyQuestionsResponse {
  user_profile: {
    name?: string;
    location?: string;
    occupation?: string;
  };
  questions: SurveyQuestion[];
}

export interface EvaluationResultData {
  scheme_id: string;
  scheme_code: string;
  title: string;
  title_ur: string;
  provider: string;
  benefit_summary: string;
  benefit_summary_ur: string;
  status: 'eligible' | 'partially_eligible' | 'not_eligible';
  match_score_pct: number;
  passed_criteria: string[];
  passed_criteria_ur: string[];
  failed_criteria: string[];
  failed_criteria_ur: string[];
  reason_summary: string;
  reason_summary_ur: string;

  official_portal_url?: string;
  sms_service_code?: string;
  source_citation: string;
  application_steps: string[];
  application_steps_ur: string[];
}

export interface EvaluateResponse {
  total_evaluated: number;
  eligible_count: number;
  results: EvaluationResultData[];
}

export const getSurveyQuestions = async (): Promise<SurveyQuestionsResponse> => {
  const response = await api.get<SurveyQuestionsResponse>('/subsidy-bot/questions');
  return response.data;
};

export const evaluateEligibility = async (answers: Record<string, any>): Promise<EvaluateResponse> => {
  const response = await api.post<EvaluateResponse>('/subsidy-bot/evaluate', { answers });
  return response.data;
};

export const getSchemeDetail = async (schemeId: string): Promise<EvaluationResultData> => {
  const response = await api.get<EvaluationResultData>(`/subsidy-bot/schemes/${schemeId}`);
  return response.data;
};
