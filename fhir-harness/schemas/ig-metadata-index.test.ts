import { describe, expect, test } from "bun:test";

import {
  IG_METADATA_EXPORTS,
  IG_METADATA_INDEX_SCHEMA_TAG,
  IG_METADATA_UNREACHED_TYPES,
  IgCodeSystemRefSchema,
  IgMetadataIndexSchema,
  dependencyReach,
  igMetadataVerdict,
  type IgMetadataIndex,
} from "./ig-metadata-index";
import { defaultGraphTypologies, graphTypologyIri, graphLayer, isDerivedGraph, isRenderable, processMayWrite } from "../../cat-harness/schemas/cat-harness";

/**
 * A harvest of one IG, in the shape the three Publisher exports actually take.
 *
 * Built by a helper rather than inlined per test, so a test asserting ONE rule
 * cannot pass because of a second violation elsewhere in its fixture.
 */
function index(over: Partial<IgMetadataIndex> = {}): unknown {
  const base = {
    $schema: IG_METADATA_INDEX_SCHEMA_TAG,
    ig: { packageId: "who.smart.example", version: "1.0.0" },
    source: { harvestedFrom: "https://example.test/ig", harvestedAt: "2026-09-30T00:00:00Z" },
    exports: {
      "valueset-ref-list": "present",
      "codesystem-ref-list": "present",
      "usage-stats": "present",
    },
    valueSetRefs: [{ valueSet: "http://example.test/ValueSet/a", codeSystems: ["http://example.test/CodeSystem/b"] }],
    codeSystemRefs: [{ codeSystem: "http://example.test/CodeSystem/b", usesState: "declared-empty", uses: [] }],
    usageStats: [{ url: "http://example.test/StructureDefinition/x", subject: "extension", paths: ["Patient.extension"] }],
  };
  return { ...base, ...over };
}

describe("a determined empty is never a not-found", () => {
  test("the baseline harvest parses", () => {
    expect(IgMetadataIndexSchema.safeParse(index()).success).toBe(true);
  });

  test("`present` with NO records is accepted — an IG may publish an empty export", () => {
    const r = IgMetadataIndexSchema.safeParse(index({ valueSetRefs: [] }));
    expect(r.success).toBe(true);
  });

  test("records under an `absent` export are REFUSED", () => {
    // Records cannot have come out of a file that was not there. Without this
    // rule, a mis-assembled document would read as an IG that published edges.
    const r = IgMetadataIndexSchema.safeParse(
      index({ exports: { "valueset-ref-list": "absent", "codesystem-ref-list": "present", "usage-stats": "present" } } as Partial<IgMetadataIndex>),
    );
    expect(r.success).toBe(false);
  });

  test("records under an `unknown` export are REFUSED too", () => {
    const r = IgMetadataIndexSchema.safeParse(
      index({ exports: { "valueset-ref-list": "unknown", "codesystem-ref-list": "present", "usage-stats": "present" } } as Partial<IgMetadataIndex>),
    );
    expect(r.success).toBe(false);
  });

  test("`unknown` and `absent` are different states, not two spellings of one", () => {
    // Nobody looked, versus somebody looked and it was not there.
    const notLooked = IgMetadataIndexSchema.parse(
      index({
        exports: { "valueset-ref-list": "unknown", "codesystem-ref-list": "present", "usage-stats": "present" },
        valueSetRefs: [],
      } as Partial<IgMetadataIndex>),
    );
    const looked = IgMetadataIndexSchema.parse(
      index({
        exports: { "valueset-ref-list": "absent", "codesystem-ref-list": "present", "usage-stats": "present" },
        valueSetRefs: [],
      } as Partial<IgMetadataIndex>),
    );
    expect(igMetadataVerdict(notLooked)).toBe("unknown");
    expect(igMetadataVerdict(looked)).toBe("finding");
  });
});

describe("`uses` — the field bean `nsbb` measured as declared and never populated", () => {
  test("declared-empty is representable, and is the measured case", () => {
    const r = IgCodeSystemRefSchema.safeParse({ codeSystem: "cs", usesState: "declared-empty", uses: [] });
    expect(r.success).toBe(true);
  });

  test("not-exported is a THIRD state, distinct from declared-empty", () => {
    expect(IgCodeSystemRefSchema.safeParse({ codeSystem: "cs", usesState: "not-exported", uses: [] }).success).toBe(true);
  });

  test("`populated` with an empty list is REFUSED — it would erase the finding", () => {
    expect(IgCodeSystemRefSchema.safeParse({ codeSystem: "cs", usesState: "populated", uses: [] }).success).toBe(false);
  });

  test("`declared-empty` with entries is REFUSED — the record would lie about itself", () => {
    expect(IgCodeSystemRefSchema.safeParse({ codeSystem: "cs", usesState: "declared-empty", uses: ["x"] }).success).toBe(false);
  });

  test("`not-exported` with entries is REFUSED for the same reason", () => {
    expect(IgCodeSystemRefSchema.safeParse({ codeSystem: "cs", usesState: "not-exported", uses: ["x"] }).success).toBe(false);
  });
});

describe("the measured reach ceiling is an API, not a paragraph", () => {
  test("the decision-logic core is out of reach", () => {
    for (const t of IG_METADATA_UNREACHED_TYPES) expect(dependencyReach(t)).toBe("out-of-reach");
  });

  test("terminology is in reach", () => {
    expect(dependencyReach("ValueSet")).toBe("exported");
    expect(dependencyReach("CodeSystem")).toBe("exported");
  });

  test("an empty edge list over an out-of-reach type is uninformative rather than clean", () => {
    // The consumer-facing point: a caller that cannot ask this reads silence
    // over most of a real IG as "no dependencies", which is the opposite of
    // what is true.
    expect(dependencyReach("PlanDefinition")).not.toBe("exported");
  });
});

describe("the file declares what it is", () => {
  test("a document with no `$schema` tag is REFUSED", () => {
    const { $schema: _drop, ...rest } = index() as Record<string, unknown>;
    expect(IgMetadataIndexSchema.safeParse(rest).success).toBe(false);
  });

  test("an unknown top-level key is REFUSED — the shape is strict", () => {
    expect(IgMetadataIndexSchema.safeParse({ ...(index() as object), metadataExports: {} }).success).toBe(false);
  });

  test("an export that has not decided its presence is REFUSED", () => {
    expect(
      IgMetadataIndexSchema.safeParse(
        index({ exports: { "valueset-ref-list": "present", "codesystem-ref-list": "present" } } as never),
      ).success,
    ).toBe(false);
  });

  test("a version is required — an id alone collides across publications", () => {
    expect(IgMetadataIndexSchema.safeParse(index({ ig: { packageId: "p" } } as never)).success).toBe(false);
  });

  test("all three exports are named", () => {
    expect(IG_METADATA_EXPORTS.length).toBe(3);
  });
});

describe("the graph typology it is held under", () => {
  test("registered, not renderable, and `derived`", () => {
    expect(defaultGraphTypologies.get("ig-metadata-index")).toBeDefined();
    expect(isRenderable("ig-metadata-index")).toBe(false);
    expect(graphLayer("ig-metadata-index")).toBe("derived");
    expect(isDerivedGraph("ig-metadata-index")).toBe(true);
  });

  test("a process may NOT write it as live state — it is regenerated, not updated", () => {
    expect(processMayWrite("ig-metadata-index")).toBe(false);
  });

  test("it is a DIFFERENT kind from `fhir-artifact-index`, on purpose", () => {
    // A reconstruction and a transcription. The test is here so a later
    // tidy-up that folds them cannot pass silently — which is exactly the
    // Option A the owner rejected as "making the index a bag".
    const kinds = ["fhir-artifact-index", "ig-metadata-index"].map((k) => (defaultGraphTypologies.has(k) ? graphTypologyIri(k, defaultGraphTypologies.get(k)) : undefined));
    expect(new Set(kinds).size).toBe(2);
  });
});
