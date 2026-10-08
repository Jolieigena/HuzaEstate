"use client";

import { useState } from "react";
import Select from "@/components/shared/Select";
import { useToast } from "@/lib/toast-context";
import { submitProfessionalContact } from "@/lib/professional/api";

const PROJECT_TYPES = ["New build", "Renovation", "Interior design", "Exterior and landscaping", "Cost estimate", "Inspection or advice", "Something else"];
const START_TIMES = ["As soon as possible", "Within a month", "In 1 to 3 months", "In 3 to 6 months", "Just planning for now"];
const BUDGETS = ["Under $1,000", "$1,000 to $5,000", "$5,000 to $20,000", "$20,000 to $100,000", "Over $100,000", "Not sure yet"];

const field = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors";
const label = "block text-sm font-bold text-slate-700 mb-1.5";

/** Contact form for a professional. The questions appear one after another as each is answered, so the
 *  form never looks long, and the answers are sent as a tidy message the professional can read at a glance. */
export default function ContactForm({ profileId, profileName }: { profileId: string; profileName: string }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [startTime, setStartTime] = useState("");
  const [budget, setBudget] = useState("");
  const [details, setDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Each question shows once the one before it has an answer.
  const showType = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showWhere = showType && !!projectType;
  const showStart = showWhere && location.trim().length > 1;
  const showBudget = showStart && !!startTime;
  const showFinish = showBudget && !!budget;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!showFinish || sending) return;
    setSending(true);
    const message = [
      `Project: ${projectType}`,
      `Location: ${location.trim()}`,
      size.trim() ? `Size: ${size.trim()} m²` : "",
      `Start: ${startTime}`,
      `Budget: ${budget}`,
      details.trim() ? `\nDetails: ${details.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const { ok } = await submitProfessionalContact(profileId, { name: name.trim(), email: email.trim(), message, ...(phone.trim() ? { phone: phone.trim() } : {}) });
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
      <h3 className="text-lg font-bold text-slate-900 mb-5">Contact {profileName}</h3>
      <div className="space-y-4">
        <div>
          <label className={label} htmlFor="contact-name">Your name</label>
          <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="contact-email">Your email</label>
          <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
        </div>

        {showType && (
          <div>
            <label className={label}>What do you need?</label>
            <Select className={field} value={projectType} onChange={(e) => setProjectType(e.target.value)} aria-label="What do you need?">
              <option value="">Choose one</option>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </div>
        )}

        {showWhere && (
          <div className="grid grid-cols-[1fr_6.5rem] gap-3">
            <div>
              <label className={label} htmlFor="contact-location">Where is the project?</label>
              <input id="contact-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or area" className={field} />
            </div>
            <div>
              <label className={label} htmlFor="contact-size">Size (m²)</label>
              <input id="contact-size" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^\d.]/g, ""))} className={field} />
            </div>
          </div>
        )}

        {showStart && (
          <div>
            <label className={label}>When do you want to start?</label>
            <Select className={field} value={startTime} onChange={(e) => setStartTime(e.target.value)} aria-label="When do you want to start?">
              <option value="">Choose one</option>
              {START_TIMES.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </Select>
          </div>
        )}

        {showBudget && (
          <div>
            <label className={label}>What is your budget?</label>
            <Select className={field} value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="What is your budget?">
              <option value="">Choose one</option>
              {BUDGETS.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </Select>
          </div>
        )}

        {showFinish && (
          <>
            <div>
              <label className={label} htmlFor="contact-phone">Phone <span className="font-normal text-slate-400">(optional)</span></label>
              <input id="contact-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={20} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="contact-details">Anything else? <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea id="contact-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1500} className={`${field} resize-none`} />
            </div>
            <button type="submit" disabled={sending} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
              {sending ? "Sending…" : "Send Message"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
