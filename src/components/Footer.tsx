import Link from 'next/link';
import { Logo } from './Logo';

const FOOTER_LINKS = [
  {
    heading: 'Explore',
    links: [
      { href: '/buy', label: 'Buy' },
      { href: '/rent', label: 'Rent' },
      { href: '/sell', label: 'Sell' },
      { href: '/build', label: 'Build' },
      { href: '/renovate', label: 'Renovate' },
      { href: '/properties', label: 'Browse Properties' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/mortgages', label: 'Mortgages' },
      { href: '/blog', label: 'Blog' },
      { href: '/post-property', label: 'Post a property' },
      { href: '/professionals/apply', label: 'Become a Professional' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/signup', label: 'Sign up' },
      { href: '/dashboard', label: 'My Dashboard' },
      { href: '/professional', label: 'Professional Portal' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-white mt-12">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <Logo className="h-8 w-auto" dark />
            <p className="text-slate-400 text-[15px] leading-relaxed mt-4 max-w-xs">
              Rwanda&apos;s home for premium, verified real estate — buy, rent, or sell with confidence.
            </p>
          </div>

          {/* Link Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_LINKS.map(group => (
              <div key={group.heading}>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  {group.heading}
                </h3>
                <ul className="flex flex-col gap-3">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-slate-400 hover:text-[#2ec440] text-[15px] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} HuzaEstate, Inc. All rights reserved. (Rwanda)
          </p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500 text-sm">Terms</span>
            <span className="text-slate-500 text-sm">Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
