/**
 * W3C PROV-O: the record of a task being performed. Issue #1180.
 *
 * Owner, 2026-09-23: *"W3C ODRL 2.2 and W3C PROV-O for logging"*. The
 * deterministic BPMN engine checks a policy BEFORE a task and refuses; the
 * agentic swarm acts, and a QA/QC report checks the policy AFTER, from this
 * log (`docs/agentic-harness.html#bpmn-execution`). Both need the same
 * record, so it is PROV-O's, not ours.
 *
 * One `prov:Activity` per task run:
 *
 * | PROV-O | means here |
 * |---|---|
 * | `prov:qualifiedAssociation.prov:agent` | the Actor that performed it |
 * | `prov:qualifiedAssociation.prov:hadRole` | the Role it acted in (the lane's) |
 * | `prov:qualifiedAssociation.prov:hadPlan` | the BPMN task: `<process>#<task id>` |
 * | `prov:actedOnBehalfOf` | the person an agent worked for |
 * | `prov:used` / `prov:generated` | the graph nodes read and written |
 * | `cat-harness:underPolicy` | the ODRL policy it acted under: the one non-PROV term |
 *
 * `hadPlan` is PROV-O's own term for "the plan an agent followed". A BPMN task
 * is exactly that, so no new term is minted for it.
 *
 * @module schemas/prov
 * @graphNode schema
 */
import { z } from "zod";

export const PROV_CONTEXT = "http://www.w3.org/ns/prov-o" as const;

/** `<process>#<task>`: a BPMN process id and one of its task ids. */
export const PLAN_REF = /^[a-z0-9][a-z0-9-]*#[A-Za-z_][A-Za-z0-9_.-]*$/;

const Iso = z.string().datetime({ offset: true });

export const ProvAssociationSchema = z
  .object({
    "prov:agent": z.string().min(1),
    "prov:hadRole": z.string().min(1),
    "prov:hadPlan": z.string().regex(PLAN_REF, "hadPlan is <process>#<task>"),
  })
  .strict();

export const ProvActivitySchema = z
  .object({
    "@type": z.literal("prov:Activity"),
    "@id": z.string().min(1),
    "prov:startedAtTime": Iso,
    "prov:endedAtTime": Iso.optional(),
    "prov:qualifiedAssociation": ProvAssociationSchema,
    "prov:actedOnBehalfOf": z.string().min(1).optional(),
    "prov:used": z.array(z.string().min(1)).optional(),
    "prov:generated": z.array(z.string().min(1)).optional(),
    /** The ODRL policy uid the run was under. Required: a run under no policy cannot be checked. */
    "cat-harness:underPolicy": z.string().min(1),
  })
  .strict()
  .refine((a) => !a["prov:endedAtTime"] || a["prov:endedAtTime"] >= a["prov:startedAtTime"], {
    message: "endedAtTime is before startedAtTime",
    path: ["prov:endedAtTime"],
  });

export type ProvActivity = z.infer<typeof ProvActivitySchema>;
