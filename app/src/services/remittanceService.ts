/**
 * remittanceService.ts — Typed Axios API client for Phase 9 Remittance Tracker.
 */

import { api } from './api';

export interface RemittanceRecord {
  id: string;
  amount_received: number;
  origin_currency: string;
  sender_relationship?: string;
  source_country?: string;
  date_received: string;
  fx_rate_snapshot: number;
  converted_pkr_amount: number;
  notes?: string;
}

export interface LogRemittancePayload {
  amount_received: number;
  origin_currency: string;
  sender_relationship?: string;
  source_country?: string;
  notes?: string;
}

export interface TrendItem {
  month_label: string;
  year: number;
  month: number;
  total_pkr: number;
  record_count: number;
}

export interface SavingsSuggestion {
  remittance_pkr_total: number;
  suggested_savings_pct: number;
  suggested_savings_pkr: number;
  remaining_pkr: number;
  wallet_auto_save_pct: number;
  current_wallet_balance: number;
  active_committees_count: number;
  monthly_committee_dues_pkr: number;
  reasoning_en: string;
  reasoning_ur: string;
}

export interface FxRatesResponse {
  rates: Record<string, number>;
  is_fallback: boolean;
  data_may_be_outdated: boolean;
}

export async function getRemittanceRecords(): Promise<RemittanceRecord[]> {
  const res = await api.get<RemittanceRecord[]>('/remittance/records');
  return res.data;
}

export async function logRemittance(payload: LogRemittancePayload): Promise<RemittanceRecord> {
  const res = await api.post<RemittanceRecord>('/remittance/records', payload);
  return res.data;
}

export async function getRemittanceRecordDetail(recordId: string): Promise<RemittanceRecord> {
  const res = await api.get<RemittanceRecord>(`/remittance/records/${recordId}`);
  return res.data;
}

export async function getRemittanceTrends(): Promise<TrendItem[]> {
  const res = await api.get<TrendItem[]>('/remittance/trends');
  return res.data;
}

export async function getSavingsSuggestion(recordId?: string, amountPkr?: number): Promise<SavingsSuggestion> {
  const params: Record<string, any> = {};
  if (recordId) params.record_id = recordId;
  if (amountPkr) params.pkr_amount = amountPkr;

  const res = await api.get<SavingsSuggestion>('/remittance/savings-suggestion', { params });
  return res.data;
}

export async function getFxRates(): Promise<FxRatesResponse> {
  const res = await api.get<FxRatesResponse>('/remittance/fx-rates');
  return res.data;
}
