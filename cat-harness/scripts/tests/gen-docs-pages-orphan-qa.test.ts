/**
 * Tests for bean folio-assistant-0kbt:
 * gen-docs-pages publishes a QA count that includes the witness files it deletes in the same run.
 *
 * Done when:
 * - the orphan sweep runs BEFORE the qa projection, or the projection excludes paths the sweep has queued
 * - a test writes an orphan witness, runs the generator once, and asserts the published count matches
 *   the tree the run leaves behind - not the tree it started from
 * - idempotence is pinned: two consecutive runs on an unchanged tree publish identical counts
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { readQaGraph } from "../../content/pipeline/qa-graph-index.ts";
import { directoryForGraph, siteDirFor } from "../../schemas/cat-harness.ts";

const INSTANCE_ROOT = join(import.meta.dir, "..", "..");
const REPO_ROOT = join(INSTANCE_ROOT, "..");
const QA_ASSET_DIR = join(INSTANCE_ROOT, "test", "results", "witnesses");
const QA_INDEX_PATH = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "assets", "qa", "index.json");

describe("gen-docs-pages orphan sweep and QA projection order (bean 0kbt)", () => {
  test("published QA count matches the post-sweep tree, not the tree it started from, and consecutive runs are idempotent", () => {
    const orphanDir = join(QA_ASSET_DIR, "test-orphan-0kbt");
    const orphanPath = join(orphanDir, "orphan.kg.json");

    try {
      // Step 1: Write an orphan witness into the witness directory
      mkdirSync(orphanDir, { recursive: true });
      writeFileSync(
        orphanPath,
        JSON.stringify({
          $schema: "qa-witness/v1",
          counts: { fail: 999 },
        }) + "\n",
      );
      expect(existsSync(orphanPath)).toBe(true);

      // Step 2: Run the generator once
      const r1 = spawnSync("bun", ["cat-harness/scripts/gen-docs-pages.ts"], {
        cwd: REPO_ROOT,
        encoding: "utf-8",
      });
      if (r1.status !== 0) {
        console.error("r1 stdout:", r1.stdout);
        console.error("r1 stderr:", r1.stderr);
      }
      expect(r1.status).toBe(0);

      // Step 3: Assert the orphan was deleted by the sweep
      expect(existsSync(orphanPath)).toBe(false);

      // Step 4: Assert published count matches the tree the run leaves behind, not what it started from
      const qaDir = directoryForGraph(INSTANCE_ROOT, "qa");
      expect(qaDir).toBeDefined();
      const treeCount = readQaGraph(qaDir!).files;

      expect(existsSync(QA_INDEX_PATH)).toBe(true);
      const published1 = JSON.parse(readFileSync(QA_INDEX_PATH, "utf-8")) as {
        files: number;
        families: Array<{ schema: string; files: number; buckets?: Record<string, number> }>;
      };

      // The published count must match the post-sweep tree, NOT include the deleted orphan
      expect(published1.files).toBe(treeCount);

      // The fail: 999 bucket from the deleted orphan must NOT be in qa-witness/v1
      const witnessFamily1 = published1.families.find((f) => f.schema === "qa-witness/v1");
      expect(witnessFamily1?.buckets?.["fail"]).not.toBe(999);

      // Step 5: Pin idempotence — a second run on the unchanged tree publishes identical counts
      const r2 = spawnSync("bun", ["cat-harness/scripts/gen-docs-pages.ts"], {
        cwd: REPO_ROOT,
        encoding: "utf-8",
      });
      expect(r2.status).toBe(0);

      const published2 = JSON.parse(readFileSync(QA_INDEX_PATH, "utf-8")) as typeof published1;
      expect(published2.files).toBe(published1.files);
      expect(published2).toEqual(published1);
    } finally {
      rmSync(orphanDir, { recursive: true, force: true });
    }
  }, 30000);
});
