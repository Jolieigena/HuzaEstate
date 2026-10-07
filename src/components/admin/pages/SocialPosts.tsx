"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useIsAdministrator } from "@/lib/admin/hooks";
import { useToast } from "@/lib/toast-context";
import { SOCIAL_STATUS_LABELS, SocialApi, type SocialChannel, type SocialPostList, type SocialPostStatus } from "@/lib/social/api";
import Select from "@/components/shared/Select";
import SocialPostDialog from "./SocialPostDialog";
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

function SwitchRow({ title, checked, onChange }: { title: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <p className="font-bold text-slate-900">{title}</p>
      <Switch checked={checked} label={title} onChange={onChange} />
    </div>
  );
}

/** Posting approved listings to social networks. One tab per network the server supports; each has its
 *  own switches, limits and list of posts, so a new network appears here without any change to the page. */
export function SocialPostsPage() {
  const { token, isAuthReady } = useAuth();
  const { showToast } = useToast();
  const isAdmin = useIsAdministrator();

  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [configError, setConfigError] = useState("");
  const [hashtagText, setHashtagText] = useState("");
  const [countryText, setCountryText] = useState("");
  const [limitText, setLimitText] = useState("");
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);

  const [status, setStatus] = useState<SocialPostStatus | "">("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [list, setList] = useState<{ key: string; data?: SocialPostList; error?: string } | null>(null);

  const channel = channels.find((c) => c.id === selectedId) ?? channels[0];

  const fillFields = (c: SocialChannel) => {
    setHashtagText(c.settings.hashtags.join(" "));
    setCountryText(c.settings.countries.join(", "));
    setLimitText(String(c.settings.dailyLimit));
  };

  useEffect(() => {
    if (!isAuthReady || !token || !isAdmin) return;
    let cancelled = false;
    SocialApi.listChannels(token).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setConfigError(result.error);
        return;
      }
      setChannels(result.data.channels);
      if (result.data.channels[0]) {
        setSelectedId(result.data.channels[0].id);
        fillFields(result.data.channels[0]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdmin]);

  const channelId = channel?.id ?? "";
  const key = `${channelId}|${status}|${page}|${reload}`;
  useEffect(() => {
    if (!isAuthReady || !token || !isAdmin || !channelId) return;
    let cancelled = false;
    SocialApi.listPosts(token, { channel: channelId, status, page, limit: PAGE_SIZE }).then((result) => {
      if (!cancelled) setList(result.ok ? { key, data: result.data } : { key, error: result.error });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, token, isAdmin, channelId, status, page, key]);

  const selectChannel = (c: SocialChannel) => {
    setSelectedId(c.id);
    fillFields(c);
    setStatus("");
    setPage(1);
  };

  const save = async (changes: Parameters<typeof SocialApi.updateChannel>[2], message = "Saved.") => {
    if (!token || !channel) return;
    setSaving(true);
    const result = await SocialApi.updateChannel(token, channel.id, changes);
    setSaving(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    const updated = result.data.channel;
    setChannels((current) => current.map((c) => (c.id === updated.id ? updated : c)));
    fillFields(updated);
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

  const settings = channel?.settings;
  const data = list?.data;
  const loading = list?.key !== key;
  const total = data?.total ?? 0;
  const lastPage = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <RequirePermission granted={isAdmin}>
      <PageFrame
        title="Social posts"
        action={
          channel && (
            <PrimaryButton type="button" onClick={() => setPicking(true)}>
              Post a listing
            </PrimaryButton>
          )
        }
      >
        {configError && <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{configError}</p>}

        {channels.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Social networks">
            {channels.map((c) => {
              const active = c.id === channel?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectChannel(c)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                >
                  <span className={`h-2 w-2 rounded-full ${c.settings.enabled ? "bg-[#2ec440]" : "bg-slate-300"}`} aria-hidden="true" />
                  {c.label}
                </button>
              );
            })}
          </div>
        )}

        {channel && settings && (
          <Card className="mb-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <SwitchRow title="Automatic posting" checked={settings.enabled} onChange={(enabled) => save({ enabled }, enabled ? "Posting is on." : "Posting is off.")} />
                <SwitchRow
                  title="Send for real"
                  checked={settings.mode === "live"}
                  onChange={(live) => save({ mode: live ? "live" : "dry_run" }, live ? "Posts will now be sent." : "Back to rehearsal.")}
                />
                {!channel.credentialsConfigured && <p className="text-sm font-semibold text-amber-700">{channel.label} keys are not set on the server.</p>}
                <SwitchRow title="Delete the post when a listing is taken down" checked={settings.deleteOnTakedown} onChange={(deleteOnTakedown) => save({ deleteOnTakedown })} />
                <SwitchRow title="Add place hashtags" checked={settings.placeHashtags} onChange={(placeHashtags) => save({ placeHashtags })} />
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
          <EmptyState title="No posts yet" />
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
        {channel && <SocialPostDialog channel={channel} open={picking} onClose={() => setPicking(false)} onQueued={() => setReload((n) => n + 1)} />}
      </PageFrame>
    </RequirePermission>
  );
}
