import type {
  AuthResponse,
  LoginDto,
  PublicUser,
  RegisterDto,
} from '@social/shared';
import { api } from '@/lib/api';

export async function registerRequest(dto: RegisterDto): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', dto);
  return data;
}

export async function loginRequest(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', dto);
  return data;
}

export async function meRequest(): Promise<PublicUser> {
  const { data } = await api.get<PublicUser>('/auth/me');
  return data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken });
}

// ---- Demo / mock accounts (dùng cho nút "Đăng nhập nhanh") ----
export interface DemoAccount {
  label: string;
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: '👩 Alice',
    email: 'alice@example.com',
    username: 'alice',
    fullName: 'Alice Nguyen',
    password: 'secret123',
  },
  {
    label: '👨 Bob',
    email: 'bob@example.com',
    username: 'bob',
    fullName: 'Bob Tran',
    password: 'secret123',
  },
];

/** Đăng nhập tài khoản demo; nếu chưa tồn tại thì tự đăng ký rồi vào luôn. */
export async function demoLogin(acc: DemoAccount): Promise<AuthResponse> {
  try {
    return await loginRequest({ email: acc.email, password: acc.password });
  } catch {
    // Tài khoản chưa có (DB mới) -> tạo mới. Nếu bị trùng (race) thì login lại.
    try {
      return await registerRequest({
        email: acc.email,
        username: acc.username,
        fullName: acc.fullName,
        password: acc.password,
      });
    } catch {
      return loginRequest({ email: acc.email, password: acc.password });
    }
  }
}
