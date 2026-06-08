import { clearAccessToken, getAccessToken } from '../lib/token-storage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export { API_BASE_URL };

export class AuthError extends Error {
  constructor(message = 'Authentication expired. Continue as guest or sign in again.') {
    super(message);
    this.name = 'AuthError';
  }
}

export function getAuthHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function requestJson(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      'Backend is not running. Start the FastAPI server and try again.'
    );
  }

  if (response.status === 401) {
    clearAccessToken();
    throw new AuthError();
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || 'Backend request failed.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export function postJson(path, payload, options = {}) {
  return requestJson(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
