/**
 * App store — Zustand. Analysis result, loading, error.
 * History/goals state lives locally in their components.
 */
import { create } from "zustand";
import type { AnalysisResponse, HouseholdInput } from "../types";
import { analyzeHousehold } from "../api/client";

interface AppState {
  result: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  analyze: (input: HouseholdInput) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  result: null,
  isLoading: false,
  error: null,

  analyze: async (input: HouseholdInput) => {
    set({ isLoading: true, error: null });
    try {
      const result = await analyzeHousehold(input);
      set({ result, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      set({ error: message, isLoading: false });
    }
  },

  clearResult: () => set({ result: null }),
  clearError: () => set({ error: null }),
}));
