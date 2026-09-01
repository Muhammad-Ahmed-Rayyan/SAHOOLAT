/**
 * insuranceService.ts — API client calls for Parametric Crop Insurance (Phase 6).
 */

import { api } from './api';

export interface PayoutEventData {
  id: string;
  policy_id: string;
  weather_reading_id?: string;
  trigger_date: string;
  payout_amount: number;
  trigger_reason: string;
  status: 'logged' | 'simulated' | 'paid';
  notification_sent: boolean;
}

export interface InsurancePolicyData {
  id: string;
  user_id: string;
  crop_type: string;
  district: string;
  sum_insured: number;
  premium_amount: number;
  threshold_type: 'extreme_heat' | 'heavy_rainfall' | 'drought' | 'low_temp';
  threshold_value: number;
  status: 'active' | 'monitoring' | 'triggered' | 'paid' | 'expired' | 'cancelled';
  coverage_start_date: string;
  coverage_end_date: string;
  created_at: string;
  updated_at: string;
  payout_events: PayoutEventData[];
}

export interface CreatePolicyPayload {
  crop_type: string;
  district: string;
  threshold_type: 'extreme_heat' | 'heavy_rainfall' | 'drought' | 'low_temp';
  threshold_value: number;
  sum_insured?: number;
  premium_amount?: number;
  coverage_months?: number;
}

export interface RunCheckResponse {
  message: string;
  triggered_count: number;
  evaluated: boolean;
}

export const getPolicies = async (): Promise<InsurancePolicyData[]> => {
  const response = await api.get<InsurancePolicyData[]>('/insurance/policies');
  return response.data;
};

export const createPolicy = async (payload: CreatePolicyPayload): Promise<InsurancePolicyData> => {
  const response = await api.post<InsurancePolicyData>('/insurance/policies', payload);
  return response.data;
};

export const getPolicyDetail = async (id: string): Promise<InsurancePolicyData> => {
  const response = await api.get<InsurancePolicyData>(`/insurance/policies/${id}`);
  return response.data;
};

export const runWeatherCheck = async (): Promise<RunCheckResponse> => {
  const response = await api.post<RunCheckResponse>('/insurance/run-check');
  return response.data;
};

export const simulatePolicyTrigger = async (id: string): Promise<InsurancePolicyData> => {
  const response = await api.post<InsurancePolicyData>(`/insurance/simulate-trigger/${id}`);
  return response.data;
};
