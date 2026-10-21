"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, type Account } from "@/lib/auth-context";
import { useIsNativeApp } from "@/lib/nativeApp";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode: string }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

/** What the mobile app's shell offers the page (see huzaestate-mobile-app/App.tsx): the page asks the app for a Google sign-in with
 *  a message, and the app answers by calling one of these. */
interface NativeGoogleBridge {
  credential: (idToken: string) => void;
  fail: (message: string) => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: GoogleIdentity;
    ReactNativeWebView?: { postMessage: (message: string) => void };
    __huzaNativeGoogle?: NativeGoogleBridge;
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// The Google Identity Services script is loaded once and shared by every mount.
let gisScriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisScriptPromise = null; // allow a retry on the next mount
      reject(new Error("Failed to load Google Identity Services"));
    };
    document.head.appendChild(script);
  });
  return gisScriptPromise;
}

interface GoogleAuthButtonProps {
  /** "signup_with" on the sign-up page, "signin_with" on the sign-in page. */
  text?: "signin_with" | "signup_with" | "continue_with";
  /** Sign-up page only: a Google identity with no account gets one, provided this returns true. */
  allowCreate?: boolean;
  /** Read when Google answers, so the sign-up page can require its terms checkbox first. Return an error message to stop. */
  beforeSubmit?: () => string | null;
  /** Silent best-effort country stored on a newly created account. */
  country?: string;
  onSuccess: (account: Account) => void;
  onError: (message: string) => void;
}

const LABELS = { signin_with: "Sign in with Google", signup_with: "Sign up with Google", continue_with: "Continue with Google" } as const;

/** A plain button in the site's style: shown where Google's own button cannot be (not configured, or inside the mobile app). */
function PlainGoogleButton({ label, busy, onClick }: { label: string; busy?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-3 disabled:opacity-60"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      {label}
    </button>
  );
}

export default function GoogleAuthButton({ text = "signin_with", allowCreate = false, beforeSubmit, country, onSuccess, onError }: GoogleAuthButtonProps) {
  const { loginWithGoogle } = useAuth();
  const isNativeApp = useIsNativeApp();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google keeps the callback it was initialised with, so the latest props are read through a ref.
  const latest = useRef({ loginWithGoogle, allowCreate, beforeSubmit, country, onSuccess, onError });
  useEffect(() => {
    latest.current = { loginWithGoogle, allowCreate, beforeSubmit, country, onSuccess, onError };
  });

  // Signs in with a Google ID token, whichever way it was obtained (Google's button in a browser, the app's own Google sign-in).
  const submitCredential = useRef<(idToken?: string) => Promise<void>>(async () => {});
  useEffect(() => {
    submitCredential.current = async (idToken) => {
      if (!idToken) return;
      const current = latest.current;
      const blocked = current.beforeSubmit?.();
      if (blocked) {
        current.onError(blocked);
        return;
      }
      setIsSubmitting(true);
      const result = await current.loginWithGoogle(idToken, current.allowCreate ? { termsAccepted: true, country: current.country } : {});
      if (!result.ok) {
        setIsSubmitting(false);
        current.onError("noAccount" in result ? "No account found for this Google account. Please sign up first." : result.error);
        return;
      }
      current.onSuccess(result.account);
    };
  });

  // In a browser: Google's own button.
  useEffect(() => {
    if (isNativeApp || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (response) => void submitCredential.current(response?.credential), ux_mode: "popup" });
        // Google caps the rendered button width at 400px.
        const width = Math.min(wrapperRef.current?.offsetWidth || 320, 400);
        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, { type: "standard", theme: "outline", size: "large", shape: "rectangular", text, logo_alignment: "center", width });
      })
      .catch(() => {
        if (!cancelled) latest.current.onError("Could not load Google sign-in. Please check your connection.");
      });

    return () => {
      cancelled = true;
    };
  }, [text, isNativeApp]);

  // In the mobile app: Google refuses to sign anyone in inside an app's embedded browser, so the app does the Google step itself
  // (Android's own account picker) and answers through this bridge. Everything after that is the same as in a browser.
  useEffect(() => {
    if (!isNativeApp) return;
    const bridge: NativeGoogleBridge = {
      credential: (idToken) => void submitCredential.current(idToken),
      fail: (message) => {
        setIsSubmitting(false);
        latest.current.onError(message);
      },
      cancel: () => setIsSubmitting(false),
    };
    window.__huzaNativeGoogle = bridge;
    return () => {
      if (window.__huzaNativeGoogle === bridge) delete window.__huzaNativeGoogle;
    };
  }, [isNativeApp]);

  if (isNativeApp) {
    return (
      <PlainGoogleButton
        label={LABELS[text]}
        busy={isSubmitting}
        onClick={() => {
          // The sign-up page's terms checkbox is checked before Google is even opened.
          const blocked = latest.current.beforeSubmit?.();
          if (blocked) {
            latest.current.onError(blocked);
            return;
          }
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "google-sign-in" }));
        }}
      />
    );
  }

  // Not configured: keep the button visible so the page layout is right, and say what is missing on click.
  if (!GOOGLE_CLIENT_ID) {
    return <PlainGoogleButton label={LABELS[text]} onClick={() => onError("Google sign-in isn't set up yet: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing.")} />;
  }

  return (
    <div ref={wrapperRef} className="flex w-full justify-center mt-3">
      <div ref={buttonRef} aria-busy={isSubmitting} className={isSubmitting ? "pointer-events-none opacity-60" : ""} />
    </div>
  );
}
