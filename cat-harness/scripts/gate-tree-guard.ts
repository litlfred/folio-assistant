/**
 * Which gate CHANGED THE REPOSITORY while it was being judged.
 *
 * ## The defect this exists for
 *
 * `bun run gates` runs 152 gates in order. Gate 1 is `bun test`; somewhere in
 * that suite the detangle WRITER runs and repairs
 * `test/results/detangle/**.detangle.json`. Gate 152 is `kg:detangle:check`,
 * ~1140 lines of output later, and it reads the file gate 1 just repaired.
 *
 * Measured on one tree with `internal` deliberately stale (bean `ymsu`):
 *
 *     bun run kg:detangle:check   alone      ->  exit 1, "STALE … — internal"
 *     bun run gates               same tree  ->  exit 0, "152 gate(s) pass"
 *
 * The checker is not broken — run alone it catches the defect exactly as
 * designed. What is broken is that inside `gates` its subject no longer exists
 * by the time it looks. All 28 pinned measurements sit in that blind spot, and
 * three separate artefacts reached `main` carrying wrong values through it.
 *
 * ## Why the answer lives in the RUNNER and cannot live in a gate
 *
 * No gate can observe what another gate did. That is not an oversight in any
 * individual check; it is the definition of the blind spot. Only the loop that
 * invokes them sees between them, so this is the one place the question can be
 * asked at all.
 *
 * It is also why this is the general fix rather than a fourth answer: it knows
 * nothing about detangle, about tile counts, or about dashboards. It would have
 * caught all three of `ymsu`'s instances, and the `327 -> 345` bean badge that
 * went stale again five beans later, without being told any of them existed.
 *
 * ## The predicate is NOT "the tree is dirty"
 *
 * Running `gates` on your own uncommitted work is the normal case — it is what
 * you do before pushing. A guard that failed on a dirty tree would be wrong and
 * hostile, and it would be switched off within a day.
 *
 * So the question is *"did a gate change a path it did not find changed when it
 * started?"* — a per-gate delta, never an absolute state. Your own edits are in
 * the baseline and stay there.
 *
 * ## Why this is green on a healthy tree, which is what makes it shippable
 *
 * A generator rewriting IDENTICAL BYTES does not show up in `git status`.
 * Measured 2026-09-26 on a clean `main`: a full `bun test` left the tree
 * byte-identical. So the guard fires exactly when a gate's write CHANGED
 * something — which is to say, exactly when a committed artefact was stale and
 * the gate that checks it was about to be handed the repaired copy.
 *
 * Cost, measured rather than assumed before choosing per-gate over
 * once-per-run: `git status --porcelain` over this repository's 13,529 tracked
 * files is **~29ms** (five runs: 29, 27, 29, 27, 29). 152 snapshots is ~4.4s
 * against a run of several minutes, so attribution — the part that turns "the
 * tree changed" into "gate 1 changed what gate 152 reads" — is nearly free.
 *
 * ## Raw porcelain lines are the key, on purpose
 *
 * Git quotes paths containing special characters and writes renames as
 * `R  old -> new`, so a parser that wants the real path has to unquote C-style
 * escapes and split on an arrow that may legally appear in a filename. None of
 * that is needed here: to notice that a snapshot CHANGED, the line git printed
 * is already a stable key, and to report it, the line git printed is already
 * what a reader wants to see. The only field read out of it is the two-char
 * status code, which is fixed-width and needs no parsing.
 *
 * A parser this code does not contain is a parser that cannot be wrong.
 *
 * ## Known limitation: do not run git WHILE the gates run
 *
 * The snapshots are of the working tree as git reports it, so **any** git
 * operation during a run moves the thing being measured. `git add` turns `??`
 * into `A ` and ` M` into `M `; a commit makes those entries vanish entirely.
 * Either is a real porcelain change, and this code will attribute it to
 * whichever gate happened to be running — a finding that names an innocent
 * gate.
 *
 * Found the honest way, 2026-09-26: the session writing this guard wanted to
 * commit it mid-run and realised it would fabricate the finding it was trying
 * to measure.
 *
 * It is documented rather than defended against, and the reason is that the
 * defence is worse than the disease. Detecting "did HEAD or the index move?"
 * means reading `.git/HEAD` and the index mtime between gates and deciding what
 * to do about a change — and the only safe answer is to void the run, which
 * hands every reader a could-not-determine in exchange for a case that only
 * arises when somebody edits the repository while judging it. Commit before the
 * run or after it.
 */

import { spawnSync } from "node:child_process";

/**
 * One porcelain entry: `code` is the fixed-width two-character XY status, `key`
 * is the remainder of the line, used both as the identity of the entry and as
 * its display form. See the docblock on raw lines above for why `key` is not a
 * resolved filesystem path.
 */
export interface TreeEntry {
  readonly code: string;
  readonly key: string;
}

/** A reading of the working tree, or a stated reason there is none. */
export type TreeReading =
  | { readonly ok: true; readonly entries: ReadonlyMap<string, string> }
  | { readonly ok: false; readonly why: string };

/**
 * Parse `git status --porcelain` output into `key -> code`.
 *
 * Blank lines are skipped; a line shorter than the `XY ` prefix cannot be an
 * entry and is skipped too rather than producing a key of `""`, which would
 * collide with every other malformed line and make one defect look like many.
 */
export function parsePorcelain(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.length < 4) continue;
    out.set(line.slice(3), line.slice(0, 2));
  }
  return out;
}

/**
 * True when this entry is an untracked file (`??`) rather than a change to
 * something git is already following.
 *
 * Both are reported and both fail, and the distinction is kept only so the
 * reader is told which they are looking at. An untracked file a gate creates is
 * not the lesser case: a NEW generated sidecar that nobody commits is the
 * `dh4f` shape — a consumer scans nothing and reports a clean run over it.
 * `.gitignore` already excludes the scratch files a gate is entitled to write,
 * because `git status` honours it, so what reaches here is a file the
 * repository has no opinion about yet.
 */
export function isUntracked(code: string): boolean {
  return code === "??";
}

/** Ask git for the working tree's state, or say why that could not be done. */
export function readTree(root: string): TreeReading {
  let r: ReturnType<typeof spawnSync>;
  try {
    r = spawnSync("git", ["status", "--porcelain"], {
      cwd: root,
      encoding: "utf-8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (e) {
    return { ok: false, why: `could not run git: ${(e as Error).message}` };
  }
  if (r.error) return { ok: false, why: `could not run git: ${r.error.message}` };
  if (r.status !== 0) {
    const stderr = String(r.stderr ?? "").trim().split("\n")[0] ?? "";
    return { ok: false, why: `git status exited ${r.status}${stderr ? `: ${stderr}` : ""}` };
  }
  return { ok: true, entries: parsePorcelain(String(r.stdout ?? "")) };
}

/** One path whose porcelain status differs between two readings. */
export interface TreeChange {
  readonly key: string;
  /** Absent when the entry appeared. */
  readonly before?: string;
  /** Absent when the entry disappeared — a gate REVERTED a change. */
  readonly after?: string;
}

/**
 * Every entry whose status differs between two readings.
 *
 * Three directions, all of them counted:
 *
 *   appeared     a gate modified or created something
 *   changed      e.g. ` M` -> `MM`; the same path, a different state
 *   disappeared  a gate UNDID a change that was there
 *
 * The third is the one a "did anything get dirtier?" check misses, and it is
 * not the harmless direction: a gate that reverts an author's edit destroys
 * work, where a gate that writes one only wastes a commit. Keyed by entry, so
 * a status transition is ONE change rather than an add and a delete.
 *
 * Sorted, so two runs over the same defect produce the same report.
 */
export function diffReadings(
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
): TreeChange[] {
  const out: TreeChange[] = [];
  for (const [key, code] of after) {
    const was = before.get(key);
    if (was !== code) out.push(was === undefined ? { key, after: code } : { key, before: was, after: code });
  }
  for (const [key, code] of before) {
    if (!after.has(key)) out.push({ key, before: code });
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

/** What one gate did to the tree while it ran. */
export interface GateMutation {
  readonly gate: string;
  readonly changes: readonly TreeChange[];
}

/**
 * The report for a run in which at least one gate changed the repository.
 *
 * Returns [] for no mutations, so the caller has nothing to print and no
 * "✓ nothing happened" line to maintain. A clean run should be silent here:
 * this guard's whole subject is a thing that should never occur, and a tool
 * that congratulates itself once per run trains readers to skip its output.
 *
 * The cap exists for the same reason `salientFailures` has one — a gate that
 * rewrites 218 sidecars (bean `bqrg`'s neighbour) would otherwise bury the
 * finding under its own evidence — and the elision is STATED rather than
 * silent, because "5 of 218" and "5" are different claims.
 */
export function formatMutations(mutations: readonly GateMutation[], cap = 8): string[] {
  if (mutations.length === 0) return [];
  const lines: string[] = [];
  lines.push(`✗ ${mutations.length} gate(s) CHANGED THE REPOSITORY while the gates were running:`);
  for (const m of mutations) {
    const tracked = m.changes.filter((c) => !isUntracked(c.after ?? c.before ?? ""));
    const untracked = m.changes.length - tracked.length;
    const parts = [`${m.changes.length} path(s)`];
    if (untracked > 0) parts.push(`${untracked} of them previously untracked`);
    lines.push(`  · ${m.gate}   (${parts.join(", ")})`);
    for (const c of m.changes.slice(0, cap)) {
      const how =
        c.after === undefined
          ? `reverted  (was "${c.before}")`
          : c.before === undefined
            ? `wrote     ("${c.after}")`
            : `changed   ("${c.before}" -> "${c.after}")`;
      lines.push(`      ${how}  ${c.key}`);
    }
    if (m.changes.length > cap) {
      lines.push(`      …and ${m.changes.length - cap} more path(s) not listed`);
    }
  }
  lines.push("");
  lines.push("  A gate that writes to the tree it is being judged on makes every LATER gate");
  lines.push("  read a repaired copy rather than the committed one. That is not a warning: it");
  lines.push("  is why `kg:detangle:check` cannot fail inside this runner, and why three stale");
  lines.push("  artefacts reached `main` green (bean `ymsu`).");
  lines.push("");
  lines.push("  Regenerate and COMMIT what is stale, then re-run — the changes above are the");
  lines.push("  diff you are missing. If a gate writes here as part of doing its job, that is");
  lines.push("  the defect to fix: compute into a temp directory, as the profile-conformance");
  lines.push("  tests already do, rather than into the tree under test.");
  return lines;
}

/**
 * The line to print when the tree could not be read.
 *
 * Deliberately NOT a failure, and deliberately not silence either.
 *
 * Not a failure, because `gates` must stay runnable where this question cannot
 * be asked — an exported source tree with no `.git`, a container with no `git`
 * binary. Failing there would make the guard the reason the gates cannot run.
 *
 * Not silence, because *"could not determine is never rendered as clean"* is
 * this repository's rule, and the way it gets broken is a check that quietly
 * skips itself and lets the run's final line imply it looked.
 */
export function formatUndetermined(why: string): string[] {
  return [
    `? could not tell whether any gate changed the repository — ${why}`,
    "  The gates' own verdict below stands; THIS question was not answered, and an",
    "  unanswered question is not a clean answer to it (bean `ymsu`).",
  ];
}
