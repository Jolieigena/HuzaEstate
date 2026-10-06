"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { useToast } from "@/lib/toast-context";
import { SOCIAL_STATUS_LABELS, SocialApi, type SocialPostList, type SocialPostStatus, type SocialSettingsResponse } from "@/lib/social/api";
import Select from "@/components/shared/Select";
import { AdminTable, Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, fieldClass, formatDateTime } from "../ui";

const STATUS_STYLE: Record<SocialPostStatus, string> = {
  posted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-sky-50 text-sky-700 border-sky-100",
  dry_run: "bg-violet-50 text-violet-700 border-violet-100",
  skipped: "bg-slate-100 text-slate-500 border-slate-200",
  failed: "bg-red-50 text-red-700 border-red-100",
  withdrawn: "bg-amber-50 text-amber-700 border-amber-100",
};

const PAGE_SIZE = 15;

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#2ec440]" : "bg-slate-300"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/** Controls for posting approved listings to the HuzaEstate X account, and the list of what was posted.
 *  Starts in rehearsal mode: posts are composed and logged but not sent until X is connected and an
 *  administrator switches to live. */
export function SocialPostsPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const isAdmin = useIsAdministrator();

  const [config, setConfig] = useState<SocialSettingsResponse | null>(null);
  const [configError, setConfigError] = useState("");
  const [hashtagText, setHashtagText] = useState("");
  const [countryText, setCountryText] = useState("");
  const [limitText, setLimitText] = useState("");
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<SocialPostStatus | "">("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [list, setList] = useState<{ key: string; data?: SocialPostList; error?: string } | null>(null);

  const applyConfig = (data: SocialSettingsResponse) => {
    setConfig(data);
    setHashtagText(data.settings.hashtags.join(" "));
    setCountryText(data.settings.countries.join(", "));
    setLimitText(String(data.settings.dailyLimit));
  };

  useEffect(() => {
    if (!isAuthReady || !token || !isAdmin) return;
    let cancelled = false;
    SocialApi.getSettings(token).then((result) => {
      if (cancelled) return;
      if (result.ok) applyConfig(result.data);
      else setConfigError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdmin]);

  const key = `${status}|${page}|${reload}`;
  useEffect(() => {
    if (!isAuthReady || !token || !isAdmin) return;
    let cancelled = false;
    SocialApi.listPosts(token, { status, page, limit: PAGE_SIZE }).then((result) => {
      if (!cancelled) setList(result.ok ? { key, data: result.data } : { key, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdmin, status, page, key]);

  const save = async (changes: Parameters<typeof SocialApi.updateSettings>[1], message = "Saved.") => {
    if (!token) return;
    setSaving(true);
    const result = await SocialApi.updateSettings(token, changes);
    setSaving(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    applyConfig(result.data);
    showToast(message);
  };

  const saveDetails = () =>
    save({
      dailyLimit: Number(limitText),
      hashtags: hashtagText.split(/[\s,]+/).filter(Boolean),
      countries: countryText.split(",").map((c) => c.trim()).filter(Boolean),
    });

  const act = async (id: string, action: "retry" | "skip") => {
    if (!token) return;
    const result = await SocialApi[action](token, id);
    if (!result.ok) showToast(result.error, "error");
    else {
      showToast(action === "retry" ? "Back in the queue." : "Skipped.");
      setReload((n) => n + 1);
    }
  };

  const settings = config?.settings;
  const data = list?.data;
  const loading = list?.key !== key;
  const total = data?.total ?? 0;
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <RequirePermission granted={isAdmin}>
      <PageFrame title="Social posts" description="Approved listings are posted to the HuzaEstate X account a couple of minutes after they go live, within a daily limit. A listing is only ever posted once, and its post is deleted if the listing is taken down.">
        {configError && <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{configError}</p>}

        {settings && config && (
          <Card className="mb-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-bold text-slate-900">Automatic posting</p>
                    <p className="mt-1 text-sm text-slate-500">{settings.enabled ? "On: newly approved listings are queued." : "Off: nothing is queued."}</p>
                  </div>
                  <Switch checked={settings.enabled} label="Automatic posting" onChange={(enabled) => save({ enabled }, enabled ? "Posting is on." : "Posting is off.")} />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-bold text-slate-900">Send for real</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {settings.mode === "live" ? "Live: posts are sent to X." : "Rehearsal: posts are written and logged below but not sent."}
                      {!config.credentialsConfigured && " The X keys are not on the server yet."}
                    </p>
                  </div>
                  <Switch
                    checked={settings.mode === "live"}
                    label="Send posts to X"
                    onChange={(live) => save({ mode: live ? "live" : "dry_run" }, live ? "Posts will now be sent to X." : "Back to rehearsal.")}
                  />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-bold text-slate-900">Delete the post when a listing is taken down</p>
                    <p className="mt-1 text-sm text-slate-500">Applies to unpublished, rejected and deleted listings.</p>
                  </div>
                  <Switch checked={settings.deleteOnTakedown} label="Delete post on takedown" onChange={(deleteOnTakedown) => save({ deleteOnTakedown })} />
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-bold text-slate-900">Add place hashtags</p>
                    <p className="mt-1 text-sm text-slate-500">For example #RwandaRealEstate and #Kigali.</p>
                  </div>
                  <Switch checked={settings.placeHashtags} label="Place hashtags" onChange={(placeHashtags) => save({ placeHashtags })} />
                </div>
              </div>

              <div className="space-y-5">
                <label className="block text-sm font-bold text-slate-700">
                  Posts per day, at most
                  <input className={`${fieldClass} mt-1`} inputMode="numeric" value={limitText} onChange={(e) => setLimitText(e.target.value.replace(/\D/g, ""))} />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Hashtags on every post
                  <input className={`${fieldClass} mt-1`} value={hashtagText} onChange={(e) => setHashtagText(e.target.value)} placeholder="#HuzaEstate" />
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  Only these countries
                  <input className={`${fieldClass} mt-1`} value={countryText} onChange={(e) => setCountryText(e.target.value)} placeholder="Every country" />
                  <span className="mt-1 block text-xs font-normal text-slate-500">Separate with commas. Leave empty to post listings from every country.</span>
                </label>
                <PrimaryButton type="button" disabled={saving} onClick={saveDetails}>
                  {saving ? "Saving..." : "Save"}
                </PrimaryButton>
              </div>
            </div>
          </Card>
        )}

        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
            {data &&
              (Object.keys(SOCIAL_STATUS_LABELS) as SocialPostStatus[]).map((s) => (
                <span key={s} className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  {SOCIAL_STATUS_LABELS[s]} {data.summary[s] ?? 0}
                </span>
              ))}
          </div>
          <label className="text-sm font-bold text-slate-700">
            <span className="sr-only">Status</span>
            <Select
              className={`${fieldClass} min-w-44`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as SocialPostStatus | "");
                setPage(1);
              }}
            >
              <option value="">Any status</option>
              {(Object.keys(SOCIAL_STATUS_LABELS) as SocialPostStatus[]).map((s) => (
                <option key={s} value={s}>
                  {SOCIAL_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {list?.error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{list.error}</p>
        ) : !loading && data && data.posts.length === 0 ? (
          <EmptyState title="No posts yet" description={status ? "Nothing has this status." : "Once posting is on, approved listings show up here."} />
        ) : (
          <AdminTable headers={["Listing", "Status", "When", "Post", ""]}>
            {(data?.posts ?? []).map((post) => (
              <tr key={post.id} className="align-top transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <Link href={`/properties/${post.propertyId}`} className="font-bold text-slate-900 hover:underline">
                    {post.title || "Listing"}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[post.status]}`}>{SOCIAL_STATUS_LABELS[post.status]}</span>
                  {post.lastError && <p className="mt-2 max-w-xs whitespace-normal text-xs text-slate-500">{post.lastError}</p>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {post.postedAt ? formatDateTime(post.postedAt) : post.nextAttemptAt ? `Due ${formatDateTime(post.nextAttemptAt)}` : formatDateTime(post.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {post.text ? <p className="max-w-md whitespace-pre-line text-xs leading-relaxed">{post.text}</p> : <span className="text-slate-400">Not written yet</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {post.status !== "posted" && post.status !== "pending" && (
                      <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" onClick={() => act(post.id, "retry")}>
                        Queue again
                      </SecondaryButton>
                    )}
                    {(post.status === "pending" || post.status === "failed") && (
                      <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" onClick={() => act(post.id, "skip")}>
                        Skip
                      </SecondaryButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}

        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Page {page} of {lastPage}
            </span>
            <div className="flex gap-2">
              <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </SecondaryButton>
              <SecondaryButton type="button" className="min-h-10 px-4 py-2 text-sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
                Next
              </SecondaryButton>
            </div>
          </div>
        )}
      </PageFrame>
    </RequirePermission>
  );
}
