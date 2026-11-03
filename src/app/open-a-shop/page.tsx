"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { COUNTRY_OPTIONS, findCountry } from "@/lib/countries";
import { RoleRequestsApi } from "@/lib/roleRequests/api";
import { SUPPLIER_CATEGORIES } from "@/lib/suppliers/api";
import { useToast } from "@/lib/toast-context";

const PATH = "/open-a-shop";
const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-[#2ec440] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15 transition";

/** Anyone can open a shop and sell on HuzaEstate, the way anyone can post a property: sign in or sign up, say what the shop is and where,
 *  and it is open at once, with the supplier workspace to add and manage its products. */
export default function OpenAShopPage() {
  const router = useRouter();
  const { account, token, isLoggedIn, isAuthReady, refreshAccount } = useAuth();
  const { showToast } = useToast();
  const [shopName, setShopName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [country, setCountry] = useState(() => findCountry(account?.country ?? "")?.name ?? "");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAuthReady) return <p className="py-24 text-center text-sm font-semibold text-slate-400">Loading…</p>;

  const roles = account?.roles ?? [];
  const isStaff = roles.includes("administrator") || roles.includes("organization_admin");

  // The same two-part page for every state: what the shop is about on the left, what to do next on the right.
  const panel = (title: string, children: React.ReactNode) => (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <aside className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-7 py-10 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#2ec440]/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[#2ec440]/10 blur-3xl" />
          <div className="relative">
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
              Open your shop.
              <br />
              <span className="text-[#2ec440]">Start selling.</span>
            </h1>
            <ol className="mt-9 space-y-3">
              {["Open your shop", "Add your products and prices", "Get orders and get paid"].map((step, index) => (
                <li key={step} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2ec440] text-sm font-black text-white">{index + 1}</span>
                  <span className="font-bold">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-2">
              {SUPPLIER_CATEGORIES.slice(0, 7).map((name) => (
                <span key={name} className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-300">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex items-center">
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            {children}
          </div>
        </section>
      </div>
    </main>
  );

  if (!isLoggedIn || !account) {
    return panel(
      "Start with your account",
      <div className="flex flex-col gap-3">
        <Link href={`/signup?redirect=${encodeURIComponent(PATH)}`} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          Create an account
        </Link>
        <Link href={`/login?redirect=${encodeURIComponent(PATH)}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-800 transition-colors hover:border-[#2ec440] hover:text-[#219b31]">
          Sign in
        </Link>
      </div>,
    );
  }

  if (roles.includes("supplier")) {
    return panel(
      "Your shop is open",
      <Link href="/supplier" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
        Go to your shop
      </Link>,
    );
  }

  if (isStaff) {
    return panel("Use a different account", <p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">Administrator and organisation accounts cannot open a shop. Use a different account.</p>);
  }

  const toggleCategory = (name: string) => setCategories((list) => (list.includes(name) ? list.filter((c) => c !== name) : [...list, name]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || saving) return;
    if (!shopName.trim()) return setError("Give your shop a name.");
    if (!country) return setError("Choose your country.");
    if (!city.trim()) return setError("Enter your city.");
    const phoneIssue = phoneProblem(phone);
    if (phoneIssue) return setError(phoneIssue);
    setSaving(true);
    setError("");
    const result = await RoleRequestsApi.submit(token, {
      role: "supplier",
      country,
      details: { city: city.trim(), phone: cleanPhone(phone), companyName: shopName.trim(), categories },
    });
    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }
    await refreshAccount();
    showToast("Your shop is open. Finish your profile, then add your products.");
    router.push("/supplier");
  };

  return panel(
    "Tell us about your shop",
    <form onSubmit={submit} className="space-y-6">
      <label className="block text-sm font-bold text-slate-700">
        Shop name
        <input className={`${fieldClass} mt-2`} value={shopName} maxLength={160} onChange={(e) => setShopName(e.target.value)} autoFocus />
      </label>

      <div className="text-sm font-bold text-slate-700">
        What do you sell?
        <div className="mt-3 flex flex-wrap gap-2">
          {SUPPLIER_CATEGORIES.map((name) => {
            const on = categories.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCategory(name)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? "border-[#2ec440] bg-[#2ec440]/10 text-[#219b31]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold text-slate-700">
          Country
          <Select className={`${fieldClass} mt-2`} value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Choose a country</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.name}>
                {option.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block text-sm font-bold text-slate-700">
          City
          <input className={`${fieldClass} mt-2`} value={city} maxLength={120} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>

      <div className="text-sm font-bold text-slate-700">
        Phone number
        <div className="mt-2">
          <PhoneInput value={phone} onChange={setPhone} required />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
        {saving ? "Opening your shop…" : "Open my shop"}
      </button>
    </form>,
  );
}
