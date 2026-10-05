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
import { dirname, join, resolve, sep } from "node:path";

import { parseQaRef, QaUsageError, readQa, readQaManifest, resolveQaLocation, type QaStoreOptions } from "./qa-store.js";

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
  // No `updated_at`, on purpose (bean `y7b3`, #1707). A committed file that
  // records WHEN it was produced conflicts on every pair of concurrent changes:
  // both branches change findings, each writes a new stamp, and that one line
  // collides while the body merges cleanly. Measured over 300 merges:
  // `skill-register.qa-results.json` conflicted in 89, and 80 of its 86
  // conflicting lines were this field. `git log` already records when a file
  // changed, and no reader consumed it — every comparison held it out.
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
    families,
    total,
  };
}

/**
 * The comparison key for {@link writeQaResult}'s churn guard and
 * {@link qaResultState}: the whole document, exactly.
 *
 * It used to hold `updated_at` out. With the field gone (`y7b3`) nothing is
 * held out, and an old file that still carries a stamp now compares STALE —
 * which is what regenerates it away, rather than leaving it to linger as
 * "current" forever.
 */
function key(r: QaResult): string {
  return JSON.stringify(r);
}

/**
 * Write a result under `test/results/`, creating the directory if needed.
 *
 * ## It does NOT rewrite a result whose findings are unchanged
 *
 * An unconditional write once made every QA producer dirty the working tree
 * whenever anybody ran it — a one-line diff (then a timestamp) with identical
 * findings. Measured 2026-09-19 across
 * `kg-export.qa-results.json` and `avatar-coverage.qa-results.json`: run the
 * check, get a modified file, commit nothing of substance.
 *
 * That is not a tidiness complaint. A sidecar that churns trains a reader to
 * skip it in a diff, and these files exist precisely so a REVIEWER can tell
 * "this finding is new" from "this finding was already there" — the argument
 * `check-workflow-refs` paid for. A file that always appears changed has
 * given up the property it was created to have.
 *
 * The document carries no timestamp (`y7b3`), so an unchanged result is
 * byte-identical and this guard only avoids a pointless write.
 *
 * ## It writes the WORKING COPY, and that survives the move (bean `id4s`)
 *
 * After the `qa-reports` branch (arc `3fva`, owner rulings D1/D4) a writer
 * still writes `<instance>/test/results/` — proposal §2.4: "a writer still
 * writes to `<instance>/test/results/`, as the working copy" — and
 * `qa:publish` ({@link publishQa}) pushes the whole tree to the branch once per
 * CI run. So the prior-key skip reads the working copy, not the branch, on
 * purpose: reading the branch here would put a network fetch in front of
 * every one of this function's ~22 callers to save a local write, and the
 * branch already dedupes identical bytes as one blob. Absent, the skip has
 * nothing to compare and the file is written — correct in both states.
 */
export function writeQaResult(root: string, stem: string, result: QaResult): string {
  const out = qaResultPath(root, stem);
  mkdirSync(dirname(out), { recursive: true });

  if (existsSync(out)) {
    try {
      const prior = JSON.parse(readFileSync(out, "utf-8")) as QaResult;
      // Unchanged findings: leave the file alone.
      if (key(prior) === key(result)) return out;
    } catch {
      // An unreadable previous result is not a reason to skip the write —
      // it is a reason to replace it.
    }
  }

  writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
  return out;
}

/**
 * The states a committed QA result can be in against a freshly computed one.
 * Not three, and never two — bean `ymsu`, and this repository's standing rule
 * that could-not-determine is a state of its own.
 *
 * `unknown` is the fifth (bean `id4s`): the baseline was asked of the
 * `qa-reports` branch (`--against`) and the branch could not answer — the
 * remote or git failed — or it was never asked, because the directory is
 * stored there and no ref was given. **Never `current`.**
 */
export type QaResultState = "current" | "stale" | "absent" | "unreadable" | "unknown";

/**
 * Where a stem's result lives under a given root. THE one composition of
 * `<root>/test/results/<stem>.qa-results.json` — bean `id4s`'s done-when is
 * that no caller spells `QA_RESULTS_DIR` itself, so the day the working copy
 * moves there is one line to change and a grep that proves it.
 */
export function qaResultPath(root: string, stem: string): string {
  return qaResultsFile(root, `${stem}.qa-results.json`);
}

/**
 * Any file under an instance's QA results directory, by its path inside it —
 * for the QA records that are not `qa-results/v1` (`viewer-nav/viewer-nav.qa.json`).
 * The same one composition as {@link qaResultPath}.
 */
export function qaResultsFile(root: string, rel: string): string {
  return join(root, QA_RESULTS_DIR, rel);
}

/**
 * The graph kinds the `qa-reports` arc moves off `main` — proposal
 * `qa-reports-branch-and-test-process` §2.1: every DERIVED `qa` verdict, and
 * the `health` report. Attestations stay (D2) but live in their own
 * directory, so they are not a reason to expect a `qa` directory here.
 */
export const OFF_MAIN_KINDS: readonly string[] = ["qa", "health"];

/**
 * May a declared directory be absent from a checkout without that being a
 * finding? Yes when it declares `storage` (bean `16ei`), or when every kind it
 * holds is one the arc moves off `main` — the state after owner rulings D1/D4
 * and before the declarations say so (bean `5hox`). Bean `0dav`: measured with
 * the results moved aside, `readme:subgraphs` counted all 15 such directories
 * as `absent-directory` findings.
 */
export function mayLeaveMain(dir: { graphKinds?: readonly string[]; storage?: unknown }): boolean {
  if (dir.storage) return true;
  const kinds = dir.graphKinds ?? [];
  return kinds.length > 0 && kinds.every((k) => OFF_MAIN_KINDS.includes(k));
}

// ─────────────────────────────────────────────────────────────────────────────
// BASELINES — the committed copy, or the `qa-reports` branch (bean `id4s`)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The flag that names a baseline on the `qa-reports` branch — proposal
 * `qa-reports-branch-and-test-process` §2.3: "optional `--against <ref>` diffs
 * the fresh run with `qa-reports:main/<merge-base>`, reporting **new** findings
 * separately from inherited ones". The value is any qa-store read ref:
 * `main`, `<sha>`, `main/<sha>`, `pr/<n>`, `pr/<n>/<sha>`.
 */
export const AGAINST_FLAG = "--against";

/**
 * The `--against` ref this run was given, or `undefined`.
 *
 * Validated here rather than at the first read: a malformed ref is a USAGE
 * error (`QaUsageError`, exit 2), and folding it into `miss` would make a typo
 * read as "the branch has no baseline", which a gate does not fail on.
 */
export function againstRef(argv: readonly string[] = process.argv): string | undefined {
  const i = argv.indexOf(AGAINST_FLAG);
  const inline = argv.find((a) => a.startsWith(`${AGAINST_FLAG}=`));
  if (i < 0 && inline === undefined) return undefined;
  const ref = inline !== undefined ? inline.slice(AGAINST_FLAG.length + 1) : argv[i + 1];
  if (ref === undefined || ref === "" || ref.startsWith("--")) {
    throw new QaUsageError(`${AGAINST_FLAG} needs a ref: main | <sha> | main/<sha> | pr/<n> | pr/<n>/<sha>`);
  }
  parseQaRef(ref);
  return ref;
}

/** `argv` without `--against <ref>`, for producers that check their own flags. */
export function withoutAgainst(argv: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === AGAINST_FLAG) {
      i++;
      continue;
    }
    if (argv[i]!.startsWith(`${AGAINST_FLAG}=`)) continue;
    out.push(argv[i]!);
  }
  return out;
}

/** Where a baseline was looked for, and the four qa-store states it can end in. */
export type BaselineRead =
  | { state: "hit"; text: string; from: string }
  | { state: "miss" | "corrupt" | "unknown"; reason: string; from: string };

/**
 * Is `absPath` inside a `qa` directory that declares `storage` (bean `16ei`)?
 * Such a directory's working copy is a measurement of the contributor's last
 * `qa:fetch`, not a record, so it is never read as a baseline.
 */
function storedOn(absPath: string, repoRoot?: string): string | undefined {
  try {
    const loc = resolveQaLocation(repoRoot);
    const abs = resolve(absPath);
    const s = loc.directories.find((x) => x.storage && (abs === x.absPath || abs.startsWith(x.absPath + sep)))?.storage;
    // A qa directory is keyed by commit, so its storage is a single branch; the resolver refuses a family.
    return s && "branch" in s ? s.branch : undefined;
  } catch {
    // Not inside a checkout (a test's temp directory), or the declarations do
    // not resolve: nothing here is stored, which is the pre-move default.
    return undefined;
  }
}

/**
 * The branch a path's `qa` directory is stored on, or `undefined` when it is
 * not in a stored directory (bean `oqe3`). A producer asks this to decide
 * whether its working copy is a RECORD (unstored: stale and orphaned files
 * there are findings) or a measurement of the last run (stored: advisory).
 */
export function qaStorageOf(absPath: string, repoRoot?: string): string | undefined {
  return storedOn(absPath, repoRoot);
}

/**
 * Read a baseline: from the `qa-reports` branch when `against` names a ref,
 * otherwise from the working copy at `absPath`.
 *
 * Four states, qa-store's, whichever the source — and **a miss is never
 * clean**: it carries no text, so a caller has nothing to read as "no
 * findings". The working copy is the pre-move source (the committed file is
 * still there today); once its directory declares `storage` it stops being
 * one, and with no `--against` the answer is `unknown`, never an empty read.
 */
export function readBaseline(absPath: string, opts: { against?: string; store?: QaStoreOptions } = {}): BaselineRead {
  if (opts.against !== undefined) {
    const from = `qa-reports:${opts.against}`;
    try {
      const r = readQa(opts.against, absPath, opts.store);
      return r.state === "hit" ? { state: "hit", text: r.text, from: `qa-reports:${r.key}` } : { ...r, from };
    } catch (e) {
      // A bad ref was refused by `againstRef` before any read; what reaches
      // here is "no remote" / "not a checkout" — could not ASK, so unknown.
      return { state: "unknown", reason: (e as Error).message, from };
    }
  }
  const branch = storedOn(absPath, opts.store?.repoRoot);
  if (branch !== undefined) {
    return {
      state: "unknown",
      reason: `this directory is stored on \`${branch}\`, and its working copy is not a record — pass ${AGAINST_FLAG} <ref>`,
      from: "working copy",
    };
  }
  if (!existsSync(absPath)) return { state: "miss", reason: "not in this checkout", from: "working copy" };
  let text: string;
  try {
    text = readFileSync(absPath, "utf-8");
  } catch (e) {
    return { state: "unknown", reason: (e as Error).message, from: "working copy" };
  }
  if (absPath.endsWith(".json")) {
    try {
      JSON.parse(text);
    } catch (e) {
      return { state: "corrupt", reason: `does not parse: ${(e as Error).message}`, from: "working copy" };
    }
  }
  return { state: "hit", text, from: "working copy" };
}

/** A baseline read as a QA result: a hit that is not `qa-results/v1` is `corrupt`. */
export type QaResultRead =
  | { state: "hit"; result: QaResult; from: string }
  | { state: "miss" | "corrupt" | "unknown"; reason: string; from: string };

/** {@link readBaseline}, parsed — the thin wrapper over qa-store's `readQa`. */
export function readQaResultFrom(absPath: string, opts: { against?: string; store?: QaStoreOptions } = {}): QaResultRead {
  const b = readBaseline(absPath, opts);
  if (b.state !== "hit") return b;
  try {
    const r = JSON.parse(b.text) as QaResult;
    if (r?.$schema !== "qa-results/v1") return { state: "corrupt", reason: "not a qa-results/v1 document", from: b.from };
    return { state: "hit", result: r, from: b.from };
  } catch (e) {
    return { state: "corrupt", reason: (e as Error).message, from: b.from };
  }
}

/**
 * Read a QA result a producer wrote, for comparison.
 *
 * `undefined` for absent or unparseable — which a caller must report as
 * could-not-determine rather than as agreement. A producer failing to write its
 * own sidecar is a finding about the producer, not a clean run. Use
 * {@link readQaResultFrom} where the four states matter; this stays for the
 * callers that read back a file they just wrote into a temp directory.
 */
export function readQaResult(path: string): QaResult | undefined {
  const r = readQaResultFrom(path);
  return r.state === "hit" ? r.result : undefined;
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
 * So the repair was replaced by a COMPARISON: compute into a temp directory
 * and **report** rather than repair. Every field is compared, including
 * `producer.script_hash`, the one actually wrong on `main` then.
 *
 * ## The non-verdicts are not agreement
 *
 * `absent` means there is no baseline where it was looked for — the working
 * copy, or (with `against`) the branch entry. `unreadable` means it would not
 * parse, and calling it `stale` would send a reader to regenerate a file whose
 * problem is that it is corrupt. `unknown` means the branch could not be asked
 * (bean `id4s`). None may be rendered as `current`; whether a caller FAILS on
 * them is the caller's call, and each says so where it decides.
 */
export function qaResultState(
  committedPath: string,
  fresh: QaResult,
  opts: { against?: string; store?: QaStoreOptions } = {},
): QaResultState {
  const r = readQaResultFrom(committedPath, opts);
  if (r.state !== "hit") return r.state === "miss" ? "absent" : r.state === "corrupt" ? "unreadable" : "unknown";
  return key(r.result) === key(fresh) ? "current" : "stale";
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW vs INHERITED — what a baseline is FOR (proposal §2.3)
// ─────────────────────────────────────────────────────────────────────────────

/** Key-order-independent JSON, so an entry's identity does not depend on how it was built. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v !== null && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

/** Per family: the entries the fresh run has that the baseline does not, and the counts of the rest. */
export interface FindingDiff {
  /** Family → entries NEW in the fresh run. Only families with at least one. */
  added: Record<string, unknown[]>;
  /** Entries present in both — inherited, not this change's. */
  inherited: number;
  /** Entries the baseline had and the fresh run does not. */
  resolved: number;
}

/**
 * Split each named family's entries into new / inherited / resolved, by entry
 * identity (canonical JSON). An entry is the producer's own shape, so an entry
 * whose detail text changed reads as one resolved plus one new — the
 * conservative direction for a gate.
 */
export function diffFindings(baseline: QaResult, fresh: QaResult, families: readonly string[]): FindingDiff {
  const added: Record<string, unknown[]> = {};
  let inherited = 0;
  let resolved = 0;
  for (const f of families) {
    const before = new Set((baseline.families?.[f]?.entries ?? []).map(canonical));
    const now = fresh.families?.[f]?.entries ?? [];
    const nowKeys = new Set(now.map(canonical));
    const isNew = now.filter((e) => !before.has(canonical(e)));
    if (isNew.length > 0) added[f] = isNew;
    inherited += now.length - isNew.length;
    for (const k of before) if (!nowKeys.has(k)) resolved++;
  }
  return { added, inherited, resolved };
}

// ─────────────────────────────────────────────────────────────────────────────
// JUDGE MODE — compute and judge, write nothing (bean `bo44`)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four states a JUDGE run can end in.
 *
 * ## Why judge, and not compare
 *
 * Bean `bo44` (arc `3fva`, proposal `qa-reports-branch-and-test-process`
 * §2.3). A producer that writes its own sidecar on every run turns its gate
 * into a writer: CI runs it, it rewrites `test/results/<stem>.qa-results.json`,
 * and nothing anywhere asks whether what it wrote is what is committed. The
 * obvious remedy — compare with the committed file, {@link qaResultState} —
 * stops working the day QA files leave `main`, because there is nothing
 * committed left to compare against.
 *
 * So the gate form of every such producer COMPUTES its findings fresh and
 * JUDGES them, and writes nothing. That survives the move unchanged. Whether
 * the committed copy is current is still REPORTED, as an advisory line through
 * {@link concludeJudgement} — so this is not the weakening `qaResultState`'s
 * docblock warns about (staleness ceasing to be noticed) — but it never decides
 * the exit, because after the move "stale" is no longer a state.
 *
 * | state     | exit | means |
 * |-----------|------|-------|
 * | `ok`      | 0    | computed, and nothing at or above the gate's severity |
 * | `finding` | 1    | computed, and at least one finding the gate fails on |
 * | `unknown` | 2    | the question could not be ASKED — nothing to scan, a source that would not read. Never 0. |
 * | `error`   | 2    | the run itself is wrong — an unknown flag, or the producer threw |
 *
 * `unknown` outranks `finding`: a sweep blind on one part has not cleared the
 * others, and a finding beside a blind spot must not read as "the only
 * problem is this one" (the rule `test/health` keeps for the same reason).
 */
export type Judgement = "ok" | "finding" | "unknown" | "error";

/** The exit code each {@link Judgement} ends in. One table, every judge. */
export const JUDGEMENT_EXIT: Readonly<Record<Judgement, 0 | 1 | 2>> = {
  ok: 0,
  finding: 1,
  unknown: 2,
  error: 2,
};

/**
 * The flag that selects judge mode. `--check`, the convention every other
 * generated artefact here already uses for "verify without writing", so the
 * gate form of a producer is spelled `<script>:check` in `package.json` and
 * `regen-after-merge` pairs it with its writer by name.
 */
export const JUDGE_FLAG = "--check";

/** Is this run a judge run? */
export function judging(argv: readonly string[] = process.argv): boolean {
  return argv.includes(JUDGE_FLAG);
}

/**
 * Decide the judgement from what the producer computed.
 *
 * `failing` counts only the findings at or above the gate's severity — the
 * producer decides which families those are, where it decides, and passes the
 * count. `undetermined` is the could-not-ask state and outranks a finding.
 */
export function judgementOf(args: { failing: number; undetermined?: boolean }): Judgement {
  if (args.undetermined) return "unknown";
  return args.failing > 0 ? "finding" : "ok";
}

/**
 * Flags this run was given that the producer does not know.
 *
 * A misspelled `--chek` would otherwise run the WRITER — the exact thing judge
 * mode exists not to do — so in judge mode an unknown flag is a usage error
 * (`error`, exit 2), never silently ignored. Positional arguments are not
 * flags and are left to the caller.
 */
export function unknownFlags(argv: readonly string[], allowed: readonly string[]): string[] {
  const known = new Set([JUDGE_FLAG, ...allowed]);
  // `--against=<ref>` is the flag `--against`; its value is not a flag.
  return argv.filter((a) => a.startsWith("--") && !known.has(a.split("=")[0]!));
}

/**
 * Print a judge run's verdict and return its exit code. Writes nothing.
 *
 * `committed`, when given, adds ONE advisory line when the committed sidecar is
 * not what this run computed ({@link qaResultState}). Advisory because the arc
 * moves those files off `main`: an absent committed copy is the expected state
 * then, and the staleness of a file that will not exist cannot be what fails a
 * gate. It is printed so that until then a stale copy is still SEEN rather than
 * silently left behind.
 *
 * `unknowns`, when given, are parts of the question that could not be
 * determined because a STORED record was not available — no `--against`, or
 * the branch has no baseline (bean `id4s`). Proposal §2.3: such a part is
 * "`unknown`, reported as such and never as a pass. It does not fail a PR,
 * because an unwritten baseline is not this PR's defect." So each is printed
 * as an UNKNOWN line, an `ok` verdict says it is NOT a full pass, and the exit
 * is left to what WAS determined. A source that would not read — a blind
 * spot in the run itself — is `undetermined` instead, and that does fail (2).
 */
export function concludeJudgement(args: {
  gate: string;
  judgement: Judgement;
  detail?: string;
  committed?: { root: string; stem: string; fresh: QaResult; writer: string };
  unknowns?: readonly string[];
}): number {
  const exit = JUDGEMENT_EXIT[args.judgement];
  const unknowns = args.unknowns ?? [];
  const label = {
    ok:
      unknowns.length > 0
        ? `OK on what was determined — ${unknowns.length} part(s) UNKNOWN, so NOT a full pass (not gated: proposal §2.3)`
        : "OK — no finding the gate fails on",
    finding: "FINDING — the gate fails on what it found",
    unknown: "UNKNOWN — could not determine; this is NOT a pass",
    error: "ERROR — the run itself is wrong; nothing was judged",
  }[args.judgement];
  const line = `${args.gate} (judge mode, wrote nothing): ${label}${args.detail ? ` — ${args.detail}` : ""}`;
  if (exit === 0) console.log(line);
  else console.error(line);
  for (const u of unknowns) console.log(`  ? UNKNOWN — ${u}`);
  if (args.committed) {
    const { root, stem, fresh, writer } = args.committed;
    const state = qaResultState(qaResultPath(root, stem), fresh);
    if (state !== "current") {
      console.log(
        `  advisory: the committed ${stem}.qa-results.json is ${state.toUpperCase()} against this run. ` +
          `Not gated (bean bo44: judge, never compare). \`bun run ${writer}\` rewrites it.`,
      );
    }
  }
  return exit;
}

/**
 * The judge-mode prelude every producer shares: refuse an unknown flag.
 *
 * Returns an exit code to stop with, or `undefined` to carry on. Called only
 * when {@link judging} — the writer forms keep their historical tolerance.
 */
export function judgeUsage(gate: string, argv: readonly string[], allowed: readonly string[]): number | undefined {
  const bad = unknownFlags(argv, allowed);
  if (bad.length === 0) return undefined;
  return concludeJudgement({ gate, judgement: "error", detail: `unknown flag(s): ${bad.join(" ")}` });
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE AND JUDGE AGAINST A BASELINE (bean `0dav`)
// ─────────────────────────────────────────────────────────────────────────────

/** What {@link judgeQaResult} decided, for a caller (or a test) that wants more than the exit. */
export interface QaVerdict {
  judgement: Judgement;
  exit: number;
  /** How many findings the exit was decided on. */
  failing: number;
  /** Where the baseline was looked for, and what came back. */
  baseline: { state: "hit" | "miss" | "corrupt" | "unknown"; from: string; reason?: string };
  /** Present when the baseline was a hit. */
  diff?: FindingDiff;
  /** Lines reported as UNKNOWN and not gated. */
  unknowns: string[];
}

/**
 * The judge every self-sidecar gate shares (bean `0dav`): COMPUTE the result,
 * JUDGE it, and write nothing. "Stale" is not a state any more — there is
 * nothing committed to be stale once QA leaves `main` (proposal §2.3).
 *
 * ## Two kinds of failing family
 *
 * - `failOn` — findings the gate fails on whatever the baseline says (an
 *   `audit:coverage --strict` kind nothing reaches). Against a branch baseline
 *   (`--against`) only the NEW ones fail: an inherited finding is not this
 *   PR's, which is the point of the flag. Against the working copy they all
 *   fail, exactly as before this bean — the committed copy is the author's own
 *   and cannot excuse their own finding.
 * - `failOnNew` — findings the gate fails on only when they are NEW against a
 *   baseline: the drift gates (`root-scan-census`, `check:reference-direction
 *   --check`), whose old failure was "the committed census moved and nobody
 *   looked". Before the move the baseline is the committed working copy; after
 *   it, `--against <ref>`.
 *
 * ## A missing baseline is unknown, and does not fail
 *
 * `miss` / `corrupt` / `unknown` from the baseline: `failOn` is still judged
 * (in full — nothing can be called inherited), and the new-vs-inherited split
 * is reported UNKNOWN — never as "no new findings", and never as a failure.
 *
 * `undetermined` is different: the RUN could not ask part of its question
 * (nothing to scan, a source that would not read). That is exit 2.
 */
export function judgeQaResult(args: {
  gate: string;
  fresh: QaResult;
  failOn?: readonly string[];
  failOnNew?: readonly string[];
  /** Why part of the run could not be asked — exit 2. */
  undetermined?: string;
  /** Extra stored-record unknowns the producer found itself (not gated). */
  unknowns?: readonly string[];
  detail?: string;
  /** The committed sidecar this run would write, and the writer that writes it. */
  baseline: { root: string; stem: string; writer: string; against?: string; store?: QaStoreOptions };
  /** How many new entries to name per family. Default 10. */
  show?: number;
}): QaVerdict {
  const failOn = [...(args.failOn ?? [])];
  let failOnNew = (args.failOnNew ?? []).filter((f) => !failOn.includes(f));
  const { root, stem, writer, against, store } = args.baseline;
  const read = readQaResultFrom(qaResultPath(root, stem), { against, store });
  const unknowns = [...(args.unknowns ?? [])];
  // A `failOnNew` family the baseline does not carry AT ALL was never
  // recorded there, so "new against it" has no subject: every entry would read
  // as new, which is "every subject is new" — the reading this module refuses
  // for a missing entry. It is UNKNOWN for that family and not gated, the same
  // as a missing baseline. An EMPTY family is recorded and is graded. Measured
  // when `check:reference-direction` gained its A.10 `wrong-direction` family
  // (bean `1bvx`): the `main` entry predating it would have failed ~1,000 pairs.
  if (read.state === "hit") {
    const absent = failOnNew.filter((f) => read.result.families?.[f] === undefined && args.fresh.families[f] !== undefined);
    for (const f of absent) {
      unknowns.push(
        `the baseline (${read.from}) carries no \`${f}\` family, so NEW cannot be told from inherited there. ` +
          `Not "no new findings" — the comparison was not made for it. Not gated.`,
      );
    }
    failOnNew = failOnNew.filter((f) => !absent.includes(f));
  }
  const count = (fams: readonly string[]) => fams.reduce((n, f) => n + (args.fresh.families[f]?.count ?? 0), 0);

  let failing: number;
  let diff: FindingDiff | undefined;
  if (read.state === "hit") {
    const fromBranch = against !== undefined;
    diff = diffFindings(read.result, args.fresh, [...failOn, ...failOnNew]);
    const newIn = (fams: readonly string[]) => fams.reduce((n, f) => n + (diff!.added[f]?.length ?? 0), 0);
    failing = (fromBranch ? newIn(failOn) : count(failOn)) + newIn(failOnNew);
    console.log(
      `  baseline (${read.from}): ${Object.values(diff.added).reduce((n, e) => n + e.length, 0)} NEW finding(s), ` +
        `${diff.inherited} inherited, ${diff.resolved} resolved — over ${[...failOn, ...failOnNew].join(", ") || "no graded family"}` +
        (fromBranch ? "" : " (the committed working copy; pass --against <ref> to judge against the qa-reports branch)"),
    );
    const show = args.show ?? 10;
    for (const [f, entries] of Object.entries(diff.added)) {
      console.log(`    new in ${f}:`);
      for (const e of entries.slice(0, show)) console.log(`      + ${JSON.stringify(e)}`);
      if (entries.length > show) console.log(`      …and ${entries.length - show} more`);
    }
    if (!fromBranch && key(read.result) !== key(args.fresh)) {
      console.log(
        `  advisory: the committed ${stem}.qa-results.json is STALE against this run. ` +
          `Not gated (bean 0dav: judge, never compare). \`bun run ${writer}\` rewrites it.`,
      );
    }
  } else {
    failing = count(failOn);
    if (failOnNew.length > 0 || against !== undefined) {
      unknowns.push(
        `no baseline to split NEW from inherited findings (${read.from}: ${read.state}, ${read.reason}). ` +
          `Not "no new findings" — the comparison was not made. Not this change's defect either, so not gated.`,
      );
    } else {
      // Nothing is graded against a baseline here, so its absence decides
      // nothing — but it is still said, so a reader can tell "compared, no
      // change" from "nothing to compare with".
      console.log(`  baseline (${read.from}): ${read.state} — ${read.reason}. Nothing here is judged against one.`);
    }
  }
  const judgement = judgementOf({ failing, undetermined: args.undetermined !== undefined });
  const detail = [args.detail, args.undetermined].filter(Boolean).join(" — ") || undefined;
  const exit = concludeJudgement({ gate: args.gate, judgement, detail, unknowns });
  return {
    judgement,
    exit,
    failing,
    baseline: read.state === "hit" ? { state: "hit", from: read.from } : { state: read.state, from: read.from, reason: read.reason },
    ...(diff ? { diff } : {}),
    unknowns,
  };
}

/**
 * The `--against` prelude for a gate: parse it, or end the run as a usage
 * error. Returns `{ exit }` to stop with, or `{ against }` to carry on.
 */
export function againstOrUsage(gate: string, argv: readonly string[] = process.argv): { against?: string; exit?: number } {
  try {
    return { against: againstRef(argv) };
  } catch (e) {
    if (!(e instanceof QaUsageError)) throw e;
    return { exit: concludeJudgement({ gate, judgement: "error", detail: e.message }) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTE AND JUDGE A SIDECAR TREE (bean `oqe3`)
// ─────────────────────────────────────────────────────────────────────────────

/** One sidecar a tree-writing producer would write, and the findings it computed for it. */
export interface FreshSidecar {
  /** Absolute path of the sidecar — the same path on the branch, repository-relative there. */
  path: string;
  /** The findings the gate grades, each in the producer's own shape (identity is canonical JSON). */
  findings: unknown[];
}

/** What {@link judgeSidecarTree} decided. */
export interface TreeVerdict {
  judgement: Judgement;
  exit: number;
  failing: number;
  /** `hit`: a baseline was read (per file a hit, or a determined miss — a subject new here). */
  baseline: { state: "hit" | "unknown"; from: string; reason?: string };
  /** Findings new against the baseline, per sidecar path. */
  added: Record<string, unknown[]>;
  inherited: number;
  resolved: number;
  unknowns: string[];
}

/**
 * The judge for a producer that writes a TREE of sidecars — one per subject,
 * like `kg-audit` (`kg-qa/**`) and `translation-block-qa` (`translation-qa/**`)
 * — rather than one `qa-results/v1` document. Bean `oqe3`: those gates used to
 * compare every fresh sidecar with the committed one and fail on "stale", which
 * stops meaning anything once the committed copy leaves `main` (`5hox`). So
 * the gate form COMPUTES the findings, JUDGES them, and writes nothing — the
 * rule {@link judgeQaResult} keeps for one document, over many files.
 *
 * ## The baseline, per sidecar
 *
 * With `against`, the ENTRY is asked first ({@link readQaManifest}): an entry
 * that is not there, or cannot be read, makes the whole baseline unknown —
 * never "every subject is new". Inside a readable entry a missing path is a
 * determined miss: that subject had no sidecar at the baseline, so all of its
 * findings are new. Without `against` the working copy is read, which
 * {@link readBaseline} answers `unknown` for a directory that declares
 * `storage`, because that working copy is not a record.
 *
 * ## Two grading modes, as {@link judgeQaResult}'s two lists
 *
 * - `"absolute"` (`failOn`) — against a branch baseline only NEW findings
 *   fail. With no readable baseline, or against the working copy, every
 *   finding fails, exactly as the gate did before: the author's own copy
 *   cannot excuse their own finding.
 * - `"new"` (`failOnNew`) — only findings NEW against a readable baseline
 *   fail. A sidecar whose baseline is unknown is reported UNKNOWN and not
 *   gated, because an unwritten baseline is not this change's defect.
 *
 * `extraFailing` carries findings about something other than the tree (a
 * COMMITTED file the writer would change). `undetermined` is the run's own
 * blind spot and is exit 2, outranking a finding.
 */
export function judgeSidecarTree(args: {
  gate: string;
  fresh: readonly FreshSidecar[];
  /** Parse a baseline sidecar's text into the same finding entries, or `undefined` if it is not one. */
  findingsOf: (text: string) => unknown[] | undefined;
  mode: "absolute" | "new";
  against?: string;
  store?: QaStoreOptions;
  extraFailing?: { count: number; detail: string };
  undetermined?: string;
  unknowns?: readonly string[];
  detail?: string;
  /** How a path is printed. Default: as given. */
  label?: (path: string) => string;
  show?: number;
}): TreeVerdict {
  const label = args.label ?? ((p: string) => p);
  const unknowns = [...(args.unknowns ?? [])];
  const added: Record<string, unknown[]> = {};
  let inherited = 0;
  let resolved = 0;
  let failing = args.extraFailing?.count ?? 0;
  let unreadable = 0;

  // The entry first: an absent entry is ONE unknown, never N new subjects.
  let entry: { state: "hit" | "unknown"; from: string; reason?: string } = { state: "hit", from: "working copy" };
  if (args.against !== undefined) {
    const from = `qa-reports:${args.against}`;
    try {
      const m = readQaManifest(args.against, args.store);
      entry = m.state === "hit" ? { state: "hit", from: `qa-reports:${m.key}` } : { state: "unknown", from, reason: `${m.state}: ${m.reason}` };
    } catch (e) {
      entry = { state: "unknown", from, reason: (e as Error).message };
    }
  }
  const fromBranch = args.against !== undefined && entry.state === "hit";

  // A stored directory's working copy answers `unknown` for EVERY file; that
  // is one fact about the run, said once, not a line per sidecar.
  let storedUnknown: string | undefined;
  for (const s of args.fresh) {
    let before: unknown[] | undefined;
    if (entry.state === "hit") {
      const b = readBaseline(s.path, { against: args.against, store: args.store });
      if (b.state === "hit") {
        before = args.findingsOf(b.text);
        if (before === undefined) unknowns.push(`${label(s.path)} at ${b.from} is not a readable sidecar`);
      } else if (b.state === "miss") {
        before = []; // a determined absence: the subject is new here
      } else if (b.from === "working copy" && b.state === "unknown") {
        storedUnknown ??= b.reason;
      } else {
        unknowns.push(`${label(s.path)} (${b.from}): ${b.state}, ${b.reason}`);
      }
    }
    if (before === undefined) {
      unreadable++;
      if (args.mode === "absolute") failing += s.findings.length;
      continue;
    }
    const prior = new Set(before.map(canonical));
    const now = new Set(s.findings.map(canonical));
    const isNew = s.findings.filter((f) => !prior.has(canonical(f)));
    if (isNew.length > 0) added[s.path] = isNew;
    inherited += s.findings.length - isNew.length;
    for (const k of prior) if (!now.has(k)) resolved++;
    failing += args.mode === "absolute" && !fromBranch ? s.findings.length : isNew.length;
  }

  const total = args.fresh.reduce((n, s) => n + s.findings.length, 0);
  const noBaseline = entry.state !== "hit" ? `${entry.from}: ${entry.reason}` : storedUnknown !== undefined ? `working copy: ${storedUnknown}` : undefined;
  if (noBaseline !== undefined) {
    unknowns.push(
      `no baseline to split NEW from inherited findings (${noBaseline}). ` +
        `Not "no new findings" — the comparison was not made. Not this change's defect either, so not gated` +
        (args.mode === "absolute" ? `; all ${total} graded finding(s) were judged in full.` : "."),
    );
  }
  if (Object.keys(added).length > 0 || inherited > 0 || resolved > 0 || noBaseline === undefined) {
    const newCount = Object.values(added).reduce((n, e) => n + e.length, 0);
    console.log(
      `  baseline (${entry.from}): ${newCount} NEW finding(s) in ${Object.keys(added).length} sidecar(s), ${inherited} inherited, ${resolved} resolved` +
        (unreadable ? ` — ${unreadable} sidecar(s) with no readable baseline` : "") +
        (fromBranch ? "" : " (pass --against <ref> to judge against the qa-reports branch)"),
    );
    const show = args.show ?? 10;
    const rows = Object.entries(added);
    for (const [p, entries] of rows.slice(0, show)) {
      console.log(`    new in ${label(p)}:`);
      for (const e of entries.slice(0, 3)) console.log(`      + ${JSON.stringify(e).slice(0, 300)}`);
      if (entries.length > 3) console.log(`      …and ${entries.length - 3} more`);
    }
    if (rows.length > show) console.log(`    …and ${rows.length - show} more sidecar(s)`);
  }
  if (args.extraFailing && args.extraFailing.count > 0) console.error(`  ✗ ${args.extraFailing.detail}`);

  const judgement = judgementOf({ failing, undetermined: args.undetermined !== undefined });
  const detail = [args.detail, args.undetermined].filter(Boolean).join(" — ") || undefined;
  const exit = concludeJudgement({ gate: args.gate, judgement, detail, unknowns });
  return {
    judgement,
    exit,
    failing,
    baseline: noBaseline === undefined ? { state: "hit", from: entry.from } : { state: "unknown", from: entry.from, reason: noBaseline },
    added,
    inherited,
    resolved,
    unknowns,
  };
}
