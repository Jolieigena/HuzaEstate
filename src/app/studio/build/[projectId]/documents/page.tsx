"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBuildProjectContext } from "@/components/build/BuildProjectContext";
import { BuildProjectService } from "@/lib/build/projectService";
import { FileCategory, FILE_CATEGORY_LABELS, ProjectDocument } from "@/lib/build/types";
import { formatBytes, formatDate } from "@/lib/build/format";
import { useToast } from "@/lib/toast-context";
import UploadDocumentModal from "@/components/build/UploadDocumentModal";
import ConfirmModal from "@/components/shared/ConfirmModal";
import PromptModal from "@/components/shared/PromptModal";
import Dialog from "@/components/Dialog";

export default function DocumentsPage() {
  const project = useBuildProjectContext();
  const { showToast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | "all">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [renameTarget, setRenameTarget] = useState<ProjectDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDocument | null>(null);
  const [moveTarget, setMoveTarget] = useState<ProjectDocument | null>(null);

  const activeDocuments = project.documents.filter((d) => d.status === "active");
  const filtered = useMemo(() => (categoryFilter === "all" ? activeDocuments : activeDocuments.filter((d) => d.category === categoryFilter)), [activeDocuments, categoryFilter]);

  const isProtected = (doc: ProjectDocument) => Boolean(doc.attachedTo && doc.attachedTo.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 mb-1">Project documents</h1>
          <p className="text-slate-500 text-sm">Plot documents, inspiration, generated concepts and review outputs, all in one place.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/studio/build/${project.id}/summary`} className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl transition-colors whitespace-nowrap">
            Project Summary
          </Link>
          <button type="button" onClick={() => setUploadOpen(true)} className="bg-slate-900 hover:bg-[#2ec440] text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-lg whitespace-nowrap">
            Upload Document
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${categoryFilter === "all" ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All ({activeDocuments.length})
        </button>
        {(Object.entries(FILE_CATEGORY_LABELS) as [FileCategory, string][]).map(([key, label]) => {
          const count = activeDocuments.filter((d) => d.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(key)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${categoryFilter === key ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center text-slate-500">No documents in this category yet.</div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wide">
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4">Size</th>
                <th className="p-4">Date</th>
                <th className="p-4">Uploaded by</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-50 last:border-b-0">
                  <td className="p-4 font-semibold text-slate-800">{doc.name}</td>
                  <td className="p-4 text-slate-500">{FILE_CATEGORY_LABELS[doc.category]}</td>
                  <td className="p-4 text-slate-500 uppercase">{doc.fileType}</td>
                  <td className="p-4 text-slate-500">{formatBytes(doc.size)}</td>
                  <td className="p-4 text-slate-500">{formatDate(doc.date)}</td>
                  <td className="p-4 text-slate-500">{doc.uploadedBy}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-3 text-xs font-bold">
                      <button type="button" onClick={() => setPreviewDoc(doc)} className="text-slate-500 hover:text-slate-900">
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          BuildProjectService.logDocumentDownload(project.id, doc.name);
                          showToast("Document downloaded.");
                        }}
                        className="text-slate-500 hover:text-slate-900"
                      >
                        Download
                      </button>
                      <button type="button" onClick={() => setRenameTarget(doc)} className="text-slate-500 hover:text-slate-900">
                        Rename
                      </button>
                      <button type="button" onClick={() => setMoveTarget(doc)} className="text-slate-500 hover:text-slate-900">
                        Move
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(doc)} className="text-red-500 hover:text-red-700">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UploadDocumentModal projectId={project.id} open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <Dialog open={previewDoc !== null} onClose={() => setPreviewDoc(null)} labelledBy="doc-preview-title" panelClassName="max-w-lg">
        {previewDoc && (
          <div className="p-6 sm:p-8">
            <h2 id="doc-preview-title" className="text-lg font-black text-slate-900 mb-4">
              {previewDoc.name}
            </h2>
            {previewDoc.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewDoc.previewUrl} alt={previewDoc.name} className="w-full rounded-xl border border-slate-200 mb-4" />
            ) : (
              <div className="w-full h-40 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm mb-4">No preview available for this file type</div>
            )}
            <button type="button" onClick={() => setPreviewDoc(null)} className="w-full bg-slate-900 hover:bg-[#2ec440] text-white font-bold py-3 rounded-xl transition-colors">
              Close
            </button>
          </div>
        )}
      </Dialog>

      <PromptModal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Rename document"
        label="Document name"
        initialValue={renameTarget?.name ?? ""}
        onSubmit={(value) => {
          if (!renameTarget) return;
          BuildProjectService.renameDocument(project.id, renameTarget.id, value);
          setRenameTarget(null);
          showToast("Document renamed.");
        }}
      />

      <Dialog open={moveTarget !== null} onClose={() => setMoveTarget(null)} labelledBy="doc-move-title" panelClassName="max-w-sm">
        {moveTarget && (
          <div className="p-6 sm:p-8">
            <h2 id="doc-move-title" className="text-lg font-black text-slate-900 mb-4">
              Move to category
            </h2>
            <div className="space-y-2">
              {(Object.entries(FILE_CATEGORY_LABELS) as [FileCategory, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    BuildProjectService.moveDocumentCategory(project.id, moveTarget.id, key);
                    setMoveTarget(null);
                    showToast("Document moved.");
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    moveTarget.category === key ? "bg-[#2ec440]/10 text-[#2ec440]" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete document?"
        destructive={!isProtected(deleteTarget ?? ({} as ProjectDocument))}
        confirmLabel={deleteTarget && isProtected(deleteTarget) ? "Archive Instead" : "Delete Permanently"}
        description={
          deleteTarget && isProtected(deleteTarget)
            ? `"${deleteTarget.name}" is attached to ${deleteTarget.attachedTo?.map((a) => a.label).join(", ")}. It will be archived instead of deleted so those records stay intact.`
            : "This permanently removes this document. This cannot be undone."
        }
        onConfirm={() => {
          if (!deleteTarget) return;
          if (isProtected(deleteTarget)) {
            BuildProjectService.archiveDocument(project.id, deleteTarget.id);
            showToast("Document archived.");
          } else {
            BuildProjectService.deleteDocument(project.id, deleteTarget.id);
            showToast("Document deleted.");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
