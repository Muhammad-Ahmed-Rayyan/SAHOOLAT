/**
 * loanService.ts — Typed Axios client for the Phase 4 Loan Matcher API.
 */

import { api } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────────

export type LoanType = "business" | "agriculture" | "housing" | "education" | "emergency";

export interface LoanProgram {
  id: string;
  institution_name: string;
  program_name: string;
  loan_type: LoanType;
  min_loan_pkr: number | null;
  max_loan_pkr: number;
  annual_rate_pct: number | null;
  is_interest_free: boolean;
  min_credit_score: number;
  eligible_occupations: string | null;
  why_matched: string[];
  required_documents: string[];
  application_steps_en: string;
  application_steps_ur: string;
  contact_info: string | null;
}

export interface LoanMatchesResponse {
  credit_score_used: number;
  total_matches: number;
  programs: LoanProgram[];
}

// ── API calls ──────────────────────────────────────────────────────────────────

/**
 * Get eligible loan programs for the current user.
 * Requires a calculated credit score (call POST /credit/calculate first).
 */
export async function getLoanMatches(): Promise<LoanMatchesResponse> {
  const { data } = await api.get<LoanMatchesResponse>("/loans/matches");
  return data;
}
