"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfessionalProfile, submitProfessionalContact, type RealProfessionalProfile } from "@/lib/professional/api";
import { useToast } from "@/lib/toast-context";

function ContactCard({ profileId, profileName }: { profileId: string; profileName: string }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || sending) return;
    setSending(true);
    // Emailed to the professional through communication-service.
    const { ok } = await submitProfessionalContact(profileId, { name: name.trim(), email: email.trim(), message: message.trim() });
    setSending(false);
    if (ok) {
      setSent(true);
      showToast(`Message sent to ${profileName}`, "success");
    } else {
      showToast("Something went wrong. Please try again.", "error");
    }
  }

  if (sent) {
    return (
      <div className="bg-[#2ec440]/5 border border-[#2ec440]/30 rounded-3xl p-8 text-center">
        <svg className="w-10 h-10 text-[#2ec440] mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h3 className="text-lg font-bold text-slate-900 mb-1">Message sent</h3>
        <p className="text-sm text-slate-500">{profileName} will get back to you at {email}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
      <h3 className="text-lg font-bold text-slate-900 mb-1">Contact {profileName}</h3>
      <p className="text-sm text-slate-500 mb-5">Tell them about your project. They&apos;ll reply directly to your email.</p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Your email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} placeholder="Tell them about your project, timeline and budget..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none" />
        </div>
        <button type="submit" disabled={sending} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
          {sending ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}

export default function ProfessionalProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loaded, setLoaded] = useState<{ id: string; profile: RealProfessionalProfile | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfessionalProfile(id).then((real) => {
      if (!cancelled) setLoaded({ id, profile: real });
    });
    return () => { cancelled = true; };
  }, [id]);

  const profile = loaded && loaded.id === id ? loaded.profile : null;

  if (!loaded || loaded.id !== id) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500">Loading…</div>;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Professional not found</h1>
        <p className="text-slate-500">This profile may no longer be available.</p>
        <Link href="/professionals" className="font-bold text-[#2ec440] hover:text-[#28b039] transition-colors">Browse professionals</Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-12">
        <Link href="/professionals" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-colors mb-8">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
          Back to professionals
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-3xl flex-shrink-0 overflow-hidden">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.displayName.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{profile.displayName}</h1>
            </div>
            <p className="text-[#2ec440] font-semibold mb-2">{profile.specialisation}</p>
            <p className="text-slate-500 text-sm">{[profile.city, profile.country].filter(Boolean).join(", ")}{profile.yearsExperience ? ` · ${profile.yearsExperience} years experience` : ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
            <p className="text-slate-600 leading-relaxed mb-8">{profile.bio}</p>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Services</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {profile.services.map((service, index) => (
                <div key={`${service.name}-${index}`} className="border border-slate-100 rounded-2xl p-4">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{service.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Example projects done</h2>
            {profile.portfolio.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {profile.portfolio.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-white/70 text-xs font-bold uppercase tracking-wide">Project</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 text-sm mb-0.5">{item.title}</h3>
                      <p className="text-xs text-slate-500 mb-2">{[profile.city, profile.country].filter(Boolean).join(", ")}{item.year ? ` · ${item.year}` : ""}</p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No example projects yet.</p>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <ContactCard profileId={profile.accountId} profileName={profile.displayName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
