"use client";

import { useEffect, useId, useState } from "react";
import Dialog from "@/components/Dialog";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { SocialApi, type SocialChannel, type SocialPost } from "@/lib/social/api";
import { weightedLength } from "./SocialPostDialog";
import { PrimaryButton, SecondaryButton, fieldClass } from "../ui";

/** Change the text of a post. One that is not live yet just gets the new text. A live one cannot be changed on
 *  the network, so saving deletes it there and posts the new text in its place. */
export default function SocialEditDialog({ post, channel, onClose, onSaved }: { post: SocialPost | null; channel: SocialChannel; onClose: () => void; onSaved: () => void }) {
  return (
    <Dialog open={!!post} onClose={onClose} labelledBy="social-edit-title" panelClassName="max-w-2xl">
      {post && <EditForm key={post.id} post={post} channel={channel} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function EditForm({ post, channel, onClose, onSaved }: { post: SocialPost; channel: SocialChannel; onClose: () => void; onSaved: () => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const titleId = useId();
  const [text, setText] = useState(post.text ?? "");
  const [busy, setBusy] = useState(false);
  const live = post.status === "posted";

  // A post that has not been written yet starts from the text the system would write.
  useEffect(() => {
    if (post.text || !token) return;
    let cancelled = false;
    SocialApi.preview(token, channel.id, post.propertyId).then((result) => {
      if (!cancelled && result.ok) setText(result.data.text);
    });
    return () => {
      cancelled = true;
    };
  }, [post.text, post.propertyId, token, channel.id]);

  const tooLong = weightedLength(text) > channel.postLimit;
  const canReplace = channel.settings.mode === "live" && channel.credentialsConfigured;

  const save = async () => {
    if (!token || !text.trim() || tooLong || busy) return;
    setBusy(true);
    const result = await SocialApi.update(token, post.id, text.trim());
    setBusy(false);
    if (!result.ok) {
      showToast(result.error, "error");
      return;
    }
    showToast(live ? "Replacing the post." : "Saved.");
    onSaved();
    onClose();
  };

  return (
    <div className="p-6">
      <h2 id={titleId} className="mb-4 pr-6 text-lg font-semibold text-slate-900">
        Edit post
      </h2>
      <p className="mb-3 text-sm font-bold text-slate-900">{post.title}</p>
      <label className="block text-sm font-bold text-slate-700">
        Post text
        <textarea className={`${fieldClass} mt-1 min-h-40 resize-y font-normal`} value={text} onChange={(e) => setText(e.target.value)} />
        <span className={`mt-1 block text-right text-xs font-semibold ${tooLong ? "text-red-600" : "text-slate-400"}`}>
          {weightedLength(text)} / {channel.postLimit}
        </span>
      </label>
      {live && (
        <p className={`mt-3 rounded-xl border px-4 py-3 text-sm font-semibold ${canReplace ? "border-amber-100 bg-amber-50 text-amber-800" : "border-red-100 bg-red-50 text-red-700"}`}>
          {canReplace ? `${channel.label} cannot change a post that is live. Saving deletes it and posts this text instead.` : `Turn on Send for real first, so the new text can be posted after the old post is deleted.`}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="button" disabled={busy || !text.trim() || tooLong || (live && !canReplace)} onClick={save}>
          {busy ? "Saving..." : live ? "Replace post" : "Save"}
        </PrimaryButton>
      </div>
    </div>
  );
}
