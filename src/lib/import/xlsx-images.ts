import type JSZip from "jszip";
import { attr, child, children, descendants, type XmlNode } from "./xml";
import { readRelationships, readZipImage, readZipXml } from "./zip";

export type SheetImages = {
  /** `${row}:${col}` (0-based, absolute sheet coordinates) -> image data URLs. */
  byCell: Map<string, string[]>;
  /** `${row}:${col}` -> reasons an image there could not be used. */
  problems: Map<string, string[]>;
};

export function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

function parseCellRef(ref: string) {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const col = Array.from(match[1].toUpperCase()).reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  return { row: Number(match[2]) - 1, col };
}

async function firstSheetPath(zip: JSZip) {
  const workbook = await readZipXml(zip, "xl/workbook.xml");
  const sheet = children(child(workbook, "sheets"), "sheet")[0];
  const id = attr(sheet, "id");
  if (!id) return undefined;
  return (await readRelationships(zip, "xl/workbook.xml")).get(id);
}

function add(map: Map<string, string[]>, key: string, value: string) {
  map.set(key, [...(map.get(key) ?? []), value]);
}

async function collect(zip: JSZip, result: SheetImages, key: string, mediaPath: string | undefined) {
  if (!mediaPath) return;
  const image = await readZipImage(zip, mediaPath);
  if (image.ok) add(result.byCell, key, image.dataUrl);
  else add(result.problems, key, image.reason);
}

async function readDrawingImages(zip: JSZip, sheetPath: string, sheet: XmlNode, result: SheetImages) {
  const sheetRels = await readRelationships(zip, sheetPath);
  for (const drawing of children(sheet, "drawing")) {
    const drawingPath = sheetRels.get(attr(drawing, "id") ?? "");
    if (!drawingPath) continue;
    const drawingXml = await readZipXml(zip, drawingPath);
    const drawingRels = await readRelationships(zip, drawingPath);
    for (const anchor of children(drawingXml)) {
      const from = child(anchor, "from");
      const row = Number(child(from, "row")?.textContent ?? NaN);
      const col = Number(child(from, "col")?.textContent ?? NaN);
      if (!Number.isFinite(row) || !Number.isFinite(col)) continue;
      // Order pictures in a group by their position in the drawing.
      for (const blip of descendants(anchor, "blip")) {
        await collect(zip, result, cellKey(row, col), drawingRels.get(attr(blip, "embed") ?? ""));
      }
    }
  }
}

/** Resolves Excel "Place in cell" pictures: cell vm -> metadata -> rich value -> image relationship. */
async function readInCellImages(zip: JSZip, sheet: XmlNode, result: SheetImages) {
  const richValues = await readZipXml(zip, "xl/richData/rdrichvalue.xml");
  if (!richValues) return;

  const structures = children(await readZipXml(zip, "xl/richData/rdrichvaluestructure.xml"), "s");
  const imageKeyIndex = (structureIndex: number) =>
    children(structures[structureIndex], "k").findIndex((key) => attr(key, "n") === "_rvRel:LocalImageIdentifier");

  const imageRels = await readRelationships(zip, "xl/richData/richValueRel.xml");
  const relIds = children(await readZipXml(zip, "xl/richData/richValueRel.xml"), "rel").map((rel) => attr(rel, "id") ?? "");
  const values = children(richValues, "rv");

  const metadata = await readZipXml(zip, "xl/metadata.xml");
  const valueMetadata = children(child(metadata, "valueMetadata"), "bk");
  const richValueBlocks = children(metadata, "futureMetadata").find((block) => attr(block, "name") === "XLRICHVALUE");
  const richValueIndexes = children(richValueBlocks, "bk").map((block) => Number(attr(descendants(block, "rvb")[0], "i")));

  const richValueIndexFor = (vm: number) => {
    const rc = child(valueMetadata[vm - 1], "rc");
    const index = richValueIndexes[Number(attr(rc, "v"))];
    return Number.isFinite(index) ? index : vm - 1;
  };

  for (const cell of descendants(child(sheet, "sheetData"), "c")) {
    const vm = Number(attr(cell, "vm"));
    const position = parseCellRef(attr(cell, "r") ?? "");
    if (!vm || !position) continue;
    const value = values[richValueIndexFor(vm)];
    const keyIndex = imageKeyIndex(Number(attr(value, "s") ?? 0));
    const relIndex = Number(children(value, "v")[keyIndex < 0 ? 0 : keyIndex]?.textContent);
    await collect(zip, result, cellKey(position.row, position.col), imageRels.get(relIds[relIndex] ?? ""));
  }
}

export async function readFirstSheetImages(zip: JSZip): Promise<SheetImages> {
  const result: SheetImages = { byCell: new Map(), problems: new Map() };
  const sheetPath = await firstSheetPath(zip);
  const sheet = sheetPath ? await readZipXml(zip, sheetPath) : undefined;
  if (!sheetPath || !sheet) return result;

  await readDrawingImages(zip, sheetPath, sheet, result);
  await readInCellImages(zip, sheet, result);
  return result;
}
