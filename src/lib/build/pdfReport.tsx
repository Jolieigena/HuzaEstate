import { renderToStaticMarkup } from "react-dom/server";
import type { jsPDF } from "jspdf";
import { FloorPlanGraphic, floorPlanSize } from "@/components/build/FloorPlanSvg";
import { calculateBudget, COST_PER_SQM, PRICE_BASIS } from "./budget";
import { formatCompactRwf, projectLocationLabel } from "./format";
import { BuildProject, FINISH_LEVEL_LABELS, ManualFloor, ROOM_LABELS, RoomKey } from "./types";

// A4 portrait, in millimetres.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 14;
const BOTTOM = PAGE_H - MARGIN - FOOTER_H + 6;
const GREEN: [number, number, number] = [46, 196, 64];
const INK: [number, number, number] = [15, 23, 42];
const GREY: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

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

/** One floor drawn as a sharp PNG on white, with its size on paper so the labels stay a readable size. */
async function floorPicture(floor: ManualFloor): Promise<{ url: string; widthMm: number; heightMm: number }> {
  const size = floorPlanSize(floor);
  // a margin all round, because windows and doors are drawn on the edge of the rooms
  const pad = 14;
  const width = size.width + pad * 2;
  const height = size.height + pad * 2;
  const drawing = renderToStaticMarkup(<FloorPlanGraphic floor={floor} />).replace("<svg ", `<svg x="${pad}" y="${pad}" `);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial, Helvetica, sans-serif"><rect width="100%" height="100%" fill="#ffffff"/>${drawing}</svg>`;
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(svgUrl);
    const scale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("The floor plan could not be drawn.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    // about 0.42 mm to a drawing unit keeps the room names readable; a large plan is shrunk to the page
    let widthMm = width * 0.42;
    let heightMm = height * 0.42;
    const fit = Math.min(1, CONTENT_W / widthMm, 190 / heightMm);
    widthMm *= fit;
    heightMm *= fit;
    return { url: canvas.toDataURL("image/png"), widthMm, heightMm };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** A picture cut to 16:10 so the pictures line up in rows. */
async function coverPicture(url: string): Promise<string> {
  const image = await loadImage(url);
  const targetRatio = 16 / 10;
  let sw = image.width;
  let sh = image.height;
  if (sw / sh > targetRatio) sw = sh * targetRatio;
  else sh = sw / targetRatio;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 750;
  const context = canvas.getContext("2d");
  if (!context) return url;
  context.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function fileName(name: string): string {
  const base = name.trim().replace(/[^A-Za-z0-9 _-]+/g, "").replace(/\s+/g, " ").trim() || "My home design";
  return `${base} - HuzaEstate.pdf`;
}

/** Makes the project's design document as a real PDF and saves it: the plans, the full design, the requirements. */
export async function downloadProjectPdf(project: BuildProject): Promise<void> {
  const { jsPDF: PDF } = await import("jspdf");
  const design = project.concepts.find((c) => c.id === project.selectedConceptId) ?? project.concepts[project.concepts.length - 1];
  if (!design) throw new Error("There is no design to download yet.");
  const full = project.fullDesign && project.fullDesign.pictures.length > 0 ? project.fullDesign : null;

  const [plans, pictures] = await Promise.all([
    Promise.all(design.floors.filter((f) => f.rooms.length > 0).map(async (floor) => ({ floor, ...(await floorPicture(floor)) }))),
    Promise.all((full?.pictures ?? []).map(async (p) => ({ label: p.label, url: await coverPicture(p.url) }))),
  ]);

  const doc: jsPDF = new PDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  doc.setProperties({ title: `${plain(project.name)} - HuzaEstate`, author: "HuzaEstate Build", creator: "HuzaEstate" });
  let y = MARGIN;

  const ensure = (height: number) => {
    if (y + height > BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };
  const colour = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const paragraph = (text: string, x: number, width: number, size: number, c: [number, number, number], style: "normal" | "bold" = "normal", gap = 1.4) => {
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
  doc.text("HUZAESTATE BUILD", MARGIN, y + 3);
  y += 9;
  paragraph(project.name, MARGIN, CONTENT_W, 24, INK, "bold", 1);
  const location = projectLocationLabel(project);
  paragraph(`${location}  |  ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, MARGIN, CONTENT_W, 10, GREY, "normal", 2);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 7;

  const m = design.metrics;
  const facts: [string, string][] = [
    [`${m.floorAreaSqm}`, "sqm built area"],
    [`${m.floors}`, m.floors === 1 ? "floor" : "floors"],
    [`${m.bedrooms}`, m.bedrooms === 1 ? "bedroom" : "bedrooms"],
    [`${m.bathrooms}`, m.bathrooms === 1 ? "bathroom" : "bathrooms"],
  ];
  const boxW = (CONTENT_W - 9) / 4;
  facts.forEach(([value, label], index) => {
    const x = MARGIN + index * (boxW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, boxW, 20, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    colour(INK);
    doc.text(value, x + 4, y + 9.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    colour(GREY);
    doc.text(label, x + 4, y + 15.5);
  });
  y += 26;

  // ---- Floor plans
  heading("Floor plans");
  for (const plan of plans) {
    ensure(plan.heightMm + 10);
    paragraph(plan.floor.name.toUpperCase(), MARGIN, CONTENT_W, 8.5, GREY, "bold", 1);
    doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
    const x = MARGIN + (CONTENT_W - plan.widthMm) / 2;
    doc.addImage(plan.url, "PNG", x, y, plan.widthMm, plan.heightMm);
    doc.rect(x, y, plan.widthMm, plan.heightMm);
    y += plan.heightMm + 7;
  }

  // ---- Full design
  if (full) {
    ensure(150);
    heading("Full design");
    paragraph(full.summary, MARGIN, CONTENT_W, 10.5, INK, "normal", 4);
    const gap = 4;
    const small = (CONTENT_W - gap) / 2;
    const smallH = (small * 10) / 16;
    const bigH = (CONTENT_W * 10) / 16;
    let index = 0;
    while (index < pictures.length) {
      if (index === 0) {
        const p = pictures[0];
        ensure(bigH + 7);
        doc.addImage(p.url, "JPEG", MARGIN, y, CONTENT_W, bigH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        colour(GREY);
        doc.text(plain(p.label), MARGIN, y + bigH + 4.5);
        y += bigH + 9;
        index = 1;
        continue;
      }
      ensure(smallH + 7);
      for (let col = 0; col < 2 && index < pictures.length; col++, index++) {
        const p = pictures[index];
        const x = MARGIN + col * (small + gap);
        doc.addImage(p.url, "JPEG", x, y, small, smallH);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        colour(GREY);
        doc.text(plain(p.label), x, y + smallH + 4.5);
      }
      y += smallH + 9;
    }
    if (full.items.length > 0) {
      heading("Specification");
      for (const item of full.items) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(plain(item.value), CONTENT_W - 44) as string[];
        const rowH = Math.max(7, lines.length * 4.9 + 3);
        ensure(rowH);
        doc.setFont("helvetica", "bold");
        colour(INK);
        doc.text(plain(item.label), MARGIN, y + 4.6);
        doc.setFont("helvetica", "normal");
        colour(GREY);
        doc.text(lines, MARGIN + 44, y + 4.6);
        y += rowH;
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      }
      y += 4;
    }
  }

  // ---- Budget: what the design costs and where the money goes
  const finish = project.brief.budget.finishLevel;
  const estimate = calculateBudget({ totalAreaSqm: m.floorAreaSqm, finishLevel: finish, contingencyPct: 10, includeLandscaping: false, includeFurniture: false, includeProfessionalFees: false });
  const money = (amount: number) => formatCompactRwf(amount).replace(" RWF", "");
  const rowsTotal = estimate.categories.reduce((sum, c) => sum + c.amount, 0) || 1;

  ensure(125);
  heading("Budget estimate");
  const costBoxW = (CONTENT_W - 6) / 3;
  (
    [
      ["Low", estimate.low, false],
      ["Target", estimate.target, true],
      ["High", estimate.high, false],
    ] as [string, number, boolean][]
  ).forEach(([label, amount, strong], index) => {
    const x = MARGIN + index * (costBoxW + 3);
    doc.setFillColor(strong ? 240 : 248, strong ? 253 : 250, strong ? 244 : 252);
    doc.roundedRect(x, y, costBoxW, 22, 2, 2, "F");
    if (strong) {
      doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
      doc.roundedRect(x, y, costBoxW, 22, 2, 2, "S");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    colour(GREY);
    doc.text(`${label} estimate`, x + 4, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    colour(INK);
    doc.text(`${money(amount)} RWF`, x + 4, y + 16);
  });
  y += 28;
  paragraph(
    `${m.floorAreaSqm} sqm built at about RWF ${estimate.costPerSqm.toLocaleString("en-US")} per sqm (${FINISH_LEVEL_LABELS[finish]} finish), plus 10% contingency. The low and high figures follow the price range for that finish level: RWF ${COST_PER_SQM[finish].low.toLocaleString("en-US")} to ${COST_PER_SQM[finish].high.toLocaleString("en-US")} per sqm.`,
    MARGIN,
    CONTENT_W,
    9.5,
    INK,
    "normal",
    4,
  );

  const barRows = (title: string, rows: { label: string; amount: number; note?: string }[]) => {
    ensure(14 + rows.length * 7);
    paragraph(title.toUpperCase(), MARGIN, CONTENT_W, 8.5, GREY, "bold", 1.5);
    for (const row of rows) {
      ensure(7);
      const share = row.amount / rowsTotal;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      colour(INK);
      doc.text(plain(row.label), MARGIN, y + 4.6);
      if (row.note) {
        colour(GREY);
        doc.setFontSize(8);
        doc.text(plain(row.note), MARGIN + 62, y + 4.6, { align: "right" });
        doc.setFontSize(9.5);
      }
      doc.setFillColor(238, 242, 247);
      doc.rect(MARGIN + 66, y + 1.6, 52, 3.6, "F");
      doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
      doc.rect(MARGIN + 66, y + 1.6, Math.max(0.6, 52 * share), 3.6, "F");
      colour(GREY);
      doc.text(`${(share * 100).toFixed(0)}%`, MARGIN + 126, y + 4.6, { align: "right" });
      doc.setFont("helvetica", "bold");
      colour(INK);
      doc.text(`${money(row.amount)} RWF`, PAGE_W - MARGIN, y + 4.6, { align: "right" });
      y += 7;
      doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    }
    y += 5;
  };

  barRows(
    "Where the money goes",
    estimate.categories.map((c) => ({ label: c.key === "contingency" ? `Contingency (${estimate.contingencyPct}%)` : c.label, amount: c.amount })),
  );

  // Each floor's share follows its built area (open space is not built).
  const floorAreas = design.floors.map((f) => ({ name: f.name, area: f.rooms.filter((r) => r.type !== "open_space").reduce((sum, r) => sum + r.w * r.h, 0) }));
  const builtTotal = floorAreas.reduce((sum, f) => sum + f.area, 0);
  if (floorAreas.length > 1 && builtTotal > 0) {
    barRows(
      "By floor",
      floorAreas.map((f) => ({ label: f.name, amount: (f.area / builtTotal) * rowsTotal, note: `${Math.round((f.area / builtTotal) * m.floorAreaSqm)} sqm` })),
    );
  }

  paragraph("Not included: land, design and engineering fees, the building permit, soil testing, water and electricity connections, landscaping, furniture and appliances.", MARGIN, CONTENT_W, 9, INK, "normal", 2.5);
  paragraph(`Price basis: ${PRICE_BASIS} Get quotations from builders before you commit to a budget.`, MARGIN, CONTENT_W, 8.5, GREY, "normal", 2);

  // ---- Plot and requirements
  heading("Plot and requirements");
  const plot: [string, string][] = [
    ["Location", location],
    ["Plot area", project.brief.plot.areaSqm ? `${project.brief.plot.areaSqm} sqm` : "Not provided"],
    ["Plot shape", project.brief.plot.shape ? String(project.brief.plot.shape) : "Not provided"],
    ["Slope", project.brief.plot.slope ? String(project.brief.plot.slope) : "Not provided"],
    ["Floors", String(project.brief.household.floors)],
  ];
  for (const [label, value] of plot) {
    ensure(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    colour(INK);
    doc.text(label, MARGIN, y + 4.6);
    doc.setFont("helvetica", "normal");
    colour(GREY);
    doc.text(plain(value.charAt(0).toUpperCase() + value.slice(1)), MARGIN + 44, y + 4.6);
    y += 6.5;
  }
  y += 3;
  const rooms = project.brief.household.rooms.map((r) => `${ROOM_LABELS[r.key as RoomKey] ?? r.label}${r.quantity > 1 ? ` x ${r.quantity}` : ""}`);
  if (rooms.length > 0) paragraph(`Rooms: ${rooms.join(", ")}`, MARGIN, CONTENT_W, 9.5, INK, "normal", 2);
  const priorities = project.brief.sustainability.items.filter((i) => i.priority).map((i) => i.label);
  if (priorities.length > 0) paragraph(`Priorities: ${priorities.join(", ")}`, MARGIN, CONTENT_W, 9.5, INK, "normal", 2);

  // ---- Disclaimer
  y += 4;
  const disclaimer =
    "This is a conceptual design produced by HuzaEstate Build and is not an approved construction drawing. Budget figures are indicative. Final architectural, structural and permit documents must be prepared or approved by qualified professionals.";
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
    doc.text(`HuzaEstate Build  |  ${plain(project.name)}`, MARGIN, PAGE_H - MARGIN + 3);
    doc.text(`Page ${page} of ${pages}`, PAGE_W - MARGIN, PAGE_H - MARGIN + 3, { align: "right" });
  }

  doc.save(fileName(project.name));
}
