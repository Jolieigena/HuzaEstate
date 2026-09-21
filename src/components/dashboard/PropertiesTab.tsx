"use client";

import { useState } from "react";
import Image from "next/image";
import { getPortfolio, type PortfolioProperty } from "@/lib/portfolio/portfolioService";
import { RESALE_VERDICT_LABELS } from "@/lib/marketAnalytics/types";
import RentPaymentPanel from "./RentPaymentPanel";
import ListPropertyModal, { type ListMode } from "./ListPropertyModal";

const VERDICT_STYLE: Record<string, string> = {
  hold: "bg-slate-100 text-slate-600",
  consider_selling: "bg-amber-100 text-amber-700",
  sell_now: "bg-[#2ec440]/10 text-[#219b31]",
};

export default function PropertiesTab({ goToTab }: { goToTab: (tab: string) => void }) {
  // Reads the single fixture "demo-user" owner in myProperties.ts, matching
  // every other dashboard tab in this prototype (SavedHomesTab, ToursTab,
  // ...) rather than the real logged-in account id — there's no multi-tenant
  // portfolio data to key by. ListPropertyModal below has its own useAuth()
  // call for the real account/token it needs to publish a listing.
  const [listing, setListing] = useState<{ property: PortfolioProperty; mode: ListMode } | null>(null);
  const portfolio = getPortfolio("demo-user");

  if (portfolio.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Portfolio</h2>
        <p className="text-slate-500">Properties you own or rent through HuzaEstate will show up here.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Portfolio</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {portfolio.map((property) => (
          <div key={property.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col">
            <div className="relative h-56 overflow-hidden">
              <Image src={property.imageUrl} alt={property.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${property.ownershipStatus === "rented" ? "bg-[#2ec440]" : "bg-slate-400"}`}></div>
                {property.ownershipStatus === "rented" ? "Active Lease" : "Owned Property"}
              </div>
              {property.resaleRecommendation && (
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-lg text-xs font-black ${VERDICT_STYLE[property.resaleRecommendation.verdict]}`}>
                  {RESALE_VERDICT_LABELS[property.resaleRecommendation.verdict]}
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col flex-grow">
              {property.ownershipStatus === "rented" ? (
                <>
                  <div className="text-sm font-semibold text-slate-500 mb-3">Rented property</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-black text-slate-900 mb-1">
                    {property.currentEstimatedValue ? `$${property.currentEstimatedValue.toLocaleString()}` : "Estimate unavailable"}
                  </div>
                  <div className="text-sm font-semibold text-slate-500 mb-3">
                    Estimated value{property.purchasePrice ? ` · bought for $${property.purchasePrice.toLocaleString()}` : ""}
                  </div>
                </>
              )}

              <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{property.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path></svg>
                {property.location}
              </p>

              {property.resaleRecommendation && (
                <p className="text-xs text-slate-500 leading-relaxed mb-4 bg-slate-50 rounded-xl p-3">{property.resaleRecommendation.reasoning}</p>
              )}

              <div className="mt-auto flex flex-col gap-2">
                {property.ownershipStatus === "rented" ? (
                  <button
                    onClick={() => goToTab("payments")}
                    className="block text-center w-full bg-slate-900 hover:bg-[#2ec440] text-white font-semibold py-3 rounded-xl transition-all shadow-sm"
                  >
                    Manage Lease
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setListing({ property, mode: "resale" })}
                      className="text-center w-full bg-white border border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 hover:text-[#2ec440] text-slate-700 font-semibold py-3 rounded-xl transition-all text-sm"
                    >
                      List for Resale
                    </button>
                    <button
                      onClick={() => setListing({ property, mode: "rent" })}
                      className="text-center w-full bg-white border border-slate-200 hover:border-[#2ec440] hover:bg-[#2ec440]/5 hover:text-[#2ec440] text-slate-700 font-semibold py-3 rounded-xl transition-all text-sm"
                    >
                      List for Rent
                    </button>
                  </div>
                )}
              </div>

              {property.ownershipStatus === "rented" && <RentPaymentPanel propertyId={property.id} />}
            </div>
          </div>
        ))}
      </div>

      <ListPropertyModal property={listing?.property ?? null} mode={listing?.mode ?? "resale"} onClose={() => setListing(null)} />
    </div>
  );
}
