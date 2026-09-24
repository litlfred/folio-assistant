/**
 * Render BPMN 2.0 sources to standalone SVG.
 *
 * The `.bpmn` files under `processes/` are the source of truth — they are
 * plain BPMN 2.0 with diagram interchange, so they open in bpmn.io, Camunda
 * Modeler, or any other BPMN tool. This script rasterises them to SVG for the
 * docs site and for GitHub's Markdown renderer, which cannot draw BPMN itself.
 *
 * Usage:  bun run cat-harness/scripts/render-bpmn.ts [--check]
 *
 * `--check` renders to memory and fails if a committed SVG is stale, so CI can
 * catch a `.bpmn` edit that never had its SVG regenerated.
 *
 * Never hand-edit `docs/assets/img/workflows/*.svg` — regenerate instead.
 *
 * @covers processes
 */
import { chromium } from "@playwright/test";
import { workflowFiles } from "./known-skills.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { chromiumExecutable } from "./bpmn-render";
import { checkXmlComments } from "./xml-comment-check";
import { siteDirFor, repoRootFor } from "../schemas/cat-harness.ts";
import { ownElementPattern } from "../schemas/namespaces.js";

const ROOT = resolve(import.meta.dir, "..");
/**
 * The `.bpmn` sources, from EVERY directory the instance declares as holding
 * its knowledge graph — not from the literal `processes/`.
 *
 * `workflowFiles` returns absolute paths, so `file` below is already complete
 * and nothing joins it to a base. That is the point: a topical layout
 * (`bootstrap/processes/`, `crdm/workflows/`) is found without this script
 * knowing the layout exists.
 *
 * Output names are still the BASENAME, which is a latent collision if two
 * declared directories ever hold a diagram of the same name — today there is
 * one such directory, so it is not a live defect, and naming it here is
 * cheaper than a scheme nobody needs yet.
 */
function bpmnSources(): string[] {
  return workflowFiles(ROOT).filter((f) => f.endsWith(".bpmn")).sort();
}
const OUT_DIR = join(ROOT, siteDirFor(ROOT), "assets/img/workflows");
// `node_modules/` is a REPOSITORY artefact — it sits beside `package.json` and
// `bun.lock`, which is where `bun install` writes it, and there is one per
// repository however many instances it holds. `ROOT` is this instance's root
// since the move (bean `wggr`), so joining here looked for
// `cat-harness/node_modules/` and reported bpmn-js as not installed.
//
// The message was the honest kind and still misleading: it named the exact
// missing file and told you to run `bun install`, which would not have helped
// because the package was already there, one level up.
const VIEWER = join(
  repoRootFor(ROOT),
  "node_modules/bpmn-js/dist/bpmn-viewer.production.min.js",
);

const check = process.argv.includes("--check");

if (!existsSync(VIEWER)) {
  console.error(
    `bpmn-js not installed (${VIEWER} missing).\n` +
      `Run \`bun install\` — bpmn-js is a devDependency.`,
  );
  process.exit(1);
}

const sources = bpmnSources();
if (sources.length === 0) {
  console.error("No .bpmn sources found in any declared knowledge-graph directory");
  process.exit(1);
}

// Well-formedness before rendering, and before the browser launch: a diagram a
// conformant parser rejects is broken whether or not an SVG comes out of it,
// and bpmn-js will draw it regardless (that is how seven of these shipped).
// Reporting it here costs nothing and does not need Chromium.
const commentFindings = sources.flatMap((f) =>
  checkXmlComments(readFileSync(f, "utf8"), relative(ROOT, f)),
);
if (commentFindings.length > 0) {
  console.error(`${commentFindings.length} malformed XML comment(s) — refusing to render:\n`);
  for (const f of commentFindings) console.error(`  ${f.file}:${f.line}  ${f.detail}`);
  console.error(`\nRun \`bun run check:xml-comments\` for the full report.`);
  process.exit(1);
}

// Honour an explicitly provided Chromium when the sandbox ships a build that
// does not match the version @playwright/test pins (CHROMIUM_PATH=/path/to/chrome).
//
// Falling back to a probe of PLAYWRIGHT_BROWSERS_PATH, because an explicit
// variable only helps someone who already knows the build numbers disagree.
// Without it this gate fails on a sandbox that *has* a usable Chromium, with an
// error telling the reader to re-download browsers — which is blocked here.
const executablePath = process.env.CHROMIUM_PATH || chromiumExecutable();
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><body><div id="canvas"></div></body></html>`);
await page.addScriptTag({ path: VIEWER });

/**
 * Map every `bpmn:process` id to the file that defines it, so a call activity's
 * `calledElement` can be resolved to a diagram rather than to a bare id.
 */
const processHome = new Map<string, string>();
for (const file of sources) {
  const xml = await readFile(file, "utf8");
  for (const m of xml.matchAll(/<bpmn:process\s+id="([^"]+)"/g)) {
    processHome.set(m[1], basename(file, ".bpmn"));
  }
}

/**
 * Where a call activity should take a reader who clicks it.
 *
 * `<cat-harness.processes:link href="…"/>` on the activity wins — that is how a page says "the
 * section for this subprocess is here", which is the useful destination when
 * the diagram is embedded in a docs page.
 *
 * Without one, fall back to the called process's own rendered SVG. That is
 * always correct and needs no knowledge of any page, so a folio that has not
 * declared links still gets working navigation.
 */
function subprocessLinks(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  const link = ownElementPattern(xml, "link", String.raw`\s+href="([^"]+)"\s*\/?>`, "");
  for (const m of xml.matchAll(/<bpmn:callActivity\b([^>]*)>([\s\S]*?)<\/bpmn:callActivity>/g)) {
    const id = /\sid="([^"]+)"/.exec(m[1])?.[1];
    if (!id) continue;
    const explicit = link.exec(m[2])?.[1];
    if (explicit) {
      out.set(id, explicit);
      continue;
    }
    const called = /\scalledElement="([^"]+)"/.exec(m[1])?.[1];
    const home = called ? processHome.get(called) : undefined;
    // Fallback, and it is a WEAK one on purpose. Linking to the rendered SVG
    // of the called process at least takes the reader somewhere true, but a
    // bare file has no page chrome and no prose around it — the destination
    // you actually want is the section that documents that subprocess, which
    // only the model can name. So prefer `<cat-harness.processes:link>`; this is what happens
    // when nobody wrote one.
    //
    // The path is asset-relative, which assumes the embedding page sits at
    // the docs root. Every page that embeds a diagram today does. A page in
    // `guides/` or `reference/` would need `../`, so if one ever embeds a
    // diagram whose call activity has no explicit link, give it one.
    if (home) out.set(id, `assets/img/workflows/${home}.svg`);
  }
  return out;
}

/**
 * Wrap a shape's `<g>` in an `<a>`, by counting `<g>` depth from the opening
 * tag to its own closing one.
 *
 * A regex cannot do this: a bpmn-js shape contains nested `<g>` elements, so
 * `</g>` first matches an inner one and the wrapper closes in the wrong place —
 * which produces an SVG that still parses and is quietly mis-nested. The caller
 * asserts the count afterwards, so a shape that could not be found fails the
 * render rather than silently losing its link.
 */
function wrapShapeInLink(svg: string, elementId: string, href: string): string {
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

let stale = 0;

for (const file of sources) {
  const xml = await readFile(file, "utf8");
  let rendered: { svg: string; warnings: string[] };
  try {
    rendered = await page.evaluate(async (bpmnXml) => {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${file}: ${msg.split("\n")[0]}`);
    process.exitCode = 1;
    continue;
  }

  const { svg, warnings } = rendered;

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

  // `height` is DROPPED rather than set to "auto". An SVG presentation
  // attribute must be a length, and "auto" is not one: every browser logged
  //   Error: <svg> attribute height: Expected length, "auto".
  // on every page carrying a diagram. The rendering survived only because the
  // inline `style` beside it is CSS, where `height:auto` IS valid and wins
  // over the attribute anyway — so the attribute was contributing nothing but
  // the error. With it gone the intrinsic ratio comes from `viewBox`, which
  // is what sizes the element in both the `<img>` case and the inlined-`<svg>`
  // case that docs-ui.js produces.
  const responsive = opaque.replace(
    /<svg([^>]*?)\swidth="[\d.]+"\sheight="[\d.]+"/,
    (_m: string, attrs: string) =>
      `<svg${attrs} width="100%" style="max-width:100%;height:auto"`,
  );
  if (responsive === opaque || opaque === stable) {
    console.error(`✗ ${file}: could not make the SVG responsive — bpmn-js output changed shape`);
    process.exitCode = 1;
    continue;
  }

  // A subprocess box is a navigation affordance, not decoration: clicking it
  // should take the reader to that subprocess. Only useful once the SVG is live
  // in the DOM — inside an `<img>` it is inert — which docs-ui.js arranges by
  // inlining these figures.
  const links = subprocessLinks(xml);
  let linked = responsive;
  for (const [id, href] of links) linked = wrapShapeInLink(linked, id, href);
  const wrapped = (linked.match(/class="fa-subprocess-link"/g) ?? []).length;
  if (wrapped !== links.size) {
    console.error(
      `✗ ${file}: ${links.size} call activit(ies) to link but ${wrapped} wrapped — ` +
        `bpmn-js shape markup changed, so the links would be silently missing`,
    );
    process.exitCode = 1;
    continue;
  }

  const out = join(OUT_DIR, `${basename(file, ".bpmn")}.svg`);
  const previous = existsSync(out) ? await readFile(out, "utf8") : null;

  if (check) {
    if (previous !== linked) {
      console.error(`✗ ${basename(out)} is stale — re-run \`bun run render:bpmn\``);
      stale++;
    } else {
      console.log(`✓ ${basename(out)} up to date`);
    }
    continue;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(out, linked, "utf8");
  console.log(`${previous === linked ? "=" : "✓"} ${basename(out)}`);
}

await browser.close();
if (stale > 0) process.exit(1);
