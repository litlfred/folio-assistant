/**
 * A REQUIREMENT — what a harness, a folio or a feature must do, said so it
 * can be checked.
 *
 * @module bootstrap/schemas/requirement
 * @graphNode schema
 *
 * Owner, 2026-09-23 — the ask and its wording are on issue #1164, and are NOT
 * quoted here, because the owner's rule for this file is that a bootstrap
 * schema names **no outside concept**, not even in a quotation
 * (`check:bootstrap-concepts` holds it to that). Asked where it lives, the
 * owner chose **"1 + 2"**: a base here, which every harness gets, and the
 * existing `cat-harness` requirement built on it.
 *
 * ## Why this lives in bootstrap
 *
 * A requirement is the first thing anybody writes about a harness, before
 * there is a harness to write it in. The CRDM flow files a feature's
 * requirements when the feature SHIPS, and a harness that could only express
 * requirements once a derivative had loaded would be unable to state its own.
 *
 * ## The shape, and where it came from
 *
 * A requirement is a titled set of numbered STATEMENTS, each with a level and
 * a sentence. A statement is one of two kinds, and the kinds carry different
 * fields because they answer different questions:
 *
 * | kind | answers | fields |
 * |---|---|---|
 * | `functional` | what someone can DO | `activity`, `capability` ("I want"), `benefit` ("so that") |
 * | `non-functional` | how WELL it must do it | `category` — accessibility, performance, security… |
 *
 * That split, and the three functional fields, are well-worn requirements
 * practice; the words here are this schema's own and name no outside model.
 * A downstream harness that follows a particular standard maps ITS fields onto
 * these in its own layer — never the other way round, which is the direction
 * rule this repository keeps everywhere else: the base names nothing above it.
 *
 * ## The level is a word a reader already knows
 *
 * `SHALL`, `SHOULD`, `MAY`, `SHALL NOT`. A requirement whose strength has to
 * be inferred from its tone is two requirements depending on who reads it.
 *
 * ## Tests point HERE, not the other way
 *
 * A test run lists the statements it checks (`folio-test-run/v1`'s
 * `requirements`, by {@link requirementRef}). The requirement does not list
 * its tests: a test is added far more often than a requirement changes, and a
 * back-reference kept by hand is the first thing to go stale.
 */
import { z } from "zod";

/** How strongly a statement binds. */
export const RequirementLevelSchema = z.enum(["SHALL", "SHOULD", "MAY", "SHALL NOT"]);
export type RequirementLevel = z.infer<typeof RequirementLevelSchema>;

/** What a statement is about: something someone can do, or how well it is done. */
export const StatementKindSchema = z.enum(["functional", "non-functional"]);
export type StatementKind = z.infer<typeof StatementKindSchema>;

/**
 * Where a feature's requirement is in its life. A proposal is `proposed`; a
 * shipped feature's requirements are `in-force`; a requirement a later one
 * replaced is `superseded`, and says by what.
 */
export const RequirementStatusSchema = z.enum(["proposed", "in-force", "superseded", "retired"]);
export type RequirementStatus = z.infer<typeof RequirementStatusSchema>;

/** What meets a statement: a skill, a capability, a process, a tool — or another statement. */
export const SatisfiedBySchema = z.object({
  kind: z.string().min(1),
  ref: z.string().min(1),
});
export type SatisfiedBy = z.infer<typeof SatisfiedBySchema>;

/**
 * The statement's FIELDS, before the kind-consistency refinement — exported so
 * a harness can extend it (a narrower `satisfiedBy`, say) and re-apply
 * {@link refineStatement}. Zod cannot `.extend()` a refined schema.
 */
export const RequirementStatementFields = z.object({
    /** Unique within its requirement; with the requirement's id it is the statement's address. */
    key: z.string().min(1),
    label: z.string().min(1),
    /**
     * How strongly it binds. Named `conformance` — the word the harness's
     * requirement files have used since they were first written — so that
     * building them on this base moved no file.
     */
    conformance: RequirementLevelSchema,
    /** The statement itself, as one sentence a reviewer can say yes or no to. */
    requirement: z.string().min(1),
    kind: StatementKindSchema.optional(),
    /** FUNCTIONAL — the activity the statement is part of. */
    activity: z.string().min(1).optional(),
    /** FUNCTIONAL — what the actor wants to be able to do ("I want …"). */
    capability: z.string().min(1).optional(),
    /** FUNCTIONAL — why ("so that …"). */
    benefit: z.string().min(1).optional(),
    /** NON-FUNCTIONAL — which quality it constrains. */
    category: z.string().min(1).optional(),
    /** The roles it is about, by id in the harness's own role registry. */
    actors: z.array(z.string().min(1)).optional(),
    satisfiedBy: z.array(SatisfiedBySchema).optional(),
    /** Other statements this one presupposes, by {@link requirementRef}. */
    dependsOn: z.array(z.string().min(1)).optional(),
  });

/** A kind is a promise about the fields. Applied by every statement schema built on these fields. */
export function refineStatement(
  s: { kind?: StatementKind; activity?: string; capability?: string; benefit?: string; category?: string },
  ctx: z.RefinementCtx,
): void {
    // A KIND IS A PROMISE ABOUT THE FIELDS. A functional statement with a
    // `category`, or a non-functional one with a `capability`, is a statement
    // filed under the wrong question — refused rather than quietly carried.
    if (s.kind === "functional" && s.category !== undefined) {
      ctx.addIssue({ code: "custom", path: ["category"],
        message: "a functional statement says what someone can do; `category` belongs to a non-functional one" });
    }
    if (s.kind === "non-functional") {
      for (const f of ["activity", "capability", "benefit"] as const) {
        if (s[f] !== undefined) {
          ctx.addIssue({ code: "custom", path: [f],
            message: `a non-functional statement says how well; \`${f}\` belongs to a functional one` });
        }
      }
    }
}

export const RequirementStatementSchema = RequirementStatementFields.superRefine(refineStatement);
export type RequirementStatement = z.infer<typeof RequirementStatementSchema>;

/** The requirement's FIELDS, before its refinement — for a harness to extend. */
export const RequirementFields = z.object({
    /** `req:<slug>`. */
    id: z.string().regex(/^req:[a-z0-9][a-z0-9-]*$/, "a requirement id is `req:<lowercase-slug>`"),
    title: z.string().min(1),
    description: z.string().min(1),
    status: RequirementStatusSchema.optional(),
    /** Broader requirements this one specialises, by id. */
    derivedFrom: z.array(z.string().min(1)).optional(),
    actors: z.array(z.string().min(1)),
    statements: z.array(RequirementStatementSchema).min(1),
    tags: z.array(z.string().min(1)).optional(),
    /**
     * WHERE IT CAME FROM — the proposal it was filed from, as a path, when it
     * began as one. Kept after the proposal is moved, so the history can be
     * followed back through `git log --follow`.
     */
    proposedIn: z.string().min(1).optional(),
    /** When `superseded`: what replaced it. */
    supersededBy: z.string().min(1).optional(),
  });

/** Statement keys are unique, and a superseded requirement names its successor. */
export function refineRequirement(
  r: { statements: { key: string }[]; status?: RequirementStatus; supersededBy?: string },
  ctx: z.RefinementCtx,
): void {
    const seen = new Set<string>();
    r.statements.forEach((s, i) => {
      if (seen.has(s.key)) {
        ctx.addIssue({ code: "custom", path: ["statements", i, "key"],
          message: `statement key \`${s.key}\` appears twice; a key is its statement's address` });
      }
      seen.add(s.key);
    });
    if (r.status === "superseded" && !r.supersededBy) {
      ctx.addIssue({ code: "custom", path: ["supersededBy"],
        message: "a superseded requirement names what superseded it" });
    }
}

export const RequirementSchema = RequirementFields.superRefine(refineRequirement);
export type Requirement = z.infer<typeof RequirementSchema>;

/**
 * The address of a requirement or one of its statements: `req:<slug>` or
 * `req:<slug>#<key>`. What a test run lists in its `requirements`.
 */
export const RequirementRefSchema = z
  .string()
  .regex(/^req:[a-z0-9][a-z0-9-]*(#[A-Za-z0-9][A-Za-z0-9_.-]*)?$/,
    "a requirement reference is `req:<slug>` or `req:<slug>#<statement-key>`");
export type RequirementRef = z.infer<typeof RequirementRefSchema>;

export function requirementRef(id: string, key?: string): RequirementRef {
  return key ? `${id}#${key}` : id;
}
