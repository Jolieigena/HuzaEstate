"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** What a page loader answers: the items on that page and how many there are in all, or why it failed. */
/** `meta` carries whatever else the same answer holds (counts for tabs, say); the list keeps the latest one. */
export type PageResult<T, M = undefined> = { ok: true; items: T[]; total: number; meta?: M } | { ok: false; error: string };

interface State<T, M> {
  /** The filters these items were loaded for. When it is not the current key, the list is waiting for a fresh first page. */
  key: string;
  items: T[];
  total: number;
  page: number;
  error?: string;
  more: boolean;
  meta?: M;
}

/**
 * A list that keeps growing: page 1 loads when `key` changes (a filter, a search, a sort), and `loadMore` adds the next page below it.
 * Used with <InfiniteSentinel> at the end of the list, so the next batch loads as the reader nears the bottom, with no page buttons.
 * `key` stands for everything the list depends on; `load` is read fresh each time, so it may use the current filters.
 * Items that appear on two pages (a list that shifted while loading) are shown once, when `idOf` is given.
 */
export function useInfinitePages<T, M = undefined>(key: string, load: (page: number) => Promise<PageResult<T, M>>, idOf?: (item: T) => string) {
  const [state, setState] = useState<State<T, M> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loader = useRef(load);
  const currentKey = useRef(key);
  const busy = useRef(false);
  const identify = useRef(idOf);

  useEffect(() => {
    loader.current = load;
    identify.current = idOf;
  });

  useEffect(() => {
    currentKey.current = key;
    busy.current = true;
    let cancelled = false;
    loader.current(1).then((result) => {
      if (cancelled) return;
      busy.current = false;
      setState(
        result.ok
          ? { key, items: result.items, total: result.total, page: 1, more: result.items.length > 0 && result.items.length < result.total, meta: result.meta }
          : { key, items: [], total: 0, page: 1, error: result.error, more: false },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loadMore = useCallback(() => {
    if (busy.current || !state || state.key !== currentKey.current || !state.more) return;
    busy.current = true;
    setLoadingMore(true);
    const forKey = state.key;
    const next = state.page + 1;
    loader.current(next).then((result) => {
      busy.current = false;
      setLoadingMore(false);
      if (currentKey.current !== forKey) return;
      setState((prev) => {
        if (!prev || prev.key !== forKey) return prev;
        if (!result.ok) return { ...prev, error: result.error, more: false };
        const id = identify.current;
        const seen = new Set(id ? prev.items.map(id) : []);
        const fresh = id ? result.items.filter((item) => !seen.has(id(item))) : result.items;
        const items = [...prev.items, ...fresh];
        return { ...prev, items, total: result.total, page: next, more: result.items.length > 0 && items.length < result.total, meta: result.meta ?? prev.meta };
      });
    });
  }, [state]);

  const waiting = !state || state.key !== key;
  return {
    items: state?.items ?? [],
    total: state?.total ?? 0,
    meta: state?.meta,
    /** The first page of the current filters is still loading. */
    loading: waiting,
    loadingMore,
    error: waiting ? undefined : state?.error,
    hasMore: !waiting && !!state?.more,
    loadMore,
  };
}
