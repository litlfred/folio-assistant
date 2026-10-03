/**
 * The `dak` adapter's vocabulary — its block kinds, their builder names and
 * label prefixes, and the WHO DAK components they represent.
 *
 * These tables lived in core's `cat-harness/schemas/block-kinds.ts` until bean
 * `1335` (stage D of the smart-* separation, #1767). Core's content model named
 * the `dak` adapter, so `dak-blocks.ts` could not leave for smart-base without
 * core importing a harness. They reach core now the other way round: smart-base
 * CONTRIBUTES the adapter and its kinds through `smart-base/contributions.ts`,
 * which `loadContributions` registers at load time, and core reads them from a
 * `ContributionRegistry` rather than from a module constant. See
 * `cat-harness/docs/proposals/dak-kinds-contribution-2026-10-02.md`.
 *
 * A leaf module, importing nothing from the content model, for the same reason
 * `block-kinds.ts` is one: `dak-blocks.ts` builds Zod schemas from these at
 * module initialisation, which is exactly when an import cycle bites.
 *
 * @module smart-base/schemas/dak-kinds
 * @graphNode schema
 */

/** The content adapter these kinds belong to. Contributed, not built in. */
export const DAK_ADAPTER = "dak";

/**
 * The `dak` adapter's block kinds — WHO SMART Guidelines L2 and L3.
 *
 * Taken from the component lists this repo already treats as canonical:
 * `smart-base/schemas/skills/l2-dak-authoring/input.schema.json` (the nine DAK
 * components) and `fhir-harness/schemas/skills/l3-fhir-authoring/input.schema.json` (the
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
  "health-intervention",
  "persona",
  "user-scenario",
  "business-process",
  "data-element",
  "decision-table",
  "scheduling-logic",
  "indicator",
  "functional-requirement",
  "non-functional-requirement",
  "test-scenario",
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
 * over these values and map back through core's `kindForBuilder`, which learns
 * them from the contribution (`BlockKindContribution.builder`). Deriving one
 * from the other by string munging is what this map exists to prevent.
 */
export const DAK_KIND_BUILDERS: Record<DakBlockKind, string> = {
  "health-intervention": "healthIntervention",
  persona: "persona",
  "user-scenario": "userScenario",
  "business-process": "businessProcess",
  "data-element": "dataElement",
  "decision-table": "decisionTable",
  "scheduling-logic": "schedulingLogic",
  indicator: "indicator",
  "functional-requirement": "functionalRequirement",
  "non-functional-requirement": "nonFunctionalRequirement",
  "test-scenario": "testScenario",
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

/**
 * Label prefix for each DAK kind, without the colon.
 *
 * Contributed to core with each kind (`BlockKindContribution.labelPrefix`), so
 * a registry-aware reader learns a DAK prefix from here rather than from a
 * second hand-written copy in core's `KNOWN_LABEL_PREFIXES` or `KIND_PREFIXES`,
 * which list the BUILT-IN prefixes only.
 *
 * None collide with the paper and structural prefixes (`def`, `thm`, `lem`,
 * `prop`, `cor`, `rem`, `ex`, `conj`, `prf`, `sim`, `eq`, `fig`, `tbl`, `sec`,
 * `chap`, `app`, `bib`) — asserted by test.
 */
export const DAK_LABEL_PREFIXES: Record<DakBlockKind, string> = {
  "health-intervention": "hi",
  persona: "pers",
  "user-scenario": "scen",
  "business-process": "bp",
  "data-element": "de",
  "decision-table": "dt",
  "scheduling-logic": "sched",
  indicator: "ind",
  "functional-requirement": "freq",
  "non-functional-requirement": "nfreq",
  "test-scenario": "tscen",
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
 * The canonical list is eight components as published, plus **test scenarios**,
 * added later. Four WHO-side sources state it and they do not all agree, so the
 * list is pinned here rather than recited:
 *
 * | Source | Says |
 * |---|---|
 * | `smart-base` `input/fsh/models/DAK.fsh` | These nine, ending `testScenarios` — its own description says "all 9 DAK components" |
 * | `smart-ig-starter-kit` `l2_dak_authoring.md`, **the table** | These nine, identically numbered |
 * | `smart-ig-starter-kit` `l2_dak_authoring.md`, **the intro prose** | A different nine: scheduling logic promoted to #7, test scenarios absent — stale, and contradicted by the table directly beneath it |
 * | `sgex` `.github/copilot-instructions.md` | Eight (predates test scenarios), *plus* a second list of artefact types that is not the components at all |
 *
 * Three of the four agree, including both machine-readable ones — but the
 * owner ruled, 2026-09-30, that the DAK has **ten**: the original eight, plus
 * scheduling logic and test scenarios (issue #1614). Scheduling logic is
 * authored as DMN decision tables but is not yet formalized as its own L2
 * logical-model field or L3 artefact, so it is listed here AND named in
 * {@link DAK_UNFORMALIZED_COMPONENTS}; the other nine match `DAK.fsh`
 * field for field. Anything counting components against one source alone is
 * off by one, silently.
 *
 * Published guidance:
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
  "scheduling-logic",
  "programme-indicators",
  "functional-and-non-functional-requirements",
  "test-scenarios",
] as const;

export type DakComponent = (typeof DAK_COMPONENTS)[number];

/**
 * Components the owner counts that WHO's `DAK` logical model does not yet
 * declare as a field of their own (owner, 2026-09-30, #1614). Each still has a
 * {@link DAK_COMPONENT_FIELDS} entry — the name the field would take — so a
 * `dak.config.json` can carry it; the check against `DAK.fsh` skips these and
 * checks the rest field for field. When WHO formalizes one, it leaves this list.
 */
export const DAK_UNFORMALIZED_COMPONENTS: readonly DakComponent[] = ["scheduling-logic"];

/**
 * The field each component occupies in WHO's own `DAK` logical model.
 *
 * From `smart-base` `input/fsh/models/DAK.fsh`, where every component is
 * declared `0..* <Name>Source`. Carrying the field names makes this table
 * checkable against WHO's model rather than merely parallel to it, and gives a
 * DAK read from `dak.config.json` somewhere to land.
 */
export const DAK_COMPONENT_FIELDS: Record<DakComponent, string> = {
  "health-interventions-and-recommendations": "healthInterventions",
  "generic-personas": "personas",
  "user-scenarios": "userScenarios",
  "generic-business-processes-and-workflows": "businessProcesses",
  "core-data-elements": "dataElements",
  "decision-support-logic": "decisionLogic",
  // Not in `DAK.fsh` yet — see DAK_UNFORMALIZED_COMPONENTS.
  "scheduling-logic": "schedulingLogic",
  "programme-indicators": "indicators",
  "functional-and-non-functional-requirements": "requirements",
  "test-scenarios": "testScenarios",
};

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
  "scheduling-logic":
    "Decision tables (DMN) that schedule follow-up visits and services by care plan; not yet formalized as its own L2 or L3 artefact.",
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
 * - `scheduling-logic` is its own component (owner, 2026-09-30), holding the
 *   `scheduling-logic` kind. It was folded into `decision-support-logic` until
 *   then, because WHO's SOP table and `DAK.fsh` both keep it there; the owner
 *   counts it separately because it is authored separately, as its own DMN
 *   decision tables, even though no L2/L3 artefact formalizes it yet.
 * - `core-data-elements` collects everything describing a variable's shape,
 *   including the L3 `structure-map` that transforms between two of them.
 *
 * Coverage is asserted by test: every kind lands in exactly one component, and
 * exactly one component — `health-interventions-and-recommendations` — names
 * no kind at all. `dakComponentsWithoutL2` reports the sharper gap: components
 * with no *L2* kind, which is that one plus `test-scenarios`.
 */
export const DAK_COMPONENT_KINDS: Record<DakComponent, readonly DakBlockKind[]> = {
  "health-interventions-and-recommendations": ["health-intervention"],
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
  "decision-support-logic": ["decision-table", "cql-library"],
  "scheduling-logic": ["scheduling-logic"],
  "programme-indicators": ["indicator", "measure"],
  "functional-and-non-functional-requirements": [
    "functional-requirement",
    "non-functional-requirement",
  ],
  "test-scenarios": ["test-scenario", "test-case"],
};

