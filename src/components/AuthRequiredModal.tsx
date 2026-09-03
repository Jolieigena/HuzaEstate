"use client";

import { useId } from "react";
import Link from "next/link";
import Dialog from "./Dialog";

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  signInHref: string;
  signUpHref: string;
}

/**
 * Opened whenever a logged-out visitor tries to start or save a Build/Renovate
 * project. Never opened for purely informational actions (viewing the page,
 * watching a demo, opening an FAQ, viewing an example).
 */
export default function AuthRequiredModal({ open, onClose, title, description, signInHref, signUpHref }: AuthRequiredModalProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} describedBy={descId} panelClassName="max-w-md">
      <div className="p-8">
        <button
          type="button"
          data-dialog-close
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 id={titleId} className="text-2xl font-black text-slate-900 mb-3 pr-8">
          {title}
        </h2>
        <p id={descId} className="text-slate-500 leading-relaxed mb-8">
          {description}
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={signInHref}
            onClick={onClose}
            className="w-full text-center bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg"
          >
            Sign In
          </Link>
          <Link
            href={signUpHref}
            onClick={onClose}
            className="w-full text-center bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold py-3.5 rounded-xl transition-colors"
          >
            Create Account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-slate-500 hover:text-slate-800 font-semibold text-sm py-2 transition-colors"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    </Dialog>
  );
}
