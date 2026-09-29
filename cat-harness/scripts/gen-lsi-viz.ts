#!/usr/bin/env bun
/**
 * The latent-semantic-index viewer: one page for every committed LSI index,
 * and for which declared prose graphs need one.
 *
 * @covers qa
 *
 * Declared as a titled visualiser on the `qa` directory in
 * `cat-harness/cat-harness.json`, so the navbar row, the harness tile and the
 * published-graphs row appear with no further wiring (skill `harness-tiles`).
 * The indexes are sidecars under `test/results/lsi/`, inside that directory,
 * which is why the declaration lives there rather than on a directory of its
 * own: a second declaration nested in a declared one is the graph-inside-a-
 * graph shape the directory conventions refuse.
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
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { graphVerdict, proseGraphs, VIEWER_DIR, type LsiSidecar } from "./lsi.ts";
import { declaredGraphs } from "../schemas/cat-harness.ts";
import { renderedPath, withRendersFrontMatter } from "./viewer-declarations.ts";

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

export function render(): string {
  const files = sidecars();
  const indexes = files.map((f) => ({ file: f, s: JSON.parse(readFileSync(f, "utf8")) as LsiSidecar }));
  const verdicts = proseGraphs().map((t) => ({ t, v: graphVerdict(t) }));
  const needing = verdicts.filter(({ v }) => v.result === "fail").length;
  const units = indexes.reduce((n, { s }) => n + s.units, 0);

  const L: string[] = [];
  L.push("---");
  L.push('title: "Latent semantic indexes"');
  L.push('description: "Every committed LSI index over a declared prose graph — its latent dimensions, its findings, and which graphs still need one."');
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
  L.push("the same as fine. The same verdict is " + code("kg:audit") + "'s " + code("lsi-index-fresh") + ".");
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
  L.push("Generated by " + code("bun run lsi:viz") + " from the committed sidecars; " + code("lsi:viz:check") + " fails when this page is stale.");
  // The page names the directory it draws (#1168 B7a-2): the declared
  // directory whose visualiser this is — the `qa` tree the sidecars live in —
  // read from the declaration rather than spelled here.
  const self = relative(REPO, OUT);
  const drawn = declaredGraphs(join(REPO, "cat-harness"))
    .filter((g) => {
      const v = (g as { coverage?: { visualiser?: string | Array<{ ref: string }> } }).coverage?.visualiser;
      const refs = v === undefined ? [] : typeof v === "string" ? [v] : v.map((x) => x.ref);
      return g.absPath !== undefined && refs.includes(self);
    })
    .map((g) => renderedPath(REPO, g.absPath!));
  return withRendersFrontMatter(L.join("\n") + "\n", drawn);
}

if (import.meta.main) {
  const page = render();
  if (process.argv.includes("--check")) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (cur !== page) {
      console.error(relative(REPO, OUT) + " is stale — run `bun run lsi:viz` and commit it.");
      process.exit(1);
    }
    console.log("lsi viewer: " + relative(REPO, OUT) + " is current");
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, page);
    console.log("lsi viewer → " + relative(REPO, OUT));
  }
}
