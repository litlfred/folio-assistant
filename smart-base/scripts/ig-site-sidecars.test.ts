import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DAK_API_LABEL, descriptorFor, HUB_MARKER, IG_API_DESCRIPTOR, IG_API_SITE, IG_API_WORK, igSiteSidecars } from "./ig-site-sidecars";

describe("ig-site:sidecars, smart-base's step in an IG repository's site", () => {
  test("a DAK (contentTypes.dak in its index.config.json) labels its sidecars DAK API", () => {
    const ig = mkdtempSync(join(tmpdir(), "ig-dak-"));
    writeFileSync(join(ig, "index.config.json"), JSON.stringify({ contentTypes: { dak: {} } }));
    expect(descriptorFor(ig)).toEqual({ label: DAK_API_LABEL, placeholder: HUB_MARKER });
  });

  test("a DAK not yet migrated (a legacy dak.json at the IG root) is still labelled", () => {
    const ig = mkdtempSync(join(tmpdir(), "ig-dak-"));
    writeFileSync(join(ig, "dak.json"), "{}");
    expect(descriptorFor(ig)).toEqual({ label: DAK_API_LABEL, placeholder: HUB_MARKER });
  });

  test("an IG that declares no DAK gets no label, so fhir-harness's IG API default stands", () => {
    expect(descriptorFor(mkdtempSync(join(tmpdir(), "ig-plain-")))).toEqual({ placeholder: HUB_MARKER });
  });

  test("no AST: refused, naming the step that restores it", () => {
    const ig = mkdtempSync(join(tmpdir(), "ig-noast-"));
    expect(() => igSiteSidecars({ ig, work: mkdtempSync(join(tmpdir(), "work-")), log: () => {} })).toThrow(/no AST[\s\S]*ig-site:ast/);
  });

  // fhir-harness beside this layer, as a checkout mounts them; skipped (and said) where it is not mounted.
  const fhirHarness = join(import.meta.dir, "..", "..", "fhir-harness", "scripts", "ig-repo-site.ts");
  test.skipIf(!existsSync(fhirHarness))("the handshake names are fhir-harness's (ig-repo-site.ts)", () => {
    // Read, not imported: the test pins the two copies of the handshake's names
    // together without running fhir-harness's code.
    const src = readFileSync(fhirHarness, "utf-8");
    expect(src).toContain(`IG_API_WORK = "${IG_API_WORK}"`);
    expect(src).toContain(`IG_API_DESCRIPTOR = "${IG_API_DESCRIPTOR}"`);
    expect(src).toContain(`IG_API_SITE = "${IG_API_SITE}"`);
  });

});

describe("the hub is fhir-harness's (bean h7ap)", () => {
  test("the descriptor names the hub's marker, so fhir-harness draws the hub at the IG's page holding it", () => {
    expect(descriptorFor(mkdtempSync(join(tmpdir(), "ig-")))).toEqual({ placeholder: HUB_MARKER });
  });
});
