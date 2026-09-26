/**
 * A TEST RUN — what was measured, with what, and whether it can be redone.
 *
 * Bean `folio-assistant-zz0a`, issue #363: *"need repeatable
 * (hasvake/signable) test data and processes"*, read as hashable/signable.
 *
 * ## Why two hashes and not one
 *
 * A result is evidence only if a third party can establish **what was
 * tested** and **with what**. Those are different questions and a single
 * hash answers neither cleanly:
 *
 * - the **data** hash — this exact data set produced this result;
 * - the **process** hash — this exact runner, scenario bank and
 *   configuration produced this result.
 *
 * This repository has already paid for collapsing them, twice, and the two
 * cases are mirror images:
 *
 * - `folio-assistant-cv10`: a QA verdict keyed on the depended-on files, the
 *   checker's `script_hash` and `deps_hash` — but **not** on the criterion
 *   definition. Scoping a criterion left every cached verdict in place and
 *   the sweep reported `fresh-skip`. The subject was unchanged and the thing
 *   that JUDGED it had changed.
 * - `folio-assistant-nytj`: a sidecar that did not record its auditor's
 *   hash, so a PR editing the auditor and a PR adding a subject were each
 *   green alone and red merged.
 *
 * `nytj` names the family: **the state that breaks is the one neither party
 * evaluates.** Two hashes exist so that neither party can be the one not
 * evaluating.
 *
 * ## "Neither derivable from the other" is enforced, not asserted
 *
 * The bean's first criterion is that the two hashes are independent. That
 * reads like a property to promise in prose; it is a property of the INPUT
 * SETS, and it is decidable: the two bases must be **disjoint**. If a file
 * feeds both hashes then changing it moves both, and the pair carries no
 * more information than one hash would. {@link buildTestRun} refuses such a
 * run rather than recording a distinction that is not there.
 *
 * ## `unknown` is never equal to `unknown`
 *
 * Following `sourceHashOf` in `scripts/qa-results.ts`: an unreadable input
 * is reported as {@link UNKNOWN_HASH} rather than hashed as empty, because a
 * hash of nothing compares equal to every other hash of nothing.
 *
 * {@link hashesReproduce} therefore treats `unknown` as reproducing NOTHING,
 * including another `unknown`. Two runs that both failed to read their
 * inputs have not been shown to agree — they have both failed to answer, and
 * rendering that as "reproduced" is the third-state defect this repository
 * keeps re-finding (`ci-health`'s "could not check is never green", a QA
 * result's determined-empty, `publication.host`'s absent).
 *
 * ## Whole-file hashing over-invalidates, which is the safe direction
 *
 * `cv10`'s fix hashed only a criterion's RUN-AFFECTING fields, excluding
 * `description`, so that prose churn could not invalidate a corpus. That is
 * available for a DECLARATIVE criterion and not for a script: there is no
 * way to separate a runner's run-affecting parts from its comments without
 * parsing it, and a parser that got it wrong would under-invalidate.
 *
 * So a basis hashes whole files. Editing a comment in a runner moves the
 * process hash and the run reads as changed when nothing about it was. That
 * is a real cost and it is the one worth paying: **over-invalidation says
 * "changed" when it may not have, under-invalidation says "same" when it is
 * not** — and the second is `cv10` itself, a check reporting fresh and being
 * wrong. Prefer a separate configuration file over a constant in the runner
 * where the distinction matters.
 *
 * ## What this does NOT do
 *
 * **Signing.** The bean flags it as needing a key and an identity that
 * differ per deployment — a sovereign-cloud jurisdiction may require its
 * own. Since `folio-assistant-g7vb` landed, the topology axes exist to say
 * so, which makes signing answerable rather than guessable; it is its own
 * work and not a rider here.
 *
 * @module schemas/test-run
 * @graphNode schema
 */
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SkillNameSchema } from "./tool-types";

import { RequirementRefSchema } from "./requirement.ts";

/** The `$schema` tag every test run carries. */
export const TEST_RUN_SCHEMA_ID = "folio-test-run/v1";

/**
 * What a hash says when an input could not be read.
 *
 * A determined value and an absent one must not render identically, so this
 * is a distinct token rather than an empty-string hash.
 */
export const UNKNOWN_HASH = "unknown";

/**
 * A hash together with WHAT IT IS OVER.
 *
 * The inputs are carried, not just the digest. A bare hash cannot be
 * checked, cannot be re-derived by a third party, and cannot be shown
 * disjoint from another — which is the whole point of having two.
 */
export const HashBasisSchema = z.object({
  /** 12-char SHA-256 prefix over the inputs in listed order, or `unknown`. */
  hash: z.string().min(1),
  /** Repo-relative paths, sorted. Never empty: a hash over nothing is not a hash. */
  inputs: z.array(z.string().min(1)).min(1),
});
export type HashBasis = z.infer<typeof HashBasisSchema>;

/**
 * One case the run exercised: what went in and what came out, as the skill's
 * own contract names them.
 *
 * Recorded so the run can be checked AGAINST that contract (#1168, B4) — a
 * run whose cases do not fit the skill's input and output schemas measured
 * something other than the skill it claims to test.
 */
export const TestCaseSchema = z.object({
  input: z.unknown(),
  output: z.unknown(),
});
export type TestCase = z.infer<typeof TestCaseSchema>;

export const TestRunSchema = z.object({
  $schema: z.literal(TEST_RUN_SCHEMA_ID),
  /**
   * The skill this run tests, by name.
   *
   * The run points at the skill; the skill names no test (#1168, B4,
   * data-modelling step 8). Tests come and go and a skill's contract does
   * not, so the pointer lives on the run. `kg-audit` resolves it
   * (`test-run-skill-resolves`) and checks each case against the skill's
   * contract (`test-run-conforms`).
   *
   * @ref SkillDefinitionSchema
   */
  skill: SkillNameSchema,
  /** What this run measured, for a reader who has only the file. */
  subject: z.string().min(1),
  /** WHAT was tested. */
  data: HashBasisSchema,
  /** WHAT TESTED IT — runner, configuration, scenario bank. */
  process: HashBasisSchema,
  /** The measurements themselves, in whatever shape the runner records. */
  outcome: z.record(z.string(), z.unknown()),
  /**
   * The cases, when the runner records them. Absent is a real state: a run
   * that only records aggregates cannot be checked against the contract, and
   * `test-run-conforms` says so rather than passing it.
   */
  cases: z.array(TestCaseSchema).optional(),
  /**
   * WHICH REQUIREMENTS THIS RUN CHECKS — owner, 2026-09-23 (issue #1164):
   * *"put requirements in Test schema as array"*, as REFERENCES
   * (`req:<slug>` or `req:<slug>#<statement-key>`), never copies: the
   * requirement's text lives in one place, and a copy in every run is a copy
   * free to disagree with it.
   *
   * The test points at the requirement, not the reverse — the same direction
   * as `skill` above. See `bootstrap/schemas/requirement.schema.json` (Zod
   * source: `cat-harness/schemas/requirement.ts`). Optional so that a run
   * recorded before the field existed still parses; a new run should say what
   * it is evidence FOR.
   */
  requirements: z.array(RequirementRefSchema).optional(),
  /**
   * ISO-8601 UTC. Deliberately NOT part of either hash: when a run happened
   * is not what makes it reproducible, and including it would make every
   * run differ from every other by construction.
   */
  updated_at: z.string().min(1),
});
export type TestRun = z.infer<typeof TestRunSchema>;

/**
 * Hash a set of files, reporting `unknown` if any one cannot be read.
 *
 * All-or-nothing, deliberately. Hashing the readable subset would produce a
 * confident digest over a different input set than the one recorded in
 * `inputs`, which is worse than no answer: the file would claim a basis it
 * does not have.
 */
export function hashBasis(root: string, paths: string[]): HashBasis {
  const inputs = [...paths].sort();
  const h = createHash("sha256");
  for (const p of inputs) {
    let bytes: Buffer;
    try {
      bytes = readFileSync(join(root, p));
    } catch {
      return { hash: UNKNOWN_HASH, inputs };
    }
    // The path goes in as well as the contents: two files swapping names is
    // a different input set, and content-only hashing would call it the same.
    h.update(p).update("\0").update(bytes).update("\0");
  }
  return { hash: h.digest("hex").slice(0, 12), inputs };
}

/** The paths feeding both bases — empty when the two are independent. */
export function basisOverlap(a: HashBasis, b: HashBasis): string[] {
  const inB = new Set(b.inputs);
  return a.inputs.filter((p) => inB.has(p));
}

/** Thrown when a run's two hashes are not independent. */
export class TestRunBasisError extends Error {
  constructor(readonly overlap: string[]) {
    super(
      `a test run's data and process hashes must be independent, but ` +
        `${overlap.length} input${overlap.length === 1 ? "" : "s"} feed both: ` +
        `${overlap.join(", ")}. A file in both bases moves both hashes ` +
        `together, so the pair carries no more than one hash would. Move it ` +
        `to whichever question it actually answers — what was tested, or ` +
        `what tested it.`,
    );
    this.name = "TestRunBasisError";
  }
}

/**
 * Assemble a run. Pure apart from reading the files it hashes.
 *
 * Refuses a run whose bases overlap — see the module note. The refusal is at
 * construction rather than in a later check because a recorded run with
 * dependent hashes is indistinguishable, afterwards, from one with
 * independent ones.
 */
export function buildTestRun(args: {
  root: string;
  skill: string;
  subject: string;
  dataInputs: string[];
  processInputs: string[];
  outcome: Record<string, unknown>;
  cases?: TestCase[];
  now?: Date;
}): TestRun {
  const data = hashBasis(args.root, args.dataInputs);
  const process = hashBasis(args.root, args.processInputs);
  const overlap = basisOverlap(data, process);
  if (overlap.length) throw new TestRunBasisError(overlap);
  return {
    $schema: TEST_RUN_SCHEMA_ID,
    skill: args.skill,
    subject: args.subject,
    data,
    process,
    outcome: args.outcome,
    ...(args.cases === undefined ? {} : { cases: args.cases }),
    updated_at: (args.now ?? new Date()).toISOString(),
  };
}

/** Which half of a pair of runs reproduced, for a reader and for a test. */
export interface Reproduction {
  data: boolean;
  process: boolean;
  /** Both halves reproduced. Never true when either hash is `unknown`. */
  both: boolean;
}

/**
 * Whether `current` was produced from the same data and the same process.
 *
 * `unknown` reproduces nothing, INCLUDING another `unknown`: two runs that
 * both failed to read their inputs have not been shown to agree. See the
 * module note.
 */
export function hashesReproduce(prior: TestRun, current: TestRun): Reproduction {
  const same = (a: string, b: string) => a !== UNKNOWN_HASH && a === b;
  const data = same(prior.data.hash, current.data.hash);
  const process = same(prior.process.hash, current.process.hash);
  return { data, process, both: data && process };
}
