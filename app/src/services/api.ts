/**
 * api.ts — Axios instance configured for Sahoolat backend.
 *
 * Base URL is set from environment variable EXPO_PUBLIC_API_URL.
 * The request interceptor injects the Bearer token from authStore on every call.
 * The response interceptor handles 401s (token expired) by logging the user out.
 */

import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 s — accounts for slow 3G per PRD connectivity requirements
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle token expiry ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — force logout so user is returned to auth flow
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
