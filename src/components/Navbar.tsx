"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth-context';

const NAV_LINKS = [
  { href: '/buy', label: 'Buy' },
  { href: '/rent', label: 'Rent' },
  { href: '/sell', label: 'Sell' },
  { href: '/mortgages', label: 'Mortgages' },
  { href: '/blog', label: 'Blog' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="w-full bg-white border-b border-slate-100 py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
      {/* Brand Logo */}
      <Link href="/" aria-label="HuzaEstate Home" className="block">
        <Logo className="h-8 w-auto" />
      </Link>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        {NAV_LINKS.map(link => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative py-2 transition-colors duration-200 active:text-[#2ec440] after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:bg-[#2ec440] after:transition-all after:duration-300 ${
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
        <Link 
          href="/manager" 
          className="hidden md:inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold text-sm px-4 py-2.5 rounded-full transition-all duration-200"
        >
          Manager Portal
        </Link>
        <Link 
          href="/contact" 
          className="hidden sm:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200"
        >
          Contact Us
        </Link>

        {/* Conditional Auth Actions */}
        {isLoggedIn ? (
          <div className="relative hidden md:block ml-2">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="block relative rounded-full border border-slate-200 hover:ring-2 hover:ring-[#2ec440] hover:border-[#2ec440] transition-all w-10 h-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ec440]"
              title="Profile Menu"
            >
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User Profile" fill className="object-cover rounded-full" />
              </div>
            </button>
            
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl transition-all duration-200 py-2">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <div className="text-sm font-bold text-slate-900">Jane Doe</div>
                  <div className="text-xs text-slate-500">jane@example.com</div>
                </div>
                <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  My Dashboard
                </Link>
                <Link href="/dashboard?tab=saved" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  Saved Homes
                </Link>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors mt-1 border-t border-slate-50 pt-3"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 ml-2">
            <Link 
              href="/signup"
              className="bg-slate-900 hover:bg-[#2ec440] text-white font-medium text-sm px-6 py-2.5 rounded-full transition-all inline-block"
            >
              Sign Up
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
                className={`py-3 px-2 -mx-2 rounded-lg font-semibold border-b border-slate-50 last:border-b-0 transition-colors duration-150 active:bg-slate-100 ${
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
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="mt-2 text-center border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm px-5 py-3 rounded-full transition-colors duration-150"
          >
            My Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
