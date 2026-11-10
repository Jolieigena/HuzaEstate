"use client";

import { ReactNode } from "react";
import { useImageDrop } from "@/lib/useImageDrop";

/**
 * Wraps an upload control so pictures can also be dropped on it or pasted (a screenshot, a copied image). The pictures go to `onFiles`.
 * The area outlines itself while a file is dragged over it.
 */
export default function ImageDropArea({ onFiles, disabled, className = "", children }: { onFiles: (files: File[]) => void; disabled?: boolean; className?: string; children: ReactNode }) {
  const drop = useImageDrop(onFiles, { disabled });
  return (
    <div {...drop.props} className={`${className} ${drop.highlight} rounded-lg transition-shadow`}>
      {children}
    </div>
  );
}
