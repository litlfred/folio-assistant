/**
 * The generic half of the exporter serves an instance that is NOT this one.
 *
 * @module scripts/tests/kg-export-instance.test
 *
 * Bean `gn4l`. These assertions run against **bootstrap**, a real instance in
 * this repository that has a declaration, two skills, no BPMN, no `tools/`,
 * no `package.json` and no `.claude/` — which is exactly the shape the
 * exporter was never written for.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { COLLECTOR_SCOPE, collectInstanceNodes } from "../kg-export.js";

const ROOT = resolve(import.meta.dir, "../..");
const BASE = "https://example.org";
const DOC = "https://example.org/x.jsonld";

const typesOf = (nodes: Array<Record<string, unknown>>): Map<string, number> => {
  const m = new Map<string, number>();
  for (const n of nodes) {
    const t = String(n["@type"] ?? "?").split(/[#/]/).pop()!;
    m.set(t, (m.get(t) ?? 0) + 1);
  }
  return m;
};

describe("a minimal instance exports through the same code path", () => {
  test("bootstrap contributes its declared skills", async () => {
    // The whole point: `kg-export` could not see these at all before, because
    // it walked THIS repository regardless of what it was asked about.
    const problems: string[] = [];
    const { nodes } = await collectInstanceNodes(join(ROOT, "bootstrap"), DOC, BASE, problems);
    expect(typesOf(nodes).get("Skill")).toBeGreaterThan(0);
  });

  test("and its declaration, without borrowing this repository's", async () => {
    const problems: string[] = [];
    const { nodes } = await collectInstanceNodes(join(ROOT, "bootstrap"), DOC, BASE, problems);
    const dirs = typesOf(nodes).get("Directory") ?? 0;
    const rootDirs = typesOf(
      (await collectInstanceNodes(ROOT, DOC, BASE, [])).nodes,
    ).get("Directory")!;
    // Bootstrap declares ONE directory; this repository declares many. Equal
    // counts would mean the root's declaration leaked in.
    expect(dirs).toBe(1);
    expect(rootDirs).toBeGreaterThan(dirs);
  });

  test("the root instance still exports everything it did", async () => {
    // The refactor's own guard. `bun run kg:export` output was verified
    // byte-identical apart from `generatedAt`; this keeps the shape pinned
    // without pinning a COUNT, which would make "it still works" and
    // "somebody deleted a diagram" indistinguishable.
    const { nodes } = await collectInstanceNodes(ROOT, DOC, BASE, []);
    const t = typesOf(nodes);
    for (const kind of ["Skill", "Process", "SequenceFlow", "Role", "ProcessNode"]) {
      expect({ kind, present: (t.get(kind) ?? 0) > 0 }).toEqual({ kind, present: true });
    }
  });
});

describe("what was not looked for is not reported as clean", () => {
  test("instance-bound collectors are named as omitted, not silently skipped", async () => {
    // "This instance has no tools" and "tools were never looked for" are
    // different facts. Collapsing them is the `dh4f` defect.
    const { omitted } = await collectInstanceNodes(join(ROOT, "bootstrap"), DOC, BASE, []);
    expect([...omitted].sort()).toEqual(["packages", "registry", "schemas", "tools"]);
  });

  test("an absent workflow directory is a problem, not a crash", async () => {
    // It threw ENOENT while this was being written: a directory found under
    // one root and joined against another.
    const problems: string[] = [];
    await collectInstanceNodes(join(ROOT, "bootstrap"), DOC, BASE, problems);
    expect(problems.some((p) => p.includes("bpmn"))).toBe(true);
  });

  test("an instance with no declaration at all does not throw", async () => {
    const root = mkdtempSync(join(tmpdir(), "kgx-"));
    const problems: string[] = [];
    const { nodes } = await collectInstanceNodes(root, DOC, BASE, problems);
    rmSync(root, { recursive: true, force: true });
    // Universal nodes still come back; nothing instance-specific does.
    expect(typesOf(nodes).get("GraphKind")).toBeGreaterThan(0);
    expect(typesOf(nodes).get("Skill") ?? 0).toBe(0);
  });

  test("a declared-but-ABSENT directory is reported", async () => {
    // `AGENTS.md`: a declared-but-absent directory is the `dh4f` defect,
    // where a consumer scans nothing and reports a clean run over it.
    const root = mkdtempSync(join(tmpdir(), "kgx-absent-"));
    mkdirSync(join(root, "skills"), { recursive: true });
    writeFileSync(
      join(root, "harness.json"),
      JSON.stringify({
        name: "absent",
        directories: [{ id: "cat-harness", path: "skills/", graphs: ["cat-harness"] }],
      }),
    );
    const problems: string[] = [];
    await collectInstanceNodes(root, DOC, BASE, problems);
    rmSync(root, { recursive: true, force: true });
    expect(problems.length).toBeGreaterThan(0);
  });
});

describe("the scope table says what it means", () => {
  test("every collector is classified exactly once", () => {
    const all = [
      ...COLLECTOR_SCOPE.generic,
      ...COLLECTOR_SCOPE.universal,
      ...COLLECTOR_SCOPE.instanceBound,
    ];
    expect(all.length).toBe(new Set(all).size);
  });

  test("`tools` is instance-bound although it never mentions ROOT", () => {
    // The sharpest of the four: it is IMPORT-bound, not root-hardcoded, so
    // threading a root through it would reach nothing. Classifying it by
    // "does it mention ROOT" would have put it on the wrong side.
    expect(COLLECTOR_SCOPE.instanceBound).toContain("tools");
    expect(COLLECTOR_SCOPE.generic).not.toContain("tools");
  });
});
