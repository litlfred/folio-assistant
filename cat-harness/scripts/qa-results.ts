#!/usr/bin/env bun
/**
 * A QA RESULT — what a QA process found about a whole produced artefact.
 *
 * ## The distinction this exists to hold
 *
 * The repository already has VERDICTS (`*.qa.json` beside a block,
 * `kg-qa/*.kg-qa.json` beside a process or role) and WITNESSES (those verdicts
 * flattened for the docs site). Both are **per authored subject**: one file
 * answers "is this block / this diagram sound".
 *
 * A result is the third thing. Its subject is a document the build just
 * PRODUCED, and its findings are whole-corpus — "these eleven property names
 * are undeclared across the graph", not "this node is wrong". Filing that as a
 * per-subject verdict would mean inventing a subject that does not exist.
 *
 * ## Why it lives in `test/results/`
 *
 * The owner's rule, 2026-09-19: *"if the witnesses were generated as a QA
 * reviewer primarily then it should be under `test/results/` as part of a QA
 * process."* Placement follows **provenance** — what produced it and why — not
 * the file family and not who fetches it afterwards. Everything a QA process
 * emits belongs under one declared root.
 *
 * The directory is declared in `cat-harness.json` as `qa-results`, on the day
 * it was created. That is deliberate: the 134 witnesses under
 * `docs/assets/qa/` spent their entire existence undeclared, so a consumer
 * scanning the declared directories saw none of them and reported a clean run
 * over the lot — the `dh4f` defect in reverse. The remedy is to declare a
 * directory when you make it.
 *
 * ## Self-declaring, like every other node here
 *
 * `$schema: "qa-results/v1"`, following the `qa-witness/v1`, `script-qa/v1`
 * and `folio-workflow-instance/v1` convention. `AGENTS.md`: a directory is a
 * PLACE TO LOOK and may hold more than one kind, so the file says what it is
 * rather than being told apart by its extension — "extension is a
 * coincidence; a declaration inside the file is the contract".
 *
 * @module scripts/qa-results
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";

/** Where every QA result is written. Mirrors the `qa-results` declaration. */
export const QA_RESULTS_DIR = join("test", "results");

/**
 * One finding family within a result.
 *
 * `count` is carried beside `entries` rather than derived on read, because a
 * consumer that only wants "is this clean" should not have to parse entries
 * whose shape differs per family.
 */
export interface QaResultFamily {
  /** What this family means, for a reader who has only the file. */
  summary: string;
  /** How many findings — `0` is a determined empty, not an absent answer. */
  count: number;
  /** The findings themselves, in whatever shape the producer records. */
  entries: unknown[];
}

/** A whole-artefact QA result. */
export interface QaResult {
  $schema: "qa-results/v1";
  /** What produced this, so a finding can be traced to the code that made it. */
  producer: {
    /** Repo-relative path to the script. */
    script: string;
    /** 12-char SHA-256 prefix of that script's source, as `script-qa` writes. */
    script_hash: string;
  };
  /** The artefact the findings are ABOUT — not an authored subject. */
  subject: { kind: string; id: string };
  /** ISO-8601 UTC. */
  updated_at: string;
  /** Finding families, keyed by name. */
  families: Record<string, QaResultFamily>;
  /** Total findings across every family, so "clean" is one read. */
  total: number;
}

/**
 * The 12-char SHA-256 prefix of a file's contents, or `"unknown"`.
 *
 * **Never a fabricated hash.** An unreadable producer is reported as unknown
 * rather than hashed as empty — the same rule the export follows for a source
 * commit it cannot determine, and for the staging stamp it does not fabricate.
 * A hash of nothing compares unequal to everything and would read as "the
 * script changed" on every run.
 */
export function sourceHashOf(absPath: string): string {
  try {
    return createHash("sha256").update(readFileSync(absPath)).digest("hex").slice(0, 12);
  } catch {
    return "unknown";
  }
}

/**
 * Assemble a result. Pure — takes the findings, returns the document.
 *
 * Separated from the write so a test can assert the document matches what the
 * producer computed without touching the filesystem, and so the SAME values
 * can be rendered twice without being computed twice.
 */
export function buildQaResult(args: {
  script: string;
  scriptAbsPath: string;
  subject: { kind: string; id: string };
  families: Record<string, { summary: string; entries: unknown[] }>;
  now?: Date;
}): QaResult {
  const families: Record<string, QaResultFamily> = {};
  let total = 0;
  // Sorted, so a rerun that finds the same things produces the same bytes and
  // the file does not churn in every diff.
  for (const name of Object.keys(args.families).sort()) {
    const f = args.families[name]!;
    families[name] = { summary: f.summary, count: f.entries.length, entries: f.entries };
    total += f.entries.length;
  }
  return {
    $schema: "qa-results/v1",
    producer: { script: args.script, script_hash: sourceHashOf(args.scriptAbsPath) },
    subject: args.subject,
    updated_at: (args.now ?? new Date()).toISOString(),
    families,
    total,
  };
}

/**
 * Everything about a result except WHEN it was produced.
 *
 * The comparison key for {@link writeQaResult}'s churn guard. `updated_at`
 * is the only field that changes when nothing changed, so it is the only one
 * held out.
 */
function withoutTimestamp(r: QaResult): string {
  const { updated_at: _when, ...rest } = r;
  return JSON.stringify(rest);
}

/**
 * Write a result under `test/results/`, creating the directory if needed.
 *
 * ## It does NOT rewrite a result whose findings are unchanged
 *
 * `updated_at` moves on every run, so an unconditional write made every QA
 * producer dirty the working tree whenever anybody ran it — a one-line diff
 * with identical findings. Measured 2026-09-19 across
 * `kg-export.qa-results.json` and `avatar-coverage.qa-results.json`: run the
 * check, get a modified file, commit nothing of substance.
 *
 * That is not a tidiness complaint. A sidecar that churns trains a reader to
 * skip it in a diff, and these files exist precisely so a REVIEWER can tell
 * "this finding is new" from "this finding was already there" — the argument
 * `check-workflow-refs` paid for. A file that always appears changed has
 * given up the property it was created to have.
 *
 * So the timestamp answers "when were these findings established", not "when
 * did somebody last run the script". It moves when the findings move.
 */
export function writeQaResult(root: string, stem: string, result: QaResult): string {
  const out = join(root, QA_RESULTS_DIR, `${stem}.qa-results.json`);
  mkdirSync(dirname(out), { recursive: true });

  if (existsSync(out)) {
    try {
      const prior = JSON.parse(readFileSync(out, "utf-8")) as QaResult;
      // Unchanged findings: keep the file exactly as it is, timestamp and
      // all. Rewriting with the OLD timestamp would be just as clean and
      // would lie about the bytes on disk having been reconsidered.
      if (withoutTimestamp(prior) === withoutTimestamp(result)) return out;
    } catch {
      // An unreadable previous result is not a reason to skip the write —
      // it is a reason to replace it.
    }
  }

  writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
  return out;
}

/**
 * The four states a committed QA result can be in against a freshly computed
 * one. Not three, and never two — bean `ymsu`, and this repository's standing
 * rule that could-not-determine is a state of its own.
 */
export type QaResultState = "current" | "stale" | "absent" | "unreadable";

/** Where a stem's result lives under a given root. One composition, two readers. */
export function qaResultPath(root: string, stem: string): string {
  return join(root, QA_RESULTS_DIR, `${stem}.qa-results.json`);
}

/**
 * Read a QA result a producer wrote, for comparison.
 *
 * `undefined` for absent or unparseable — which a caller must report as
 * could-not-determine rather than as agreement. A producer failing to write its
 * own sidecar is a finding about the producer, not a clean run.
 */
export function readQaResult(path: string): QaResult | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as QaResult;
  } catch {
    return undefined;
  }
}

/**
 * Compare a COMMITTED QA result against one a caller just computed elsewhere.
 *
 * ## Why this exists at all
 *
 * Bean `ymsu`: `check:version-bump` and `check:published-instance-exports` each
 * spawn `kg-export.ts` to answer a question, and the exporter wrote its QA
 * sidecar into the tree those gates were judging. Measured on `origin/main`
 * `e718627f198` with `producer.script_hash` hand-staled to `deadbeefdead`, both
 * gates exited **0** and the hash came back repaired — a checker comparing the
 * writer's output to the writer's output.
 *
 * Sending the exporter's sidecar to a temp directory (`--qa-root`) stops the
 * repair, and ON ITS OWN that would be a WEAKENING rather than a fix: the
 * staleness would simply stop being noticed, where before it at least surfaced
 * as the runner's mutation guard. `main` was carrying exactly that —
 * `kg-export.bootstrap.qa-results.json` at `b539167517cb` against a true
 * `0456470f68c8` — and only the guard saw it.
 *
 * So the repair is replaced by a COMPARISON, which is the bean's own
 * prescription: compute into a temp directory and **report** rather than repair.
 *
 * ## `updated_at` is held out, and nothing else is
 *
 * The same field {@link writeQaResult}'s churn guard holds out, for the same
 * reason: it moves on every run, so comparing it would report staleness forever
 * and the report would be ignored within a day. Every other field — including
 * `producer.script_hash`, the one actually wrong on `main` — is compared.
 *
 * ## The two non-verdicts are not agreement
 *
 * `absent` means nothing is committed yet, which is a first run rather than a
 * defect. `unreadable` means the question could not be asked: a sidecar that
 * will not parse is not one that disagrees, and calling it `stale` would send a
 * reader to regenerate a file whose problem is that it is corrupt. Neither may
 * be rendered as `current`; whether a caller FAILS on them is the caller's
 * call, and each says so where it decides.
 */
export function qaResultState(committedPath: string, fresh: QaResult): QaResultState {
  if (!existsSync(committedPath)) return "absent";
  const committed = readQaResult(committedPath);
  if (committed === undefined) return "unreadable";
  return withoutTimestamp(committed) === withoutTimestamp(fresh) ? "current" : "stale";
}
