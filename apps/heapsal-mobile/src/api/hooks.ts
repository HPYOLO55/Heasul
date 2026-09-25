import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi, Dashboard, Mission } from "../../src/api/client";

export function useDashboard() { const api = useApi(); return useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") }); }
export function useMissions() { const api = useApi(); return useQuery({ queryKey: ["missions"], queryFn: () => api<Mission[]>("/missions/today") }); }
export function useUpdateDailyLog() { const api = useApi(); const qc = useQueryClient(); return useMutation({ mutationFn: (data: { waterMl?: number; sleepHours?: number }) => api("/daily-logs/today", { method: "PUT", body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }) }); }
export function useCompleteMission() { const api = useApi(); const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => api(`/missions/${id}/complete`, { method: "POST" }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["missions"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } }); }
