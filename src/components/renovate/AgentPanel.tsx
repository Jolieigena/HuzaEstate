"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AgentAttachment, ExtractedRequirement, RenovationProject, RequirementFieldStatus } from "@/lib/renovate/types";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { RenovationAgentService, AgentCancelledError } from "@/lib/renovate/agentService";
import { formatDateTime, propertyLocationLabel } from "@/lib/renovate/format";
import { newId } from "@/lib/renovate/factory";
import { useToast } from "@/lib/toast-context";
import ConfirmModal from "@/components/shared/ConfirmModal";

const REQ_STATUS_STYLES: Record<RequirementFieldStatus, string> = {
  confirmed: "bg-[#2ec440]/10 text-[#2ec440]",
  suggested: "bg-amber-50 text-amber-700",
  missing: "bg-slate-100 text-slate-500",
  conflicting: "bg-red-50 text-red-600",
  requires_professional_review: "bg-purple-50 text-purple-700",
};

type MobileTab = "chat" | "brief" | "requirements";

function BriefSummaryPanel({ project }: { project: RenovationProject }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-sm">Brief summary</h3>
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Property</dt>
          <dd className="text-slate-800 font-semibold text-right">{propertyLocationLabel(project)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Areas</dt>
          <dd className="text-slate-800 font-semibold text-right">{project.assessment.areas.length || "None yet"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Style</dt>
          <dd className="text-slate-800 font-semibold">{project.assessment.style.primaryStyle ?? "Not set"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-slate-400">Target budget</dt>
          <dd className="text-slate-800 font-semibold">{project.assessment.budgetTimeline.targetBudget ? project.assessment.budgetTimeline.targetBudget.toLocaleString() + " RWF" : "Not set"}</dd>
        </div>
      </dl>
      <Link href={`/studio/renovate/${project.id}/assessment`} className="inline-block text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
        Edit full assessment
      </Link>
    </div>
  );
}

function RequirementsPanel({ project, onUpdate }: { project: RenovationProject; onUpdate: (reqs: ExtractedRequirement[]) => void }) {
  const reqs = project.agentConversation.extractedRequirements;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState("");

  const setStatus = (id: string, status: RequirementFieldStatus) => onUpdate(reqs.map((r) => (r.id === id ? { ...r, status } : r)));
  const remove = (id: string) => onUpdate(reqs.filter((r) => r.id !== id));

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-sm">Extracted requirements</h3>
      {reqs.length === 0 ? (
        <p className="text-sm text-slate-400">Send a message describing your renovation and Huza AI will list what it understood here.</p>
      ) : (
        <ul className="space-y-2.5">
          {reqs.map((r) => (
            <li key={r.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-500">{r.label}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${REQ_STATUS_STYLES[r.status]}`}>{r.status.replace(/_/g, " ")}</span>
              </div>
              {editingId === r.id ? (
                <div className="flex gap-1.5">
                  <input
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    className="flex-grow px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate(reqs.map((x) => (x.id === r.id ? { ...x, value: draftValue, status: "confirmed" } : x)));
                      setEditingId(null);
                    }}
                    className="text-xs font-bold text-[#2ec440]"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-800 font-semibold">{r.value}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {r.status !== "confirmed" && (
                  <button type="button" onClick={() => setStatus(r.id, "confirmed")} className="text-xs font-bold text-[#2ec440] hover:text-[#28b039]">
                    Accept
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(r.id);
                    setDraftValue(r.value);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Edit
                </button>
                <button type="button" onClick={() => remove(r.id)} className="text-xs font-bold text-red-500 hover:text-red-700">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AgentPanel({ project }: { project: RenovationProject }) {
  const { showToast } = useToast();
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<AgentAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const [agentError, setAgentError] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [clearOpen, setClearOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (!initialised.current && project.agentConversation.messages.length === 0) {
      initialised.current = true;
      RenovationProjectService.appendAgentMessages(project.id, [RenovationAgentService.welcomeMessage()]);
    }
  }, [project.id, project.agentConversation.messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [project.agentConversation.messages.length, sending]);

  const send = async (prompt: string) => {
    if ((!prompt.trim() && pendingAttachments.length === 0) || sending) return;
    setAgentError(false);
    setLastPrompt(prompt);
    setDraft("");
    const attachments = pendingAttachments;
    setPendingAttachments([]);
    const userMessage = { id: newId("msg"), role: "user" as const, content: prompt, timestamp: new Date().toISOString(), attachments: attachments.length ? attachments : undefined };
    RenovationProjectService.appendAgentMessages(project.id, [userMessage]);

    const controller = new AbortController();
    abortRef.current = controller;
    setSending(true);
    try {
      const result = await RenovationAgentService.sendMessage(prompt, project.assessment, controller.signal);
      RenovationProjectService.appendAgentMessages(project.id, [result.message]);
      if (result.extracted.length) {
        const existing = project.agentConversation.extractedRequirements;
        const merged = [...existing.filter((e) => !result.extracted.some((n) => n.field === e.field)), ...result.extracted];
        RenovationProjectService.setExtractedRequirements(project.id, merged);
      }
    } catch (err) {
      if (err instanceof AgentCancelledError) {
        showToast("Stopped Huza AI's response.", "info");
      } else {
        setAgentError(true);
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();
  const regenerate = () => {
    if (!lastPrompt) return;
    send(lastPrompt);
  };

  const handleAttach = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const attachments: AgentAttachment[] = Array.from(fileList)
      .slice(0, 4)
      .map((file) => ({
        id: newId("att"),
        name: file.name,
        kind: /plan|sketch/i.test(file.name) ? "floor_plan" : "photo",
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      }));
    setPendingAttachments((prev) => [...prev, ...attachments]);
  };

  const suggestions = RenovationAgentService.suggestedPrompts();

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="lg:hidden flex border-b border-slate-100">
        {(["chat", "brief", "requirements"] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${mobileTab === tab ? "text-[#2ec440] border-b-2 border-[#2ec440]" : "text-slate-500"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[220px_1fr_260px]">
        <div className={`p-5 border-r border-slate-100 ${mobileTab === "brief" ? "block" : "hidden"} lg:block`}>
          <BriefSummaryPanel project={project} />
        </div>

        <div className={`flex flex-col ${mobileTab === "chat" ? "flex" : "hidden"} lg:flex`}>
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Huza AI</p>
            {project.agentConversation.messages.length > 0 && (
              <button type="button" onClick={() => setClearOpen(true)} className="text-xs font-bold text-slate-400 hover:text-red-600">
                Clear conversation
              </button>
            )}
          </div>
          <div ref={scrollRef} aria-live="polite" className="flex-grow overflow-y-auto max-h-[480px] min-h-[320px] p-5 space-y-4">
            {project.agentConversation.messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user" ? "bg-slate-900 text-white rounded-tr-md" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-md"
                  }`}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {message.attachments.map((a) => (
                        <span key={a.id} className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-white/10 text-inherit border border-white/20">
                          {a.kind === "floor_plan" ? "Floor plan" : a.kind === "inspiration" ? "Inspiration" : "Photo"}: {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p>{message.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-slate-400">{formatDateTime(message.timestamp)}</span>
                    {message.role === "agent" && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(message.content).catch(() => {});
                          showToast("Copied response.", "info");
                        }}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-700"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                </div>
              </div>
            )}
            {agentError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
                <span>Huza AI couldn&apos;t respond just now.</span>
                <button type="button" onClick={regenerate} className="font-bold hover:underline">
                  Retry
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={sending}
                  className="text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            {pendingAttachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pendingAttachments.map((a) => (
                  <span key={a.id} className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    {a.name}
                    <button type="button" onClick={() => setPendingAttachments((prev) => prev.filter((x) => x.id !== a.id))} aria-label={`Remove ${a.name}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a photograph, floor plan or inspiration image"
                className="text-slate-400 hover:text-slate-700 p-3 rounded-xl border border-slate-200 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple className="sr-only" onChange={(e) => { handleAttach(e.target.files); e.target.value = ""; }} />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                rows={2}
                placeholder="Describe what you want to renovate…"
                aria-label="Message Huza AI"
                className="flex-grow px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440] transition-colors resize-none text-sm"
              />
              {sending ? (
                <button type="button" onClick={stop} className="bg-red-50 text-red-600 font-bold px-5 py-3 rounded-xl hover:bg-red-100 transition-colors whitespace-nowrap">
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => send(draft)}
                  disabled={!draft.trim() && pendingAttachments.length === 0}
                  className="bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap"
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`p-5 border-l border-slate-100 ${mobileTab === "requirements" ? "block" : "hidden"} lg:block`}>
          <RequirementsPanel project={project} onUpdate={(reqs) => RenovationProjectService.setExtractedRequirements(project.id, reqs)} />
        </div>
      </div>

      <ConfirmModal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear conversation"
        description="This removes the entire Huza AI conversation for this project. Extracted requirements already accepted are not affected."
        confirmLabel="Clear Conversation"
        destructive
        onConfirm={() => {
          RenovationProjectService.clearAgentConversation(project.id);
          setClearOpen(false);
          showToast("Conversation cleared.");
        }}
      />
    </div>
  );
}
