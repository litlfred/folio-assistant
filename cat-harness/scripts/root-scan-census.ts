#!/usr/bin/env bun
/**
 * root-scan-census.ts — how many scanners walk the filesystem, and how many
 * ask GIT what the corpus is.
 *
 * ## Why this exists, and the objection it was built over
 *
 * `xd1g` Done-when 3 asks for a check that catches *number twelve* — the next
 * scanner written with a bare walk. I built that check first and it failed its
 * own falsifier, so it is not one. The measurement, which is the useful part
 * and the reason this file reports two numbers instead of one:
 *
 * | filter | scanners found | of `xd1g`'s twelve |
 * |---|---|---|
 * | binds a root constant **and** enumerates anything | **62** | all |
 * | enumeration **seeded at** a root constant | **4** | 1 |
 *
 * 62 is mostly correct code — a `readdirSync` over one declared directory
 * cannot read gitignored content unless gitignored content is there. 4 misses
 * eleven of the twelve, because they seed a recursion helper or take the root
 * as a PARAMETER. There is no setting in between: the two shapes are not
 * syntactically distinguishable.
 *
 * **I argued against shipping it anyway**, because a check that cannot fail is
 * the `1xhc` pattern this repository has a PR arguing against, and a number
 * nobody can act on is a number people learn to skim. The owner chose to ship
 * it regardless, 2026-09-27, so that the count is visible and cannot drift
 * unnoticed. That is their call and it is recorded here rather than argued
 * again — but the objection is why this file is built the way it is.
 *
 * ## Advisory on the FINDINGS, hard on the STALENESS
 *
 * The compromise that gives it teeth where teeth are honest. The counts are
 * reported and never fail: the backlog is a shape, not a defect, and gating on
 * it would be the wall somebody switches off (`2krx`'s reasoning, and it is
 * right).
 *
 * But the sidecar is COMMITTED and `--check` fails when it is stale. That is a
 * real failure about a real thing: the number changed and nobody looked. It is
 * `audit-coverage`'s arrangement exactly, and it is what "cannot drift"
 * requires — a printed verdict is gone the moment the log scrolls, and cannot
 * tell "never measured" from "measured clean".
 *
 * ## A FLOOR, stated in the output, never a count
 *
 * The filters are syntactic, so a scanner spelled differently is missed. The
 * sidecar says so in its own summary rather than leaving a reader to infer
 * that a census is exhaustive. `xd1g` made the same caveat about its own
 * eleven and it was right to: that list was one short (`kg-audit`), found by a
 * sibling session weeks later.
 *
 * Usage:
 *   bun run root-scan-census            # report, write the sidecar
 *   bun run root-scan-census -- --check # fail only if the sidecar is stale
 *
 * @module scripts/root-scan-census
 * @covers cat-harness
 * @graphNode tool
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { gitCorpus } from "../schemas/git-corpus.ts";
import { repoRootFor } from "../schemas/cat-harness.ts";
import { QA_RESULTS_DIR, buildQaResult, writeQaResult, type QaResult } from "./qa-results.js";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(INSTANCE_ROOT);

/** Binding a root constant — the scan could start at the top of a checkout. */
const ROOT_BOUND = /\b(?:REPO_ROOT|INSTANCE_ROOT|ROOT)\s*[:=]/;

/**
 * Enumerating the filesystem by ANY means, git-aware spellings included.
 *
 * ## Both halves are DERIVED from `git-corpus.ts`, and that is the repair
 *
 * The git spellings were a hardcoded roster — `gitFiles|gitScan|gitCorpus|
 * corpusPredicate` — and it went stale the first time a helper was added.
 * Bean `qrlc`, measured the same hour: `gitTopLevelDirs` landed, three
 * scanners were converted to call it, and this census read **66 enumerating,
 * 10 ask git** before and **65 enumerating, 10 ask git** after. The three had
 * dropped out of the population instead of joining its good side, and the
 * git-aware count had not moved.
 *
 * That is the SECOND time this file has had that defect — the first was the
 * bare-walk-only pattern it shipped with — and it is the class this whole bean
 * family is about: a list of names kept by hand beside the thing it is meant
 * to track. A roster is a dead key waiting to happen.
 *
 * So the names are read from `git-corpus.ts`'s own exports. Adding a helper
 * there is now enough; nothing here has to be remembered.
 */
function gitCorpusExports(): string[] {
  const src = readFileSync(join(INSTANCE_ROOT, "schemas", "git-corpus.ts"), "utf-8");
  const names = [...src.matchAll(/^export function (\w+)/gm)].map((m) => m[1]!);
  // NOT a silent empty. If the read or the match ever returns nothing, every
  // scanner reads as not-git-aware and the census reports a corpus-wide
  // regression that did not happen — the `dh4f` shape, in the file whose
  // subject is exactly that.
  if (names.length === 0) {
    throw new Error(
      "no exported helper found in schemas/git-corpus.ts — the census cannot tell " +
        "git-aware from not without them, and an empty answer here reads as a repository-wide regression",
    );
  }
  return names;
}

const GIT_HELPERS = gitCorpusExports();
const HELPER_CALL = GIT_HELPERS.map((n) => `\\b${n}\\(`).join("|");

const ENUMERATES = new RegExp(`\\bnew Glob\\(|\\breaddirSync\\(|\\.scanSync\\(|${HELPER_CALL}`);

/**
 * The enumeration's start argument IS a root constant — the dangerous shape.
 *
 * A recursion helper or a root passed as a parameter defeats this, which is
 * measured: it catches 4 of the 62, and one of `xd1g`'s twelve. Kept anyway
 * because the two numbers TOGETHER are the finding — the gap between them is
 * what says a syntactic filter cannot answer this question.
 */
const SEEDED_AT_ROOT = [
  /\breaddirSync\(\s*(?:REPO_ROOT|INSTANCE_ROOT|ROOT)\b/,
  /\bscanSync\(\s*\{[^}]*\bcwd:\s*(?:REPO_ROOT|INSTANCE_ROOT|ROOT|root)\b/,
  /\bscan\(\s*\{[^}]*\bcwd:\s*(?:REPO_ROOT|INSTANCE_ROOT|ROOT|root)\b/,
  /\bwalk\(\s*(?:REPO_ROOT|INSTANCE_ROOT|ROOT)\b/,
];

/**
 * Asking git what the corpus is — the same DERIVED list, plus the two raw
 * spellings a caller may use without going through a helper.
 */
const GIT_AWARE = new RegExp(`${HELPER_CALL}|\\bgitListed\\b|ls-files`);

export interface ScanRow {
  file: string;
  /** Does the enumeration start at a root constant? The dangerous shape. */
  seededAtRoot: boolean;
  /** Does it ask git what the corpus is? */
  gitAware: boolean;
}

/** Every filesystem-enumerating script under `dir`, classified. */
export function census(dir: string): ScanRow[] {
  // ASKED OF GIT, which is the rule this file reports on — a version that
  // walked would exempt itself from its own census and would sweep a stray
  // `.ts` in build residue as a scanner to judge.
  const corpus = gitCorpus(dir, ["*.ts"]);
  if (corpus === undefined) return [];
  const out: ScanRow[] = [];
  for (const abs of corpus.sort()) {
    if (abs.endsWith(".test.ts") || abs.endsWith(".d.ts")) continue;
    let src: string;
    try {
      src = readFileSync(abs, "utf-8");
    } catch {
      continue;
    }
    if (!ROOT_BOUND.test(src) || !ENUMERATES.test(src)) continue;
    out.push({
      file: relative(REPO, abs).split(/[\\/]/).join("/"),
      seededAtRoot: SEEDED_AT_ROOT.some((r) => r.test(src)),
      gitAware: GIT_AWARE.test(src),
    });
  }
  return out;
}

function comparable(r: QaResult): string {
  const { updated_at: _when, ...rest } = r;
  return JSON.stringify(rest);
}

function sidecarState(fresh: QaResult): "absent" | "stale" | "current" {
  const p = join(INSTANCE_ROOT, QA_RESULTS_DIR, "root-scan-census.qa-results.json");
  if (!existsSync(p)) return "absent";
  try {
    return comparable(JSON.parse(readFileSync(p, "utf-8")) as QaResult) === comparable(fresh) ? "current" : "stale";
  } catch {
    return "stale";
  }
}

export function build(rows: readonly ScanRow[]): QaResult {
  const exposed = rows.filter((r) => r.seededAtRoot && !r.gitAware);
  const seeded = rows.filter((r) => r.seededAtRoot);
  return buildQaResult({
    script: relative(REPO, join(INSTANCE_ROOT, "scripts", "root-scan-census.ts")),
    scriptAbsPath: join(INSTANCE_ROOT, "scripts", "root-scan-census.ts"),
    subject: { kind: "root-scan-census", id: "scripts" },
    families: {
      "seeded-at-root-not-git-aware": {
        summary:
          `The shape that actually costs something: a scan whose start argument IS a root ` +
          `constant, that does not ask git. ${exposed.length} of ${seeded.length} such scans, ` +
          `${rows.length} enumerating scripts in all. Reported and NEVER failed — the owner's ` +
          `ruling of 2026-09-27, over the objection that a check which cannot fail is the ` +
          `1xhc pattern; what CAN fail here is the sidecar going stale.`,
        entries: exposed.map((r) => ({ file: r.file })),
      },
      "enumerating-scripts": {
        summary:
          `Every script that binds a root constant and enumerates the filesystem, with whether ` +
          `its scan is SEEDED at that root and whether it asks git. A FLOOR, not a count: both ` +
          `filters are syntactic, so a scanner spelled differently is missed — which is not ` +
          `hypothetical, since \`xd1g\`'s own list of eleven was one short (\`kg-audit\`, found by ` +
          `a sibling session). The two filters disagree by design: ${seeded.length} seeded at a ` +
          `root against ${rows.length} enumerating at all, and that GAP is the finding — it is ` +
          `why a syntactic check cannot answer this question and the guard lives in ` +
          `\`scripts/tests/git-corpus-conversions.test.ts\` instead.`,
        entries: rows.map((r) => ({ file: r.file, seededAtRoot: r.seededAtRoot, gitAware: r.gitAware })),
      },
    },
  });
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const rows = census(resolve(INSTANCE_ROOT, "scripts"));

  // A sweep prints its own denominator. A census over zero scripts passes
  // every assertion below and has measured nothing — `could not determine` is
  // never rendered as clean.
  if (rows.length === 0) {
    console.error("No enumerating script was found at all. That is not a clean run — nothing was censused.");
    process.exit(2);
  }

  const gitAware = rows.filter((r) => r.gitAware).length;
  const seeded = rows.filter((r) => r.seededAtRoot);
  const exposed = seeded.filter((r) => !r.gitAware);
  console.log(
    `root-scan census — ${rows.length} enumerating script(s), ${gitAware} ask git.\n` +
      `  seeded AT a root constant: ${seeded.length}; of those, not git-aware: ${exposed.length}`,
  );
  for (const r of exposed) console.log(`    · ${r.file}`);
  console.log(
    "  Both filters are syntactic, so this is a FLOOR. The loose one over-counts\n" +
      "  (a walk over one declared directory is fine) and the tight one under-counts\n" +
      "  (a recursion helper or a root passed as a parameter defeats it). The gap\n" +
      "  between them is the finding, not either number.",
  );

  const result = build(rows);
  const state = sidecarState(result);
  if (!check) writeQaResult(INSTANCE_ROOT, "root-scan-census", result);
  if (state !== "current") {
    const where = relative(REPO, join(INSTANCE_ROOT, QA_RESULTS_DIR, "root-scan-census.qa-results.json"));
    const msg = state === "absent" ? `no committed sidecar at ${where}` : `the committed sidecar at ${where} disagrees with this run`;
    // THE ONE THING THIS FAILS ON, and it is a real failure about a real
    // thing: the census moved and nobody looked. The findings above are
    // advisory; drift is not.
    console.log(check ? `\n✗ ${msg} — run \`bun run root-scan-census\` and commit it.` : `\n· ${msg} — written.`);
    if (check) process.exit(1);
  } else if (check) {
    console.log("\n✓ the committed census is current");
  }
  process.exit(0);
}
