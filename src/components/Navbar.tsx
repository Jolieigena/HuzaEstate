"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth-context';
import { useMyProfilePhoto } from '@/lib/profilePhoto';
import CountryFlagBadge from './CountryFlagBadge';
import CartButton from './shop/CartButton';
import { useDismiss } from "@/lib/useDismiss";
import AccountMenuPanel from "@/components/shared/AccountMenuPanel";

const NAV_LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/properties?type=sale', label: 'Buy' },
  { href: '/properties?type=rent', label: 'Rent' },
  { href: '/sell', label: 'Sell' },
  { href: '/build', label: 'Build' },
  { href: '/renovate', label: 'Renovate' },
  { href: '/professionals', label: 'Professionals' },
  { href: '/designs', label: 'Designs' },
  { href: '/shop', label: 'Shop' },
  { href: '/blog', label: 'Blog' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useDismiss(profileOpen, () => setProfileOpen(false));
  const { isLoggedIn, account } = useAuth();
  const photoUrl = useMyProfilePhoto();
  const pathname = usePathname();

  return (
    <header className="w-full py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200">
      {/* Brand Logo */}
      <Link href="/" aria-label="HuzaEstate Home" className="flex items-center gap-2">
        <Logo className="h-8 w-auto" />
        <CountryFlagBadge className="w-6 h-6" />
      </Link>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-3 lg:gap-8 text-sm font-medium text-slate-600">
        {NAV_LINKS.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-2 transition-colors duration-200 active:text-[#2ec440] after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:bg-[#2ec440] after:transition-all after:duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] focus-visible:ring-offset-2 focus-visible:rounded-sm ${
                isActive
                  ? 'text-slate-900 font-semibold after:w-full'
                  : 'hover:text-slate-900 after:w-0 hover:after:w-full'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <CartButton />
        <Link
          href="/properties"
          className="hidden sm:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200"
        >
          Browse Properties
        </Link>

        {/* Conditional Auth Actions */}
        {isLoggedIn ? (
          <div className="relative hidden md:block ml-2" ref={menuRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="block relative rounded-full border border-slate-200 hover:ring-2 hover:ring-[#2ec440] hover:border-[#2ec440] transition-all w-10 h-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
              title="Profile Menu"
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
              Get Started
            </Link>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
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
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-lg flex flex-col px-6 py-4 gap-1">
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`py-3 px-2 -mx-2 rounded-lg font-semibold border-b border-slate-50 last:border-b-0 transition-colors duration-150 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ec440] ${
                  isActive ? 'text-[#2ec440]' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/properties"
            onClick={() => setMenuOpen(false)}
            className="mt-3 text-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-sm px-5 py-3 rounded-full transition-colors duration-150"
          >
            Browse Properties
          </Link>
          <Link
            href="/post-property"
            onClick={() => setMenuOpen(false)}
            className="mt-2 text-center bg-slate-900 hover:bg-[#2ec440] active:bg-[#28b039] text-white font-semibold text-sm px-5 py-3 rounded-full transition-colors duration-150"
          >
            Post a property
          </Link>
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
              Get Started
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
