import apiClient from '@/utils/api';
import { AxiosRequestConfig } from 'axios';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/* ── Generic CRUD helpers ────────────────────────────────────────────── */

export async function getAll<T>(
  endpoint: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const { data } = await apiClient.get<ApiResponse<T[]>>(endpoint, { params });
  return data.data;
}

export async function getPaginated<T>(
  endpoint: string,
  page = 1,
  limit = 20,
  params?: Record<string, unknown>
): Promise<PaginatedResponse<T>> {
  const { data } = await apiClient.get<PaginatedResponse<T>>(endpoint, {
    params: { page, limit, ...params },
  });
  return data;
}

export async function getById<T>(endpoint: string, id: string): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(`${endpoint}/${id}`);
  return data.data;
}

export async function create<TBody, TResponse>(
  endpoint: string,
  body: TBody,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  const { data } = await apiClient.post<ApiResponse<TResponse>>(
    endpoint,
    body,
    config
  );
  return data.data;
}

export async function update<TBody, TResponse>(
  endpoint: string,
  id: string,
  body: TBody
): Promise<TResponse> {
  const { data } = await apiClient.put<ApiResponse<TResponse>>(
    `${endpoint}/${id}`,
    body
  );
  return data.data;
}

export async function patch<TBody, TResponse>(
  endpoint: string,
  id: string,
  body: TBody
): Promise<TResponse> {
  const { data } = await apiClient.patch<ApiResponse<TResponse>>(
    `${endpoint}/${id}`,
    body
  );
  return data.data;
}

export async function remove(endpoint: string, id: string): Promise<void> {
  await apiClient.delete(`${endpoint}/${id}`);
}

/* ── Error helper ─────────────────────────────────────────────────────── */
export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      axiosErr.response?.data?.message ??
      axiosErr.message ??
      'Une erreur inattendue est survenue'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur inattendue est survenue';
}
