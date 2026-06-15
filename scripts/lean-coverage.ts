#!/usr/bin/env bun
/**
 * lean-coverage.ts — Compute Lean formalization coverage stats.
 *
 * Scans every content block under `content/<paper>/` and reports:
 *   - provable blocks (theorem/lemma/proposition/corollary) with .lean siblings
 *   - of those, how many are sorry-free (i.e. full Lean proof)
 *   - conjectures with .lean siblings and class-axiomatized form (per CLAUDE.md §3b)
 *   - definitions with .lean siblings
 *
 * Usage:
 *   bun run scripts/lean-coverage.ts                  # default paper (qou)
 *   bun run scripts/lean-coverage.ts --paper qou      # explicit paper
 *   bun run scripts/lean-coverage.ts --json           # JSON only
 *   bun run scripts/lean-coverage.ts --out path.json  # write JSON to path
 *
 * Output JSON consumed by:
 *   - authors-note pipeline substitution (placeholder {{LEAN_*}} fields)
 *   - README.md generator (scripts/generate-readme.sh)
 *   - publish.yml (per-build coverage badge)
 */

import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from "fs";
import { join, resolve, relative, dirname, basename } from "path";

const REPO_ROOT = resolve(import.meta.dir, "..");
const CONTENT = join(REPO_ROOT, "content");

const PROVABLE = new Set(["theorem", "lemma", "proposition", "corollary"]);

interface Block {
  ts: string;
  kind: string;
  label?: string;
  leanRef?: string;
  hasLeanField: boolean;
  leanFile?: string;
  leanHasSorry?: boolean;
  leanHasClass?: boolean;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip nested build / vendored / Lean source dirs
      if (entry.name === "lean" || entry.name === "node_modules" ||
          entry.name === ".lake" || entry.name === "build") continue;
      yield* walk(p);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      yield p;
    }
  }
}

function parseBlock(tsPath: string): Block | null {
  const src = readFileSync(tsPath, "utf-8");
  // Identify builder: export default <builder>(
  const m = src.match(/\bexport\s+default\s+(\w+)\s*\(/);
  if (!m) return null;
  const kind = m[1];
  // Skip non-block builders (paper, chapter, sectionRef, etc.)
  const blockKinds = new Set([
    "definition", "theorem", "lemma", "proposition", "corollary",
    "conjecture", "remark", "example", "prose", "equation", "diagram",
    "simulator", "proof",
  ]);
  if (!blockKinds.has(kind)) return null;

  const labelM = src.match(/label:\s*["']([^"']+)["']/);
  const leanRefM = src.match(/lean:\s*\{[^}]*ref:\s*["']([^"']+)["']/s);
  const hasLeanField = /lean:\s*\{/.test(src);
  return {
    ts: relative(REPO_ROOT, tsPath),
    kind,
    label: labelM?.[1],
    leanRef: leanRefM?.[1],
    hasLeanField,
  };
}

function findLeanSibling(tsPath: string): string | null {
  const sib = tsPath.replace(/\.ts$/, ".lean");
  return existsSync(sib) ? sib : null;
}

function stripLeanComments(src: string): string {
  // Strip Lean block comments (`/- ... -/`, `/-- ... -/`, `/-! ... -/`) first —
  // they can contain prose like "sorry-free" that would otherwise be matched
  // by /\bsorry\b/. Block comments can be nested (Lean's lexer supports
  // arbitrary nesting), so we walk depth instead of using a single regex.
  let out = "";
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    if (depth === 0 && src[i] === "/" && src[i + 1] === "-") {
      depth = 1;
      i += 1;
      continue;
    }
    if (depth > 0) {
      if (src[i] === "/" && src[i + 1] === "-") { depth += 1; i += 1; continue; }
      if (src[i] === "-" && src[i + 1] === "/") { depth -= 1; i += 1; continue; }
      continue;
    }
    out += src[i];
  }
  // Then strip line comments (`-- ...` to EOL).
  return out.split("\n").map(line => {
    const idx = line.indexOf("--");
    return idx >= 0 ? line.slice(0, idx) : line;
  }).join("\n");
}

function inspectLean(leanPath: string): { hasSorry: boolean; hasClass: boolean } {
  const src = readFileSync(leanPath, "utf-8");
  const stripped = stripLeanComments(src);
  const hasSorry = /\bsorry\b/.test(stripped);
  // `class` keyword check uses raw source: class declarations carry doc
  // comments above them, never inside, so stripping is unnecessary.
  const hasClass = /^\s*class\s+\w+/m.test(src);
  return { hasSorry, hasClass };
}

interface Stats {
  paper: string;
  generated_at: string;
  total_blocks: number;
  by_kind: Record<string, number>;
  provable: {
    total: number;
    with_lean_field: number;
    with_lean_file: number;
    sorry_free: number;
    percent_sorry_free: number;
  };
  conjectures: {
    total: number;
    with_lean_field: number;
    with_lean_file: number;
    class_axiomatized: number;
    percent_class_axiomatized: number;
  };
  definitions: {
    total: number;
    with_lean_file: number;
  };
}

function computeStats(paperDir: string): Stats {
  const root = join(CONTENT, paperDir);
  const blocks: Block[] = [];
  for (const tsPath of walk(root)) {
    // Skip chapter and paper manifests
    const name = basename(tsPath, ".ts");
    const parent = basename(dirname(tsPath));
    if (name === parent) continue;       // <dir>/<dir>.ts (chapter manifest)
    if (name === paperDir) continue;     // paper manifest
    const block = parseBlock(tsPath);
    if (!block) continue;
    const leanSib = findLeanSibling(tsPath);
    if (leanSib) {
      block.leanFile = relative(REPO_ROOT, leanSib);
      const insp = inspectLean(leanSib);
      block.leanHasSorry = insp.hasSorry;
      block.leanHasClass = insp.hasClass;
    }
    blocks.push(block);
  }

  const byKind: Record<string, number> = {};
  for (const b of blocks) byKind[b.kind] = (byKind[b.kind] ?? 0) + 1;

  const provable = blocks.filter(b => PROVABLE.has(b.kind));
  const provableWithField = provable.filter(b => b.hasLeanField);
  const provableWithFile = provable.filter(b => b.leanFile);
  const provableSorryFree = provable.filter(b => b.leanFile && !b.leanHasSorry);

  const conjectures = blocks.filter(b => b.kind === "conjecture");
  const conjWithField = conjectures.filter(b => b.hasLeanField);
  const conjWithFile = conjectures.filter(b => b.leanFile);
  const conjAxiom = conjectures.filter(b => b.leanFile && b.leanHasClass);

  const defs = blocks.filter(b => b.kind === "definition");
  const defsWithFile = defs.filter(b => b.leanFile);

  const pct = (n: number, d: number) => d === 0 ? 0 : Math.round((n / d) * 1000) / 10;

  return {
    paper: paperDir,
    generated_at: new Date().toISOString(),
    total_blocks: blocks.length,
    by_kind: byKind,
    provable: {
      total: provable.length,
      with_lean_field: provableWithField.length,
      with_lean_file: provableWithFile.length,
      sorry_free: provableSorryFree.length,
      percent_sorry_free: pct(provableSorryFree.length, provable.length),
    },
    conjectures: {
      total: conjectures.length,
      with_lean_field: conjWithField.length,
      with_lean_file: conjWithFile.length,
      class_axiomatized: conjAxiom.length,
      percent_class_axiomatized: pct(conjAxiom.length, conjectures.length),
    },
    definitions: {
      total: defs.length,
      with_lean_file: defsWithFile.length,
    },
  };
}

// ── CLI ─────────────────────────────────────────────────────────────

/** Parse a `--flag value` pair from argv; returns the value, or null if the
 *  flag is missing OR the index is the last element (no value follows). */
function flagValue(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx < 0 || idx + 1 >= args.length) return null;
  const next = args[idx + 1];
  // Reject values that look like another flag — defensive against missing values.
  if (next.startsWith("--")) return null;
  return next;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const paper = flagValue(args, "--paper") || "quantum-observable-universe";
  const jsonOnly = args.includes("--json");
  const outPath = flagValue(args, "--out");

  const stats = computeStats(paper);

  if (jsonOnly) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log(`Lean coverage — paper: ${stats.paper}`);
    console.log(`Generated: ${stats.generated_at}`);
    console.log(`Total blocks: ${stats.total_blocks}`);
    console.log(`By kind:`);
    for (const [k, c] of Object.entries(stats.by_kind).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(15)} ${c}`);
    }
    console.log(``);
    console.log(`Provable (theorem/lemma/proposition/corollary):`);
    console.log(`  total: ${stats.provable.total}`);
    console.log(`  with .lean sibling: ${stats.provable.with_lean_file}`);
    console.log(`  sorry-free (full proof): ${stats.provable.sorry_free} (${stats.provable.percent_sorry_free}%)`);
    console.log(``);
    console.log(`Conjectures:`);
    console.log(`  total: ${stats.conjectures.total}`);
    console.log(`  with .lean sibling: ${stats.conjectures.with_lean_file}`);
    console.log(`  class-axiomatized (per §3b): ${stats.conjectures.class_axiomatized} (${stats.conjectures.percent_class_axiomatized}%)`);
    console.log(``);
    console.log(`Definitions:`);
    console.log(`  total: ${stats.definitions.total}`);
    console.log(`  with .lean sibling: ${stats.definitions.with_lean_file}`);
  }

  if (outPath) {
    writeFileSync(outPath, JSON.stringify(stats, null, 2));
    if (!jsonOnly) console.error(`\nWrote: ${outPath}`);
  }
}

export { computeStats };
export type { Stats };
