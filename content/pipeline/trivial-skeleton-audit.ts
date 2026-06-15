#!/usr/bin/env bun
/**
 * Trivial-skeleton audit (CLAUDE.md §3b-cond honesty check).
 *
 * Flags Lean declarations whose body is a tautological constant —
 * the instance/def is Lean-verified but encodes none of the
 * conjectural content.  These are spec-compliant under the §3b-cond
 * pattern (prove the class is inhabited) but should be **upgraded
 * to faithful instances** as the genuine mathematics is formalised.
 *
 * Patterns flagged:
 *   const_zero        : `def f ... := 0` / `:= constant 0`
 *   one_def           : `def f ... := 1`
 *   punit_type        : `def T ... : Type := PUnit`
 *   punit_unit        : `def x ... := PUnit.unit`
 *   prop_true         : `def P ... : Prop := True`
 *   id_def            : `def f ... := id`
 *   first_arg         : `def f x ... := x` (ignores everything else)
 *   skel_inst         : `instance ...skeleton`/`...trivial`
 *   holds_trivial     : `_holds := trivial` / `:= rfl` / `by simp`
 *
 * Output: JSON manifest at
 *   `docs/audits/2026-05-08-trivial-skeleton-audit.json`
 *
 * Usage (from repo root):
 *   bun run content/pipeline/trivial-skeleton-audit.ts
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const ROOT = join(REPO_ROOT, "content/quantum-observable-universe");

// CLI parsing: `--out <path>` overrides witness output;
// `--max-per-pattern name=N,name2=M` enforces per-pattern strict
// gates (process exits non-zero if any pattern's count exceeds the
// stated budget).  Without `--max-per-pattern`, the script is
// warn-only.  Positional arg #1 (compat with the original API) is
// also treated as `--out`.
const argv = process.argv.slice(2);
let WITNESS_OUT = join(REPO_ROOT, "docs/audits/2026-05-08-trivial-skeleton-audit.json");
let strictGates: Record<string, number> = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--out") WITNESS_OUT = argv[++i];
  else if (a === "--max-per-pattern") {
    const spec = argv[++i] ?? "";
    for (const kv of spec.split(",")) {
      const [k, v] = kv.split("=");
      if (k && v) strictGates[k.trim()] = Number(v);
    }
  } else if (i === 0 && !a.startsWith("--")) {
    WITNESS_OUT = a;
  }
}

interface PatternHit {
  line: number;
  pattern: string;
  snippet: string;
}

const PATTERNS: Array<[string, RegExp]> = [
  ["const_zero",       /^\s*def\s+\w[\w.]*[^=]*:=\s*(?:fun\s[^=]*=>\s*)?(?:0|0\.0)\s*$/],
  ["const_zero_typed", /^\s*def\s+\w[\w.]*[^=]*:.*=\s*(?:fun\s[^=]*=>\s*)?0\s*$/],
  ["punit_type",       /^\s*def\s+\w[\w.]*[^=]*:\s*Type[^=]*:=\s*PUnit\s*$/],
  ["punit_unit",       /^\s*def\s+\w[\w.]*[^=]*:=\s*PUnit\.unit\s*$/],
  ["prop_true",        /^\s*def\s+\w[\w.]*[^=]*:\s*Prop[^=]*:=\s*True\s*$/],
  ["id_def",           /^\s*def\s+\w[\w.]*[^=]*:=\s*id\s*$/],
  ["one_def",          /^\s*def\s+\w[\w.]*[^=]*:.*=\s*(?:fun\s[^=]*=>\s*)?1\s*$/],
  ["first_arg",        /^\s*def\s+\w[\w.]*\([^)]*\)\s*[^=]*:=\s*\w\s*$/],
  ["trivial_model",    /^\s*def\s+trivialModel\b/],
];
const SKEL_INSTANCE = /^\s*instance\s+\w*[Ss]keleton\b/;
const TRIV_INSTANCE = /^\s*instance\s+\w*[Tt]rivial\b/;
const HOLDS_TRIVIAL = /_holds\s*:=\s*(?:trivial|rfl|by\s+(?:trivial|rfl|simp|norm_num))/;

async function main() {
  const files = await glob([
    "*/*.lean",
    "lean/QOU/**/*.lean",
  ], { cwd: ROOT, absolute: true });

  const flagged: Record<string, PatternHit[]> = {};
  for (const f of files.sort()) {
    const text = await readFile(f, "utf8");
    const lines = text.split("\n");
    const hits: PatternHit[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Inline-exemption marker: `-- noqa: <pattern>` on the same line skips the audit flag.
      // Use for content-bearing definitions where the matched value
      // (e.g. `:= 1` for a row partition's q-Wenzl dimension) is the
      // CORRECT mathematical value, not a placeholder skeleton.
      const noqaMatch = line.match(/--\s*noqa:\s*([\w_,\s]+)/);
      const exempted = (pat: string) =>
        noqaMatch !== null && noqaMatch[1].split(",").map(s => s.trim()).includes(pat);

      let matched = false;
      for (const [name, pat] of PATTERNS) {
        if (pat.test(line)) {
          if (!exempted(name)) {
            hits.push({ line: i + 1, pattern: name, snippet: line.trim().slice(0, 90) });
          }
          matched = true;
          break;
        }
      }

      if (!matched && (SKEL_INSTANCE.test(line) || TRIV_INSTANCE.test(line))
          && !exempted("skel_inst")) {
        hits.push({ line: i + 1, pattern: "skel_inst", snippet: line.trim().slice(0, 90) });
      } else if (!matched && HOLDS_TRIVIAL.test(line) && !exempted("holds_trivial")) {
        hits.push({ line: i + 1, pattern: "holds_trivial", snippet: line.trim().slice(0, 90) });
      }
    }
    if (hits.length) {
      const rel = f.replace(ROOT + "/", "");
      flagged[rel] = hits;
    }
  }

  const total = Object.values(flagged).reduce((s, h) => s + h.length, 0);
  console.log(`Files with tautological-skeleton patterns: ${Object.keys(flagged).length}`);
  console.log(`Total flagged lines: ${total}\n`);

  const byCount = Object.entries(flagged).sort((a, b) => b[1].length - a[1].length);
  console.log("Top 10 files by trivial-pattern count:");
  for (const [f, hits] of byCount.slice(0, 10)) {
    console.log(`  ${String(hits.length).padStart(3)} ${f}`);
  }

  const patCounts: Record<string, number> = {};
  for (const hits of Object.values(flagged)) {
    for (const h of hits) {
      patCounts[h.pattern] = (patCounts[h.pattern] ?? 0) + 1;
    }
  }
  console.log("\nPer-pattern counts:");
  const sortedPats = Object.entries(patCounts).sort((a, b) => b[1] - a[1]);
  for (const [name, c] of sortedPats) {
    console.log(`  ${String(c).padStart(4)} ${name}`);
  }

  await mkdir(dirname(WITNESS_OUT), { recursive: true });
  const witness = {
    audit: "trivial-skeleton-audit",
    generated: new Date().toISOString(),
    total_flagged: total,
    files_flagged: Object.keys(flagged).length,
    patterns: Object.fromEntries(sortedPats),
    flagged,
  };
  await writeFile(WITNESS_OUT, JSON.stringify(witness, null, 2));
  console.log(`\nWitness: ${WITNESS_OUT}`);

  // Strict-gate enforcement: if --max-per-pattern was passed, fail
  // the process with a non-zero exit when any pattern exceeds its
  // budget.  Allows progressive tightening as Buckets 1–4 land.
  if (Object.keys(strictGates).length > 0) {
    const violations: string[] = [];
    for (const [name, budget] of Object.entries(strictGates)) {
      const observed = patCounts[name] ?? 0;
      if (observed > budget) {
        violations.push(`  ${name}: ${observed} (budget ${budget})`);
      }
    }
    if (violations.length > 0) {
      console.error("\n❌ Strict-gate violations:");
      for (const v of violations) console.error(v);
      process.exit(1);
    }
    console.log("\n✓ All strict-gate budgets respected.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
