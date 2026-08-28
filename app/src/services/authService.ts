/**
 * authService.ts — API calls for authentication and onboarding.
 * No business logic here — just typed wrappers around the Axios instance.
 */

import { api } from "./api";
import type { AuthUser, Language } from "../store/authStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendOTPResponse {
  message: string;
  dev_otp: string | null; // non-null in DEBUG=true backend mode
}

export interface VerifyOTPResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
  is_new_user: boolean;
}

export interface CompleteProfilePayload {
  name: string;
  location: string;
  occupation_type: "farmer" | "daily_laborer" | "shopkeeper" | "other";
  preferred_language: Language;
  receives_remittances?: boolean | null;
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────

export async function sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
  const { data } = await api.post<SendOTPResponse>("/auth/send-otp", {
    phone_number: phoneNumber,
  });
  return data;
}

export async function verifyOTP(
  phoneNumber: string,
  otp: string
): Promise<VerifyOTPResponse> {
  const { data } = await api.post<VerifyOTPResponse>("/auth/verify-otp", {
    phone_number: phoneNumber,
    otp,
  });
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

// ── Onboarding endpoint ────────────────────────────────────────────────────────

export async function completeProfile(
  payload: CompleteProfilePayload
): Promise<AuthUser["profile"]> {
  const { data } = await api.put("/onboarding/profile", payload);
  return data;
}
