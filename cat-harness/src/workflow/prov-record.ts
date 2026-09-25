/**
 * The engine's own PROV-O record: one `prov:Activity` written as each step is
 * recorded, under the verdict that let it be recorded.
 *
 * Issue #1180 step 5 built the AFTER-check (`scripts/prov-qaqc.ts`), which
 * derives activities from history and re-runs `authorizeTask` with the actor
 * `asserted`, because history carried only a name. Since the engine went
 * strict (issue #1207, owner 2026-09-24) the engine knows more than history
 * did: the principal GitHub vouched for, the lane's role, and every policy the
 * verdict was computed under. This writes that down at the moment it is true,
 * so the after-check reads a record rather than reconstructing one.
 *
 * Same rule as the after-check, and for the same reason: **no activity is
 * invented.** A step with no actor, or in a lane that binds no role, gets none,
 * because `ProvActivitySchema` requires both and a guessed value is
 * fabrication. A refused step gets none either: it did not happen.
 *
 * @module folio-assistant/workflow/prov-record
 */

import { basename } from "node:path";
import { ProvActivitySchema, type ProvActivity } from "../../schemas/prov.js";
import type { TaskAuthVerdict } from "./authorize.js";

/** `code-change-review.bpmn` → `code-change-review`: the `hadPlan` prefix, as the after-check writes it. */
export function planStem(source: string): string {
  return basename(source).replace(/\.bpmn$/i, "").toLowerCase();
}

export interface ProvRecordInput {
  /** `<instance id>#<history index>`: the same `@id` the after-check derives. */
  id: string;
  at: string;
  /** The `.bpmn` the instance runs, for the plan reference. */
  source: string;
  node: string;
  verdict: TaskAuthVerdict;
  /** Every policy uid in force, which is what `decide` evaluated. */
  policies: readonly string[];
  /** The content the step acted on. */
  target?: string;
}

/** The activity for an allowed step, or `undefined` when one would have to be invented. */
export function provActivityFor(input: ProvRecordInput): ProvActivity | undefined {
  const { verdict: v } = input;
  if (!v.allowed || !v.actor || !v.role || input.policies.length === 0) return undefined;
  const policies = [...input.policies].sort();
  const activity = {
    "@type": "prov:Activity" as const,
    "@id": input.id,
    "prov:startedAtTime": input.at,
    "prov:qualifiedAssociation": {
      "prov:agent": v.actor,
      "prov:hadRole": v.role,
      "prov:hadPlan": `${planStem(input.source)}#${input.node}`,
    },
    ...(input.target ? { "prov:used": [input.target] } : {}),
    "cat-harness:underPolicy": policies.length === 1 ? policies[0]! : policies,
  };
  // Validated here, so an invalid record is a thrown bug at the step that
  // produced it rather than a finding discovered later by the after-check.
  return ProvActivitySchema.parse(activity);
}
