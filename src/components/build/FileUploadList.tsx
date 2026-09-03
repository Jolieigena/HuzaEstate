"use client";

import { useRef, useState } from "react";
import { FileCategory, UploadedFile } from "@/lib/build/types";
import { formatBytes } from "@/lib/build/format";
import { newId } from "@/lib/build/factory";

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp"];
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "pdf") {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
    </svg>
  );
}

interface FileUploadListProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  category: FileCategory;
  uploadedBy?: string;
  helperText?: string;
}

/**
 * Reusable drag-and-drop / file-picker upload control. This is a prototype:
 * files are never sent to a server. Only file metadata plus a local, safe
 * blob preview URL (via URL.createObjectURL) are stored, and everything
 * disappears when the browser tab is closed. A production build would
 * upload to secure server-side storage instead.
 */
export default function FileUploadList({ files, onChange, category, uploadedBy = "You", helperText }: FileUploadListProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError("");
    const accepted: UploadedFile[] = [];
    const rejected: string[] = [];

    Array.from(fileList).forEach((file) => {
      const ext = extensionOf(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        rejected.push(`${file.name} (unsupported type)`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        rejected.push(`${file.name} (too large)`);
        return;
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      accepted.push({
        id: newId("file"),
        name: file.name,
        fileType: ext,
        size: file.size,
        category,
        previewUrl,
        status: "uploaded",
        uploadedAt: new Date().toISOString(),
        uploadedBy,
      });
    });

    if (rejected.length) setError(`Couldn't add: ${rejected.join(", ")}. Allowed types: PDF, PNG, JPG, JPEG, WEBP (max 15MB).`);
    if (accepted.length) onChange([...files, ...accepted]);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${dragOver ? "border-[#2ec440] bg-[#2ec440]/5" : "border-slate-200 bg-slate-50"}`}
      >
        <svg className="w-8 h-8 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
        </svg>
        <p className="text-sm font-semibold text-slate-700 mb-1">Drag and drop files, or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[#2ec440] hover:text-[#28b039] font-bold text-sm underline underline-offset-2"
        >
          browse your device
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-slate-400 mt-2">{helperText ?? "PDF, PNG, JPG, JPEG or WEBP — up to 15MB each."}</p>
      </div>

      {error && <p className="text-red-600 text-sm font-semibold mt-2">{error}</p>}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
              {file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileTypeIcon type={file.fileType} />
                </span>
              )}
              <div className="min-w-0 flex-grow">
                <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {file.fileType.toUpperCase()} · {formatBytes(file.size)} · {file.status === "uploaded" ? "Uploaded" : file.status === "uploading" ? "Uploading…" : "Failed"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(files.filter((f) => f.id !== file.id))}
                aria-label={`Remove ${file.name}`}
                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
