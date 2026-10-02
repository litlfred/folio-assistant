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
 * The drawing itself — bpmn-js in headless Chromium, made byte-stable and
 * responsive, and a shape wrapped in a link — is bootstrap-tools'
 * `scripts/render-bpmn.ts` (one copy of the writers, in the tools
 * repository: bean `xsqm`). This is the SITE half: every instance's
 * diagrams, into this site's `workflows/`, with call activities linking to
 * this site's pages.
 *
 * @covers processes
 *
 * @conformsTo omg-bpmn-2.0
 * @conformsTo omg-dd-1.0
 */
import { workflowFiles } from "./known-skills.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import {
  besideSource as besideSourceSvg,
  drawing,
  openRenderer,
  VIEWER_BUNDLE,
  wrapShapeInLink,
} from "../../bootstrap-tools/scripts/render-bpmn.ts";
import { checkXmlComments } from "./xml-comment-check";
import {
  siteDirFor,
  repoRootFor,
  instanceRootsIn,
  findInstanceRoot,
  readDeclaration,
  isExemptFrom,
} from "../schemas/cat-harness.ts";
import { processPresentations, processTarget } from "./process-presentations.js";

const ROOT = resolve(import.meta.dir, "..");
/**
 * The `.bpmn` sources, from EVERY instance in the repository — each one's
 * declared knowledge-graph directories, via `workflowFiles` — not from the
 * literal `processes/`, and not from this instance alone.
 *
 * `workflowFiles` returns absolute paths, so `file` below is already complete
 * and nothing joins it to a base. That is the point: a topical layout
 * (`bootstrap/processes/`, `crdm/workflows/`) is found without this script
 * knowing the layout exists.
 *
 * Every instance, not just this one, since bean `oqdr` (2026-09-26): bootstrap
 * is a separate instance, so `workflowFiles(ROOT)` never reached its three
 * diagrams. Their SVGs sat in this site's `workflows/` rendered by nothing —
 * `initialize-harness.svg` went ten source commits stale, still drawing the
 * pre-rename role — and `render:bpmn:check`, which checks only what this
 * function returns, could not see it. The same walk `audit-coverage` and
 * `check-asset-roles` already do.
 *
 * Output names are the BASENAME, so two instances holding a diagram of the
 * same name would silently overwrite one SVG with the other. That was
 * "latent" while one directory fed this; with every instance feeding it, it
 * is refused rather than trusted.
 */
function bpmnSources(): string[] {
  const all = new Set<string>();
  for (const inst of instanceRootsIn(repoRootFor(ROOT))) {
    for (const f of workflowFiles(inst)) if (f.endsWith(".bpmn")) all.add(f);
  }
  const byName = new Map<string, string[]>();
  for (const f of all) byName.set(basename(f), [...(byName.get(basename(f)) ?? []), f]);
  const clashes = [...byName].filter(([, fs]) => fs.length > 1);
  if (clashes.length > 0) {
    throw new Error(
      "render-bpmn: two diagrams would render to the same SVG name:\n" +
        clashes.map(([n, fs]) => `  ${n}: ${fs.join(", ")}`).join("\n"),
    );
  }
  return [...all].sort();
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
const VIEWER = join(repoRootFor(ROOT), VIEWER_BUNDLE);

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

// `CHROMIUM_PATH` wins when set, then a probe of PLAYWRIGHT_BROWSERS_PATH: an
// explicit variable only helps someone who already knows the build numbers
// disagree, and re-downloading browsers is blocked in the sandbox.
const renderer = await openRenderer(VIEWER);

/**
 * Map every `bpmn:process` id to the file that defines it, so a call activity's
 * `calledElement` can be resolved to a diagram rather than to a bare id.
 */
const processHome = new Map<string, string>();
const processFile = new Map<string, string>();
/** The same, as absolute paths — what the beside-the-source links compare. */
const processPath = new Map<string, string>();
for (const file of sources) {
  const xml = await readFile(file, "utf8");
  for (const m of xml.matchAll(/<bpmn:process\s+id="([^"]+)"/g)) {
    processHome.set(m[1], basename(file, ".bpmn"));
    processFile.set(m[1], relative(ROOT, file));
    processPath.set(m[1], file);
  }
}

/** Page sections presenting each diagram, keyed as a page spells its source. */
const presentations = await processPresentations(ROOT);

/**
 * From a rendered SVG back up to the site root. Every link is written
 * relative to the SVG FILE, so it resolves correctly when the file is opened
 * on its own; `docs-ui.js` re-anchors it to the file's URL when it inlines the
 * drawing into a page, which may sit at any depth (the docs root, or
 * `processes/`). A link written relative to the page instead worked from the
 * docs root and broke under `processes/` — bean `xl55`.
 */
const SITE_UP = `${relative(OUT_DIR, join(ROOT, siteDirFor(ROOT))).split("\\").join("/")}/`;

/**
 * Where a call activity should take a reader who clicks it.
 *
 * DERIVED from the pages, never authored on the process: the page section
 * whose `asset.source` names the called diagram, or — when none does, or more
 * than one — the called process's own generated page
 * (`process-presentations.ts`). The process names no page; the page names
 * the process (data-modelling step 8, bean `xl55`).
 */
function subprocessLinks(xml: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of xml.matchAll(/<bpmn:callActivity\b([^>]*)>/g)) {
    const id = /\sid="([^"]+)"/.exec(m[1])?.[1];
    const called = /\scalledElement="([^"]+)"/.exec(m[1])?.[1];
    if (!id || !called) continue;
    const home = processHome.get(called);
    if (!home) continue;
    out.set(id, SITE_UP + processTarget(home, presentations.get(processFile.get(called)!)));
  }
  return out;
}

/**
 * Diagrams that ALSO get an SVG beside their own `.bpmn`.
 *
 * An instance exempt from the `workflow-visualiser` obligation has no site of
 * its own, so this site's `workflows/` copy is the only drawing of its
 * diagrams, and its README cannot link to it: an instance's README links only
 * inside the instance, and the link would break the day the instance becomes
 * a repository of its own. Owner, 2026-09-29: *"display bpmn(s) etc in
 * README.md"*. Keyed on the declared exemption, never on an instance's name.
 */
const besideSource = new Set(
  sources.filter((f) => {
    const inst = findInstanceRoot(dirname(f));
    const decl = inst ? readDeclaration(inst) : undefined;
    return decl !== undefined && isExemptFrom(decl, "workflow-visualiser");
  }),
);

let stale = 0;

/** Write `text` to `out`, or with `--check` report whether it is current. */
async function emit(out: string, text: string): Promise<void> {
  const previous = existsSync(out) ? await readFile(out, "utf8") : null;
  const shown = relative(repoRootFor(ROOT), out);
  if (check) {
    if (previous !== text) {
      console.error(`✗ ${shown} is stale — re-run \`bun run render:bpmn\``);
      stale++;
    } else {
      console.log(`✓ ${shown} up to date`);
    }
    return;
  }
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, text, "utf8");
  console.log(`${previous === text ? "=" : "✓"} ${shown}`);
}

for (const file of sources) {
  const xml = await readFile(file, "utf8");
  let rendered: { svg: string; warnings: string[] };
  try {
    rendered = await renderer.render(xml);
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

  // Deterministic arrowhead ids, a white backdrop and a responsive width —
  // bootstrap-tools' `drawing`, which says why each is there.
  const responsive = drawing(svg, "folio-marker-");
  if (responsive === undefined) {
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

  await emit(join(OUT_DIR, `${basename(file, ".bpmn")}.svg`), linked);

  if (besideSource.has(file)) {
    // bootstrap-tools' OWN writer, not a copy of it. The two used to be
    // separate implementations of the same picture, and they drifted the day
    // bootstrap-tools began stamping "Generated by bootstrap-tools" on what it
    // writes into bootstrap (bean `xsqm`, owner 2026-09-30): this copy wrote the
    // SVG without the note, so each writer called the other's output stale and
    // `render:bpmn:check` went red on main. One writer, one set of bytes.
    const own = await besideSourceSvg(renderer, file, processPath);
    if ("error" in own) {
      console.error(`✗ ${file}: ${own.error}`);
      process.exitCode = 1;
      continue;
    }
    await emit(file.replace(/\.bpmn$/, ".svg"), own.svg);
  }
}

await renderer.close();
if (stale > 0) process.exit(1);
