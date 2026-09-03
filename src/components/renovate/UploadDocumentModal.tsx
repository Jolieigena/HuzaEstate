"use client";

import { useId, useState } from "react";
import Dialog from "@/components/Dialog";
import FileUploadList from "@/components/renovate/FileUploadList";
import { DocumentCategory, DOCUMENT_CATEGORY_LABELS, UploadedFile } from "@/lib/renovate/types";
import { RenovationProjectService } from "@/lib/renovate/projectService";
import { useToast } from "@/lib/toast-context";

export default function UploadDocumentModal({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const titleId = useId();
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const reset = () => {
    setCategory("other");
    setFiles([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    const documents = files.map((f) => ({
      id: f.id,
      name: f.name,
      category,
      fileType: f.fileType,
      size: f.size,
      date: new Date().toISOString(),
      uploadedBy: "You",
      status: "active" as const,
      previewUrl: f.previewUrl,
    }));
    RenovationProjectService.addDocuments(projectId, documents);
    showToast(`${files.length} document${files.length === 1 ? "" : "s"} uploaded.`);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} labelledBy={titleId} panelClassName="max-w-lg">
      <div className="p-6 sm:p-8">
        <h2 id={titleId} className="text-xl font-black text-slate-900 mb-1">
          Upload documents
        </h2>
        <p className="text-slate-500 text-sm mb-5">Files stay in this browser only. They are never sent to an external service.</p>

        <label htmlFor="doc-category" className="block text-sm font-bold text-slate-700 mb-2">
          Category
        </label>
        <select
          id="doc-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 mb-5"
        >
          {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <FileUploadList files={files} onChange={setFiles} category="measurement_document" />

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button type="button" onClick={handleClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={files.length === 0}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-[#2ec440] disabled:opacity-50 text-white font-bold transition-colors shadow-lg"
          >
            Upload {files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"}` : ""}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
