/**
 * The JSON view pages' data (`resource-views.ts`): what the Publisher's
 * `<Name>.json.html` shows, computed for a template.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSON_VIEW_SCRIPT, hasJsonView, jsonViewData } from "./resource-views.ts";
import type { FhirArtifact } from "../schemas/fhir-artifact-index.js";

const vs = {
  key: "ValueSet/Actors",
  resourceType: "ValueSet",
  id: "Actors",
  title: "Actors",
  published: { xml: { url: "https://p/ValueSet-Actors.xml" }, json: { url: "https://p/ValueSet-Actors.json" }, ttl: { url: "https://p/ValueSet-Actors.ttl" } },
} as unknown as FhirArtifact;

describe("JSON views", () => {
  it("exist for what the Publisher writes one for: not the IG, not StructureDefinitions (their view is .profile.json)", () => {
    expect(hasJsonView(vs)).toBe(true);
    expect(hasJsonView({ ...vs, resourceType: "ImplementationGuide" } as FhirArtifact)).toBe(false);
    expect(hasJsonView({ ...vs, resourceType: "StructureDefinition" } as FhirArtifact)).toBe(false);
    expect(hasJsonView({ ...vs, published: {} } as unknown as FhirArtifact)).toBe(false);
  });

  it("reads the resource out of the held package, never a copy", () => {
    const d = jsonViewData(vs, "fhir-artifact-index/package.tgz");
    expect(d.package).toBe("../fhir-artifact-index/package.tgz");
    expect(d.entry).toBe("package/ValueSet-Actors.json");
    expect(d.raw).toBe("https://p/ValueSet-Actors.json");
    expect(d.script).toBe(`../${JSON_VIEW_SCRIPT}`);
  });

  it("tabs in the Publisher's order, JSON active, extra tabs after TTL", () => {
    const d = jsonViewData(vs, "p.tgz", [{ label: "JSON Schema", href: "x.html", active: false }]);
    expect(d.tabs.map((t) => `${t.label}${t.active ? "*" : ""}`)).toEqual(["Narrative Content", "XML", "JSON*", "TTL", "JSON Schema"]);
    // The heading drops the Publisher's leading ": " (an empty type label in its template).
    expect(d.heading).toBe("Actors - JSON Representation");
  });

  it("the loader shows the resource as the Publisher's page does", () => {
    const js = readFileSync(join(import.meta.dir, "templates", "ig-pages", "resource-json.js"), "utf8");
    expect(js).toContain("JSON.stringify(d, null, 2)");
    expect(js).toContain('DecompressionStream("gzip")');
  });
});
