/**
 * `bun run regen` — repair the artefacts a merge left wrong, by asking the gates.
 *
 * Bean `lxpq`. The command's whole value is that it distinguishes STALENESS
 * from a real defect, so the assertions that matter are the ones about the
 * states it reports, not the happy path.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { WRITER_OVERRIDES, repairableGates, scriptOf, writerFor } from "../regen-after-merge.ts";
import { loadGates } from "../gates.ts";
import { repoRootFor } from "../../schemas/cat-harness.ts";

const INSTANCE = join(import.meta.dir, "..", "..");
const REPO = repoRootFor(INSTANCE);
const SCRIPTS = (JSON.parse(readFileSync(join(REPO, "package.json"), "utf-8")) as {
  scripts: Record<string, string>;
}).scripts;

describe("the pair is READ, never assumed", () => {
  test("`X:check` pairs with `X` when `X` exists", () => {
    expect(writerFor(SCRIPTS, "voices:viz:check")).toBe("voices:viz");
    expect(writerFor(SCRIPTS, "kg:audit:check")).toBe("kg:audit");
  });

  test("a check whose writer does NOT exist returns undefined, not a guess", () => {
    // The failure mode this prevents: a writer renamed out from under its
    // check, where composing the name by convention would produce a command
    // that runs nothing and a report that claims a repair.
    expect(writerFor({ "thing:check": "x" }, "thing:check")).toBeUndefined();
  });

  test("a script that is not a `:check` has no writer", () => {
    expect(writerFor(SCRIPTS, "lint")).toBeUndefined();
  });
});

describe("only a gate that runs EXACTLY one script is repairable", () => {
  test("a plain `bun run X` yields X", () => {
    expect(scriptOf("bun run voices:viz:check")).toBe("voices:viz:check");
    expect(scriptOf("  bun run kg:audit:check  ")).toBe("kg:audit:check");
  });

  test("anything else yields undefined rather than a partial match", () => {
    // A compound or argument-carrying command cannot be paired with a writer
    // by name, and pretending otherwise would run the wrong thing.
    expect(scriptOf("bun run a && bun run b")).toBeUndefined();
    expect(scriptOf("bun test")).toBeUndefined();
    expect(scriptOf("bunx tsc --noEmit -p tsconfig.json")).toBeUndefined();
    expect(scriptOf("bun run gen-voices-viz.ts --check")).toBeUndefined();
  });
});

describe("the set comes from the WORKFLOW, not from package.json", () => {
  // `gates.ts` measured that 21 of this repository's `:check` scripts appear
  // in no workflow at all. Deriving the set from package.json would run
  // generators CI does not gate — a guess that reads as coverage.
  const gates = loadGates(REPO, {});
  const pairs = repairableGates(gates, SCRIPTS);

  test("it finds a real, non-empty set", () => {
    expect(pairs.length).toBeGreaterThan(10);
  });

  test("...and a STRICT subset of package.json's check scripts", () => {
    // BOTH naming conventions, `X:check` and `check:X`. This filter carried
    // only the first until 2026-09-30 and so encoded the very narrowness that
    // let `regen` report a fixed point over a stale `check:term-mapping` —
    // the test agreeing with the code about a rule both had wrong. (Same
    // shape as `staging-only-publish.test.ts` earlier in this arc: a test
    // that restates its subject's rule cannot falsify it.)
    const allChecks = Object.keys(SCRIPTS).filter(
      (s) => s.endsWith(":check") || s.startsWith("check:") || WRITER_OVERRIDES[s] !== undefined,
    );
    expect(pairs.length).toBeLessThan(allChecks.length);
    for (const p of pairs) expect(allChecks).toContain(p.check);
  });

  test("every pair it reports as repairable has a writer that exists", () => {
    for (const p of pairs) {
      if (p.writer === undefined) continue;
      expect(SCRIPTS[p.writer]).toBeDefined();
    }
  });

  test("the voices check — the one that broke main — is in the set", () => {
    // The regression. `lxpq` reached main through exactly this check, so a
    // repair command that did not cover it would be answering a different
    // question from the one it was written for.
    expect(pairs.map((p) => p.check)).toContain("voices:viz:check");
    expect(pairs.find((p) => p.check === "voices:viz:check")?.writer).toBe("voices:viz");
  });

  test("a gate listed twice is offered once", () => {
    const names = pairs.map((p) => p.check);
    expect(names.length).toBe(new Set(names).size);
  });
});

describe("a check with no writer is REPORTED, never skipped", () => {
  test("it is carried through as a pair with an undefined writer", () => {
    // Not filtered out: "this check failed and nothing can regenerate it" is
    // a finding, and dropping it would leave a red check invisible to the one
    // command a person runs after a merge.
    const fake = [
      { job: "j", step: "s", command: "bun run orphan:check" },
      { job: "j", step: "s", command: "bun run voices:viz:check" },
    ];
    const pairs = repairableGates(fake, SCRIPTS);
    expect(pairs.map((p) => p.check)).toEqual(["orphan:check", "voices:viz:check"]);
    expect(pairs[0]!.writer).toBeUndefined();
    expect(pairs[1]!.writer).toBe("voices:viz");
  });
});

describe("a writer that is not <check minus :check> is DECLARED (bean eowd)", () => {
  test("translate-bpmn:check is repaired by the script that writes, not the one that reports", () => {
    expect(writerFor(SCRIPTS, "translate-bpmn:check")).toBe("translate-bpmn:extract");
    expect(SCRIPTS["translate-bpmn:extract"]).toContain("--extract");
  });
  test("the audit-coverage gates are offered, with audit:coverage as their writer", () => {
    const pairs = repairableGates(loadGates(REPO, {}), SCRIPTS);
    for (const gate of ["audit:coverage:strict", "audit:coverage:require-all"]) {
      expect(pairs.find((p) => p.check === gate)?.writer).toBe("audit:coverage");
    }
  });
  test("every override names a writer that exists — a renamed writer is a finding, not a guess", () => {
    for (const w of Object.values(WRITER_OVERRIDES)) expect(SCRIPTS[w]).toBeDefined();
  });
});

/*
 * THE PREFIX CONVENTION, and it was a false clean rather than a missing
 * feature.
 *
 * This repository names a verifying script two ways — `X:check` and
 * `check:X` — and `regen` read only the first. So on 2026-09-30 it printed
 *
 *   73 current, 0 regenerated, 0 unrepaired, 0 without a writer
 *
 * over a tree where `check:term-mapping` was stale, and CI then failed on
 * exactly that gate. A gate the discovery never offers cannot even be
 * reported as `no-writer`, so the one line this command exists to be trusted
 * on was wrong in the direction that reads as success.
 *
 * Two halves had to change, and the first attempt fixed only the readable
 * one: teaching `writerFor` the prefix left the count at 73, because
 * `repairableGates` filters on the name BEFORE asking for a writer. Both are
 * asserted here for that reason.
 */
describe("check:X is a pair too — bean `q7ey`'s CI failure", () => {
  test("writerFor resolves the prefix form, in both separator spellings", () => {
    // Same script, --check vs not.
    expect(writerFor(SCRIPTS, "check:raci")).toBe("raci");
    expect(writerFor(SCRIPTS, "check:subgraphs")).toBe("subgraphs");
    // The writer spells with a colon where the check spells with a hyphen,
    // which is why the lookup tries both rather than swapping separators.
    expect(writerFor(SCRIPTS, "check:term-mapping")).toBe("term:mapping");
  });

  test("a check:X with no writer is still not a pair", () => {
    // Most of the `check:*` family are pure verifiers. Inventing a writer for
    // them would turn a correct silence into a command that runs nothing.
    expect(writerFor({ "check:thing": "x" }, "check:thing")).toBeUndefined();
    expect(writerFor(SCRIPTS, "check:partition")).toBeUndefined();
  });

  test("repairableGates OFFERS the prefix pairs — the half the first fix missed", () => {
    const gates = loadGates(REPO, {});
    const pairs = repairableGates(gates, SCRIPTS);
    const byCheck = new Map(pairs.map((p) => [p.check, p.writer]));
    for (const [check, writer] of [
      ["check:term-mapping", "term:mapping"],
      ["check:raci", "raci"],
      ["check:subgraphs", "subgraphs"],
    ] as const) {
      expect(byCheck.has(check), `${check} is not offered, so it can never be repaired OR reported`).toBe(true);
      expect(byCheck.get(check)).toBe(writer);
    }
  });

  test("a pure check:* verifier is not listed as a pair at all", () => {
    const gates = loadGates(REPO, {});
    const checks = new Set(repairableGates(gates, SCRIPTS).map((p) => p.check));
    // Listing these as `no-writer` would drown the finding the command exists
    // to surface, so they must be absent rather than present-and-empty.
    expect(checks.has("check:partition")).toBe(false);
    expect(checks.has("check:glossary")).toBe(false);
  });
});
