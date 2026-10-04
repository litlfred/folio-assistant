/**
 * The DAK view pages' data (`ig-api-views.ts`): what the Publisher's
 * `<Name>.schema.json.html` / `.jsonld.html` show, computed for a template.
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IG_API_VIEW_SCRIPT, igApiHubLinks, igApiServed, igApiViewData, igApiViews } from "./ig-api-views.ts";
import type { FhirArtifact } from "../schemas/fhir-artifact-index.js";

const a = {
  key: "ValueSet/Actors",
  resourceType: "ValueSet",
  id: "Actors",
  title: "Actors",
  published: { xml: { url: "https://p/ValueSet-Actors.xml" }, json: { url: "https://p/ValueSet-Actors.json" } },
  sidecars: {
    schema: { url: "https://p/schemas/ValueSet-Actors.schema.json", localPath: "fhir-artifact-index/dak/ValueSet-Actors.schema.json" },
    jsonld: { url: "https://p/ValueSet-Actors.jsonld", localPath: "fhir-artifact-index/dak/ValueSet-Actors.jsonld" },
    displays: { url: "https://p/schemas/ValueSet-Actors.displays.json", localPath: "fhir-artifact-index/dak/ValueSet-Actors.displays.json" },
  },
} as unknown as FhirArtifact;

describe("dak views", () => {
  it("has a page for each HELD schema and JSON-LD sidecar, in the Publisher's tab order, and none for displays", () => {
    expect(igApiViews(a).map((v) => v.file)).toEqual(["ValueSet-Actors.schema.json", "ValueSet-Actors.jsonld"]);
    const byRef = { ...a, sidecars: { schema: { url: "https://p/x.schema.json" } } } as unknown as FhirArtifact;
    expect(igApiViews(byRef)).toEqual([]);
  });

  it("tabs: narrative, the Publisher's representations, then the IG API views with this one active", () => {
    const d = igApiViewData(a, igApiViews(a)[1]!);
    expect(d.tabs.map((t) => `${t.label}${t.active ? "*" : ""}`)).toEqual(["Narrative Content", "XML", "JSON", "JSON Schema", "JSON-LD*"]);
    expect(d.tabs[0]!.href).toBe("ValueSet-Actors.html");
    expect(d.label).toBe("JSON-LD");
    expect(d.script).toBe(`../${IG_API_VIEW_SCRIPT}`);
    // Fetched from the SERVED graph, not from a copy beside the page.
    expect(d.src).toBe("../fhir-artifact-index/dak/ValueSet-Actors.jsonld");
    // The page carries no file text: the loader fetches it (bean `680p`).
    expect(JSON.stringify(d)).not.toContain("@context");
  });

  it("the loader shows the file as the Publisher does: JSON.stringify(parsed, null, 2)", () => {
    const js = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ig-api-view.js"), "utf8");
    expect(js).toContain("JSON.stringify(d, null, 2)");
  });

  it("the template is a file that opens with the comment describing it, and computes nothing", () => {
    const t = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ig-api-view.liquid"), "utf8");
    expect(t.startsWith("{%- comment -%}")).toBe(true);
    expect(t).not.toMatch(/\|\s*(plus|minus|size|replace|jsonify)\b/);
  });

  it("hub links: artefact pages go under artifact/, held files to the served graph, the rest to the Publisher", () => {
    const frag = '<a href="ValueSet-Actors.html">x</a><a href="ValueSet-Actors.schema.json">s</a>' +
      '<a href="openapi/index.html">o</a><a href="https://x/y">abs</a><a href="#top">t</a><a href="ValueSet-Actors.html">again</a>';
    expect(igApiHubLinks([a], "https://p/", frag)).toEqual({
      "ValueSet-Actors.html": "artifact/ValueSet-Actors.html",
      "ValueSet-Actors.schema.json": "fhir-artifact-index/dak/ValueSet-Actors.schema.json",
      "openapi/index.html": "https://p/openapi/index.html",
    });
  });

  it("the JSON tab is this site's view only when that page is written", () => {
    const withJson = { ...a, resourceType: "ValueSet", published: { json: { url: "https://p/ValueSet-Actors.json" } } } as unknown as FhirArtifact;
    const v = igApiViews(withJson)[0]!;
    expect(igApiViewData(withJson, v).tabs.find((t) => t.label === "JSON")!.href).toBe("https://p/ValueSet-Actors.json");
    expect(igApiViewData(withJson, v, "../", true).tabs.find((t) => t.label === "JSON")!.href).toBe("ValueSet-Actors.json.html");
  });
});

describe("igApiServed finds the declaration by its own name, not the directory's (bean rbz3)", () => {
  it("a separated IG keeps its data under a directory not named after it, and its declaration is still <name>.json", () => {
    const d = mkdtempSync(join(tmpdir(), "dak-served-"));
    try {
      const root = join(d, "ig-data");
      mkdirSync(root);
      const decl = (name: string) => ({
        name,
        directories: [
          { path: "fhir-artifact-index/", graphKinds: ["fhir-artifact-index"], served: true },
          { path: "docs/", instanceRoot: true, composed: true },
        ],
      });
      writeFileSync(join(root, "smart-trust.json"), JSON.stringify(decl("smart-trust")));
      expect(igApiServed(root)).toEqual({ ok: true });
      // A file named after the directory but declaring another name is not a declaration.
      rmSync(join(root, "smart-trust.json"));
      writeFileSync(join(root, "ig-data.json"), JSON.stringify(decl("smart-trust")));
      expect(igApiServed(root)).toEqual({ ok: false, why: "ig-data/ holds no instance declaration" });
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});
