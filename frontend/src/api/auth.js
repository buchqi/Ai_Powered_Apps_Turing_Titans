import { requestJson, postJson } from './client.js';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../lib/token-storage.js';


export function authRegister({ username, email, password }) {
  return postJson('/auth/register', { username, email, password });
}


export async function authLogin({ email, password }) {
  const data = await postJson('/auth/login', { email, password });
  setAccessToken(data.access_token);
  return data;
}


export function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return Promise.resolve(null);

  return requestJson('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}


export function logout() {
  clearAccessToken();
}
