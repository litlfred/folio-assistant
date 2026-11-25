/**
 * `dak-task-annotations/v1` — the reviewable record of a DAK's BPMN task
 * annotations, one file beside each `.bpmn` (`<file>.tasks.json`).
 *
 * A DAK document follows every workflow figure with "<letter>. <PROCESS>
 * BUSINESS PROCESS NOTES AND ANNOTATIONS": a numbered item per step of the
 * figure, with `»` bullets describing it. Those items are the DAK's task table.
 * They reached the L1 library only as flattened prose, and no BPMN task carried
 * one (findings/bpmn-task-annotations-2026-11-18.md).
 *
 * This file is the hand-off between the extractor that reads them
 * (`../scripts/dak-task-annotations.ts`) and the knowledge graph that represents
 * them (`./extract-bpmn.ts` emits `dak-task describes bpmn-task`). A person can
 * read it, correct a match, and commit; the KG is rebuilt from it.
 *
 * Deliberately independent of FHIR and of BPMN extensions (owner, 2026-11-18:
 * "I want task annotation represented in KG. I am not keen on adding
 * extensions to bpmn"; "I don't want something so FHIR dependent"): references
 * are the DAK's own ids — persona labels as the lane names them, data element,
 * requirement and decision table ids as the DAK spreadsheets declare them — never
 * FHIR canonicals, and the BPMN file is read, never written.
 *
 * @graphNode schema
 */
import { z } from "zod";

export const DAK_TASK_ANNOTATIONS_SCHEMA = "dak-task-annotations/v1";

/** How an annotation item was joined to its BPMN task, strongest first. */
export const MATCH_METHODS = ["id", "step-number", "name", "adjudicated"] as const;
export type MatchMethod = (typeof MATCH_METHODS)[number];

/** Where in the L1 document an annotation came from. */
export const AnnotationSourceSchema = z
  .object({
    /** The L1 library document id (who-iris `library/<id>/`). */
    document: z.string().min(1),
    /** The page the item starts on, when the extraction recorded one. */
    page: z.number().int().positive().optional(),
    /** The item's number as printed: `1`, `2.3`. */
    item: z.string().regex(/^\d+(\.\d+)*$/),
  })
  .strict();

export const TaskAnnotationSchema = z
  .object({
    /** The BPMN task's `@id`: the join key into the diagram. */
    bpmnTask: z.string().min(1),
    /** The DAK activity id (`IMMZ.B1`, `TB.A5`): the join key into the spreadsheets. */
    activityId: z.string().min(1),
    /** The step's name as the annotation prints it. */
    name: z.string().min(1),
    /** The annotation's bullets, as Markdown, one `- ` line per `»`. */
    description: z.string(),
    /** Personas performing the task, as the BPMN lane names them. */
    personas: z.array(z.string().min(1)).default([]),
    /** Data element ids the data dictionary keys to this activity. */
    dataElements: z.array(z.string().min(1)).default([]),
    /** Functional requirement ids keyed to this activity. */
    requirements: z.array(z.string().min(1)).default([]),
    /** Decision table ids keyed to this activity, or named by the task's calledDecision. */
    decisionTables: z.array(z.string().min(1)).default([]),
    matchedBy: z.enum(MATCH_METHODS),
    source: AnnotationSourceSchema,
  })
  .strict();
export type TaskAnnotation = z.infer<typeof TaskAnnotationSchema>;

/** An annotation item no BPMN task was found for: for a person to adjudicate, never guessed. */
export const UnmatchedItemSchema = z
  .object({
    item: z.string().min(1),
    name: z.string(),
    reason: z.string().min(1),
  })
  .strict();

export const DakTaskAnnotationsSchema = z
  .object({
    $schema: z.literal(DAK_TASK_ANNOTATIONS_SCHEMA),
    /** The BPMN file these annotate, relative to this file (its basename). */
    bpmn: z.string().min(1),
    /** The DAK process id: `IMMZ.B`. */
    process: z.string().min(1),
    /** The L1 document and the heading of the annotations block. */
    document: z.string().min(1),
    heading: z.string().min(1),
    tasks: z.array(TaskAnnotationSchema),
    unmatched: z.array(UnmatchedItemSchema).default([]),
    /** BPMN task ids with no annotation item. */
    unannotated: z.array(z.string().min(1)).default([]),
  })
  .strict()
  .refine((s) => new Set(s.tasks.map((t) => t.bpmnTask)).size === s.tasks.length, {
    message: "each BPMN task is annotated at most once",
  });
export type DakTaskAnnotations = z.infer<typeof DakTaskAnnotationsSchema>;

/** The sidecar's path for a BPMN file: `IMMZ.B.bpmn` → `IMMZ.B.tasks.json`. */
export const sidecarPath = (bpmnPath: string): string => bpmnPath.replace(/\.bpmn$/i, "") + ".tasks.json";

/** The JSON Schema for editors and non-TypeScript validators. */
export function taskAnnotationsJsonSchema(): Record<string, unknown> {
  const body = z.toJSONSchema(DakTaskAnnotationsSchema, { io: "input", reused: "inline", target: "draft-2020-12" }) as Record<string, unknown>;
  return { $id: `https://litlfred.github.io/smart-base/schemas/${DAK_TASK_ANNOTATIONS_SCHEMA}`, title: "DAK BPMN task annotations", ...body };
}
