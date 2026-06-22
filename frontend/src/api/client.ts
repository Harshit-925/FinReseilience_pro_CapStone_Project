/**
 * API client — typed wrapper around /api/analyze and /api/health.
 * 
 * Automatically attaches PocketBase auth token to every call.
 * No raw fetch() in components.
 */
import pb from "./pocketbase";
import type { AnalysisResponse, HouseholdInput, HealthCheckResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // Attach auth token if available
  if (pb.authStore.token) {
    headers["Authorization"] = `Bearer ${pb.authStore.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `API ${response.status}: ${errorBody || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

export async function analyzeHousehold(
  input: HouseholdInput
): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>("/api/analyze", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function healthCheck(): Promise<HealthCheckResponse> {
  return apiFetch<HealthCheckResponse>("/api/health");
}
