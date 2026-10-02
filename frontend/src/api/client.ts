import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add request interceptor for Auth Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem('microlearn_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for Error Handling & Auto Auth Clear
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }
    if (error.response?.status === 401) {
      sessionStorage.removeItem('microlearn_token');
      localStorage.removeItem('microlearn_user');
      // Trigger event or redirect to login if needed
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url, { params });
  if (res.data && res.data.data !== undefined) {
    return res.data.data;
  }
  return res.data as unknown as T;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, data);
  if (res.data && res.data.data !== undefined) {
    return res.data.data;
  }
  return res.data as unknown as T;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  if (res.data && res.data.data !== undefined) {
    return res.data.data;
  }
  return res.data as unknown as T;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await apiClient.patch<ApiResponse<T>>(url, data);
  if (res.data && res.data.data !== undefined) {
    return res.data.data;
  }
  return res.data as unknown as T;
}

export async function del<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  if (res.data && res.data.data !== undefined) {
    return res.data.data;
  }
  return res.data as unknown as T;
}
