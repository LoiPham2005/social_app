import type { AuthTokens } from '@social/shared';

const ACCESS_KEY = 'social.accessToken';
const REFRESH_KEY = 'social.refreshToken';

const isBrowser = typeof window !== 'undefined';

export const tokenStorage = {
  get access(): string | null {
    return isBrowser ? localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh(): string | null {
    return isBrowser ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set(tokens: AuthTokens) {
    if (!isBrowser) return;
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    if (!isBrowser) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
