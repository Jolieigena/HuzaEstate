"use client";

// Pannellum (https://pannellum.org) ships as a plain global script — it
// assigns window.pannellum directly and isn't a CommonJS/ES module, and it
// touches `window`/`document` at the top level, so it can never be
// `import`ed normally (that would crash on the server during SSR). Instead
// we vendor its build output under public/vendor/pannellum/ and load it as
// a real <script>/<link> tag at runtime, browser-only.
const JS_SRC = "/vendor/pannellum/pannellum.js";
const CSS_HREF = "/vendor/pannellum/pannellum.css";

interface PannellumGlobal {
  viewer: (id: string, config: Record<string, unknown>) => { destroy: () => void };
}

declare global {
  interface Window {
    pannellum?: PannellumGlobal;
  }
}

let loadPromise: Promise<PannellumGlobal> | null = null;

function loadCssOnce() {
  if (document.querySelector(`link[href="${CSS_HREF}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_HREF;
  document.head.appendChild(link);
}

function loadScriptOnce(): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${JS_SRC}"]`);
  if (existing) {
    if (window.pannellum) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load the 360° viewer.")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the 360° viewer."));
    document.body.appendChild(script);
  });
}

export function loadPannellum(): Promise<PannellumGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadPannellum can only run in the browser."));
  }
  if (window.pannellum) return Promise.resolve(window.pannellum);

  if (!loadPromise) {
    loadCssOnce();
    loadPromise = loadScriptOnce().then(() => {
      if (!window.pannellum) throw new Error("pannellum.js loaded but did not define window.pannellum.");
      return window.pannellum;
    });
  }
  return loadPromise;
}
