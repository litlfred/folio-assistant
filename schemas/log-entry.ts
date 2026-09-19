/**
 * The agent activity log — what an agent did, when, and in which process.
 *
 * Owner, 2026-09-19: *"an agent whenever it starts or ends a task or has a
 * log message, they should add an entry to a log entry in the trash […] by
 * default commit audit log to git data store is turned off."*
 *
 * Entries live under `fsh-guts/logs/`. That placement is the whole reason
 * they are safe to write freely: `fsh-guts` is stripped from every published
 * graph (`UNPUBLISHED_GRAPH_KINDS`, bean `folio-assistant-uv09`), so a log
 * cannot leak into the folio's linked data however verbose it gets.
 *
 * ## Persistence is OFF by default, and that is not the same as "no log"
 *
 * `fsh-guts/logs/` sits inside the repository, so writing there would be
 * committing unless something stops it. The default is **write locally,
 * ignored by git**: the agent can read back what it wrote this session, and
 * nothing reaches the data store until a workflow or the config asks for it.
 *
 * **The state must be reported, never assumed.** A logging system that
 * silently keeps nothing is worse than none, because the agent believes it
 * has an audit trail and acts accordingly. `LogCapture` is therefore a
 * three-valued answer rather than a boolean — see below.
 *
 * ## Why a schema at all
 *
 * The same contract every other store here uses: a directory says what to
 * EXPECT and the files declare what they ARE. Without `$schema` on the file,
 * a log entry would be told apart from a discarded proposal by its directory
 * alone, which is the "coincidence of the current layout, not a contract"
 * problem `#263` named and the bean and workflow stores already fixed.
 *
 * @module schemas/log-entry
 * @graphNode schema
 */

import { z } from "zod";

/** The `$schema` tag every log entry carries, per the declare-yourself rule. */
export const LOG_ENTRY_SCHEMA_ID = "folio-log/v1";

/** Where logs live inside the trashcan, relative to the instance root. */
export const LOG_DIR = "fsh-guts/logs";

/**
 * What happened.
 *
 * `task-start` and `task-end` are the two the owner named explicitly;
 * `message` is the free entry an agent writes mid-task. `error` is separate
 * from `message` because a reader filtering a long log wants failures without
 * reading prose, and a severity field would be a second spelling of the same
 * fact.
 */
export const LOG_EVENTS = ["task-start", "task-end", "message", "error"] as const;
export type LogEvent = (typeof LOG_EVENTS)[number];

/**
 * Whether this entry is destined for the git data store — and the third
 * state, which is the point.
 *
 * - `off` — the default. Written locally, ignored by git.
 * - `on` — explicitly enabled, for this workflow or by config.
 * - `unknown` — **the capture setting could not be determined.**
 *
 * `unknown` exists for the same reason `ci-health` never renders "could not
 * check" as green and `renderingMediaType` returns `undefined` rather than a
 * guess. An agent that cannot tell whether its audit trail is being kept must
 * say so; recording `off` in that case would be asserting a fact nobody
 * established, and recording `on` would promise an audit trail that may not
 * exist.
 */
export const LOG_CAPTURE = ["off", "on", "unknown"] as const;
export type LogCapture = (typeof LOG_CAPTURE)[number];

export const LogEntrySchema = z.object({
  $schema: z.literal(LOG_ENTRY_SCHEMA_ID),
  /** Stable id, so an entry can be emptied individually. */
  id: z.string().min(1),
  at: z.string().datetime(),
  event: z.enum(LOG_EVENTS),
  /** One line. The detail goes in `detail`, so a log stays skimmable. */
  summary: z.string().min(1),
  detail: z.string().optional(),

  // ── Who and where ──────────────────────────────────────────────
  /** The actor id from `.claude/skills/actors/`, where one is known. */
  actor: z.string().min(1).optional(),
  /**
   * The role the actor was acting AS — a BPMN swimlane, per the role model.
   *
   * Optional and meant to be: an agent writes log lines outside any process,
   * and inventing a lane for those would be the fake-reference failure
   * `activity-names-skill` exists to prevent.
   */
  role: z.string().min(1).optional(),
  /** BPMN process id, when the entry was written inside one. */
  process: z.string().min(1).optional(),
  /** The activity/step id within that process. */
  task: z.string().min(1).optional(),
  /** The bean this work is claimed against, where there is one. */
  bean: z.string().min(1).optional(),

  // ── Provenance ─────────────────────────────────────────────────
  /** Session identifier, so one run's entries can be emptied together. */
  session: z.string().min(1).optional(),
  /** Git ref the work was on. */
  branch: z.string().min(1).optional(),

  /** Whether this entry is kept in git. Never defaulted silently. */
  capture: z.enum(LOG_CAPTURE),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

/**
 * Read a capture setting from whatever the caller managed to resolve.
 *
 * **Absent is `unknown`, never `off`.** They are different claims: `off`
 * says somebody decided not to keep this, `unknown` says nobody could tell.
 * Collapsing them would make a misconfigured instance indistinguishable from
 * a deliberately quiet one, and the first is a bug while the second is a
 * choice.
 */
export function resolveCapture(declared: unknown): LogCapture {
  if (declared === true || declared === "on") return "on";
  if (declared === false || declared === "off") return "off";
  return "unknown";
}

/**
 * Is this entry allowed to persist to the git data store?
 *
 * Only an explicit `on`. `unknown` does NOT persist — when the setting cannot
 * be determined, the safe reading is the default, and the default is off.
 * Persisting on `unknown` would commit an audit trail nobody asked for, which
 * is the failure mode with the worse consequences of the two.
 */
export function shouldPersist(capture: LogCapture): boolean {
  return capture === "on";
}
