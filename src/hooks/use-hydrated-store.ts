'use client';

import { useSyncExternalStore } from 'react';

/**
 * SSR-safe hook to consume Zustand stores with `persist` middleware.
 * Guarantees consistent initial render on the server and synchronizes state on client hydration.
 *
 * @param store The Zustand store hook
 * @param selector Selector function to pick state
 *
 * @example
 * const theme = useHydratedStore(useAppStore, (state) => state.theme, 'system');
 */
export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  selector: (state: T) => F,
  fallbackValue: F
): F {
  const result = store(selector) as F;

  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return isHydrated ? result : fallbackValue;
}
