/**
 * `detangler-archimedean-wall` is registered only when the folio opts in.
 *
 * The criterion is a `detangler`-domain criterion by mechanism and ONE
 * FOLIO's mathematics by content: its wall, its classifier and its six
 * chapter directory names are qou's. `profiles: ["paper"]` does not fence
 * that, because every paper folio has a `.lean` to read — so it was being
 * run against chapters no other folio has.
 *
 * **Why a subprocess.** `folioOptionalAxes()` reads `harness.config.json`
 * ONCE at module load, resolved from `process.cwd()`. An in-process test
 * cannot flip it: the registry is already built by the time the test body
 * runs, and memoisation makes a second read a no-op. Spawning is not
 * ceremony here — it is the only way the OFF and ON states are both
 * observable, and both have to be, because a fence that cannot be opened
 * is indistinguishable from a criterion that was deleted (bean `xom7`).
 *
 * @module scripts/tests/folio-optional-axes
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import "../../schemas/folio-graph-kind.js";
import { folioDir } from "../../schemas/cat-harness.js";
import { FIXTURE_CONFIG, declareInstance, instanceConfigPathIn, writeInstanceConfig } from "../../test/support/instance-fixture.js";

const REGISTRY = resolve(import.meta.dir, "../../content/pipeline/qa-criteria-registry.ts");

const PROBE = `
import { QA_CRITERIA_REGISTRY, DETANGLER_WATCHER_CRITERIA, folioOptionalAxes }
  from ${JSON.stringify(REGISTRY)};
console.log(JSON.stringify({
  axes: folioOptionalAxes(),
  inRegistry: QA_CRITERIA_REGISTRY.some((c) => c.id === "detangler-archimedean-wall"),
  inBucket: DETANGLER_WATCHER_CRITERIA.includes("detangler-archimedean-wall"),
  detanglerCount: QA_CRITERIA_REGISTRY.filter((c) => c.domain === "detangler").length,
}));
`;

/**
 * A minimal folio root: the declared folio directory (so
 * `findContentRepoRoot()` stops here rather than walking past it) and a
 * config carrying `qaAxes`.
 */
function folioRoot(qaAxes: string[] | undefined): string {
  const dir = mkdtempSync(join(tmpdir(), "optional-axes-"));
  // `folioDir` of an undeclared root IS the convention, so the temp folio
  // gets whatever directory the resolver will look for — no literal here.
  mkdirSync(folioDir(dir), { recursive: true });
  writeInstanceConfig(dir, JSON.stringify({ contentType: "paper", ...(qaAxes ? { qaAxes } : {}) }, null, 2),
  );
  return dir;
}

function probe(qaAxes: string[] | undefined): {
  axes: string[];
  inRegistry: boolean;
  inBucket: boolean;
  detanglerCount: number;
} {
  const cwd = folioRoot(qaAxes);
  const r = spawnSync("bun", ["-e", PROBE], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`probe exited ${r.status}\n${r.stderr}`);
  return JSON.parse(r.stdout.trim().split("\n").at(-1)!);
}

describe("detangler-archimedean-wall is folio-optional", () => {
  test("absent config key ⇒ not registered, and not in the watcher bucket", () => {
    const out = probe(undefined);
    expect(out.axes).toEqual([]);
    expect(out.inRegistry).toBe(false);
    expect(out.inBucket).toBe(false);
  });

  test("another folio's axis does not open this one", () => {
    const out = probe(["q-usage"]);
    expect(out.inRegistry).toBe(false);
    expect(out.inBucket).toBe(false);
  });

  test("opting in registers it, and the watcher bucket agrees", () => {
    const off = probe(undefined);
    const on = probe(["archimedean-wall"]);
    expect(on.axes).toEqual(["archimedean-wall"]);
    expect(on.inRegistry).toBe(true);
    expect(on.inBucket).toBe(true);
    // The registry and the bucket must move TOGETHER. A bucket naming a
    // criterion the registry never registered is a watcher axis that
    // reports on nothing and looks clean doing it (bean `dh4f`).
    expect(on.detanglerCount).toBe(off.detanglerCount + 1);
  });
});
