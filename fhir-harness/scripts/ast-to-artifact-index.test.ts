/**
 * `ast-to-artifact-index.ts` on a small synthetic AST: the index it derives,
 * and how it compares with a published-output index.
 *
 * The cases are the ones the first real run (smart-trust, 2026-10-02) found:
 * the manifest keys a canonical resource `url|version`, not `Type/id`; an
 * Endpoint's `name` is free text the published list shows as a description;
 * and the published HTML collapses whitespace and Markdown links.
 *
 * @module fhir-harness/scripts/ast-to-artifact-index.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { astToArtifactIndex, compareIndexes, publisherCategory, readerText, withCrossVersionFields } from "./ast-to-artifact-index";
import { readAst } from "./ig-ast";
import { FhirArtifactIndexSchema, type FhirArtifactIndex } from "../schemas/fhir-artifact-index.js";

const X = "http://example.org/ig";

function put(dir: string, rel: string, body: unknown): void {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, typeof body === "string" ? body : JSON.stringify(body));
}

/** An AST with an IG, a CodeSystem, a logical model and an Endpoint. */
function syntheticAst(inputs: Record<string, string> | null = {
  toolchain: "ig-publisher 2.3.4 / core 6.10.4",
  sourceRevision: "a".repeat(40),
  inputDigest: "b".repeat(64),
}) {
  const dir = mkdtempSync(join(tmpdir(), "ast-index-"));
  const res = [
    { resourceType: "ImplementationGuide", id: "example.ig", url: `${X}/ImplementationGuide/example.ig`, version: "1.0.0", name: "ExampleIG", title: "Example IG" },
    { resourceType: "CodeSystem", id: "Colours", url: `${X}/CodeSystem/Colours`, version: "1.0.0", name: "Colours", title: "Colours", description: "See the [palette](p.html).  Two spaces." },
    { resourceType: "StructureDefinition", id: "Cat", url: `${X}/StructureDefinition/Cat`, version: "1.0.0", name: "Cat", title: "Cat", kind: "logical", type: "Cat" },
    { resourceType: "Endpoint", id: "ep-1", name: "Trustlist one\nresolvable at https://x" },
  ];
  const manifestResources = res.map((r) => {
    const file = `resources/${r.resourceType}/${r.id}--0000.json`;
    put(dir, file, r);
    const key = r.url ? `${r.url}|${r.version}` : `${r.resourceType}/${r.id}`;
    return { key, canonical: r.url ?? null, version: r.version ?? null, resourceType: r.resourceType, id: r.id, name: r.name, file, source: `fsh-generated/resources/${r.resourceType}-${r.id}.json` };
  });
  put(dir, "manifest.json", {
    $schema: "ig-ast/v1",
    authority: "cache",
    provisional: ["indices", "dependencies", "versions"],
    generatedAt: "2026-10-01T19:05:45Z",
    ...(inputs ? { inputs } : {}),
    resources: manifestResources,
  });
  put(dir, "dependencies.json", { $schema: "ig-ast-dependencies/v1", authority: "cache", dependencies: [] });
  return readAst(dir);
}

describe("astToArtifactIndex", () => {
  const { index, unreadable } = astToArtifactIndex(syntheticAst(), { instanceId: "example", publishedBase: "https://pub.example.org/ig/" });

  test("validates, and every key is Type/id even where the manifest keyed url|version", () => {
    expect(FhirArtifactIndexSchema.safeParse(index).success).toBe(true);
    expect(unreadable).toEqual([]);
    expect(index.artifacts.map((a) => a.key)).toEqual([
      "CodeSystem/Colours",
      "Endpoint/ep-1",
      "ImplementationGuide/example.ig",
      "StructureDefinition/Cat",
    ]);
  });

  test("takes identity from the IG resource, and the source from the build", () => {
    expect(index.packageId).toBe("example.ig");
    expect(index.version).toBe("1.0.0");
    expect(index.canonicalBase).toBe(X);
    expect(index.source).toEqual({ kind: "output", of: "output-ast", revision: "a".repeat(40), readAt: "2026-10-01" });
  });

  test("every artefact is a compiled copy carrying the manifest's inputs", () => {
    for (const a of index.artifacts) {
      expect(a.materialization.state).toBe("materialized");
      expect(a.materialization.purpose).toBe("compiled");
      expect(a.materialization.inputs?.sourceRevision).toBe("a".repeat(40));
    }
  });

  test("an Endpoint is titled by its id, and its free-text name becomes the description", () => {
    const ep = index.artifacts.find((a) => a.key === "Endpoint/ep-1")!;
    expect(ep.title).toBe("ep-1");
    expect(ep.description).toBe("Trustlist one resolvable at https://x");
    expect(ep.name).toBeUndefined();
  });

  test("published URLs come from --published-base, never from the canonical", () => {
    const cs = index.artifacts.find((a) => a.key === "CodeSystem/Colours")!;
    expect(cs.published.html?.url).toBe("https://pub.example.org/ig/CodeSystem-Colours.html");
    const ig = index.artifacts.find((a) => a.resourceType === "ImplementationGuide")!;
    expect(ig.published.html).toBeUndefined();
    expect(ig.category).toBeUndefined();
  });

  test("an artefact the published IG does not have yet gets no published link", () => {
    const { index: ix } = astToArtifactIndex(syntheticAst(), {
      instanceId: "example",
      publishedBase: "https://pub.example.org/ig",
      publishedKeys: new Set(["CodeSystem/Colours"]),
    });
    expect(ix.artifacts.find((a) => a.key === "CodeSystem/Colours")!.published.html?.url).toBe(
      "https://pub.example.org/ig/CodeSystem-Colours.html",
    );
    const ep = ix.artifacts.find((a) => a.key === "Endpoint/ep-1")!;
    expect(ep.published).toEqual({});
    expect(ep.materialization.provenance.upstream).toBeUndefined();
  });

  test("no published base → no published representation claimed", () => {
    const { index: bare } = astToArtifactIndex(syntheticAst(), { instanceId: "example" });
    expect(bare.artifacts.every((a) => Object.keys(a.published).length === 0)).toBe(true);
  });

  test("an AST that records no source revision is not claimed as materialized", () => {
    const { index: noRev } = astToArtifactIndex(syntheticAst(null), { instanceId: "example" });
    expect(noRev.artifacts.every((a) => a.materialization.state === "unknown" && a.materialization.note)).toBe(true);
  });
});

describe("withCrossVersionFields", () => {
  const xv = (f: string) => `http://hl7.org/fhir/5.0/StructureDefinition/extension-ActorDefinition.${f}`;
  const basic = {
    resourceType: "Basic",
    id: "P",
    extension: [
      { url: xv("url"), valueUri: `${X}/ActorDefinition/P` },
      { url: xv("title"), valueString: "A Persona" },
      { url: xv("description"), valueMarkdown: "Someone." },
      { url: xv("experimental"), valueBoolean: true },
      { url: "http://hl7.org/fhir/5.0/StructureDefinition/extension-Other.title", valueString: "not mine" },
    ],
  };

  test("an R5 type written as an R4 Basic reads its fields back from its own extensions", () => {
    const r = withCrossVersionFields(basic, "ActorDefinition");
    expect(r.resourceType).toBe("ActorDefinition");
    expect(r.url).toBe(`${X}/ActorDefinition/P`);
    expect(r.title).toBe("A Persona");
    expect(r.description).toBe("Someone.");
    expect(publisherCategory(r)).toBe("Requirements: Actor Definitions");
  });

  test("a resource already of the manifest's type is returned as is", () => {
    const cs = { resourceType: "CodeSystem", id: "c", title: "t" };
    expect(withCrossVersionFields(cs, "CodeSystem")).toBe(cs);
  });
});

describe("publisherCategory", () => {
  test("the Publisher's default grouping", () => {
    expect(publisherCategory({ resourceType: "StructureDefinition", kind: "logical" })).toBe("Structures: Logical Models");
    expect(publisherCategory({ resourceType: "StructureDefinition", type: "Extension", derivation: "constraint" })).toBe("Structures: Extension Definitions");
    expect(publisherCategory({ resourceType: "StructureDefinition", kind: "resource", derivation: "constraint" })).toBe("Structures: Resource Profiles");
    expect(publisherCategory({ resourceType: "ActorDefinition" })).toBe("Requirements: Actor Definitions");
    expect(publisherCategory({ resourceType: "Endpoint" })).toBe("Other");
    expect(publisherCategory({ resourceType: "ImplementationGuide" })).toBeUndefined();
  });
});

describe("compareIndexes", () => {
  const { index: ast } = astToArtifactIndex(syntheticAst(), { instanceId: "example" });
  const pub = (mut: (ix: FhirArtifactIndex) => void): FhirArtifactIndex => {
    const ix = structuredClone(ast);
    mut(ix);
    ix.count = ix.artifacts.length;
    return ix;
  };

  test("whitespace and Markdown links are equivalent, not different", () => {
    expect(readerText("See the [palette](p.html).  Two spaces.")).toBe("See the palette. Two spaces.");
    const c = compareIndexes(ast, pub((ix) => {
      ix.artifacts.find((a) => a.key === "CodeSystem/Colours")!.description = "See the palette. Two spaces.";
    }));
    expect(c.differs).toEqual([]);
    expect(c.equivalent).toEqual([{ field: "description", count: 1 }]);
  });

  test("a field the published index lacks is the AST being richer", () => {
    const c = compareIndexes(ast, pub((ix) => {
      delete ix.artifacts.find((a) => a.key === "Endpoint/ep-1")!.description;
    }));
    expect(c.astRicher).toEqual([{ field: "description", count: 1 }]);
    expect(c.differs).toEqual([]);
  });

  test("a real change, an addition and a removal are all reported", () => {
    const c = compareIndexes(ast, pub((ix) => {
      ix.artifacts.find((a) => a.key === "StructureDefinition/Cat")!.title = "Dog";
      ix.artifacts = ix.artifacts.filter((a) => a.key !== "Endpoint/ep-1");
      ix.artifacts.push({ ...ix.artifacts[0]!, key: "CodeSystem/Gone", id: "Gone" });
    }));
    expect(c.differs).toEqual([{ key: "StructureDefinition/Cat", field: "title", ast: "Cat", published: "Dog" }]);
    expect(c.onlyInAst).toEqual(["Endpoint/ep-1"]);
    expect(c.onlyInPublished).toEqual(["CodeSystem/Gone"]);
  });
});

describe("a resource whose `name` is not a string (bean c65n)", () => {
  test("an example Patient (name is HumanName[]) is indexed under its id, not a crash", () => {
    const dir = mkdtempSync(join(tmpdir(), "ast-index-patient-"));
    const patient = { resourceType: "Patient", id: "child-1", name: [{ family: "Doe", given: ["Ada"] }] };
    put(dir, "resources/Patient/child-1--0000.json", patient);
    put(dir, "manifest.json", {
      $schema: "ig-ast/v1",
      authority: "cache",
      provisional: [],
      inputs: { toolchain: "t", sourceRevision: "a".repeat(40) },
      resources: [{ key: "Patient/child-1", canonical: null, version: null, resourceType: "Patient", id: "child-1", name: null, file: "resources/Patient/child-1--0000.json", source: null }],
    });
    put(dir, "dependencies.json", { $schema: "ig-ast-dependencies/v1", dependencies: [] });
    const { index, unreadable } = astToArtifactIndex(readAst(dir), { instanceId: "x" });
    expect(unreadable).toEqual([]);
    const p = index.artifacts.find((a) => a.key === "Patient/child-1")!;
    expect(p.title).toBe("child-1");
    expect(p.description).toBeUndefined();
    expect(p.name).toBeUndefined();
  });
});
