#!/usr/bin/env bun
/**
 * A PUBLISHED SURVEY of a commit window — so the next session reads it instead
 * of re-deriving it.
 *
 * Bean `6ptx`. Measured 2026-09-25 from the session API: **eight sessions
 * running in the same minute**, and seven of their own `task_summary` strings
 * described the same task — re-orienting against the commits that landed while
 * they were idle, over the same ~2435-commit window. Authored commits per day
 * on `main` across that week:
 *
 * ```
 * 2026-09-20  242
 * 2026-09-21  370
 * 2026-09-22  210
 * 2026-09-23  369
 * 2026-09-24  216
 * 2026-09-25    1     <-- eight sessions running
 * ```
 *
 * Throughput did not fall because the work ran out — 243 beans were open. It
 * fell because every session spent the day reading, and none could see that
 * the other seven were reading the same thing.
 *
 * ## Why none of the three existing mechanisms catches it
 *
 * - **`beans` cannot.** A survey is not a bean — nobody claims *"I am reading
 *   main"* — so claim-before-you-work has nothing to bite on. That rule is
 *   about work ON an item; this is the work BEFORE choosing one.
 * - **Branches cannot.** Nothing is pushed while surveying, so a sibling
 *   checking `for-each-ref` sees idle branches, not active readers.
 * - **`goal-review` does not.** Its axis 1 says to ask the session API, and
 *   doing so is what surfaced this — but it reads the answer to classify PAST
 *   activity, not to notice that siblings are mid-survey right now.
 *
 * ## The two edge commits are the whole design
 *
 * A published survey is only safe to reuse if **staleness is decidable**, and
 * the way to decide it is to record the window's own endpoints. A later
 * session computes `to..origin/main` — the delta it is NOT covered for — and
 * surveys only that, which is normally a handful of commits rather than
 * thousands.
 *
 * So {@link SessionSurveySchema} makes `from` and `to` REQUIRED, and requires
 * them to be full 40-character object names rather than refs. A ref is a
 * moving target: `origin/main` recorded as the upper edge names a different
 * commit tomorrow, and a survey whose window cannot be pinned is exactly the
 * stale-measurement-quoted-as-current shape (`fx5r`) with a wider blast radius,
 * because siblings would trust it INSTEAD of looking.
 *
 * **A survey that cannot be checked for staleness is worse than no survey.**
 * That is the one property this schema exists to guarantee.
 *
 * ## What it is not
 *
 * Not a claim on the window (the owner's option 2, not chosen) and not a
 * division of labour (option 3, which needs a live channel between sessions
 * that does not exist). It is an artefact: one session writes what it found,
 * and a later one decides for itself whether that still covers its question.
 *
 * @module cat-harness/schemas/session-survey
 * @graphNode schema
 */
import { z } from "zod";

/** The tag every published survey carries, so the file declares what it is. */
export const SESSION_SURVEY_TAG = "folio-session-survey/v1";

/** A full git object name — never a ref, for the reason in the module docblock. */
const ObjectName = z
  .string()
  .regex(/^[0-9a-f]{40}$/, "a full 40-character git object name, not a ref or an abbreviation");

/**
 * One axis the survey actually covered, and what it concluded.
 *
 * `covered: false` with a reason is a first-class answer: a survey that looked
 * at four of six axes is useful, and a reader must be able to tell which two
 * it cannot rely on. Recording only what was done would let a partial survey
 * read as a complete one, which is the `1xhc` shape — absence taken for a
 * clean result.
 */
export const SurveyAxisSchema = z
  .object({
    /** What was examined — `beans`, `ci`, `prs`, `issues`, `branches`, … */
    axis: z.string().min(1),
    /** False means NOT LOOKED AT; `finding` then says why, not what was found. */
    covered: z.boolean(),
    /** What it found, or — when `covered` is false — why it was skipped. */
    finding: z.string().min(1),
  })
  .strict();
export type SurveyAxis = z.infer<typeof SurveyAxisSchema>;

/** A survey of one commit window, published for other sessions to reuse. */
export const SessionSurveySchema = z
  .object({
    $schema: z.literal(SESSION_SURVEY_TAG),
    /**
     * The window's LOWER edge — the last commit the surveyor already knew.
     * Exclusive, matching `git rev-list from..to`.
     */
    from: ObjectName,
    /** The window's UPPER edge — the newest commit the survey actually read. Inclusive. */
    to: ObjectName,
    /** The branch the window is on, so a reader knows which history `from`/`to` live in. */
    branch: z.string().min(1),
    /** When it was taken, ISO-8601. Not the staleness test — `to` is — but it dates the prose. */
    takenAt: z.string().min(1),
    /** Who took it, so a reader can ask. A session URL or id. */
    by: z.string().min(1),
    /** How many commits the window held, as counted at publication. */
    commits: z.number().int().nonnegative(),
    /** Per-axis findings. Empty is refused: a survey that covered nothing is not a survey. */
    axes: z.array(SurveyAxisSchema).min(1),
  })
  .strict();
export type SessionSurvey = z.infer<typeof SessionSurveySchema>;
