/**
 * `tools-discover` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/tools-discover.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each discovers the Tools every
 * instance in the checkout declares, smart-base's among them, which only the
 * checkout holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";

import { discoverTools, tools, toolsOf } from "../cat-harness/tools/discover.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});

describe("tools() over this checkout", () => {
  test("includes every instance that declares a tools graph — smart-base's no longer invisible", () => {
    const ids = new Set(tools().map((t) => t.id));
    // One Tool from each declaring instance: cat-harness, fhir-harness, smart-base.
    expect(ids.has("discuss")).toBe(true);
    expect(ids.has("dmn-to-questionnaire")).toBe(true);
    const d = discoverTools();
    expect(d.failures).toEqual([]);
    expect(d.sources.map((s) => s.instance)).toEqual(expect.arrayContaining(["cat-harness", "fhir-harness", "smart-base"]));
  });

  test("toolsOf(cat-harness) is the harness's own graph only — what its document publishes", () => {
    const own = toolsOf(resolve(ORIGIN_DIR, "../.."));
    expect(own.some((t) => t.id === "discuss")).toBe(true);
    expect(own.some((t) => t.id === "dmn-to-questionnaire")).toBe(false);
    expect(own.length).toBeLessThan(tools().length);
  });

  test("every discovered Tool's io types point into the harness's published types document", () => {
    // smart-base's nine used to mint against its FHIR canonical, a document
    // nobody publishes. Discovery mints every instance against the harness.
    const bases = new Set(tools().flatMap((t) => [...t.io.inputs, ...t.io.outputs].map((p) => p.schema.split("#")[0])));
    expect(bases.size).toBe(1);
  });
});
