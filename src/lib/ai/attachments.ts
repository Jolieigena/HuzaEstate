/** A file the person attached in the AI panel: a picture or PDF as a data: address, or the words of a text file. */
export type Attachment = { name: string; dataUrl?: string; text?: string };

/** The server refuses requests over about 1 MB, so what is attached is kept small: pictures are shrunk, and the total is limited. */
export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHED_BYTES = 480_000;
export const ATTACH_ACCEPT = "image/*,.pdf,.txt,.md,.csv";

export const attachedSize = (list: Attachment[]) => list.reduce((sum, a) => sum + (a.dataUrl?.length ?? 0) + (a.text?.length ?? 0), 0);

function readAs(file: File, as: "dataUrl" | "text"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    if (as === "text") reader.readAsText(file);
    else reader.readAsDataURL(file);
  });
}

async function shrinkImage(file: File): Promise<string> {
  const source = await readAs(file, "dataUrl");
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("canvas"));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("image"));
    img.src = source;
  });
}

/** Turns a chosen file into an attachment, or says why it cannot be used. */
export async function readAttachment(file: File): Promise<{ ok: true; attachment: Attachment } | { ok: false; error: string }> {
  const name = file.name.slice(0, 60) || "file";
  try {
    if (file.type.startsWith("image/")) {
      if (!/^image\/(jpeg|png|webp|gif|bmp)$/.test(file.type)) return { ok: false, error: `${name}: use a JPG, PNG or WebP picture.` };
      return { ok: true, attachment: { name, dataUrl: await shrinkImage(file) } };
    }
    if (file.type === "application/pdf" || /\.pdf$/i.test(name)) {
      if (file.size > 360_000) return { ok: false, error: `${name} is too large. A PDF can be up to 350 KB.` };
      return { ok: true, attachment: { name, dataUrl: await readAs(file, "dataUrl") } };
    }
    if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(name)) {
      const text = (await readAs(file, "text")).trim().slice(0, 6000);
      if (!text) return { ok: false, error: `${name} is empty.` };
      return { ok: true, attachment: { name, text } };
    }
    return { ok: false, error: `${name} cannot be used. Attach a picture, a PDF or a text file.` };
  } catch {
    return { ok: false, error: `${name} could not be read.` };
  }
}
