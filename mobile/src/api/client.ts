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

const LOG_API = true;
const API_BASE_URL = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
if (LOG_API) {
  console.log('[API] base', API_BASE_URL);
}

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
  billing_interval?: number | null;
  start_date?: string | null;
  next_payment_date?: string | null;
  status: string;
  service_url?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  subscriptions_by_category: { category__id?: number | null; category__name?: string | null; count?: number | null }[];
  spending_by_category: {
    category_id?: number | null;
    category_name?: string | null;
    category__name?: string | null;
    total?: number | null;
  }[];
  spending_by_month: { month: string | number; total: number }[];
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

class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let serverTimeOffsetMs = 0;

export function getServerNow() {
  return new Date(Date.now() + serverTimeOffsetMs);
}

function normalizeErrorMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return 'Ошибка запроса к серверу';
  if (/\uFFFD/.test(trimmed)) return 'Проверьте введенные данные';
  if (/\?{2,}/.test(trimmed)) return 'Проверьте введенные данные';
  return trimmed;
}

function extractErrorMessage(data: Record<string, unknown>) {
  const errors = data.errors && typeof data.errors === 'object' ? (data.errors as Record<string, unknown>) : null;
  if (errors) {
    const fieldLabels: Record<string, string> = {
      email: 'Email',
      username: 'Имя',
      name: 'Имя',
      password: 'Пароль',
      confirm_password: 'Повтор пароля',
      code: 'Код',
    };
    const messages: string[] = [];
    Object.entries(errors).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        const label = fieldLabels[key] ?? key;
        const joined = value.filter((v) => typeof v === 'string').join(' ');
        if (joined) messages.push(`${label}: ${joined}`);
      }
    });
    if (messages.length > 0) {
      return messages.join('\n');
    }
  }
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  return 'Ошибка запроса к серверу';
}

function decodeCp1251(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const map: string[] = [];
  for (let i = 0; i < 128; i += 1) map[i] = String.fromCharCode(i);
  const cp1251 = [
    0x0402,0x0403,0x201A,0x0453,0x201E,0x2026,0x2020,0x2021,0x20AC,0x2030,0x0409,0x2039,0x040A,0x040C,0x040B,0x040F,
    0x0452,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x0098,0x2122,0x0459,0x203A,0x045A,0x045C,0x045B,0x045F,
    0x00A0,0x040E,0x045E,0x0408,0x00A4,0x0490,0x00A6,0x00A7,0x0401,0x00A9,0x0404,0x00AB,0x00AC,0x00AD,0x00AE,0x0407,
    0x00B0,0x00B1,0x0406,0x0456,0x0491,0x00B5,0x00B6,0x00B7,0x0451,0x2116,0x0454,0x00BB,0x0458,0x0405,0x0455,0x0457,
    0x0410,0x0411,0x0412,0x0413,0x0414,0x0415,0x0416,0x0417,0x0418,0x0419,0x041A,0x041B,0x041C,0x041D,0x041E,0x041F,
    0x0420,0x0421,0x0422,0x0423,0x0424,0x0425,0x0426,0x0427,0x0428,0x0429,0x042A,0x042B,0x042C,0x042D,0x042E,0x042F,
    0x0430,0x0431,0x0432,0x0433,0x0434,0x0435,0x0436,0x0437,0x0438,0x0439,0x043A,0x043B,0x043C,0x043D,0x043E,0x043F,
    0x0440,0x0441,0x0442,0x0443,0x0444,0x0445,0x0446,0x0447,0x0448,0x0449,0x044A,0x044B,0x044C,0x044D,0x044E,0x044F,
  ];
  let result = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    result += byte < 128 ? map[byte] : String.fromCharCode(cp1251[byte - 128]);
  }
  return result;
}

function decodeTextWithCharset(buffer: ArrayBuffer, charset: string) {
  const lower = charset.toLowerCase();
  if (lower.includes('windows-1251') || lower.includes('cp1251')) return decodeCp1251(buffer);
  if (typeof TextDecoder === 'undefined') return null;
  try { return new TextDecoder(lower).decode(buffer); } catch { return null; }
}

async function parseJsonResponse(response: Response) {
  try {
    const contentType = response.headers.get('content-type') ?? '';
    const charsetMatch = contentType.match(/charset=([^;]+)/i);
    const charset = charsetMatch ? charsetMatch[1].trim() : 'utf-8';
    const buffer = await response.arrayBuffer();
    let text = decodeTextWithCharset(buffer, charset) ?? '';
    if (!text) text = decodeTextWithCharset(buffer, 'utf-8') ?? '';
    if ((text.match(/\uFFFD/g) ?? []).length > 0 || /\?{3,}/.test(text)) {
      const cpText = decodeTextWithCharset(buffer, 'windows-1251');
      if (cpText) text = cpText;
    }
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (LOG_API) {
    const method = options.method ?? 'GET';
    console.log('[API] request', method, API_BASE_URL + path);
  }

  let response: Response;
  let baseUrl = API_BASE_URL;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    if (API_BASE_URL.startsWith('https://')) {
      const httpBase = API_BASE_URL.replace(/^https:/, 'http:');
      try {
        baseUrl = httpBase;
        if (LOG_API) console.log('[API] retry over http', httpBase + path);
        response = await fetch(`${baseUrl}${path}`, {
          ...options,
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            ...(options.headers as Record<string, string> | undefined),
          },
        });
      } catch (retryError) {
        if (LOG_API) {
          console.log('[API] network error', retryError);
          const probeUrl = API_BASE_URL.replace(/\/api$/, '');
          try {
            const probe = await fetch(probeUrl, { method: 'GET' });
            console.log('[API] probe', probe.status);
          } catch (probeError) {
            console.log('[API] probe error', probeError);
          }
        }
        if (retryError instanceof Error && /Network request failed/i.test(retryError.message)) {
          throw new Error('Нет соединения с сервером. Проверьте интернет и адрес API.');
        }
        throw retryError;
      }
    } else {
      if (LOG_API) {
        console.log('[API] network error', error);
        const probeUrl = API_BASE_URL.replace(/\/api$/, '');
        try {
          const probe = await fetch(probeUrl, { method: 'GET' });
          console.log('[API] probe', probe.status);
        } catch (probeError) {
          console.log('[API] probe error', probeError);
        }
      }
      if (error instanceof Error && /Network request failed/i.test(error.message)) {
        throw new Error('Нет соединения с сервером. Проверьте интернет и адрес API.');
      }
      throw error;
    }
  }

  const data = (await parseJsonResponse(response)) as Record<string, unknown>;
  if (LOG_API) {
    const contentType = response.headers.get('content-type');
    console.log('[API] status', response.status, response.ok ? 'OK' : 'ERR');
    console.log('[API] content-type', contentType);
  }
  const serverDate = response.headers.get('date');
  if (serverDate) {
    const parsed = new Date(serverDate);
    if (!Number.isNaN(parsed.getTime())) {
      serverTimeOffsetMs = parsed.getTime() - Date.now();
    }
  }
  if (!response.ok) {
    let errorMessage = extractErrorMessage(data);
    if (response.status >= 500) {
      errorMessage = `Сервер временно недоступен (HTTP ${response.status}). Попробуйте позже.`;
    }
    if (LOG_API) {
      console.log('[API] error', errorMessage);
    }
    throw new ApiError(normalizeErrorMessage(errorMessage), response.status, data);
  }

  return data as T;
}

async function authedRequest<T>(path: string, options: RequestInit = {}) {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  try {
    return await request<T>(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(path, {
          ...options,
          headers: {
            Authorization: `Bearer ${refreshed}`,
            ...(options.headers as Record<string, string> | undefined),
          },
        });
      }
    }
    throw error;
  }
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

export async function register(email: string, username: string, password: string, confirmPassword: string) {
  return request<{ message: string }>('/users/register/', {
    method: 'POST',
    body: JSON.stringify({
      email,
      username,
      password,
      confirm_password: confirmPassword,
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

export async function forgotPassword(email: string) {
  return request<{ message?: string }>('/users/forgot-password/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function forgotVerify(code: string) {
  return request<{ message?: string }>('/users/forgot-password/verify/', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function resetPassword(password: string, confirmPassword: string) {
  return request<{ message?: string }>('/users/reset-password/', {
    method: 'POST',
    body: JSON.stringify({ password, confirm_password: confirmPassword }),
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
  billing_interval?: number;
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
    billing_interval?: number;
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

export async function createFromCandidate(
  id: number,
  payload: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    billing_period: string;
    billing_interval?: number;
    start_date: string;
    next_payment_date: string;
    status?: string;
    category?: number | null;
    service_url?: string;
    notes?: string;
  },
) {
  return authedRequest<ApiSubscription>(`/main/candidates/${id}/create/`, {
    method: 'POST',
    body: JSON.stringify(payload),
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

export async function refreshAccessToken() {
  const refresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refresh) return null;
  const response = await request<{ access: string }>('/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });
  await saveTokens(response.access, refresh);
  return response.access;
}
