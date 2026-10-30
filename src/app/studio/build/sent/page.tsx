"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/shared/RequireAuth";
import DesignPlans from "@/components/build/DesignPlans";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/build/format";
import { HOUSE_DESIGN_STATUS_LABELS, HouseDesignsApi, type HouseDesignRecord, type HouseDesignStatus } from "@/lib/houseDesigns/api";

const STATUS_STYLE: Record<HouseDesignStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  reviewing: "bg-amber-50 text-amber-700",
  quoted: "bg-violet-50 text-violet-700",
  accepted: "bg-[#2ec440]/10 text-[#219b31]",
  declined: "bg-slate-100 text-slate-600",
};

function SentDesigns() {
  const { token, isAuthReady } = useAuth();
  const [designs, setDesigns] = useState<HouseDesignRecord[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token) return;
    let cancelled = false;
    HouseDesignsApi.mine(token).then((result) => {
      if (cancelled) return;
      if (result.ok) setDesigns(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-4xl px-6 sm:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-black text-slate-900">Designs I sent</h1>
          <Link href="/studio/build" className="text-sm font-bold text-[#219b31] hover:underline">
            Back to my projects
          </Link>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        ) : designs === null ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : designs.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <h2 className="mb-2 text-lg font-black text-slate-900">You haven&apos;t sent a design yet</h2>
            <p className="mb-6 text-sm text-slate-500">Open one of your projects, lay out your house in the designer, and press Send to HuzaEstate.</p>
            <Link href="/studio/build" className="inline-block rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-[#2ec440]">
              Open my projects
            </Link>
          </div>
        ) : (
          <ul className="space-y-5">
            {designs.map((record) => (
              <li key={record.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-slate-900">{record.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Sent {formatDate(record.createdAt)} · {record.floorCount} {record.floorCount === 1 ? "floor" : "floors"} · {record.roomCount} {record.roomCount === 1 ? "room" : "rooms"} · {record.totalAreaSqm} sqm
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[record.status]}`}>{HOUSE_DESIGN_STATUS_LABELS[record.status]}</span>
                </div>
                {record.adminNote && (
                  <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Note from HuzaEstate</span>
                    {record.adminNote}
                  </p>
                )}
                <DesignPlans record={record} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SentDesignsPage() {
  return (
    <RequireAuth>
      <SentDesigns />
    </RequireAuth>
  );
}
