"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PropertyStatus } from "@/lib/properties/types";

export type TypeFilter = "all" | "sale" | "rent";
export type StatusFilter = "all" | PropertyStatus;

const STATUSES: StatusFilter[] = ["all", "draft", "under_review", "published", "unpublished", "archived", "changes_requested", "rejected"];
const TYPES: TypeFilter[] = ["all", "sale", "rent"];

/** The Properties moderation tables' search / type / status filters, mirrored into the URL
 *  (?q=&type=&status=) so opening a listing and coming back — or reloading, or sharing the link —
 *  lands on the same view. State stays local (a controlled search box can't wait on a router
 *  round-trip); the URL is written with replaceState so typing doesn't pile up history entries.
 *  Callers must render under a Suspense boundary (useSearchParams). */
export function usePropertyFilters() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [type, setType] = useState<TypeFilter>(() => TYPES.find((t) => t === params.get("type")) ?? "all");
  const [status, setStatus] = useState<StatusFilter>(() => STATUSES.find((s) => s === params.get("status")) ?? "all");

  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    const write = (key: string, value: string, empty: string) => (value && value !== empty ? next.set(key, value) : next.delete(key));
    write("q", search, "");
    write("type", type, "all");
    write("status", status, "all");
    const query = next.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", url);
  }, [search, type, status]);

  return { search, setSearch, type, setType, status, setStatus };
}
