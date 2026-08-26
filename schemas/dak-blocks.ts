/**
 * WHO SMART Guidelines content blocks — the `dak` adapter.
 *
 * A DAK block is the same *shape* of thing as a paper block: a `.ts` manifest
 * with a label, editorial `uses[]` edges, and companion files, carrying a
 * `<stem>.qa.json` sidecar. What differs is which companion holds the
 * substance — a `.dmn` decision table rather than a `.lean` proof — and which
 * QA axes apply.
 *
 * Kept in its own module rather than added to `types.ts` because the adapter
 * separation is the point: `Block` stays the paper union with its
 * exhaustiveness proof against `BLOCK_KINDS`, and `DakBlock` gets its own
 * against `DAK_BLOCK_KINDS`. Mixing them would put every math axis one
 * `appliesTo` omission away from running on a ValueSet.
 *
 * ## What these types deliberately do NOT model
 *
 * Field-level semantics. A `value-set` block here carries a label, a title and
 * a pointer to its `.fsh`; it does not model FHIR's `ValueSet.compose.include`
 * or a DMN hit policy. Those belong to the artefact formats, which already
 * have specifications and validators (`fhir-validation`, `dmn-authoring`), and
 * inventing a parallel set of fields would create a second, weaker, drifting
 * copy — the same argument §2c of the ingestion proposal makes against
 * pointing a RAG engine at `content/`.
 *
 * The block manifest's job is identity, editorial edges and QA attachment. The
 * companion file is the content.
 *
 * @module schemas/dak-blocks
 */

import { z } from "zod";
import type { BlockBase } from "./types";
import { BlockBaseSchema } from "./constraints";
import {
  DAK_BLOCK_KINDS,
  DAK_COMPONENTS,
  DAK_COMPONENT_KINDS,
  DAK_LABEL_PREFIXES,
  type DakBlockKind,
  type DakComponent,
} from "./block-kinds";

// ── Base ─────────────────────────────────────────────────────────

/**
 * Shared shape of every DAK block.
 *
 * Extends `BlockBase`, so `label`, `uses[]`, `cites[]`, `tags[]`, `meta` and
 * the companion machinery are literally the same fields a paper block uses —
 * which is what lets one graph loader, one QA sweep and one `.jsonld` emitter
 * serve both adapters.
 */
export interface DakBlockBase extends BlockBase {
  /**
   * The WHO knowledge layer this block belongs to.
   *
   * Derived from the kind rather than authored — `layerForKind` is the single
   * place that decides — but carried on the block so a consumer reading one
   * manifest does not need the mapping table.
   */
  layer?: "L2" | "L3";
  /**
   * Label of the L1 recommendation or L2 component this block realises.
   *
   * The L1→L2→L3 traceability edge, and the thing that makes DAK coverage
   * answerable as a graph query: an L2 `decision-table` with no `realises`
   * pointing at it from L3, or an L1 recommendation nothing realises, is a
   * gap. Parallel to `RemarkBlock.interprets` on the paper side.
   */
  realises?: string;
}

/** Which WHO knowledge layer a DAK kind sits in. */
export function layerForKind(kind: DakBlockKind): "L2" | "L3" {
  return L3_KINDS.has(kind) ? "L3" : "L2";
}

const L3_KINDS: ReadonlySet<string> = new Set([
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
]);

// ── Per-kind interfaces ──────────────────────────────────────────

/**
 * L2 — a health intervention or recommendation the DAK digitises.
 *
 * WHO DAK component 1, and the L1 end of every `realises` edge: the
 * recommendation everything else in the DAK exists to implement. Modelled on
 * `smart-base` `input/fsh/models/HealthInterventions.fsh`, whose `reference` is
 * `1..* DublinCore` — hence {@link HealthInterventionBlock.references}, which
 * carries Dublin Core metadata rather than a bare string, and whose namespace
 * this repo's JSON-LD context already holds as `dcterms:`.
 *
 * WHO's authoring SOP says where the content comes from: the UHC menu of
 * essential interventions, and the WHO classification of digital health
 * interventions (an IRIS publication).
 */
export interface HealthInterventionBlock extends DakBlockBase {
  kind: "health-intervention";
  /**
   * Dublin Core references to the guideline this intervention comes from.
   *
   * `HealthInterventions.fsh` makes this `1..*` — an intervention with no
   * source recommendation is not one. Enforced by the Zod schema.
   */
  references: DublinCoreRef[];
}

/**
 * The Dublin Core elements WHO's `DublinCore.fsh` declares, as far as a DAK
 * reference uses them.
 *
 * WHO models all fifteen DCMI elements; this carries the subset an
 * intervention reference actually needs, because a type that admits every
 * element and requires none documents nothing. `title` is required for the
 * same reason `references` is: a reference nobody can name is not a reference.
 */
export interface DublinCoreRef {
  title: string;
  identifier?: string;
  /** Canonical URI — an IRIS handle, for WHO publications. */
  source?: string;
  date?: string;
  publisher?: string;
  language?: string;
}

/** L2 — a generic persona the guideline is written for. */
export interface PersonaBlock extends DakBlockBase { kind: "persona" }
/** L2 — a user scenario / narrative walkthrough. */
export interface UserScenarioBlock extends DakBlockBase { kind: "user-scenario" }
/** L2 — a business process, authored as BPMN 2.0 in the `.bpmn` companion. */
export interface BusinessProcessBlock extends DakBlockBase { kind: "business-process" }
/** L2 — one core data element of the data dictionary. */
export interface DataElementBlock extends DakBlockBase { kind: "data-element" }
/** L2 — decision-support logic, authored as DMN in the `.dmn` companion. */
export interface DecisionTableBlock extends DakBlockBase { kind: "decision-table" }
/** L2 — scheduling logic (periodic or event-driven timing rules). */
export interface SchedulingLogicBlock extends DakBlockBase { kind: "scheduling-logic" }
/** L2 — a programme indicator. */
export interface IndicatorBlock extends DakBlockBase { kind: "indicator" }
/** L2 — a functional requirement. */
export interface FunctionalRequirementBlock extends DakBlockBase { kind: "functional-requirement" }
/** L2 — a non-functional requirement. */
export interface NonFunctionalRequirementBlock extends DakBlockBase { kind: "non-functional-requirement" }

/** L3 — a DAK logical model. */
export interface LogicalModelBlock extends DakBlockBase { kind: "logical-model" }
/** L3 — a FHIR profile, authored as FSH in the `.fsh` companion. */
export interface ProfileBlock extends DakBlockBase { kind: "profile" }
/** L3 — a FHIR ValueSet. */
export interface ValueSetBlock extends DakBlockBase { kind: "value-set" }
/** L3 — a FHIR Questionnaire. */
export interface QuestionnaireBlock extends DakBlockBase { kind: "questionnaire" }
/** L3 — a CQL library, authored in the `.cql` companion. */
export interface CqlLibraryBlock extends DakBlockBase { kind: "cql-library" }
/** L3 — a FHIR StructureMap. */
export interface StructureMapBlock extends DakBlockBase { kind: "structure-map" }
/**
 * L2 — a narrative test scenario validating the DAK end to end.
 *
 * WHO DAK component 9, added after the original eight. Distinct from the L3
 * {@link TestCaseBlock}, which is a FHIR conformance artefact: this is the case
 * a reviewer signs off. `smart-base` `input/fsh/models/TestScenario.fsh` gives
 * it `feature 1..1 uri` — a link to a **Gherkin feature file** — so the
 * companion role is `.feature`, and it is required rather than optional.
 */
export interface TestScenarioBlock extends DakBlockBase { kind: "test-scenario" }

/** L3 — a FHIR PlanDefinition: the machine-readable form of a recommendation. */
export interface PlanDefinitionBlock extends DakBlockBase { kind: "plan-definition" }
/** L3 — a FHIR Measure, realising an L2 indicator. */
export interface MeasureBlock extends DakBlockBase { kind: "measure" }
/** L3 — a conformance test case. */
export interface TestCaseBlock extends DakBlockBase { kind: "test-case" }
/** L3 — a FHIR ActorDefinition. */
export interface ActorDefinitionBlock extends DakBlockBase { kind: "actor-definition" }

/** Every DAK block kind, as a discriminated union. */
export type DakBlock =
  | HealthInterventionBlock
  | PersonaBlock
  | UserScenarioBlock
  | BusinessProcessBlock
  | DataElementBlock
  | DecisionTableBlock
  | SchedulingLogicBlock
  | IndicatorBlock
  | FunctionalRequirementBlock
  | NonFunctionalRequirementBlock
  | TestScenarioBlock
  | LogicalModelBlock
  | ProfileBlock
  | ValueSetBlock
  | QuestionnaireBlock
  | CqlLibraryBlock
  | StructureMapBlock
  | PlanDefinitionBlock
  | MeasureBlock
  | TestCaseBlock
  | ActorDefinitionBlock;

/**
 * Compile-time proof that `DAK_BLOCK_KINDS` and `DakBlock["kind"]` cover each
 * other — the same guard `types.ts` puts on the paper union, for the same
 * reason: the drift it replaces produced no error anywhere.
 */
type _MutuallyExhaustive<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _dakKindsAreExhaustive: _MutuallyExhaustive<DakBlock["kind"], DakBlockKind> = true;
void _dakKindsAreExhaustive;

// ── Validation ───────────────────────────────────────────────────

/** Zod schema for one DAK kind, with its label prefix enforced. */
function dakSchema(kind: DakBlockKind) {
  const prefix = `${DAK_LABEL_PREFIXES[kind]}:`;
  return BlockBaseSchema.extend({
    kind: z.literal(kind),
    label: z.string().startsWith(prefix, {
      message: `Label for ${kind} must start with "${prefix}"`,
    }),
    layer: z.enum(["L2", "L3"]).optional(),
    realises: z.string().min(1).optional(),
  });
}

/**
 * A Dublin Core reference, per WHO's `DublinCore.fsh`.
 *
 * `title` is required because a reference nobody can name is not one; the rest
 * are optional exactly as WHO declares them.
 */
const DublinCoreRefSchema = z.object({
  title: z.string().min(1),
  identifier: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
  publisher: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
});

/**
 * Per-kind additions to the shared shape.
 *
 * Only `health-intervention` has one today: `HealthInterventions.fsh` makes
 * `reference` `1..*`, so a block with an empty `references` array is invalid at
 * construction rather than at review. Kept as a table so a second kind with
 * required fields does not require reworking `dakSchema`.
 */
const DAK_SCHEMA_EXTENSIONS: Partial<Record<DakBlockKind, z.ZodRawShape>> = {
  "health-intervention": {
    references: z.array(DublinCoreRefSchema).min(1, {
      message: "A health intervention needs at least one reference (WHO models it 1..*)",
    }),
  },
};

/** Schema per DAK kind, keyed by kind. */
export const DAK_BLOCK_SCHEMAS = Object.fromEntries(
  DAK_BLOCK_KINDS.map((k) => {
    const extra = DAK_SCHEMA_EXTENSIONS[k];
    return [k, extra ? dakSchema(k).extend(extra) : dakSchema(k)];
  }),
) as Record<DakBlockKind, ReturnType<typeof dakSchema>>;

// ── Builders ─────────────────────────────────────────────────────

/**
 * Construct and validate a DAK block.
 *
 * `layer` is filled in from the kind when the author does not state it, so the
 * L2/L3 split is never wrong-by-typo — it is derived from one table.
 */
function buildDak<K extends DakBlockKind, B extends DakBlock & { kind: K }>(
  kind: K,
  data: Omit<B, "kind" | "layer"> & { layer?: "L2" | "L3" },
): B {
  const block = { kind, layer: data.layer ?? layerForKind(kind), ...data } as B;
  DAK_BLOCK_SCHEMAS[kind].parse(block);
  return block;
}

type DakInput<B extends DakBlock> = Omit<B, "kind" | "layer"> & { layer?: "L2" | "L3" };

export const healthIntervention = (
  d: DakInput<HealthInterventionBlock>,
): HealthInterventionBlock => buildDak("health-intervention", d);
export const persona = (d: DakInput<PersonaBlock>): PersonaBlock =>
  buildDak("persona", d);
export const userScenario = (d: DakInput<UserScenarioBlock>): UserScenarioBlock =>
  buildDak("user-scenario", d);
export const businessProcess = (d: DakInput<BusinessProcessBlock>): BusinessProcessBlock =>
  buildDak("business-process", d);
export const dataElement = (d: DakInput<DataElementBlock>): DataElementBlock =>
  buildDak("data-element", d);
export const decisionTable = (d: DakInput<DecisionTableBlock>): DecisionTableBlock =>
  buildDak("decision-table", d);
export const schedulingLogic = (d: DakInput<SchedulingLogicBlock>): SchedulingLogicBlock =>
  buildDak("scheduling-logic", d);
export const indicator = (d: DakInput<IndicatorBlock>): IndicatorBlock =>
  buildDak("indicator", d);
export const functionalRequirement = (
  d: DakInput<FunctionalRequirementBlock>,
): FunctionalRequirementBlock => buildDak("functional-requirement", d);
export const nonFunctionalRequirement = (
  d: DakInput<NonFunctionalRequirementBlock>,
): NonFunctionalRequirementBlock => buildDak("non-functional-requirement", d);
export const testScenario = (d: DakInput<TestScenarioBlock>): TestScenarioBlock =>
  buildDak("test-scenario", d);

export const logicalModel = (d: DakInput<LogicalModelBlock>): LogicalModelBlock =>
  buildDak("logical-model", d);
export const profile = (d: DakInput<ProfileBlock>): ProfileBlock =>
  buildDak("profile", d);
export const valueSet = (d: DakInput<ValueSetBlock>): ValueSetBlock =>
  buildDak("value-set", d);
export const questionnaire = (d: DakInput<QuestionnaireBlock>): QuestionnaireBlock =>
  buildDak("questionnaire", d);
export const cqlLibrary = (d: DakInput<CqlLibraryBlock>): CqlLibraryBlock =>
  buildDak("cql-library", d);
export const structureMap = (d: DakInput<StructureMapBlock>): StructureMapBlock =>
  buildDak("structure-map", d);
export const planDefinition = (d: DakInput<PlanDefinitionBlock>): PlanDefinitionBlock =>
  buildDak("plan-definition", d);
export const measure = (d: DakInput<MeasureBlock>): MeasureBlock =>
  buildDak("measure", d);
export const testCase = (d: DakInput<TestCaseBlock>): TestCaseBlock =>
  buildDak("test-case", d);
export const actorDefinition = (d: DakInput<ActorDefinitionBlock>): ActorDefinitionBlock =>
  buildDak("actor-definition", d);

/**
 * Components represented only at L3, with no L2 kind to author them as.
 *
 * This is the coverage gap that matters, because L2 is what a DAK *is* — the
 * data-model-agnostic statement that the L3 FHIR artefacts then realise.
 *
 * Two components are in it today:
 *
 * - `health-interventions-and-recommendations` has no kind at either layer. It
 *   is the L1 end of every `realises` edge — the recommendation a DAK exists to
 *   digitise — so that edge currently points at a label this repo cannot
 *   represent, and nothing detects the dangle.
 * - `test-scenarios` has `test-case`, but that sits in the L3 set as a FHIR
 *   artefact. The L2 scenario — the narrative case a reviewer signs off — has
 *   no kind.
 *
 * Reported rather than quietly tolerated: a DAK renderer that lists eight
 * components and omits the ninth looks complete.
 */
export function dakComponentsWithoutL2(): DakComponent[] {
  return DAK_COMPONENTS.filter(
    (c) => !DAK_COMPONENT_KINDS[c].some((k) => layerForKind(k) === "L2"),
  );
}
