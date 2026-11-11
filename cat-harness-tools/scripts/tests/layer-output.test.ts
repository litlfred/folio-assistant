/**
 * The layer output resolver (bean `cat-tools-sm8r`, item 4, plan step 1):
 * a mounted layer's computed files go to `build/layers/<instance>/`, a local
 * layer's stay inside it, and a reader sees the computed file over the
 * pinned bytes.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LAYER_OUTPUT_ROOT, mountedInstances, outputPathFor, readPathFor } from "../lib/layer-output.js";

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

function checkout(lock?: unknown): string {
  const root = mkdtempSync(join(tmpdir(), "layer-output-"));
  dirs.push(root);
  if (lock !== undefined) writeFileSync(join(root, "index.lock.json"), typeof lock === "string" ? lock : JSON.stringify(lock));
  return root;
}

const LOCK = {
  instances: [
    { instance: "upper-ig", path: "upper-ig", sha: "a".repeat(40) },
    { instance: "lower", path: "lower", sha: "b".repeat(40) },
  ],
};

describe("mountedInstances", () => {
  test("reads the lock's instances and their mount paths", () => {
    expect([...mountedInstances(checkout(LOCK))]).toEqual([
      ["upper-ig", "upper-ig"],
      ["lower", "lower"],
    ]);
  });

  test("no lock: nothing is mounted", () => {
    expect(mountedInstances(checkout()).size).toBe(0);
  });

  test("a lock that does not parse throws rather than reading as 'nothing mounted'", () => {
    expect(() => mountedInstances(checkout("{ not json"))).toThrow(/cannot be determined/);
  });
});

describe("outputPathFor", () => {
  test("a mounted instance writes under build/layers/<instance>/", () => {
    const root = checkout(LOCK);
    expect(outputPathFor(root, { instance: "upper-ig", path: "upper-ig" }, "fhir-artifact-index/index.json")).toBe(
      join(root, LAYER_OUTPUT_ROOT, "upper-ig", "fhir-artifact-index/index.json"),
    );
  });

  test("a local instance writes inside itself, as before", () => {
    const root = checkout(LOCK);
    expect(outputPathFor(root, { instance: "own", path: "own" }, "glossary/generated/x.json")).toBe(join(root, "own", "glossary/generated/x.json"));
    expect(outputPathFor(root, { instance: "root-instance", path: "" }, "test/results/a.json")).toBe(join(root, "test/results/a.json"));
  });
});

describe("readPathFor", () => {
  test("the computed file wins over the pinned bytes", () => {
    const root = checkout(LOCK);
    mkdirSync(join(root, "upper-ig/fhir-artifact-index"), { recursive: true });
    writeFileSync(join(root, "upper-ig/fhir-artifact-index/index.json"), "pinned");
    const out = join(root, LAYER_OUTPUT_ROOT, "upper-ig/fhir-artifact-index");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "index.json"), "computed");
    expect(readPathFor(root, { instance: "upper-ig", path: "upper-ig" }, "fhir-artifact-index/index.json")).toBe(join(out, "index.json"));
  });

  test("with nothing computed, the reader falls back to the mount", () => {
    const root = checkout(LOCK);
    expect(readPathFor(root, { instance: "lower", path: "lower" }, "a.json")).toBe(join(root, "lower", "a.json"));
  });
});
