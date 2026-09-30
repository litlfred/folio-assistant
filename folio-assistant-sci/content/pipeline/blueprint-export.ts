/**
 * Blueprint export — a folio's rendered LaTeX → a leanblueprint document whose
 * `\lean`, `\leanok` and `\uses` are GENERATED, never hand-synced.
 *
 * ## What it does
 *
 * Reads the paper's rendered (flattened) TeX and, per block environment:
 *
 * - `\lean{decl}` from the block's `lean.ref`, in the statement environment.
 * - `\leanok` from the Lean status the render ALREADY computed for the margin
 *   ∀ mark (`\blockannot[stubbed|drafted|compiled]`), so the blueprint and
 *   the PDF cannot disagree: a statement is `\leanok` once it is stated in
 *   Lean (`drafted` or `compiled`), a proof once it is `compiled`.
 * - `\uses{…}` from the FORMAL relation (`buildContentGraph`'s formal edges):
 *   statement dependencies (`type`) in the statement environment, proof
 *   dependencies (`value`) in the proof environment. The editorial `\uses`
 *   the render emits from `uses[]` are REMOVED, because a blueprint's
 *   dependency graph is the formal one.
 *
 * ## Why the editorial `\uses` go
 *
 * `uses[]` is what a READER must have read; blueprint `\uses` is what the
 * PROOF invokes (`folio-assistant-sci/methodologies/blueprint-driven-formalization.md`
 * §"THE CONFLICT"). Mixing them draws a graph that is neither. The formal
 * edges are never written back into `uses[]` — this only writes a TeX file.
 *
 * ## Three states, not two
 *
 * The formal source is stamped into the output and the result. With no formal
 * cache the export still writes `\lean`/`\leanok` but NO `\uses`, and says the
 * graph is unavailable rather than empty. `--check` fails unless the source is
 * elaborated (`isElaborated`): a `scan` graph has measured recall 0.63
 * (folio-assistant#1492), which is not a dependency graph to publish.
 *
 * ## Usage
 *
 *   bun run folio-assistant-sci/content/pipeline/blueprint-export.ts \
 *     --tex main-flat.tex --out blueprint.tex [--root <content root>] [--check]
 *
 * @module folio-assistant-sci/content/pipeline/blueprint-export
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import {
  buildContentGraph,
  isElaborated,
  type ContentGraph,
} from "../../../cat-harness/content/pipeline/content-graph";
import { findContentRepoRoot } from "../../../cat-harness/content/pipeline/repo-root";
import { folioDir } from "../../../cat-harness/schemas/cat-harness.js";

/** Lean status buckets the render writes into `\blockannot[…]`. */
export type LeanBucket = "stubbed" | "drafted" | "compiled";

/** What the export needs to know about the formal graph, and nothing else. */
export interface FormalView {
  /** `undefined` ⇒ no formal cache: the graph is UNAVAILABLE, not empty. */
  source?: string;
  /** Statement label → its `type` (statement) dependencies, as block labels. */
  typeDeps: Map<string, string[]>;
  /** Statement label → its `value` (proof) dependencies, as block labels. */
  valueDeps: Map<string, string[]>;
}

export function formalView(g: ContentGraph): FormalView {
  const typeDeps = new Map<string, string[]>();
  const valueDeps = new Map<string, string[]>();
  for (const e of g.edges) {
    if (e.kind !== "formal") continue;
    const m = e.formalKind === "type" ? typeDeps : valueDeps;
    const xs = m.get(e.from) ?? [];
    if (!xs.includes(e.to)) xs.push(e.to);
    m.set(e.from, xs);
  }
  return { source: g.hasFormal ? g.formalSource : undefined, typeDeps, valueDeps };
}

export interface ExportResult {
  tex: string;
  source?: string;
  /** Blocks given a `\lean{…}`. */
  lean: number;
  /** `\leanok` markers written (statements + proofs). */
  leanok: number;
  /** Formal `\uses` edges written. */
  uses: number;
  /** Editorial `\uses` lines removed. */
  removedEditorial: number;
  /** Formal targets with no `\label` in this document (not rendered), dropped. */
  dangling: string[];
  /** Statements whose proof dependencies had no proof environment to go in. */
  valueWithoutProof: string[];
}

const BEGIN_RE = /^\s*\\begin\{([A-Za-z*]+)\}/;
const END_PROOF_RE = /^\s*\\end\{proof\}/;
const LABEL_RE = /\\label\{([^}]+)\}/g;
const ANNOT_RE = /^(\s*)\\blockannot\[(stubbed|drafted|compiled)\]\{([^}]*)\}\{([^}]*)\}/;
const USES_LINE_RE = /^\s*\\uses\{[^}]*\}\s*$/;

/**
 * Rewrite rendered TeX into a blueprint. Pure: the formal graph comes in as a
 * `FormalView`, so a test can drive it without a folio.
 *
 * A proof environment belongs to the statement environment before it — the
 * rule leanblueprint itself applies — so a proof block needs neither a label
 * nor a `lean.ref` of its own. Its `\leanok` follows the statement's status:
 * `compiled` already means the declaration is sorry-free.
 */
export function exportBlueprint(tex: string, formal: FormalView): ExportResult {
  const lines = tex.split("\n");
  const labels = new Set<string>();
  for (const l of lines) for (const m of l.matchAll(LABEL_RE)) labels.add(m[1]!);

  const dangling = new Set<string>();
  // A self-edge is dropped: plasTeX's dependency graph recurses on it without
  // end (measured, RecursionError), and "X uses X" says nothing.
  const keep = (xs: string[] | undefined, self: string) =>
    (xs ?? []).filter((t) => t !== self && (labels.has(t) ? true : (dangling.add(t), false))).sort();

  const out: string[] = [];
  const res = { lean: 0, leanok: 0, uses: 0, removedEditorial: 0 };
  /** The last statement environment seen: what a following proof proves. */
  let last: { label: string; bucket: LeanBucket; decl: string } | undefined;
  const proved = new Set<string>();
  let inProof = false;

  for (const line of lines) {
    if (USES_LINE_RE.test(line)) {
      res.removedEditorial++;
      continue;
    }
    out.push(line);

    if (END_PROOF_RE.test(line)) inProof = false;
    const b = line.match(BEGIN_RE);
    if (b?.[1] === "proof") {
      inProof = true;
      if (!last) continue;
      proved.add(last.label);
      const indent = "  ";
      if (last.decl && last.bucket === "compiled") { out.push(`${indent}\\leanok`); res.leanok++; }
      const deps = keep(formal.valueDeps.get(last.label), last.label);
      if (deps.length) { out.push(`${indent}\\uses{${deps.join(", ")}}`); res.uses += deps.length; }
      continue;
    }

    const a = line.match(ANNOT_RE);
    if (!a) continue;
    const [, indent, bucket, label, decl] = a as unknown as [string, string, LeanBucket, string, string];
    // A labelled proof block carries its own \blockannot; opening the proof
    // environment above already handled it.
    if (inProof) continue;
    last = { label, bucket, decl };
    if (decl) {
      out.push(`${indent}\\lean{${decl}}`);
      res.lean++;
      if (bucket !== "stubbed") { out.push(`${indent}\\leanok`); res.leanok++; }
    }
    const deps = keep(formal.typeDeps.get(label), label);
    if (deps.length) { out.push(`${indent}\\uses{${deps.join(", ")}}`); res.uses += deps.length; }
  }

  const valueWithoutProof = [...formal.valueDeps.keys()]
    .filter((l) => labels.has(l) && !proved.has(l) && keep(formal.valueDeps.get(l), l).length)
    .sort();

  const stamp = formal.source
    ? `% blueprint \\uses: FORMAL relation, source "${formal.source}"${isElaborated(formal.source) ? "" : " (NOT elaborated: approximate)"}; editorial uses[] removed. Generated by blueprint-export.ts.`
    : `% blueprint \\uses: UNAVAILABLE (no formal cache), so none written; editorial uses[] removed. Generated by blueprint-export.ts.`;

  return {
    tex: `${stamp}\n${out.join("\n")}`,
    source: formal.source,
    ...res,
    dangling: [...dangling].sort(),
    valueWithoutProof,
  };
}

/** `--check` verdict: the reasons the blueprint's graph cannot be published. */
export function checkProblems(r: ExportResult): string[] {
  if (r.source === undefined) return ["no formal cache: the dependency graph is unavailable (run lean_formal_edges with ingest)"];
  if (!isElaborated(r.source)) return [`formal source is "${r.source}", not elaborated (run lean_formal_edges with ingest)`];
  return [];
}

export function describeExport(r: ExportResult): string {
  const lines = [
    `formal source: ${r.source ?? "UNAVAILABLE"}`,
    `\\lean ${r.lean}; \\leanok ${r.leanok}; formal \\uses edges ${r.uses}; editorial \\uses lines removed ${r.removedEditorial}`,
  ];
  if (r.dangling.length) lines.push(`dropped ${r.dangling.length} formal target(s) not rendered in this document: ${r.dangling.slice(0, 10).join(", ")}`);
  if (r.valueWithoutProof.length) lines.push(`${r.valueWithoutProof.length} statement(s) have proof dependencies but no proof environment: ${r.valueWithoutProof.slice(0, 10).join(", ")}`);
  return lines.join("\n");
}

// ── CLI ─────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const texPath = opt("--tex");
  const outPath = opt("--out");
  if (!texPath || !outPath) {
    console.error("usage: blueprint-export.ts --tex <rendered.tex> --out <blueprint.tex> [--root <content root>] [--check]");
    process.exit(2);
  }
  const repoRoot = findContentRepoRoot();
  const root = opt("--root");
  const g = buildContentGraph(root ? resolve(root) : folioDir(repoRoot), repoRoot);
  const r = exportBlueprint(readFileSync(texPath, "utf-8"), formalView(g));
  writeFileSync(outPath, r.tex);
  console.log(describeExport(r));
  console.log(`wrote ${outPath}`);
  if (args.includes("--check")) {
    const problems = checkProblems(r);
    for (const p of problems) console.error(`blueprint --check: ${p}`);
    process.exit(problems.length ? 1 : 0);
  }
}
