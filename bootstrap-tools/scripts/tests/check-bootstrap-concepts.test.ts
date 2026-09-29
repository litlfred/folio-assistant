/**
 * `check:bootstrap-concepts` — a bootstrap schema names no outside concept.
 *
 * Moved out of `cat-harness/scripts/tests/requirements.test.ts` with its
 * script (bean `81tw`), because the direction rule forbids a cat-harness test
 * importing from here. Issue #1164.
 *
 * @module scripts/tests/check-bootstrap-concepts.test
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { bootstrapSchemaDirs, bootstrapSchemaSources, scan } from "../check-bootstrap-concepts.ts";

const REPO = join(import.meta.dir, "..", "..", "..");

describe("check:bootstrap-concepts", () => {
  test("names outside concepts, and leaves plain English alone", () => {
    const found = scan([{ path: "x.ts", text: "who is asking\nthe WHO model\na smart-base term\nFHIR here\nsmart choice" }]);
    expect(found.map((f) => f.term)).toEqual(["WHO", "smart-base", "FHIR"]);
  });
  test("reads the declared schema directories — never an empty list", () => {
    expect(bootstrapSchemaDirs(REPO).length).toBeGreaterThan(0);
  });
  test("…and the Zod sources they are generated from, not the generator's helpers", () => {
    const names = bootstrapSchemaSources(REPO).map((p) => p.split("/").pop());
    expect(names).toContain("requirement.ts");
    // One from each instance the generator reads — this one's and cat-harness's.
    expect(names).toContain("discussion.ts");
    expect(names).not.toContain("cat-harness.ts");
  });
});
