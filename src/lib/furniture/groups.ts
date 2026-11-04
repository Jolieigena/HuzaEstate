"use client";

import { useEffect, useState } from "react";
import { FURNITURE_CATEGORIES, FurnitureApi, type ShopTabs } from "./api";

/** The shop's tabs and their categories, as the administrator has set them. Null until loaded (or if they could not be). */
export function useShopTabs(): ShopTabs | null {
  const [tabs, setTabs] = useState<ShopTabs | null>(null);
  useEffect(() => {
    let cancelled = false;
    FurnitureApi.groups().then((result) => {
      if (!cancelled && result.ok) setTabs(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return tabs;
}

/** Every category the tabs list, for suggestions where a supplier picks or types one. Falls back to the built-in list. */
export function useSuggestedCategories(): string[] {
  const tabs = useShopTabs();
  return tabs ? tabs.groups.flatMap((g) => g.categories.map((c) => c.name)) : FURNITURE_CATEGORIES;
}
