#!/usr/bin/env bun
/**
 * The MERGE QUEUE — what the merge steward DECIDED about each open pull
 * request, and nothing GitHub already knows.
 *
 * Bean `hfag` (the merge-pipeline epic), owner's ruling 2026-10-02. Until then
 * the queue's order lived in prose — the `merge-manager` SOP's step 2, *"oldest
 * first, unless the owner names an order"* (PR #1802) — so nothing recorded
 * WHY one PR jumped ahead of another, and a second steward session could not
 * see the first one's decisions.
 *
 * ## The core rule: decisions are stored, facts are read live
 *
 * **A queue entry records a decision. It never records a fact GitHub owns.**
 *
 * | stored here (a decision) | read live, never stored (GitHub's fact) |
 * |---|---|
 * | priority class, rank or override position | CI status of the head |
 * | the reason, who decided, when | mergeability (`clean`, `dirty`, `unstable`) |
 * | a hold, with its expiry | labels (`ready-to-merge`, `needs-merge-human`) |
 * | the train it was assigned to | the head SHA |
 * | an ejection from a train, with its evidence link | the PR's own CI verdict, and whether CI saw the head |
 * | links to beans and epics | the changed-file list, and what it touches |
 *
 * A stored copy of a GitHub fact is a second answer to a question GitHub
 * already answers, and it goes stale the moment anybody pushes. The steward
 * computes the right-hand column at decision time (`scripts/merge-queue.ts`
 * `deriveFacts`), and the queue tile joins it in the reader's browser at view
 * time; neither writes it back.
 *
 * {@link MergeQueueEntrySchema} enforces it structurally: the object is
 * `strict`, and the keys a well-meaning writer would reach for first
 * ({@link FORBIDDEN_FACT_KEYS}) are refused by name with this rule as the
 * message, rather than as an anonymous "unrecognised key".
 *
 * **Where a fact MAY be written down:** as an evidence snapshot on a FINISHED
 * train run — a workflow instance of `Process_MergeTrain` under
 * `beans/workflows/` — dated, and only as the record of what the steward saw
 * when it acted ({@link TrainMemberEvidenceSchema}). A snapshot on a finished
 * run is history; the same value on a live queue entry would be a claim about
 * now.
 *
 * ## Where the fields come from
 *
 * Fields drawn from the merge-queue literature cite the requirements note on
 * branch `claude/merge-pipeline-library`
 * (`cat-harness/docs/proposals/merge-pipeline-requirements.md`, R-numbers and
 * T-numbers) and the paper section behind it:
 *
 * - `ejection` — technique **T1**, *eject a failing member and re-run the
 *   rest*; requirement **R3** (SQ19 §2.2, p. 3: a failed batch is split and
 *   retried without the faulty change, not rejected whole) and **R4** (SQ19
 *   §3.2, p. 4: a refused change returns to its author *with the reason*).
 *   `evidenceUrl` is that reason's evidence.
 * - {@link MemberFactsSchema}`.authoredPaths` / `.touchesShared` — technique
 *   **T3**, *predict which PRs conflict, cheap form*; requirements **R6**
 *   (SQ19 §5.2, pp. 7–8: decide independence from the build graph) and **R7**
 *   (generated paths are excluded, or every pair predicts as conflicting).
 *   COMPUTED live from the PR's file list, never stored.
 * - {@link MemberFactsSchema}`.ownCi` / `.headShaMatchesCi` — technique **T2**,
 *   *attribute a red train from each member's own CI before bisecting*. GitHub
 *   facts: read live, or snapshotted on a finished run only.
 *
 * SQ19 = Ananthanarayanan et al., *Keeping Master Green at Scale*, EuroSys '19.
 *
 * ## What it is not
 *
 * Not GitHub's merge queue — that is unavailable on a personal-account
 * repository (bean `1hjm`). Not the order itself: the order is COMPUTED, by
 * `processes/decisions/merge-priority.dmn` over live facts, and an entry
 * records the outcome the steward acted on, or an owner override with its
 * reason. Not the merge SOP (`merge-manager`, PR #1802) nor the gates
 * (`nok9`, PR #1887): those say how a merge is done and what it must prove;
 * this says which PR goes next and why.
 *
 * @module cat-harness/schemas/merge-queue
 * @graphNode schema
 */
import { z } from "zod";

/** The tag every queue entry carries, so the file declares what it is. */
export const MERGE_QUEUE_ENTRY_TAG = "folio-merge-queue-entry/v1";

/**
 * The priority classes the reprioritisation table can return, in the order a
 * train takes them. `override` is the owner's; `hand-back` is not a place in a
 * train at all but a route out of it (to `merge-refusal.bpmn`, PR #1888).
 *
 * The table (`merge-priority.dmn`) is the authority for which class a PR gets;
 * this list is the vocabulary it may answer in, and a test asserts the two
 * agree.
 */
export const PRIORITY_CLASSES = [
  "override",
  "harness-seed",
  "unblocker",
  "mvp",
  "standard",
  "hand-back",
] as const;
export const PriorityClassSchema = z.enum(PRIORITY_CLASSES);
export type PriorityClass = z.infer<typeof PriorityClassSchema>;

/**
 * Keys that name a GitHub-owned fact. Refused on a queue entry BY NAME, so the
 * writer is told the rule rather than that a key is unrecognised. None of
 * these values is trustworthy once stored; `mergeable_state` in particular can
 * serve a pre-merge view (bean `fx5r`), which is why it is read live.
 */
export const FORBIDDEN_FACT_KEYS = [
  "headSha",
  "head_sha",
  "sha",
  "ci",
  "ciStatus",
  "ci_status",
  "checks",
  "ownCi",
  "own_ci",
  "headShaMatchesCi",
  "head_sha_matches_ci",
  "mergeable",
  "mergeableState",
  "mergeable_state", // read live only: bean `fx5r` measured it serving a pre-merge view
  "labels",
  "draft",
  "authoredPaths",
  "authored_paths",
  "touchesShared",
  "touches_shared",
  "files",
] as const;

const NonBlank = z.string().refine((s) => s.trim().length > 0, "must not be blank");

/** An ISO-8601 timestamp with a zone, as everywhere else in the work plan. */
const Instant = z.iso.datetime({ offset: true });

/** A bean id as the store writes it, e.g. `folio-assistant-hfag`. */
export const BeanIdSchema = z
  .string()
  .regex(/^[a-z0-9-]+-[a-z0-9]{4}$/, "a bean id such as `folio-assistant-hfag`");

/**
 * Where the PR sits, and on whose authority.
 *
 * `computed` — the reprioritisation table decided: the rule that fired, the
 * class and rank it returned. The rule id is the reason a reader can check.
 *
 * `override` — the owner placed it by hand. **Refused without a `reason`**:
 * an override nobody can explain is indistinguishable from a mistake, and the
 * next steward could neither honour nor safely undo it. The same rule the
 * process engine applies to a hand-supplied gateway outcome, which it refuses
 * unless it comes in as the table's owner-override input.
 */
export const PlacementSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("computed"),
      /** The decision table that placed it, `file.dmn#Decision_Id`. */
      decision: NonBlank,
      /** The rule id that fired, e.g. `Rule_HarnessSmallClean`. */
      rule: NonBlank,
      class: PriorityClassSchema,
      /** Lower goes first. Ties break on PR number, oldest first. */
      rank: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("override"),
      /** 1-based position in the queue the owner asked for. */
      position: z.number().int().positive(),
      /** Why. Required, non-blank: the schema's one hard refusal. */
      reason: NonBlank,
    })
    .strict(),
]);
export type Placement = z.infer<typeof PlacementSchema>;

/**
 * A hold — the entry stays in the queue but is not taken into a train.
 *
 * The four fields of `bean-blocking`'s `## Blocked on`, and for its reason: a
 * hold with no expiry cannot be told from an abandoned one. `expires` must be
 * after `since`.
 */
export const HoldSchema = z
  .object({
    waitsOn: NonBlank,
    since: Instant,
    expires: Instant,
    handoff: NonBlank,
  })
  .strict()
  .refine((h) => Date.parse(h.expires) > Date.parse(h.since), {
    message: "a hold must expire after it starts",
    path: ["expires"],
  });
export type Hold = z.infer<typeof HoldSchema>;

/**
 * The PR was taken out of a train (T1; R3, R4 — see the module docblock).
 * A DECISION about the PR, so it is stored; the CI run it points at is the
 * evidence, and stays GitHub's.
 */
export const EjectionSchema = z
  .object({
    trainId: NonBlank,
    /** What the steward concluded, e.g. "own CI red on `docs:harness:check`". */
    reason: NonBlank,
    /** The run, comment or log that shows it. */
    evidenceUrl: z.url(),
    at: Instant,
  })
  .strict();
export type Ejection = z.infer<typeof EjectionSchema>;

const EntryObjectSchema = z
  .object({
    $schema: z.literal(MERGE_QUEUE_ENTRY_TAG),
    /** `owner/name` — a PR number means nothing without its repository. */
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "`owner/name`"),
    pr: z.number().int().positive(),
    placement: PlacementSchema,
    /** Why this placement, in a sentence. For `computed`, the rule's description will do. */
    reason: NonBlank,
    /** Who decided — a session URL, `owner`, or an actor id. */
    decidedBy: NonBlank,
    decidedAt: Instant,
    hold: HoldSchema.optional(),
    /** Assigned once the PR is taken into a train; the train-run instance's id. */
    trainId: NonBlank.optional(),
    ejection: EjectionSchema.optional(),
    /** Beans and epics this PR serves. Epics are beans, so one list. */
    beans: z.array(BeanIdSchema).default([]),
  })
  .strict();

/**
 * One queue entry, one file: `<merge-queue>/<owner>--<repo>--<pr>.json`.
 *
 * Refuses a GitHub fact by name first (the core rule), then parses strictly.
 */
export const MergeQueueEntrySchema = z
  .looseObject({})
  .superRefine((raw, ctx) => {
    for (const key of FORBIDDEN_FACT_KEYS) {
      if (key in raw) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message:
            `\`${key}\` is a fact GitHub owns. The merge queue stores DECISIONS only — ` +
            `read it live at decision or render time, or snapshot it on a finished ` +
            `train run (TrainMemberEvidenceSchema), never on a queue entry.`,
        });
      }
    }
  })
  .pipe(EntryObjectSchema);
export type MergeQueueEntry = z.infer<typeof EntryObjectSchema>;

/**
 * The live facts about one PR that the reprioritisation table reads.
 *
 * COMPUTED at decision time from GitHub and the checkout, NEVER stored on an
 * entry (see {@link FORBIDDEN_FACT_KEYS}). Declared here so the writer of the
 * facts (`merge:overlap`, branch `claude/merge-pipeline-tools`) and the reader
 * (the table, the tile) agree on one set of names.
 */
export const MemberFactsSchema = z
  .object({
    pr: z.number().int().positive(),
    /** Changed paths a declared merge pattern would REFUSE — the authored ones (T3, R7). */
    authoredPaths: z.array(z.string()),
    /** Touches a shared declaration: a schema, generator, `<instance>.json`, BPMN or DMN (T3, R6). */
    touchesShared: z.boolean(),
    /**
     * An authored path under `cat-harness/` or `cat-harness-tools/`. The raw
     * measurement behind input (a) — NOT input (a) itself: measured
     * 2026-10-02, it was true for 11 of the 11 PRs in that day's queue.
     */
    touchesHarness: z.boolean(),
    /**
     * Input (a): `touchesHarness` AND a linked bean descends from the
     * separation goal — the PR seeds the staging repos, which is the reason
     * the owner gave for (a). See `merge-priority.dmn`'s note.
     */
    seedsStaging: z.boolean(),
    /** Open PRs or beans this unblocks, or tangle edges it removes — input (b). */
    unblocks: z.number().int().nonnegative(),
    /** Tagged MVP / feature-priority, by epic or label — input (c). */
    mvp: z.boolean(),
    /** Changed files plus changed lines, banded — input (d). */
    sizeBand: z.enum(["small", "large"]),
    /**
     * Shares an AUTHORED path with another live queued PR — input (d), T3.
     *
     * Read {@link overlapKind} for which kind of collision it is. This field
     * said "or a shared declaration" until 2026-10-02 and the code never did:
     * `deriveFacts` compares `authoredPaths` only. A shared declaration is
     * carried separately by {@link touchesShared}, as its own DMN input, and
     * conflating them here would have made every pair that merely edits
     * `package.json` look like a pair needing a train.
     */
    conflictRisk: z.enum(["low", "high"]),
    /**
     * WHICH KIND of collision this PR has with the rest of the live queue.
     *
     * `conflictRisk` answers "is there one"; a steward building a train needs
     * "is it the kind a train is for". `merge:overlap` measured the gap on
     * 2026-10-02 across all 36 open PRs (459 pairs): **#1907 × #1909 have
     * `authored_overlap = 0` yet `independent: false`**, colliding only on
     * generated regions and shared declarations. A train built for that pair
     * is a train nobody needed, because regeneration resolves it.
     *
     * | value | means | what it needs |
     * |---|---|---|
     * | `none` | no path shared with any live member | nothing |
     * | `generated-only` | shares paths, every one resolved by a declared pattern | **regeneration**, not a train |
     * | `shared-declaration` | the only authored paths shared are shared DECLARATIONS | **coordination** — order them, do not train them |
     * | `authored` | shares an authored path that is not a declaration | **a train** |
     *
     * Four values, not three, and the reason is measured. A shared
     * declaration is a SUBSET of an authored path, not a sibling of one:
     * `classify("package.json").strategy` is `refuse`, so it is authored,
     * **and** `isSharedDeclaration("package.json")` is true (both measured
     * 2026-10-02). A three-value partition therefore files #1907 × #1909
     * under `authored` on the strength of `package.json` alone, which is
     * precisely the train nobody needed.
     *
     * By contrast `cat-harness/skills/sdlc/sdlc-core/merge-queue.md` is
     * `refuse` and NOT a shared declaration — a real content collision, and
     * the only one of the three that a train is the right answer to.
     *
     * The order is significant and the values are a partition: `authored`
     * wins over `shared-declaration`, which wins over `generated-only`,
     * because at each step the earlier kind is the one that cannot be
     * resolved by the later kind's remedy.
     */
    overlapKind: z.enum(["none", "generated-only", "shared-declaration", "authored"]),
    /** A declared merge pattern refuses a conflicted path, or GitHub reports it dirty. */
    refused: z.boolean(),
    /**
     * The PR's own CI on its head: T2's first evidence.
     *
     * **`green` means every workflow OWED FOR THE EVENT ran and succeeded** —
     * never "nothing is red". The three non-green states are kept apart
     * because collapsing any two of them is the defect, and they are exactly
     * the states `check-head-has-run.ts` distinguishes (bean `3pqn`):
     *
     * | value | means | `check:head-has-run` |
     * |---|---|---|
     * | `green` | every owed run present and successful | exit 0 |
     * | `red` | an owed run ran and failed | — |
     * | `missing-required` | it HAS runs, but not the ones owed | exit 1 |
     * | `none` | GitHub answered and nothing names this head | exit 1 |
     * | `unknown` | could not ask: no network, rate limit, HTTP error | exit 2 |
     *
     * `missing-required` is the value this enum existed without, and its
     * absence is why a steward could read a partial check set as a pass.
     * Measured 2026-10-02 on #1889's head `7ab6119405`: 9 check runs, all 9
     * gating job NAMES present, 3 of them `in_progress` with `conclusion:
     * null`, and 3 check SUITES `completed` with `conclusion:
     * action_required` and `latest_check_runs_count: 0` — suites that
     * completed having executed nothing. A filter for `conclusion ==
     * "failure"` finds zero. Counting runs does not catch it either; only
     * asking which runs are OWED does.
     *
     * **`unknown` is never a pass, and never a failure.** Telling somebody
     * their head is unverified when you merely could not look trains them to
     * ignore the signal, which costs more than the gap.
     */
    ownCi: z.enum(["green", "red", "missing-required", "none", "unknown"]),
    /** Did CI run on the head that would be merged (T2; bean `u7be` item 3). */
    headShaMatchesCi: z.boolean(),
  })
  .strict();
export type MemberFacts = z.infer<typeof MemberFactsSchema>;

/**
 * A DATED snapshot of the facts the steward acted on, for one member of a
 * FINISHED train run. Written into that run's workflow instance as evidence;
 * never onto a queue entry. `observedAt` is what makes it history rather than
 * a claim about now.
 */
export const TrainMemberEvidenceSchema = z
  .object({
    pr: z.number().int().positive(),
    headSha: z.string().regex(/^[0-9a-f]{40}$/, "a full 40-character object name"),
    ownCi: z.enum(["green", "red", "none"]),
    headShaMatchesCi: z.boolean(),
    observedAt: Instant,
    outcome: z.enum(["merged", "ejected", "handed-back", "held"]),
    evidenceUrl: z.url().optional(),
  })
  .strict();
export type TrainMemberEvidence = z.infer<typeof TrainMemberEvidenceSchema>;
