"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const clientCache = new Map<string, { data: unknown; ts: number }>();
const CLIENT_TTL = 20_000;

export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const cached = url ? clientCache.get(url) : null;
  const [data, setData] = useState<T | null>(cached ? (cached.data as T) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    const hit = clientCache.get(url);
    if (hit && Date.now() - hit.ts < CLIENT_TTL) { setData(hit.data as T); return; }
    if (hit) setData(hit.data as T);
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      clientCache.set(url, { data: json, ts: Date.now() });
      if (!controller.signal.aborted) setData(json);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(String(e));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => { fetchData(); return () => abortRef.current?.abort(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
