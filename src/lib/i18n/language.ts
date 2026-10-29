"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { RW } from "./rw";
import { FR } from "./fr";
import { SW } from "./sw";
import { ES } from "./es";
import { PT } from "./pt";
import { DE } from "./de";
import { ZH } from "./zh";

// The site is written in English; a page shows another language by looking each English text up in that language's list.
// A text with no entry shows in English, so a language can grow one page at a time and nothing ever shows blank.
// To add a language: make its list in this folder (copy rw.ts) and add one line here. The picker shows them in this order.

export const LANGUAGES = [
  { code: "rw", label: "Kinyarwanda", short: "RW" },
  { code: "en", label: "English", short: "EN" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "sw", label: "Kiswahili", short: "SW" },
  { code: "es", label: "Español", short: "ES" },
  { code: "pt", label: "Português", short: "PT" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "zh", label: "中文", short: "中文" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const KEY = "huzaestate_language";
const DICTIONARIES: Record<LanguageCode, Record<string, string>> = { rw: RW, en: {}, fr: FR, sw: SW, es: ES, pt: PT, de: DE, zh: ZH };

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
