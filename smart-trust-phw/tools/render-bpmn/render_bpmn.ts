/**
 * Draw each business process (input/business-processes/*.bpmn) as an SVG in
 * input/images/, where the IG Publisher serves it and business-processes.md
 * embeds it, with bootstrap-tools' renderer (bpmn-js in headless Chromium).
 * The .bpmn is the only source: never edit an SVG here, change the BPMN and
 * re-run. Labels come from the BPMN, so a translated BPMN draws translated.
 *
 *   bun tools/render-bpmn/render_bpmn.ts          (write)
 *   bun tools/render-bpmn/render_bpmn.ts --check  (fail if an SVG is stale or missing)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { besideSource, openRenderer, processIds, VIEWER_BUNDLE } from "@litlfred/bootstrap-tools/scripts/render-bpmn.ts";

const root = resolve(import.meta.dir, "..", "..");
const src = join(root, "input", "business-processes");
const outDir = join(root, "input", "images");
const check = process.argv.includes("--check");
const sources = readdirSync(src).filter((f) => f.endsWith(".bpmn")).sort().map((f) => join(src, f));

let viewer: string;
try {
  viewer = Bun.resolveSync("bpmn-js/dist/bpmn-viewer.production.min.js", root);
} catch {
  viewer = join(root, VIEWER_BUNDLE);
}
if (!existsSync(viewer)) {
  console.error(`bpmn-js is not installed (${viewer}): run bun install`);
  process.exit(1);
}
const processFile = new Map<string, string>();
for (const f of sources) for (const id of processIds(readFileSync(f, "utf-8"))) processFile.set(id, f);
const r = await openRenderer(viewer);
let bad = 0;
for (const file of sources) {
  if (processIds(readFileSync(file, "utf-8")).length === 0) continue;
  const out = join(outDir, basename(file).replace(/\.bpmn$/, ".svg"));
  const shown = relative(root, out);
  // A call activity links to its process's section of the page (an anchor
  // per process in business-processes.md), not to the bare SVG (owner,
  // 2026-11-11: "subprocess should link to process page").
  const got = await besideSource(r, file, processFile, (_home, called) => `business-processes.html#${called}`);
  if ("error" in got) {
    console.error(`✗ ${relative(root, file)}: ${got.error}`);
    bad++;
    continue;
  }
  const prev = existsSync(out) ? readFileSync(out, "utf-8") : undefined;
  if (check) {
    if (prev === got.svg) console.log(`✓ ${shown} up to date`);
    else {
      console.error(`✗ ${shown} is stale: run bun tools/render-bpmn/render_bpmn.ts`);
      bad++;
    }
    continue;
  }
  writeFileSync(out, got.svg);
  console.log(`${prev === got.svg ? "=" : "✓"} ${shown}`);
}
await r.close();
process.exit(bad > 0 ? 1 : 0);
