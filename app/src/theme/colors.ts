/**
 * colors.ts — Sahoolat Design System: Color Palette
 *
 * All hex values are from Design.md. Do NOT add new colors or override these
 * values inline in components — reference this file everywhere.
 *
 * Palette direction: Warm & trustworthy, earthy tones, community feel (green-based).
 */

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary: "#4A6741",        // Deep Olive Green — primary buttons, active nav, key brand moments
  primaryLight: "#8FA876",   // Sage Green — secondary buttons, highlights, progress bars

  // ── Accent ─────────────────────────────────────────────────────────────────
  accent: "#C1704F",         // Terracotta — warm alerts (committee payment due, etc.)

  // ── Backgrounds ────────────────────────────────────────────────────────────
  background: "#FAF6EE",     // Warm Off-White — main app background
  surface: "#F1EAD9",        // Cream — card backgrounds, distinct from main bg

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary: "#2E2A24",    // Deep Brown-Black — body text (softer than pure black)
  textSecondary: "#6E6459",  // Warm Gray — captions, secondary info

  // ── Semantic status ────────────────────────────────────────────────────────
  success: "#5C8A5C",        // Muted Green — payout triggered, goal met, score improved
  warning: "#D9A441",        // Mustard — pending action, incomplete profile
  error: "#B4543A",          // Muted Rust Red — actual errors only (kept warm, not alarming-bright)

  // ── Borders / Dividers ─────────────────────────────────────────────────────
  border: "#E4D9C4",         // Light Tan — subtle separators

  // ── Explicit prohibitions (documented for reference) ───────────────────────
  // DO NOT USE #000000 (pure black) or #FFFFFF (pure white) — they break the warm feel.
  // Use textPrimary and background respectively.
} as const;

export type ColorKey = keyof typeof Colors;
