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
import { join } from "path";
import { computeStats } from "./lean-coverage";
import { findContentRepoRoot, findPapers, soleFolioPaper } from "../content/pipeline/repo-root";
import { paperArg } from "../content/pipeline/cli-args";

/**
 * The paper to report on, and the folio's `content/` root.
 *
 * Both were wrong: `computeStats(paperDir, contentRoot)` takes two arguments
 * and was called with one — so `contentRoot` was `undefined` at runtime — and
 * the paper was hardcoded to `quantum-observable-universe`, one folio's paper
 * name living in the platform. `--paper` wins; otherwise take the folio's sole
 * paper and refuse to guess when there are several.
 */
function statsTarget(): { paper: string; contentRoot: string } {
  const repoRoot = findContentRepoRoot();
  const contentRoot = join(repoRoot, "content");
  const paper = paperArg() ?? soleFolioPaper(repoRoot);
  if (!paper) {
    // Exit cleanly rather than throwing: this is a CLI entry point, and a raw
    // stack trace buries the one line that tells the operator what to do.
    // Matches `export-json.ts` and `validate.ts`.
    const found = findPapers(repoRoot);
    console.error(
      found.length === 0
        ? `no paper found under ${contentRoot} — run from a folio checkout, or pass --paper`
        : `this folio has ${found.length} papers (${found.join(", ")}) — pass --paper to choose one`,
    );
    process.exit(2);
  }
  return { paper, contentRoot };
}


// The FOLIO's root, and the chosen paper's note — not `import.meta.dir`, which
// lands in the platform tree (and the folio embeds the platform as a symlink,
// so it resolves there even when run from the content repo). The paper name
// came from `statsTarget()` rather than being baked into the path.
const REPO_ROOT = findContentRepoRoot();
const notePathFor = (paper: string): string =>
  join(REPO_ROOT, "content", paper, "introduction", "authors-note.md");

const PROVABLE_RE = /\*\*\d+\s+of\s+\d+\s+\([\d.]+%\)\s+provable\s+claims\*\*/;
// The note's prose was rewritten to distinguish PRIMARY conjectures from the
// external and dependent ones ("famous external open problems it connects to,
// and conjectures conditional on those primaries, are tallied separately"),
// and the interstitial em-dash clause sits between the two bold spans. This
// pattern still expected the old `…conjectures**, of which **…` wording and no
// longer matched anything, so the refresh could not run — which nothing
// noticed, because the script could not run at all: it called `computeStats`
// with one of its two arguments and read the note from a platform path.
//
// The two bold spans are matched separately, so the sentence between them can
// be reworded without breaking the refresh again.
const CONJECTURE_COUNT_RE = /\*\*\d+\s+primary\s+open\s+conjectures\*\*/;
const CONJECTURE_AXIOM_RE = /\*\*\d+\s+\([\d.]+%\)\s+are\s+class-axiomatised\s+in\s+Lean\*\*/;

function buildProvableClause(s: ReturnType<typeof computeStats>): string {
  return `**${s.provable.sorry_free} of ${s.provable.total} (${s.provable.percent_sorry_free}%) provable claims**`;
}

function buildConjectureClause(s: ReturnType<typeof computeStats>): { count: string; axiom: string } {
  // PRIMARY, matching what the note now says. `class_axiomatized` /
  // `percent_class_axiomatized` count every conjecture block including the
  // external and dependent ones the prose explicitly says are tallied
  // separately — using them here would have contradicted the sentence around
  // them.
  return {
    count: `**${s.conjectures.primary} primary open conjectures**`,
    axiom: `**${s.conjectures.primary_class_axiomatized} (${s.conjectures.percent_primary_class_axiomatized}%) are class-axiomatised in Lean**`,
  };
}

function main(): number {
  const check = process.argv.includes("--check");
  const target = statsTarget();
  const stats = computeStats(target.paper, target.contentRoot);

  const NOTE_PATH = notePathFor(target.paper);
  const src = readFileSync(NOTE_PATH, "utf-8");
  if (!PROVABLE_RE.test(src)) {
    console.error(`ERROR: authors-note.md does not contain the expected provable-claims pattern.`);
    console.error(`  Expected match for: ${PROVABLE_RE}`);
    return 1;
  }
  for (const [what, re] of [
    ["primary-conjecture count", CONJECTURE_COUNT_RE],
    ["class-axiomatised count", CONJECTURE_AXIOM_RE],
  ] as const) {
    if (!re.test(src)) {
      console.error(`ERROR: authors-note.md does not contain the expected ${what} pattern.`);
      console.error(`  Expected match for: ${re}`);
      return 1;
    }
  }

  const provableNew = buildProvableClause(stats);
  const conjectureNew = buildConjectureClause(stats);

  const updated = src
    .replace(PROVABLE_RE, provableNew)
    .replace(CONJECTURE_COUNT_RE, conjectureNew.count)
    .replace(CONJECTURE_AXIOM_RE, conjectureNew.axiom);

  if (updated === src) {
    console.log("authors-note.md is up to date.");
    return 0;
  }

  if (check) {
    console.error("authors-note.md is STALE. Run: bun run scripts/refresh-authors-note.ts");
    console.error("");
    console.error("Expected:");
    console.error(`  ${provableNew}`);
    console.error(`  ${conjectureNew.count} … ${conjectureNew.axiom}`);
    return 1;
  }

  writeFileSync(NOTE_PATH, updated);
  console.log(`Updated: ${NOTE_PATH}`);
  console.log(`  provable: ${provableNew}`);
  console.log(`  conjectures: ${conjectureNew.count} … ${conjectureNew.axiom}`);
  return 0;
}

if (import.meta.main) {
  process.exit(main());
}
