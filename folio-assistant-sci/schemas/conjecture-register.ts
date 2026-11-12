/**
 * `folio-conjecture-register/v1`: a register node per open problem in a
 * scientific paper folio, stored in a declared `conjectures` graph
 * (`holds: "state"`, bean `folio-assistant-ckej`).
 *
 * Each node records:
 * - `sourceBlock`: the `conjecture()` block label (`conj:...`) in the paper;
 * - `conjectureKind`: `"formal"` vs `"identification"` (a numerical or
 *   structural match awaiting proof);
 * - `status`: lifecycle status (`open` → `attempted` → `proved` | `disproved` |
 *   `superseded`), computed by the DMN table `conjecture-status-lifecycle.dmn`;
 * - `leanStub`: optional Lean declaration / file ref for the conjecture stub;
 * - `assumedBy`: critical-path declarations or block labels that assume this
 *   conjecture, computed from `lean-formal-graph` reverse edges;
 * - `attempts`: work-traceability attempt records (beans and commits).
 *
 * @module folio-assistant-sci/schemas/conjecture-register
 * @graphNode schema
 */

import { join } from "node:path";
import { z } from "zod";
import { LeanRefSchema, labelForKind } from "@litlfred/cat-harness-tools/schemas/constraints.ts";
import { nodeKind } from "@litlfred/cat-harness-tools/schemas/kg/node-kind.ts";
import {
  type DecisionTable,
  evaluate,
  loadDecisionTable,
} from "../../cat-harness-tools/src/workflow/decision-table.ts";
import {
  CONJECTURE_KINDS,
  type ConjectureClaimKind,
  ConjectureClaimKindSchema,
} from "./mathpaper-vocabulary.ts";

export { CONJECTURE_KINDS, type ConjectureClaimKind, ConjectureClaimKindSchema };

export const CONJECTURE_REGISTER_SCHEMA = "folio-conjecture-register/v1" as const;

export const CONJECTURE_STATUSES = [
  "open",
  "attempted",
  "proved",
  "disproved",
  "superseded",
] as const;
export type ConjectureStatus = (typeof CONJECTURE_STATUSES)[number];
export const ConjectureStatusSchema = z.enum(CONJECTURE_STATUSES);

export const CONJECTURE_ATTEMPT_OUTCOMES = [
  "in-progress",
  "partial",
  "blocked",
  "refuted",
  "proved",
  "abandoned",
] as const;
export type ConjectureAttemptOutcome = (typeof CONJECTURE_ATTEMPT_OUTCOMES)[number];
export const ConjectureAttemptOutcomeSchema = z.enum(CONJECTURE_ATTEMPT_OUTCOMES);

const RegisterIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "a lower-case register node id, e.g. conj-spectral-gap");

/** One work-traceability attempt against an open conjecture. */
export const ConjectureAttemptSchema = z
  .object({
    /** Work-plan bean identifier (e.g. `qou-1234` or `folio-assistant-ckej`). */
    beanId: z.string().min(1),
    /** Optional git commit SHA or ref where the attempt was recorded. */
    commit: z.string().min(1).optional(),
    /** Outcome of the attempt. */
    outcome: ConjectureAttemptOutcomeSchema.optional(),
    /** Short summary of what was tried and why it succeeded, stalled, or refuted the claim. */
    summary: z.string().min(1).optional(),
    /** ISO-8601 date or timestamp when the attempt was recorded. */
    recordedAt: z.string().min(1).optional(),
  })
  .strict();

export type ConjectureAttempt = z.infer<typeof ConjectureAttemptSchema>;

/** One register node per open problem in a paper folio (`conjectures/` graph). */
export const ConjectureRegisterNodeSchema = z
  .object({
    $schema: z.literal(CONJECTURE_REGISTER_SCHEMA),
    /** File-stem identifier (`<id>.json`). */
    id: RegisterIdSchema,
    /** Human-readable title of the open problem. */
    title: z.string().min(1),
    /** Source `conjecture()` block label (`conj:...`). */
    sourceBlock: labelForKind("conjecture"),
    /**
     * Distinguishes a formal mathematical conjecture (`"formal"`) from an
     * identification (`"identification"`, a numerical/structural match awaiting proof).
     */
    conjectureKind: ConjectureClaimKindSchema,
    /** Lifecycle status governed by `conjecture-status-lifecycle.dmn`. */
    status: ConjectureStatusSchema,
    /** Optional Lean stub for the conjecture statement (`class` or `axiom` or `theorem`). */
    leanStub: LeanRefSchema.optional(),
    /**
     * Critical-path theorem/provable declarations or block labels that assume
     * this conjecture (reverse edges of `lean-formal-graph`).
     */
    assumedBy: z.array(z.string().min(1)),
    /** Work-traceability attempts (beans and commits) against this conjecture. */
    attempts: z.array(ConjectureAttemptSchema),
    /** Optional block label, Lean declaration, or commit ref that resolved or superseded this conjecture. */
    resolvedBy: z.string().min(1).optional(),
    /** Optional notes on strategy or obstructions. */
    notes: z.string().min(1).optional(),
  })
  .strict();

export const ConjectureRegisterSchema = ConjectureRegisterNodeSchema;
export type ConjectureRegisterNode = z.infer<typeof ConjectureRegisterNodeSchema>;

/**
 * `folio-conjecture-register/v1` as a node kind (issue #2195), so
 * `validators/conjecture-register.json` names a kind and `node-kinds:check`
 * files the family under it.
 */
export const ConjectureRegisterKind = nodeKind(
  "folio-conjecture-register",
  [],
  ConjectureRegisterNodeSchema.shape,
  { strict: true },
);

// ── DMN status lifecycle ──────────────────────────────────────────

export const CONJECTURE_STATUS_DMN_PATH = join(import.meta.dir, "conjecture-status-lifecycle.dmn");
export const CONJECTURE_STATUS_DECISION_ID = "Decision_ConjectureStatus" as const;

export interface ConjectureStatusFacts {
  superseded: boolean;
  disproved: boolean;
  proved: boolean;
  attemptCount: number;
}

let cachedDecisionTable: Promise<DecisionTable> | undefined;

/** Load the DMN decision table governing conjecture status (`Decision_ConjectureStatus`). */
export function loadConjectureStatusTable(): Promise<DecisionTable> {
  cachedDecisionTable ??= loadDecisionTable(
    CONJECTURE_STATUS_DMN_PATH,
    CONJECTURE_STATUS_DECISION_ID,
  );
  return cachedDecisionTable;
}

/**
 * Evaluate the DMN decision table against observable facts about a conjecture,
 * returning the computed status and the DMN rule id that matched.
 */
export async function evaluateConjectureStatus(
  facts: ConjectureStatusFacts,
): Promise<{ status: ConjectureStatus; rule: string }> {
  const table = await loadConjectureStatusTable();
  const res = evaluate(table, {
    superseded: facts.superseded,
    disproved: facts.disproved,
    proved: facts.proved,
    attemptCount: facts.attemptCount,
  });
  return {
    status: ConjectureStatusSchema.parse(res.outcome),
    rule: res.rule,
  };
}

/**
 * Allowed status lifecycle transitions:
 * - `open` can advance to `attempted` or directly to a terminal state (`proved`, `disproved`, `superseded`);
 * - `attempted` can advance to `proved`, `disproved`, or `superseded`;
 * - `proved` and `disproved` can only transition to `superseded` (or stay as they are);
 * - `superseded` is terminal.
 */
export const ALLOWED_CONJECTURE_STATUS_TRANSITIONS: Readonly<
  Record<ConjectureStatus, readonly ConjectureStatus[]>
> = {
  open: ["open", "attempted", "proved", "disproved", "superseded"],
  attempted: ["attempted", "proved", "disproved", "superseded"],
  proved: ["proved", "superseded"],
  disproved: ["disproved", "superseded"],
  superseded: ["superseded"],
};

/** Whether transitioning a conjecture register node from `from` to `to` is valid. */
export function canTransitionConjectureStatus(
  from: ConjectureStatus,
  to: ConjectureStatus,
): boolean {
  return ALLOWED_CONJECTURE_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Apply a lifecycle transition (and optional attempt/resolution updates) to a
 * conjecture register node, enforcing {@link ALLOWED_CONJECTURE_STATUS_TRANSITIONS}
 * and validating the resulting node with {@link ConjectureRegisterNodeSchema}.
 */
export function transitionConjectureNode(
  node: ConjectureRegisterNode,
  update: {
    status?: ConjectureStatus;
    addAttempt?: ConjectureAttempt;
    assumedBy?: string[];
    resolvedBy?: string;
    notes?: string;
  },
): ConjectureRegisterNode {
  const attempts = update.addAttempt ? [...node.attempts, update.addAttempt] : node.attempts;
  const targetStatus: ConjectureStatus =
    update.status ??
    (node.status === "open" && attempts.length > 0 ? "attempted" : node.status);
  if (!canTransitionConjectureStatus(node.status, targetStatus)) {
    throw new Error(
      `Invalid conjecture status transition for "${node.id}": ${node.status} -> ${targetStatus}`,
    );
  }
  const next: ConjectureRegisterNode = {
    ...node,
    status: targetStatus,
    attempts,
    ...(update.assumedBy !== undefined ? { assumedBy: update.assumedBy } : {}),
    ...(update.resolvedBy !== undefined ? { resolvedBy: update.resolvedBy } : {}),
    ...(update.notes !== undefined ? { notes: update.notes } : {}),
  };
  return ConjectureRegisterNodeSchema.parse(next);
}

// ── Reverse-edge `assumedBy` computation over lean-formal-graph ───

/** A dependency record from `formal-edges` (`lean-formal-graph`). */
export interface FormalGraphEdgeRecord {
  decl: string;
  type_deps?: readonly string[];
  value_deps?: readonly string[];
  lean_path?: string;
}

/** Strip an optional `<pkg>:` prefix from a `lean.ref` or declaration name. */
export function normalizeLeanDecl(refOrDecl: string): string {
  const trimmed = refOrDecl.trim();
  const colon = trimmed.indexOf(":");
  return colon >= 0 ? trimmed.slice(colon + 1) : trimmed;
}

/**
 * Compute the reverse dependency closure (`assumedBy`) for a conjecture's Lean
 * stub from `lean-formal-graph` edge records (`type_deps` and `value_deps`).
 *
 * By default (`transitive: true`), returns every declaration (or mapped block
 * label when `declToBlockLabel` is supplied) that directly or transitively
 * depends on `conjectureDeclOrRef`, sorted deterministically. Pass
 * `transitive: false` for direct reverse edges only.
 */
export function computeAssumedBy(
  conjectureDeclOrRef: string,
  edges: readonly FormalGraphEdgeRecord[],
  opts: {
    transitive?: boolean;
    declToBlockLabel?: ReadonlyMap<string, string>;
  } = {},
): string[] {
  const rootDecl = normalizeLeanDecl(conjectureDeclOrRef);
  if (!rootDecl) return [];
  const transitive = opts.transitive ?? true;

  // Build reverse adjacency map: dependency -> declarations that depend on it.
  const reverseDeps = new Map<string, Set<string>>();
  for (const row of edges) {
    const caller = normalizeLeanDecl(row.decl);
    if (!caller) continue;
    for (const rawDep of [...(row.type_deps ?? []), ...(row.value_deps ?? [])]) {
      const dep = normalizeLeanDecl(rawDep);
      if (!dep || dep === caller) continue;
      let set = reverseDeps.get(dep);
      if (!set) {
        set = new Set<string>();
        reverseDeps.set(dep, set);
      }
      set.add(caller);
    }
  }

  const visited = new Set<string>();
  const queue: string[] = [...(reverseDeps.get(rootDecl) ?? [])];
  for (const d of queue) visited.add(d);

  if (transitive) {
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const next of reverseDeps.get(current) ?? []) {
        if (next !== rootDecl && !visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
  }

  const mapLabel = (decl: string): string => opts.declToBlockLabel?.get(decl) ?? decl;
  return [...new Set([...visited].map(mapLabel))].sort((a, b) => a.localeCompare(b));
}
