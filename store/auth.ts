import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoading: false,
      setIsLoading: (v) => set({ isLoading: v }),
    }),
    { name: "auth-store" }
  )
);
