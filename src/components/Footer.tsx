import Link from 'next/link';
import { Logo } from './Logo';

// Real handles/URLs pending — update these hrefs once each account exists.
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.25-1.5 1.55-1.5H16.6V4.3C16.3 4.26 15.35 4.2 14.25 4.2c-2.3 0-3.75 1.4-3.75 3.95V10.5H8v3h2.5V21h3z" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.3 3h3.2l-7 8 8.2 10h-6.4l-5-6.5-5.8 6.5H2.3l7.5-8.4L2 3h6.5l4.5 6 5.3-6zm-1.1 16h1.8L7.9 5H6l11.2 14z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.96 1.96 0 100 3.92 1.96 1.96 0 000-3.92zM20.44 20h-3.37v-5.6c0-1.34-.02-3.06-1.86-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.68V8.5h3.24v1.57h.05c.45-.86 1.56-1.77 3.21-1.77 3.43 0 4.26 2.26 4.26 5.19V20z" />
      </svg>
    ),
  },
];

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
      { href: '/professionals', label: 'Find a Professional' },
      { href: '/blog', label: 'Blog' },
      { href: '/post-property', label: 'Post a property' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/signup', label: 'Sign up' },
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
            <div className="flex items-center gap-3 mt-6">
              {SOCIAL_LINKS.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#2ec440] hover:bg-[#2ec440]/10 transition-colors"
                >
                  <span className="w-4 h-4">{social.icon}</span>
                </a>
              ))}
            </div>
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
