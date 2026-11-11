/**
 * What a scoped site leaves out because none of its pages use it (owner,
 * 2026-11-09, Q-SZ-6 "A"). A scoped site writes the pages of one IG and its
 * landing layer, but the shell still carried the PDF viewer and every image
 * the platform's own docs use: smart-immunizations, 11 MB of pdf.js that no
 * page opened and 4.7 MB of slide-deck and proposal images that no page shows.
 *
 * Both checks read the built site, so they see what the pages actually load,
 * and the link check that runs after them catches an image a page did use.
 */
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { MARKER, VIEWER_DIR } from "../pdf-viewer.ts";

/** Files whose text can name an image or open the viewer. */
const TEXT = /\.(html?|css|js|mjs|json|jsonld|svg|xml|webmanifest|txt|md)$/i;

/** An image file name, as a page, a stylesheet or a script names it. */
const IMAGE_NAME = /[A-Za-z0-9_.%-]+\.(?:webp|png|jpe?g|gif|svg|avif|ico)/gi;

function walk(dir: string, skip: (rel: string) => boolean, root = dir, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    const rel = relative(root, p).split(sep).join("/");
    if (skip(rel)) continue;
    if (statSync(p).isDirectory()) walk(p, skip, root, out);
    else out.push(p);
  }
  return out;
}

/** True when a page of the built site embeds the PDF viewer (the embed carries {@link MARKER}). */
export function pagesEmbedPdf(site: string): boolean {
  for (const f of walk(site, (rel) => rel === VIEWER_DIR)) {
    if (/\.html?$/i.test(f) && readFileSync(f, "utf-8").includes(MARKER)) return true;
  }
  return false;
}

/**
 * Delete each file under `<site>/<dir>` whose name no text file of the site
 * mentions. The name is matched without its folder, so a page that names an
 * image by any relative path keeps it; a name built in a script at run time
 * from parts is not seen, which is why only an image folder is pruned.
 */
export function pruneUnreferencedImages(site: string, dir = "assets/img"): { files: string[]; bytes: number } {
  const root = join(site, dir);
  let images: string[];
  try {
    images = walk(root, () => false);
  } catch {
    return { files: [], bytes: 0 };
  }
  const named = new Set<string>();
  for (const f of walk(site, () => false)) {
    if (!TEXT.test(f)) continue;
    for (const m of readFileSync(f, "utf-8").matchAll(IMAGE_NAME)) {
      const name = m[0].toLowerCase();
      named.add(name);
      try {
        named.add(decodeURIComponent(name));
      } catch {
        // not percent-encoded: the name as written is enough
      }
    }
  }
  const files: string[] = [];
  let bytes = 0;
  for (const img of images) {
    const name = img.slice(img.lastIndexOf(sep) + 1).toLowerCase();
    if (named.has(name)) continue;
    bytes += statSync(img).size;
    files.push(relative(site, img).split(sep).join("/"));
    rmSync(img);
  }
  return { files, bytes };
}
