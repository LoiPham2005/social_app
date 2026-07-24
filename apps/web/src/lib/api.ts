import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthTokens } from '@social/shared';
import { tokenStorage } from './token-storage';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Attach access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Refresh handling: single in-flight refresh, queued retries ---
let refreshing: Promise<AuthTokens> | null = null;

async function runRefresh(): Promise<AuthTokens> {
  const refreshToken = tokenStorage.refresh;
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  // Bare axios call to avoid the interceptor loop.
  const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh`, {
    refreshToken,
  });
  tokenStorage.set(data);
  return data;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthCall = original?.url?.includes('/auth/');
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall
    ) {
      original._retry = true;
      try {
        refreshing ??= runRefresh();
        const tokens = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshing = null;
        tokenStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an API error. */
export function getApiErrorMessage(err: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data!.message.join(', ');
    if (data?.message) return data.message;
  }
  return fallback;
}
