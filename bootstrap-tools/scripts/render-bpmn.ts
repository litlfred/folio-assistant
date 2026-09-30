#!/usr/bin/env bun
/**
 * Draw a BPMN 2.0 diagram as a standalone SVG, and write that SVG beside its
 * `.bpmn` for every Process a content graph declares.
 *
 * @module bootstrap-tools/scripts/render-bpmn
 * @covers code
 *
 * The `.bpmn` is the source of truth — plain BPMN 2.0 with diagram
 * interchange, so it opens in bpmn.io, Camunda Modeler or any BPMN tool. A
 * README on GitHub cannot draw BPMN, so the picture beside it is generated
 * (owner, 2026-09-29: *"display bpmn(s) etc in README.md"*).
 *
 * ## Why this lives in bootstrap-tools, and what stays in the harness
 *
 * One copy of the writers, in the tools repository (owner, 2026-09-29, bean
 * `xsqm`, which allowed Playwright as a dependency for exactly this). What is
 * here is the DRAWING — bpmn-js in a headless Chromium, made byte-stable and
 * responsive — and the copy beside the source, whose call activities link
 * only to diagrams in the same directory, since a content graph's pictures
 * must not name anything outside it. A harness that also publishes a site
 * (cat-harness's `render:bpmn`) calls {@link openRenderer} and
 * {@link drawing} for its own copies, with links into its own pages.
 *
 * ## Deterministic by construction
 *
 * bpmn-js mints a fresh random id for every arrowhead marker on each render,
 * so two renders of one source differ byte-for-byte; {@link drawing}
 * renumbers them in order of first appearance, or `--check` would call every
 * diagram stale.
 *
 * Usage: `bun run bootstrap-tools/scripts/render-bpmn.ts [--repo <dir>] [--check]`
 * — the graphs these tools `support`, each `.bpmn` in a `processes` subgraph.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { chromium, type Page } from "@playwright/test";

import { knowledgeGraphsIn, readKnowledgeGraphDeclaration, supportsContent } from "../schemas/declaration.ts";

/** Where bpmn-js's browser bundle sits under a checkout's `node_modules/`. */
export const VIEWER_BUNDLE = "node_modules/bpmn-js/dist/bpmn-viewer.production.min.js";

/**
 * Chromium's location, when the bundled download is not what is installed:
 * a sandbox may ship a build number the installed Playwright does not expect,
 * with re-downloading blocked.
 */
export function chromiumExecutable(): string | undefined {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return undefined;
  for (const dir of readdirSync(base).sort().reverse()) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell", "chrome-linux64/chrome"]) {
      const p = join(base, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

/** A headless page with bpmn-js loaded. One per batch: launching per file dominates the runtime. */
export interface Renderer {
  /** bpmn-js's raw SVG for `xml`, and its import warnings. Throws when bpmn-js cannot import it. */
  render(xml: string): Promise<{ svg: string; warnings: string[] }>;
  close(): Promise<void>;
}

/**
 * Launch the renderer. `CHROMIUM_PATH` wins when set; otherwise the
 * `PLAYWRIGHT_BROWSERS_PATH` probe, then Playwright's own.
 */
export async function openRenderer(viewerBundle: string): Promise<Renderer> {
  const executablePath = process.env.CHROMIUM_PATH || chromiumExecutable();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page: Page = await browser.newPage();
  await page.setContent(`<!doctype html><html><body><div id="canvas"></div></body></html>`);
  await page.addScriptTag({ path: viewerBundle });
  return {
    render: (xml) =>
      page.evaluate(async (bpmnXml) => {
        const container = document.getElementById("canvas")!;
        container.innerHTML = "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Viewer = (window as any).BpmnJS;
        const viewer = new Viewer({ container });
        const result = await viewer.importXML(bpmnXml);
        const { svg } = await viewer.saveSVG({ format: true });
        viewer.destroy();
        return { svg, warnings: (result.warnings ?? []).map((w: Error) => w.message) };
      }, xml),
    close: () => browser.close(),
  };
}

/**
 * bpmn-js's SVG, made fit to publish: arrowhead ids renumbered (`<prefix>1`,
 * `<prefix>2`, …) so the output is deterministic; a white backdrop, because
 * outside the pool bpmn-js draws nothing and near-black strokes vanish on a
 * dark theme; and `width="100%"` with `height` DROPPED — an SVG presentation
 * attribute must be a length and "auto" is not one, so the ratio comes from
 * the `viewBox`. `undefined` when bpmn-js's output no longer has the shape
 * these edits expect, so a caller fails rather than publishing half of them.
 */
export function drawing(svg: string, markerPrefix: string): string | undefined {
  const markerIds = new Map<string, string>();
  const stable = svg.replace(/marker-[a-z0-9]{8,}/g, (id: string) => {
    if (!markerIds.has(id)) markerIds.set(id, `${markerPrefix}${markerIds.size + 1}`);
    return markerIds.get(id)!;
  });
  // The viewBox does not start at the origin, so the backdrop is placed in
  // viewBox coordinates — a 100%-sized rect at 0,0 would miss the right edge.
  const opaque = stable.replace(
    /(<svg[^>]*\sviewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"[^>]*>)/,
    (_m: string, tag: string, x: string, y: string, w: string, h: string) =>
      `${tag}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" />`,
  );
  const responsive = opaque.replace(
    /<svg([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"/,
    (_m: string, attrs: string) => `<svg${attrs} width="100%" style="max-width:100%;height:auto"`,
  );
  if (responsive === opaque || opaque === stable) return undefined;
  return responsive;
}

/**
 * Wrap a shape's `<g>` in an `<a>`, by counting `<g>` depth from the opening
 * tag to its own closing one.
 *
 * A regex cannot do this: a bpmn-js shape contains nested `<g>` elements, so
 * `</g>` first matches an inner one and the wrapper closes in the wrong place —
 * an SVG that still parses and is quietly mis-nested. The caller asserts the
 * count afterwards, so a shape that could not be found fails the render
 * rather than silently losing its link.
 */
export function wrapShapeInLink(svg: string, elementId: string, href: string): string {
  const open = new RegExp(`<g class="djs-element[^"]*" data-element-id="${elementId}"[^>]*>`);
  const m = open.exec(svg);
  if (!m) return svg;
  const start = m.index;
  let i = start + m[0].length;
  let depth = 1;
  const tag = /<g\b|<\/g>/g;
  tag.lastIndex = i;
  let t: RegExpExecArray | null;
  while (depth > 0 && (t = tag.exec(svg)) !== null) {
    depth += t[0] === "</g>" ? -1 : 1;
    i = t.index + t[0].length;
  }
  if (depth !== 0) return svg;
  const a = `<a class="fa-subprocess-link" href="${href}" target="_top">`;
  return svg.slice(0, start) + a + svg.slice(start, i) + "</a>" + svg.slice(i);
}

/** Every `bpmn:process` id in `xml`. */
export function processIds(xml: string): string[] {
  return [...xml.matchAll(/<bpmn:process\s+id="([^"]+)"/g)].map((m) => m[1]!);
}

/**
 * Links for the copy beside the source: a call activity links to the called
 * diagram's SVG when that diagram sits in the same directory, and to nothing
 * otherwise. `processFile` maps a process id to the absolute path of the
 * `.bpmn` defining it.
 */
export function siblingLinks(file: string, xml: string, processFile: Map<string, string>): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of xml.matchAll(/<bpmn:callActivity\b([^>]*)>/g)) {
    const id = /\sid="([^"]+)"/.exec(m[1]!)?.[1];
    const called = /\scalledElement="([^"]+)"/.exec(m[1]!)?.[1];
    const home = called ? processFile.get(called) : undefined;
    if (!id || !home) continue;
    if (dirname(home) !== dirname(file)) continue;
    out.set(id, `${basename(home, ".bpmn")}.svg`);
  }
  return out;
}

/** The picture to write beside `file`, or an error saying why there is none. */
export async function besideSource(
  r: Renderer,
  file: string,
  processFile: Map<string, string>,
): Promise<{ svg: string } | { error: string }> {
  const xml = readFileSync(file, "utf-8");
  let raw: { svg: string; warnings: string[] };
  try {
    raw = await r.render(xml);
  } catch (e) {
    return { error: (e instanceof Error ? e.message : String(e)).split("\n")[0]! };
  }
  if (raw.warnings.length) return { error: `${raw.warnings.length} import warning(s): ${raw.warnings.join("; ")}` };
  const drawn = drawing(raw.svg, "bpmn-marker-");
  if (!drawn) return { error: "could not make the SVG responsive — bpmn-js output changed shape" };
  const own = siblingLinks(file, xml, processFile);
  let local = drawn;
  for (const [id, href] of own) local = wrapShapeInLink(local, id, href);
  const n = (local.match(/class="fa-subprocess-link"/g) ?? []).length;
  if (n !== own.size) return { error: `${own.size} sibling link(s) to write but ${n} wrapped` };
  return { svg: local };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const repoAt = args.indexOf("--repo");
  const repo = resolve(repoAt >= 0 && args[repoAt + 1] ? args[repoAt + 1]! : join(import.meta.dir, "..", ".."));
  const tools = readKnowledgeGraphDeclaration(join(import.meta.dir, "..")) as Record<string, unknown> | undefined;
  const graphs = knowledgeGraphsIn(repo).filter(({ decl }) => tools !== undefined && supportsContent(tools, decl.name, decl.version));
  const sources = graphs.flatMap(({ root, decl }) =>
    (decl.directories ?? [])
      .filter((d) => d.graphKinds.includes("processes"))
      .flatMap((d) => {
        const dir = resolve(root, d.path);
        return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".bpmn")).map((f) => join(dir, f)) : [];
      }),
  );
  if (sources.length === 0) {
    console.error(`✗ no .bpmn in a processes subgraph of a graph these tools support, under ${repo} — nothing was drawn or checked.`);
    process.exit(2);
  }
  const viewer = join(repo, VIEWER_BUNDLE);
  if (!existsSync(viewer)) {
    console.error(`bpmn-js not installed (${viewer} missing). Run \`bun install\`.`);
    process.exit(1);
  }
  const processFile = new Map<string, string>();
  for (const f of sources) for (const id of processIds(readFileSync(f, "utf-8"))) processFile.set(id, f);
  const r = await openRenderer(viewer);
  let bad = 0;
  for (const file of sources.sort()) {
    const out = file.replace(/\.bpmn$/, ".svg");
    const shown = relative(repo, out);
    const got = await besideSource(r, file, processFile);
    if ("error" in got) {
      console.error(`✗ ${relative(repo, file)}: ${got.error}`);
      bad++;
      continue;
    }
    const prev = existsSync(out) ? readFileSync(out, "utf-8") : undefined;
    if (check) {
      if (prev !== got.svg) {
        console.error(`✗ ${shown} is stale — re-run without --check`);
        bad++;
      } else console.log(`✓ ${shown} up to date`);
      continue;
    }
    writeFileSync(out, got.svg);
    console.log(`${prev === got.svg ? "=" : "✓"} ${shown}`);
  }
  await r.close();
  if (bad > 0) process.exit(1);
}
