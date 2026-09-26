/**
 * A declared directory exists, or says why it does not — both directions.
 *
 * @module scripts/tests/declared-dirs.test
 *
 * ## Why this check had to be written at all
 *
 * `resolveDirectories` is existence-filtered, so an absent declared directory
 * is dropped before any consumer sees it. Every consumer then reports a clean
 * run over nothing — the `dh4f` shape inside the resolver they all depend on.
 * Bean `8mbk`.
 *
 * ## The resolution rule is what this module got wrong first
 *
 * `scope: "repository"` resolves against the repository root, anything else
 * against the declaring instance's. A first measurement for `8mbk` joined
 * repo-scoped paths belonging to OTHER instances onto the instance root and
 * reported ten phantom absences out of 35 — every one the checker's own error.
 * So the rule gets a test of its own rather than living only inside the sweep.
 *
 * ## Falsified before it was trusted
 *
 * | break | result |
 * |---|---|
 * | phantom directory, no reason | **1 finding**, exit 1 |
 * | same, with `absent.reason` | 0 findings, exit 0 |
 * | `absent.reason` on a directory that EXISTS | **1 finding**, exit 1 |
 * | restored | 0 findings across 66 directories, 14 instances |
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { auditInstance, resolveDeclaredPath } from "../check-declared-dirs.ts";

const REPO = resolve(import.meta.dir, "../../..");
const made: string[] = [];

/** An instance declaring exactly the directories given. */
function instance(dirs: Array<Record<string, unknown>>): string {
  const root = mkdtempSync(join(tmpdir(), "declared-dirs-"));
  made.push(root);
  mkdirSync(root, { recursive: true });
  // The stem MUST equal `name`: `findDeclarationFile` matches on
  // `raw.name === stem`, so a `harness.json` declaring `name: "fixture"` is
  // not found at all — the fixture reads as an instance with no declaration,
  // and every assertion below passes over nothing.
  writeFileSync(
    join(root, "fixture.json"),
    JSON.stringify(
      { $schema: "folio-harness/v1", name: "fixture", directories: dirs },
      null,
      2,
    ),
  );
  return root;
}

afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const dir = (over: Record<string, unknown> = {}) => ({
  id: "t",
  path: "somewhere/",
  dependents: "reproduce",
  graphKinds: ["schemas"],
  ...over,
});

describe("the resolution rule", () => {
  test("`scope: repository` resolves against the repo, not the instance", () => {
    // `join` keeps the trailing slash a declared path carries.
    expect(resolveDeclaredPath({ path: "a/", scope: "repository" }, "/i", "/r")).toBe("/r/a/");
  });

  test("anything else resolves against the instance", () => {
    // The direction the first measurement got backwards.
    expect(resolveDeclaredPath({ path: "a/" }, "/i", "/r")).toBe("/i/a/");
    expect(resolveDeclaredPath({ path: "a/", scope: "instance" }, "/i", "/r")).toBe("/i/a/");
  });
});

describe("absent and unexplained is a finding", () => {
  test("a declared directory that is not on disk", () => {
    const root = instance([dir()]);
    const f = auditInstance(root, REPO);
    expect(f).toHaveLength(1);
    expect(f[0]!.kind).toBe("absent");
  });

  test("...and `absent.reason` clears it", () => {
    const root = instance([dir({ absent: { reason: "deliberate, and here is why" } })]);
    expect(auditInstance(root, REPO)).toEqual([]);
  });
});

describe("explained but present is ALSO a finding", () => {
  test("an exemption that outlived its cause", () => {
    // The direction that rots quietly: nothing goes wrong when it does, so
    // nobody notices the declaration still claims a deliberate absence.
    const root = instance([dir({ absent: { reason: "was deliberate once" } })]);
    mkdirSync(join(root, "somewhere"), { recursive: true });
    const f = auditInstance(root, REPO);
    expect(f).toHaveLength(1);
    expect(f[0]!.kind).toBe("stale-exemption");
  });
});

describe("a file at the declared path is not the directory being there", () => {
  test("it is still reported absent", () => {
    // `existsSync` alone passes on a file, and a consumer calling `readdirSync`
    // on it throws rather than reporting an empty graph.
    const root = instance([dir()]);
    writeFileSync(join(root, "somewhere"), "not a directory");
    const f = auditInstance(root, REPO);
    expect(f).toHaveLength(1);
    expect(f[0]!.kind).toBe("absent");
  });
});

describe("the real corpus", () => {
  test("every declared directory in this repository resolves", async () => {
    const { instanceRootsIn } = await import("../../schemas/cat-harness.ts");
    await import("../../schemas/folio-graph-kind.ts");
    const roots = instanceRootsIn(REPO);
    // Vacuity guard: an empty discovery would make the assertion below pass
    // over nothing, which is the shape this whole check exists to catch.
    expect(roots.length).toBeGreaterThan(1);
    const all = roots.flatMap((r) => auditInstance(r, REPO));
    expect(all).toEqual([]);
  });
});
