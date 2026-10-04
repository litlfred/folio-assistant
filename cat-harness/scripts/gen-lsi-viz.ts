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
 * ## Two pages from one generator: the committed one, and `--detail`
 *
 * Bean `tqjj`. Until 2026-10-04 this wrote ONE page and committed all of it,
 * and that cost 319 of the last 400 commits on `main`. `skill-register.ts`
 * recorded the same finding from the other side: adding one skill left the
 * page stale and reddened `main` through this gate.
 *
 * The split is by **what a value is a function of**, and the test is whether a
 * corpus edit moves it:
 *
 * | part | a function of | committed |
 * |---|---|---|
 * | front matter, prose, the method links | this file | yes |
 * | which graphs NEED an index | the TREE (`needOf`) | yes |
 * | each index's freshness verdict | the STORE | no |
 * | units, terms, retained, σ, pole terms, cosines | an index's CONTENT | no |
 *
 * The committed page reads **no index at all**, and the line between rows 2
 * and 3 is where the first draft of this got it wrong. Computing the verdict
 * from the tree instead (`graphVerdict` with an absent source takes its
 * compute-and-judge branch) does make the answer machine-independent — and
 * turns the page's only finding into a lie: `cat-harness/docs` went from
 * "needs an LSI index and has none" to **pass**, because an index recomputed
 * in the run is fresh by construction. The tile went 4 → 0. A value that is
 * stable because it can no longer say anything is not a measurement.
 *
 * Whether a graph NEEDS one is a different question and genuinely tree-
 * determined: `needOf` counts the graph's units and words against the
 * thresholds, reads nothing else, and a graph crossing one is a change worth
 * seeing in a diff. Whether the index it needs is FRESH is irreducibly about
 * the store, so it is drawn with the detail. Keeping it committed was the trap
 * on the way out: with no sidecar in the checkout the same commit would say
 * "fresh" on a container holding a working copy and "stale" in CI reading
 * `qa-reports` at `main`, which `qa-store` resolves to the LATEST published
 * entry — a value depending on when the gate ran rather than on the tree,
 * which is bean `in5a`'s loop arriving over the network.
 *
 * `--detail` adds the per-index sections and is run by the docs-site build,
 * after that workflow's `qa:fetch` pins the entry to the build's own sha. So
 * the published page carries everything a reader wants and `main` carries
 * nothing that a one-sentence skill edit moves. The same shape as
 * `state:visualizer` one step above it in that workflow.
 *
 * `--check` keeps its ordinary meaning — is the committed page current — and
 * is therefore still a gate that fails (bean `xom7`). `--detail --check`
 * additionally reports whether the detail could be drawn at all; anything but
 * a hit is exit 2, never a pass.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import {
  CHECKOUT_SOURCE,
  graphVerdict,
  INDEX_DIR,
  indexesInCheckout,
  needOf,
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

/** The DETAIL page, or why it could not be drawn. */
export function renderFrom(read: IndexesRead): { state: "hit"; page: string } | { state: "miss" | "corrupt" | "unknown"; reason: string } {
  if (read.state !== "hit") return read;
  return { state: "hit", page: draw(read) };
}

/**
 * The COMMITTED page. It reads no index, so it cannot fail for want of one and
 * takes no `ref`: everything on it is derived from this tree.
 */
export function renderCommitted(): string {
  return draw();
}

/** The detail page over whatever indexes are reachable. Throws when it cannot be drawn: a test or a caller must not get an empty page back. */
export function render(): string {
  const r = renderFrom(readIndexes());
  if (r.state !== "hit") throw new Error(`lsi viewer: ${r.state.toUpperCase()} — ${r.reason}`);
  return r.page;
}

function draw(read?: Extract<IndexesRead, { state: "hit" }>): string {
  // No index is read unless `--detail` supplied one. The verdict table is
  // computed from the tree either way, so the committed page and the built
  // page agree on it line for line and differ only by the detail sections.
  const indexes = (read?.files ?? []).map((f) => ({ file: f, s: JSON.parse(read!.src.read(relative(REPO, f).split("\\").join("/"))!) as LsiSidecar }));
  // Committed: `needOf` only — the tree. With `--detail`: `graphVerdict` over
  // the indexes that were read, which adds the freshness column. See the
  // module docblock for why those are two questions and not one.
  const rows = proseGraphs().map((t) => {
    const need = needOf(t);
    return { t, need, v: read ? graphVerdict(t, read.src) : undefined };
  });
  const needing = read ? rows.filter((r) => r.v!.result === "fail").length : rows.filter((r) => r.need.needed).length;

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
  L.push("close. It is a retrieval aid: every neighbour and finding it reports is a");
  L.push("**proposal**, never a relation the graph asserts.");
  L.push("");
  L.push("The method is [Latent Semantic Indexing](../methodologies/) (node " + code("lsi") + "), with");
  L.push("[correspondence analysis](../methodologies/) (node " + code("correspondence-analysis") + ") as its parallel track;");
  L.push("how to build, query and audit an index is the skill " + code("lsi-indexing") + ".");
  L.push("");
  // ONE tile, and the two that went are the point of bean `tqjj`: "committed
  // indexes" and "units indexed" both move when any file is added to any
  // indexed graph, which is the `y7b3` class. What is left is a verdict count
  // — it moves when a graph crosses the threshold or a verdict flips, which is
  // a change worth seeing in a diff.
  L.push('<div class="lv-grid">');
  L.push('<div class="lv-stat"><b>' + needing + "</b><span>" + (read ? "graphs that need an index and lack a fresh one" : "graphs that need an index") + "</span></div>");
  L.push("</div>");
  L.push("");
  L.push("## Which graphs need an index");
  L.push("");
  L.push("A graph needs one at 100 units and 20,000 words — a house threshold, with its");
  L.push("basis in " + code("scripts/lsi.ts") + ". Below it a graph is **not judged**, which is not");
  L.push("the same as fine. The same verdict is " + code("kg:audit") + "'s " + code("tool-downstream-fresh") + " for the " + code("lsi-index") + " Tool.");
  L.push("");
  if (!read) {
    L.push("Whether an index is **fresh** is a question about the store, not about");
    L.push("this tree, so it is not on this committed page — the published one carries");
    L.push("it, drawn from the evidence that build fetched.");
    L.push("");
  }
  L.push(read ? "| graph | needs one | verdict | detail |" : "| graph | needs one |");
  L.push(read ? "|---|---|---|---|" : "|---|---|");
  for (const { t, need, v } of rows) {
    // `needOf` returns the n/a verdict itself when a graph does not need one,
    // so its own words are used rather than restated here.
    // Plain bold, NOT `lv-fail`. Needing an index is not a failure — the
    // failure is needing one and lacking a fresh one, which is the `verdict`
    // column and only exists with `--detail`. Colouring this one red would
    // read as 8 defects on a page whose own threshold prose says a graph below
    // it is *not judged*, which is not the same as fine.
    const needs = need.needed ? "**yes**" : '<span class="lv-na">' + esc(need.verdict.stableDetail) + "</span>";
    const cells = [code(t.instance + "/" + t.id), needs];
    if (v) {
      const cls = v.result === "pass" ? "lv-pass" : v.result === "fail" ? "lv-fail" : "lv-na";
      cells.push('<span class="' + cls + '">' + v.result + "</span>", esc(v.stableDetail));
    }
    L.push("| " + cells.join(" | ") + " |");
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
  // Named from the READ rather than hardcoded: the page says which evidence the
  // detail came from, because "the checkout" and a `qa-reports` entry are
  // different claims and a reader cannot tell them apart from the prose.
  if (read) {
    L.push(
      "Generated by " + code("bun run lsi:viz -- --detail") + " during the docs-site build, with each index's freshness and detail read from " + read.from + ". " +
        "The committed page in the repository carries the first two columns only — those are a function of the tree, and these are a function of the store. Bean " + code("tqjj") + ".",
    );
  } else {
    L.push(
      "Generated by " + code("bun run lsi:viz") + ", and this is the committed half: the front matter, the prose, and which graphs need an index — every part of it a function of the TREE. " +
        "Each index's freshness is a question about the store, and its size, retained share, dimension poles and findings are a function of the index's CONTENT, which a one-sentence edit to any indexed graph moves. " +
        "The docs-site build adds both with " + code("--detail") + ", from the evidence it fetched for its own commit. Bean " + code("tqjj") + ".",
    );
  }
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
    console.error("usage: gen-lsi-viz.ts [--check] [--detail] [--ref main|<sha>|pr/<n>]");
    process.exit(JUDGEMENT_EXIT.error);
  }
  const check = process.argv.includes("--check");
  const detail = process.argv.includes("--detail");

  let page: string;
  if (detail) {
    const read = readIndexes(ref);
    const drawn = renderFrom(read);
    if (drawn.state !== "hit") {
      // Neither "stale" nor "current", and never a page written from nothing.
      console.error(
        `lsi viewer: ${drawn.state.toUpperCase()} — could not determine; this is NOT a pass, and nothing was written.\n` +
          `  ${drawn.reason}\n` +
          "  `--detail` draws the indexes, and none could be read. `bun run qa:fetch` materialises them, or `bun run lsi index` rebuilds them.",
      );
      process.exit(JUDGEMENT_EXIT.unknown);
    }
    page = drawn.page;
    if (read.state === "hit") console.log(`lsi viewer: per-index detail read from ${read.from}`);
  } else {
    // No index is read, so there is nothing to be unavailable: the committed
    // page is a function of the tree alone (module docblock).
    page = renderCommitted();
  }

  if (check) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (cur !== page) {
      console.error(
        relative(REPO, OUT) +
          (detail
            ? " differs from the DETAIL page — that is expected: the detail is added by the docs-site build and is not committed."
            : " is stale — run `bun run lsi:viz` and commit it."),
      );
      process.exit(detail ? JUDGEMENT_EXIT.ok : 1);
    }
    console.log("lsi viewer: " + relative(REPO, OUT) + " is current");
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, page);
    console.log("lsi viewer → " + relative(REPO, OUT) + (detail ? " (with per-index detail)" : ""));
  }
}
