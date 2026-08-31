import PropertyCard from "@/components/PropertyCard";
import SearchBar from "@/components/SearchBar";
import Reveal from "@/components/Reveal";
import { mockProperties } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const featuredProperties = mockProperties.slice(0, 3);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full bg-white pt-12 md:pt-16 overflow-hidden">
        {/* Text Content (Constrained Width) */}
        <div className="max-w-[1400px] mx-auto px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="md:w-3/5">
              <h1 className="animate-fade-in-up text-[5rem] sm:text-[6rem] lg:text-[7rem] font-medium text-black leading-[1.05] tracking-tight drop-shadow-sm">
                Find it. Tour it. Own it.
              </h1>
              <div className="animate-fade-in-up mt-10 flex items-center gap-4" style={{ animationDelay: "150ms" }}>
                <Link href="/properties" className="bg-slate-900 hover:bg-[#2ec440] active:bg-[#2ec440] text-white px-8 py-4 text-[15px] font-bold inline-flex items-center gap-2 transition-all duration-300 rounded-full shadow-sm hover:-translate-y-0.5">
                  Browse Properties
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </Link>
              </div>
            </div>
            <div className="animate-fade-in-up md:w-1/3 mt-8 md:mt-6 text-gray-500 text-[17px] leading-relaxed max-w-sm" style={{ animationDelay: "300ms" }}>
              <p>
                With us you will find not just accommodation, but a place where your new life begins, full of cosiness and possibilities.
              </p>
            </div>
          </div>
        </div>

        {/* Image Content (Full Width, pulled up under text) */}
        <div className="relative z-0 w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[750px] -mt-10 sm:-mt-16 md:-mt-24 lg:-mt-32">
          <Image
            src="/hero-house-spacious.jpg"
            alt="Modern home"
            fill
            className="animate-ken-burns object-cover object-bottom"
            priority
          />

          {/* Floating Stat Badge */}
          <div className="animate-fade-in-up absolute bottom-8 right-6 sm:right-10 md:right-16 z-10" style={{ animationDelay: "500ms" }}>
            <div className="animate-float bg-white/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl flex items-center gap-4">
              <div className="text-3xl font-extrabold text-[#2ec440]">2,500+</div>
              <div className="text-slate-700 text-sm font-semibold leading-tight max-w-[100px]">
                Exclusive properties listed
              </div>
            </div>
          </div>
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
                  Whether you need to find the perfect family home, a high-yield investment, or a luxury rental, we're here to help you achieve your goals with unparalleled market expertise.
                </p>
              </Reveal>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Reveal delay={0} className="flex flex-col items-start gap-3 group">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  <svg className="w-6 h-6 text-[#2ec440]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Premium Listings</h3>
                <p className="text-slate-600 text-[15px] leading-relaxed">Access to over 2,500+ exclusive properties that you won't find on any other public market.</p>
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
                <p className="text-slate-600 text-[15px] leading-relaxed">With deep experience in Rwanda's real estate, we have helped over 1,200 happy families relocate.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredProperties.map((property, index) => (
              <Reveal key={property.id} delay={index * 120}>
                <PropertyCard property={property} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
