/**
 * The DAK view pages' data (`dak-views.ts`): what the Publisher's
 * `<Name>.schema.json.html` / `.jsonld.html` show, computed for a template.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dakViewData, dakViews, displayText, fenceFor } from "../dak-views.ts";
import type { FhirArtifact } from "../../../folio-assistant-core/schemas/fhir-artifact-index.js";

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

  it("displays the file as the Publisher's page does: JavaScript's key order, two-space indent", () => {
    // Integer-like keys come first in JSON.stringify — the reason 3 of
    // smart-trust's 33 files display differently from their own bytes.
    expect(displayText('{\n    "b": 1,\n    "1": 2\n}')).toBe('{\n  "1": 2,\n  "b": 1\n}');
  });

  it("fences with more backticks than the text holds", () => {
    expect(fenceFor("{}")).toBe("```");
    expect(fenceFor('{"a":"````"}')).toBe("`````");
  });

  it("tabs: narrative, the Publisher's representations, then the DAK views with this one active", () => {
    const d = dakViewData(a, dakViews(a)[1]!, '{"@context":{}}');
    expect(d.tabs.map((t) => `${t.label}${t.active ? "*" : ""}`)).toEqual(["Narrative Content", "XML", "JSON", "JSON Schema", "JSON-LD*"]);
    expect(d.tabs[0]!.href).toBe("ValueSet-Actors.html");
    expect(d.label).toBe("JSON-LD");
    expect(d.text).toBe('{\n  "@context": {}\n}');
  });

  it("the template is a file that opens with the comment describing it, and computes nothing", () => {
    const t = readFileSync(join(import.meta.dir, "..", "templates", "dak-view.liquid"), "utf8");
    expect(t.startsWith("{%- comment -%}")).toBe(true);
    expect(t).not.toMatch(/\|\s*(plus|minus|size|replace|jsonify)\b/);
  });
});
