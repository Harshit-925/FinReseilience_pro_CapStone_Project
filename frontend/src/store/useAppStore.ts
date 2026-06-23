/**
 * App store — Zustand. Analysis result, loading, error.
 * History/goals state lives locally in their components.
 */
import { create } from "zustand";
import type { AnalysisResponse, HouseholdInput } from "../types";
import { analyzeHousehold } from "../api/client";

interface AppState {
  result: AnalysisResponse | null;
  lastInput: HouseholdInput | null;
  isLoading: boolean;
  error: string | null;
  analyze: (input: HouseholdInput) => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  result: null,
  lastInput: null,
  isLoading: false,
  error: null,

  analyze: async (input: HouseholdInput) => {
    set({ isLoading: true, error: null });
    try {
      const result = await analyzeHousehold(input);
      set({ result, lastInput: input, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearResult: () => set({ result: null, lastInput: null }),
  clearError: () => set({ error: null }),
}));
