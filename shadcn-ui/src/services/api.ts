/**
 * API Client for DMS Backend
 * Self-hosted Node.js + Express + PostgreSQL backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const ACCESS_TOKEN_KEY = 'dms_access_token';
const REFRESH_TOKEN_KEY = 'dms_refresh_token';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }
    const data = await res.json();
    tokenStorage.setTokens(data.accessToken);
    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  formData?: FormData;
}

async function request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, formData, headers: customHeaders, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (!formData && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...rest,
    headers,
    body: formData ? formData : body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(url, fetchOptions);

  // Attempt token refresh on 401
  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { ...fetchOptions, headers });
    }
  }

  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let errorData: { error?: string; details?: unknown } = {};
    if (contentType.includes('application/json')) {
      errorData = await res.json().catch(() => ({}));
    }
    throw new ApiError(res.status, errorData.error || `Request failed: ${res.status}`, errorData.details);
  }

  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res as unknown as T;
}

export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
  upload: <T = unknown>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: 'POST', formData }),
};

export { API_BASE_URL };