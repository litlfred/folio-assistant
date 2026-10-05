/**
 * The AST sites a preview stages, under the staging cone (bean 4j86): the
 * measurements its Done-when names, on this checkout. Here rather than beside
 * the cone, because the cone lives in cat-harness and must not import upward;
 * and in smart-base rather than fhir-harness, because the instances it measures
 * (smart-trust, smart-base's chrome) are WHO's, and fhir-harness stays WHO-free
 * (`check:fhir-harness-exclusions`).
 */
import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";

import { siteFilter } from "../../../cat-harness/scripts/staging-cone.ts";
import { AST_SITE_WRITERS } from "../../../fhir-harness/scripts/stage-ast-sites.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const ast = (changed: string[]) => siteFilter(REPO, changed, AST_SITE_WRITERS)("smart-trust").carry;

describe("the AST sites, on this checkout", () => {
  it("a skill-only change stages no AST site", () => expect(ast(["cat-harness/skills/kg/kg-core/directory-conventions.md"])).toBe(false));
  it("a gen-ig-pages.ts change stages it", () => expect(ast(["fhir-harness/scripts/gen-ig-pages.ts"])).toBe(true));
  it("a chrome change stages it, through derivedFrom", () => expect(ast(["smart-base/themes/chrome.json"])).toBe(true));
  it("the build environment stages it", () => expect(ast(["cat-harness/docs/Gemfile.lock"])).toBe(true));
});
