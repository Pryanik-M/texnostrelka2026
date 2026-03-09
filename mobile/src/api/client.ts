import * as SecureStore from 'expo-secure-store';

function resolveApiBaseUrl(rawBaseUrl?: string) {
  const fallback = 'http://10.0.2.2:8000/api/users';
  const base = (rawBaseUrl ?? fallback).trim().replace(/\/+$/, '');

  if (base.endsWith('/api/users')) {
    return base;
  }

  return `${base}/api/users`;
}

const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const AUTH_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const formErrors =
      data.errors && typeof data.errors === 'object'
        ? (data.errors as Record<string, unknown>)
        : null;
    const firstFormError =
      formErrors &&
      Object.values(formErrors).find(
        (value) => Array.isArray(value) && value.length > 0 && typeof value[0] === 'string',
      );

    const errorMessage =
      Array.isArray(firstFormError) && typeof firstFormError[0] === 'string'
        ? firstFormError[0]
        : typeof data.detail === 'string'
          ? data.detail
          : typeof data.error === 'string'
            ? data.error
            : typeof data.message === 'string'
              ? data.message
              : 'Ошибка запроса к серверу';
    throw new Error(errorMessage);
  }

  return data as T;
}

export async function login(email: string, password: string) {
  return request<{
    access: string;
    refresh: string;
    user: { id: number; username: string; email: string };
  }>('/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, username: string, password: string) {
  return request<{ message: string }>('/register/', {
    method: 'POST',
    body: JSON.stringify({
      email,
      username,
      password,
      confirm_password: password,
    }),
  });
}

export async function registerVerify(code: string) {
  return request<{
    message: string;
    access: string;
    refresh: string;
  }>('/register/verify/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function saveTokens(access: string, refresh?: string) {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, access);
  if (refresh) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  }
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
