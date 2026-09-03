"use client";

import { useState } from "react";
import Image from "next/image";
import { getMyProperties, MyProperty } from "@/lib/myProperties";
import { RenovationPropertyInfo } from "@/lib/renovate/types";
import RegisterPropertyModal from "./RegisterPropertyModal";

interface PropertySelectorProps {
  onSelectOwned: (property: MyProperty) => void;
  onRegister: (property: RenovationPropertyInfo) => void;
}

export default function PropertySelector({ onSelectOwned, onRegister }: PropertySelectorProps) {
  const properties = getMyProperties();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Which property are you renovating?</h2>
      <p className="text-slate-500 leading-relaxed mb-8 max-w-2xl">
        Choose a property you own or rent with permission. Only owned or properly authorised properties can be selected as the renovation property — a saved public listing can only be used as visual inspiration.
      </p>

      {properties.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {properties.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedId(p.id);
                onSelectOwned(p);
              }}
              className={`text-left bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all group ${
                selectedId === p.id ? "border-[#2ec440] ring-2 ring-[#2ec440]/20" : "border-slate-100"
              }`}
            >
              <div className="relative h-36 overflow-hidden">
                <Image src={p.imageUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide text-slate-900">
                  {p.ownershipStatus === "owned" ? "Owned" : p.ownershipStatus === "rented" ? "Rented" : "Unconfirmed"}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 truncate mb-0.5">{p.name}</h3>
                <p className="text-sm text-slate-500 truncate mb-2">{p.location}</p>
                <p className="text-xs font-semibold text-slate-400">
                  {p.bedrooms} bed · {p.bathrooms} bath · {p.areaSqm} sqm
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 mb-1">Don&apos;t see the property you want?</h3>
          <p className="text-sm text-slate-500">Register another property with its address, size and ownership status.</p>
        </div>
        <button
          type="button"
          onClick={() => setRegisterOpen(true)}
          className="flex-shrink-0 bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-sm whitespace-nowrap"
        >
          Register Another Property
        </button>
      </div>

      <div className="mt-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16.5v-4.5m0-3.5h.008M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-slate-700 text-sm leading-relaxed">
          Browsing a public listing you don&apos;t own? You can still add it as visual inspiration later, in the Style &amp; Inspiration step of your assessment — it won&apos;t be attached as the property being renovated.
        </p>
      </div>

      <RegisterPropertyModal open={registerOpen} onClose={() => setRegisterOpen(false)} onSubmit={(property) => { setRegisterOpen(false); onRegister(property); }} />
    </div>
  );
}
