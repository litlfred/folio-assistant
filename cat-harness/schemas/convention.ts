/**
 * A coding convention — context attached to a PROCESS, not loaded everywhere.
 *
 * ## The requirement, in the owner's words (2026-09-18, bean `3190`)
 *
 * > coding conventions should also be part of KG. its a specific type of
 * > context that should be set depending on the process/workflow (e.g. in
 * > software development under CRDM) but not all contexts should have it.
 *
 * ## Why this is not another skill, and not more `AGENTS.md`
 *
 * `AGENTS.md` says of itself that a rule living only there is a rule with no
 * home — not in the generated reference, not in the published skill docs, and
 * not found by an agent that went looking for the skill first. Conventions are
 * today exactly that: prose, loaded unconditionally whatever the agent is
 * doing.
 *
 * A SKILL is what you need in order to perform a task; a CONVENTION is how the
 * output must look while you are inside a particular process. An agent
 * implementing under CRDM has them; an agent adjudicating a translation does
 * not. That is the same scoping the subprocess stack already gives roles, and
 * conventions resolve the same way — the union along the call path.
 *
 * ## ABSENT BINDING MEANS NONE, and that is the load-bearing rule
 *
 * The bean states it and it is the whole design: *"Absent binding means no
 * conventions, not all of them: a convention that fires everywhere is the
 * unconditional prose this bean exists to replace."*
 *
 * A default of "all" would reproduce the problem with extra machinery — every
 * step would carry every rule and the scoping would be decoration. So the
 * resolver returns `[]` for an unbound step, and a test asserts exactly that
 * rather than asserting some count.
 *
 * @module schemas/convention
 * @graphNode schema
 */
import { z } from "zod";

import { kgNodeLabelShape, type KgNodeLabels } from "./kg-node";

/**
 * Where a convention was bound, so a reader can tell a process-wide rule from
 * one attached to a single activity.
 *
 * Reported rather than flattened away: "every step in this process" and "this
 * step only" are different claims, and an agent that cannot tell them apart
 * cannot say why a rule applies to it.
 */
export const CONVENTION_SCOPES = ["process", "lane", "activity"] as const;
export type ConventionScope = (typeof CONVENTION_SCOPES)[number];

export const ConventionSchema = z.object({
  /** Stable id, referenced by `<cat-harness.processes:convention ref="…"/>`. */
  id: z.string().min(1),
  /**
   * What the convention actually requires, in one line a reader can act on.
   *
   * Required, unlike a skill's body: a convention with no statement is a name
   * an agent cannot follow, and the point of moving these out of prose was to
   * make them readable where they apply.
   */
  statement: z.string().min(1),
  /**
   * WHY, so a reader can tell whether it still holds.
   *
   * Optional, because some conventions are arbitrary-but-agreed and saying so
   * honestly beats inventing a rationale.
   */
  rationale: z.string().min(1).optional(),
  /**
   * What this governs — `typescript`, `bpmn`, `commit-message`.
   *
   * Free text rather than an enum: the set is open, and a closed one would
   * have to be edited before a convention about a new surface could exist.
   */
  applies: z.array(z.string().min(1)).default([]),
  ...kgNodeLabelShape,
});

export type Convention = z.infer<typeof ConventionSchema> & KgNodeLabels;

/** The `.claude/skills/` group conventions live in, beside actors and roles. */
export const CONVENTION_GROUP = "conventions";

/** The BPMN extension element that binds one. Mirrors `folio:skill`. */
export const CONVENTION_EXT = "folio:convention";

/**
 * The conventions in force at a step — the union along the scope chain.
 *
 * Process, then lane, then activity, de-duplicated and in that order, so a
 * reader sees the broad rules before the narrow ones. The union is what makes
 * this match how roles already compose: an actor keeps the outer lane's role
 * and takes on the inner one's.
 *
 * **Returns `[]` when nothing binds**, which is the rule, not an edge case.
 */
export function conventionsInForce(b: {
  process?: readonly string[];
  lane?: readonly string[];
  activity?: readonly string[];
}): Array<{ ref: string; scope: ConventionScope }> {
  const seen = new Set<string>();
  const out: Array<{ ref: string; scope: ConventionScope }> = [];
  for (const [scope, refs] of [
    ["process", b.process],
    ["lane", b.lane],
    ["activity", b.activity],
  ] as const) {
    for (const ref of refs ?? []) {
      if (seen.has(ref)) continue;
      seen.add(ref);
      out.push({ ref, scope });
    }
  }
  return out;
}
