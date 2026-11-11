import type { jsPDF } from "jspdf";
import { propertyLocationLabel } from "./format";
import { hasPicture } from "./redesign";
import { PRIORITY_LABELS, PROPERTY_TYPE_LABELS, RenovationProject, RENOVATION_AREA_LABELS, RENOVATION_STYLE_LABELS } from "./types";

// A4 portrait, in millimetres.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - MARGIN - 8;
type Colour = [number, number, number];
const GREEN: Colour = [46, 196, 64];
const INK: Colour = [15, 23, 42];
const GREY: Colour = [100, 116, 139];
const LINE: Colour = [226, 232, 240];

/** The standard PDF fonts only hold Western letters: swap the few common marks they lack and drop the rest. */
function plain(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[‐-‒]/g, "-")
    .replace(/[^\u0009\u000A\u000D -~ -ÿ–—]/g, "");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("A picture could not be read."));
    img.src = src;
  });
}

/** A picture cut to 16:10 so the pictures line up in rows. */
async function coverPicture(url: string): Promise<string> {
  const image = await loadImage(url);
  const ratio = 16 / 10;
  let sw = image.width;
  let sh = image.height;
  if (sw / sh > ratio) sw = sh * ratio;
  else sh = sw / ratio;
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 625;
  const context = canvas.getContext("2d");
  if (!context) return url;
  context.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

const fileName = (name: string) => `${name.trim().replace(/[^A-Za-z0-9 _-]+/g, "").replace(/\s+/g, " ").trim() || "My renovation"} - HuzaEstate.pdf`;

/** Makes the renovation's document as a real PDF and saves it: each room before and after, what changes, the scope of work. */
export async function downloadRenovationPdf(project: RenovationProject): Promise<void> {
  const { jsPDF: PDF } = await import("jspdf");
  const design = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];
  if (!design) throw new Error("There is no redesign to download yet.");

  const views = design.areaViews.filter(hasPicture);
  const pictures = await Promise.all(views.map(async (v) => ({ label: v.label, before: await coverPicture(v.beforeImage), after: await coverPicture(v.afterImage) })));

  const doc: jsPDF = new PDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  doc.setProperties({ title: `${plain(project.name)} - HuzaEstate`, author: "HuzaEstate Renovate", creator: "HuzaEstate" });
  let y = MARGIN;

  const ensure = (height: number) => {
    if (y + height > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const colour = (c: Colour) => doc.setTextColor(c[0], c[1], c[2]);
  const paragraph = (text: string, x: number, width: number, size: number, c: Colour, style: "normal" | "bold" = "normal", gap = 1.4) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    colour(c);
    const lines = doc.splitTextToSize(plain(text), width) as string[];
    const lineHeight = size * 0.3528 * 1.35;
    for (const line of lines) {
      ensure(lineHeight);
      doc.text(line, x, y + size * 0.3528);
      y += lineHeight;
    }
    y += gap;
  };
  const heading = (text: string) => {
    ensure(18);
    y += 4;
    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.rect(MARGIN, y, 1.6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    colour(INK);
    doc.text(plain(text), MARGIN + 4.5, y + 4.8);
    y += 11;
  };

  // ---- Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  colour(GREEN);
  doc.text("HUZAESTATE RENOVATE", MARGIN, y + 3);
  y += 9;
  paragraph(project.name, MARGIN, CONTENT_W, 24, INK, "bold", 1);
  const location = project.property.location?.trim() ? propertyLocationLabel(project) : "";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  paragraph(location ? `${location}  |  ${today}` : today, MARGIN, CONTENT_W, 10, GREY, "normal", 2);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  const style = (project.assessment.style.primaryStyle && RENOVATION_STYLE_LABELS[project.assessment.style.primaryStyle]) || "Not set";
  const facts: [string, string][] = [
    [String(project.assessment.areas.length), project.assessment.areas.length === 1 ? "room" : "rooms"],
    [style, "style"],
    [String(project.scope.length), project.scope.length === 1 ? "task in the scope" : "tasks in the scope"],
  ];
  const boxW = (CONTENT_W - 6) / 3;
  facts.forEach(([value, label], index) => {
    const x = MARGIN + index * (boxW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxW, 20, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(value.length > 12 ? 11 : 15);
    colour(INK);
    doc.text(plain(value), x + 4, y + 9.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    colour(GREY);
    doc.text(label, x + 4, y + 15.5);
  });
  y += 26;

  // ---- Before and after
  if (pictures.length > 0) {
    heading("Before and after");
    const gap = 4;
    const w = (CONTENT_W - gap) / 2;
    const h = (w * 10) / 16;
    for (const picture of pictures) {
      ensure(h + 18);
      paragraph(picture.label.toUpperCase(), MARGIN, CONTENT_W, 8.5, GREY, "bold", 1);
      doc.addImage(picture.before, "JPEG", MARGIN, y, w, h);
      doc.addImage(picture.after, "JPEG", MARGIN + w + gap, y, w, h);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      colour(GREY);
      doc.text("Before", MARGIN, y + h + 4.5);
      doc.text("After", MARGIN + w + gap, y + h + 4.5);
      y += h + 10;
    }
  }

  // ---- What changes
  const lists: [string, string[]][] = [
    ["What changes", design.whatChanges],
    ["What stays", design.whatRemains],
    ["What is removed", design.whatIsRemoved],
    ["Materials", design.suggestedMaterials],
    ["Colours", design.suggestedColours],
  ];
  const shown = lists.filter(([, items]) => items.length > 0);
  if (shown.length > 0) {
    heading("The design");
    for (const [title, items] of shown) {
      ensure(14);
      paragraph(title.toUpperCase(), MARGIN, CONTENT_W, 8.5, GREY, "bold", 1);
      for (const item of items.slice(0, 12)) paragraph(`- ${item}`, MARGIN + 2, CONTENT_W - 2, 9.5, INK, "normal", 0.6);
      y += 3;
    }
  }

  // ---- Scope of work
  if (project.scope.length > 0) {
    heading("Scope of work");
    const items = [...project.scope].sort((a, b) => a.sequence - b.sequence);
    for (const item of items) {
      const area = RENOVATION_AREA_LABELS[item.areaKey];
      const quantity = item.quantity ? `${item.quantity} ${item.unit}`.trim() : "";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(plain(item.task), CONTENT_W - 78) as string[];
      const rowH = Math.max(7, lines.length * 4.9 + 3);
      ensure(rowH);
      doc.setFont("helvetica", "bold");
      colour(INK);
      doc.text(plain(area), MARGIN, y + 4.6);
      doc.setFont("helvetica", "normal");
      doc.text(lines, MARGIN + 42, y + 4.6);
      colour(GREY);
      doc.setFontSize(8.5);
      doc.text(plain(`${quantity}${quantity ? "  |  " : ""}${PRIORITY_LABELS[item.priority]}`), PAGE_W - MARGIN, y + 4.6, { align: "right" });
      y += rowH;
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    }
    y += 4;
  }

  // ---- Property
  heading("Property");
  const details: [string, string][] = [
    ...(location ? ([["Location", location]] as [string, string][]) : []),
    ["Property type", project.property.propertyType ? PROPERTY_TYPE_LABELS[project.property.propertyType] : "Not provided"],
    ["Approximate area", project.property.approxAreaSqm ? `${project.property.approxAreaSqm} sqm` : "Not provided"],
  ];
  for (const [label, value] of details) {
    ensure(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    colour(INK);
    doc.text(label, MARGIN, y + 4.6);
    doc.setFont("helvetica", "normal");
    colour(GREY);
    doc.text(plain(value), MARGIN + 44, y + 4.6);
    y += 6.5;
  }

  // ---- Disclaimer
  y += 6;
  const disclaimer = "This is a conceptual renovation design produced by HuzaEstate Renovate and is not an approved technical design. Structural, electrical, plumbing, safety and permit-related work must be reviewed by qualified professionals before any work begins.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const disclaimerLines = doc.splitTextToSize(disclaimer, CONTENT_W - 10) as string[];
  const boxH = disclaimerLines.length * 4.2 + 12;
  ensure(boxH);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, CONTENT_W, boxH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  colour(INK);
  doc.text("Disclaimer", MARGIN + 5, y + 6);
  doc.setFont("helvetica", "normal");
  colour(GREY);
  doc.text(disclaimerLines, MARGIN + 5, y + 11);

  // ---- A footer on every page
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    doc.line(MARGIN, PAGE_H - MARGIN - 2, PAGE_W - MARGIN, PAGE_H - MARGIN - 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    colour(GREY);
    doc.text(`HuzaEstate Renovate  |  ${plain(project.name)}`, MARGIN, PAGE_H - MARGIN + 3);
    doc.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - MARGIN + 3, { align: "right" });
  }

  doc.save(fileName(project.name));
}
