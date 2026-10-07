/**
 * `mount-instance-docs` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/mount-instance-docs.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads smart-trust's and
 * smart-base's served directories, which only the checkout holds. Standing
 * alone, cat-harness has none of it, and `check:cat-harness-standalone`
 * collects every test in that layer. The rest of that file's tests stay there;
 * every path here is composed from ORIGIN_DIR, the directory they were written
 * in, so nothing they read changed.
 */
import { describe, expect, it } from "bun:test";

import { servedDirectories } from "../cat-harness/scripts/mount-instance-docs.js";

describe("a served directory's bytes publish at /<instance>/<path> — bean 680p", () => {

  it("the real declarations serve smart-trust's and smart-base's artefact indexes and smart-trust's OpenAPI graph, and nothing else", () => {
    const routes = servedDirectories().map((s) => s.route).sort();
    // `smart-trust/openapi` added 2026-10-03 (bean `s4ta`): the cat-openapi
    // harness's graph, whose thin pages fetch the document beside them.
    expect(routes).toEqual(["smart-base/fhir-artifact-index", "smart-trust/fhir-artifact-index", "smart-trust/openapi"]);
  });
});
