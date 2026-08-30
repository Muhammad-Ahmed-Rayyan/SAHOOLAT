/**
 * walletService.ts — Typed Axios client for the Phase 5 Wallet API.
 */

import { api } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WalletAccount {
  id: string;
  balance: number;
  auto_save_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  type: "income" | "auto_save" | "manual_save";
  amount: number;
  note: string | null;
  logged_at: string;
}

export interface TransactionListResponse {
  total: number;
  page: number;
  page_size: number;
  transactions: Transaction[];
}

export interface IncomeResponse {
  income_amount: number;
  saved_amount: number | null;
  new_balance: number;
  message: string;
}

export interface TrendPoint {
  month: string;
  income: number;
  savings: number;
}

export interface TrendResponse {
  months: number;
  data: TrendPoint[];
}

// ── API calls ──────────────────────────────────────────────────────────────────

/** Get wallet balance and auto-save setting. Creates wallet on first call. */
export async function getWallet(): Promise<WalletAccount> {
  const { data } = await api.get<WalletAccount>("/wallet");
  return data;
}

/** Set auto-save percentage. Pass null to disable. */
export async function setAutoSave(auto_save_pct: number | null): Promise<void> {
  await api.put("/wallet/auto-save", { auto_save_pct });
}

/** Log an income entry. Returns balance update and optional auto-save amount. */
export async function logIncome(amount: number, note?: string): Promise<IncomeResponse> {
  const { data } = await api.post<IncomeResponse>("/wallet/income", { amount, note });
  return data;
}

/** Get paginated transaction history. */
export async function getTransactions(
  page = 1,
  pageSize = 20
): Promise<TransactionListResponse> {
  const { data } = await api.get<TransactionListResponse>("/wallet/transactions", {
    params: { page, page_size: pageSize },
  });
  return data;
}

/** Get monthly income/savings trend data for chart. */
export async function getTrend(months = 6): Promise<TrendResponse> {
  const { data } = await api.get<TrendResponse>("/wallet/trend", {
    params: { months },
  });
  return data;
}
