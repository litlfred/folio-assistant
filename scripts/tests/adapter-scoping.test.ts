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
import { criterionAdapters } from "../../schemas/block-qa";
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

  test("DAK kinds are declared but NOT yet in the authorable Block union", () => {
    // They have no builder, no Zod schema and no viewer registration, so
    // walkBlocks will not discover one. Pinned so this stays a stated
    // limitation rather than a kind that looks supported and yields nothing.
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

  test("every registered criterion resolves to paper only", () => {
    // The registry is entirely paper axes today. If a DAK criterion is added
    // without declaring `adapters`, this fails — which is the point.
    for (const def of QA_CRITERIA_REGISTRY) {
      expect(criterionAdapters(def)).toEqual(["paper"]);
    }
  });

  test("no existing criterion is silently widened over DAK blocks", () => {
    for (const def of QA_CRITERIA_REGISTRY) {
      for (const k of DAK_BLOCK_KINDS) {
        const blockAdapter = adapterForKind(k)!;
        expect(criterionAdapters(def).includes(blockAdapter)).toBe(false);
      }
    }
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

  test("every registered criterion admits every paper kind", () => {
    for (const def of QA_CRITERIA_REGISTRY) {
      for (const k of BLOCK_KINDS) {
        expect(criterionAdapters(def).includes(adapterForKind(k)!)).toBe(true);
      }
    }
  });
});
