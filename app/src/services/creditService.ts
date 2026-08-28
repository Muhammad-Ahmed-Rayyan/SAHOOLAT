/**
 * creditService.ts — API calls for the Credit Scoring module (Phase 2).
 *
 * All calls go through the shared `api` Axios instance which handles
 * JWT injection and 401 logout automatically.
 */

import { api } from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UtilityType = "electricity" | "gas" | "water" | "none";

export interface CreditProfilePayload {
  land_size_acres?: number | null;
  crop_yield_maunds?: number | null;
  utility_type: UtilityType;
  utility_paid_months: number;
  utility_total_months: number;
  has_committee_participation: boolean;
  has_prior_loan_repayment: boolean;
}

export interface CreditProfileData extends CreditProfilePayload {
  id: string;
  user_id: string;
  avg_monthly_savings_pct: number | null;
  updated_at: string;
}

export interface FactorBreakdownItem {
  key: string;
  label_en: string;
  label_ur: string;
  points_earned: number;
  points_max: number;
  fraction: number; // 0–1
}

export interface ScoreData {
  score: number;
  band: "excellent" | "good" | "fair" | "low" | "very_low";
  band_label_en: string;
  band_label_ur: string;
  factors: FactorBreakdownItem[];
  scored_at: string;
  is_farmer: boolean;
}

export interface ScoreHistoryItem {
  score: number;
  band: string;
  scored_at: string;
}

// ── Service calls ─────────────────────────────────────────────────────────────

export const creditService = {
  /** Fetch the user's saved credit input data (null if not yet created) */
  getProfile: async (): Promise<CreditProfileData | null> => {
    try {
      const res = await api.get<CreditProfileData>("/credit/profile");
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  /** Create or update credit input data */
  upsertProfile: async (payload: CreditProfilePayload): Promise<CreditProfileData> => {
    const res = await api.put<CreditProfileData>("/credit/profile", payload);
    return res.data;
  },

  /** Trigger score calculation — returns the new score */
  calculateScore: async (): Promise<ScoreData> => {
    const res = await api.post<ScoreData>("/credit/calculate");
    return res.data;
  },

  /** Get the most recently calculated score + factor breakdown */
  getLatestScore: async (): Promise<ScoreData | null> => {
    try {
      const res = await api.get<ScoreData>("/credit/score");
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  /** Get score history list (for the graph) */
  getScoreHistory: async (): Promise<ScoreHistoryItem[]> => {
    const res = await api.get<ScoreHistoryItem[]>("/credit/score/history");
    return res.data;
  },
};
