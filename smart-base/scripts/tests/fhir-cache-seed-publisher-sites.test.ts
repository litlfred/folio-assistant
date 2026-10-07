/**
 * smart-base supplies the `smart.who.int.` publisher-site rule to fhir-harness's
 * `fhir-cache-seed-npm`, whose own default is empty (owner ruling 2026-10-07).
 *
 * The seeder itself is not imported: a staged instance reaches the platform
 * only through `platform.ts`. How `--site-repo PREFIX=OWNER/REPO[@BRANCH]`
 * parses is fhir-harness's own test; this one checks what smart-base passes.
 */
import { describe, expect, test } from "bun:test";

import { SMART_PUBLISHER_SITE_REPOS, smartSiteRepoArgs, tools } from "../../tools/index.ts";

describe("smart-base publisher-site rules for fhir-cache-seed-npm", () => {
  test("the WHO rule is supplied, naming the repository the seeder used before #2436", () => {
    expect(SMART_PUBLISHER_SITE_REPOS["smart.who.int."]).toBe("WorldHealthOrganization/smart-html@main");
  });

  test("the rule is passed as the seeder's --site-repo PREFIX=OWNER/REPO[@BRANCH] arguments", () => {
    expect(smartSiteRepoArgs()).toEqual(["--site-repo", "smart.who.int.=WorldHealthOrganization/smart-html@main"]);
  });

  test("the smart-base Tool invokes the seeder with the rule", () => {
    const tool = tools("https://example.org").find((x) => x.id === "smart-fhir-cache-seed");
    const shell = (tool?.invoke as { shell?: string } | undefined)?.shell ?? "";
    expect(shell).toContain("fhir-harness/scripts/fhir-cache-seed-npm.ts");
    expect(shell).toContain("--site-repo smart.who.int.=WorldHealthOrganization/smart-html@main");
  });
});
