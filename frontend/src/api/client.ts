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

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    signal: options.signal,
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const payload = response.headers.get('content-type')?.includes('application/json')
    ? await response.json()
    : undefined;

  if (!response.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : `Backend returned HTTP ${response.status} for ${path}`;
    throw new Error(detail);
  }
  return payload as T;
}
