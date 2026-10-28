"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth-context';
import { useMyProfilePhoto } from '@/lib/profilePhoto';
import CountryFlagBadge from './CountryFlagBadge';
import CartButton from './shop/CartButton';
import NavLinks from './NavLinks';
import { useDismiss } from "@/lib/useDismiss";
import AccountMenuPanel from "@/components/shared/AccountMenuPanel";
import { useLanguage } from "@/lib/i18n/language";
import LanguagePicker from "./LanguagePicker";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useDismiss(profileOpen, () => setProfileOpen(false));
  const { isLoggedIn, account } = useAuth();
  const { t } = useLanguage();
  const photoUrl = useMyProfilePhoto();

  // While the phone menu is open the page behind it stays still (the menu scrolls inside itself, below), and the menu closes if the
  // window is widened to where it is no longer shown.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const widened = window.matchMedia('(min-width: 768px)');
    const closeWhenWide = () => { if (widened.matches) setMenuOpen(false); };
    widened.addEventListener('change', closeWhenWide);
    return () => {
      document.body.style.overflow = previousOverflow;
      widened.removeEventListener('change', closeWhenWide);
    };
  }, [menuOpen]);

  return (
    // Above the floating buttons on a page (z-40) while the menu is open, so they never sit on top of it.
    <header className={`w-full py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 ${menuOpen ? 'z-50' : 'z-40'} bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200`}>
      {/* Brand Logo */}
      <Link href="/" aria-label="HuzaEstate Home" className="flex items-center gap-2">
        <Logo className="h-8 w-auto" />
        <CountryFlagBadge className="w-6 h-6" />
      </Link>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-3 lg:gap-8 text-sm font-medium text-slate-600">
        <NavLinks variant="desktop" />
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <CartButton />
        <Link
          href="/post-property"
          className="sm:hidden inline-flex items-center bg-slate-900 hover:bg-[#2ec440] text-white font-semibold text-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors"
        >
          {t('+ Post')}
        </Link>
        <Link
          href="/properties"
          className="hidden sm:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200"
        >
          {t('Browse Properties')}
        </Link>
        <LanguagePicker className="hidden md:inline-flex" />

        {/* Conditional Auth Actions */}
        {isLoggedIn ? (
          <div className="relative hidden md:block ml-2" ref={menuRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="block relative rounded-full border border-slate-200 hover:ring-2 hover:ring-[#2ec440] hover:border-[#2ec440] transition-all w-10 h-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
              title={t('Profile Menu')}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                {photoUrl ? (
                  <Image src={photoUrl} alt="" fill className="object-cover rounded-full" />
                ) : (
                  <span className="text-xs font-bold text-white">{(account?.name ?? "U").slice(0, 1)}</span>
                )}
              </div>
              <CountryFlagBadge className="absolute -bottom-1 -right-1 w-4 h-4" />
            </button>
            
            {profileOpen && (
              <div role="menu" className="absolute right-0 mt-2 max-h-[80vh] w-60 overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 shadow-xl">
                <AccountMenuPanel onNavigate={() => setProfileOpen(false)} />
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Link
              href="/login"
              className="bg-slate-900 hover:bg-[#2ec440] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all inline-block"
            >
              {t('Get Started')}
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label={menuOpen ? t('Close menu') : t('Open menu')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-white border-b border-slate-100 shadow-lg flex flex-col px-6 py-4 gap-1">
          <NavLinks variant="mobile" onNavigate={() => setMenuOpen(false)} />
          <Link
            href="/properties"
            onClick={() => setMenuOpen(false)}
            className="mt-3 text-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-sm px-5 py-3 rounded-full transition-colors duration-150"
          >
            {t('Browse Properties')}
          </Link>
          <Link
            href="/post-property"
            onClick={() => setMenuOpen(false)}
            className="mt-2 text-center bg-slate-900 hover:bg-[#2ec440] active:bg-[#28b039] text-white font-semibold text-sm px-5 py-3 rounded-full transition-colors duration-150"
          >
            {t('Post a property')}
          </Link>
          <LanguagePicker className="mt-3 self-start" />
          {isLoggedIn ? (
            <div className="mt-3 rounded-2xl border border-slate-100 py-2">
              <AccountMenuPanel onNavigate={() => setMenuOpen(false)} />
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 text-center border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm px-5 py-3 rounded-full transition-colors duration-150"
            >
              {t('Get Started')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
