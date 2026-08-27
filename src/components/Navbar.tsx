import Link from 'next/link';
import { Logo } from './Logo';

export default function Navbar() {
  return (
    <header className="w-full bg-white border-b border-slate-100 py-4 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 bg-white/95 backdrop-blur-sm">
      {/* Brand Logo */}
      <Link href="/" aria-label="HuzaEstate Home" className="block">
        <Logo className="h-8 w-auto" />
      </Link>
      
      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
        <Link href="/buy" className="hover:text-slate-900 transition-colors">
          Buy
        </Link>
        <Link href="/rent" className="hover:text-slate-900 transition-colors">
          Rent
        </Link>
        <Link href="/sell" className="hover:text-slate-900 transition-colors">
          Sell
        </Link>
        <Link href="/blog" className="hover:text-slate-900 transition-colors">
          Blog
        </Link>
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link 
          href="/contact" 
          className="hidden md:inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm px-4 py-2.5 rounded-full transition-all duration-200"
        >
          Contact Us
        </Link>
        <Link 
          href="/properties" 
          className="hidden sm:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200"
        >
          Browse Properties
        </Link>
        <Link 
          href="/post-property" 
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-5 py-2.5 rounded-full transition-all duration-200 shadow-sm"
        >
          Post a property
        </Link>
      </div>
    </header>
  );
}
