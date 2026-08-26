/**
 * DAK block authoring: the kinds declared in the previous change are now real
 * — builders, Zod schemas, label prefixes, and discovery.
 *
 * The subtle part is discovery. `BLOCK_BUILDER_RE` recognises a manifest by
 * scanning for `export default <builder>(`, and until now builder name and
 * kind string were the same token, so the regex alternated over the kinds
 * themselves. A DAK kind is multi-word (`decision-table`) and a hyphen is not
 * a valid identifier, so the two namespaces separate: the kind is data, the
 * builder is an identifier, and `kindForBuilder` maps back. Get that wrong and
 * blocks are discovered under the name `decisionTable`, which matches no
 * criterion's `appliesTo` and no adapter — the 461-block failure again, in a
 * new place.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  DAK_BLOCK_KINDS,
  DAK_COMPONENTS,
  DAK_COMPONENT_DESCRIPTIONS,
  DAK_COMPONENT_KINDS,
  DAK_KIND_BUILDERS,
  DAK_LABEL_PREFIXES,
  BLOCK_KINDS,
  ALL_BLOCK_KINDS,
  kindForBuilder,
  adapterForKind,
} from "../../schemas/block-kinds";
import {
  decisionTable,
  valueSet,
  businessProcess,
  planDefinition,
  layerForKind,
  dakComponentsWithoutL2,
  type DakBlock,
} from "../../schemas/dak-blocks";
import { KNOWN_LABEL_PREFIXES } from "../../schemas/constraints";
import {
  assertPrefixesInSync,
  typesForKind,
  DAK_KIND_TO_FOLIO_TYPE,
} from "../../schemas/jsonld";
import { readBlockManifest } from "../../content/pipeline/qa-utils";

const DIR = mkdtempSync(join(tmpdir(), "dak-blocks-"));
afterAll(() => {
  try {
    rmSync(DIR, { recursive: true, force: true });
  } catch {}
});

describe("builders", () => {
  test("construct a valid decision table and derive its layer", () => {
    const b = decisionTable({ label: "dt:anc-danger-signs", title: "ANC danger signs" });
    expect(b.kind).toBe("decision-table");
    expect(b.layer).toBe("L2");
  });

  test("L3 kinds derive L3", () => {
    expect(valueSet({ label: "vs:danger-signs" }).layer).toBe("L3");
    expect(planDefinition({ label: "pd:anc-contact" }).layer).toBe("L3");
  });

  test("layerForKind partitions every DAK kind", () => {
    for (const k of DAK_BLOCK_KINDS) {
      expect(["L2", "L3"]).toContain(layerForKind(k));
    }
  });

  test("a wrong label prefix is rejected at construction", () => {
    // The paper side enforces this via labelForKind; DAK must not be laxer.
    expect(() => decisionTable({ label: "def:not-a-decision-table" })).toThrow();
    expect(() => valueSet({ label: "dt:wrong-prefix" })).toThrow();
  });

  test("editorial fields are the same fields a paper block uses", () => {
    const b = businessProcess({
      label: "bp:anc-registration",
      title: "ANC registration",
      uses: ["de:patient-id"],
      tags: ["anc"],
      realises: "dt:anc-danger-signs",
    });
    expect(b.uses).toEqual(["de:patient-id"]);
    expect(b.realises).toBe("dt:anc-danger-signs");
  });

  test("an author-stated layer is not overwritten", () => {
    const b = decisionTable({ label: "dt:x", layer: "L3" });
    expect(b.layer).toBe("L3");
  });
});

describe("builder ↔ kind mapping", () => {
  test("every DAK kind has a builder name that is a valid identifier", () => {
    for (const k of DAK_BLOCK_KINDS) {
      const builder = DAK_KIND_BUILDERS[k];
      expect(builder).toBeTruthy();
      expect(builder).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
    }
  });

  test("builder names round-trip back to their kind", () => {
    for (const k of DAK_BLOCK_KINDS) {
      expect(kindForBuilder(DAK_KIND_BUILDERS[k])).toBe(k);
    }
  });

  test("paper builders still map to themselves", () => {
    for (const k of BLOCK_KINDS) expect(kindForBuilder(k)).toBe(k);
  });

  test("builder names are unique across both adapters", () => {
    const names = [...BLOCK_KINDS, ...Object.values(DAK_KIND_BUILDERS)];
    expect(new Set(names).size).toBe(names.length);
  });

  test("an unknown builder maps to undefined", () => {
    expect(kindForBuilder("notABuilder")).toBeUndefined();
  });
});

describe("label prefixes", () => {
  test("DAK prefixes do not collide with paper or structural prefixes", () => {
    const paper = new Set([
      "def", "thm", "lem", "prop", "cor", "rem", "ex", "conj",
      "prf", "sim", "eq", "fig", "tbl", "sec", "chap", "app", "bib",
    ]);
    for (const k of DAK_BLOCK_KINDS) {
      expect(paper.has(DAK_LABEL_PREFIXES[k])).toBe(false);
    }
  });

  test("DAK prefixes are unique among themselves", () => {
    const v = Object.values(DAK_LABEL_PREFIXES);
    expect(new Set(v).size).toBe(v.length);
  });

  test("the two prefix lists stay in sync now that DAK kinds are added", () => {
    // KNOWN_LABEL_PREFIXES (validation) and KIND_PREFIXES (JSON-LD @id
    // minting) both derive from DAK_LABEL_PREFIXES precisely so adding a kind
    // cannot update one and miss the other.
    expect(() => assertPrefixesInSync(KNOWN_LABEL_PREFIXES)).not.toThrow();
  });

  test("every DAK prefix is registered for validation", () => {
    for (const k of DAK_BLOCK_KINDS) {
      expect(KNOWN_LABEL_PREFIXES).toContain(`${DAK_LABEL_PREFIXES[k]}:`);
    }
  });
});

describe("JSON-LD typing", () => {
  test("every DAK kind has a folio type", () => {
    for (const k of DAK_BLOCK_KINDS) {
      expect(DAK_KIND_TO_FOLIO_TYPE[k]).toBeTruthy();
      expect(typesForKind(k).length).toBeGreaterThan(0);
    }
  });

  test("a value-set block is typed folio:, not fhir:", () => {
    // The block is the authored manifest; the FHIR ValueSet is what its .fsh
    // compiles to. Typing the manifest as a FHIR resource would invite a
    // consumer to read FHIR fields off it.
    expect(typesForKind("value-set")).toEqual(["folio:ValueSet"]);
  });

  test("DoCO co-typing stays sparing", () => {
    expect(typesForKind("decision-table")).toEqual(["folio:DecisionTable", "doco:Table"]);
    expect(typesForKind("persona")).toEqual(["folio:Persona"]);
  });

  test("paper typing is unchanged", () => {
    expect(typesForKind("theorem")).toEqual(["folio:Theorem", "doco:Section"]);
  });
});

describe("discovery", () => {
  beforeAll(() => {
    mkdirSync(join(DIR, "ch01"), { recursive: true });
    writeFileSync(
      join(DIR, "ch01", "dt-anc-danger-signs.ts"),
      `import { decisionTable } from "../../schemas/dak-blocks";
export default decisionTable({ label: "dt:anc-danger-signs" });\n`,
    );
    writeFileSync(
      join(DIR, "ch01", "vs-danger-signs.ts"),
      `export default valueSet({ label: "vs:danger-signs" });\n`,
    );
    writeFileSync(
      join(DIR, "ch01", "thm-main.ts"),
      `export default theorem({ label: "thm:main" });\n`,
    );
  });

  test("a DAK manifest is discovered under its KIND, not its builder name", () => {
    const m = readBlockManifest(join(DIR, "ch01", "dt-anc-danger-signs.ts"));
    expect(m).toEqual({ kind: "decision-table", label: "dt:anc-danger-signs" });
  });

  test("a multi-word L3 kind too", () => {
    const m = readBlockManifest(join(DIR, "ch01", "vs-danger-signs.ts"));
    expect(m?.kind).toBe("value-set");
  });

  test("paper manifests are unaffected", () => {
    const m = readBlockManifest(join(DIR, "ch01", "thm-main.ts"));
    expect(m).toEqual({ kind: "theorem", label: "thm:main" });
  });

  test("a discovered DAK kind resolves to the dak adapter", () => {
    const m = readBlockManifest(join(DIR, "ch01", "dt-anc-danger-signs.ts"))!;
    expect(adapterForKind(m.kind)).toBe("dak");
  });

  test("every kind either adapter declares is discoverable in principle", () => {
    for (const k of ALL_BLOCK_KINDS) expect(adapterForKind(k)).toBeTruthy();
  });
});

describe("the union stays partitioned", () => {
  test("a DakBlock kind is never a paper BLOCK_KINDS member", () => {
    const b: DakBlock = decisionTable({ label: "dt:x" });
    expect(BLOCK_KINDS as readonly string[]).not.toContain(b.kind);
  });
});

describe("WHO DAK component coverage", () => {
  // WHO publishes eight components; test scenarios was added later, which is
  // why older material — sgex's agent instructions among it — says "the 8 core
  // DAK components". Anything counting against an older source is off by one,
  // so the list is pinned here rather than recited from memory at each use.
  test("there are nine components, ending with the one added later", () => {
    expect(DAK_COMPONENTS.length).toBe(9);
    expect(DAK_COMPONENTS[0]).toBe("health-interventions-and-recommendations");
    expect(DAK_COMPONENTS[8]).toBe("test-scenarios");
  });

  test("every component is described", () => {
    for (const c of DAK_COMPONENTS) {
      expect(DAK_COMPONENT_DESCRIPTIONS[c]?.length ?? 0).toBeGreaterThan(20);
    }
  });

  test("every DAK kind belongs to exactly one component", () => {
    const seen = new Map<string, string[]>();
    for (const c of DAK_COMPONENTS) {
      for (const k of DAK_COMPONENT_KINDS[c]) {
        seen.set(k, [...(seen.get(k) ?? []), c]);
      }
    }
    const unmapped = DAK_BLOCK_KINDS.filter((k) => !seen.has(k));
    expect(unmapped).toEqual([]);
    const doubled = [...seen].filter(([, cs]) => cs.length > 1);
    expect(doubled).toEqual([]);
  });

  test("exactly one component names no kind at all", () => {
    // Health interventions is the L1 end of every `realises` edge and has no
    // kind at either layer, so that edge points at something unrepresentable.
    // Asserted as-is rather than as an aspiration: adding the kind fails here.
    const bare = DAK_COMPONENTS.filter((c) => DAK_COMPONENT_KINDS[c].length === 0);
    expect(bare).toEqual(["health-interventions-and-recommendations"]);
  });

  test("the L2 gap is exactly the two components known to have one", () => {
    // Not a wish: this asserts the gap as it stands, so adding a
    // `health-intervention` or L2 test-scenario kind fails here and forces the
    // documentation to be updated with the code.
    expect(dakComponentsWithoutL2()).toEqual([
      "health-interventions-and-recommendations",
      "test-scenarios",
    ]);
  });

  test("test-scenarios is represented, but only as an L3 FHIR artefact", () => {
    expect(DAK_COMPONENT_KINDS["test-scenarios"]).toEqual(["test-case"]);
    expect(layerForKind("test-case")).toBe("L3");
  });

  test("the requirements component is one component and two kinds", () => {
    // Its WHO name is a conjunction; splitting the kinds is deliberate.
    expect(DAK_COMPONENT_KINDS["functional-and-non-functional-requirements"]).toEqual([
      "functional-requirement",
      "non-functional-requirement",
    ]);
  });
});
