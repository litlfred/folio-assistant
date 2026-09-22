/**
 * A pinned install must not fall back to an unpinned one.
 *
 * `bun install --frozen-lockfile` exists to FAIL when the lockfile does not
 * satisfy the manifest. `|| bun install` converts exactly that failure into an
 * unpinned resolve — silently, with a green step. **A check that degrades to a
 * pass when it fails is not a check**, and this is that defect in
 * supply-chain clothing.
 *
 * ## What was there, measured 2026-09-21
 *
 * **11 of 18** install steps carried the fallback, in two classes that look
 * alike and are not:
 *
 * **Class A — `cd content && bun install --frozen-lockfile 2>/dev/null || bun
 * install`** (4 sites). Worse than a defeated pin. In bash, when `cd content`
 * fails the `&&` short-circuits with cd's exit status, so `||` fires and `bun
 * install` runs in the **current** directory — the repository root. The
 * `2>/dev/null` hides cd's "No such file or directory". This repository has no
 * `content/`, so those four steps silently installed the wrong project's
 * dependencies, unpinned, and reported success. Verified by running it, not by
 * reading it.
 *
 * **Class B — `bun install --frozen-lockfile || bun install`** (7 sites) at the
 * repository root, where `bun.lock` exists. Here the fallback is purely the
 * defeated pin. Seven OTHER steps pin with no fallback at all, which is the
 * evidence it was never load-bearing.
 *
 * Class A is now a guard with three reported states — no folio, pinned, or
 * unpinned **with a `::warning::`** — because "there is no lockfile" and "the
 * lockfile did not match" are different facts and only one of them is fine.
 * Class B simply lost the fallback.
 *
 * ## The gap this gate shipped with, found by re-deriving its own number
 *
 * The first version reported *"11 of 18 install steps"*. Re-derived
 * adversarially: **18 was the count of LINES carrying `--frozen-lockfile`,
 * not of install steps.** 25 lines mention `bun install`, so the denominator
 * was the wrong set, and choosing it that way hid the rows it excluded —
 * **three install steps that never pinned at all**, one of them in the
 * RELEASE workflow, which is the worst possible place for an unpinned
 * resolve.
 *
 * Counting what matched a SHAPE rather than what satisfied the CONTRACT,
 * which is bean `w4tq`'s lesson arriving one workflow over.
 *
 * So the gate now asks both questions, and keeps them apart:
 *
 * | | |
 * |---|---|
 * | a pin that DEGRADES (`--frozen-lockfile \|\|`) | **fails, always, never baselined** |
 * | an install with NO pin | baselined; a NEW one fails |
 *
 * The split is not squeamishness. A degrading pin is a defect with no
 * defensible instance — the failure it swallows is the one it exists to
 * raise. An unpinned install sometimes IS right: the guarded blocks this
 * repository now uses fall back to one deliberately, and say so with a
 * `::warning::`. Failing on those would make the honest branch unreachable.
 *
 * ## What this gate does NOT claim
 *
 * It does not verify that any lockfile is *current*, or audit a single
 * dependency. Those are separate questions with separate evidence, and
 * answering them here would be the over-claiming this gate exists to catch.
 *
 * @module scripts/check-lockfile-pinning
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const WORKFLOWS = join(ROOT, ".github", "workflows");
const BASELINE = join(import.meta.dir, "lockfile-pinning-baseline.json");

/** A pinned install whose failure is swallowed by a fallback. */
const DEGRADING_PIN = /--frozen-lockfile[^\n]*\|\|/;

/** `cd <dir> && …` on one line: if the cd fails, everything after `||` runs in the WRONG cwd. */
const CD_AND_FALLBACK = /\bcd\s+\S+\s*&&[^\n]*\|\|/;

export interface PinFinding {
  workflow: string;
  line: number;
  text: string;
  why: string;
  /** `degrading` always fails; `unpinned` is baselined. */
  kind: "degrading" | "unpinned";
}

/** An install command with no `--frozen-lockfile` anywhere on the line. */
const UNPINNED_INSTALL = /\bbun install\b(?![^\n]*--frozen-lockfile)/;

export function scanWorkflows(dir: string = WORKFLOWS): PinFinding[] {
  const out: PinFinding[] = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    const lines = readFileSync(join(dir, f), "utf-8").split("\n");
    lines.forEach((text, i) => {
      if (DEGRADING_PIN.test(text)) {
        out.push({
          workflow: f,
          line: i + 1,
          text: text.trim(),
          kind: "degrading",
          why: "a pinned install that falls back to an unpinned one swallows the failure the pin exists to raise",
        });
      } else if (CD_AND_FALLBACK.test(text)) {
        out.push({
          workflow: f,
          line: i + 1,
          text: text.trim(),
          kind: "degrading",
          why: "`cd X && A || B` runs B in the CURRENT directory when the cd fails — not in X",
        });
      } else if (UNPINNED_INSTALL.test(text)) {
        out.push({
          workflow: f,
          line: i + 1,
          text: text.trim(),
          kind: "unpinned",
          why: "an install with no `--frozen-lockfile` resolves fresh, so the lockfile holds nothing here",
        });
      }
    });
  }
  return out;
}

/** Install steps that pin, for the reported count. A gate should say what it saw. */
export function countPinned(dir: string = WORKFLOWS): { pinned: number; guarded: number } {
  let pinned = 0;
  let guarded = 0;
  if (!existsSync(dir)) return { pinned, guarded };
  for (const f of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    const src = readFileSync(join(dir, f), "utf-8");
    pinned += (src.match(/bun install --frozen-lockfile/g) ?? []).length;
    guarded += (src.match(/no content\/ in this checkout/g) ?? []).length;
  }
  return { pinned, guarded };
}

/** The backlog key for an unpinned install. Keyed by the COMMAND, not the line
 * number — a line number moves when an unrelated step is added above it, and a
 * baseline that churns on every edit is one nobody keeps accurate. */
export function baselineKey(f: PinFinding): string {
  return `${f.workflow}: ${f.text}`;
}

function readBaseline(): string[] {
  if (!existsSync(BASELINE)) return [];
  return (JSON.parse(readFileSync(BASELINE, "utf-8")) as { known: string[] }).known;
}

if (import.meta.main) {
  const findings = scanWorkflows();
  const { pinned, guarded } = countPinned();
  const degrading = findings.filter((f) => f.kind === "degrading");
  const unpinned = findings.filter((f) => f.kind === "unpinned");

  if (process.argv.includes("--write-baseline")) {
    const known = [...new Set(unpinned.map(baselineKey))].sort();
    writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          _comment:
            "Install steps that deliberately resolve UNPINNED. Four are the documented fallback branch of a " +
            "presence guard, which emits ::warning:: when it takes them — failing on those would make the honest " +
            "branch unreachable. A DEGRADING pin is never baselined: the failure it swallows is the one it exists " +
            "to raise, and no instance of that is defensible. Keyed by command rather than line number, so an " +
            "unrelated step added above does not churn the file. Refresh with --write-baseline.",
          known,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`  ✓ baseline written — ${known.length} deliberately unpinned install step(s)`);
    process.exit(0);
  }

  const known = new Set(readBaseline());
  const keys = new Set(unpinned.map(baselineKey));
  const novel = [...keys].filter((k) => !known.has(k));
  const stale = [...known].filter((k) => !keys.has(k));

  console.log(
    `Lockfile pinning (${pinned} pinned install step(s), ${guarded} behind a presence guard, ` +
      `${unpinned.length} deliberately unpinned)`,
  );

  let bad = false;
  for (const f of degrading) {
    console.log(`  ✗ ${f.workflow}:${f.line} — ${f.why}`);
    console.log(`      ${f.text}`);
    bad = true;
  }
  for (const k of novel) {
    console.log(`  ✗ NEW unpinned install: ${k}`);
    console.log("      Pin it, or guard on presence and say `::warning::` when it falls back.");
    bad = true;
  }
  for (const k of stale) {
    console.log(`  ✗ stale baseline entry, remove it: ${k}`);
    bad = true;
  }

  if (!bad) {
    console.log("  ✓ no pin degrades, no `cd X && A || B` runs B in the wrong directory, no NEW unpinned install");
    process.exit(0);
  }
  console.log("");
  console.log("  A pin that falls back is not a pin. Guard on PRESENCE instead, and report");
  console.log("  `no lockfile` as its own state — a check that degrades to a pass is the");
  console.log("  defect, not the fix.");
  process.exit(1);
}
