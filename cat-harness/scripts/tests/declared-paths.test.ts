/**
 * No file gains a hardcoded path that `harness.json` already declares.
 *
 * ## Why a test and not a CI flag
 *
 * Same answer as `activity-skill-coverage.test.ts`: the property was just
 * established and this asserts exactly it. The gate itself ships as a
 * ratchet — 125 sites of recorded debt that may only shrink — so what a test
 * can pin down is the *shape* of the property, not a clean slate.
 *
 * ## The three assertions, and what each would miss alone
 *
 *  - **The scan is non-empty.** Without it, renaming a source directory turns
 *    every assertion below into a vacuous pass. Same guard its sibling opens
 *    with, and for the same reason.
 *  - **No file exceeds its baseline.** The ratchet.
 *  - **Every marked site carries a reason.** The exemption is the escape
 *    hatch, and an exemption with no reason is a rubber stamp — the rule
 *    `<folio:no-skill reason="…"/>` already enforces at load time.
 *  - **Every literal classed as an artefact dereferences.** The classifier
 *    only admits a literal that resolved when it ran; re-asserting it here is
 *    what makes the `blv9` close (a link-shaped value that does not
 *    dereference) a property of the corpus rather than of one run.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { scanDeclaredPaths } from "../check-declared-paths.js";

const root = resolve(import.meta.dir, "../..");
const scan = scanDeclaredPaths(root);

describe("declared-path literals", () => {
  test("the scan saw something — otherwise nothing below proves anything", () => {
    expect(scan.prefixes.length).toBeGreaterThan(5);
    expect(scan.artefacts.length + scan.marked.length + scan.refused.length).toBeGreaterThan(100);
  });

  test("no file exceeds its recorded baseline", () => {
    const baselinePath = join(root, "scripts", "declared-path-baseline.json");
    expect(existsSync(baselinePath), "the ratchet needs a committed baseline").toBe(true);
    const prior = (JSON.parse(readFileSync(baselinePath, "utf-8")) as { files: Record<string, number> }).files;

    const current: Record<string, number> = {};
    for (const r of scan.refused) current[r.file] = (current[r.file] ?? 0) + 1;

    const over = Object.entries(current)
      .filter(([f, n]) => n > (prior[f] ?? 0))
      .map(([f, n]) => `${f}: ${prior[f] ?? 0} → ${n}`);
    expect(over, "read the declaration, or mark the site with a reason").toEqual([]);
  });

  test("every exemption carries a reason", () => {
    const bare = scan.marked.filter((m) => m.reason.trim().length < 10).map((m) => `${m.file}:${m.line}`);
    expect(bare, "`declared-path-literal:` with no reason is a rubber stamp").toEqual([]);
  });

  test("every literal admitted as an artefact dereferences", () => {
    const dead = scan.artefacts.filter((a) => !existsSync(join(root, a.literal)));
    expect(dead.map((d) => `${d.file}:${d.line} → ${d.literal}`)).toEqual([]);
  });
});
