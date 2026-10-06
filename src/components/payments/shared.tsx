"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdminApi, type AdminUser, type ApiResult } from "@/lib/admin/api";
import { Card, SecondaryButton } from "@/components/admin/ui";

/** Loads one page of a list and re-loads whenever `key` changes (filters, page, a retry counter).
 *  `loading` is true until the response for the *current* key has arrived, so a filter change shows
 *  a spinner instead of briefly showing the previous filter's rows as if they were the new ones.
 *  `onData` gets every successful response (the page uses it to fill its overview cards). */
export function useKeyedLoad<T>(enabled: boolean, key: string, load: () => Promise<ApiResult<T>>, onData?: (data: T) => void) {
  const [loaded, setLoaded] = useState<{ key: string; data?: T; error?: string } | null>(null);
  const loadRef = useRef(load);
  const onDataRef = useRef(onData);
  useEffect(() => {
    loadRef.current = load;
    onDataRef.current = onData;
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadRef.current().then((result) => {
      if (cancelled) return;
      setLoaded(result.ok ? { key, data: result.data } : { key, error: result.error });
      if (result.ok) onDataRef.current?.(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, key]);

  return { data: loaded?.data, error: loaded?.error, loading: loaded?.key !== key };
}

/** Sellers by account id, for the name and email columns. A payment only carries an account id; a viewer
 *  who can't list users (an organisation admin without the Users permission) just sees ids instead. */
export function usePaymentSellers(token: string | null, enabled: boolean): Record<string, AdminUser> {
  const [sellers, setSellers] = useState<Record<string, AdminUser>>({});
  useEffect(() => {
    if (!token || !enabled) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "seller_manager", limit: 200 }).then((users) => {
      if (!cancelled && users.ok) setSellers(Object.fromEntries(users.data.users.map((u) => [u.id, u])));
    });
    return () => {
      cancelled = true;
    };
  }, [token, enabled]);
  return sellers;
}

/** The filter row above a list: labelled controls on the left, a result count on the right. */
export function Toolbar({ count, noun, children }: { count?: number; noun: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {count !== undefined && (
        <p className="text-sm text-slate-500">
          {count} {noun}
          {count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

/** Name over email, linking to the seller's page when the viewer has one. */
export function SellerCell({ accountId, sellers, href }: { accountId: string; sellers: Record<string, AdminUser>; href?: (accountId: string) => string }) {
  const seller = sellers[accountId];
  const name = seller?.name ?? "Unknown account";
  return (
    <>
      {href ? (
        <Link href={href(accountId)} className="font-semibold text-slate-900 hover:text-[#219b31]">
          {name}
        </Link>
      ) : (
        <p className="font-semibold text-slate-900">{name}</p>
      )}
      <p className="text-xs text-slate-500">{seller?.email ?? accountId}</p>
    </>
  );
}

export function Pager({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between">
      <SecondaryButton disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </SecondaryButton>
      <span className="text-sm font-semibold text-slate-500">
        Page {page} of {pages}
      </span>
      <SecondaryButton disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </SecondaryButton>
    </div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">
      {message}{" "}
      <button className="font-bold underline" onClick={onRetry}>
        Retry
      </button>
    </Card>
  );
}

export function LoadingRow({ children }: { children: string }) {
  return <p className="py-10 text-center text-sm font-semibold text-slate-400">{children}</p>;
}
