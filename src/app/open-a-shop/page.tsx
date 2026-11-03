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

  const panel = (children: React.ReactNode) => (
    <main className="mx-auto max-w-xl px-6 py-14 sm:py-20">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Open your shop</h1>
      {children}
    </main>
  );

  if (!isLoggedIn || !account) {
    return panel(
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/signup?redirect=${encodeURIComponent(PATH)}`} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
          Create an account
        </Link>
        <Link href={`/login?redirect=${encodeURIComponent(PATH)}`} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-bold text-slate-800 transition-colors hover:border-[#2ec440] hover:text-[#219b31]">
          Sign in
        </Link>
      </div>,
    );
  }

  if (roles.includes("supplier")) {
    return panel(
      <Link href="/supplier" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
        Go to your shop
      </Link>,
    );
  }

  if (isStaff) {
    return panel(<p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">Administrator and organisation accounts cannot open a shop. Use a different account.</p>);
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
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
