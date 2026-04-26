export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export type ApiEnvelope<T> = {
  service?: string;
  available?: boolean;
  items?: T[];
  error?: string | null;
  [key: string]: unknown;
};

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`Backend returned HTTP ${response.status} for ${path}`);
  }
  return response.json() as Promise<T>;
}
