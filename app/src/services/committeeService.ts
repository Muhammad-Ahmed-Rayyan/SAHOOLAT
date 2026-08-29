/**
 * committeeService.ts — Typed Axios client for all committee endpoints.
 * Mirrors the backend committee.py API response schemas exactly.
 */

import { api } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────────

export type CycleFrequency = "weekly" | "biweekly" | "monthly";
export type PayoutMethod = "fixed_order" | "lottery";
export type CommitteeStatus = "forming" | "active" | "completed" | "cancelled";

export interface CommitteeMember {
  id: string;
  user_id: string;
  user_name: string;
  join_order: number;
  payout_position: number | null;
  has_received_payout: boolean;
  joined_at: string;
}

export interface CommitteeCycle {
  id: string;
  cycle_number: number;
  due_date: string;
  payout_member_id: string;
  payout_member_name: string;
  payout_completed: boolean;
  created_at: string;
}

export interface Contribution {
  id: string;
  cycle_id: string;
  cycle_number: number;
  member_id: string;
  member_name: string;
  amount: number;
  paid_on_time: boolean;
  contributed_at: string;
}

/** List item (CommitteeOut) — returned by POST /committee and GET /committee */
export interface CommitteeListItem {
  id: string;
  name: string;
  created_by: string;
  contribution_amount: number;
  cycle_frequency: CycleFrequency;
  payout_method: PayoutMethod;
  member_limit: number;
  status: CommitteeStatus;
  created_at: string;
  members_count: number;
}

/** Full detail (CommitteeDetailOut) — returned by GET /committee/:id */
export interface CommitteeDetail {
  id: string;
  name: string;
  created_by: string;
  contribution_amount: number;
  cycle_frequency: CycleFrequency;
  payout_method: PayoutMethod;
  member_limit: number;
  status: CommitteeStatus;
  created_at: string;
  members: CommitteeMember[];
  current_cycle: CommitteeCycle | null;
  contribution_log: Contribution[];
}

export interface CreateCommitteePayload {
  name: string;
  contribution_amount: number;
  cycle_frequency: CycleFrequency;
  payout_method: PayoutMethod;
  member_limit: number;
}

// ── API calls ──────────────────────────────────────────────────────────────────

/** Create a new committee. Creator auto-joins as member #1. */
export async function createCommittee(
  payload: CreateCommitteePayload
): Promise<CommitteeListItem> {
  const { data } = await api.post<CommitteeListItem>("/committee", payload);
  return data;
}

/** List all committees the current user is a member of. */
export async function listMyCommittees(): Promise<CommitteeListItem[]> {
  const { data } = await api.get<CommitteeListItem[]>("/committee");
  return data;
}

/** Get full committee detail including members, current cycle, and contribution log. */
export async function getCommitteeDetail(id: string): Promise<CommitteeDetail> {
  const { data } = await api.get<CommitteeDetail>(`/committee/${id}`);
  return data;
}

/** Join an existing committee (must be in 'forming' status and not full). */
export async function joinCommittee(id: string): Promise<CommitteeMember> {
  const { data } = await api.post<CommitteeMember>(`/committee/${id}/join`);
  return data;
}

/** Submit a contribution for a cycle. Amount must be > 0. */
export async function submitContribution(
  committeeId: string,
  cycleId: string,
  amount: number
): Promise<Contribution> {
  const { data } = await api.post<Contribution>(
    `/committee/${committeeId}/cycles/${cycleId}/contribute`,
    { amount }
  );
  return data;
}
