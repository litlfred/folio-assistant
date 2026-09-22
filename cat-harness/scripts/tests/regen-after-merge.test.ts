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

import { repairableGates, scriptOf, writerFor } from "../regen-after-merge.ts";
import { loadGates } from "../gates.ts";
import { repoRootFor } from "../../schemas/cat-harness.ts";
import "../../schemas/folio-graph-kind.js";

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
    const allChecks = Object.keys(SCRIPTS).filter((s) => s.endsWith(":check"));
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
