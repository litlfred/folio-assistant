/**
 * `BLOCK_KINDS` was one global pool with a compile-time exhaustiveness proof
 * against the `Block` union. Adding WHO L2/L3 kinds to that pool would make
 * every math axis nominally applicable to a FHIR ValueSet and every WHO axis
 * applicable to a lemma — and the failure would not be a visible `n/a` but a
 * `voice-scholarly-default: fail` on a decision table, which reads like a real
 * finding.
 *
 * So kinds are scoped by content adapter, and QA criteria carry an adapter
 * scope that the sweep gates on before it gates on companion files.
 *
 * The load-bearing choice is the **default**. `adapters` absent means
 * `["paper"]`, not "all": every one of the criteria in the registry today was
 * written for the paper adapter, so defaulting to "all" would need all ~47
 * edited to stay correct and would misfire silently on any that were missed.
 * These tests pin that default, and pin that the change is a no-op for every
 * kind the existing corpus actually contains.
 */
import { describe, test, expect } from "bun:test";
import {
  BLOCK_KINDS,
  PAPER_BLOCK_KINDS,
  DAK_BLOCK_KINDS,
  ALL_BLOCK_KINDS,
  ADAPTER_BLOCK_KINDS,
  CONTENT_ADAPTERS,
  adapterForKind,
} from "../../schemas/block-kinds";
import { criterionAdapters, incompatibleCompanions } from "../../schemas/block-qa";
import { QA_CRITERIA_REGISTRY } from "../../content/pipeline/qa-criteria-registry";

describe("adapter partition", () => {
  test("paper kinds are BLOCK_KINDS itself, not a copy", () => {
    // A second hand-maintained list is the drift this module exists to stop.
    expect(PAPER_BLOCK_KINDS).toBe(BLOCK_KINDS);
  });

  test("the two adapters do not overlap", () => {
    const paper = new Set<string>(PAPER_BLOCK_KINDS);
    for (const k of DAK_BLOCK_KINDS) expect(paper.has(k)).toBe(false);
  });

  test("ALL_BLOCK_KINDS is exactly the union, with no duplicates", () => {
    const total: number = PAPER_BLOCK_KINDS.length + DAK_BLOCK_KINDS.length;
    expect(ALL_BLOCK_KINDS.length as number).toBe(total);
    expect(new Set(ALL_BLOCK_KINDS).size).toBe(ALL_BLOCK_KINDS.length);
  });

  test("every adapter has a kind list and every kind maps back", () => {
    for (const a of CONTENT_ADAPTERS) {
      expect(ADAPTER_BLOCK_KINDS[a].length).toBeGreaterThan(0);
      for (const k of ADAPTER_BLOCK_KINDS[a]) expect(adapterForKind(k)).toBe(a);
    }
  });

  test("an unknown kind maps to undefined, never defaulted to paper", () => {
    // Defaulting here is exactly how a math axis would come to run against a
    // ValueSet: the caller has to decide what an unrecognised kind means.
    expect(adapterForKind("value-sett")).toBeUndefined();
    expect(adapterForKind("")).toBeUndefined();
  });
});

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
    // They now have builders and Zod schemas (schemas/dak-blocks.ts) and their
    // own exhaustiveness proof against DakBlock — but they must never enter
    // BLOCK_KINDS, whose proof is against the paper `Block` union and whose
    // membership is what every paper QA axis is scoped by.
    for (const k of DAK_BLOCK_KINDS) {
      expect(BLOCK_KINDS as readonly string[]).not.toContain(k);
    }
  });
});

describe("criterion adapter scope", () => {
  test("absent defaults to paper, not to all", () => {
    expect(criterionAdapters({})).toEqual(["paper"]);
  });

  test("an explicit scope is honoured", () => {
    expect(criterionAdapters({ adapters: ["dak"] })).toEqual(["dak"]);
    expect(criterionAdapters({ adapters: ["paper", "dak"] })).toEqual(["paper", "dak"]);
  });

  test("every criterion resolves to a non-empty scope", () => {
    for (const def of QA_CRITERIA_REGISTRY) {
      expect(criterionAdapters(def).length).toBeGreaterThan(0);
    }
  });

  test("a criterion never depends on a companion its adapters cannot have", () => {
    // `depends_on` gates applicability, so a mismatched pair does not error —
    // it produces a criterion that is permanently `n/a` and looks registered.
    for (const def of QA_CRITERIA_REGISTRY) {
      expect({ id: def.id, bad: incompatibleCompanions(def) }).toEqual({
        id: def.id,
        bad: [],
      });
    }
  });

  test("paper axes never admit a DAK block, and DAK axes never admit a paper one", () => {
    for (const def of QA_CRITERIA_REGISTRY) {
      const scope = criterionAdapters(def);
      for (const k of DAK_BLOCK_KINDS) {
        expect(scope.includes(adapterForKind(k)!)).toBe(scope.includes("dak"));
      }
      for (const k of BLOCK_KINDS) {
        expect(scope.includes(adapterForKind(k)!)).toBe(scope.includes("paper"));
      }
    }
  });

  test("every DAK-scoped criterion says so explicitly", () => {
    // Omitting `adapters` silently scopes to paper, so a DAK criterion that
    // forgets it never runs on the blocks it was written for.
    for (const def of QA_CRITERIA_REGISTRY) {
      if (def.domain === "dak") expect(criterionAdapters(def)).toEqual(["dak"]);
    }
  });

  test("the dak domain is actually populated", () => {
    // The scoping mechanism landed before anything was registered in it, which
    // meant DAK blocks would sweep clean for want of a question, not an answer.
    expect(QA_CRITERIA_REGISTRY.filter((d) => d.domain === "dak").length).toBeGreaterThan(0);
  });
});

describe("no-op for the existing paper corpus", () => {
  test("every kind the corpus can contain resolves to paper", () => {
    // walkBlocks recognises a block only via BLOCK_BUILDER_RE, built from
    // BLOCK_KINDS — so these are exactly the kinds a sweep can encounter
    // today. All must pass the adapter gate, or the next sweep rewrites
    // sidecars across the whole corpus.
    for (const k of BLOCK_KINDS) expect(adapterForKind(k)).toBe("paper");
  });

  test("every paper-scoped criterion admits every paper kind", () => {
    for (const def of QA_CRITERIA_REGISTRY) {
      if (!criterionAdapters(def).includes("paper")) continue;
      for (const k of BLOCK_KINDS) {
        expect(criterionAdapters(def).includes(adapterForKind(k)!)).toBe(true);
      }
    }
  });
});
