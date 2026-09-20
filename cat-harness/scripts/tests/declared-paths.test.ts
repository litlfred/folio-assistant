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

  /**
   * `*.test.ts` was skipped from this module's first commit with no reason
   * recorded anywhere, and cost three breakages before anyone asked (bean
   * `dhol`). The worst was a test that composed a path to a moved diagram,
   * went ENOENT, and reported a FALSE FINDING ABOUT THE CORPUS.
   *
   * An exclusion that was never argued can be re-added by anyone who finds
   * the 407 test literals startling, and the startle is legitimate — so the
   * argument has to be pinned somewhere a re-adder trips over. The module
   * header carries it; this carries the consequence.
   */
  test("tests are scanned — the exclusion cost three breakages and had no reason", () => {
    const fromTests = [...scan.refused, ...scan.artefacts, ...scan.marked]
      .filter((s) => s.file.endsWith(".test.ts"));
    expect(fromTests.length, "*.test.ts is being skipped again — read the module header").toBeGreaterThan(100);
  });

  /**
   * The protection the inclusion actually buys, as a property rather than as
   * one run's result: a test naming a real artefact is checked to dereference,
   * so relocating that artefact without updating the test raises the file
   * above baseline. Verified by moving `crdm-deliver.bpmn` and watching
   * `bpmn-translate.test.ts` go 0 → 1.
   *
   * Asserted as a floor and not a count: the number churns with every test
   * that names a diagram, and a count in a test is the claim this repo
   * already refuses in prose.
   */
  test("test literals naming real artefacts are checked to dereference", () => {
    const guarded = scan.artefacts.filter((a) => a.file.endsWith(".test.ts"));
    expect(guarded.length, "no test names a real artefact — the relocation guard is vacuous").toBeGreaterThan(20);
  });
});
