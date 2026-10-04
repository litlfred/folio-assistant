/**
 * Vocabulary mappings and FHIR ConceptMaps (bean `k74z`, owner 2026-10-02).
 *
 * With C = FHIR ConceptMaps and M = `folio-vocab-mapping/v1` tables, the
 * owner's requirement: produce ConceptMaps (π : M → C, lossy allowed), with π
 * injective on the image of ι : C → M, and in fact π ∘ ι = id_C.
 *
 * Asserted here, each where it can fail:
 *  1. π(ι(c)) = c, field for field after canonical key ordering, on published
 *     HL7 examples (R4 and R5, with dependsOn, product and unmapped). The
 *     same sweep over all 174 examples runs when FHIR_EXAMPLES_DIR is set.
 *  2. The round trip is not won by the passthrough bags: on those maps no
 *     mapping key lands in `extra`, and `metadata` holds only descriptive fields.
 *  3. π on an M-only construct (the `sl9u` derived title) REPORTS each loss.
 *  4. What π produces has only element paths R5's StructureDefinition defines.
 *  5. The relationship and SKOS tables, and the applier the Tool runs.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, test } from "bun:test";

import {
  R4_EQUIVALENCES,
  R4_TO_R5_RELATIONSHIP,
  R5_TO_R4_EQUIVALENCE,
  RELATIONSHIPS,
  RELATIONSHIP_FOR_SKOS,
  SKOS_MATCH_FOR,
  VOCAB_MAPPING_SCHEMA,
  VocabMappingSchema,
  applyVocabMapping,
  type VocabMapping,
} from "../../schemas/vocab-mapping";
import { detectRelease, fromConceptMap, toConceptMap, type FhirRelease } from "../../schemas/vocab-mapping-fhir";

const FIX = resolve(import.meta.dir, "fixtures", "conceptmap");
type Json = Record<string, unknown>;
const read = (rel: string): Json => JSON.parse(readFileSync(join(FIX, rel), "utf-8")) as Json;

/** Sort object keys recursively; array order is meaningful and kept. */
const canon = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canon)
    : v !== null && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as Json)[k])]))
      : v;

const FIXTURES: ReadonlyArray<[string, FhirRelease]> = [
  ["r4/ConceptMap-example2.json", "R4"],
  ["r4/ConceptMap-101.json", "R4"],
  ["r5/ConceptMap-example2.json", "R5"],
  ["r5/ConceptMap-101.json", "R5"],
];

/** Map-level fields a ConceptMap carries that describe the RESOURCE, not the mapping. */
const DESCRIPTIVE = new Set([
  "id", "meta", "text", "contact", "identifier", "jurisdiction", "useContext", "approvalDate", "lastReviewDate",
  "effectivePeriod", "topic", "author", "editor", "reviewer", "endorser", "relatedArtifact", "extension", "language",
]);

function extraKeys(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach((x) => extraKeys(x, out));
  else if (v !== null && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      if (k === "extra") out.push(...Object.keys(x as object));
      else extraKeys(x, out);
    }
  }
  return out;
}

describe("the fixtures are the published examples, unmodified", () => {
  const prov = read("provenance.json") as { sources: Array<{ files: Record<string, string> }> };
  for (const s of prov.sources) {
    for (const [file, sha] of Object.entries(s.files)) {
      test(file, () => {
        expect(createHash("sha256").update(readFileSync(join(FIX, file))).digest("hex")).toBe(sha);
      });
    }
  }
});

describe("π ∘ ι = id on published ConceptMaps", () => {
  for (const [file, release] of FIXTURES) {
    test(`${file} (${release})`, () => {
      const c = read(file);
      expect(detectRelease(c)).toBe(release);
      const m = fromConceptMap(c, release);
      expect(VocabMappingSchema.safeParse(m).success).toBe(true);
      const { conceptMap, losses } = toConceptMap(m, { release });
      expect(losses).toEqual([]);
      expect(canon(conceptMap)).toEqual(canon(c));
      // Not won by the bags: every mapping key is interpreted, and only
      // resource description is carried as metadata.
      expect(extraKeys(m.group)).toEqual([]);
      for (const k of Object.keys(m.metadata ?? {})) expect(DESCRIPTIVE.has(k)).toBe(true);
    });
  }

  test("the fixtures exercise dependsOn, product and unmapped in both releases", () => {
    const has = (m: VocabMapping, f: (t: NonNullable<NonNullable<VocabMapping["group"][number]["element"][number]["target"]>[number]>) => boolean) =>
      m.group.some((g) => g.element.some((e) => (e.target ?? []).some(f)));
    const r4 = fromConceptMap(read("r4/ConceptMap-example2.json"), "R4");
    const r5 = fromConceptMap(read("r5/ConceptMap-example2.json"), "R5");
    for (const m of [r4, r5]) {
      expect(has(m, (t) => (t.dependsOn ?? []).length > 0)).toBe(true);
      expect(m.group.some((g) => g.unmapped !== undefined)).toBe(true);
    }
    expect(has(r4, (t) => t.equivalence !== undefined)).toBe(true);
    expect(r5.additionalAttribute?.length).toBeGreaterThan(0);
  });

  test("a constructed R5 map using what the examples do not: noMap, fixed unmapped, valueSet, target.property", () => {
    // CONSTRUCTED, not published: R5's only example with noMap is 216 KB.
    const c: Json = {
      resourceType: "ConceptMap",
      url: "http://example.org/cm",
      version: "1",
      status: "draft",
      sourceScopeCanonical: "http://example.org/vs-a",
      targetScopeUri: "http://example.org/vs-b",
      property: [{ code: "p", type: "string" }],
      group: [
        {
          source: "http://example.org/a|2.0",
          target: "http://example.org/b",
          element: [
            { code: "x", noMap: true },
            { valueSet: "http://example.org/vs-x", target: [{ valueSet: "http://example.org/vs-y", relationship: "related-to" }] },
            {
              code: "y",
              display: "Y",
              target: [
                {
                  code: "z",
                  relationship: "source-is-broader-than-target",
                  comment: "narrower on purpose",
                  property: [{ code: "p", valueString: "q" }],
                  dependsOn: [{ attribute: "a", valueSet: "http://example.org/vs-d" }],
                  product: [{ attribute: "b", valueCoding: { system: "http://example.org/s", code: "c" } }],
                  extension: [{ url: "http://example.org/ext", valueBoolean: true }],
                },
              ],
            },
          ],
          unmapped: { mode: "fixed", code: "unk", display: "Unknown", relationship: "related-to" },
        },
      ],
    };
    const m = fromConceptMap(c, "R5");
    expect(m.group[0]!.sourceVersion).toBe("2.0");
    const { conceptMap, losses } = toConceptMap(m, { release: "R5" });
    expect(losses).toEqual([]);
    expect(canon(conceptMap)).toEqual(canon(c));
  });
});

describe("crossing releases is a conversion, and says so", () => {
  test("an R4 map produced as R5 reports each equivalence R5 cannot say", () => {
    const c = read("r4/ConceptMap-example2.json");
    const m = fromConceptMap(c, "R4");
    const narrowed = m.group.flatMap((g) => g.element.flatMap((e) => e.target ?? [])).filter((t) => R5_TO_R4_EQUIVALENCE[t.relationship] !== t.equivalence);
    const { losses } = toConceptMap(m, { release: "R5" });
    expect(losses.filter((l) => l.field === "equivalence" && l.kind === "converted")).toHaveLength(narrowed.length);
  });

  test("an R5 noMap produced as R4 is written the R4 way, and reported", () => {
    const m = fromConceptMap({ resourceType: "ConceptMap", status: "draft", group: [{ element: [{ code: "x", noMap: true }] }] }, "R5");
    const { conceptMap, losses } = toConceptMap(m, { release: "R4" });
    const el = ((conceptMap["group"] as Json[])[0]!["element"] as Json[])[0]!;
    expect(el["target"]).toEqual([{ equivalence: "unmatched" }]);
    expect(losses.map((l) => `${l.kind}:${l.field}`)).toEqual(["converted:noMap"]);
  });
});

/** The `sl9u` scheme row: one label, SKOS authoritative, DC a derived copy. */
const SCHEME: VocabMapping = VocabMappingSchema.parse({
  $schema: VOCAB_MAPPING_SCHEMA,
  id: "test-scheme",
  status: "draft",
  group: [
    {
      source: "cat-harness:GlossaryScheme",
      target: "skos:",
      element: [
        { code: "label", target: [{ code: "prefLabel", relationship: "equivalent" }] },
        { code: "definition", target: [{ code: "definition", relationship: "equivalent" }] },
        { code: "retired", target: [{ code: "deprecated", relationship: "equivalent", transform: "flag" }] },
      ],
    },
    {
      source: "cat-harness:GlossaryScheme",
      target: "dcterms:",
      element: [
        { code: "label", target: [{ code: "title", relationship: "equivalent", authority: "derived", derivedFrom: "prefLabel" }] },
        { code: "usages", target: [{ code: "hasLaneUsage", key: "usage", relationship: "equivalent" }] },
      ],
    },
  ],
});

describe("π on what a ConceptMap cannot say reports it, never silently", () => {
  test("the derived title, the flag and the JSON key are each a reported loss", () => {
    const { conceptMap, losses } = toConceptMap(SCHEME, { release: "R5" });
    expect(losses.map((l) => `${l.kind}:${l.field}`).sort()).toEqual(["dropped:authority", "dropped:key", "dropped:transform"]);
    // The mapping FACTS survive: both targets of `label` are in the ConceptMap.
    const groups = conceptMap["group"] as Json[];
    expect(groups.map((g) => g["target"])).toEqual(["http://www.w3.org/2004/02/skos/core#", "http://purl.org/dc/terms/"]);
    expect(((groups[1]!["element"] as Json[])[0]!["target"] as Json[])[0]).toEqual({ code: "title", relationship: "equivalent" });
  });

  test("what π produces uses only element paths R5 defines", () => {
    for (const [m, release] of [[SCHEME, "R5"], ...FIXTURES.filter(([, r]) => r === "R5").map(([f]) => [fromConceptMap(read(f), "R5"), "R5"])] as Array<[VocabMapping, FhirRelease]>) {
      const bad = undefinedPaths(toConceptMap(m, { release }).conceptMap);
      expect(bad).toEqual([]);
    }
  });
});

describe("relationship tables", () => {
  test("R5 → R4 → R5 is the identity on every R5 code", () => {
    for (const r of RELATIONSHIPS) expect(R4_TO_R5_RELATIONSHIP[R5_TO_R4_EQUIVALENCE[r]]).toBe(r);
  });
  test("every R4 code has an R5 relationship", () => {
    for (const e of R4_EQUIVALENCES) expect(RELATIONSHIPS).toContain(R4_TO_R5_RELATIONSHIP[e]);
  });
  test("SKOS: each match property reads back as the relationship that writes it", () => {
    for (const r of RELATIONSHIPS) {
      const p = SKOS_MATCH_FOR[r];
      if (p !== undefined) expect(RELATIONSHIP_FOR_SKOS[p]).toBe(r);
    }
    expect(SKOS_MATCH_FOR["not-related-to"]).toBeUndefined();
    expect(RELATIONSHIP_FOR_SKOS["skos:closeMatch"]).toBe("related-to");
  });
});

describe("applying a table (the vocab-map Tool)", () => {
  test("a derived target sits after its source and copies its value; absent values write nothing", () => {
    expect(applyVocabMapping(SCHEME, { label: "L", definition: "D", retired: false, usages: [] })).toEqual({ prefLabel: "L", title: "L", definition: "D" });
    expect(Object.keys(applyVocabMapping(SCHEME, { label: "L", definition: "D", retired: 1, usages: ["u"] }))).toEqual(["prefLabel", "title", "definition", "deprecated", "usage"]);
    expect(applyVocabMapping(SCHEME, { definition: "D" })).toEqual({ definition: "D" });
  });
  test("two rows writing one key is refused", () => {
    const twice = VocabMappingSchema.parse({ ...SCHEME, group: [SCHEME.group[0], SCHEME.group[0]] });
    expect(() => applyVocabMapping(twice, { label: "L" })).toThrow(/two rows write "prefLabel"/);
  });
  test("a derived target must name its source, and only a derived one may", () => {
    const bad = { ...SCHEME, group: [{ ...SCHEME.group[1], element: [{ code: "label", target: [{ code: "title", relationship: "equivalent", authority: "derived" }] }] }] };
    expect(VocabMappingSchema.safeParse(bad).success).toBe(false);
  });
});

describe("the vocab-mappings:check gate's own judgements", () => {
  test("a clean table passes; a derived target with no authoritative source, and an undeclared prefix, are each a finding", async () => {
    const { tableFindings } = await import("../vocab-mappings");
    const { STANDARD_PREFIXES } = await import("../../schemas/vocab-mapping-fhir");
    const { NS_PREFIXES } = await import("../../schemas/namespaces.js");
    const prefixes = { ...STANDARD_PREFIXES, ...NS_PREFIXES };
    expect(tableFindings(SCHEME, prefixes)).toEqual([]);
    const orphan = VocabMappingSchema.parse({
      ...SCHEME,
      group: [{ ...SCHEME.group[1], element: [{ code: "label", target: [{ code: "title", relationship: "equivalent", authority: "derived", derivedFrom: "prefLabel" }] }] }],
    });
    expect(tableFindings(orphan, prefixes).join("\n")).toMatch(/derives from "prefLabel", which no authoritative target/);
    const unknown = VocabMappingSchema.parse({ ...SCHEME, group: [{ ...SCHEME.group[0], target: "nope:" }] });
    expect(tableFindings(unknown, prefixes).join("\n")).toMatch(/"nope:" uses an undeclared prefix/);
  });
});

// The full HL7 example corpus, when a local copy is available. Not run in CI:
// the packages are not vendored here (fixtures are a sample, with provenance).
const CORPUS = process.env["FHIR_EXAMPLES_DIR"];
describe.skipIf(CORPUS === undefined)("the whole published example corpus", () => {
  test("every ConceptMap round-trips", () => {
    const pkg = JSON.parse(readFileSync(join(CORPUS!, "package.json"), "utf-8")) as { fhirVersions?: string[]; version: string };
    const release: FhirRelease = (pkg.fhirVersions?.[0] ?? pkg.version).startsWith("4.") ? "R4" : "R5";
    const files = readdirSync(CORPUS!).filter((f) => f.startsWith("ConceptMap-") && f.endsWith(".json"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const c = JSON.parse(readFileSync(join(CORPUS!, f), "utf-8")) as Json;
      const { conceptMap, losses } = toConceptMap(fromConceptMap(c, release), { release });
      expect([f, losses]).toEqual([f, []]);
      expect([f, canon(conceptMap)]).toEqual([f, canon(c)]);
    }
  });
});

// ── R5 shape: element paths from hl7.fhir.r5.core@5.0.0 StructureDefinition-ConceptMap ──

const R5_PATHS = new Set([
  "ConceptMap.id", "ConceptMap.meta", "ConceptMap.implicitRules", "ConceptMap.language", "ConceptMap.text", "ConceptMap.contained",
  "ConceptMap.extension", "ConceptMap.modifierExtension", "ConceptMap.url", "ConceptMap.identifier", "ConceptMap.version",
  "ConceptMap.versionAlgorithm[x]", "ConceptMap.name", "ConceptMap.title", "ConceptMap.status", "ConceptMap.experimental",
  "ConceptMap.date", "ConceptMap.publisher", "ConceptMap.contact", "ConceptMap.description", "ConceptMap.useContext",
  "ConceptMap.jurisdiction", "ConceptMap.purpose", "ConceptMap.copyright", "ConceptMap.copyrightLabel", "ConceptMap.approvalDate",
  "ConceptMap.lastReviewDate", "ConceptMap.effectivePeriod", "ConceptMap.topic", "ConceptMap.author", "ConceptMap.editor",
  "ConceptMap.reviewer", "ConceptMap.endorser", "ConceptMap.relatedArtifact", "ConceptMap.property", "ConceptMap.property.id",
  "ConceptMap.property.extension", "ConceptMap.property.modifierExtension", "ConceptMap.property.code", "ConceptMap.property.uri",
  "ConceptMap.property.description", "ConceptMap.property.type", "ConceptMap.property.system", "ConceptMap.additionalAttribute",
  "ConceptMap.additionalAttribute.id", "ConceptMap.additionalAttribute.extension", "ConceptMap.additionalAttribute.modifierExtension",
  "ConceptMap.additionalAttribute.code", "ConceptMap.additionalAttribute.uri", "ConceptMap.additionalAttribute.description",
  "ConceptMap.additionalAttribute.type", "ConceptMap.sourceScope[x]", "ConceptMap.targetScope[x]", "ConceptMap.group",
  "ConceptMap.group.id", "ConceptMap.group.extension", "ConceptMap.group.modifierExtension", "ConceptMap.group.source",
  "ConceptMap.group.target", "ConceptMap.group.element", "ConceptMap.group.element.id", "ConceptMap.group.element.extension",
  "ConceptMap.group.element.modifierExtension", "ConceptMap.group.element.code", "ConceptMap.group.element.display",
  "ConceptMap.group.element.valueSet", "ConceptMap.group.element.noMap", "ConceptMap.group.element.target",
  "ConceptMap.group.element.target.id", "ConceptMap.group.element.target.extension", "ConceptMap.group.element.target.modifierExtension",
  "ConceptMap.group.element.target.code", "ConceptMap.group.element.target.display", "ConceptMap.group.element.target.valueSet",
  "ConceptMap.group.element.target.relationship", "ConceptMap.group.element.target.comment", "ConceptMap.group.element.target.property",
  "ConceptMap.group.element.target.property.id", "ConceptMap.group.element.target.property.extension",
  "ConceptMap.group.element.target.property.modifierExtension", "ConceptMap.group.element.target.property.code",
  "ConceptMap.group.element.target.property.value[x]", "ConceptMap.group.element.target.dependsOn",
  "ConceptMap.group.element.target.dependsOn.id", "ConceptMap.group.element.target.dependsOn.extension",
  "ConceptMap.group.element.target.dependsOn.modifierExtension", "ConceptMap.group.element.target.dependsOn.attribute",
  "ConceptMap.group.element.target.dependsOn.value[x]", "ConceptMap.group.element.target.dependsOn.valueSet",
  "ConceptMap.group.element.target.product", "ConceptMap.group.unmapped", "ConceptMap.group.unmapped.id",
  "ConceptMap.group.unmapped.extension", "ConceptMap.group.unmapped.modifierExtension", "ConceptMap.group.unmapped.mode",
  "ConceptMap.group.unmapped.code", "ConceptMap.group.unmapped.display", "ConceptMap.group.unmapped.valueSet",
  "ConceptMap.group.unmapped.relationship", "ConceptMap.group.unmapped.otherMap",
]);

/** Paths in a produced R5 ConceptMap that R5 does not define. `product` shares `dependsOn`'s definition (contentReference). */
function undefinedPaths(cm: Json): string[] {
  const out: string[] = [];
  const known = (p: string, k: string): boolean => {
    const path = `${p}.${k}`.replace(".target.product", ".target.dependsOn");
    if (R5_PATHS.has(path)) return true;
    // The type suffix starts at the LAST capital: `sourceScopeUri` is `sourceScope[x]`.
    const m = /^(.*)([A-Z][a-z0-9]*)$/.exec(k);
    return m !== null && R5_PATHS.has(`${p.replace(".target.product", ".target.dependsOn")}.${m[1]}[x]`);
  };
  const walk = (v: unknown, p: string): void => {
    if (Array.isArray(v)) return v.forEach((x) => walk(x, p));
    if (v === null || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (p === "ConceptMap" && k === "resourceType") continue;
      if (!known(p, k)) out.push(`${p}.${k}`);
      // Do not descend into datatypes (Coding, Narrative, ContactDetail, …): only the resource's own paths are checked.
      if (R5_PATHS.has(`${p}.${k}`) && !/\.(extension|meta|text|contact|identifier|jurisdiction|useContext|property\.value|dependsOn\.value)/.test(`${p}.${k}`)) walk(x, `${p}.${k}`);
    }
  };
  walk(cm, "ConceptMap");
  return out;
}
