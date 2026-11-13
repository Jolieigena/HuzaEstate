"use client";

import { useEffect, useRef, useState } from "react";
import SidePane from "@/components/shared/SidePane";
import { ATTACH_ACCEPT, Attachment, MAX_ATTACHED_BYTES, MAX_ATTACHMENTS, attachedSize, readAttachment } from "@/lib/ai/attachments";

type Message = { role: "user" | "assistant"; text: string; error?: boolean; files?: string[] };

const MAX_MESSAGES = 100;

function load(key: string): Message[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(key: string, messages: Message[]) {
  try {
    if (messages.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    /* the conversation just isn't remembered */
  }
}

/**
 * "Edit design" as a chat in a pane on the right: the design stays in view while the person says what to change, and the whole
 * conversation stays above the box, like any assistant. It is kept per design (`storageKey`), so closing the pane does not lose it,
 * and "New chat" starts it again. `onSubmit` makes the change and returns an error to show, or nothing when it worked.
 */
export default function EditPanel({
  open,
  onClose,
  title = "Edit design",
  storageKey,
  suggestions,
  placeholder,
  submitLabel = "Send",
  workingLabel = "Changing your design…",
  doneText = "Done. Your design was changed and saved as a new version.",
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  storageKey: string;
  suggestions: string[];
  placeholder: string;
  submitLabel?: string;
  workingLabel?: string;
  doneText?: string;
  onSubmit: (request: string, attachments: Attachment[]) => Promise<string | null>;
}) {
  const key = `huza-edit-chat:${storageKey}`;
  const [request, setRequest] = useState("");
  const [working, setWorking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attached, setAttached] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setMessages(load(key));
  }, [open, key]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, working, open]);

  if (!open) return null;

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setAttachError("");
    let next = [...attached];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_ATTACHMENTS) {
        setAttachError(`You can attach up to ${MAX_ATTACHMENTS} files at a time.`);
        break;
      }
      const result = await readAttachment(file);
      if (!result.ok) {
        setAttachError(result.error);
        continue;
      }
      if (attachedSize([...next, result.attachment]) > MAX_ATTACHED_BYTES) {
        setAttachError("These files are too large together. Remove one or attach a smaller file.");
        continue;
      }
      next = [...next, result.attachment];
    }
    setAttached(next);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    const text = request.trim() || (attached.length > 0 ? "Use the attached files as a guide." : "");
    if (!text || working) return;
    const sent = attached;
    const asked: Message[] = [...messages, { role: "user", text: request.trim(), files: sent.map((a) => a.name) }];
    setMessages(asked);
    save(key, asked);
    setRequest("");
    setAttached([]);
    setAttachError("");
    setWorking(true);
    const problem = await onSubmit(text, sent);
    setWorking(false);
    const next: Message[] = [...asked, problem ? { role: "assistant", text: problem, error: true } : { role: "assistant", text: doneText }];
    setMessages(next);
    save(key, next);
  };

  const newChat = () => {
    if (working) return;
    setMessages([]);
    setRequest("");
    setAttached([]);
    setAttachError("");
    save(key, []);
  };

  return (
    <SidePane
      open={open}
      onClose={onClose}
      title={title}
      bare
      actions={
        messages.length > 0 ? (
          <button type="button" onClick={newChat} disabled={working} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50">
            New chat
          </button>
        ) : null
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !working ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => setRequest(s)} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100">
                {s}
              </button>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m, index) => (
              <li key={index} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user" ? "rounded-br-md bg-slate-900 text-white" : m.error ? "rounded-bl-md border border-red-100 bg-red-50 font-semibold text-red-700" : "rounded-bl-md bg-slate-100 text-slate-700"
                  }`}
                >
                  {m.files && m.files.length > 0 && (
                    <span className={`flex flex-wrap gap-1.5 ${m.text ? "mb-1.5" : ""}`}>
                      {m.files.map((name, i) => (
                        <span key={i} className="inline-flex max-w-full items-center rounded-lg bg-white/15 px-2 py-0.5 text-xs font-semibold">
                          <span className="truncate">{name}</span>
                        </span>
                      ))}
                    </span>
                  )}
                  {m.text}
                </p>
              </li>
            ))}
            {working && (
              <li className="flex justify-start">
                <p className="animate-pulse rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-500">{workingLabel}</p>
              </li>
            )}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-slate-100 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {attached.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {attached.map((a, i) => (
              <li key={`${a.name}-${i}`} className="flex max-w-full items-center gap-2 rounded-lg bg-slate-100 py-1 pl-1 pr-2 text-xs font-semibold text-slate-700">
                {a.dataUrl?.startsWith("data:image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.dataUrl} alt="" className="h-7 w-7 rounded object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-white text-[10px] font-black text-slate-500">{a.dataUrl ? "PDF" : "TXT"}</span>
                )}
                <span className="max-w-[9rem] truncate">{a.name}</span>
                <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAttached((list) => list.filter((_, n) => n !== i))} className="text-slate-400 hover:text-slate-900">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {attachError && <p className="mb-2 text-xs font-semibold text-red-600">{attachError}</p>}
        <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" multiple accept={ATTACH_ACCEPT} className="hidden" onChange={(e) => void addFiles(e.target.files)} />
        <button
          type="button"
          aria-label="Attach a picture or a document"
          title="Attach a picture or a document"
          disabled={working || attached.length >= MAX_ATTACHMENTS}
          onClick={() => fileRef.current?.click()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.4 11.1l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.7 5.7l-9.2 9.2a2 2 0 01-2.8-2.8l8.5-8.5" />
          </svg>
        </button>
        <textarea
          id="edit-panel-request"
          aria-label="Your message"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={working}
          rows={2}
          placeholder={placeholder}
          className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-[#2ec440] focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 disabled:bg-slate-50"
        />
        <button type="submit" disabled={(!request.trim() && attached.length === 0) || working} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#2ec440] disabled:opacity-50">
          {submitLabel}
        </button>
        </div>
      </form>
    </SidePane>
  );
}
