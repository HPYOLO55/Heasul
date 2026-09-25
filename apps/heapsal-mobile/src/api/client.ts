import { useAuth } from "@clerk/clerk-expo";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function getApiUrl() {
  if (!API_URL) throw new Error("Missing EXPO_PUBLIC_API_URL. Set it to the deployed API URL.");
  return `${API_URL}/api`;
}

export function useApi() {
  const { getToken } = useAuth();
  return async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `API request failed (${response.status})`);
    }
    return response.json() as Promise<T>;
  };
}

export type Dashboard = {
  user?: { name?: string | null; totalXp?: number; level?: number; streak?: number };
  glowScore?: number | null;
  streak?: number;
  totalXp?: number;
  level?: number;
  waterMlToday?: number | null;
  sleepHoursLast?: number | null;
  recentAnalysis?: { id: number } | null;
};

export type Mission = { id: number; missionText: string; xpReward: number; completed: boolean };
