#!/usr/bin/env bun
/**
 * The latent-semantic-index viewer: one page for every committed LSI index,
 * and for which declared prose graphs need one.
 *
 * @covers qa
 *
 The page names the `qa` directory it renders and its Tool (`lsi-viewer`) in
 * front matter; since #1168 B7a-2b that is how a directory's viewer is found,
 * so the navbar row, the harness tile (titled by the directory's `tile:`) and
 * the published-graphs row appear with no further wiring (skill
 * `harness-tiles`). The indexes are sidecars under `test/results/lsi/`,
 * inside that directory, which is why the page renders it rather than a
 * directory of its own: a second declaration nested in a declared one is the
 * graph-inside-a-graph shape the directory conventions refuse.
 *
 * ## What it renders, and what it refuses to
 *
 * For each index: its size, the retained share, the pole terms of its first
 * dimensions, and its two findings (narrow dimensions, near-duplicates). A
 * dimension is shown as TWO poles and never given a name — method `lsi`,
 * refusal 2: a dimension is not a topic until a person names it. A dimension 1
 * with no negative pole is flagged as a probable margin (document length and
 * term frequency), the effect `correspondence-analysis` exists to remove.
 *
 * The need-an-index table shows each graph's VERDICT without its unit and word
 * counts, for the reason `GraphVerdict.stableDetail` gives: the page then
 * changes only when a verdict does, not on every edit to a prose graph.
 *
 *   bun run lsi:viz            # write cat-harness/docs/lsi/index.md
 *   bun run lsi:viz:check      # exit 1 if the committed page is stale
 *   ... --ref main|<sha>|pr/<n> # with no index in the checkout: which qa-reports entry to read
 *
 * With no `test/results/lsi/` in the checkout, both read the indexes from the
 * `qa-reports` branch ({@link readIndexes}). When that read is not a hit, both
 * exit 2 (could not determine) and write nothing.
 *
 * ## The page is BUILT, not committed — and what `--check` therefore asks
 *
 * Bean `tqjj`. It was committed until 2026-10-04, and that cost 319 of the
 * last 400 commits on `main`: the page is an aggregate of every index, so a
 * one-sentence edit to one of 229 skills restaged it. `skill-register.ts`
 * recorded the same thing from the other side — adding one skill left this
 * page stale and reddened `main` through this gate.
 *
 * Untracking the index sidecars does not fix that on its own, it moves it.
 * With no sidecar in the checkout this reads `qa-reports` at `main`, which
 * `qa-store` resolves to the LATEST published main entry — so a committed page
 * would go stale whenever anything else pushed to `main`, which is a value
 * that depends on WHEN the gate ran rather than on the tree. That is bean
 * `in5a`'s loop, and a declared merge pattern cannot settle it.
 *
 * So the page is written during the docs-site build, after that workflow's
 * `qa:fetch`, from THAT build's evidence — the same shape as
 * `state:visualizer` one step above it. `cat-harness/docs/lsi/` is ignored.
 *
 * `--check` therefore asks the question that remains answerable: **can the
 * page be drawn from this commit's evidence?** It cannot ask whether a
 * committed copy matches, because there is no committed copy; and a gate that
 * cannot fail is bean `xom7`, so it is not dropped either. It still fails on
 * the thing worth catching — an unreadable, missing or corrupt store, which is
 * how this whole arc breaks quietly.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  CHECKOUT_SOURCE,
  graphVerdict,
  INDEX_DIR,
  indexesInCheckout,
  proseGraphs,
  RUN_RECORD_DIR,
  sourceFromFiles,
  VIEWER_DIR,
  type IndexSource,
  type LsiSidecar,
} from "./lsi.ts";
import { readQaTree } from "./qa-store.ts";
import { JUDGEMENT_EXIT } from "./qa-results.ts";
import { handledDirectories, withRendersFrontMatter } from "./viewer-declarations.ts";

/** This generator's Tool node (`tools/viewers.ts`), named on every page it draws. */
const VIEWER_TOOL = "lsi-viewer";

const REPO = resolve(import.meta.dir, "../..");
const RESULTS = join(REPO, "cat-harness/test/results/lsi");
const OUT = join(VIEWER_DIR, "index.md");
const DIMS_SHOWN = 8;

function sidecars(dir = RESULTS, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sidecars(p, out);
    else if (e.name.endsWith(".lsi.json")) out.push(p);
  }
  return out.sort();
}

const code = (s: string): string => "`" + s + "`";
const esc = (s: string): string => s.replace(/\|/g, "\\|").replace(/</g, "&lt;");

/**
 * The indexes the page draws, and where they came from.
 *
 * ## The checkout first, then the store by ref, and a miss is never a page
 *
 * Bean `oq1j` (arc `3fva`, reader `R14`). The page draws the INDEXES, so it
 * needs them. With `test/results/lsi/` in the checkout it draws those, as it
 * always has. Without it, the indexes are on the `qa-reports` branch, and this
 * reads them by ref through `qa-store`, together with the run records the
 * verdict table needs. Anything but a hit is returned AS the answer: an
 * absent directory must not render as "0 committed indexes". That would be
 * a page about nothing, and in write mode it would replace the real page.
 *
 * It does not recompute the indexes, as `lsi:skills:check` does. A recomputed
 * page would change with every edit to any graph that needs an index (seven,
 * including all of `cat-harness/docs/`), and so every docs PR would stale a
 * committed page.
 */
export type IndexesRead =
  | { state: "hit"; from: string; files: string[]; src: IndexSource }
  | { state: "miss" | "corrupt" | "unknown"; reason: string };

export function readIndexes(ref = "main"): IndexesRead {
  if (indexesInCheckout()) return { state: "hit", from: "the checkout", files: sidecars(), src: CHECKOUT_SOURCE };
  const tree = readQaTree(ref, INDEX_DIR);
  if (tree.state !== "hit") return { state: tree.state, reason: `${INDEX_DIR}/ is not in the checkout, and the qa-reports branch at ${ref}: ${tree.reason}` };
  // The run records are optional on the branch as on disk: none is a
  // `not-run` verdict, which is never green. A corrupt or unknown read is
  // not "none", so it stops the page.
  const runs = readQaTree(ref, RUN_RECORD_DIR);
  if (runs.state === "corrupt" || runs.state === "unknown") return { state: runs.state, reason: `run records at ${ref}: ${runs.reason}` };
  const files = new Map([...tree.files, ...(runs.state === "hit" ? runs.files : [])]);
  return {
    state: "hit",
    from: `qa-reports ${tree.key}`,
    files: [...tree.files.keys()].filter((p) => p.endsWith(".lsi.json")).map((p) => join(REPO, p)).sort(),
    src: sourceFromFiles(files),
  };
}

/** The page, or why it could not be drawn. */
export function renderFrom(read: IndexesRead): { state: "hit"; page: string } | { state: "miss" | "corrupt" | "unknown"; reason: string } {
  if (read.state !== "hit") return read;
  return { state: "hit", page: draw(read) };
}

/** The page over the checkout's indexes. Throws when it cannot be drawn: a test or a caller must not get an empty page back. */
export function render(): string {
  const r = renderFrom(readIndexes());
  if (r.state !== "hit") throw new Error(`lsi viewer: ${r.state.toUpperCase()} — ${r.reason}`);
  return r.page;
}

function draw(read: Extract<IndexesRead, { state: "hit" }>): string {
  const indexes = read.files.map((f) => ({ file: f, s: JSON.parse(read.src.read(relative(REPO, f).split("\\").join("/"))!) as LsiSidecar }));
  const verdicts = proseGraphs().map((t) => ({ t, v: graphVerdict(t, read.src) }));
  const needing = verdicts.filter(({ v }) => v.result === "fail").length;
  const units = indexes.reduce((n, { s }) => n + s.units, 0);

  const L: string[] = [];
  L.push("---");
  L.push('title: "Latent semantic indexes"');
  L.push('description: "Every published LSI index over a declared prose graph — its latent dimensions, its findings, and which graphs still need one."');
  L.push("---");
  L.push("<style>");
  L.push(".lv-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}");
  L.push(".lv-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}");
  L.push(".lv-stat b{display:block;font-size:1.25rem;line-height:1.2}");
  L.push(".lv-stat span{font-size:.75rem;opacity:.75}");
  // Light tints for the site's DARK scheme (#27262b): #5fd3b8 is ~8:1 and
  // #ff9486 ~6.9:1. The methodologies viewer's #0d6e5e / #a8200f measured
  // 2.4 / 2.1:1 there (its wireframe, finding 6), so they are not reused; the
  // word carries the state either way.
  L.push(".lv-pass{color:#5fd3b8;font-weight:600}.lv-fail{color:#ff9486;font-weight:600}.lv-na{opacity:.8}");
  L.push("</style>");
  L.push("");
  L.push("A **latent semantic index** places every unit of a prose graph — a library");
  L.push("section, a skill, a bean — in a space built from which words occur");
  L.push("together, so units that discuss the same thing in *different words* sit");
  L.push("close. It is a retrieval aid: every neighbour and finding below is a");
  L.push("**proposal**, never a relation the graph asserts.");
  L.push("");
  L.push("The method is [Latent Semantic Indexing](../methodologies/) (node " + code("lsi") + "), with");
  L.push("[correspondence analysis](../methodologies/) (node " + code("correspondence-analysis") + ") as its parallel track;");
  L.push("how to build, query and audit an index is the skill " + code("lsi-indexing") + ".");
  L.push("");
  L.push('<div class="lv-grid">');
  L.push('<div class="lv-stat"><b>' + indexes.length + "</b><span>committed indexes</span></div>");
  L.push('<div class="lv-stat"><b>' + units + "</b><span>units indexed</span></div>");
  L.push('<div class="lv-stat"><b>' + needing + "</b><span>graphs that need an index and lack a fresh one</span></div>");
  L.push("</div>");
  L.push("");
  L.push("## Which graphs need an index");
  L.push("");
  L.push("A graph needs one at 100 units and 20,000 words — a house threshold, with its");
  L.push("basis in " + code("scripts/lsi.ts") + ". Below it a graph is **not judged**, which is not");
  L.push("the same as fine. The same verdict is " + code("kg:audit") + "'s " + code("tool-downstream-fresh") + " for the " + code("lsi-index") + " Tool.");
  L.push("");
  L.push("| graph | verdict | detail |");
  L.push("|---|---|---|");
  for (const { t, v } of verdicts) {
    const cls = v.result === "pass" ? "lv-pass" : v.result === "fail" ? "lv-fail" : "lv-na";
    L.push("| " + code(t.instance + "/" + t.id) + ' | <span class="' + cls + '">' + v.result + "</span> | " + esc(v.stableDetail) + " |");
  }
  L.push("");
  for (const { file, s } of indexes) {
    L.push("## " + s.instance + " / " + s.graph + (s.docs ? " — " + s.docs.join(", ") : ""));
    L.push("");
    L.push(
      "**" + s.units + "** units · **" + s.terms + "** terms · k = **" + s.k + "** · retains **" +
        (s.retained * 100).toFixed(1) + " %** of the weighted matrix · weighting " + code(String(s.options.weighting)) +
        " · sidecar " + code(relative(REPO, file)),
    );
    L.push("");
    const d1 = s.dimensions[0];
    if (d1 && d1.negative.length === 0)
      L.push("> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.\n");
    L.push("Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.");
    L.push("");
    L.push("| dim | σ | one pole | the other pole |");
    L.push("|---|---|---|---|");
    for (const d of s.dimensions.slice(0, DIMS_SHOWN))
      L.push("| " + d.dim + " | " + d.sigma.toFixed(2) + " | " + esc(d.positive.join(", ")) + " | " + (d.negative.length ? esc(d.negative.join(", ")) : "*(none)*") + " |");
    L.push("");
    const nd = s.findings.narrowDimensions;
    const dup = s.findings.nearDuplicates;
    L.push("**Findings** — " + nd.length + " narrow dimension(s), " + dup.length + " near-duplicate pair(s).");
    L.push("");
    if (nd.length) {
      L.push("*Narrow dimensions* — carried by very few units; usually boilerplate, specimen text or a bad page:");
      L.push("");
      for (const n of nd) L.push("- dimension " + n.dim + ": " + n.units.map((u) => code(u)).join(", "));
      L.push("");
    }
    if (dup.length) {
      L.push("*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:");
      L.push("");
      for (const p of dup.slice(0, 15)) L.push("- " + p.cosine.toFixed(3) + " — " + code(p.a) + " ~ " + code(p.b));
      if (dup.length > 15) L.push("- … and " + (dup.length - 15) + " more in the sidecar");
      L.push("");
    }
  }
  L.push("---");
  L.push("");
  // Named from the READ rather than hardcoded: the page says which evidence it
  // was drawn from, because "the checkout" and a `qa-reports` entry are
  // different claims and a reader cannot tell them apart from the prose.
  L.push("Generated by " + code("bun run lsi:viz") + " during the docs-site build, from " + read.from + ". Committed nowhere: " + code("lsi:viz:check") + " asks whether this page can be drawn, not whether a stored copy matches (bean " + code("tqjj") + ").");
  // The page names the directory it draws and the Tool that drew it (#1168
  // B7a-2b): the `qa` tree the sidecars live in, read from the declaration
  // rather than spelled here. The directory no longer names this page; a
  // reader derives the viewer from these two lines.
  const drawn = handledDirectories(REPO, join(REPO, "cat-harness"), "qa");
  return withRendersFrontMatter(L.join("\n") + "\n", drawn, VIEWER_TOOL);
}

if (import.meta.main) {
  const refAt = process.argv.indexOf("--ref");
  const ref = refAt > 0 ? process.argv[refAt + 1] : undefined;
  if (refAt > 0 && !ref) {
    console.error("usage: gen-lsi-viz.ts [--check] [--ref main|<sha>|pr/<n>]");
    process.exit(JUDGEMENT_EXIT.error);
  }
  const read = readIndexes(ref);
  const drawn = renderFrom(read);
  if (drawn.state !== "hit") {
    // Neither "stale" nor "current", and never a page written from nothing.
    console.error(
      `lsi viewer: ${drawn.state.toUpperCase()} — could not determine; this is NOT a pass, and nothing was written.\n` +
        `  ${drawn.reason}\n` +
        "  The page draws the indexes, and none could be read. `bun run qa:fetch` materialises them, or `bun run lsi index` rebuilds them.",
    );
    process.exit(JUDGEMENT_EXIT.unknown);
  }
  const page = drawn.page;
  if (read.state === "hit" && read.from !== "the checkout") console.log(`lsi viewer: indexes read from ${read.from}`);
  if (process.argv.includes("--check")) {
    // Not a comparison. The page is not committed (see the module docblock),
    // so there is nothing to compare it WITH; the unknown branch above is the
    // failing one, and reaching here means the evidence was read and the page
    // composed. The byte count is printed so a run that drew an empty page
    // would be visible rather than merely green.
    console.log(`lsi viewer: ${relative(REPO, OUT)} can be drawn from ${read.from} (${page.length} bytes); it is written by the docs-site build`);
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, page);
    console.log("lsi viewer → " + relative(REPO, OUT));
  }
}
