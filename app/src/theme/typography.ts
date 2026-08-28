/**
 * typography.ts — Sahoolat Design System: Typography Scale
 *
 * All values are from Design.md. Do NOT add new sizes or weights outside this file.
 *
 * Fonts:
 *   Latin headings   → Poppins (geometric, warm, reads well at large sizes)
 *   Latin body       → Nunito Sans (rounded, legible at small sizes, warmer than Inter)
 *   Urdu display     → Noto Nastaliq Urdu (Nastaliq-style for headings/branding)
 *   Urdu body/UI     → Noto Sans Arabic (Naskh-style, more legible for small UI text)
 *
 * Font names here match the keys used when loading fonts via expo-font / @expo-google-fonts.
 */

export const FontFamily = {
  heading: "Poppins_600SemiBold",
  headingMedium: "Poppins_500Medium",
  headingBold: "Poppins_700Bold",
  body: "NunitoSans_400Regular",
  bodyBold: "NunitoSans_700Bold",
  button: "Poppins_500Medium",
  // Urdu fonts loaded conditionally when language is 'ur'
  urduDisplay: "NotoNastaliqUrdu_400Regular",
  urduBody: "NotoSansArabic_400Regular",
} as const;

export const FontSize = {
  h1: 28,     // Screen titles
  h2: 22,     // Section headers, card titles
  h3: 18,     // Sub-section headers
  body: 16,   // Standard body text
  small: 14,  // Captions, helper text
  button: 16, // All buttons — always Poppins, never body font
  display: 40, // Credit score, wallet balance — large numbers (trust/clarity moment)
} as const;

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
} as const;

/**
 * Line height multiplier — minimum 1.4x font size on all body text.
 * This matters disproportionately for the target audience's literacy range.
 */
export const LineHeightMultiplier = 1.4;

export const LineHeight = {
  h1: Math.ceil(FontSize.h1 * LineHeightMultiplier),
  h2: Math.ceil(FontSize.h2 * LineHeightMultiplier),
  h3: Math.ceil(FontSize.h3 * LineHeightMultiplier),
  body: Math.ceil(FontSize.body * LineHeightMultiplier),
  small: Math.ceil(FontSize.small * LineHeightMultiplier),
  button: Math.ceil(FontSize.button * LineHeightMultiplier),
  display: Math.ceil(FontSize.display * LineHeightMultiplier),
} as const;

/**
 * Border radius — 8–12px per Design.md (rounded corners = warm/community feel).
 * Min tap target: 44x44px per Design.md (low-literacy / large-finger usability).
 */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const MinTapTarget = 44;

/**
 * Composite typography presets matching Design.md scale
 */
export const Typography = {
  H1: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h1,
    lineHeight: LineHeight.h1,
    fontWeight: FontWeight.semiBold,
  },
  H2: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.h2,
    lineHeight: LineHeight.h2,
    fontWeight: FontWeight.semiBold,
  },
  H3: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.h3,
    lineHeight: LineHeight.h3,
    fontWeight: FontWeight.medium,
  },
  Body: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.body,
    lineHeight: LineHeight.body,
    fontWeight: FontWeight.regular,
  },
  BodySmall: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.small,
    lineHeight: LineHeight.small,
    fontWeight: FontWeight.regular,
  },
  ButtonText: {
    fontFamily: FontFamily.button,
    fontSize: FontSize.button,
    lineHeight: LineHeight.button,
    fontWeight: FontWeight.medium,
  },
  ScoreDisplay: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.display,
    lineHeight: LineHeight.display,
    fontWeight: FontWeight.bold,
  },
} as const;
