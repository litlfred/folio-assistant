/**
 * A checker module that will not load is reported once per criterion that
 * names it — and is never imported a second time.
 *
 * This is not a style preference. On Bun 1.3.11 a second dynamic import of a
 * module whose evaluation threw **does not throw again**: it resolves with the
 * namespace of a module whose body aborted partway, and `Object.keys` over
 * that namespace throws `Cannot access X before initialization` for every
 * binding below the throw. Several criteria share one checker file, so
 * discovery imported the same path once per criterion and hit exactly that —
 * the first criterion got an honest "module did not load" and the second took
 * down the whole sweep.
 *
 * The corpus is green, so it cannot pin this. The fixture can.
 *
 * @module scripts/tests/checker-module-load-failure.test
 */
import { describe, test, expect } from "bun:test";
import { join } from "path";

import {
  findChecker,
  loadCheckerModule,
  type LoadedModule,
} from "../../content/pipeline/qa-checker-discovery.ts";

/** Poisoned by the first describe below; never reaches `loadCheckerModule` first. */
const FIXTURE = join(import.meta.dir, "fixtures/throws-at-top-level.ts");
/** Untouched until the cache test imports it — see that fixture's own note. */
const UNCACHED = join(import.meta.dir, "fixtures/throws-at-top-level-uncached.ts");
const evaluations = (): number =>
  (globalThis as { __throwsAtTopLevelEvaluations?: number }).__throwsAtTopLevelEvaluations ?? 0;
const evaluations2 = (): number =>
  (globalThis as { __throwsAtTopLevelEvaluations2?: number }).__throwsAtTopLevelEvaluations2 ?? 0;

describe("the platform behaviour this exists for", () => {
  test("the second import RESOLVES, with a half-initialised namespace", async () => {
    const before = evaluations();
    await expect(import(FIXTURE)).rejects.toThrow("this checker module cannot load");
    expect(evaluations()).toBe(before + 1);

    // The claim under test. If this ever starts rejecting, the caching below
    // becomes belt-and-braces rather than load-bearing — which is worth
    // knowing, so the test says so rather than tolerating either answer.
    const stale = (await import(FIXTURE)) as Record<string, unknown>;
    expect(evaluations()).toBe(before + 1); // not re-evaluated
    expect(() => Object.keys(stale)).toThrow(/before initialization/);
  });
});

describe("loadCheckerModule", () => {
  test("a failure is remembered as a failure, not retried", async () => {
    const cache = new Map<string, LoadedModule>();
    const before = evaluations2();

    const first = await loadCheckerModule(UNCACHED, cache);
    const second = await loadCheckerModule(UNCACHED, cache);

    for (const got of [first, second]) {
      expect("loadError" in got).toBe(true);
      expect((got as { loadError: string }).loadError).toContain("this checker module cannot load");
    }
    // Same object: served from the cache, not imported again.
    expect(second).toBe(first);
    expect(evaluations2()).toBe(before + 1);
  });

  test("a module that loads is cached as its namespace", async () => {
    const cache = new Map<string, LoadedModule>();
    const self = join(import.meta.dir, "../../content/pipeline/qa-checker-discovery.ts");
    const mod = await loadCheckerModule(self, cache);
    expect("loadError" in mod).toBe(false);
    expect(await loadCheckerModule(self, cache)).toBe(mod);
  });
});

describe("findChecker over a poisoned namespace", () => {
  test("it reports no checker instead of crashing the sweep", async () => {
    // Reachable exactly as the sweep reaches it: some earlier caller in this
    // process has already imported the broken module twice, so `import()`
    // resolves and the namespace cannot be enumerated.
    const stale = (await import(FIXTURE)) as Record<string, unknown>;
    expect(() => Object.keys(stale)).toThrow(/before initialization/);

    expect(findChecker(stale, "proof-no-bare-sorries")).toBeUndefined();
  });
});
