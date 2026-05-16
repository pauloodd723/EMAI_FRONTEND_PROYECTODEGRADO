import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(async (endpoint: string, options: ApiOptions = {}): Promise<T | null> => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.detail ?? 'Error del servidor';
        setState({ data: null, loading: false, error: msg });
        return null;
      }

      setState({ data, loading: false, error: null });
      return data as T;
    } catch {
      const msg = 'Error de conexión. Verifica tu red.';
      setState({ data: null, loading: false, error: msg });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, request, reset };
}
