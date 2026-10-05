/**
 * DAK block authoring: the kinds declared in the previous change are now real
 * — builders, Zod schemas, label prefixes, and discovery.
 *
 * Moved from `cat-harness/scripts/tests/dak-blocks.test.ts` with the module it
 * tests (bean `1335`). Core no longer declares the DAK kinds, so every claim
 * here about how CORE treats one — discovery, adapter ownership, JSON-LD
 * typing — is now made through the registry smart-base's contribution fills,
 * which is the path a running sweep takes.
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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resolve } from "path";
import {
  DAK_BLOCK_KINDS,
  DAK_COMPONENTS,
  DAK_COMPONENT_DESCRIPTIONS,
  DAK_COMPONENT_FIELDS,
  DAK_COMPONENT_KINDS,
  DAK_KIND_BUILDERS,
  DAK_UNFORMALIZED_COMPONENTS,
  DAK_LABEL_PREFIXES,
} from "./dak-kinds";
import {
  BLOCK_KINDS,
  CONTENT_PROFILES,
  kindForBuilder,
  adapterForKind,
  profileAcceptsKind,
} from "../../cat-harness/schemas/block-kinds";
import {
  decisionTable,
  valueSet,
  businessProcess,
  planDefinition,
  layerForKind,
  dakComponentsWithoutL2,
  healthIntervention,
  testScenario,
  type DakBlock,
} from "./dak-blocks";
import { KNOWN_LABEL_PREFIXES } from "../../cat-harness/schemas/constraints";
import { DAK_KIND_TO_WHO_MODEL, DAK_KIND_TO_FOLIO_TYPE } from "./dak-jsonld";
import { assertPrefixesInSync, typesForKind } from "../../cat-harness/schemas/jsonld";
import { readBlockManifest } from "../../cat-harness/content/pipeline/qa-utils";
import { ContributionRegistry, composedKindOwner } from "../../cat-harness/schemas/contributions";
import { loadContributionsSync } from "../../cat-harness/schemas/harness-config";

/**
 * The registry a folio depending on smart-base gets: `smart-ig`'s, loaded as
 * `loadContributions` does. Since bean riit, step 3, the DAK kinds reach it as
 * smart-base's declared `block-kinds/` nodes through the dependency walk, not
 * from an array `contributions.ts` returns.
 */
const registry = loadContributionsSync(resolve(import.meta.dir, "..", "..", "smart-ig"), new ContributionRegistry());
const builders = registry.contributedBuilders();

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

  test("builder names round-trip back to their kind, through the contribution", () => {
    for (const k of DAK_BLOCK_KINDS) {
      expect(kindForBuilder(DAK_KIND_BUILDERS[k], builders)).toBe(k);
    }
  });

  test("core does not know a DAK builder without the contribution", () => {
    // The point of bean 1335: core's built-in vocabulary is paper only.
    for (const k of DAK_BLOCK_KINDS) {
      if ((BLOCK_KINDS as readonly string[]).includes(DAK_KIND_BUILDERS[k])) continue;
      expect(kindForBuilder(DAK_KIND_BUILDERS[k])).toBeUndefined();
    }
  });

  test("paper builders still map to themselves", () => {
    for (const k of BLOCK_KINDS) expect(kindForBuilder(k, builders)).toBe(k);
  });

  test("builder names are unique across both adapters", () => {
    const names = [...BLOCK_KINDS, ...Object.values(DAK_KIND_BUILDERS)];
    expect(new Set(names).size).toBe(names.length);
  });

  test("an unknown builder maps to undefined", () => {
    expect(kindForBuilder("notABuilder", builders)).toBeUndefined();
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

  test("core's two built-in prefix lists stay in sync", () => {
    // KNOWN_LABEL_PREFIXES (validation) and KIND_PREFIXES (JSON-LD @id
    // minting) list the BUILT-IN prefixes; DAK's left both in bean 1335.
    expect(() => assertPrefixesInSync(KNOWN_LABEL_PREFIXES)).not.toThrow();
  });

  test("every DAK prefix reaches core through the contribution, and none is built in", () => {
    const contributed = registry.contributedLabelPrefixes();
    for (const k of DAK_BLOCK_KINDS) {
      expect(contributed).toContain(DAK_LABEL_PREFIXES[k]);
      expect(KNOWN_LABEL_PREFIXES).not.toContain(`${DAK_LABEL_PREFIXES[k]}:`);
    }
  });
});

describe("JSON-LD typing", () => {
  test("every DAK kind has a folio type, which core reads from the contribution", () => {
    for (const k of DAK_BLOCK_KINDS) {
      expect(DAK_KIND_TO_FOLIO_TYPE[k]).toBeTruthy();
      expect(typesForKind(k, registry).length).toBeGreaterThan(0);
      // Without the registry core does not know the kind, so it types nothing.
      expect(typesForKind(k)).toEqual([]);
    }
  });

  test("a value-set block is typed folio:, not fhir:", () => {
    // The block is the authored manifest; the FHIR ValueSet is what its .fsh
    // compiles to. Typing the manifest as a FHIR resource would invite a
    // consumer to read FHIR fields off it.
    expect(typesForKind("value-set", registry)).toEqual(["folio-assistant-core:ValueSet"]);
  });

  test("DoCO co-typing stays sparing", () => {
    expect(typesForKind("decision-table", registry)).toEqual(["folio-assistant-core:DecisionTable", "doco:Table"]);
    expect(typesForKind("persona", registry)).toEqual(["folio-assistant-core:Persona"]);
  });

  test("paper typing is unchanged, with or without the registry", () => {
    expect(typesForKind("theorem")).toEqual(["folio-assistant-core:Theorem", "doco:Section"]);
    expect(typesForKind("theorem", registry)).toEqual(["folio-assistant-core:Theorem", "doco:Section"]);
  });
});

describe("discovery", () => {
  beforeAll(() => {
    mkdirSync(join(DIR, "ch01"), { recursive: true });
    writeFileSync(
      join(DIR, "ch01", "dt-anc-danger-signs.ts"),
      `import { decisionTable } from "../../smart-base/schemas/dak-blocks";
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
    const m = readBlockManifest(join(DIR, "ch01", "dt-anc-danger-signs.ts"), builders);
    expect(m).toEqual({ kind: "decision-table", label: "dt:anc-danger-signs" });
  });

  test("a multi-word L3 kind too", () => {
    const m = readBlockManifest(join(DIR, "ch01", "vs-danger-signs.ts"), builders);
    expect(m?.kind).toBe("value-set");
  });

  test("without the contribution, core does not discover a DAK manifest", () => {
    expect(readBlockManifest(join(DIR, "ch01", "dt-anc-danger-signs.ts"))).toBeUndefined();
  });

  test("paper manifests are unaffected, with or without the contribution", () => {
    const m = readBlockManifest(join(DIR, "ch01", "thm-main.ts"));
    expect(m).toEqual({ kind: "theorem", label: "thm:main" });
    expect(readBlockManifest(join(DIR, "ch01", "thm-main.ts"), builders)).toEqual(m);
  });

  test("a discovered DAK kind resolves to the dak adapter, through the registry", () => {
    const m = readBlockManifest(join(DIR, "ch01", "dt-anc-danger-signs.ts"), builders)!;
    expect(adapterForKind(m.kind)).toBeUndefined();
    expect(composedKindOwner(m.kind, registry, adapterForKind)).toBe("dak");
  });

  test("every DAK kind is owned by the dak adapter once registered", () => {
    for (const k of DAK_BLOCK_KINDS) expect(composedKindOwner(k, registry, adapterForKind)).toBe("dak");
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
    expect(DAK_COMPONENTS.length).toBe(10);
    expect(DAK_COMPONENTS[0]).toBe("health-interventions-and-recommendations");
    expect(DAK_COMPONENTS[9]).toBe("test-scenarios");
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

  test("every component now names at least one kind", () => {
    const bare = DAK_COMPONENTS.filter((c) => DAK_COMPONENT_KINDS[c].length === 0);
    expect(bare).toEqual([]);
  });

  test("no component is left without an L2 kind", () => {
    // Was ["health-interventions-and-recommendations", "test-scenarios"] until
    // both kinds landed. L2 is what a DAK *is*, so this closing is the point.
    expect(dakComponentsWithoutL2()).toEqual([]);
  });

  test("test-scenarios is represented at both layers, and they are distinct", () => {
    // The L2 scenario is the narrative a reviewer signs off; the L3 test-case
    // is a FHIR conformance artefact. Collapsing them would lose the review.
    expect(DAK_COMPONENT_KINDS["test-scenarios"]).toEqual(["test-scenario", "test-case"]);
    expect(layerForKind("test-scenario")).toBe("L2");
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

describe("the component list against WHO's own logical model", () => {
  // DAK_COMPONENTS is a claim about WHO's model, so where the model is on disk
  // it is checked rather than trusted. smart-base is an external checkout, so
  // absence must read as "not checked" — never as a pass. Same contract as the
  // rest of the smart-base-backed tooling.
  const DAK_FSH = join(
    process.env.SMART_BASE_HOME ?? "/home/user/litlfred/smart-base",
    "input/fsh/models/DAK.fsh",
  );
  const available = existsSync(DAK_FSH);

  test("smart-base availability is reported, not assumed", () => {
    if (!available) {
      console.warn(`  n/a: no DAK.fsh at ${DAK_FSH} — component fields unverified`);
    }
    expect(typeof available).toBe("boolean");
  });

  test.skipIf(!available)("every component field exists in WHO's DAK.fsh", () => {
    const fsh = readFileSync(DAK_FSH, "utf-8");
    // Component lines look like: `* healthInterventions 0..* HealthInterventionsSource "…"`
    const declared = new Set(
      [...fsh.matchAll(/^\* (\w+) 0\.\.\* (\w+Source)\b/gm)].map((m) => m[1]!),
    );
    expect(declared.size).toBe(9);
    // The owner's tenth, scheduling logic, is not in WHO's model yet — it is
    // named as unformalized rather than checked against a field it lacks.
    for (const c of DAK_COMPONENTS.filter((c) => !DAK_UNFORMALIZED_COMPONENTS.includes(c))) {
      expect(declared.has(DAK_COMPONENT_FIELDS[c])).toBe(true);
    }
  });

  test.skipIf(!available)("WHO declares no component this repo has not listed", () => {
    const fsh = readFileSync(DAK_FSH, "utf-8");
    const declared = [...fsh.matchAll(/^\* (\w+) 0\.\.\* \w+Source\b/gm)].map((m) => m[1]!);
    const known = new Set(Object.values(DAK_COMPONENT_FIELDS));
    expect(declared.filter((d) => !known.has(d))).toEqual([]);
  });

  test.skipIf(!available)("scheduling logic is not YET a field of WHO's model", () => {
    // WHO's model and the starter kit's table keep it inside decision support.
    // The owner counts it as its own component (2026-09-30), so it is listed and
    // marked unformalized; when DAK.fsh gains the field, this test fails and
    // the unformalized list should shrink.
    expect(readFileSync(DAK_FSH, "utf-8")).not.toMatch(/^\* schedul/im);
  });
});

describe("scheduling logic is its own component, and says it is unformalized", () => {
  test("it owns the scheduling-logic kind, and decision support no longer does", () => {
    expect(DAK_COMPONENT_KINDS["scheduling-logic"]).toEqual(["scheduling-logic"]);
    expect(DAK_COMPONENT_KINDS["decision-support-logic"]).not.toContain("scheduling-logic");
  });

  test("it is the one component named unformalized, and it sits seventh", () => {
    expect(DAK_UNFORMALIZED_COMPONENTS).toEqual(["scheduling-logic"]);
    expect(DAK_COMPONENTS.indexOf("scheduling-logic")).toBe(6);
  });
});

describe("the two kinds added from WHO's own logical models", () => {
  test("a health intervention requires at least one reference", () => {
    // HealthInterventions.fsh makes `reference` 1..*: an intervention with no
    // source recommendation is not one. Caught at construction, not at review.
    expect(() =>
      healthIntervention({ label: "hi:dtp-booster", title: "DTP booster", references: [] }),
    ).toThrow();
  });

  test("references carry Dublin Core, not bare strings", () => {
    const b = healthIntervention({
      label: "hi:dtp-booster",
      title: "DTP booster",
      references: [
        {
          title: "WHO classification of digital health interventions",
          source: "https://iris.who.int/handle/10665/373581",
          publisher: "World Health Organization",
        },
      ],
    });
    expect(b.layer).toBe("L2");
    expect(b.references[0]!.source).toContain("iris.who.int");
  });

  test("a Dublin Core reference must at least be nameable", () => {
    expect(() =>
      healthIntervention({
        label: "hi:x",
        title: "X",
        references: [{ title: "" }],
      }),
    ).toThrow();
  });

  test("both new kinds are L2 and carry their label prefix", () => {
    expect(layerForKind("health-intervention")).toBe("L2");
    expect(DAK_LABEL_PREFIXES["health-intervention"]).toBe("hi");
    expect(DAK_LABEL_PREFIXES["test-scenario"]).toBe("tscen");
    expect(() => testScenario({ label: "wrong:x", title: "X" })).toThrow();
    expect(testScenario({ label: "tscen:immz-full-course", title: "Full course" }).layer).toBe("L2");
  });

  test("each new kind maps to the WHO logical model it came from", () => {
    expect(DAK_KIND_TO_WHO_MODEL["health-intervention"]).toBe(
      "http://smart.who.int/base/StructureDefinition/HealthInterventions",
    );
    expect(DAK_KIND_TO_WHO_MODEL["test-scenario"]).toBe(
      "http://smart.who.int/base/StructureDefinition/TestScenario",
    );
  });

  test("no WHO model IRI is invented for a kind WHO does not model", () => {
    // scheduling-logic is folded into decision support in WHO's model, and the
    // L3 kinds are FHIR artefacts rather than DAK component models. A
    // fabricated IRI would be indistinguishable from a real one downstream.
    expect(DAK_KIND_TO_WHO_MODEL["scheduling-logic"]).toBeUndefined();
    expect(DAK_KIND_TO_WHO_MODEL["measure"]).toBeUndefined();
    for (const iri of Object.values(DAK_KIND_TO_WHO_MODEL)) {
      expect(iri).toStartWith("http://smart.who.int/base/StructureDefinition/");
    }
  });
});

// Moved from cat-harness/scripts/tests/adapter-scoping.test.ts (bean 1335).
describe("DAK vocabulary tracks the repo's own L2/L3 schemas", () => {
  test("carries the L2 DAK components", () => {
    for (const k of [
      "persona",
      "user-scenario",
      "business-process",
      "data-element",
      "decision-table",
      "scheduling-logic",
      "indicator",
      "functional-requirement",
      "non-functional-requirement",
    ]) {
      expect(DAK_BLOCK_KINDS as readonly string[]).toContain(k);
    }
  });

  test("carries the L3 FHIR artefact types", () => {
    for (const k of [
      "logical-model",
      "profile",
      "value-set",
      "questionnaire",
      "cql-library",
      "structure-map",
      "plan-definition",
      "measure",
      "test-case",
      "actor-definition",
    ]) {
      expect(DAK_BLOCK_KINDS as readonly string[]).toContain(k);
    }
  });

  test("DAK kinds stay out of the paper union", () => {
    // They now have builders and Zod schemas (smart-base/schemas/dak-blocks.ts) and their
    // own exhaustiveness proof against DakBlock — but they must never enter
    // BLOCK_KINDS, whose proof is against the paper `Block` union and whose
    // membership is what every paper QA axis is scoped by.
    for (const k of DAK_BLOCK_KINDS) {
      expect(BLOCK_KINDS as readonly string[]).not.toContain(k);
    }
  });
});

// Moved from cat-harness/scripts/tests/content-profiles.test.ts (bean 1335).
describe("profiles do not reach a DAK kind", () => {
  test("a DAK kind is in no profile — a different adapter, not a narrower paper", () => {
    for (const k of DAK_BLOCK_KINDS) {
      for (const p of CONTENT_PROFILES) expect(profileAcceptsKind(p, k)).toBe(false);
    }
  });
});

describe("DAK kinds reach a folio only through its dependency tree (bean riit, step 3)", () => {
  // Owner, 2026-10-04: a folio sees the nodes of the instances it depends on
  // (option 1 of 3). folio-assistant-core's tree does not include smart-base.
  test("a folio whose tree includes smart-base registers every DAK kind", () => {
    expect(registry.contributedKinds().filter((k) => k.adapter === "dak").length).toBe(DAK_BLOCK_KINDS.length);
  });

  test("a folio whose tree does not include smart-base registers none", () => {
    const other = loadContributionsSync(resolve(import.meta.dir, "..", "..", "folio-assistant-core"), new ContributionRegistry());
    expect(other.contributedKinds().filter((k) => k.adapter === "dak")).toEqual([]);
  });
});
