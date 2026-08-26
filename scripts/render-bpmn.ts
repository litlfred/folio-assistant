/**
 * Render BPMN 2.0 sources to standalone SVG.
 *
 * The `.bpmn` files under `docs/workflows/` are the source of truth — they are
 * plain BPMN 2.0 with diagram interchange, so they open in bpmn.io, Camunda
 * Modeler, or any other BPMN tool. This script rasterises them to SVG for the
 * docs site and for GitHub's Markdown renderer, which cannot draw BPMN itself.
 *
 * Usage:  bun run scripts/render-bpmn.ts [--check]
 *
 * `--check` renders to memory and fails if a committed SVG is stale, so CI can
 * catch a `.bpmn` edit that never had its SVG regenerated.
 *
 * Never hand-edit `docs/assets/img/workflows/*.svg` — regenerate instead.
 */
import { chromium } from "@playwright/test";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const SRC_DIR = join(ROOT, "docs/workflows");
const OUT_DIR = join(ROOT, "docs/assets/img/workflows");
const VIEWER = join(ROOT, "node_modules/bpmn-js/dist/bpmn-viewer.production.min.js");

const check = process.argv.includes("--check");

if (!existsSync(VIEWER)) {
  console.error(
    `bpmn-js not installed (${VIEWER} missing).\n` +
      `Run \`bun install\` — bpmn-js is a devDependency.`,
  );
  process.exit(1);
}

const sources = (await readdir(SRC_DIR)).filter((f) => f.endsWith(".bpmn")).sort();
if (sources.length === 0) {
  console.error(`No .bpmn sources found under ${SRC_DIR}`);
  process.exit(1);
}

// Honour an explicitly provided Chromium when the sandbox ships a build that
// does not match the version @playwright/test pins (CHROMIUM_PATH=/path/to/chrome).
const executablePath = process.env.CHROMIUM_PATH || undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><body><div id="canvas"></div></body></html>`);
await page.addScriptTag({ path: VIEWER });

let stale = 0;

for (const file of sources) {
  const xml = await readFile(join(SRC_DIR, file), "utf8");
  const { svg, warnings } = await page.evaluate(async (bpmnXml) => {
    const container = document.getElementById("canvas")!;
    container.innerHTML = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Viewer = (window as any).BpmnJS;
    const viewer = new Viewer({ container });
    const result = await viewer.importXML(bpmnXml);
    const { svg } = await viewer.saveSVG({ format: true });
    viewer.destroy();
    return { svg, warnings: (result.warnings ?? []).map((w: Error) => w.message) };
  }, xml);

  if (warnings.length > 0) {
    console.error(`✗ ${file}: ${warnings.length} import warning(s)`);
    for (const w of warnings) console.error(`    ${w}`);
    process.exitCode = 1;
    continue;
  }

  // bpmn-js mints a fresh random id for every arrowhead marker on each render,
  // so two renders of the same source differ byte-for-byte. Renumber them in
  // order of first appearance to make the output deterministic — otherwise
  // --check reports every diagram as stale and the SVGs churn in git.
  const markerIds = new Map<string, string>();
  const stable = svg.replace(/marker-[a-z0-9]{8,}/g, (id: string) => {
    if (!markerIds.has(id)) markerIds.set(id, `folio-marker-${markerIds.size + 1}`);
    return markerIds.get(id)!;
  });

  // The docs site scales diagrams to the column width; a fixed pixel width
  // would overflow on narrow screens.
  // Everything outside the pool is transparent in bpmn-js output, and the strokes
  // are near-black — so on a dark GitHub or docs theme the diagram loses its
  // margins and any label that sits outside a lane. Paint the viewport white.
  // The viewBox does not start at the origin, so the backdrop has to be placed
  // in viewBox coordinates — a 100%-sized rect at 0,0 would miss the right edge.
  const opaque = stable.replace(
    /(<svg[^>]*\sviewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"[^>]*>)/,
    (_m: string, tag: string, x: string, y: string, w: string, h: string) =>
      `${tag}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" />`,
  );

  const responsive = opaque.replace(
    /<svg([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"/,
    (_m: string, attrs: string) =>
      `<svg${attrs} width="100%" height="auto" style="max-width:100%;height:auto"`,
  );
  if (responsive === opaque || opaque === stable) {
    console.error(`✗ ${file}: could not make the SVG responsive — bpmn-js output changed shape`);
    process.exitCode = 1;
    continue;
  }

  const out = join(OUT_DIR, `${basename(file, ".bpmn")}.svg`);
  const previous = existsSync(out) ? await readFile(out, "utf8") : null;

  if (check) {
    if (previous !== responsive) {
      console.error(`✗ ${basename(out)} is stale — re-run \`bun run render:bpmn\``);
      stale++;
    } else {
      console.log(`✓ ${basename(out)} up to date`);
    }
    continue;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(out, responsive, "utf8");
  console.log(`${previous === responsive ? "=" : "✓"} ${basename(out)}`);
}

await browser.close();
if (stale > 0) process.exit(1);
