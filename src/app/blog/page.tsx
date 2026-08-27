import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "The Rise of Eco-Friendly Homes in Kigali",
      category: "Market Trends",
      date: "Oct 12, 2026",
      image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "5 Interior Design Trends Defining 2027",
      category: "Design",
      date: "Oct 08, 2026",
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 3,
      title: "Understanding Mortgage Rates in Rwanda",
      category: "Finance",
      date: "Oct 01, 2026",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 4,
      title: "Nyarutarama Neighborhood Guide",
      category: "Neighborhoods",
      date: "Sep 28, 2026",
      image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 5,
      title: "How to Stage Your Home for a Quick Sale",
      category: "Selling",
      date: "Sep 20, 2026",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 6,
      title: "Investing in Commercial Real Estate vs Residential",
      category: "Investing",
      date: "Sep 15, 2026",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Featured Editorial Post */}
      <section className="pt-8 px-6 sm:px-10 max-w-[1400px] mx-auto">
        <Link href="#" className="group relative block h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl">
          <Image 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop"
            alt="Featured Post"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          
          <div className="absolute bottom-12 left-12 right-12 md:bottom-20 md:left-20 max-w-3xl">
            <div className="inline-block px-4 py-1.5 bg-[#2ec440] text-white font-bold text-xs uppercase tracking-wider rounded-full mb-6">
              Featured Report
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6 group-hover:text-slate-200 transition-colors">
              The 2026 State of African Luxury Real Estate.
            </h1>
            <p className="text-xl text-slate-300 font-medium mb-8">
              An in-depth look at emerging markets, shifting buyer demographics, and why Rwanda is becoming the premier destination for high-end property investment.
            </p>
            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 overflow-hidden relative">
                <Image src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop" alt="Author" fill className="object-cover" />
              </div>
              <div>
                <div className="font-bold text-sm">Sarah Mukasa</div>
                <div className="text-xs text-slate-400">Chief Market Analyst • Oct 15, 2026</div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Masonry / Grid Posts */}
      <section className="max-w-[1400px] mx-auto px-6 sm:px-10 py-24">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Latest Insights</h2>
          <div className="hidden sm:flex gap-4">
            <button className="px-4 py-2 rounded-full bg-slate-900 text-white font-semibold text-sm">View All</button>
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors">Market Trends</button>
            <button className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-colors">Design</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link href="#" key={post.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 flex flex-col h-full">
              <div className="relative h-64 overflow-hidden">
                <Image 
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm">
                  {post.category}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="text-xs font-semibold text-slate-400 mb-3">{post.date}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-[#2ec440] transition-colors leading-snug">
                  {post.title}
                </h3>
                <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:text-[#2ec440] transition-colors">
                  Read article 
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-slate-900 py-24 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-6">Stay ahead of the market.</h2>
          <p className="text-xl text-slate-400 mb-10 font-medium">Join 20,000+ subscribers receiving our weekly roundup of the finest properties and real estate insights.</p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email address"
              className="flex-grow px-6 py-4 rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-[#2ec440]/50 transition-colors"
              required
            />
            <button type="submit" className="bg-[#2ec440] hover:bg-[#28b039] text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
