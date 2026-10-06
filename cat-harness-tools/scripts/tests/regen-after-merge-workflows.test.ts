/**
 * `regen-after-merge` tests that read the aggregate repository's own root —
 * `.github/workflows/code-quality-gates.yml` — moved here from
 * `cat-harness/scripts/tests/regen-after-merge.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  NO_WRITER,
  UNGATED_INPUTS,
  WRITER_OVERRIDES,
  repairableGates,
  scriptOf,
} from "../../../cat-harness/scripts/regen-after-merge.ts";
import { loadGates } from "../../../cat-harness/scripts/gates.ts";
import { repoRootFor } from "../../../cat-harness/schemas/cat-harness.ts";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const INSTANCE = join(ORIGIN_DIR, "..", "..");
const REPO = repoRootFor(INSTANCE);
const SCRIPTS = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as {
  scripts: Record<string, string>;
}).scripts;

describe("a writer that is not <check minus :check> is DECLARED (bean eowd)", () => {
  test("the audit-coverage gates are offered, with audit:coverage as their writer", () => {
    const pairs = repairableGates(loadGates(REPO, {}), SCRIPTS);
    for (const gate of ["audit:coverage:strict", "audit:coverage:require-all"]) {
      expect(pairs.find((p) => p.check === gate)?.writer).toBe("audit:coverage");
    }
  });
});

describe("a `check:X` gate is paired only by DECLARATION — bean `uju6`", () => {

  test("every `check:X` that is some script's command plus ` --check` is decided — paired or recorded", () => {
    // The measurement that found `check:glossary` (main red at 7bdda74) after
    // uju6 had listed four. Composing the pair from the COMMAND, not the name,
    // is how a fifth and sixth were found; this keeps a seventh from hiding.
    const byCmd = new Map(Object.entries(SCRIPTS).map(([k, v]) => [String(v).trim(), k]));
    // The WHOLE gate set, not the fast one (bean `g5kt`). `regen --all` asks
    // the browser jobs' and other workflows' pairs too, so a `check:X` gate
    // that lives only there was derived by exactly the convention this test
    // exists to police and no assertion reached it.
    const gates = loadGates(REPO, { all: true });
    for (const g of gates) {
      const c = scriptOf(g.command);
      if (c === undefined || !c.startsWith("check:") || c.endsWith(":check")) continue;
      const cmd = String(SCRIPTS[c] ?? "").trim();
      if (!cmd.endsWith(" --check")) continue;
      if (!byCmd.has(cmd.slice(0, -" --check".length).trim())) continue;
      expect(WRITER_OVERRIDES[c] !== undefined || NO_WRITER[c] !== undefined, `${c} is undecided`).toBe(true);
    }
  });
});

describe("UNGATED_INPUTS — writers regen runs without making them gates (bean 5qq3)", () => {
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as { scripts: Record<string, string> };

  test("none of them is a gate — the owner's 2026-09-20 ruling keeps them ungated", () => {
    // If one of these BECOMES a gate, it belongs in the gated set and this list
    // must drop it, or regen asks it twice under two different reasons.
    const gated = new Set(repairableGates(loadGates(REPO, { all: true }), pkg.scripts).map((p) => p.check));
    for (const { check } of UNGATED_INPUTS) expect(gated.has(check), `${check} is gated now`).toBe(false);
  });
});

describe("a writer must WRITE — bean `i1q7`", () => {

  test("no pair regen uses runs its CHECK as its writer, or a writer that is itself a check", () => {
    const pairs = [...UNGATED_INPUTS, ...repairableGates(loadGates(REPO, { all: true }), SCRIPTS)];
    for (const p of pairs) {
      if (p.writer === undefined) continue;
      expect(p.writer, p.check).not.toBe(p.check);
      expect(SCRIPTS[p.writer], `${p.check}'s writer ${p.writer}`).not.toMatch(/--check\b/);
    }
  });
});

describe("the default asks the WHOLE gate set — bean `i1q7`, item 3", () => {
  test("render:bpmn:check and bat:sync:check are pairs regen asks by default", () => {
    // They are outside the fast set only because the e2e job installs a
    // browser. regen never runs `playwright test`, so that boundary is not
    // regen's, and render:bpmn was stale after every merge that changed a
    // process while regen printed it as a footnote.
    const pairs = repairableGates(loadGates(REPO, { all: true }), SCRIPTS);
    expect(pairs.find((p) => p.check === "render:bpmn:check")?.writer).toBe("render:bpmn");
    expect(pairs.find((p) => p.check === "bat:sync:check")?.writer).toBe("bat:sync");
  });
});
