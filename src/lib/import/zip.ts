import type JSZip from "jszip";
import { attr, children, parseXml } from "./xml";

const imageTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
};

// Formats Office uses for equations and clip art that browsers cannot display.
const unsupportedImageTypes = new Set(["emf", "wmf", "tif", "tiff", "svg"]);

export const maxImportImageBytes = 5 * 1024 * 1024;

export type ExtractedImage =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: string };

export async function loadZip(data: ArrayBuffer) {
  const { default: Zip } = await import("jszip");
  try {
    return await Zip.loadAsync(data);
  } catch {
    throw new Error("This file could not be opened. Make sure it is a valid, unprotected Office file.");
  }
}

export async function readZipXml(zip: JSZip, path: string) {
  const file = zip.file(path);
  return file ? parseXml(await file.async("string")) : undefined;
}

/** Relationship id -> absolute zip path for an OOXML part (e.g. word/document.xml). */
export async function readRelationships(zip: JSZip, partPath: string) {
  const directory = partPath.slice(0, partPath.lastIndexOf("/") + 1);
  const fileName = partPath.slice(partPath.lastIndexOf("/") + 1);
  const rels = await readZipXml(zip, `${directory}_rels/${fileName}.rels`);
  const map = new Map<string, string>();
  for (const relation of children(rels, "Relationship")) {
    const id = attr(relation, "Id");
    const target = attr(relation, "Target");
    if (!id || !target || attr(relation, "TargetMode") === "External") continue;
    map.set(id, resolvePath(directory, target));
  }
  return map;
}

function resolvePath(directory: string, target: string) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = `${directory}${target}`.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part && part !== ".") resolved.push(part);
  }
  return resolved.join("/");
}

export async function readZipImage(zip: JSZip, path: string): Promise<ExtractedImage> {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  if (unsupportedImageTypes.has(extension)) {
    return {
      ok: false,
      reason: `An image is in ${extension.toUpperCase()} format, which browsers cannot display. Replace it with a PNG or JPEG picture.`,
    };
  }
  const type = imageTypes[extension];
  const file = zip.file(path);
  if (!type || !file) return { ok: false, reason: "An image could not be read from the file." };
  const bytes = await file.async("uint8array");
  if (bytes.byteLength > maxImportImageBytes) {
    return { ok: false, reason: "An image is larger than 5 MB. Compress it and upload again." };
  }
  return { ok: true, dataUrl: `data:${type};base64,${await file.async("base64")}` };
}
