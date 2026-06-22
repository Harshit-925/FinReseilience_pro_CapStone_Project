/**
 * Auth store — Zustand.
 * Syncs with PocketBase authStore. Initializes from persisted session.
 */
import { create } from "zustand";
import pb from "../api/pocketbase";
import type { UserRecord } from "../types";

interface AuthState {
  user: UserRecord | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from persisted PocketBase session
  const initialUser = pb.authStore.isValid && pb.authStore.record
    ? { id: pb.authStore.record.id, email: pb.authStore.record.email as string }
    : null;

  // Subscribe to auth changes (token refresh, expiry)
  pb.authStore.onChange(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      set({
        user: { id: pb.authStore.record.id, email: pb.authStore.record.email as string },
        isAuthenticated: true,
      });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  });

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    isLoading: false,

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const authData = await pb.collection("users").authWithPassword(email, password);
        set({
          user: { id: authData.record.id, email: authData.record.email as string },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
        throw new Error("Invalid email or password");
      }
    },

    signup: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        await pb.collection("users").create({
          email,
          password,
          passwordConfirm: password,
        });
        // Auto-login after signup
        const authData = await pb.collection("users").authWithPassword(email, password);
        set({
          user: { id: authData.record.id, email: authData.record.email as string },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        set({ isLoading: false });
        throw new Error("Signup failed — email may already be registered");
      }
    },

    logout: () => {
      pb.authStore.clear();
      set({ user: null, isAuthenticated: false });
    },
  };
});
