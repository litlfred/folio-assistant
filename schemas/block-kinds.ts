/**
 * The block kinds, as a runtime value — in a leaf module so anything can
 * read it.
 *
 * This list used to live in `types.ts`, which is where its consumers
 * mostly are. But `types.ts` imports schemas from `constraints.ts` at
 * module scope, so `constraints.ts` could not import back without a
 * runtime cycle — and its `appliesTo` arrays are built during module
 * initialisation, exactly when a cycle leaves the import undefined.
 *
 * That is why `constraints.ts` spelled its kind lists out by hand, and
 * why several of them ended up narrower than the rule they gated: a
 * kind missing from `appliesTo` is skipped by `validate.ts` without a
 * word. This module imports nothing, so there is no longer a reason for
 * any list of kinds to be written out anywhere.
 *
 * `types.ts` re-exports `BLOCK_KINDS` and `BlockKind`, so existing
 * importers are unaffected, and keeps the compile-time proof that this
 * array and the `Block` union cover each other — that check needs the
 * union, which necessarily lives with the types.
 *
 * @module schemas/block-kinds
 */

/**
 * Every block kind, as a RUNTIME value.
 *
 * `Block` is a type and is erased at compile time, so anything that has
 * to recognise a block by reading its source — the QA pipeline's block
 * discovery, the propagation sweeps, the viewer registry, the constraint
 * table — needs a list it can actually iterate. Seven such lists existed,
 * hand-maintained and independent, and every one of them was short.
 *
 * The cost was silent. `readBlockManifest` returns `undefined` for an
 * unrecognised builder and `walkBlocks` skips whatever it returns
 * `undefined` for, so on the qou corpus 461 blocks — 445 `table`, 16
 * `algorithm` — were never yielded, never swept, and never audited.
 * Roughly 13% of the corpus, excluded by a stale regex rather than by
 * any decision.
 */
export const BLOCK_KINDS = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "algorithm",
  "conjecture",
  "example",
  "remark",
  "proof",
  "simulator",
  "prose",
  "equation",
  "diagram",
  "table",
] as const;

export type BlockKind = (typeof BLOCK_KINDS)[number];

/**
 * `BLOCK_KINDS` as a regex alternation, for the several places that
 * identify a block by scanning its `.ts` source for the builder call.
 *
 * Those call sites need different surrounding patterns — anchored vs
 * not, `export default` required or optional, followed by `(` or by
 * `({` — so they build their own regex around this rather than sharing
 * one. What they must NOT do is spell out the alternation, which is how
 * five of them came to list 13 of the 15 kinds.
 */
export const BLOCK_KIND_ALT = BLOCK_KINDS.join("|");

// ── Adapter scoping ──────────────────────────────────────────────

/**
 * The content adapters a folio can hold.
 *
 * `folio.config.json` already carries `contentType` and `adapter`, and the
 * platform ships `adapters/paper/`. This names the dimension so that block
 * kinds and QA criteria can be scoped to it instead of living in one global
 * pool.
 */
export const CONTENT_ADAPTERS = ["paper", "dak"] as const;
export type ContentAdapter = (typeof CONTENT_ADAPTERS)[number];

/**
 * The `paper` adapter's block kinds — the fifteen above.
 *
 * An alias rather than a second list: `BLOCK_KINDS` *is* the paper set, and
 * the compile-time exhaustiveness proof in `types.ts` pins it to the `Block`
 * union. Duplicating it here is precisely the drift this module exists to
 * prevent.
 */
export const PAPER_BLOCK_KINDS = BLOCK_KINDS;

/**
 * The `dak` adapter's block kinds — WHO SMART Guidelines L2 and L3.
 *
 * Taken from the component lists this repo already treats as canonical:
 * `schemas/skills/l2-dak-authoring/input.schema.json` (the nine DAK
 * components) and `schemas/skills/l3-fhir-authoring/input.schema.json` (the
 * ten FHIR artefact types). WHO's own starter kit could not be consulted
 * directly — `smart.who.int` and `build.fhir.org` return the same 403 policy
 * denial as `who.int` — so these mirror the repo's schemas, not the published
 * IG.
 *
 * ## Declared, not yet authorable
 *
 * These kinds are **not** members of the `Block` union and have no builder,
 * no Zod schema and no viewer registration. Authoring a DAK block is a
 * separate piece of work; what exists today is the vocabulary, so that QA
 * criteria can be scoped by adapter and so the ingest writer has names to
 * emit. `walkBlocks` will not discover a `.ts` declaring one of these until
 * that work lands — which is the honest state, rather than a kind that looks
 * supported and silently yields nothing.
 */
export const DAK_BLOCK_KINDS = [
  // L2 — Digital Adaptation Kit components.
  "persona",
  "user-scenario",
  "business-process",
  "data-element",
  "decision-table",
  "scheduling-logic",
  "indicator",
  "functional-requirement",
  "non-functional-requirement",
  // L3 — FHIR implementation-guide artefacts.
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
] as const;

export type DakBlockKind = (typeof DAK_BLOCK_KINDS)[number];

/** Every kind any adapter recognises. */
export const ALL_BLOCK_KINDS = [...PAPER_BLOCK_KINDS, ...DAK_BLOCK_KINDS] as const;
export type AnyBlockKind = BlockKind | DakBlockKind;

/** Which kinds belong to which adapter. */
export const ADAPTER_BLOCK_KINDS: Record<ContentAdapter, readonly string[]> = {
  paper: PAPER_BLOCK_KINDS,
  dak: DAK_BLOCK_KINDS,
};

const KIND_TO_ADAPTER: ReadonlyMap<string, ContentAdapter> = new Map(
  CONTENT_ADAPTERS.flatMap((a) =>
    ADAPTER_BLOCK_KINDS[a].map((k) => [k, a] as [string, ContentAdapter]),
  ),
);

/**
 * The adapter a block kind belongs to, or `undefined` for an unknown kind.
 *
 * `undefined` is deliberately not defaulted to `"paper"`. A criterion that
 * silently treats an unrecognised kind as a paper block is how a math axis
 * would come to run against a ValueSet — the caller must decide what an
 * unknown kind means rather than inherit a guess.
 */
export function adapterForKind(kind: string): ContentAdapter | undefined {
  return KIND_TO_ADAPTER.get(kind);
}

/**
 * Builder function name for each DAK kind.
 *
 * Paper kinds are single lowercase words, so builder name and kind string are
 * the same token and `BLOCK_BUILDER_RE` can alternate over the kinds directly.
 * DAK kinds are multi-word (`decision-table`), and a hyphen is not a valid
 * identifier — so the two namespaces separate here for the first time: the
 * kind stays kebab-case because it is *data*, and the builder is camelCase
 * because it is an *identifier*.
 *
 * Anything scanning a `.ts` for `export default <builder>(` must alternate
 * over these values and map back through {@link kindForBuilder}. Deriving one
 * from the other by string munging is what this map exists to prevent.
 */
export const DAK_KIND_BUILDERS: Record<DakBlockKind, string> = {
  persona: "persona",
  "user-scenario": "userScenario",
  "business-process": "businessProcess",
  "data-element": "dataElement",
  "decision-table": "decisionTable",
  "scheduling-logic": "schedulingLogic",
  indicator: "indicator",
  "functional-requirement": "functionalRequirement",
  "non-functional-requirement": "nonFunctionalRequirement",
  "logical-model": "logicalModel",
  profile: "profile",
  "value-set": "valueSet",
  questionnaire: "questionnaire",
  "cql-library": "cqlLibrary",
  "structure-map": "structureMap",
  "plan-definition": "planDefinition",
  measure: "measure",
  "test-case": "testCase",
  "actor-definition": "actorDefinition",
};

const BUILDER_TO_KIND: ReadonlyMap<string, string> = new Map([
  ...PAPER_BLOCK_KINDS.map((k) => [k, k] as [string, string]),
  ...(Object.entries(DAK_KIND_BUILDERS) as Array<[string, string]>).map(
    ([kind, builder]) => [builder, kind] as [string, string],
  ),
]);

/** The block kind a builder name introduces, or `undefined` if it is not one. */
export function kindForBuilder(builder: string): string | undefined {
  return BUILDER_TO_KIND.get(builder);
}

/**
 * Every builder name, for the regex alternation that recognises a block
 * manifest by scanning its source. Longest first, so `actorDefinition` is not
 * shadowed by a shorter prefix in an alternation.
 */
export const ALL_BLOCK_BUILDER_ALT = [...BUILDER_TO_KIND.keys()]
  .sort((a, b) => b.length - a.length)
  .join("|");

/**
 * Label prefix for each DAK kind, without the colon.
 *
 * Canonical here rather than in `constraints.ts` so that `KNOWN_LABEL_PREFIXES`
 * (validation) and `KIND_PREFIXES` (JSON-LD `@id` minting) both derive from
 * one list. Those two already have a sync assertion; a third hand-written copy
 * is what it exists to prevent.
 *
 * None collide with the paper and structural prefixes (`def`, `thm`, `lem`,
 * `prop`, `cor`, `rem`, `ex`, `conj`, `prf`, `sim`, `eq`, `fig`, `tbl`, `sec`,
 * `chap`, `app`, `bib`) — asserted by test.
 */
export const DAK_LABEL_PREFIXES: Record<DakBlockKind, string> = {
  persona: "pers",
  "user-scenario": "scen",
  "business-process": "bp",
  "data-element": "de",
  "decision-table": "dt",
  "scheduling-logic": "sched",
  indicator: "ind",
  "functional-requirement": "freq",
  "non-functional-requirement": "nfreq",
  "logical-model": "lm",
  profile: "prof",
  "value-set": "vs",
  questionnaire: "quest",
  "cql-library": "cql",
  "structure-map": "sm",
  "plan-definition": "pd",
  measure: "meas",
  "test-case": "tc",
  "actor-definition": "actor",
};

// ── WHO DAK components, and this repo's coverage of them ─────────

/**
 * The WHO SMART Guidelines DAK components, in WHO's own order.
 *
 * The canonical list is eight components as published (see the WHO guidance
 * cited below), plus **test scenarios**, added later — which is why older
 * material, `sgex`'s agent instructions among it, documents "the 8 core DAK
 * components" and omits it. Anything counting components against an older
 * source will be off by one.
 *
 * Sources:
 * - <https://www.who.int/publications/i/item/9789240099456>
 * - <https://www.who.int/publications/i/item/9789240085138>
 * - <https://www.who.int/publications/i/item/9789240020306>
 *
 * This exists to make coverage answerable rather than assumed:
 * {@link DAK_COMPONENT_KINDS} maps each component to the block kinds that
 * represent it, and a component mapping to none is a documented gap, not an
 * oversight nobody noticed.
 */
export const DAK_COMPONENTS = [
  "health-interventions-and-recommendations",
  "generic-personas",
  "user-scenarios",
  "generic-business-processes-and-workflows",
  "core-data-elements",
  "decision-support-logic",
  "programme-indicators",
  "functional-and-non-functional-requirements",
  "test-scenarios",
] as const;

export type DakComponent = (typeof DAK_COMPONENTS)[number];

/** One-line statement of what each component is for, in WHO's terms. */
export const DAK_COMPONENT_DESCRIPTIONS: Record<DakComponent, string> = {
  "health-interventions-and-recommendations":
    "Links clinical and public health guidance to specific digital actions.",
  "generic-personas":
    "Defines the target users, such as primary healthcare workers, clients, or managers.",
  "user-scenarios":
    "Illustrates how different personas interact with digital tools in real-world settings.",
  "generic-business-processes-and-workflows":
    "Maps out step-by-step clinical and administrative routines.",
  "core-data-elements":
    "Lists required variables mapped to international terminology standards like ICD.",
  "decision-support-logic":
    "Outlines logical rules, alerts, and algorithms for clinical guidance.",
  "programme-indicators":
    "Specifies metrics used to evaluate health program performance and reporting.",
  "functional-and-non-functional-requirements":
    "Details system specifications, performance bounds, and security needs.",
  "test-scenarios":
    "Exercises the guidance end to end; added after the original eight components.",
};

/**
 * Which block kinds represent each WHO component.
 *
 * Deliberately **not** one-to-one in either direction:
 *
 * - `functional-and-non-functional-requirements` is one WHO component that
 *   this repo splits into two kinds, because the component's own name is a
 *   conjunction and the two halves have different reviewers.
 * - `decision-support-logic` gains `scheduling-logic`, which WHO treats as
 *   decision logic but which authors keep separate.
 * - `core-data-elements` collects everything describing a variable's shape,
 *   including the L3 `structure-map` that transforms between two of them.
 *
 * Coverage is asserted by test: every kind lands in exactly one component, and
 * exactly one component — `health-interventions-and-recommendations` — names
 * no kind at all. `dakComponentsWithoutL2` reports the sharper gap: components
 * with no *L2* kind, which is that one plus `test-scenarios`.
 */
export const DAK_COMPONENT_KINDS: Record<DakComponent, readonly DakBlockKind[]> = {
  "health-interventions-and-recommendations": [],
  "generic-personas": ["persona", "actor-definition"],
  "user-scenarios": ["user-scenario"],
  "generic-business-processes-and-workflows": ["business-process", "plan-definition"],
  "core-data-elements": [
    "data-element",
    "logical-model",
    "profile",
    "value-set",
    "questionnaire",
    "structure-map",
  ],
  "decision-support-logic": ["decision-table", "scheduling-logic", "cql-library"],
  "programme-indicators": ["indicator", "measure"],
  "functional-and-non-functional-requirements": [
    "functional-requirement",
    "non-functional-requirement",
  ],
  "test-scenarios": ["test-case"],
};
