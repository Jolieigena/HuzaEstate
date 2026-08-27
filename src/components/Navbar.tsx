"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from './Logo';

const NAV_LINKS = [
  { href: '/buy', label: 'Buy' },
  { href: '/rent', label: 'Rent' },
  { href: '/sell', label: 'Sell' },
  { href: '/mortgages', label: 'Mortgages' },
  { href: '/blog', label: 'Blog' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-slate-100 py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
      {/* Brand Logo */}
      <Link href="/" aria-label="HuzaEstate Home" className="block">
        <Logo className="h-8 w-auto" />
      </Link>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        {NAV_LINKS.map(link => (
          <Link key={link.href} href={link.href} className="hover:text-slate-900 transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link 
          href="/manager" 
          className="hidden md:inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold text-sm px-4 py-2.5 rounded-full transition-all duration-200"
        >
          Manager Portal
        </Link>
        <Link 
          href="/properties" 
          className="hidden sm:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200"
        >
          Browse Properties
        </Link>
        <Link 
          href="/post-property" 
          className="hidden sm:inline-flex bg-slate-900 hover:bg-[#2ec440] text-white font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm"
        >
          Post a property
        </Link>
        <Link
          href="/dashboard"
          className="hidden md:block ml-2 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-[#2ec440] hover:border-[#2ec440] transition-all relative w-10 h-10 shadow-sm"
          title="My Dashboard"
        >
          <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User Profile" fill className="object-cover" />
        </Link>

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
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-slate-700 font-semibold border-b border-slate-50 last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/properties"
            onClick={() => setMenuOpen(false)}
            className="mt-3 text-center bg-slate-100 text-slate-800 font-semibold text-sm px-5 py-3 rounded-full"
          >
            Browse Properties
          </Link>
          <Link
            href="/post-property"
            onClick={() => setMenuOpen(false)}
            className="mt-2 text-center bg-slate-900 text-white font-semibold text-sm px-5 py-3 rounded-full"
          >
            Post a property
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="mt-2 text-center border border-slate-200 text-slate-800 font-semibold text-sm px-5 py-3 rounded-full"
          >
            My Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
