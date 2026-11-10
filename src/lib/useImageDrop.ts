"use client";

import { DragEvent, useCallback, useEffect, useRef, useState } from "react";

/**
 * Drag-and-drop and paste for any place that takes pictures. An upload area calls `useImageDrop(handler)` and spreads `props` on its
 * outer element: pictures dropped on it, or pasted while it is the one in use, go to `handler`. Only picture files are passed on.
 *
 * Paste goes to the upload area the person is using: the one they last pointed at, clicked into or tabbed to, or else the one that opened
 * most recently (a dialog's uploader wins over the page behind it).
 */

type Entry = { accept: (files: File[]) => void; disabled: boolean; touched: number };
const entries = new Map<number, Entry>();
let nextId = 1;
let clock = 0;
let listening = false;

const isPicture = (file: File) => file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);

function onPaste(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []).filter(isPicture);
  if (files.length === 0) return;
  const target = [...entries.values()].filter((entry) => !entry.disabled).sort((a, b) => b.touched - a.touched)[0];
  if (!target) return;
  event.preventDefault();
  target.accept(files);
}

function listen() {
  if (listening || typeof document === "undefined") return;
  document.addEventListener("paste", onPaste);
  listening = true;
}

export function useImageDrop(onFiles: (files: File[]) => void, options: { disabled?: boolean } = {}) {
  const disabled = !!options.disabled;
  const handler = useRef(onFiles);
  const idRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    handler.current = onFiles;
  });

  useEffect(() => {
    const id = nextId++;
    idRef.current = id;
    listen();
    entries.set(id, { accept: (files) => handler.current(files), disabled, touched: ++clock });
    return () => {
      entries.delete(id);
    };
  }, [disabled]);

  const touch = useCallback(() => {
    const entry = entries.get(idRef.current);
    if (entry) entry.touched = ++clock;
  }, []);

  const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

  const props = {
    onPointerEnter: touch,
    onFocusCapture: touch,
    onClickCapture: touch,
    onDragEnter: (event: DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      touch();
      setDragging(true);
    },
    onDragOver: (event: DragEvent) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (event: DragEvent) => {
      setDragging(false);
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      event.stopPropagation();
      const files = Array.from(event.dataTransfer.files).filter(isPicture);
      if (files.length > 0) handler.current(files);
    },
  };

  /** Classes that show a drop is welcome: add them to the same element. */
  const highlight = dragging ? "ring-2 ring-[#2ec440] ring-offset-2 bg-[#2ec440]/5" : "";

  return { props, dragging, highlight };
}

/** Paste only, for an upload area that already handles drops itself. */
export function useImagePaste(onFiles: (files: File[]) => void, options: { disabled?: boolean } = {}) {
  const { props } = useImageDrop(onFiles, options);
  return { onPointerEnter: props.onPointerEnter, onFocusCapture: props.onFocusCapture, onClickCapture: props.onClickCapture };
}
