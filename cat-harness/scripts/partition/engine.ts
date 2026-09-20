/**
 * The repository-partition ENGINE — the algorithm, with no instance's data in
 * it.
 *
 * ## What moved, and why the host had to carry prose
 *
 * `scripts/repo-partition.ts` was 1,194 lines. Measured before the split:
 * the algorithm is roughly 390 of them, this instance's exception data 272,
 * and its RATIONALE 532 — 65% of the rules block is comment, and the comments
 * are where the measurements live ("measured by putting these in the harness
 * list at the bottom first and watching the two edges survive", and a hundred
 * more like it).
 *
 * That number decided the shape of the repair. `detangler-topic-coherence`
 * was de-math'd by migrating a hardcoded table out to a folio-supplied
 * `topic-keywords.json`, and the obvious move here was the same — until the
 * 65% was counted. JSON cannot host positional per-entry rationale, so the
 * data would have arrived and the reasons would have been destroyed. The
 * mechanism still leaves and the data still stays behind; the host is a
 * MODULE rather than a document, because prose is part of the data here.
 *
 * ## What makes it generic
 *
 * Repo ids are `string`, not this instance's six-member union. Everything
 * else arrives in a {@link PartitionSpec}: the repos, the allowed-import DAG,
 * the ordered rules, the scan roots, the skipped directories and the root to
 * resolve against. Another instance writes its own spec module and reuses
 * every line of this one.
 *
 * ## The three-valued discipline is IN here, not in the caller
 *
 * `unassigned` is a distinct answer from any repo, and `unresolvedEdges` is a
 * distinct list from `crossEdges`. The header this file inherits says why:
 * "could not determine is a distinct answer from determined to be core, and
 * collapsing the two is how a wrong partition looks like a clean one."
 * A caller that wants one number has to decide which; the engine never
 * decides for it.
 *
 * @module scripts/partition/engine
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative, dirname, resolve } from "path";

/** How a module came to be assigned — never collapsed into a boolean. */
export type Provenance = "rule" | "triage" | "keyword" | "default";

/** One ordered assignment rule. First match wins. */
export interface Rule {
  repo: string;
  /** Marks this rule's assignments as hand-triaged rather than structural. */
  triaged?: boolean;
  /** Path prefixes (repo-relative, forward slashes). */
  prefixes?: string[];
  /** Exact repo-relative paths. */
  exact?: string[];
  /** Case-insensitive regex over the repo-relative path. */
  keyword?: RegExp;
}

/**
 * Everything an instance supplies. No default: a spec that forgot a field
 * would scan a directory it does not have, or permit an edge nobody allowed,
 * and both fail quietly.
 */
export interface PartitionSpec {
  /** Absolute path the repo-relative paths are resolved against. */
  root: string;
  /** Display names, in dependency order (most depended-upon first). */
  repos: Array<{ id: string; name: string }>;
  /** What each repo may import from — itself plus its ancestors in the DAG. */
  allowed: Record<string, string[]>;
  /** Ordered; first match wins, so explicit path rules precede keyword rules. */
  rules: Rule[];
  /** Directories scanned for TypeScript modules, relative to `root`. */
  scanRoots: string[];
  /** Directory names never descended into. */
  skipDirs: Set<string>;
}

export interface Assignment {
  repo: string;
  provenance: Provenance;
}

export interface CrossEdge {
  from: string;
  fromRepo: string;
  to: string;
  toRepo: string;
}

export interface PartitionReport {
  modules: Map<string, Assignment>;
  crossEdges: CrossEdge[];
  /** Edges whose target this tool could not classify. */
  unresolvedEdges: Array<{ from: string; to: string }>;
  totalEdges: number;
}

/** The id `classify` returns when no rule claimed a module. */
export const UNASSIGNED = "unassigned";

function walkTs(spec: PartitionSpec, dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (spec.skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue; // broken symlink
    }
    if (st.isDirectory()) walkTs(spec, full, out);
    else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

// ── Classification ──────────────────────────────────────────────

export function classify(spec: PartitionSpec, relPath: string): Assignment {
  for (const rule of spec.rules) {
    const explicit: Provenance = rule.triaged ? "triage" : "rule";
    if (rule.exact?.includes(relPath)) return { repo: rule.repo, provenance: explicit };
    if (rule.prefixes?.some((p) => relPath.startsWith(p))) return { repo: rule.repo, provenance: explicit };
    if (rule.keyword?.test(relPath)) return { repo: rule.repo, provenance: "keyword" };
  }
  // Nothing claimed it. `scripts/` and stray `src/` modules land here; they
  // are NOT silently called core — that judgement is a human's to make.
  return { repo: UNASSIGNED, provenance: "default" };
}

// ── Import extraction ───────────────────────────────────────────

/**
 * Static and dynamic import specifiers. Deliberately regex-based rather than
 * a full parse: we need the edge set, not a type-checked AST, and a missed
 * exotic form is a false negative we can live with — it understates the
 * cross-edge count, which is the safe direction for a worklist.
 */
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]{0,400}?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

function extractSpecifiers(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    if (spec) out.push(spec);
  }
  return out;
}

/**
 * Resolve a relative specifier to a repo-relative module path.
 *
 * This codebase writes all three forms — bare (`./qa-utils`), `.js` for
 * TypeScript files (`./core/git.js`, the NodeNext convention), and directory
 * imports — so every candidate is tried before giving up.
 */
function resolveSpecifier(spec: PartitionSpec, fromFile: string, ref: string): string | null {
  if (!ref.startsWith(".")) return null; // package import, not ours
  const base = resolve(dirname(fromFile), ref);
  const candidates = [
    base,
    `${base}.ts`,
    base.replace(/\.js$/, ".ts"),
    join(base, "index.ts"),
    `${base.replace(/\.js$/, "")}/index.ts`,
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return relative(spec.root, c).replace(/\\/g, "/");
  }
  return null;
}

// ── Analysis ────────────────────────────────────────────────────

export function analyse(spec: PartitionSpec): PartitionReport {
  const files: string[] = [];
  for (const r of spec.scanRoots) walkTs(spec, join(spec.root, r), files);

  const modules = new Map<string, Assignment>();
  for (const f of files) {
    const rel = relative(spec.root, f).replace(/\\/g, "/");
    modules.set(rel, classify(spec, rel));
  }

  const crossEdges: CrossEdge[] = [];
  const unresolvedEdges: Array<{ from: string; to: string }> = [];
  let totalEdges = 0;

  for (const f of files) {
    const rel = relative(spec.root, f).replace(/\\/g, "/");
    const fromA = modules.get(rel)!;
    let src: string;
    try {
      src = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const ref of extractSpecifiers(src)) {
      const target = resolveSpecifier(spec, f, ref);
      if (!target) continue;
      totalEdges++;
      const toA = modules.get(target);
      if (!toA) continue;
      if (fromA.repo === UNASSIGNED || toA.repo === UNASSIGNED) {
        unresolvedEdges.push({ from: rel, to: target });
        continue;
      }
      if (!(spec.allowed[fromA.repo] ?? []).includes(toA.repo)) {
        crossEdges.push({ from: rel, fromRepo: fromA.repo, to: target, toRepo: toA.repo });
      }
    }
  }

  return { modules, crossEdges, unresolvedEdges, totalEdges };
}
