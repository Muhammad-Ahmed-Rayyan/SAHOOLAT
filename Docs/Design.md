# Design.md — Color, Theme, Fonts & Typography

Direction chosen: **Warm & trustworthy, earthy tones, community feel** — **green-based** palette.

Rationale: green ties naturally to agriculture/growth/money, and an earthy (not neon/corporate) tone fits a "community trust" feel better than a sharp fintech-cold palette — appropriate for a user base that's wary of impersonal formal banking.

---

## 1. Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary | Deep Olive Green | `#4A6741` | Primary buttons, active nav, key brand moments |
| Primary Light | Sage Green | `#8FA876` | Secondary buttons, highlights, progress bars |
| Accent / Warm | Terracotta | `#C1704F` | Alerts that need warmth (not harsh red) — e.g. "committee payment due" |
| Background | Warm Off-White | `#FAF6EE` | Main app background — warmer than stark white |
| Surface / Cards | Cream | `#F1EAD9` | Card backgrounds, distinct from main background |
| Text Primary | Deep Brown-Black | `#2E2A24` | Body text — softer than pure black |
| Text Secondary | Warm Gray | `#6E6459` | Captions, secondary info |
| Success | Muted Green | `#5C8A5C` | Payout triggered, goal met, score improved |
| Warning | Mustard | `#D9A441` | Pending action, incomplete profile |
| Error | Muted Rust Red | `#B4543A` | Actual errors only — kept muted, not alarming-bright, to match the warm palette |
| Borders/Dividers | Light Tan | `#E4D9C4` | Subtle separators |

**Guidance:**
- Avoid pure black (`#000`) and pure white (`#FFF`) anywhere — they break the warm feel. Use the Text Primary / Background values above instead.
- Reserve Terracotta and Mustard for things that genuinely need attention — overusing warm accent colors defeats their purpose.
- Score/status indicators (credit score ranges, insurance status) should use the Success/Warning/Error trio consistently across every module — a user should learn "green = good, mustard = pending, rust = attention needed" once and have it hold everywhere.

---

## 2. Fonts

Since you weren't sure, here's the recommendation:

- **Headings:** **Poppins** — geometric but warm, friendly without being childish, reads well at large sizes for low-literacy-friendly headers.
- **Body text:** **Nunito Sans** — rounded but highly legible at small sizes, warmer than a sharp grotesk like Inter, good for longer text (lesson content, explanations).
- **Urdu text:** **Noto Nastaliq Urdu** for any Nastaliq-style Urdu display text (headings/branding), and **Noto Sans Arabic** (or **Jameel Noori Nastaleeq** if available as a web/app font) for Urdu body text where Nastaliq would hurt readability at small sizes. Test both — Nastaliq is more traditional/trusted-looking but can be harder to render crisply at small UI sizes; Naskh-style (Noto Sans Arabic) is more legible for body/UI text.

Both Poppins and Nunito Sans are free (Google Fonts), well-supported in React Native (via `expo-font` or `@expo-google-fonts`), and pair well together without feeling mismatched.

---

## 3. Typography Scale

| Style | Font | Size | Weight | Usage |
|---|---|---|---|---|
| H1 | Poppins | 28px | SemiBold (600) | Screen titles |
| H2 | Poppins | 22px | SemiBold (600) | Section headers, card titles |
| H3 | Poppins | 18px | Medium (500) | Sub-section headers |
| Body | Nunito Sans | 16px | Regular (400) | Standard body text |
| Body Small | Nunito Sans | 14px | Regular (400) | Captions, helper text |
| Button Text | Poppins | 16px | Medium (500) | All buttons — always Poppins, never body font, for clear affordance |
| Score/Number Display | Poppins | 40px+ | Bold (700) | Credit score, wallet balance — large numbers are a key trust/clarity moment |

**Line height:** minimum 1.4x font size on all body text — this matters more than usual given the target audience's literacy range; cramped line spacing hurts readability disproportionately for less-practiced readers.

---

## 4. Theme Implementation Notes

- Store all values above in `/src/theme/colors.ts` and `/src/theme/typography.ts` (per Architecture.md structure) — never inline hex codes or font sizes directly in component files.
- Build both a light theme (above) as default. A dark theme is explicitly **out of scope** for this version — don't build a theme-switcher unless asked; it adds complexity the competition timeline doesn't need.
- Icons: prefer simple, rounded/filled icon sets (e.g., Phosphor Icons or Lucide in their "duotone"/filled variants) over thin-line icons — filled icons read more clearly at a glance for low-literacy users and match the warm/friendly direction better than minimal line icons.
- Buttons should have generous tap targets (minimum 44x44px) and rounded corners (8-12px radius) — sharp corners read as more "corporate/cold," which works against the warm/trustworthy direction.

---

If any of this doesn't feel right once you see it rendered, it's easier to adjust now (before Phase 1 UI work starts) than after several screens are built — flag anything that feels off as soon as you see the first real screens.
