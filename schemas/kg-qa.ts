/**
 * Knowledge-graph QA sidecars — what is dangling in the process/role/skill graph.
 *
 * The content pipeline already audits two subject kinds with sidecars:
 * `<block>.qa.json` beside a content block (`schemas/block-qa.ts`) and
 * `<script>.script-qa.json` beside a computation (`schemas/script-qa.ts`).
 * This is the third subject kind — the **knowledge graph itself**: the BPMN
 * processes, the DMN decisions, the roles that own their lanes and the skills
 * their activities name.
 *
 * ## What goes wrong here, and why a report was not enough
 *
 * The joins in "an actor performs a task in a process as a role, using that
 * role's skills" were, until this module, checked at exactly one point:
 * `scripts/check-workflow-refs.ts` verified that a `<folio:skill ref>` names a
 * skill that exists. Everything else was unjoined, and the numbers say so —
 * measured 2026-09-18 across twenty diagrams: **60 distinct lane names**, bound
 * to nothing, for roughly two dozen actual positions; four `.dmn` files whose
 * decision ids nothing cross-checked from the BPMN side; and no direction of
 * check at all from a skill back to the role that is supposed to carry it.
 *
 * A sidecar rather than a console report, for the same reason the block sweep
 * writes one: the audit's **previous** answer has to be durable. Without it,
 * "this lane has been unbound since it was added" and "this lane broke in the
 * commit under review" look identical, and a reviewer cannot tell a new defect
 * from inherited debt. The sidecar is committed, so a diff shows exactly which
 * findings the change introduced.
 *
 * ## Three states, and `unknown` is never rendered as a pass
 *
 * A criterion returns `pass`, `fail`, `n/a` (it does not apply to this
 * subject) or `unknown` (it could not be evaluated — the file would not parse,
 * a dependency was absent). `unknown` is not `pass` and not `fail`: a diagram
 * the loader choked on has not been audited, and reporting it clean is how a
 * whole file silently leaves the gate. Same rule as `check-ci-health.ts` and
 * `pages-bootstrap.ts`.
 *
 * ## Severity decides the gate, not the finding count
 *
 * `critical` is a broken reference — something names a thing that does not
 * exist, and a consumer following it gets nothing. `major` is a missing join —
 * the graph is intact but a question cannot be answered, e.g. a lane bound to
 * no role, so "who performs this" has no answer. `minor` is coverage: a real
 * gap, but one with legitimate instances (a human signing something off is not
 * implemented by a markdown file), so failing on it would force a fake ref
 * onto a real step. `kg:audit --check` fails on `critical` only; `--strict`
 * adds `major`.
 *
 * @module schemas/kg-qa
 */

import { z } from "zod";

/** Marker value carried by every sidecar written by `scripts/kg-audit.ts`. */
export const KG_QA_SCHEMA = "kg-qa/v1";

/** Where sidecars go, relative to the audited artefact's own directory. */
export const KG_QA_DIRNAME = "kg-qa";

/** What kind of node a sidecar audits. */
export const KG_SUBJECT_KINDS = ["process", "decision", "role", "requirement", "graph"] as const;
export type KgSubjectKind = (typeof KG_SUBJECT_KINDS)[number];

/** Outcome of one criterion. `unknown` is never a pass. */
export const KG_RESULTS = ["pass", "fail", "n/a", "unknown"] as const;
export type KgResult = (typeof KG_RESULTS)[number];

export const KG_SEVERITIES = ["critical", "major", "minor"] as const;
export type KgSeverity = (typeof KG_SEVERITIES)[number];

/** A criterion in the registry below. */
export interface KgCriterionDefinition {
  id: string;
  /** Subject kinds it applies to. Anything else records `n/a`. */
  applies: KgSubjectKind[];
  severity: KgSeverity;
  /** One line, in the form of what a FAILURE means. */
  summary: string;
}

/**
 * The criteria, one per join in the actor→role→skill→task sentence.
 *
 * Ordered by where the join sits, not by severity: a reader walking a sidecar
 * should be walking the model.
 */
export const KG_CRITERIA: readonly KgCriterionDefinition[] = [
  {
    id: "skill-ref-resolves",
    applies: ["process"],
    severity: "critical",
    summary: "An activity names a skill that does not exist, so an agent handed the step cannot open it.",
  },
  {
    id: "decision-ref-resolves",
    applies: ["process"],
    severity: "critical",
    summary: "A gateway names a DMN file or decision id that does not exist, so the branch cannot be computed.",
  },
  {
    id: "role-ref-resolves",
    applies: ["process"],
    severity: "critical",
    summary: "A lane's explicit <folio:role ref> names a role that is not declared.",
  },
  {
    id: "activity-in-lane",
    applies: ["process"],
    severity: "major",
    summary: "An activity sits in no lane, so it has no role, so no actor can be said to perform it.",
  },
  {
    id: "lane-binds-role",
    applies: ["process"],
    severity: "major",
    summary: "A lane matches no declared role, so 'which skills does this task's performer have' has no answer.",
  },
  {
    id: "role-carries-activity-skill",
    applies: ["process"],
    severity: "major",
    summary:
      "An activity names a skill its lane's role does not carry — the task demands something the performer was never given.",
  },
  {
    id: "skill-servable",
    applies: ["process"],
    severity: "major",
    summary:
      "An activity names a skill that exists on disk but that `skill_fetch` cannot serve — its directory is " +
      "in no local package. `workflow_next` hands the agent a name, and fetching it returns \"package not found\".",
  },
  {
    id: "activity-names-skill",
    applies: ["process"],
    severity: "minor",
    summary:
      "An activity names no skill. Legitimate for a human judgement step; a gap everywhere else. " +
      "A call activity is exempt: it is implemented by the process it calls, which `call-activity-resolves` checks instead.",
  },
  {
    id: "call-activity-resolves",
    applies: ["process"],
    severity: "major",
    // `major`, and an unresolved target records `unknown` rather than `fail`,
    // because this audit **cannot tell a typo from a legitimate outward call.**
    // PR #282 states the rule from the interpreter's side: a call activity
    // naming a process no file declares stays opaque, since a folio may call
    // out to a process it does not host. Rendering that as a `critical` failure
    // would break the build of the first downstream instance that does so —
    // the same mistake `readme-links.ts` avoids by reporting an external host
    // as NOT CHECKED rather than as dead.
    summary:
      "A call activity's `calledElement` names a process this instance can load. It is the join that makes a call " +
      "activity's skill exemption safe — without it, a typo in `calledElement` would satisfy both criteria and " +
      "implement the step with nothing at all. A target this instance cannot load is `unknown`, not `fail`: it may " +
      "be hosted elsewhere, and an audit that cannot tell must not claim it can.",
  },
  {
    id: "role-skills-resolve",
    applies: ["role"],
    severity: "critical",
    summary: "A role carries a skill name that does not exist.",
  },
  {
    id: "role-inherits-resolves",
    applies: ["role"],
    severity: "critical",
    summary: "A role inherits a role that is not declared.",
  },
  {
    id: "role-binds-a-lane",
    applies: ["role"],
    severity: "minor",
    summary: "A declared role binds no lane in any diagram — a dangling role nothing can enter.",
  },
  {
    id: "role-has-actor",
    applies: ["role"],
    severity: "minor",
    summary: "No declared actor is eligible for this role. Advisory: the actor registry is not a permission system.",
  },
  {
    id: "requirement-satisfied-by-resolves",
    applies: ["requirement"],
    severity: "critical",
    summary:
      "A statement's `satisfiedBy` names a skill or capability that does not exist, so the thing claimed to " +
      "discharge the requirement cannot be opened.",
  },
  {
    id: "requirement-actors-resolve",
    applies: ["requirement"],
    severity: "critical",
    summary: "A requirement or statement binds an actor id the registry does not declare.",
  },
  {
    id: "requirement-derived-from-resolves",
    applies: ["requirement"],
    severity: "critical",
    summary:
      "A requirement derives from a parent requirement that does not exist, so the conformance lattice has a " +
      "hole where a reader expects the broader obligation.",
  },
  {
    id: "requirement-statements-graded",
    applies: ["requirement"],
    severity: "major",
    summary:
      "A statement carries no `conformance` grade. SHALL and SHOULD are the whole point of writing a " +
      "requirement rather than a note; an ungraded statement cannot be conformance-tested.",
  },
  {
    id: "decision-outcomes-used",
    applies: ["decision"],
    severity: "major",
    summary: "A decision table is referenced by no gateway, or returns an outcome no branch is named for.",
  },
  {
    id: "skill-reachable",
    applies: ["graph"],
    severity: "minor",
    summary:
      "A skill exists on disk but nothing reaches it — `skill_fetch` cannot serve it, no package manifest " +
      "lists it, no role carries it, no activity names it. Reachability is a union deliberately: most " +
      "skills are invoked directly by name and never appear in a diagram, so requiring a role or an " +
      "activity would report most of the corpus as orphaned, and a wall of false findings is how a check " +
      "gets switched off. The SERVING registry is the load-bearing member — a skill nothing can fetch is " +
      "unreachable however many manifests name it.",
  },
  {
    id: "manifest-skill-exists",
    applies: ["graph"],
    severity: "critical",
    summary:
      "A `package-manifest.json` entry names a skill the instance cannot resolve anywhere. Checked against " +
      "the INSTANCE, never against the package's own directory listing: three manifests here are bundle " +
      "definitions whose bodies live elsewhere, and measuring them against their own folder reported 19 " +
      "false dangling entries (bean `nup0`).",
  },
  {
    id: "actor-roles-resolve",
    applies: ["graph"],
    severity: "critical",
    summary:
      "An actor lists a role that is not declared — the reverse of role-has-actor, and the direction " +
      "nothing checked: a typo in an actor's `roles[]` is silently ignored rather than reported.",
  },
  {
    id: "actor-capabilities-resolve",
    applies: ["graph"],
    severity: "critical",
    summary:
      "An actor claims an environment capability the registry does not declare. `critical` since 2026-09: " +
      "it was `major` only while `capabilities[]` was overloaded, carrying permissions and skills that no " +
      "vocabulary could ever resolve. Bean `ind9` split the field, so every remaining entry is a genuine " +
      "probe and a dangling one is a real broken reference.",
  },
  {
    id: "actor-permissions-resolve",
    applies: ["graph"],
    severity: "critical",
    summary:
      "An actor claims a permission `skills/permissions/permissions.json` does not declare. A permission " +
      "cross-cuts roles and travels with the participant, so it cannot be checked against the role graph.",
  },
  {
    id: "actor-is-not-a-role",
    applies: ["graph"],
    severity: "minor",
    summary:
      "An entry in the actor registry carries `inherits` — it is modelling a role lattice, not an actor. Migration debt.",
  },
] as const;

export const KG_CRITERIA_BY_ID: Readonly<Record<string, KgCriterionDefinition>> = Object.fromEntries(
  KG_CRITERIA.map((c) => [c.id, c]),
);

/** One thing wrong, named specifically enough to fix without re-running. */
export interface KgFinding {
  /** The node inside the subject — a BPMN element id, a lane name, a skill. */
  where: string;
  /** What is wrong, in one sentence, naming both ends of the broken join. */
  detail: string;
}

export interface KgCriterionEntry {
  result: KgResult;
  /** Empty on `pass`; on `unknown` it carries why it could not be evaluated. */
  findings: KgFinding[];
}

/** The audited node. */
export interface KgSubject {
  kind: KgSubjectKind;
  /** Stable id — the BPMN process id, the role id, `kg` for the roll-up. */
  id: string;
  /** Repo-relative path, or `null` for the roll-up, which has no one file. */
  path: string | null;
}

/** What produced the sidecar — the same provenance block the block sweep keeps. */
export interface KgAuditor {
  script: string;
  script_hash: string;
  engine_version: string;
}

export interface KgQaReport {
  $schema: typeof KG_QA_SCHEMA;
  subject: KgSubject;
  /** sha256 of the audited file, or `null` for the roll-up. */
  source_hash: string | null;
  auditor: KgAuditor;
  /** Criterion id → entry. Criteria not applying to this kind are omitted. */
  criteria: Record<string, KgCriterionEntry>;
  totals: Record<KgResult, number>;
}

export const KgFindingSchema = z.object({
  where: z.string(),
  detail: z.string(),
});

export const KgCriterionEntrySchema = z.object({
  result: z.enum(KG_RESULTS),
  findings: z.array(KgFindingSchema).default([]),
});

export const KgQaReportSchema = z.object({
  $schema: z.literal(KG_QA_SCHEMA),
  subject: z.object({
    kind: z.enum(KG_SUBJECT_KINDS),
    id: z.string().min(1),
    path: z.string().nullable(),
  }),
  source_hash: z.string().nullable(),
  auditor: z.object({
    script: z.string(),
    script_hash: z.string(),
    engine_version: z.string(),
  }),
  criteria: z.record(z.string(), KgCriterionEntrySchema),
  totals: z.record(z.enum(KG_RESULTS), z.number()),
});

/** Criteria applying to a subject kind, in registry order. */
export function criteriaFor(kind: KgSubjectKind): KgCriterionDefinition[] {
  return KG_CRITERIA.filter((c) => c.applies.includes(kind));
}

/**
 * Count outcomes. Written as a function rather than inline at each call site so
 * that a totals block can never disagree with the criteria block above it.
 */
export function tally(criteria: Record<string, KgCriterionEntry>): Record<KgResult, number> {
  const t: Record<KgResult, number> = { pass: 0, fail: 0, "n/a": 0, unknown: 0 };
  for (const e of Object.values(criteria)) t[e.result] += 1;
  return t;
}

/**
 * The worst severity among a report's failures — what a gate reads.
 *
 * **`unknown` counts, at the criterion's own severity.** A criterion that could
 * not be evaluated is a hole in the audit, not an absence of a problem, so it
 * is never quietly dropped. But it is not *promoted* either: promoting every
 * unknown to `major` would make an unevaluable `minor` criterion gate the
 * build, and a gate that fires on things nobody agreed were blocking is a gate
 * that gets switched off. A diagram that will not load records `unknown`
 * against its `critical` criteria too, so it still fails — which is the case
 * the promotion was reaching for.
 */
export function worstSeverity(report: KgQaReport): KgSeverity | undefined {
  let worst: KgSeverity | undefined;
  const rank: Record<KgSeverity, number> = { minor: 1, major: 2, critical: 3 };
  for (const [id, entry] of Object.entries(report.criteria)) {
    if (entry.result !== "fail" && entry.result !== "unknown") continue;
    const def = KG_CRITERIA_BY_ID[id];
    if (!def) continue;
    if (!worst || rank[def.severity] > rank[worst]) worst = def.severity;
  }
  return worst;
}
