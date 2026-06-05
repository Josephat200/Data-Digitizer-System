import { create } from "zustand";
import { User } from "@workspace/api-client-react";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

function loadUser(): User | null {
  try {
    const s = localStorage.getItem("auth_user");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem("auth_token"),
  user: loadUser(),
  setAuth: (token, user) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    set({ token: null, user: null });
    window.location.href = import.meta.env.BASE_URL + "login";
  },
}));
