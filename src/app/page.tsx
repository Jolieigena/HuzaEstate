import PublicPropertyGrid from "@/components/PublicPropertyGrid";
import SearchBar from "@/components/SearchBar";
import Reveal from "@/components/Reveal";
import { ProcessVideoCard } from "@/components/ProcessVideo";
import { buildVideos, renovateVideos } from "@/lib/videos";
import { mockProperties } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";

const QUICK_ACTIONS = [
  {
    href: "/buy",
    image: "/hero-house-final.jpg",
    title: "Buy a home",
    description: "Find your place with the most listings, verified sellers, and immersive 3D tours.",
    cta: "Browse homes for sale",
  },
  {
    href: "/rent",
    image: "/hero-house-white.jpg",
    title: "Rent a home",
    description: "Explore rentals with transparent pricing, screening, and online rent payments.",
    cta: "Browse rentals",
  },
  {
    href: "/sell",
    image: "/hero-house-ai.jpg",
    title: "Sell a home",
    description: "List with us and reach thousands of buyers and renters across Rwanda.",
    cta: "See your options",
  },
];

export default function Home() {

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section — search-first, like a marketplace homepage: a full-bleed
          photo, Buy/Rent/Sell entry points, and the search bar itself all in
          the first screen, rather than leading with a brand slogan. */}
      <section className="relative w-full h-[560px] sm:h-[620px] md:h-[680px] flex items-center justify-center overflow-hidden">
        <Image
          src="/hero-house-spacious.jpg"
          alt="Find your next home in Rwanda"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/80" />

        <div className="relative z-10 w-full max-w-3xl px-6 text-center">
          <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-4 drop-shadow-md">
            Find your place in Rwanda
          </h1>
          <p className="animate-fade-in-up text-white/90 text-base sm:text-lg font-medium mb-8 drop-shadow-sm" style={{ animationDelay: "100ms" }}>
            Search homes for sale, homes for rent, and list your own — all verified, all in one place.
          </p>

          <div className="animate-fade-in-up flex justify-center" style={{ animationDelay: "150ms" }}>
            <SearchBar />
          </div>

          <div className="animate-fade-in-up mt-9 flex items-center justify-center gap-6 sm:gap-10" style={{ animationDelay: "300ms" }}>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">2,500+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Listings</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">1,200+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Families helped</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">30</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Districts covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Buy / Rent / Sell quick-action cards */}
      <section className="w-full bg-white py-14 sm:py-16 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {QUICK_ACTIONS.map((action, i) => (
            <Reveal key={action.href} delay={i * 100}>
              <Link href={action.href} className="group relative block rounded-3xl overflow-hidden h-72 shadow-sm hover:shadow-xl transition-shadow duration-300">
                <Image
                  src={action.image}
                  alt={action.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-extrabold text-white mb-1.5 drop-shadow-sm">{action.title}</h3>
                  <p className="text-white/80 text-[13px] leading-snug mb-4 max-w-[85%]">{action.description}</p>
                  <span className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-sm px-5 py-2.5 rounded-full group-hover:bg-[#2ec440] group-hover:text-white transition-colors">
                    {action.cta}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why Choose Us / Trust Section */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-b border-slate-200/60 mt-12 md:mt-24">
        <div className="max-w-[1400px] mx-auto">
          {/* Section 1: Real Estate Expertise (Restored 4 Columns) */}
          <div className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  Real estate expertise <br className="hidden lg:inline" />
                  you can rely on
                </h2>
              </Reveal>
              <Reveal delay={100} className="lg:col-span-5 flex flex-col justify-end pb-2">
                <p className="text-slate-600 text-lg font-normal leading-relaxed">
                  Whether you need to find the perfect family home, a high-yield investment, or a luxury rental, we&apos;re here to help you achieve your goals with unparalleled market expertise.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Reveal delay={0} className="flex flex-col items-start gap-3 group">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Premium Listings</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">Access to over 2,500+ exclusive properties that you won&apos;t find on any other public market.</p>
              </Reveal>

              <Reveal delay={100} className="flex flex-col items-start gap-3 group">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Verified Properties</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">Every property undergoes a rigorous 50-point inspection and legal verification before listing.</p>
              </Reveal>

              <Reveal delay={200} className="flex flex-col items-start gap-3 group">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Fast Closings</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">Our in-house legal and finance teams ensure your transaction closes smoothly and quickly.</p>
              </Reveal>

              <Reveal delay={300} className="flex flex-col items-start gap-3 group">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Proven Expertise</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">With deep experience in Rwanda&apos;s real estate, we have helped over 1,200 happy families relocate.</p>
              </Reveal>
            </div>
          </div>

          <div className="w-full h-px bg-slate-200/60 my-16"></div>

          {/* Section 2: Buy with confidence (The new 3 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
            <Reveal className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2ec440]/10 text-[#2ec440] font-semibold text-xs uppercase tracking-wide mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Verified Listings
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Buy with absolute confidence.
              </h2>
            </Reveal>
            <Reveal delay={100} className="lg:col-span-5 flex flex-col justify-end pb-2">
              <p className="text-slate-600 text-lg font-normal leading-relaxed">
                Every property listed on HuzaEstate undergoes a rigorous verification process. We ensure the title is clean, the photos are accurate, and the seller is verified before you even book a tour.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Reveal delay={0} className="flex flex-col items-start gap-3 group">
              <div className="w-10 h-10 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">No hidden fees</h3>
              <p className="text-slate-600 text-[15px] leading-relaxed">No surprise agency costs. What you see is what you pay.</p>
            </Reveal>

            <Reveal delay={100} className="flex flex-col items-start gap-3 group">
              <div className="w-10 h-10 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Direct access</h3>
              <p className="text-slate-600 text-[15px] leading-relaxed">Direct access to dedicated buying agents to help you navigate the process.</p>
            </Reveal>

            <Reveal delay={200} className="flex flex-col items-start gap-3 group">
              <div className="w-10 h-10 rounded-full bg-[#2ec440]/10 flex items-center justify-center text-[#2ec440] mb-2 transition-transform duration-300 group-hover:-translate-y-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Exclusive 3D Walkthroughs</h3>
              <p className="text-slate-600 text-[15px] leading-relaxed">Tour properties virtually with our immersive 3D walkthroughs for every listing.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="w-full bg-white py-16 sm:py-20 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header */}
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Curated Exclusive Properties
              </h2>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all hover:-translate-y-0.5 self-start sm:self-auto"
            >
              <span>Explore All Homes</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
          </Reveal>

          {/* Property Grid */}
          <PublicPropertyGrid properties={mockProperties} limit={3} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" revealAnimation />
        </div>
      </section>

      {/* More than finding a home */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">More than finding a home</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">
              HuzaEstate helps you discover property, shape new ideas and improve the spaces you already own.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Reveal className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <ProcessVideoCard video={buildVideos.overview} aspectClassName="aspect-video" />
              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Design a new home</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                  Describe your ideas and requirements and explore personalised home concepts with Huza AI before you build.
                </p>
                <Link href="/build" className="inline-flex items-center gap-2 text-[#2ec440] font-bold text-sm hover:text-[#28b039] transition-colors">
                  Explore Build
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={100} className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <ProcessVideoCard video={renovateVideos.overview} aspectClassName="aspect-video" />
              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Transform your current space</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                  Upload your existing property and explore renovation directions with Huza AI before committing to the work.
                </p>
                <Link href="/renovate" className="inline-flex items-center gap-2 text-[#2ec440] font-bold text-sm hover:text-[#28b039] transition-colors">
                  Explore Renovate
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
