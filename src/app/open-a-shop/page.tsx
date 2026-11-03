"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordChecklist from "@/components/shared/PasswordChecklist";
import PasswordInput from "@/components/shared/PasswordInput";
import PhoneInput, { cleanPhone, phoneProblem } from "@/components/shared/PhoneInput";
import Select from "@/components/shared/Select";
import { useAuth } from "@/lib/auth-context";
import { COUNTRY_OPTIONS, findCountry } from "@/lib/countries";
import { useCurrentCountry } from "@/lib/geo/useCurrentCountry";
import { PASSWORD_MIN_LENGTH, passwordIsAcceptable } from "@/lib/passwordRules";
import { RoleRequestsApi } from "@/lib/roleRequests/api";
import { SUPPLIER_CATEGORIES } from "@/lib/suppliers/api";
import { useToast } from "@/lib/toast-context";

const PATH = "/open-a-shop";
const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] focus:border-[#2ec440] focus:outline-none focus:ring-4 focus:ring-[#2ec440]/15 transition";

/** Anyone can open a shop and sell on HuzaEstate, the way anyone can post a property. Someone with no account fills in one form: who they
 *  are and what the shop is. The account is made, the shop opens at once, and they land in the supplier workspace to add products. Someone
 *  who is already signed in only fills in the shop. */
export default function OpenAShopPage() {
  const router = useRouter();
  const { account, token, isLoggedIn, isAuthReady, signup, refreshAccount } = useAuth();
  const { showToast } = useToast();
  const detectedCountry = useCurrentCountry();

  // Who they are (only when there is no account yet)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  // What the shop is
  const [shopName, setShopName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [country, setCountry] = useState(() => findCountry(account?.country ?? "")?.name ?? "");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAuthReady) return <p className="py-24 text-center text-sm font-semibold text-slate-400">Loading…</p>;

  const needsAccount = !isLoggedIn || !account;
  const roles = account?.roles ?? [];
  const isStaff = roles.includes("administrator") || roles.includes("organization_admin");
  const shownCountry = country || (needsAccount ? findCountry(detectedCountry?.name ?? "")?.name ?? "" : "");

  // The same two-part page for every state: what the shop is about on the left, what to do next on the right.
  const panel = (title: string, children: React.ReactNode, aside?: React.ReactNode) => (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
        <aside className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-7 py-10 text-white sm:px-10 sm:py-12 lg:sticky lg:top-24">
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

        <section>
          <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
            {children}
          </div>
          {aside}
        </section>
      </div>
    </main>
  );

  if (!needsAccount && roles.includes("supplier")) {
    return panel(
      "Your shop is open",
      <Link href="/supplier" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440]">
        Go to your shop
      </Link>,
    );
  }

  if (!needsAccount && isStaff) {
    return panel("Use a different account", <p className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">Administrator and organisation accounts cannot open a shop. Use a different account.</p>);
  }

  const toggleCategory = (name: string) => setCategories((list) => (list.includes(name) ? list.filter((c) => c !== name) : [...list, name]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    if (needsAccount) {
      if (!firstName.trim() || !lastName.trim()) return setError("Enter your first and last name.");
      if (!email.trim()) return setError("Enter your email address.");
      if (password !== confirmPassword) return setError("Passwords don't match.");
      if (!passwordIsAcceptable(password)) return setError("Please choose a password that meets every rule listed.");
    }
    if (!shopName.trim()) return setError("Give your shop a name.");
    if (!shownCountry) return setError("Choose your country.");
    if (!city.trim()) return setError("Enter your city.");
    const phoneIssue = phoneProblem(phone);
    if (phoneIssue) return setError(phoneIssue);
    if (needsAccount && !termsAccepted) return setError("Please agree to the Seller Terms & Conditions to continue.");

    setSaving(true);
    let sessionToken = token;
    if (needsAccount) {
      const created = await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        termsAccepted,
        country: shownCountry,
        phone: cleanPhone(phone),
      });
      if (!created.ok) {
        setSaving(false);
        return setError(created.error);
      }
      sessionToken = created.token;
    }
    if (!sessionToken) {
      setSaving(false);
      return setError("Please sign in and try again.");
    }
    const result = await RoleRequestsApi.submit(sessionToken, {
      role: "supplier",
      country: shownCountry,
      details: { city: city.trim(), phone: cleanPhone(phone), companyName: shopName.trim(), categories },
    });
    if (!result.ok) {
      setSaving(false);
      return setError(needsAccount ? `Your account is ready, but the shop could not be opened: ${result.error}` : result.error);
    }
    await refreshAccount();
    showToast("Your shop is open. Finish your profile, then add your products.");
    router.push("/supplier");
  };

  return panel(
    needsAccount ? "Create your account and shop" : "Tell us about your shop",
    <form onSubmit={submit} className="space-y-6">
      {needsAccount && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              First name
              <input className={`${fieldClass} mt-2`} value={firstName} maxLength={80} autoComplete="given-name" onChange={(e) => setFirstName(e.target.value)} autoFocus />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Last name
              <input className={`${fieldClass} mt-2`} value={lastName} maxLength={80} autoComplete="family-name" onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Email
            <input type="email" className={`${fieldClass} mt-2`} value={email} maxLength={254} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="text-sm font-bold text-slate-700">
              Password
              <div className="mt-2">
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={PASSWORD_MIN_LENGTH} autoComplete="new-password" required />
              </div>
              <PasswordChecklist password={password} />
            </div>
            <div className="text-sm font-bold text-slate-700">
              Confirm password
              <div className="mt-2">
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
              </div>
            </div>
          </div>
          <hr className="border-slate-100" />
        </>
      )}

      <label className="block text-sm font-bold text-slate-700">
        Shop name
        <input className={`${fieldClass} mt-2`} value={shopName} maxLength={160} onChange={(e) => setShopName(e.target.value)} autoFocus={!needsAccount} />
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
          <Select className={`${fieldClass} mt-2`} value={shownCountry} onChange={(e) => setCountry(e.target.value)}>
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

      {needsAccount && (
        <div className="flex items-start gap-3">
          <input type="checkbox" id="shop-terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 cursor-pointer accent-[#2ec440]" />
          <label htmlFor="shop-terms" className="cursor-pointer text-sm leading-relaxed text-slate-600">
            I agree to HuzaEstate&apos;s{" "}
            <Link href="/seller-terms" target="_blank" rel="noopener noreferrer" className="font-bold text-[#2ec440] hover:underline">
              Seller Terms &amp; Conditions
            </Link>
            .
          </label>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-8 font-bold text-white shadow-lg transition-colors hover:bg-[#2ec440] disabled:opacity-60">
        {saving ? "Opening your shop…" : needsAccount ? "Create account and open my shop" : "Open my shop"}
      </button>
    </form>,
    needsAccount ? (
      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(PATH)}`} className="font-bold text-[#2ec440] hover:underline">
          Sign in
        </Link>
      </p>
    ) : undefined,
  );
}
