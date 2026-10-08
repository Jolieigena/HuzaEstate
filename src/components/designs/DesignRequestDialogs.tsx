"use client";

import Link from "next/link";
import { useId, useState } from "react";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { DesignsApi, type DesignRequestKind } from "@/lib/designs/api";
import { CurrencySelect, SpaceSelect, useCurrencyChoice } from "./fields";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#2ec440] focus:ring-2 focus:ring-[#2ec440]/15";
const primary = "min-h-11 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50";

/** Asks a signed-out visitor to sign in first, then comes back to this page. */
export function SignInPrompt({ open, onClose, returnTo }: { open: boolean; onClose: () => void; returnTo: string }) {
  return (
    <AuthRequiredModal
      open={open}
      onClose={onClose}
      title="Sign in to continue"
      description="You need an account to send requests to designers and suppliers."
      signInHref={`/login?redirect=${encodeURIComponent(returnTo)}`}
      signUpHref={`/signup?redirect=${encodeURIComponent(returnTo)}`}
    />
  );
}

export interface RequestTarget {
  kind: DesignRequestKind;
  /** The design the request is about (always set for a price request). */
  designId?: string;
  designTitle?: string;
  professionalId: string;
  professionalName?: string;
  /** The design's price type. The area is only asked for when it drives the price (per m²) or for a new design. */
  priceType?: "fixed" | "per_sqm" | "on_request";
  /** Pre-filled from the page, e.g. the area typed into the price estimate. */
  areaSqm?: number;
  spaceType?: string;
}

/** A client's request to a designer: a custom price for an existing design, or a new custom design. */
export function RequestDialog({ target, onClose }: { target: RequestTarget | null; onClose: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={target !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-lg">
      {target && <RequestForm key={`${target.kind}-${target.designId ?? target.professionalId}`} titleId={titleId} target={target} onClose={onClose} />}
    </Dialog>
  );
}

function RequestForm({ titleId, target, onClose }: { titleId: string; target: RequestTarget; onClose: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [spaceType, setSpaceType] = useState(target.kind === "custom_design" ? (target.spaceType ?? "") : "");
  const [area, setArea] = useState(target.areaSqm ? String(target.areaSqm) : "");
  const [budget, setBudget] = useState("");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const { currency, setCurrency } = useCurrencyChoice();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  // A price request is about a design that already says what space it is for, so only a brand new design
  // asks for the space. The area is asked only when it drives the price (per m²) or for a new design.
  const showSpace = target.kind === "custom_design";
  const showArea = target.kind === "custom_design" || target.priceType === "per_sqm";

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    const result = await DesignsApi.createRequest(token, {
      kind: target.kind,
      designId: target.designId,
      professionalId: target.professionalId,
      message: message.trim(),
      ...(showSpace && spaceType ? { spaceType } : target.spaceType ? { spaceType: target.spaceType } : {}),
      ...(showArea && Number(area) > 0 ? { areaSqm: Number(area) } : {}),
      ...(budgetOpen && Number(budget) > 0 ? { budget: Number(budget), currency } : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Request sent.");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="p-6">
        <h2 id={titleId} className="mb-2 pr-6 text-lg font-semibold text-slate-900">
          Request sent
        </h2>
        <p className="text-sm text-slate-600">{target.professionalName ?? "The designer"} will reply with a price. You will get a notification.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={secondary} onClick={onClose}>
            Close
          </button>
          <Link href="/design-requests" className={`${primary} inline-flex items-center`}>
            View my requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[88vh] flex-col p-6">
      <h2 id={titleId} className="mb-1 pr-6 text-lg font-semibold text-slate-900">
        {target.kind === "custom_price" ? "Request a custom price" : "Request a custom design"}
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        {target.designTitle ? `“${target.designTitle}”` : ""}
        {target.designTitle && target.professionalName ? " by " : ""}
        {target.professionalName ?? ""}
      </p>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {(showSpace || showArea) && (
          <div className={`grid gap-3 ${showSpace && showArea ? "sm:grid-cols-2" : ""}`}>
            {showSpace && (
              <label className="block text-sm font-bold text-slate-700">
                Space
                <SpaceSelect className={`${field} mt-1`} value={spaceType} onChange={setSpaceType} />
              </label>
            )}
            {showArea && (
              <label className="block text-sm font-bold text-slate-700">
                Area (m²)
                <input className={`${field} mt-1`} inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
            )}
          </div>
        )}
        {budgetOpen ? (
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <label className="block text-sm font-bold text-slate-700">
              Budget
              <input className={`${field} mt-1`} inputMode="decimal" autoFocus value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))} />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Currency
              <CurrencySelect className={`${field} mt-1`} value={currency} onChange={setCurrency} />
            </label>
          </div>
        ) : (
          <button type="button" onClick={() => setBudgetOpen(true)} className="text-sm font-bold text-[#219b31] hover:underline">
            + Add a budget (optional)
          </button>
        )}
        <label className="block text-sm font-bold text-slate-700">
          {target.kind === "custom_price" ? "Tell the designer about your space" : "What do you want designed?"}
          <textarea className={`${field} mt-1 min-h-28 resize-y font-normal`} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={secondary} onClick={onClose}>
          Cancel
        </button>
        <button type="button" className={primary} disabled={busy || !message.trim()} onClick={submit}>
          {busy ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  );
}

/** Asks furniture suppliers to price a design's furniture list. */
export function FurnitureQuoteDialog({ design, onClose }: { design: { id: string; title: string; furniture: { name: string; quantity: number }[] } | null; onClose: () => void }) {
  const titleId = useId();
  return (
    <Dialog open={design !== null} onClose={onClose} labelledBy={titleId} panelClassName="max-w-md">
      {design && <FurnitureQuoteForm key={design.id} titleId={titleId} design={design} onClose={onClose} />}
    </Dialog>
  );
}

function FurnitureQuoteForm({ titleId, design, onClose }: { titleId: string; design: { id: string; title: string; furniture: { name: string; quantity: number }[] }; onClose: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    setError("");
    const result = await DesignsApi.requestFurnitureQuote(token, design.id, message.trim() || undefined);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Quote request sent to suppliers.");
    setSent(true);
  };

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-1 pr-6 text-lg font-semibold text-slate-900">
        {sent ? "Request sent" : "Get furniture quotes"}
      </h2>
      {sent ? (
        <>
          <p className="text-sm text-slate-600">Furniture suppliers can now price this list. Their quotes will appear under your requests.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={secondary} onClick={onClose}>
              Close
            </button>
            <Link href="/design-requests" className={`${primary} inline-flex items-center`}>
              View my requests
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-500">Suppliers will price these {design.furniture.length} items from “{design.title}”.</p>
          <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {design.furniture.map((item, index) => (
              <li key={index}>
                {item.quantity} × {item.name}
              </li>
            ))}
          </ul>
          <label className="block text-sm font-bold text-slate-700">
            Message to suppliers (optional)
            <textarea className={`${field} mt-1 min-h-20 resize-y font-normal`} maxLength={2000} placeholder="Delivery address, deadline, preferred materials…" value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          {error && <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={secondary} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={primary} disabled={busy} onClick={submit}>
              {busy ? "Sending…" : "Request quotes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
