import { useEffect, useState } from 'react';
import { apiGet } from './client';

export type ApiState<T> = {
  data?: T;
  loading: boolean;
  error?: string;
};

export function useApi<T>(path: string, refreshKey: number): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: undefined }));
    apiGet<T>(path, controller.signal)
      .then((data) => setState({ data, loading: false }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        setState({ loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [path, refreshKey]);

  return state;
}
