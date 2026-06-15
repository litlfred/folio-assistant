#!/usr/bin/env bun
/**
 * refresh-authors-note.ts — Rewrite the QOU authors-note.md with current
 * Lean coverage stats.
 *
 * Recomputes stats via lean-coverage.ts and substitutes the numeric fields
 * (sorry-free count / provable total, percent, conjectures total /
 * class-axiomatized count) into the existing authors-note.md.
 *
 * Pattern matched is "**X of Y (Z%) provable claims**" and "**N open
 * conjectures**, of which **M (P%) are class-axiomatised". If the
 * authors-note has been hand-edited away from this pattern, the script
 * exits 1 rather than silently corrupting the prose.
 *
 * Usage:
 *   bun run scripts/refresh-authors-note.ts             # apply in place
 *   bun run scripts/refresh-authors-note.ts --check     # exit 1 if stale
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { computeStats } from "./lean-coverage";

const REPO_ROOT = resolve(import.meta.dir, "..");
const NOTE_PATH = join(
  REPO_ROOT,
  "content/quantum-observable-universe/introduction/authors-note.md",
);

const PROVABLE_RE = /\*\*\d+\s+of\s+\d+\s+\([\d.]+%\)\s+provable\s+claims\*\*/;
const CONJECTURE_RE = /\*\*\d+\s+open\s+conjectures\*\*,\s+of\s+which\s+\*\*\d+\s+\([\d.]+%\)\s+are\s+class-axiomatised\s+in\s+Lean\*\*/;

function buildProvableClause(s: ReturnType<typeof computeStats>): string {
  return `**${s.provable.sorry_free} of ${s.provable.total} (${s.provable.percent_sorry_free}%) provable claims**`;
}

function buildConjectureClause(s: ReturnType<typeof computeStats>): string {
  return `**${s.conjectures.total} open conjectures**, of which **${s.conjectures.class_axiomatized} (${s.conjectures.percent_class_axiomatized}%) are class-axiomatised in Lean**`;
}

function main(): number {
  const check = process.argv.includes("--check");
  const stats = computeStats("quantum-observable-universe");

  const src = readFileSync(NOTE_PATH, "utf-8");
  if (!PROVABLE_RE.test(src)) {
    console.error(`ERROR: authors-note.md does not contain the expected provable-claims pattern.`);
    console.error(`  Expected match for: ${PROVABLE_RE}`);
    return 1;
  }
  if (!CONJECTURE_RE.test(src)) {
    console.error(`ERROR: authors-note.md does not contain the expected conjecture pattern.`);
    console.error(`  Expected match for: ${CONJECTURE_RE}`);
    return 1;
  }

  const provableNew = buildProvableClause(stats);
  const conjectureNew = buildConjectureClause(stats);

  const updated = src
    .replace(PROVABLE_RE, provableNew)
    .replace(CONJECTURE_RE, conjectureNew);

  if (updated === src) {
    console.log("authors-note.md is up to date.");
    return 0;
  }

  if (check) {
    console.error("authors-note.md is STALE. Run: bun run scripts/refresh-authors-note.ts");
    console.error("");
    console.error("Expected:");
    console.error(`  ${provableNew}`);
    console.error(`  ${conjectureNew}`);
    return 1;
  }

  writeFileSync(NOTE_PATH, updated);
  console.log(`Updated: ${NOTE_PATH}`);
  console.log(`  provable: ${provableNew}`);
  console.log(`  conjectures: ${conjectureNew}`);
  return 0;
}

if (import.meta.main) {
  process.exit(main());
}
