import { create } from 'zustand';
import type { AuthResponse, PublicUser } from '@social/shared';
import { tokenStorage } from '@/lib/token-storage';
import { disconnectSocket } from '@/lib/socket';
import { logoutRequest, meRequest } from '@/features/auth/api';

interface AuthState {
  user: PublicUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setSession: (res: AuthResponse) => void;
  setUser: (user: PublicUser) => void;
  loadMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  setSession: (res) => {
    tokenStorage.set(res);
    set({ user: res.user, status: 'authenticated' });
  },

  setUser: (user) => set({ user }),

  loadMe: async () => {
    if (!tokenStorage.access) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    set({ status: 'loading' });
    try {
      const user = await meRequest();
      set({ user, status: 'authenticated' });
    } catch {
      tokenStorage.clear();
      set({ status: 'unauthenticated', user: null });
    }
  },

  logout: async () => {
    const refresh = tokenStorage.refresh;
    if (refresh) {
      try {
        await logoutRequest(refresh);
      } catch {
        // ignore network errors on logout
      }
    }
    tokenStorage.clear();
    disconnectSocket();
    set({ user: null, status: 'unauthenticated' });
  },
}));
