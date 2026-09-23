/**
 * Whether anybody has LOOKED at the session listing — not what it said.
 *
 * Bean `rq8s`, the owner's ruling 2026-09-23. `check:session-staleness` finds
 * sessions that have been waiting on a person, or that failed with output
 * nobody has read. It cannot fetch its own input: probed from inside a session
 * container, `api.anthropic.com/v1/sessions` is 401 and
 * `claude.ai/api/code/sessions` is 403, so `list_sessions` is an MCP tool an
 * AGENT holds and the session-start sweep asks for the listing by name.
 *
 * **That is a rule in prose, and a session that skips it leaves no trace.** The
 * next sweep cannot tell a skip from a clean run — which is `1xhc`'s *"a gate
 * that does not fire is indistinguishable from one that passed"* committed by
 * the fix for it. This record is the trace: one file, written when the check
 * actually runs, so the sweep can say **never checked**, **stale**, or **fresh**
 * instead of saying nothing three ways.
 *
 * ## What it is NOT evidence of, and this is the load-bearing part
 *
 * A mark answers *did anybody look*, and **never** *what is true now*. `rq8s`'s
 * own first write-up asserted a live-system reading as fact and **it was false
 * four hours later** — four sessions recorded as stopped had resumed on their
 * own. So {@link SessionListingMark.findings} is a snapshot of one past run and
 * is reported with its age attached, never as a current count. A consumer that
 * renders it as *"4 sessions are waiting"* has reproduced the defect this bean
 * exists for.
 *
 * `issue-marks` is the precedent and the shape is deliberately the same: *how
 * far an agent has read an issue* → *how recently an agent read the session
 * listing*. Both hold a timestamp and what was accounted for; neither holds the
 * content. A kind named for the sessions would promise a reader the sessions.
 *
 * @module schemas/session-listing-mark
 * @graphNode schema
 */
import { z } from "zod";

/** The `$schema` tag the mark carries. Files declare what they are. */
export const SESSION_LISTING_MARK_TAG = "folio-session-listing-mark/v1";

/**
 * How long a mark describes.
 *
 * **24 h, and the basis is what the mark ASSERTS.** It does not assert that the
 * listing is current — nothing here does, and the four-hour falsification above
 * is why. It asserts that somebody looked, and a day is the shortest window
 * over which *"nobody has looked"* is a finding rather than noise: the sweep
 * runs at session start, so any session in the last day refreshes it, and a
 * whole day with none is the quiet stretch `rq8s` is about.
 *
 * Shorter than `check:session-staleness`'s own 72 h `REQUIRES_ACTION`
 * threshold, and NOT a tighter version of it. That one calibrates how long a
 * person may legitimately take to answer (`BEAN_QUIET_HOURS`, bean `fgnw`);
 * this one calibrates how long a repository may go unlooked-at, which is a
 * different question with a different subject.
 */
export const MARK_FRESH_HOURS = 24;

export const SessionListingMarkSchema = z.object({
  $schema: z.literal(SESSION_LISTING_MARK_TAG),
  /** When the listing was read, as an ISO-8601 UTC instant. */
  checkedAt: z.string().min(1),
  /**
   * WHO looked — the session id, where the runner knows it.
   *
   * Optional because a mark from a runner that cannot name itself is still a
   * mark: refusing to record the look because the looker is anonymous would
   * trade the fact this file exists for a field nobody reads.
   */
  by: z.string().min(1).optional(),
  /** How many rows the listing carried. The denominator, so a small window is visible. */
  sessionsRead: z.number().int().nonnegative(),
  /**
   * How many findings that run produced. **A snapshot, never a current count.**
   * See the module note: a reading of a live system was false four hours later.
   */
  findings: z.number().int().nonnegative(),
});

export type SessionListingMark = z.infer<typeof SessionListingMarkSchema>;

/** How a reader should describe the mark. Three states, never two. */
export type MarkFreshness = "never-checked" | "stale" | "fresh";

/**
 * {@link MarkFreshness} for a mark, or its absence.
 *
 * `undefined` is `never-checked` and NOT `stale`: the two are different facts
 * and collapsing them is the `dh4f` shape — a consumer that scanned nothing
 * reporting on it as though it had.
 */
export function freshness(mark: SessionListingMark | undefined, now: Date): MarkFreshness {
  if (!mark) return "never-checked";
  const t = Date.parse(mark.checkedAt);
  if (Number.isNaN(t)) return "never-checked";
  return now.getTime() - t <= MARK_FRESH_HOURS * 3_600_000 ? "fresh" : "stale";
}

/** Parse a mark, or throw naming what is wrong. */
export function parseSessionListingMark(value: unknown): SessionListingMark {
  return SessionListingMarkSchema.parse(value);
}
