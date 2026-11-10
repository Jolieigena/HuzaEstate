"use client";

import ImageDropArea from "@/components/shared/ImageDropArea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Select from "@/components/shared/Select";
import { SpaceSelect, spacesFor } from "@/components/designs/fields";
import { AdminApi, type AdminUser } from "@/lib/admin/api";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { useAuth } from "@/lib/auth-context";
import { DesignBriefsApi, DESIGN_BRIEF_STATUS_LABELS, requestDesignDraft, type BriefPart, type DesignBrief, type DesignBriefInput, type DesignBriefStatus } from "@/lib/designBriefs/api";
import { DESIGN_CATEGORY_LABELS, DESIGN_PART_KIND_LABELS, type DesignCategory, type DesignPartKind } from "@/lib/designs/api";
import { filesToUploadedUrls } from "@/lib/imageUpload";
import { useToast } from "@/lib/toast-context";
import { Card, EmptyState, PageFrame, PrimaryButton, PrimaryLink, RequirePermission, StatusPill, fieldClass, formatDateTime, formatMoney } from "../ui";

const STATUSES = Object.keys(DESIGN_BRIEF_STATUS_LABELS) as DesignBriefStatus[];
const TABS: { key: "all" | DesignBriefStatus; label: string }[] = [{ key: "all", label: "All" }, ...STATUSES.map((key) => ({ key, label: DESIGN_BRIEF_STATUS_LABELS[key] }))];
const MAX_IMAGES = 10;
const MAX_PARTS = 20;
const secondaryButton = "min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50";

// ---------------------------------------------------------------- list

/** Designs the team drew up to be built or made, and where each one stands with the makers it was sent to. */
export function DesignBriefsListPage() {
  const { token, isAuthReady } = useAuth();
  const canView = useIsAdministrator();
  const [tab, setTab] = useState<"all" | DesignBriefStatus>("all");
  const [briefs, setBriefs] = useState<DesignBrief[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !token || !canView) return;
    let cancelled = false;
    DesignBriefsApi.list(token, tab).then((result) => {
      if (cancelled) return;
      if (result.ok) setBriefs(result.data);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, canView, tab]);

  return (
    <PageFrame title="Design briefs" action={<PrimaryLink href="/admin/design-briefs/new">New design brief</PrimaryLink>}>
      <RequirePermission granted={canView}>
        <div role="tablist" aria-label="Brief status" className="mb-5 flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setBriefs(null);
                  setTab(item.key);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{error}</Card>
        ) : briefs === null ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading briefs…</p>
        ) : briefs.length === 0 ? (
          <EmptyState title="No design briefs here" description="Create one, draft it with AI, and send it to makers to price." action={<PrimaryLink href="/admin/design-briefs/new">New design brief</PrimaryLink>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {briefs.map((brief) => (
              <Link key={brief.id} href={`/admin/design-briefs/${brief.id}`} className="block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-[#2ec440]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {brief.images[0] ? <img src={brief.images[0]} alt="" className="h-40 w-full object-cover" /> : <div className="h-40 w-full bg-slate-100" />}
                <div className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{DESIGN_CATEGORY_LABELS[brief.category]}</span>
                    <StatusPill status={DESIGN_BRIEF_STATUS_LABELS[brief.status]} />
                  </div>
                  <h3 className="truncate font-black text-slate-900">{brief.title}</h3>
                  <p className="text-xs text-slate-500">
                    {brief.parts.length} {brief.parts.length === 1 ? "part" : "parts"} · {brief.recipients?.length ?? 0} sent to · {brief.replies?.length ?? 0} {brief.replies?.length === 1 ? "price" : "prices"} in
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}

// ---------------------------------------------------------------- editor

const EMPTY: DesignBriefInput = { title: "", description: "", category: "interior", spaceType: "", images: [], parts: [], instructions: "" };

function toInput(brief: DesignBrief): DesignBriefInput {
  return { title: brief.title, description: brief.description, category: brief.category, spaceType: brief.spaceType ?? "", images: brief.images, parts: brief.parts, instructions: brief.instructions };
}

/** Writing a design brief, drafting it with AI, sending it to makers, and choosing among their prices. `id` is "new" for a new one. */
export function DesignBriefEditPage({ id }: { id: string }) {
  const router = useRouter();
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const canView = useIsAdministrator();
  const isNew = id === "new";
  const [brief, setBrief] = useState<DesignBrief | null>(null);
  const [form, setForm] = useState<DesignBriefInput>(EMPTY);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiText, setAiText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew || !isAuthReady || !token || !canView) return;
    let cancelled = false;
    DesignBriefsApi.get(token, id).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setBrief(result.data);
        setForm(toInput(result.data));
      } else setLoadError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isNew, isAuthReady, token, canView]);

  const patch = (changes: Partial<DesignBriefInput>) => setForm((current) => ({ ...current, ...changes }));
  const editable = isNew || brief?.status === "draft";

  const draftWithAi = async () => {
    if (drafting) return;
    setDrafting(true);
    setError("");
    const result = await requestDesignDraft({ brief: aiText, category: form.category, spaceType: form.spaceType || undefined });
    setDrafting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const draft = result.data;
    patch({ title: draft.title, description: draft.description, spaceType: draft.spaceType ?? form.spaceType, parts: draft.parts, instructions: draft.instructions });
    showToast(draft.source === "ai" ? "Drafted with AI. Check it, then save." : "Drafted from your words. Check it, then save.");
  };

  const addImages = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || !token) return;
    setUploading(true);
    try {
      const room = MAX_IMAGES - form.images.length;
      const { urls, failedCount } = await filesToUploadedUrls(Array.from(files).slice(0, room), token);
      if (urls.length) patch({ images: [...form.images, ...urls] });
      if (failedCount) setError("Some pictures could not be uploaded.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const save = async () => {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    const input: DesignBriefInput = { ...form, parts: form.parts.filter((p) => p.name.trim()).map((p) => ({ ...p, name: p.name.trim() })), spaceType: form.spaceType || undefined };
    const result = isNew ? await DesignBriefsApi.create(token, input) : await DesignBriefsApi.update(token, id, input);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast("Saved.");
    if (isNew) router.replace(`/admin/design-briefs/${result.data.id}`);
    else {
      setBrief(result.data);
      setForm(toInput(result.data));
    }
  };

  const remove = async () => {
    if (!token || !brief || busy) return;
    if (!window.confirm("Delete this draft?")) return;
    setBusy(true);
    const result = await DesignBriefsApi.remove(token, brief.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/admin/design-briefs");
  };

  const changed = brief ? JSON.stringify(toInput(brief)) !== JSON.stringify(form) : false;

  return (
    <PageFrame title={isNew ? "New design brief" : brief?.title || "Design brief"} action={<Link href="/admin/design-briefs" className={`${secondaryButton} inline-flex items-center`}>All briefs</Link>}>
      <RequirePermission granted={canView}>
        {loadError ? (
          <Card className="border-red-100 bg-red-50/60 text-sm text-red-700">{loadError}</Card>
        ) : !isNew && !brief ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-400">Loading…</p>
        ) : (
          <div className="space-y-6">
            {brief && <StatusPill status={DESIGN_BRIEF_STATUS_LABELS[brief.status]} />}

            {editable && (
              <Card>
                <h3 className="font-black text-slate-900">Draft with AI</h3>
                <label className="mt-3 block text-sm font-bold text-slate-700">
                  Describe the design
                  <textarea className={`${fieldClass} mt-1 min-h-24 resize-y font-normal`} placeholder="e.g. Modern sitting room: engraved 3D feature wall, built-in TV unit with side shelves, bold central paint, ambient ceiling lighting" value={aiText} maxLength={2000} onChange={(e) => setAiText(e.target.value)} />
                </label>
                <div className="mt-3">
                  <PrimaryButton type="button" disabled={drafting || aiText.trim().length < 5} onClick={draftWithAi}>
                    {drafting ? "Drafting…" : "Draft with AI"}
                  </PrimaryButton>
                </div>
              </Card>
            )}

            <Card>
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">
                  Title
                  <input className={`${fieldClass} mt-1`} value={form.title} maxLength={160} disabled={!editable} onChange={(e) => patch({ title: e.target.value })} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Type
                    <Select className={`${fieldClass} mt-1`} value={form.category} disabled={!editable} onChange={(e) => { const category = e.target.value as DesignCategory; patch({ category, spaceType: spacesFor(category).includes(form.spaceType ?? "") ? form.spaceType : "" }); }}>
                      {(Object.keys(DESIGN_CATEGORY_LABELS) as DesignCategory[]).map((c) => (
                        <option key={c} value={c}>
                          {DESIGN_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="block text-sm font-bold text-slate-700">
                    Space
                    <SpaceSelect className={`${fieldClass} mt-1`} category={form.category} value={form.spaceType ?? ""} onChange={(spaceType) => patch({ spaceType })} />
                  </label>
                </div>
                <label className="block text-sm font-bold text-slate-700">
                  Description
                  <textarea className={`${fieldClass} mt-1 min-h-28 resize-y font-normal`} value={form.description} maxLength={4000} disabled={!editable} onChange={(e) => patch({ description: e.target.value })} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Instructions for the makers
                  <textarea className={`${fieldClass} mt-1 min-h-20 resize-y font-normal`} value={form.instructions} maxLength={4000} disabled={!editable} onChange={(e) => patch({ instructions: e.target.value })} />
                </label>

                <ImageDropArea onFiles={(files) => void addImages(files)} disabled={!editable || uploading}>
                  <p className="text-sm font-bold text-slate-700">
                    Pictures <span className="font-normal text-slate-400">({form.images.length}/{MAX_IMAGES})</span>
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {form.images.map((url, index) => (
                      <div key={url} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                        {editable && (
                          <button type="button" aria-label="Remove picture" onClick={() => patch({ images: form.images.filter((_, i) => i !== index) })} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white hover:bg-red-600">
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {editable && form.images.length < MAX_IMAGES && (
                      <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-[#2ec440] hover:text-[#219b31] disabled:opacity-50">
                        {uploading ? "Uploading…" : "+ Add"}
                      </button>
                    )}
                  </div>
                  <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
                </ImageDropArea>

                <PartsEditor parts={form.parts} editable={editable} onChange={(parts) => patch({ parts })} />
              </div>

              {error && <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
              {editable && (
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  {brief && (
                    <button type="button" disabled={busy} onClick={remove} className="min-h-11 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
                      Delete draft
                    </button>
                  )}
                  <PrimaryButton type="button" disabled={busy || !form.title.trim() || (!isNew && !changed)} onClick={save}>
                    {busy ? "Saving…" : isNew ? "Create brief" : "Save"}
                  </PrimaryButton>
                </div>
              )}
            </Card>

            {brief && brief.status !== "closed" && !changed && <SendPanel brief={brief} onSent={setBrief} />}
            {brief && brief.status !== "draft" && <AnswersPanel brief={brief} onChange={setBrief} />}
          </div>
        )}
      </RequirePermission>
    </PageFrame>
  );
}

function PartsEditor({ parts, editable, onChange }: { parts: BriefPart[]; editable: boolean; onChange: (parts: BriefPart[]) => void }) {
  const set = (index: number, changes: Partial<BriefPart>) => onChange(parts.map((p, i) => (i === index ? { ...p, ...changes } : p)));
  return (
    <div>
      <p className="text-sm font-bold text-slate-700">
        Parts to price <span className="font-normal text-slate-400">({parts.length}/{MAX_PARTS})</span>
      </p>
      <div className="mt-2 space-y-3">
        {parts.map((part, index) => (
          <div key={part.id ?? index} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_10rem_auto]">
            <input className={`${fieldClass} col-span-2 sm:col-span-1`} placeholder="Part, e.g. Engraved feature wall" aria-label={`Part ${index + 1} name`} maxLength={120} value={part.name} disabled={!editable} onChange={(e) => set(index, { name: e.target.value })} />
            <Select className={fieldClass} aria-label={`Part ${index + 1} kind`} value={part.kind} disabled={!editable} onChange={(e) => set(index, { kind: e.target.value as DesignPartKind })}>
              {(Object.keys(DESIGN_PART_KIND_LABELS) as DesignPartKind[]).map((k) => (
                <option key={k} value={k}>
                  {DESIGN_PART_KIND_LABELS[k]}
                </option>
              ))}
            </Select>
            {editable && (
              <button type="button" aria-label={`Remove part ${index + 1}`} onClick={() => onChange(parts.filter((_, i) => i !== index))} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600">
                ×
              </button>
            )}
            <input className={`${fieldClass} col-span-2 sm:col-span-3`} placeholder="Short description (optional)" aria-label={`Part ${index + 1} description`} maxLength={300} value={part.description ?? ""} disabled={!editable} onChange={(e) => set(index, { description: e.target.value })} />
          </div>
        ))}
      </div>
      {editable && parts.length < MAX_PARTS && (
        <button type="button" onClick={() => onChange([...parts, { name: "", kind: "other", description: "" }])} className="mt-2 text-sm font-bold text-[#219b31] hover:underline">
          + Add part
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- sending

function SendPanel({ brief, onSent }: { brief: DesignBrief; onSent: (brief: DesignBrief) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<AdminUser[] | null>(null);
  const [professionals, setProfessionals] = useState<AdminUser[] | null>(null);
  const [pickedSuppliers, setPickedSuppliers] = useState<string[]>([]);
  const [pickedProfessionals, setPickedProfessionals] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    AdminApi.listUsers(token, { role: "supplier", status: "active", limit: 100 }).then((r) => !cancelled && setSuppliers(r.ok ? r.data.users : []));
    AdminApi.listUsers(token, { role: "professional", status: "active", limit: 100 }).then((r) => !cancelled && setProfessionals(r.ok ? r.data.users : []));
    return () => {
      cancelled = true;
    };
  }, [token]);

  const already = new Set((brief.recipients ?? []).map((r) => r.accountId));
  const toggle = (list: string[], set: (next: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const picked = pickedSuppliers.length + pickedProfessionals.length;

  const send = async () => {
    if (!token || busy || picked === 0) return;
    setBusy(true);
    setError("");
    const result = await DesignBriefsApi.send(token, brief.id, { supplierIds: pickedSuppliers, professionalIds: pickedProfessionals });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    showToast(`Sent to ${result.data.added} ${result.data.added === 1 ? "account" : "accounts"}.`);
    setPickedSuppliers([]);
    setPickedProfessionals([]);
    onSent(result.data.brief);
  };

  const group = (title: string, accounts: AdminUser[] | null, list: string[], set: (next: string[]) => void) => {
    const open = (accounts ?? []).filter((a) => !already.has(a.id));
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">{title}</p>
          {open.length > 0 && (
            <button type="button" onClick={() => set(list.length === open.length ? [] : open.map((a) => a.id))} className="text-xs font-bold text-[#219b31] hover:underline">
              {list.length === open.length ? "Clear" : "Select all"}
            </button>
          )}
        </div>
        {accounts === null ? (
          <p className="mt-2 text-sm text-slate-400">Loading…</p>
        ) : accounts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">None yet.</p>
        ) : (
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {accounts.map((a) => (
              <li key={a.id}>
                <label className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${already.has(a.id) ? "text-slate-400" : "cursor-pointer hover:bg-slate-50"}`}>
                  <input type="checkbox" className="accent-[#2ec440]" disabled={already.has(a.id)} checked={already.has(a.id) || list.includes(a.id)} onChange={() => toggle(list, set, a.id)} />
                  <span className="min-w-0 flex-1 truncate font-semibold">{a.name}</span>
                  <span className="truncate text-xs text-slate-400">{already.has(a.id) ? "Already sent" : a.email}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <Card>
      <h3 className="font-black text-slate-900">Send to makers</h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {group("Furniture makers and manufacturers (suppliers)", suppliers, pickedSuppliers, setPickedSuppliers)}
        {group("Builders (professionals)", professionals, pickedProfessionals, setPickedProfessionals)}
      </div>
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="mt-4 flex justify-end">
        <PrimaryButton type="button" disabled={busy || picked === 0} onClick={send}>
          {busy ? "Sending…" : picked ? `Send to ${picked} ${picked === 1 ? "account" : "accounts"}` : "Choose who to send to"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- answers

function AnswersPanel({ brief, onChange }: { brief: DesignBrief; onChange: (brief: DesignBrief) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const replies = brief.replies ?? [];
  const waiting = (brief.recipients ?? []).filter((r) => !replies.some((x) => x.accountId === r.accountId));

  const accept = async (replyId: string) => {
    if (!token || busy) return;
    if (!window.confirm("Accept this price? The others will be told it went elsewhere.")) return;
    setBusy(true);
    setError("");
    const result = await DesignBriefsApi.accept(token, brief.id, replyId);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    showToast("Price accepted.");
    onChange(result.data);
  };

  const close = async () => {
    if (!token || busy) return;
    if (!window.confirm("Close this brief without picking anyone?")) return;
    setBusy(true);
    setError("");
    const result = await DesignBriefsApi.close(token, brief.id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    onChange(result.data);
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-black text-slate-900">
          Prices <span className="font-normal text-slate-400">({replies.length} of {brief.recipients?.length ?? 0} answered)</span>
        </h3>
        {brief.status === "sent" && (
          <button type="button" disabled={busy} onClick={close} className={secondaryButton}>
            Close brief
          </button>
        )}
      </div>
      {replies.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No prices yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {replies
            .slice()
            .sort((a, b) => a.price - b.price)
            .map((reply) => {
              const won = brief.acceptedReplyId === reply.id;
              return (
                <li key={reply.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">
                      {reply.name} <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{reply.kind === "supplier" ? "Supplier" : "Builder"}</span>
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatMoney(reply.price, reply.currency)}
                      {reply.leadTimeDays !== undefined ? ` · ${reply.leadTimeDays} days` : ""} · {formatDateTime(reply.createdAt)}
                    </p>
                    {reply.note && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{reply.note}</p>}
                  </div>
                  {won ? <StatusPill status="Accepted" /> : brief.status === "sent" ? <PrimaryButton type="button" disabled={busy} onClick={() => accept(reply.id)}>Accept</PrimaryButton> : null}
                </li>
              );
            })}
        </ul>
      )}
      {waiting.length > 0 && <p className="mt-3 text-xs text-slate-400">Waiting on: {waiting.map((w) => w.name).join(", ")}</p>}
      {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
    </Card>
  );
}
