"use client";
import { AuthUser } from "@/lib/types";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("vayo_user");
  if (!raw || raw === "undefined" || raw === "null") {
    localStorage.removeItem("vayo_user");
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("vayo_user");
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vayo_token");
}

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem("vayo_token", token);
  localStorage.setItem("vayo_user", JSON.stringify(user));
  window.dispatchEvent(new Event("vayo:auth"));
}

export function clearAuth(): void {
  localStorage.removeItem("vayo_token");
  localStorage.removeItem("vayo_user");
  window.dispatchEvent(new Event("vayo:auth"));
}

export function isLoggedIn(): boolean {
  return !!getStoredToken();
}
