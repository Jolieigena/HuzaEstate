"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True when the site is running inside the HuzaEstate mobile app. The app's web view adds "HuzaEstateApp" to its user agent
 *  (huzaestate-mobile-app/src/config.ts); nothing else does, so the website in a browser, on a phone or a computer, is never
 *  affected by anything gated on this. False while the page is rendered on the server. */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof navigator !== "undefined" && navigator.userAgent.includes("HuzaEstateApp"),
    () => false,
  );
}

/** True inside the HuzaEstate iPhone app. Google sign-in is not offered there (it is set up for Android only). */
export function useIsNativeIosApp(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => typeof navigator !== "undefined" && navigator.userAgent.includes("HuzaEstateApp") && /iPhone|iPad|iPod/.test(navigator.userAgent),
    () => false,
  );
}
