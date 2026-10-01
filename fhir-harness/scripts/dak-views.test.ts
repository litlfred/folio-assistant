/**
 * The DAK view pages' data (`dak-views.ts`): what the Publisher's
 * `<Name>.schema.json.html` / `.jsonld.html` show, computed for a template.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DAK_VIEW_SCRIPT, dakViewData, dakViews } from "./dak-views.ts";
import type { FhirArtifact } from "../../folio-assistant-core/schemas/fhir-artifact-index.js";

const a = {
  key: "ValueSet/Actors",
  resourceType: "ValueSet",
  id: "Actors",
  title: "Actors",
  published: { xml: { url: "https://p/ValueSet-Actors.xml" }, json: { url: "https://p/ValueSet-Actors.json" } },
  dak: {
    schema: { url: "https://p/schemas/ValueSet-Actors.schema.json", localPath: "fhir-artifact-index/dak/ValueSet-Actors.schema.json" },
    jsonld: { url: "https://p/ValueSet-Actors.jsonld", localPath: "fhir-artifact-index/dak/ValueSet-Actors.jsonld" },
    displays: { url: "https://p/schemas/ValueSet-Actors.displays.json", localPath: "fhir-artifact-index/dak/ValueSet-Actors.displays.json" },
  },
} as unknown as FhirArtifact;

describe("dak views", () => {
  it("has a page for each HELD schema and JSON-LD sidecar, in the Publisher's tab order, and none for displays", () => {
    expect(dakViews(a).map((v) => v.file)).toEqual(["ValueSet-Actors.schema.json", "ValueSet-Actors.jsonld"]);
    const byRef = { ...a, dak: { schema: { url: "https://p/x.schema.json" } } } as unknown as FhirArtifact;
    expect(dakViews(byRef)).toEqual([]);
  });

  it("tabs: narrative, the Publisher's representations, then the DAK views with this one active", () => {
    const d = dakViewData(a, dakViews(a)[1]!);
    expect(d.tabs.map((t) => `${t.label}${t.active ? "*" : ""}`)).toEqual(["Narrative Content", "XML", "JSON", "JSON Schema", "JSON-LD*"]);
    expect(d.tabs[0]!.href).toBe("ValueSet-Actors.html");
    expect(d.label).toBe("JSON-LD");
    expect(d.script).toBe(`../${DAK_VIEW_SCRIPT}`);
    // The page carries no file text: the loader fetches it (bean `680p`).
    expect(JSON.stringify(d)).not.toContain("@context");
  });

  it("the loader shows the file as the Publisher does: JSON.stringify(parsed, null, 2)", () => {
    const js = readFileSync(join(import.meta.dir, "templates", "ig-pages", "dak-view.js"), "utf8");
    expect(js).toContain("JSON.stringify(d, null, 2)");
  });

  it("the template is a file that opens with the comment describing it, and computes nothing", () => {
    const t = readFileSync(join(import.meta.dir, "templates", "ig-pages", "dak-view.liquid"), "utf8");
    expect(t.startsWith("{%- comment -%}")).toBe(true);
    expect(t).not.toMatch(/\|\s*(plus|minus|size|replace|jsonify)\b/);
  });
});
