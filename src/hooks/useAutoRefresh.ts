import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AUTO_REFRESH_INTERVAL } from '../constants';

/**
 * Llama a `onRefresh` cada 30 segundos mientras la app está en primer plano.
 * También refresca al volver de background.
 */
export function useAutoRefresh(onRefresh: () => void, enabled = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(onRefresh, AUTO_REFRESH_INTERVAL);
  }, [onRefresh]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    start();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        onRefresh();   // refresco inmediato al volver
        start();
      } else if (nextState.match(/inactive|background/)) {
        stop();
      }
      appStateRef.current = nextState;
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [enabled, onRefresh, start, stop]);
}
