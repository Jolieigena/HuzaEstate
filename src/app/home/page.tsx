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
    href: "/properties",
    image: "/card-buy-v2.jpg",
    title: "Browse properties",
    description: "Find your perfect apartment, villa, or commercial space with immersive 3D tours.",
    cta: "Start exploring",
  },
  {
    href: "/build",
    image: "/hero-house-final.jpg",
    title: "Design your dream home",
    description: "From interior styling to full residential and commercial builds, bring your vision to life.",
    cta: "Explore design & build",
  },
  {
    href: "/sell",
    image: "/hero-house-ai.jpg",
    title: "Advertise your property",
    description: "List your home, villa, or commercial building and reach thousands of serious buyers.",
    cta: "List your property",
  },
];

export default function Home() {

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[580px] sm:h-[640px] md:h-[700px] flex items-center justify-center overflow-hidden">
        <Image
          src="/hero-african.jpg"
          alt="Find your next home in Rwanda"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Light gradient — just enough to make text pop without killing the photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/45" />

        <div className="relative z-10 w-full max-w-3xl px-6 text-center">
          <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-[3.75rem] font-extrabold text-white tracking-tight leading-[1.1] mb-3 drop-shadow-lg">
            Find, tour it, own it
          </h1>
          <p className="animate-fade-in-up text-white/90 text-base sm:text-lg font-medium mb-8 drop-shadow max-w-2xl mx-auto" style={{ animationDelay: "100ms" }}>
            Buy, rent, or sell apartments, villas, and commercial properties. Plus, expert interior & exterior design, and full building & renovation services.
          </p>

          <div className="animate-fade-in-up flex justify-center" style={{ animationDelay: "150ms" }}>
            <SearchBar />
          </div>

          <div className="animate-fade-in-up mt-10 flex items-center justify-center gap-6 sm:gap-10" style={{ animationDelay: "300ms" }}>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white drop-shadow">2,500+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Listings</div>
            </div>
            <div className="w-px h-8 bg-white/30"></div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white drop-shadow">1,200+</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Families helped</div>
            </div>
            <div className="w-px h-8 bg-white/30"></div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-white drop-shadow">30</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Districts covered</div>
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

      {/* Featured Properties Section */}
      <section className="w-full bg-white py-16 sm:py-20 px-6 sm:px-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header */}
          <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Curated Exclusive Properties
              </h2>
              <p className="text-slate-500 text-lg mt-2">Handpicked premium listings just for you.</p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all hover:-translate-y-0.5 self-start sm:self-auto"
            >
              <span>Explore All</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </Link>
          </Reveal>

          {/* Property Grid */}
          <PublicPropertyGrid
            properties={mockProperties}
            limit={6}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            revealAnimation
            showFeaturedBadge
          />


        </div>
      </section>


      {/* More than finding a home */}
      <section className="w-full bg-[#f8fafc] py-16 sm:py-24 px-6 sm:px-10 md:px-12 border-t border-slate-200/60">
        <div className="max-w-[1400px] mx-auto">
          <Reveal className="max-w-2xl mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">More than finding a property</h2>
            <p className="text-slate-600 text-lg leading-relaxed mt-4">
              HuzaEstate helps you discover properties, shape new ideas, and improve the spaces you already own. From interior styling to full commercial and residential builds, our team is here for you.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Reveal className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <ProcessVideoCard video={buildVideos.overview} aspectClassName="aspect-video" />
              <div className="p-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Design & Build</h3>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                  Describe your ideas and requirements to explore personalised property concepts with Huza AI before you build.
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
