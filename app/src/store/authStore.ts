/**
 * authStore.ts — Zustand global state for authentication + user preferences.
 *
 * Persisted fields (survive app restart via SecureStore):
 *   - accessToken   → JWT for API calls
 *   - language      → 'ur' | 'en'
 *
 * Non-persisted (re-hydrated from /auth/me on app start):
 *   - user, isAuthenticated, onboardingCompleted
 *
 * SecureStore is used for the token (not AsyncStorage) because tokens are
 * sensitive credentials. Language preference uses AsyncStorage (not sensitive).
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { changeLanguage } from "../locales/i18n";

const TOKEN_KEY = "sahoolat_access_token";
const LANG_KEY = "sahoolat_language";

export type Language = "en" | "ur";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  location: string | null;
  occupation_type: "farmer" | "daily_laborer" | "shopkeeper" | "other" | null;
  receives_remittances: boolean | null;
  preferred_language: Language;
  onboarding_completed: boolean;
}

export interface AuthUser {
  id: string;
  phone_number: string;
  profile: UserProfile | null;
}

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────────
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  language: Language;
  isHydrating: boolean; // true while loading persisted token on app start

  // ── Actions ────────────────────────────────────────────────────────────────
  setLanguage: (lang: Language) => Promise<void>;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  updateUser: (user: AuthUser) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  language: "ur", // Urdu-first default
  isHydrating: true,

  setLanguage: async (lang: Language) => {
    changeLanguage(lang);
    set({ language: lang });
    try {
      await SecureStore.setItemAsync(LANG_KEY, lang);
    } catch {
      // Non-fatal — language preference loss on restart is acceptable
      console.warn("[authStore] Failed to persist language preference");
    }
  },

  setAuth: async (token: string, user: AuthUser) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.error("[authStore] Failed to persist access token", e);
      throw e; // Re-throw — failing to save the token is a login failure
    }
    // Apply the user's persisted language preference if present
    if (user.profile?.preferred_language) {
      changeLanguage(user.profile.preferred_language);
      set({ language: user.profile.preferred_language });
    }
    set({ isAuthenticated: true, accessToken: token, user });
  },

  updateUser: (user: AuthUser) => {
    set({ user });
    // Sync language if profile language changed
    if (user.profile?.preferred_language) {
      changeLanguage(user.profile.preferred_language);
      set({ language: user.profile.preferred_language });
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn("[authStore] Failed to delete token on logout", e);
    }
    set({ isAuthenticated: false, accessToken: null, user: null });
  },

  /**
   * hydrate — called once on app start to restore persisted auth state.
   * If a token exists in SecureStore, the caller (App.tsx) should then
   * call GET /auth/me to validate the token and fetch the latest user data.
   */
  hydrate: async () => {
    set({ isHydrating: true });
    try {
      const [token, lang] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(LANG_KEY),
      ]);
      if (lang === "en" || lang === "ur") {
        changeLanguage(lang);
        set({ language: lang });
      }
      if (token) {
        set({ accessToken: token, isAuthenticated: true });
      }
    } catch (e) {
      console.warn("[authStore] Hydration failed, starting fresh", e);
    } finally {
      set({ isHydrating: false });
    }
  },
}));
