/**
 * Every descriptor in the declared `sources/` directory parses — bean `w5bn`.
 *
 * @module large-datasets/schemas/source-descriptor.test
 * @graphNode none — a test
 *
 * ## The defect this pins
 *
 * `lean-mathlib.json`, the second worked descriptor and the one meant to show
 * the abstraction is not IRIS with an interface drawn round it, carried an
 * `_subsetIsSelfContained_note` key. `SourceDescriptorSchema` is `.strict()`,
 * so the file failed its own schema from the day it was written, and nothing
 * said so: no gate read `sources/`.
 *
 * The directory is found through the instance's DECLARATION, not a literal
 * path, so moving it cannot turn this into a test over nothing.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { SOURCE_DESCRIPTOR_SCHEMA_TAG, SourceDescriptorSchema } from "./source-descriptor.ts";

const INSTANCE = join(import.meta.dir, "..");

function sourcesDir(): string {
  const decl = JSON.parse(readFileSync(join(INSTANCE, "large-datasets.json"), "utf8")) as {
    directories?: Array<{ id: string; path: string }>;
  };
  const entry = decl.directories?.find((d) => d.id === "large-datasets-sources");
  expect(entry, "large-datasets.json no longer declares `large-datasets-sources`").toBeDefined();
  return join(INSTANCE, entry!.path);
}

describe("source descriptors", () => {
  const dir = sourcesDir();
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();

  test("there are descriptors to check, so the checks below are not vacuous", () => {
    // IRIS and mathlib are the two the bean requires. Fewer means one went
    // missing, and a loop over it would still pass.
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  for (const f of files) {
    test(`${f} declares itself a descriptor and parses against the schema`, () => {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf8")) as Record<string, unknown>;
      expect(raw.$schema).toBe(SOURCE_DESCRIPTOR_SCHEMA_TAG);
      const r = SourceDescriptorSchema.safeParse(raw);
      expect(r.success ? [] : r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)).toEqual([]);
    });
  }

  test("a source whose subset is NOT self-contained says why", () => {
    // The `false` case is the one that changes what materialize-remote must
    // do first (close over dependencies), so its reason is the one that must
    // not be lost again.
    for (const f of files) {
      const d = SourceDescriptorSchema.parse(JSON.parse(readFileSync(join(dir, f), "utf8")));
      if (!d.subsetIsSelfContained) expect(d.subsetBasis, `${f}: subsetIsSelfContained is false with no subsetBasis`).toBeTruthy();
    }
  });
});
