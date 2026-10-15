'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<T | null>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const isMountedRef = useRef(true);

  const refetch = useCallback(async (): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetcherRef.current();
      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while communicating with the server.';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    const run = async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while communicating with the server.';
          setState({ data: null, loading: false, error: message });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData: React.Dispatch<React.SetStateAction<T | null>> = useCallback(
    (action) => {
      setState((prev) => ({
        ...prev,
        data: typeof action === 'function' ? (action as (p: T | null) => T | null)(prev.data) : action,
      }));
    },
    []
  );

  return {
    ...state,
    refetch,
    setData,
  };
}
