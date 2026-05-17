import axios from 'axios';

export const http = axios.create({
  baseURL:        import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,   // include HttpOnly JWT cookie
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
