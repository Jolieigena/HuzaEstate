"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { whatsappUrl } from "@/lib/whatsapp/chat";

function WhatsappIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 00-8.46 15.04L2 22l5.1-1.34A9.9 9.9 0 1012.04 2zm0 1.8a8.1 8.1 0 11-4.13 15.07l-.3-.18-3.02.8.81-2.95-.2-.31A8.1 8.1 0 0112.04 3.8zm-3.2 3.9c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14s.92 2.48 1.05 2.65c.13.17 1.78 2.85 4.4 3.88 2.18.86 2.62.69 3.09.65.47-.04 1.52-.62 1.73-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.17-.5-.3-.26-.13-1.52-.75-1.76-.84-.24-.09-.41-.13-.58.13-.17.26-.67.84-.82 1.01-.15.17-.3.2-.56.07-.26-.13-1.1-.4-2.1-1.29-.77-.69-1.3-1.54-1.45-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.33-.02-.45-.07-.13-.58-1.4-.8-1.92-.21-.5-.42-.43-.58-.44h-.5z" />
    </svg>
  );
}

/**
 * Opens a WhatsApp chat with someone, the message already written. `phone` is their number with its country code. With no number, a
 * visitor who is not signed in is asked to sign in (numbers are shown to signed-in visitors only); a signed-in visitor sees nothing,
 * because that person has no number to chat on.
 */
export default function WhatsappChatButton({ phone, message, className = "" }: { phone: string | null | undefined; message: string; className?: string }) {
  const { isLoggedIn, isAuthReady } = useAuth();
  const pathname = usePathname();
  const base = `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${className}`;

  if (phone) {
    return (
      <a
        href={whatsappUrl(phone, message)}
        // The address of this page goes into the message when it is pressed, so the other person knows which one it is about.
        onClick={(e) => {
          e.currentTarget.href = whatsappUrl(phone, `${message}\n${window.location.href}`);
        }}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-[#25D366] text-white shadow-sm hover:bg-[#1ebe5b]`}
      >
        <WhatsappIcon />
        Chat on WhatsApp
      </a>
    );
  }
  if (isAuthReady && !isLoggedIn) {
    return (
      <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className={`${base} border border-[#25D366] bg-white text-[#128C4A] hover:bg-[#25D366]/10`}>
        <WhatsappIcon />
        Sign in to chat on WhatsApp
      </Link>
    );
  }
  return null;
}
