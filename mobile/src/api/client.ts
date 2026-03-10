import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function defaultBaseHost() {
  if (Platform.OS === 'android') {
    // For physical devices we rely on `adb reverse` (127.0.0.1 -> host).
    // For Android emulators 10.0.2.2 maps to the host machine.
    return Constants.isDevice ? 'http://127.0.0.1:8000' : 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

function resolveApiBaseUrl(rawBaseUrl?: string) {
  const extraBase =
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined) ??
    (Constants.manifest?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined);
  const trimmed = (extraBase ?? rawBaseUrl ?? '').trim();

  const envFallbacks = [
    process.env.EXPO_PUBLIC_API_BASE_URL_TUNNEL,
    process.env.EXPO_PUBLIC_API_BASE_URL_IP,
    process.env.EXPO_PUBLIC_API_BASE_URL_LOCAL,
  ]
    .filter((value): value is string => !!value && value.trim().length > 0)
    .map((value) => value.trim());

  const baseCandidate =
    trimmed.length > 0
      ? trimmed.includes('*')
        ? envFallbacks[0] ?? envFallbacks[1] ?? envFallbacks[2] ?? defaultBaseHost()
        : trimmed
      : envFallbacks[0] ?? envFallbacks[1] ?? envFallbacks[2] ?? defaultBaseHost();

  const base = baseCandidate.replace(/\/+$/, '');

  if (base.endsWith('/api/users')) {
    return `${base.slice(0, -'/users'.length)}`;
  }

  if (base.endsWith('/api')) {
    return base;
  }

  return `${base}/api`;
}

const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
export const AUTH_TOKEN_KEY = 'authToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

export type ApiCategory = {
  id: number;
  name: string;
  description?: string | null;
};

export type ApiSubscription = {
  id: number;
  name: string;
  category?: number | null;
  description?: string | null;
  price: string;
  currency: string;
  billing_period: string;
  start_date?: string | null;
  next_payment_date?: string | null;
  status: string;
  service_url?: string | null;
  notes?: string | null;
};

export type ApiCandidate = {
  id: number;
  subject: string;
  sender: string;
  detected_service?: string | null;
  snippet?: string | null;
  confidence: number;
};

export type ApiAnalyticsResponse = {
  subscriptions_by_category: { category__name: string; count?: number | null; total?: number | null }[];
  spending_by_category: { category__name: string; count?: number | null; total?: number | null }[];
  spending_by_month: { month: number; total: number }[];
  most_expensive?: ApiSubscription | null;
  cheapest?: ApiSubscription | null;
  status_stats?: Record<string, unknown>[] | null;
};

export type ApiForecastResponse = {
  upcoming_subscriptions: ApiSubscription[];
  total_week_spending: number;
  monthly_forecast: number;
  yearly_forecast: number;
  monthly_chart_labels: string[];
  monthly_chart_values: number[];
  calendar_data: Record<string, { name: string; price: number; currency: string }[]>;
};

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

async function authedRequest<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

export async function login(email: string, password: string) {
  return request<{
    access: string;
    refresh: string;
    user: { id: number; username: string; email: string };
  }>('/users/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, username: string, password: string) {
  return request<{ message: string }>('/users/register/', {
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
  }>('/users/register/verify/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getProfile() {
  return authedRequest<{
    id: number;
    username: string;
    email: string;
    email_account?: string | null;
    candidates_count: number;
  }>('/users/profile/', { method: 'GET' });
}

export async function registerDevice(token: string) {
  return authedRequest<void>('/users/device/register/', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function logout() {
  return authedRequest<void>('/users/logout/', { method: 'POST' });
}

export async function testPush() {
  return authedRequest<{ message?: string }>('/users/test-push/', { method: 'POST' });
}

export async function connectEmail(password: string) {
  return authedRequest<{ message?: string; email?: string; provider?: string; error?: string }>(
    '/users/email/connect/',
    {
      method: 'POST',
      body: JSON.stringify({ password }),
    },
  );
}

export async function emailSync() {
  return authedRequest<{ message?: string; last_checked?: string }>(
    '/main/email/sync/',
    { method: 'POST' },
  );
}

export async function emailDisconnect() {
  return authedRequest<{ message?: string }>(
    '/main/email/disconnect/',
    { method: 'POST' },
  );
}

export async function getCategories() {
  return authedRequest<ApiCategory[]>('/main/categories/', { method: 'GET' });
}

export async function getSubscriptions(params?: {
  search?: string;
  status?: string;
  order?: string;
  category?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.status) qs.set('status', params.status);
  if (params?.order) qs.set('order', params.order);
  if (typeof params?.category === 'number') qs.set('category', String(params.category));
  const suffix = qs.toString().length ? `?${qs.toString()}` : '';
  return authedRequest<ApiSubscription[]>(`/main/subscriptions/${suffix}`, { method: 'GET' });
}

export async function createSubscription(payload: {
  name: string;
  category?: number | null;
  description?: string;
  price: number;
  currency: string;
  billing_period: string;
  start_date: string;
  next_payment_date: string;
  status: string;
  service_url?: string;
  notes?: string;
}) {
  return authedRequest<{ message?: string; subscription?: ApiSubscription }>(
    '/main/subscriptions/',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateSubscription(
  id: number,
  payload: Partial<{
    name: string;
    category?: number | null;
    description?: string;
    price: number;
    currency: string;
    billing_period: string;
    start_date: string;
    next_payment_date: string;
    status: string;
    service_url?: string;
    notes?: string;
  }>,
) {
  return authedRequest<ApiSubscription>(`/main/subscriptions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSubscription(id: number) {
  return authedRequest<{ message?: string }>(`/main/subscriptions/${id}/`, {
    method: 'DELETE',
  });
}

export async function getAnalytics() {
  return authedRequest<ApiAnalyticsResponse>('/main/analytics/', { method: 'GET' });
}

export async function getForecast() {
  return authedRequest<ApiForecastResponse>('/main/forecast/', { method: 'GET' });
}

export async function getCandidates() {
  return authedRequest<ApiCandidate[]>('/main/candidates/', { method: 'GET' });
}

export async function acceptCandidate(id: number) {
  return authedRequest<ApiSubscription>(`/main/candidates/${id}/accept/`, {
    method: 'POST',
  });
}

export async function ignoreCandidate(id: number) {
  return authedRequest<{ message?: string }>(`/main/candidates/${id}/ignore/`, {
    method: 'POST',
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
