import axios from 'axios';

// baseURL is intentionally empty — all API paths include the full /api/v1/... prefix
// In dev, Vite proxies /api/ → backend. In prod, Nginx proxies /api/ → backend.
export const http = axios.create({
  baseURL:         '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Redirect to login on 401
http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
