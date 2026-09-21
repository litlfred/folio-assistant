/**
 * The generic half of the exporter serves an instance that is NOT this one.
 *
 * @module scripts/tests/kg-export-instance.test
 *
 * Bean `gn4l`. These assertions run against **bootstrap**, a real instance in
 * this repository that has a declaration, two skills, no `tools/`, no
 * `package.json` and no `.claude/` — which is exactly the shape the exporter
 * was never written for.
 *
 * It had no BPMN too, until this branch gave it `workflows/bootstrap.bpmn`.
 * Anything asserting on an absence here is asserting on a property of a
 * REAL instance that is still being built, so it belongs in a fixture — see
 * the workflow-directory test below, which was written against bootstrap and
 * broke the day bootstrap grew the feature.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { COLLECTOR_SCOPE, collectInstanceNodes } from "../kg-export.js";
import { repoRootFor } from "../../schemas/cat-harness.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

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
    const { nodes } = await collectInstanceNodes(join(repoRootFor(ROOT), "bootstrap"), DOC, BASE, problems);
    expect(typesOf(nodes).get("Skill")).toBeGreaterThan(0);
  });

  test("and its declaration, without borrowing this repository's", async () => {
    const problems: string[] = [];
    const { nodes } = await collectInstanceNodes(join(repoRootFor(ROOT), "bootstrap"), DOC, BASE, problems);
    const dirs = typesOf(nodes).get("Directory") ?? 0;
    const rootDirs = typesOf(
      (await collectInstanceNodes(ROOT, DOC, BASE, [])).nodes,
    ).get("Directory")!;
    // Strictly fewer than the root's, and NOT a pinned number.
    //
    // This asserted `toBe(1)` until 2026-09-19 and broke the moment bootstrap
    // declared a second directory for its `workflows/`. One was an incidental
    // fact about bootstrap that day; the PROPERTY is that bootstrap's
    // declaration is its own and smaller. A pinned count makes "the isolation
    // holds" and "somebody changed a declaration" indistinguishable — the
    // mistake this repository has paid for with coverage counts more than once.
    expect(dirs).toBeGreaterThan(0);
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
    const { omitted } = await collectInstanceNodes(join(repoRootFor(ROOT), "bootstrap"), DOC, BASE, []);
    expect([...omitted].sort()).toEqual(["packages", "registry", "schemas", "tools"]);
  });

  test("a declared directory holding no diagrams is a NOTE, not a crash and not a problem", async () => {
    // It threw ENOENT while this was being written: a directory found under
    // one root and joined against another.
    //
    // Built as a FIXTURE rather than asserted against `bootstrap/`, which is
    // what it named until 2026-09-19. CatBootstrap had no `workflows/` then, so
    // the test passed on a property nobody had chosen — and the moment this
    // branch gave bootstrap its process diagram, a test about ENOENT handling
    // started failing because its SUBJECT had grown a feature. The behaviour
    // under test never changed.
    //
    // That is the same defect the two neighbours above are written against,
    // arriving in the test rather than in the code: a scan that finds nothing
    // and a scan that was never run look identical from the outside, so an
    // assertion resting on an incidental absence cannot say which it caught.
    // A fixture declares the absence, which is the whole point.
    const root = mkdtempSync(join(tmpdir(), "kgx-noflows-"));
    mkdirSync(join(root, "skills"), { recursive: true });
    writeFileSync(join(root, "skills", "a-skill.md"), "# A skill\n\nBody.\n");
    writeDeclaration(root, JSON.stringify({
        name: "noflows",
        directories: [{ id: "cat-harness", path: "skills/", dependents: "reproduce", graphKinds: ["cat-harness"] }],
      }));
    const problems: string[] = [];
    const { notes } = await collectInstanceNodes(root, DOC, BASE, problems);
    rmSync(root, { recursive: true, force: true });
    // Matched on the WHOLE message, not on the substring "bpmn". Probed
    // 2026-09-19: a `.includes("bpmn")` passes for an absent directory, for an
    // empty one AND for a present one holding a file that fails to parse —
    // three different outcomes, one of them not a problem this test is about.
    // The loose form was green against all three, so it asserted only that
    // SOMETHING mentioned bpmn.
    //
    // It is a NOTE since 2026-09-20. The fixture here is a declared `skills/`
    // that EXISTS and holds a skill and no diagram, which is a determined
    // empty: looked, found none. The ENOENT-safety this test was written for
    // (a directory found under one root and joined against another) is still
    // what it guards — nothing throws — and the finding is still emitted; it
    // simply no longer fails the instance.
    expect(notes.filter((n) => /no directory containing \.bpmn files was found/.test(n)))
      .toHaveLength(1);
    expect(problems).toEqual([]);
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
    //
    // THE FIXTURE DID NOT MATCH THE NAME, and that is why this is rewritten
    // rather than adjusted. It called `mkdirSync(join(root, "skills"))` — so
    // the declared directory was THERE, empty — and then asserted a problem.
    // It passed because the old condition emitted one message for two
    // different states: declared-and-absent, and declared-and-diagramless.
    // The test named the first and exercised the second, and the first was
    // never covered at all.
    //
    // So: NO `mkdirSync`. The declaration names `skills/` and the tree does
    // not carry it, which is the `dh4f` defect this test claims to be about.
    const root = mkdtempSync(join(tmpdir(), "kgx-absent-"));
    writeDeclaration(root, JSON.stringify({
        name: "absent",
        directories: [{ id: "cat-harness", path: "skills/", dependents: "reproduce", graphKinds: ["cat-harness"] }],
      }));
    const problems: string[] = [];
    await collectInstanceNodes(root, DOC, BASE, problems);
    rmSync(root, { recursive: true, force: true });
    // On the WHOLE message: "absent" and "holds no diagrams" are now two
    // findings in two channels, and a substring match would not tell them
    // apart — which is exactly how this test came to assert the wrong one.
    expect(problems.filter((p) => /declared knowledge-graph directory is absent/.test(p)))
      .toHaveLength(1);
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
