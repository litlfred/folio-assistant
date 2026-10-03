/**
 * `kg-export.ts --check` / `--sidecars` — the committed QA sidecars as a
 * verify/write pair (bean `v556`).
 *
 * `kg-export` wrote two committed `qa-results/v1` sidecars and had no
 * `--check`, so no gate could see them drift. Measured on `main` `cf3e624`:
 * `kg-export.bootstrap.qa-results.json` recorded `script_hash` `47109f5daf3d`
 * against a true `e95fab417728`, and was hiding three `undeclaredSchemaModules`
 * findings, with every gate green.
 *
 * What is pinned here is the SUBJECT set, because that is the half a gate can
 * get silently wrong: a check that compares the host's sidecar and forgets the
 * foreign ones passes over exactly the file that was stale. The comparison
 * itself is `qaResultState`, tested in `qa-results.test.ts`; the end-to-end run
 * is the CI step `kg:export:check`.
 *
 * @module scripts/tests/kg-export-sidecars
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { instanceRootsIn } from "../../schemas/cat-harness.js";
import { sidecarSubjects } from "../kg-export.js";

const REPO = resolve(import.meta.dir, "../../..");

describe("kg-export sidecar subjects are DERIVED from what is committed (bean `v556`)", () => {
  test("the real tree: the host, plus every committed foreign sidecar, and no orphan", () => {
    const { subjects, orphans } = sidecarSubjects();
    expect(subjects[0]).toEqual({ stem: "kg-export" });
    // The file that was stale with every gate green must be a subject.
    const boot = subjects.find((s) => s.stem === "kg-export.bootstrap");
    expect(boot, "kg-export.bootstrap.qa-results.json is committed but not checked").toBeDefined();
    expect(boot!.instance).toBe(join(REPO, "bootstrap"));
    expect(orphans).toEqual([]);
  });

  test("a committed sidecar whose stub no instance declares is an ORPHAN, not skipped", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-export-sidecars-"));
    try {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "kg-export.qa-results.json"), "{}");
      writeFileSync(join(dir, "kg-export.bootstrap.qa-results.json"), "{}");
      writeFileSync(join(dir, "kg-export.no-such-instance.qa-results.json"), "{}");
      writeFileSync(join(dir, "something-else.qa-results.json"), "{}");
      const { subjects, orphans } = sidecarSubjects(dir, instanceRootsIn(REPO));
      expect(subjects.map((s) => s.stem)).toEqual(["kg-export", "kg-export.bootstrap"]);
      expect(orphans).toEqual(["kg-export.no-such-instance.qa-results.json"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("with no instances to match against, every foreign sidecar is an orphan — never a silent pass", () => {
    const dir = mkdtempSync(join(tmpdir(), "kg-export-sidecars-"));
    try {
      writeFileSync(join(dir, "kg-export.bootstrap.qa-results.json"), "{}");
      const { subjects, orphans } = sidecarSubjects(dir, []);
      expect(subjects).toEqual([{ stem: "kg-export" }]);
      expect(orphans).toEqual(["kg-export.bootstrap.qa-results.json"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
