import { create } from 'zustand';
import { User } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('acpm_token') : null,
  isLoading: true,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') localStorage.setItem('acpm_token', token);
    set({ user, token, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('acpm_token');
    set({ user: null, token: null, isLoading: false });
  },
  setLoading: (v) => set({ isLoading: v }),
}));
