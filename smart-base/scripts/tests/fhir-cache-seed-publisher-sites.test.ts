/**
 * smart-base supplies the `smart.who.int.` publisher-site rule to fhir-harness's
 * `fhir-cache-seed-npm`, whose own default is empty (owner ruling 2026-10-07).
 */
import { describe, expect, test } from "bun:test";

import { parseCliArgs } from "../../../fhir-harness/scripts/fhir-cache-seed-npm.ts";
import { SMART_PUBLISHER_SITE_REPOS, smartSiteRepoArgs, tools } from "../../tools/index.ts";

describe("smart-base publisher-site rules for fhir-cache-seed-npm", () => {
  test("the WHO rule is supplied, naming the repository the seeder used before #2436", () => {
    expect(SMART_PUBLISHER_SITE_REPOS["smart.who.int."]).toBe("WorldHealthOrganization/smart-html@main");
  });

  test("the seeder parses smart-base's arguments into that rule", () => {
    expect(parseCliArgs(smartSiteRepoArgs()).siteRepos).toEqual({ ...SMART_PUBLISHER_SITE_REPOS });
  });

  test("fhir-harness's own default has no publisher site", () => {
    expect(parseCliArgs([]).siteRepos).toEqual({});
  });

  test("the smart-base Tool invokes the seeder with the rule", () => {
    const tool = tools("https://example.org").find((x) => x.id === "smart-fhir-cache-seed");
    const shell = (tool?.invoke as { shell?: string } | undefined)?.shell ?? "";
    expect(shell).toContain("fhir-harness/scripts/fhir-cache-seed-npm.ts");
    expect(shell).toContain("--site-repo smart.who.int.=WorldHealthOrganization/smart-html@main");
  });
});
