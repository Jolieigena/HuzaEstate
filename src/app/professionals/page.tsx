"use client";

import Link from "next/link";
import { ProfessionalService } from "@/lib/professional/service";

const AVAILABILITY_STYLE: Record<string, string> = {
  available: "bg-[#2ec440]/10 text-[#219b31]",
  limited: "bg-amber-50 text-amber-700",
  unavailable: "bg-slate-100 text-slate-500",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available now",
  limited: "Limited availability",
  unavailable: "Not accepting work",
};

export default function ProfessionalsDirectoryPage() {
  const profiles = ProfessionalService.getApprovedProfiles();

  return (
    <div className="w-full bg-[#f8fafc] min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 pt-16 pb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Find an engineer or professional</h1>
        <p className="text-slate-500 max-w-2xl">
          Browse verified architects, engineers, surveyors, designers and contractors for your construction project — view their past
          work and reach out directly.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Link
            key={profile.id}
            href={`/professionals/${profile.id}`}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all p-6 flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                {profile.displayName.charAt(0)}
              </div>
              {profile.demoVerified && (
                <span className="inline-flex items-center gap-1 text-[#2ec440] text-xs font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900">{profile.displayName}</h3>
            <p className="text-sm font-semibold text-[#2ec440] mb-1">{profile.primarySpecialisation}</p>
            <p className="text-sm text-slate-500 mb-4">{profile.city}, {profile.country} · {profile.yearsExperience} yrs experience</p>

            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">{profile.biography}</p>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${AVAILABILITY_STYLE[profile.availability]}`}>
                {AVAILABILITY_LABEL[profile.availability]}
              </span>
              <span className="text-sm font-bold text-slate-900">View profile →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
