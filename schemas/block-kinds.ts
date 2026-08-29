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

// ── Content profiles ─────────────────────────────────────────────

/**
 * The **profiles** of the `paper` adapter's vocabulary.
 *
 * A profile is a *restriction* of one adapter's kind set, and is a different
 * axis from {@link CONTENT_ADAPTERS} — which is a disjoint partition of
 * namespaces. Getting those two confused is easy and costly, so the
 * distinction is worth stating plainly:
 *
 * | | adapter | profile |
 * |---|---|---|
 * | relation between members | disjoint | nested |
 * | a kind belongs to | exactly one | one or more |
 * | answers | "whose vocabulary is this word from?" | "may *this* folio use it?" |
 * | consumed by | QA criterion scoping ({@link adapterForKind}) | folio validation ({@link kindsOutsideProfile}) |
 *
 * `adapterForKind` therefore stays total and unambiguous: every kind below is
 * still a `paper` kind, and no QA criterion's scope changes because a profile
 * exists. A DAK kind is in no profile at all — it is a different adapter, not
 * a narrower paper.
 *
 * ## Why the split is where it is
 *
 * A *document* is the general case: policy guidance, a report, a standard, a
 * chapter of prose with tables and figures. A *paper* is that plus blocks
 * whose assertion is a formal mathematical claim, carried by a `.lean`
 * sibling. That is the whole difference — the tree of chapters and sections,
 * the `uses[]` editorial graph, QA sidecars, the HCI validation gate and the
 * publication pipeline are common to both, which is why they are one adapter
 * with two profiles rather than two adapters.
 *
 * The dividing line is machine-checkable at its sharpest point: `definition`
 * is the one kind whose `lean` field is **required** rather than optional
 * (`DefinitionBlock.lean: LeanRef` in `types.ts`), so a document folio cannot
 * contain one without failing schema validation. A test pins that, so the
 * partition cannot drift away from the type that motivates it.
 *
 * The theorem-like kinds join it for a reason that is editorial rather than
 * structural: their `lean` is optional, so a document *could* hold a
 * `theorem` with no formalization — but a theorem whose proof nothing checks
 * is the failure mode the paper profile exists to prevent, and offering the
 * kind in a folio with no Lean toolchain invites exactly that. `example`,
 * `remark`, `algorithm` and `proof`-free prose keep their optional `lean` and
 * stay in the document profile; a document folio simply never populates it,
 * which {@link DOCUMENT_FORBIDS_LEAN} states and validation enforces.
 */
export const CONTENT_PROFILES = ["document", "paper"] as const;
export type ContentProfile = (typeof CONTENT_PROFILES)[number];

/**
 * The kinds whose assertion *is* a formal mathematical claim.
 *
 * Written out rather than derived, because the criterion ("the block asserts
 * mathematics") is a judgement about meaning that no field on the type
 * exposes. What *is* derived is its complement — see
 * {@link DOCUMENT_BLOCK_KINDS} — so the two can never overlap or leave a kind
 * unclassified, which is the failure a second hand-written list would invite.
 */
export const MATH_BLOCK_KINDS = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "conjecture",
  "proof",
] as const satisfies readonly BlockKind[];

export type MathBlockKind = (typeof MATH_BLOCK_KINDS)[number];

/**
 * Everything a document folio may contain: the paper vocabulary minus
 * {@link MATH_BLOCK_KINDS}.
 *
 * Derived, so a kind added to `BLOCK_KINDS` lands here automatically. That
 * default is the permissive one, which is the opposite of the choice made for
 * QA criterion scoping — deliberately. A criterion misfiring on a kind it was
 * never written for reads as a real finding and wastes a reviewer; a new kind
 * being *offerable* in a document folio at worst offers something nobody
 * wants, and the profile test names every member so the classification is
 * reviewed rather than inherited silently.
 */
export const DOCUMENT_BLOCK_KINDS = BLOCK_KINDS.filter(
  (k): k is Exclude<BlockKind, MathBlockKind> =>
    !(MATH_BLOCK_KINDS as readonly string[]).includes(k),
);

export type DocumentBlockKind = (typeof DOCUMENT_BLOCK_KINDS)[number];

/** Which kinds each profile admits. */
export const PROFILE_BLOCK_KINDS: Record<ContentProfile, readonly BlockKind[]> = {
  document: DOCUMENT_BLOCK_KINDS,
  paper: PAPER_BLOCK_KINDS,
};

/**
 * Whether a document folio may carry a `lean` field on a block at all.
 *
 * `false`, and stated as a named constant rather than left implicit, because
 * the kinds a document keeps (`example`, `remark`, `algorithm`, `simulator`)
 * still *declare* an optional `lean` — the type permits what the profile
 * forbids. Validation reads this; without it the rule would live only in
 * whichever checker happened to implement it.
 */
export const DOCUMENT_FORBIDS_LEAN = true;

/** Does `profile` admit blocks of `kind`? Unknown kinds are never admitted. */
export function profileAcceptsKind(profile: ContentProfile, kind: string): boolean {
  return (PROFILE_BLOCK_KINDS[profile] as readonly string[]).includes(kind);
}

/**
 * The kinds in `kinds` that `profile` does not admit, de-duplicated and in
 * the profile-independent order of `BLOCK_KINDS`.
 *
 * Returns unknown kinds too: a folio holding a kind no adapter recognises is
 * a finding whichever profile it declares, and swallowing it here is how it
 * would reach a renderer instead of a validator.
 */
export function kindsOutsideProfile(
  profile: ContentProfile,
  kinds: readonly string[],
): string[] {
  const seen = new Set(kinds.filter((k) => !profileAcceptsKind(profile, k)));
  const known = (BLOCK_KINDS as readonly string[]).filter((k) => seen.has(k));
  const unknown = [...seen].filter((k) => !(BLOCK_KINDS as readonly string[]).includes(k)).sort();
  return [...known, ...unknown];
}

/**
 * The profile a folio declares, from its `folio.config.json` `contentType`.
 *
 * `paper` is the fallback for an unrecognised or absent value, which is the
 * safe direction here and only here: the paper profile is the *wider* set, so
 * a misconfigured folio is never told a block it legitimately contains is
 * forbidden. The narrower default would reject real content on a typo.
 */
export function profileForContentType(contentType: string | undefined): ContentProfile {
  return contentType === "document" ? "document" : "paper";
}

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
 * Three of the four agree, including both machine-readable ones, so that is
 * what this encodes. Anything counting components against an older source is
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
  "programme-indicators",
  "functional-and-non-functional-requirements",
  "test-scenarios",
] as const;

export type DakComponent = (typeof DAK_COMPONENTS)[number];

/**
 * The field each component occupies in WHO's own `DAK` logical model.
 *
 * From `smart-base` `input/fsh/models/DAK.fsh`, where every component is
 * declared `0..* <Name>Source`. Carrying the field names makes this table
 * checkable against WHO's model rather than merely parallel to it, and gives a
 * DAK read from `dak.json` somewhere to land.
 */
export const DAK_COMPONENT_FIELDS: Record<DakComponent, string> = {
  "health-interventions-and-recommendations": "healthInterventions",
  "generic-personas": "personas",
  "user-scenarios": "userScenarios",
  "generic-business-processes-and-workflows": "businessProcesses",
  "core-data-elements": "dataElements",
  "decision-support-logic": "decisionLogic",
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
 * - `decision-support-logic` gains `scheduling-logic`. WHO's authoring SOP
 *   calls scheduling logic "a specific type of decision-support logic" and
 *   documents it inside that component's row; `DAK.fsh` likewise gives it no
 *   field of its own. Only the SOP's stale intro prose promotes it, so it stays
 *   a kind rather than becoming a tenth component.
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
  "decision-support-logic": ["decision-table", "scheduling-logic", "cql-library"],
  "programme-indicators": ["indicator", "measure"],
  "functional-and-non-functional-requirements": [
    "functional-requirement",
    "non-functional-requirement",
  ],
  "test-scenarios": ["test-scenario", "test-case"],
};
