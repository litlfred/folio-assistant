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
 * ## What this gate does NOT claim
 *
 * It does not verify that any lockfile is *current*, or audit a single
 * dependency. Those are separate questions with separate evidence, and
 * answering them here would be the over-claiming this gate exists to catch.
 * It checks one thing: no pin in this repository silently degrades.
 *
 * @module scripts/check-lockfile-pinning
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const WORKFLOWS = join(ROOT, ".github", "workflows");

/** A pinned install whose failure is swallowed by a fallback. */
const DEGRADING_PIN = /--frozen-lockfile[^\n]*\|\|/;

/** `cd <dir> && …` on one line: if the cd fails, everything after `||` runs in the WRONG cwd. */
const CD_AND_FALLBACK = /\bcd\s+\S+\s*&&[^\n]*\|\|/;

export interface PinFinding {
  workflow: string;
  line: number;
  text: string;
  why: string;
}

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
          why: "a pinned install that falls back to an unpinned one swallows the failure the pin exists to raise",
        });
      } else if (CD_AND_FALLBACK.test(text)) {
        out.push({
          workflow: f,
          line: i + 1,
          text: text.trim(),
          why: "`cd X && A || B` runs B in the CURRENT directory when the cd fails — not in X",
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

if (import.meta.main) {
  const findings = scanWorkflows();
  const { pinned, guarded } = countPinned();
  console.log(`Lockfile pinning (${pinned} pinned install step(s), ${guarded} behind a presence guard)`);
  if (findings.length === 0) {
    console.log("  ✓ no pin degrades to an unpinned install, and no `cd X && A || B` can run B in the wrong directory");
    process.exit(0);
  }
  for (const f of findings) {
    console.log(`  ✗ ${f.workflow}:${f.line} — ${f.why}`);
    console.log(`      ${f.text}`);
  }
  console.log("");
  console.log("  A pin that falls back is not a pin. Guard on PRESENCE instead, and report");
  console.log("  `no lockfile` as its own state — see skills/folio-core/untainted-verification.md");
  console.log("  for why a check that degrades to a pass is the defect, not the fix.");
  process.exit(1);
}
