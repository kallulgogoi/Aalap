import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Call this when the user successfully logs in
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },

      // Call this to instantly wipe the session
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      // Call this if the user updates their profile picture/bio
      updateUser: (updatedData) => {
        set((state) => ({
          user: { ...state.user, ...updatedData },
        }));
      },
    }),
    {
      name: "chat-auth-storage", // The key used in localStorage
    },
  ),
);
