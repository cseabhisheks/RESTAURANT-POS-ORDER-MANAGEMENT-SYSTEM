import { clearSession, getToken } from './auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const CLIENT_TAX_RATE = Number(
  process.env.NEXT_PUBLIC_TAX_RATE_PERCENT ?? 5
);

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Unable to reach the server. Please make sure the backend is running.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login') {
      clearSession();
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}
