import { create } from "zustand";
import { User } from "@workspace/api-client-react";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem("auth_token"),
  user: null, // Should ideally be persisted or fetched on load, but we rely on useGetMe
  setAuth: (token, user) => {
    localStorage.setItem("auth_token", token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    set({ token: null, user: null });
    window.location.href = import.meta.env.BASE_URL + "login";
  },
}));
