"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { RW } from "./rw";

// The site is written in English; a page shows another language by looking each English text up in that language's list.
// A text with no entry shows in English, so a language can grow one page at a time and nothing ever shows blank.

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "rw", label: "Kinyarwanda", short: "RW" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const KEY = "huzaestate_language";
const DICTIONARIES: Record<LanguageCode, Record<string, string>> = { en: {}, rw: RW };

let current: LanguageCode = "en";
const listeners = new Set<() => void>();
let started = false;

function isLanguage(value: unknown): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

function apply(next: LanguageCode) {
  current = next;
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((l) => l());
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const saved = localStorage.getItem(KEY);
    if (isLanguage(saved)) apply(saved);
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Fills {name}-style gaps in a translated text. */
function fill(text: string, values?: Record<string, string | number>) {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, () => current, () => "en" as LanguageCode);
  useEffect(start, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    try { localStorage.setItem(KEY, code); } catch {}
    apply(code);
  }, []);

  /** The text in the chosen language, or as written (English) when there is no translation yet. */
  const t = useCallback((text: string, values?: Record<string, string | number>) => fill(DICTIONARIES[language][text] ?? text, values), [language]);

  return { language, setLanguage, t };
}
