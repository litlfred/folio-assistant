/**
 * The gate sweep is DERIVED from the workflow, not transcribed.
 *
 * @module scripts/tests/ci-gates
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { WORKFLOW, gates, gatesIn, isMissingBrowser } from "../ci-gates.ts";

const ROOT = resolve(import.meta.dir, "../..");

describe("commands inside a folded `run: |` block are found", () => {
  test("the hand-written grep's blind spot is covered", () => {
    // `grep 'run: bun run'` matches only the first of these. That miss is the
    // whole reason this module exists: a sweep built that way reported 27 of
    // the workflow's 33 gates green while `gen-skill-docs.ts --check` failed
    // in CI, never having been run locally.
    const yaml = [
      "      - name: one-liner",
      "        run: bun run check:alpha",
      "      - name: folded",
      "        run: |",
      "          set -e",
      "          bun run check:beta",
      "          bun run scripts/gen-skill-docs.ts --check",
    ].join("\n");
    expect(gatesIn(yaml)).toEqual(["check:alpha", "check:beta", "scripts/gen-skill-docs.ts --check"]);
  });

  test("a checker is kept distinct from its writer", () => {
    // `check:l1-complete` writes sidecars; `-- --check` fails on a stale one.
    // Collapsing them would run the writer twice and gate on nothing.
    const g = gatesIn("bun run check:l1-complete\nbun run check:l1-complete -- --check");
    expect(g).toEqual(["check:l1-complete", "check:l1-complete -- --check"]);
  });

  test("duplicates collapse, order is the file's", () => {
    expect(gatesIn("bun run a\nbun run b\nbun run a")).toEqual(["a", "b"]);
  });
});

describe("against the real workflow", () => {
  test("the three gates the hand-written list missed are present", () => {
    const g = gates(ROOT);
    for (const missed of [
      "scripts/gen-skill-docs.ts --check",
      "scripts/gen-schema-docs.ts --check",
      "scripts/gen-docs-pages.ts --check",
    ]) {
      expect(g).toContain(missed);
    }
  });

  test("every gate found is really in the workflow file", () => {
    // The extraction is only useful if it neither invents nor drops. Invention
    // is checked here; dropping is checked by the count below.
    const yaml = readFileSync(join(ROOT, WORKFLOW), "utf-8");
    for (const g of gates(ROOT)) expect(yaml).toContain(`bun run ${g}`);
  });

  test("nothing on a non-comment line is dropped", () => {
    // A looser pattern over the same file, so a tightening of the main regex
    // that silently drops a gate fails here.
    //
    // COMMENT LINES ARE STRIPPED FIRST, and that is not a convenience. This
    // workflow documents its own past defects in prose — one comment quotes
    // the folded line that once ran `agent-memory:check bun run
    // scripts/gen-docs-pages.ts --check` as a single command (bean `d2kp`),
    // and another names `bun run lint` mid-sentence. A scan that counted
    // those would report three gates nobody runs, which is a different lie
    // from the one this module exists to stop but a lie all the same.
    const yaml = readFileSync(join(ROOT, WORKFLOW), "utf-8")
      .split("\n")
      .filter((l) => !/^\s*#/.test(l))
      .join("\n");
    const loose = new Set([...yaml.matchAll(/bun run ([^\n|&;]+)/g)].map((m) => m[1].trim()));
    const found = new Set(gates(ROOT));
    expect([...loose].filter((g) => !found.has(g))).toEqual([]);
    expect(found.size).toBe(loose.size);
  });
});

describe("a gate that could not run is a third state", () => {
  test("Playwright's own words identify a missing browser", () => {
    for (const out of [
      "browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium",
      "Looks like Playwright was just installed. Please run: playwright install",
    ]) {
      expect(isMissingBrowser(out)).toBe(true);
    }
  });

  test("a real failure is NOT reclassified as environmental", () => {
    // The match is on Playwright's wording rather than anything as loose as
    // "browser", so a genuine defect that happens to mention one stays a
    // failure. Reclassifying it would be the same lie in the other direction.
    for (const out of [
      "generated docs are STALE (1 file(s)); re-run without --check:",
      "error: 3 svg(s) out of date — browser rendering differs from the source",
      "AssertionError: expected 33 to be 35",
    ]) {
      expect(isMissingBrowser(out)).toBe(false);
    }
  });
});
