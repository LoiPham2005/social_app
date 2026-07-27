import { create } from 'zustand';

interface PresenceState {
  online: Set<string>;
  setList: (ids: string[]) => void;
  setOnline: (userId: string, online: boolean) => void;
  isOnline: (userId?: string | null) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  online: new Set<string>(),
  setList: (ids) => set({ online: new Set(ids) }),
  setOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.online);
      if (online) next.add(userId);
      else next.delete(userId);
      return { online: next };
    }),
  isOnline: (userId) => (userId ? get().online.has(userId) : false),
}));
