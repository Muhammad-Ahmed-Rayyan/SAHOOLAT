/**
 * i18n.ts — react-i18next configuration for Sahoolat.
 *
 * Language initialisation order:
 *   1. Check Zustand authStore for persisted user preference (set during language select or onboarding)
 *   2. Fall back to Urdu ('ur') — Urdu-first per PRD.md non-functional requirements
 *
 * This file is imported once in App.tsx before NavigationContainer renders.
 * Components access translations via useTranslation() hook from react-i18next.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import ur from "./ur.json";

const resources = {
  en: { translation: en },
  ur: { translation: ur },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "ur",              // Urdu-first default per PRD.md
  fallbackLng: "ur",      // If a key is missing in one language, fall back to Urdu
  interpolation: {
    escapeValue: false,   // React already escapes values
  },
  compatibilityJSON: "v4",
});

export default i18n;

/**
 * changeLanguage — helper used by LanguageSelectScreen and Settings.
 * Updates i18n AND the Zustand store in one call.
 */
export function changeLanguage(lang: "en" | "ur"): void {
  i18n.changeLanguage(lang);
}
