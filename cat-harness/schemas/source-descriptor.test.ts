/**
 * Every source descriptor in the checkout parses — bean `w5bn`.
 *
 * @module cat-harness/schemas/source-descriptor.test
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
 * The directories are found through the checkout.s DECLARATIONS, not a literal
 * path, so moving it cannot turn this into a test over nothing.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { checkoutDirectoriesForGraph } from "./harness-config.ts";
import { SOURCE_DESCRIPTOR_SCHEMA_TAG, SourceDescriptorSchema } from "./source-descriptor.ts";

const INSTANCE = join(import.meta.dir, "..");

/**
 * Every descriptor in the checkout, keyed by its path relative to the
 * checkout — found by what the FILE says it is.
 *
 * Since bean `j7ql` (2026-10-01) a descriptor lives with the instance that
 * owns its corpus (`who-iris/sources/`, `folio-assistant-sci/sources/`), and
 * the schema stays here. So the directories are read off the checkout's
 * `schemas` declarations and a file counts when its `$schema` is the
 * descriptor tag: never a list of instances, which would be an upward name.
 */
function descriptorFiles(): Map<string, string> {
  const out = new Map<string, string>();
  const repo = join(INSTANCE, "..");
  for (const d of checkoutDirectoriesForGraph("schemas", INSTANCE)) {
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).filter((x) => x.endsWith(".json")).sort()) {
      let tag: unknown;
      try {
        tag = (JSON.parse(readFileSync(join(d, f), "utf8")) as { $schema?: unknown }).$schema;
      } catch {
        continue; // not this test's file to judge
      }
      if (tag === SOURCE_DESCRIPTOR_SCHEMA_TAG) out.set(relative(repo, join(d, f)), join(d, f));
    }
  }
  return out;
}

describe("source descriptors", () => {
  const found = descriptorFiles();
  const files = [...found.keys()].sort();
  const read = (f: string): string => readFileSync(found.get(f)!, "utf8");

  test("there are descriptors to check, so the checks below are not vacuous", () => {
    // IRIS and mathlib are the two the bean requires. Fewer means one went
    // missing, and a loop over it would still pass.
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  for (const f of files) {
    test(`${f} declares itself a descriptor and parses against the schema`, () => {
      const raw = JSON.parse(read(f)) as Record<string, unknown>;
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
      const d = SourceDescriptorSchema.parse(JSON.parse(read(f)));
      if (!d.subsetIsSelfContained) expect(d.subsetBasis, `${f}: subsetIsSelfContained is false with no subsetBasis`).toBeTruthy();
    }
  });
});
