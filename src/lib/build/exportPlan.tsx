import { renderToStaticMarkup } from "react-dom/server";
import { FloorPlanGraphic, floorPlanSize } from "@/components/build/FloorPlanSvg";
import type { ManualDesign } from "./types";

const PAD = 24;
const TITLE_H = 56;
const FLOOR_LABEL_H = 28;
const SCALE = 2; // the picture is drawn at twice the size so it stays sharp when printed

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Every floor of a design, one under the other, with its name and the title, as one SVG picture. */
export function designToSvg(design: ManualDesign, title: string, subtitle?: string): { svg: string; width: number; height: number } {
  const floors = design.floors.filter((f) => f.rooms.length > 0);
  const sizes = floors.map(floorPlanSize);
  const width = Math.max(420, ...sizes.map((s) => s.width)) + PAD * 2;
  let y = PAD + TITLE_H;
  const parts: string[] = [];
  floors.forEach((floor, index) => {
    const size = sizes[index];
    parts.push(`<text x="${PAD}" y="${y + 18}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#0f172a">${escapeXml(floor.name)}</text>`);
    y += FLOOR_LABEL_H;
    const graphic = renderToStaticMarkup(<FloorPlanGraphic floor={floor} />).replace("<svg ", `<svg x="${PAD}" y="${y}" xmlns="http://www.w3.org/2000/svg" `);
    parts.push(graphic);
    y += size.height + PAD;
  });
  const height = y + 20;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, Helvetica, sans-serif">` +
    `<rect width="100%" height="100%" fill="#ffffff"/>` +
    `<text x="${PAD}" y="${PAD + 18}" font-size="20" font-weight="800" fill="#0f172a">${escapeXml(title)}</text>` +
    (subtitle ? `<text x="${PAD}" y="${PAD + 38}" font-size="12" fill="#64748b">${escapeXml(subtitle)}</text>` : "") +
    parts.join("") +
    `<text x="${PAD}" y="${height - 8}" font-size="10" fill="#94a3b8">Conceptual layout from HuzaEstate, not a measured technical drawing.</text>` +
    `</svg>`;
  return { svg, width, height };
}

function fileName(title: string, extension: string): string {
  const base = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "house-design";
  return `${base}.${extension}`;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Downloads the whole design as a PNG picture. Rejects with a readable error if the browser cannot make the picture. */
export async function downloadDesignPng(design: ManualDesign, title: string, subtitle?: string): Promise<void> {
  const { svg, width, height } = designToSvg(design, title, subtitle);
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not make the picture. Try the SVG download instead."));
      img.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * SCALE);
    canvas.height = Math.round(height * SCALE);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not make the picture. Try the SVG download instead.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Could not make the picture. Try the SVG download instead.");
    saveBlob(blob, fileName(title, "png"));
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** Downloads the whole design as an SVG file (opens in a browser, and in drawing programs). */
export function downloadDesignSvg(design: ManualDesign, title: string, subtitle?: string): void {
  const { svg } = designToSvg(design, title, subtitle);
  saveBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), fileName(title, "svg"));
}
