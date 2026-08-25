import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {}
        set({ isAuthenticated: false, user: null });
      },
      setUser: (user) => set({ isAuthenticated: !!user, user }),
    }),
    {
      name: 'ai-automation-auth',
    }
  )
);
