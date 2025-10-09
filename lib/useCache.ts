import { useEffect, useState, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION = 30000; // 30 segundos

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar si hay datos en caché
        const cached = cache.get(key);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_DURATION) {
          if (isMounted.current) {
            setData(cached.data);
            setLoading(false);
          }
          return;
        }

        // Si no hay caché o expiró, hacer fetch
        setLoading(true);
        const result = await fetcher();

        if (isMounted.current) {
          setData(result);
          setError(null);
          // Guardar en caché
          cache.set(key, {
            data: result,
            timestamp: now,
          });
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err as Error);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...dependencies]);

  return { data, loading, error };
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
