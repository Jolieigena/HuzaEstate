"use client";

import { useState } from "react";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { useAuth } from "@/lib/auth-context";
import { useAdminState, useHasPermission } from "@/lib/admin/hooks";
import { AdminService } from "@/lib/admin/service";
import type { ContentArea, ContentItem, ContentStatus } from "@/lib/admin/types";
import { useToast } from "@/lib/toast-context";
import { Card, EmptyState, PageFrame, PrimaryButton, RequirePermission, SecondaryButton, StatusPill, fieldClass, formatDateTime } from "../ui";

function useActor() {
  const { account } = useAuth();
  return { actorAccountId: account?.id ?? "system", actorName: account?.name ?? "System" };
}

const AREA_LABELS: Record<ContentArea, string> = {
  build_faq: "Build FAQ", renovate_faq: "Renovate FAQ", build_process: "Build process step", renovate_process: "Renovate process step",
  demo_video: "Demo video metadata", build_example: "Build example", renovate_example: "Renovate example",
  professional_portal_info: "Professional portal information", public_disclaimer: "Public disclaimer", announcement: "Announcement",
};

function ContentEditor({ item, onDone }: { item: ContentItem | null; onDone: () => void }) {
  const { actorAccountId, actorName } = useActor();
  const { showToast } = useToast();
  const [area, setArea] = useState<ContentArea>(item?.area ?? "announcement");
  const [title, setTitle] = useState(item?.title ?? "");
  const [slug, setSlug] = useState(item?.slug ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [order, setOrder] = useState(item?.order ?? 1);
  const [publishAt, setPublishAt] = useState(item?.publishAt?.slice(0, 10) ?? "");
  const [expiryAt, setExpiryAt] = useState(item?.expiryAt?.slice(0, 10) ?? "");
  const [preview, setPreview] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const save = () => {
    if (!title.trim() || !slug.trim()) {
      showToast("Title and slug are required.", "error");
      return;
    }
    AdminService.saveContent({ id: item?.id, area, title: title.trim(), slug: slug.trim(), content, order, publishAt: publishAt ? new Date(publishAt).toISOString() : undefined, expiryAt: expiryAt ? new Date(expiryAt).toISOString() : undefined }, actorAccountId, actorName);
    showToast("Draft saved.");
  };

  return (
    <PageFrame title={item ? "Edit content" : "New content item"} description="Public page layouts do not change — only the text and publication state." action={<SecondaryButton onClick={onDone}>Back to Content</SecondaryButton>}>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">
              Area
              <select className={`${fieldClass} mt-2`} value={area} onChange={(e) => setArea(e.target.value as ContentArea)}>
                {Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">
              Display order
              <input type="number" className={`${fieldClass} mt-2`} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
              Title
              <input className={`${fieldClass} mt-2`} value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="text-sm font-bold text-slate-700 sm:col-span-2">
              Slug or identifier
              <input className={`${fieldClass} mt-2`} value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Publish date (optional)
              <input type="date" className={`${fieldClass} mt-2`} value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
            </label>
            <label className="text-sm font-bold text-slate-700">
              Expiry date (optional)
              <input type="date" className={`${fieldClass} mt-2`} value={expiryAt} onChange={(e) => setExpiryAt(e.target.value)} />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">Content</label>
            <button type="button" onClick={() => setPreview((v) => !v)} className="text-sm font-bold text-[#219b31]">{preview ? "Edit" : "Preview"}</button>
          </div>
          {preview ? (
            <div className="mt-2 min-h-40 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{content || "Nothing to preview yet."}</div>
          ) : (
            <textarea className={`${fieldClass} mt-2 min-h-40`} value={content} onChange={(e) => setContent(e.target.value)} />
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <PrimaryButton onClick={save}>Save draft</PrimaryButton>
            {item && item.status !== "published" && (
              <SecondaryButton
                onClick={() => {
                  save();
                  AdminService.setContentStatus(item.id, "published", actorAccountId, actorName);
                  showToast("Published.");
                }}
              >
                Publish
              </SecondaryButton>
            )}
            {item && item.status === "published" && (
              <SecondaryButton
                onClick={() => {
                  AdminService.setContentStatus(item.id, "draft", actorAccountId, actorName);
                  showToast("Unpublished.");
                }}
              >
                Unpublish
              </SecondaryButton>
            )}
            {item && item.status !== "archived" && (
              <SecondaryButton className="border-red-200 text-red-600 hover:border-red-300 hover:text-red-700" onClick={() => setArchiveOpen(true)}>
                Archive
              </SecondaryButton>
            )}
          </div>
        </Card>

        {item && item.versions.length > 1 && (
          <Card>
            <h3 className="text-lg font-black text-slate-900">Version history</h3>
            <div className="mt-4 divide-y divide-slate-100">
              {[...item.versions].reverse().map((version) => (
                <div key={version.version} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Version {version.version}</p>
                    <p className="text-xs text-slate-400">{version.savedBy} · {formatDateTime(version.savedAt)}</p>
                  </div>
                  <SecondaryButton
                    onClick={() => {
                      AdminService.restoreContentVersion(item.id, version.version, actorAccountId, actorName);
                      setContent(version.content);
                      showToast("Version restored.");
                    }}
                  >
                    Restore
                  </SecondaryButton>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {item && (
        <ConfirmModal
          open={archiveOpen}
          onClose={() => setArchiveOpen(false)}
          destructive
          title="Archive this content item?"
          description="Archived content is unpublished and hidden from the content list's default view."
          confirmLabel="Archive"
          onConfirm={() => {
            AdminService.setContentStatus(item.id, "archived", actorAccountId, actorName);
            setArchiveOpen(false);
            onDone();
          }}
        />
      )}
    </PageFrame>
  );
}

export function ContentPage() {
  const { account } = useAuth();
  useAdminState();
  const canManage = useHasPermission(account?.id, "content.manage");
  const [status, setStatus] = useState<"all" | ContentStatus>("all");
  const [editing, setEditing] = useState<ContentItem | "new" | null>(null);

  const items = AdminService.listContent().filter((item) => status === "all" || item.status === status);

  if (editing) {
    return <ContentEditor item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />;
  }

  return (
    <PageFrame
      title="Content"
      description="Public FAQs, process steps, examples and announcements. Layouts stay the same — only the text and publication state change here."
      action={canManage ? <PrimaryButton onClick={() => setEditing("new")}>New content item</PrimaryButton> : undefined}
    >
      <RequirePermission granted={canManage}>
        <Card className="mb-5 max-w-xs">
          <label className="text-sm font-bold text-slate-700">
            Status
            <select className={`${fieldClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </Card>

        {items.length ? (
          <div className="grid gap-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4 transition-shadow hover:shadow-md">
                <button type="button" onClick={() => setEditing(item)} className="grid w-full gap-2 text-left sm:grid-cols-[1.7fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <p className="font-black text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{AREA_LABELS[item.area]} · /{item.slug}</p>
                  </div>
                  <p className="text-xs text-slate-500">Updated {formatDateTime(item.updatedAt)}</p>
                  <p className="text-xs text-slate-500">{item.updatedBy}</p>
                  <StatusPill status={item.status} />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="No content items" description="Create the first item for this area." />
        )}
      </RequirePermission>
    </PageFrame>
  );
}
