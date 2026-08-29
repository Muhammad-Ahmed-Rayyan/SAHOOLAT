/**
 * icons.ts — Sahoolat icon system using @expo/vector-icons (Ionicons filled set).
 *
 * Design.md directive: filled/duotone icons over thin-line.
 * Ionicons filled variants (no "-outline" suffix) are used throughout.
 * This file centralizes icon choices so they stay consistent — same pattern as colors.ts.
 *
 * Usage:
 *   import { Icons } from '../../theme/icons';
 *   import { Ionicons } from '@expo/vector-icons';
 *   <Ionicons name={Icons.creditScore} size={22} color={Colors.primary} />
 */

import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const Icons = {
  // ── Module tiles ────────────────────────────────────────────────────────────
  creditScore: "stats-chart" as IoniconName,          // Credit score
  committee: "people" as IoniconName,                 // Committee / savings group
  loanMatcher: "briefcase" as IoniconName,            // Loan matcher
  wallet: "wallet" as IoniconName,                    // Wallet
  insurance: "leaf" as IoniconName,                   // Crop insurance
  subsidyBot: "business" as IoniconName,              // Government subsidies
  literacy: "book" as IoniconName,                    // Financial literacy
  remittance: "send" as IoniconName,                  // Remittance tracking

  // ── Navigation / Actions ────────────────────────────────────────────────────
  back: "arrow-back" as IoniconName,
  logout: "log-out" as IoniconName,
  close: "close" as IoniconName,
  add: "add" as IoniconName,
  addCircle: "add-circle" as IoniconName,
  checkmark: "checkmark-circle" as IoniconName,
  chevronRight: "chevron-forward" as IoniconName,
  refresh: "refresh" as IoniconName,
  edit: "pencil" as IoniconName,

  // ── Status indicators ───────────────────────────────────────────────────────
  success: "checkmark-circle" as IoniconName,
  warning: "alert-circle" as IoniconName,
  error: "close-circle" as IoniconName,
  info: "information-circle" as IoniconName,
  pending: "time" as IoniconName,
  active: "radio-button-on" as IoniconName,
  forming: "ellipsis-horizontal-circle" as IoniconName,
  completed: "checkmark-done-circle" as IoniconName,

  // ── Committee specific ──────────────────────────────────────────────────────
  payout: "cash" as IoniconName,
  cycle: "repeat" as IoniconName,
  member: "person" as IoniconName,
  join: "enter" as IoniconName,
  contribution: "arrow-up-circle" as IoniconName,

  // ── Loan specific ───────────────────────────────────────────────────────────
  match: "checkmark-done" as IoniconName,
  noMatch: "close-circle-outline" as IoniconName,
  document: "document-text" as IoniconName,
  phone: "call" as IoniconName,
  location: "location" as IoniconName,
} as const;
