/** Chamadas de autenticação (POST /register, POST /login, GET /me). */

import { request } from './httpClient.js'

export function register({ name, email, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: { name, email, password },
  })
}

export function login({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
}

export function fetchCurrentUser() {
  return request('/api/auth/me')
}
