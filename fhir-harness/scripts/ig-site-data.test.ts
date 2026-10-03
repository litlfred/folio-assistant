/**
 * fhir-harness populates `site.data.fhir` for a just-the-docs render of one
 * IG (bean `bamf`). It writes only what it can source and says what it could
 * not, and it refuses a source that describes a different IG.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { igSiteData } from "./ig-site-data";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

describe("from sushi-config.yaml (what the IG Publisher reads)", () => {
  test("the ImplementationGuide fields and the package identity", () => {
    const dir = mkdtempSync(join(tmpdir(), "ig-sushi-"));
    made.push(dir);
    writeFileSync(
      join(dir, "sushi-config.yaml"),
      [
        "id: example.fhir.demo",
        "canonical: http://example.org/fhir/demo",
        "name: DemoIG",
        "title: Demo Implementation Guide",
        "status: draft",
        "version: 0.1.0",
        "fhirVersion: 4.0.1",
        "publisher:",
        "  name: Example Org",
      ].join("\n"),
    );
    const r = igSiteData(dir);
    expect(r.data).toEqual({
      packageId: "example.fhir.demo", // SUSHI: packageId defaults to id
      canonical: "http://example.org/fhir/demo",
      ig: {
        id: "example.fhir.demo",
        url: "http://example.org/fhir/demo/ImplementationGuide/example.fhir.demo",
        name: "DemoIG",
        title: "Demo Implementation Guide",
        version: "0.1.0",
        status: "draft",
        publisher: "Example Org",
        fhirVersion: ["4.0.1"],
      },
    });
    expect(r.undetermined).toEqual([]);
  });
});

describe("from a published IG's artifact index (the real smart-base one)", () => {
  const r = igSiteData(join(import.meta.dir, "..", "..", "smart-base"));

  test("writes what the index carries, from the index", () => {
    expect(r.data.packageId).toBe("smart.who.int.base");
    expect(r.data.canonical).toBe("http://smart.who.int/base");
    expect(r.data.ig.version).toBe("0.3.0");
    expect(r.data.ig.fhirVersion).toEqual(["4.0.1"]);
    expect(r.provenance["ig.version"]).toBe("fhir-artifact-index/index.json");
  });

  test("lists what it could not source instead of writing empty strings", () => {
    expect(r.undetermined).toEqual(expect.arrayContaining(["ig.id", "ig.name", "ig.publisher"]));
    expect(JSON.stringify(r.data)).not.toContain('""');
  });

  test("states no status: smart-base has no ig-identity.json, and the template's chrome states none", () => {
    expect(r.data.ig.status).toBeUndefined();
    expect(r.refused).toEqual([]);
  });
});

describe("from smart-trust's index, which carries its own ig-identity.json", () => {
  const r = igSiteData(join(import.meta.dir, "..", "..", "smart-trust"));

  test("status comes from the IG's own identity file", () => {
    expect(r.data.ig.status).toBe("draft");
    expect(r.provenance["ig.status"]).toBe("fhir-artifact-index/ig-identity.json");
  });
});

test("no source at all is an error, not an empty site.data.fhir", () => {
  const dir = mkdtempSync(join(tmpdir(), "ig-none-"));
  made.push(dir);
  expect(() => igSiteData(dir)).toThrow(/nothing to populate/);
});
