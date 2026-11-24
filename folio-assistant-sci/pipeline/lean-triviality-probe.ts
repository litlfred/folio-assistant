#!/usr/bin/env bun
/**
 * Triviality probe — measures whether a block's goals fall to cheap,
 * general-purpose automation.
 *
 * ## Why not Nazrin
 *
 * The `nimj` proposal was to use Nazrin (arXiv 2602.18767), a GNN
 * emitting atomic tactics on consumer hardware, as a cheap oracle: if a
 * weak prover closes the goal instantly, the statement probably carries
 * no content.
 *
 * The *idea* is right and the *dependency* is not. What the criterion
 * needs is any cheap oracle, and folio already has one — Lean's own
 * automation. `trivial`, `rfl`, `simp`, `decide`, `omega`, `aesop` are
 * available, already a dependency, version-matched to the corpus, and
 * need no research checkout or GPU. Nazrin's contribution was running
 * cheaply *without* Lean; folio has Lean.
 *
 * So this probes the ladder directly. Same cache, same criterion, no
 * new dependency.
 *
 * ## Method
 *
 * For each provable declaration in a block's `.lean`, rewrite ONLY that
 * declaration's proof body to `by <tactic>` — leaving the rest of the
 * file intact so in-file dependencies still elaborate — and run `lean`.
 * If the file elaborates clean, that tactic closed the goal.
 *
 * The ladder is ordered cheapest-first; `steps` is the 1-based rung that
 * succeeded, so `steps: 1` means `trivial` alone sufficed.
 *
 * ## What a hit means
 *
 * It is a PROMPT, not a verdict. Genuine results are sometimes
 * one-liners, and `simp` closing a goal often means the content lives in
 * the `simp` set rather than that there is no content. The output feeds
 * `proof-not-machine-trivial`, which is warn-only and `minor`.
 *
 * ## What a MISS means — three ways to measure nothing
 *
 * The first qou run printed `probed 12, closed 0`, and that was read as
 * "no qou theorem falls to cheap automation". A probe that cannot close
 * anything prints the same line, so the reading was not available from
 * the output. Three mechanical failures used to arrive dressed as that
 * substantive result; each now reports itself:
 *
 * - **A rung that is not installed.** `aesop` is not core Lean; without
 *   Mathlib it errors `unknown tactic` and exits non-zero, which an
 *   exit-code check scores as "ran and lost". The ladder silently had
 *   five rungs. Now recorded in `ladder.unavailable`.
 * - **A rung that ran out of time.** `execFileSync` reports a timeout by
 *   killing the child, landing in the same catch as a failed proof. A
 *   tactic that did not answer is not a tactic that lost — and `simp` is
 *   the rung most likely to be slow on the goals most worth flagging.
 *   Now `ladder.timedOut`.
 * - **A splice that landed in the statement.** `splitDeclarations` cut
 *   at the first `:=` *anywhere*, so a statement containing one — a
 *   `let`, a structure instance — had the tactic written over its own
 *   type. The file stopped elaborating, every rung failed, and the
 *   declaration was recorded `closed: false`. Fixed at the source with
 *   `topLevelCut`.
 *
 * The controls that keep this honest are in
 * `scripts/tests/lean-triviality-probe.test.ts`: declarations of known
 * difficulty, asserted to close at the expected rung.
 *
 * ## Usage
 *
 *   bun run folio-assistant-sci/pipeline/lean-triviality-probe.ts \
 *     --lake-root content/<paper>/lean --limit 20 [--out docs/audits/lean-triviality.json]
 *
 * Requires a Lean toolchain and restored oleans, from the `lean-cache` tool
 * of the layer that owns Lean:
 *   lake-cache.sh restore-toolchain && lake-cache.sh restore
 *
 * @module pipeline/lean-triviality-probe
 */

import { folioDir } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname, resolve } from "path";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import { walkBlocks } from "@litlfred/cat-harness-tools/pipeline/qa-utils.ts";
import { parseLeanRef, refToDecl } from "@litlfred/cat-harness-tools/pipeline/content-graph.ts";
import {
  DECL_RE,
  declarationStarts,
  splitDeclarations,
  stripLeanComments,
} from "@litlfred/cat-harness-tools/pipeline/lean-lexer.ts";
import { findContentRepoRoot } from "@litlfred/cat-harness-tools/pipeline/repo-root.ts";
import { siteDirFor } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.ts";

/** Cheapest-first. Position in this list becomes `steps`. */
export const TACTIC_LADDER = ["trivial", "rfl", "simp", "decide", "omega", "aesop", "cases-decide"];

/**
 * The tactic text a rung splices in, or `undefined` when the rung does not
 * apply to this declaration.
 *
 * Every rung but one is a fixed tactic. `cases-decide` is case analysis on
 * one explicit binder followed by `decide` on each case: the proof shape of
 * a finite table check such as `stratumDepth term ≤ 4 := by cases term <;>
 * decide`. Plain `decide` cannot close that goal (the binder is a free
 * variable) and plain `simp` does not unfold the table, so without this rung
 * the ladder reports a known vacuous declaration as "not closed" (qou bean
 * `qou-z3k1`, `mass_tower_coefficient_stratification`). It needs a binder to
 * split on, so a declaration with no explicit binders has nothing to try:
 * that is `inapplicable`, not a rung that lost.
 *
 * It is last so the `steps` of every older rung keep their meaning across
 * snapshots. Any closure is a real Lean proof, so a rung can only raise
 * recall; it cannot certify a false closure.
 */
export function rungTactic(rung: string, signature: string): string | undefined {
  if (rung !== "cases-decide") return rung;
  const names = explicitBinderNames(signature);
  if (!names.length) return undefined;
  return `first ${names.map((n) => `| (cases ${n} <;> decide)`).join(" ")}`;
}

/**
 * Names bound by explicit `( … : … )` and implicit `{ … : … }` binders in a declaration signature,
 * in order, without duplicates. Anonymous `_` and `_`-prefixed names are
 * left out because they cannot be referred to.
 */
export function explicitBinderNames(signature: string): string[] {
  const out: string[] = [];
  for (const m of signature.matchAll(/[({]\s*([^(){}:]+?)\s*:(?!=)/g)) {
    for (const n of m[1].trim().split(/\s+/)) {
      if (/^[A-Za-z\u00C0-\uFFFF][\w'\u00C0-\uFFFF]*$/u.test(n) && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

/**
 * Does the lexer's declaration name `found` denote the referenced `ref`?
 *
 * A `lean.ref` names a declaration by its fully qualified name, but the
 * lexer reports the name as written after the keyword, which is qualified
 * only by whatever prefix the source spelled out (`theorem
 * AtomKnot.exists` inside `namespace QOU.BraidKnot`). Comparing the ref's
 * last component against that spelled name missed every such declaration:
 * 55 of qou's 156 `decl-not-found` skips on 2026-11-21. A match is now
 * equality, or `found` being a dot-aligned suffix of `ref`, so a short
 * `ref` (the old calling convention) still matches as before.
 */
export function declNameMatches(found: string, ref: string): boolean {
  return found === ref || ref.endsWith(`.${found}`);
}

/**
 * The fully qualified name of every declaration in a comment-stripped
 * source, in the order `declarationStarts` / `splitDeclarations` report
 * them: the enclosing `namespace` blocks joined to the spelled name.
 * `section` blocks open no namespace; `_root_.` discards the enclosing one.
 */
export function qualifiedDeclarationNames(stripped: string): string[] {
  const events: { at: number; kind: "open-ns" | "open-sec" | "end" | "decl"; name: string }[] = [];
  for (const m of stripped.matchAll(/^[ \t]*(namespace|section|end)\b[ \t]*([^\s]*)/gm)) {
    const kind = m[1] === "namespace" ? "open-ns" : m[1] === "section" ? "open-sec" : "end";
    events.push({ at: m.index ?? 0, kind, name: m[2] ?? "" });
  }
  for (const d of declarationStarts(stripped)) events.push({ at: d.at, kind: "decl", name: d.name });
  events.sort((a, b) => a.at - b.at);
  const stack: { ns: boolean; name: string }[] = [];
  const out: string[] = [];
  for (const e of events) {
    if (e.kind === "open-ns") stack.push({ ns: true, name: e.name });
    else if (e.kind === "open-sec") stack.push({ ns: false, name: e.name });
    else if (e.kind === "end") {
      // `end A.B` closes the scope opened as `namespace A.B`; a bare `end`
      // closes an anonymous section. Unmatched ends are ignored.
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === e.name) {
          stack.length = i;
          break;
        }
      }
    } else if (e.name.startsWith("_root_.")) out.push(e.name.slice("_root_.".length));
    else {
      const ns = stack.filter((x) => x.ns && x.name).map((x) => x.name);
      out.push([...ns, e.name].join("."));
    }
  }
  return out;
}

/**
 * The keyword (`theorem`, `def`, `structure`, …) of the `i`-th declaration
 * that `declarationStarts` reports in a comment-stripped source.
 */
export function declarationKind(stripped: string, i: number): string | undefined {
  const start = declarationStarts(stripped)[i];
  if (!start) return undefined;
  const m = new RegExp(DECL_RE.source, "m").exec(stripped.slice(start.at));
  return m?.[1];
}

/**
 * The declaration in `decls` that `ref` names.
 *
 * With `qualified` (from `qualifiedDeclarationNames`, index-aligned) an
 * exact fully qualified match wins. Without one, the longest spelled name
 * that is a dot-aligned suffix of `ref` is taken: within one file that is
 * the declaration the ref means unless the file declares the same short
 * name in two namespaces.
 */
export function findDeclaration<T extends { name: string }>(
  decls: T[],
  ref: string,
  qualified?: string[],
): T | undefined {
  if (qualified) {
    const i = qualified.indexOf(ref);
    if (i >= 0 && i < decls.length) return decls[i];
  }
  let best: T | undefined;
  for (const d of decls) {
    if (declNameMatches(d.name, ref) && (!best || d.name.length > best.name.length)) best = d;
  }
  return best;
}

/** Kinds whose goals are worth probing. */
const PROVABLE = /^\s*(?:@\[[^\]]*\]\s*)?(?:private\s+|protected\s+|noncomputable\s+)*(theorem|lemma)\s+/m;

/**
 * Build LEAN_PATH from a Lake root's restored packages.
 *
 * Oleans live under `.lake/build/lib/lean` in current Lake, not
 * `.lake/build/lib` — pointing at the latter finds nothing and reads as
 * "unknown module prefix", which looks like a missing dependency rather
 * than a wrong path.
 *
 * Neither root is sufficient alone, so both are unioned. A restored
 * cache splits across them: the paper root carries the paper's own
 * modules, the workspace root carries the dependencies (in one measured
 * checkout, 942 vs 5 own-oleans, against 5 vs 6990 for Mathlib). The
 * paper root also holds near-empty *copies* of those dependency
 * packages, and since LEAN_PATH resolves first-match by directory, those
 * stubs shadow the complete copies if they come first — every
 * Mathlib-importing file then fails to elaborate. So the workspace root
 * is emitted FIRST, matching `scripts/lean-direct-env.sh`, which orders
 * `.lake` before `content/<paper>/lean` for exactly this reason.
 *
 * Passing only `lakeRoot` reproduces the old single-root behaviour.
 */
export function leanPathFor(lakeRoot: string, workspaceRoot?: string): string {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (d: string) => {
    if (existsSync(d) && !seen.has(d)) {
      seen.add(d);
      out.push(d);
    }
  };
  const addRoot = (root: string) => {
    push(join(root, ".lake", "build", "lib", "lean"));
    const pkgs = join(root, ".lake", "packages");
    if (existsSync(pkgs)) {
      for (const p of readdirSync(pkgs)) {
        push(join(pkgs, p, ".lake", "build", "lib", "lean"));
      }
    }
  };
  // Workspace root first: its complete dependency copies must win the
  // first-match over the paper root's vestigial stubs.
  if (workspaceRoot && resolve(workspaceRoot) !== resolve(lakeRoot)) {
    addRoot(workspaceRoot);
  }
  addRoot(lakeRoot);
  return out.join(":");
}

/**
 * Why a probe could not run. Never conflate these with a result: each
 * one means "not measured", and only `open` means "measured, resisted".
 */
export type SkipReason =
  /** `splitDeclarations` saw no declaration by that name. */
  | "decl-not-found"
  /** The declaration has no top-level `:=` body to substitute. */
  | "no-body"
  /** A `structure`, `class` or `inductive`: a type, with no proof to replace. */
  | "not-a-proof"
  /** The file does not elaborate unmodified — usually missing oleans. */
  | "baseline-fails"
  /** The file elaborates too slowly to probe. Not the same as broken. */
  | "baseline-timeout";

/** What each skip reason means, and therefore what would fix it. */
export const SKIP_EXPLANATION: Record<SkipReason, string> = {
  "decl-not-found": "the lexer saw no declaration by that name — check the lean.ref, not the oleans",
  "no-body": "declaration has no top-level `:=` body; the probe was never applicable",
  "not-a-proof": "the ref names a structure, class or inductive type; there is no proof to replace",
  "baseline-fails": "file does not elaborate unmodified — usually missing oleans; restore the cache",
  "baseline-timeout": "file elaborates too slowly to probe — raise the timeout, do not read as broken",
};

/** Which rungs actually ran, and which never gave an answer. */
export interface LadderRun {
  ran: string[];
  /**
   * Rungs with nothing to try on this declaration — `cases-decide` with no
   * explicit binder. Not a loss and not a gap in the ladder: the rung's
   * proof shape cannot exist here.
   */
  inapplicable?: string[];
  /** Rungs absent from this environment — e.g. `aesop` without Mathlib. */
  unavailable: string[];
  /**
   * Rungs killed by the timeout. A tactic that ran out of time did not
   * lose; it did not answer. Counting it as a loss makes the probe
   * under-report triviality — `simp` is exactly the rung most likely to
   * be slow on the goals most worth flagging.
   */
  timedOut: string[];
}

/** Rungs that gave no answer, for either reason. */
export function incompleteRungs(l: LadderRun): string[] {
  return [...l.unavailable, ...l.timedOut];
}

export type ProbeOutcome =
  | { status: "closed"; decl: string; steps: number; tactic: string; ladder: LadderRun }
  | { status: "open"; decl: string; ladder: LadderRun }
  | { status: "skipped"; decl: string; reason: SkipReason };

/**
 * A tactic that does not exist reads exactly like a tactic that lost.
 *
 * `aesop` is not core Lean; in a folio without Mathlib the rung errors
 * with `unknown tactic` and exits non-zero, which a bare exit-code check
 * scores as "aesop ran and failed to close the goal". The ladder then
 * silently has five rungs instead of six and every declaration `aesop`
 * would have closed is recorded as not machine-trivial.
 */
const UNAVAILABLE_RE = /unknown tactic|unexpected identifier; expected/;

/**
 * Probe one declaration by substituting its proof body.
 *
 * Returns a `skipped` outcome — with the reason — rather than a bare
 * absence, because the four ways this can fail to measure anything are
 * not interchangeable: `baseline-fails` is fixed by restoring oleans,
 * `decl-not-found` by fixing the lexer or the `lean.ref`, and `no-body`
 * is a declaration the probe was never applicable to. Reporting them as
 * one bucket makes the skip count undiagnosable.
 */
export function probeDeclaration(
  src: string,
  declName: string,
  lakeRoot: string,
  leanBin: string,
  timeoutMs = 120_000,
  workspaceRoot?: string,
): ProbeOutcome {
  const stripped = stripLeanComments(src);
  const decls = splitDeclarations(stripped);
  const target = findDeclaration(decls, declName, qualifiedDeclarationNames(stripped));
  if (!target) return { status: "skipped", decl: declName, reason: "decl-not-found" };
  // Following refs into the library reaches type declarations far more often
  // than a block sibling did: 27 of the 133 qou refs found on 2026-11-22.
  // Splicing `by simp` over a `structure … where` cannot mean anything, so
  // say so instead of recording "open". `def`/`abbrev`/`instance` stay in:
  // a Prop-valued `def` is exactly the self-assuming shape worth probing.
  const kind = declarationKind(stripped, decls.indexOf(target));
  if (kind === "structure" || kind === "class" || kind === "inductive") {
    return { status: "skipped", decl: declName, reason: "not-a-proof" };
  }
  if (!target.body || target.bodyAt < 0) {
    return { status: "skipped", decl: declName, reason: "no-body" };
  }

  const env = { ...process.env, LEAN_PATH: leanPathFor(lakeRoot, workspaceRoot) };
  const dir = mkdtempSync(join(tmpdir(), "triv-probe-"));
  const file = join(dir, "P.lean");

  /** Four distinct answers. Collapsing any of them fabricates evidence. */
  const attempt = (text: string): "closed" | "open" | "unavailable" | "timeout" => {
    writeFileSync(file, text);
    try {
      execFileSync(leanBin, [file], { env, timeout: timeoutMs, stdio: "pipe" });
      return "closed";
    } catch (e) {
      const err = e as {
        stdout?: Buffer | string;
        stderr?: Buffer | string;
        killed?: boolean;
        signal?: string | null;
      };
      // `execFileSync` reports a timeout by killing the child, which
      // otherwise arrives here looking exactly like a failed proof.
      if (err.killed || err.signal === "SIGTERM") return "timeout";
      // Lean reports diagnostics on stdout; read both and do not assume.
      const out = `${err.stdout ?? ""}${err.stderr ?? ""}`;
      return UNAVAILABLE_RE.test(out) ? "unavailable" : "open";
    }
  };

  // Baseline: does the file elaborate as-is? If not, any probe result is
  // meaningless — including "not closed".
  const baseline = attempt(src);
  if (baseline === "timeout") {
    return { status: "skipped", decl: declName, reason: "baseline-timeout" };
  }
  if (baseline !== "closed") {
    return { status: "skipped", decl: declName, reason: "baseline-fails" };
  }

  // `stripped` preserves byte offsets (comments are blanked, not
  // removed), so the span's offset indexes the original source directly.
  const bodyStart = target.bodyAt;
  const bodyEnd = bodyStart + target.body.length;
  const ladder: LadderRun = { ran: [], unavailable: [], timedOut: [] };

  for (let i = 0; i < TACTIC_LADDER.length; i++) {
    const t = TACTIC_LADDER[i];
    const tactic = rungTactic(t, target.signature);
    if (tactic === undefined) {
      (ladder.inapplicable ??= []).push(t);
      continue;
    }
    const probe = src.slice(0, bodyStart) + `:= by ${tactic}\n` + src.slice(bodyEnd);
    const r = attempt(probe);
    if (r === "unavailable") {
      ladder.unavailable.push(t);
      continue;
    }
    if (r === "timeout") {
      ladder.timedOut.push(t);
      continue;
    }
    ladder.ran.push(t);
    if (r === "closed") {
      return { status: "closed", decl: declName, steps: i + 1, tactic: t, ladder };
    }
  }
  return { status: "open", decl: declName, ladder };
}

/**
 * Every declaration under a lake root, by fully qualified name, mapped to
 * the files that declare it. `.lake/` (vendored dependencies and build
 * output) and dot-directories are not walked.
 */
export function indexLakeDeclarations(lakeRoot: string): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const stack = [lakeRoot];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries: import("fs").Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name.endsWith(".lean")) {
        let text: string;
        try {
          text = readFileSync(full, "utf-8");
        } catch {
          continue;
        }
        for (const q of qualifiedDeclarationNames(stripLeanComments(text))) {
          const files = index.get(q) ?? [];
          if (!files.includes(full)) files.push(full);
          index.set(q, files);
        }
      }
    }
  }
  return index;
}

/**
 * The one lake-root file that declares `ref` by its fully qualified name,
 * or `undefined` when none does or two do. Only an exact qualified match
 * counts: a short-name match in another namespace is a different
 * declaration, and probing it would measure the wrong goal.
 */
export function resolveInLakeIndex(index: Map<string, string[]>, ref: string): string | undefined {
  const files = index.get(ref) ?? [];
  return files.length === 1 ? files[0] : undefined;
}

/**
 * The file a ref names by its MODULE PATH, when it declares the ref's last
 * component exactly once.
 *
 * A `lean.ref` has two spellings in use. Most give the declaration's fully
 * qualified name (`QOU.BraidKnot.mass_tower_coefficient_stratification`).
 * Others give the file's module path and then the short name
 * (`QOU.LiftingDescent.CosimplicialCrossedGroupoid.YekutieliTriple`: file
 * `QOU/LiftingDescent/CosimplicialCrossedGroupoid.lean`, declaration
 * `QOU.LiftingDescent.YekutieliTriple`). The platform's resolver accepts
 * both, so the probe must too; reading only the first spelling reported
 * three valid qou refs as unresolved.
 */
export function resolveByModulePath(lakeRoot: string, ref: string): string | undefined {
  const i = ref.lastIndexOf(".");
  if (i <= 0) return undefined;
  const file = join(lakeRoot, `${ref.slice(0, i).replace(/\./g, "/")}.lean`);
  if (!existsSync(file)) return undefined;
  const short = ref.slice(i + 1);
  let text: string;
  try {
    text = readFileSync(file, "utf-8");
  } catch {
    return undefined;
  }
  const hits = splitDeclarations(stripLeanComments(text)).filter((d) => d.name.split(".").pop() === short);
  return hits.length === 1 ? file : undefined;
}

// ── CLI ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const arg = (n: string) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const lakeRoot = arg("--lake-root");
  const limit = parseInt(arg("--limit") ?? "20", 10);
  const repoRoot = findContentRepoRoot();
  const out = arg("--out") ?? join(repoRoot, siteDirFor(repoRoot), "audits/lean-triviality.json");
  const leanBin = arg("--lean") ?? "lean";

  if (!lakeRoot) {
    console.log(`Triviality probe — measures whether goals fall to cheap automation.

  --lake-root DIR   Lake root with restored oleans (required)
  --limit N         Blocks to probe (default 20)
  --lean PATH       lean binary (default: 'lean' on PATH)
  --out FILE        Output cache (default docs/audits/lean-triviality.json)
  --lean-packages M Module exporting LEAN_PACKAGES (default schemas/lean-packages.ts)

Ladder (cheapest first): ${TACTIC_LADDER.join(", ")}
Needs: the lean-cache tool's lake-cache.sh restore-toolchain && ... restore`);
    process.exit(2);
  }

  // A block whose `lean.ref` points into the library has no sibling `.lean`;
  // `walkBlocks` finds its file only through the Lean resolver, which needs
  // the folio's package list. Without it those blocks are dropped before the
  // loop sees them, silently: on qou (2026-11-22) 397 provable blocks, more
  // than a third of the corpus.
  const pkgModule = arg("--lean-packages") ?? join(repoRoot, "schemas", "lean-packages.ts");
  let pkgCount = 0;
  if (existsSync(resolve(repoRoot, pkgModule))) {
    const { configureLeanPackages } = await import("./lean-formal-ref.ts");
    const m = (await import(resolve(repoRoot, pkgModule))) as {
      LEAN_PACKAGES?: Parameters<typeof configureLeanPackages>[0];
      default?: Parameters<typeof configureLeanPackages>[0];
    };
    const pkgs = m.LEAN_PACKAGES ?? m.default;
    if (Array.isArray(pkgs)) {
      configureLeanPackages(pkgs);
      pkgCount = pkgs.length;
    }
  }
  if (!pkgCount) {
    console.log(
      `  !! no Lean packages configured (looked for ${pkgModule}): blocks whose lean.ref points into the ` +
        `library have no file to probe and are left out of this run, not skipped.`,
    );
  }

  const abs = join(repoRoot, lakeRoot);
  const searchRoot = folioDir(repoRoot);
  const decls: Record<string, unknown> = {};
  // Counted per reason: a 57%-skipped run is only actionable if you can
  // tell "restore the oleans" from "the lexer missed the declaration".
  const skips: Record<SkipReason, number> = {
    "decl-not-found": 0,
    "no-body": 0,
    "not-a-proof": 0,
    "baseline-fails": 0,
    "baseline-timeout": 0,
  };
  const unavailableRungs = new Set<string>();
  let probed = 0,
    skipped = 0,
    closed = 0;

  let lakeIndex: Map<string, string[]> | undefined;
  let viaLakeRoot = 0;

  for (const b of walkBlocks(searchRoot)) {
    if (probed >= limit) break;
    if (!b.lean) continue;
    const decl = refToDecl(parseLeanRef(readFileSync(b.ts, "utf-8")));
    if (!decl) continue;
    // A block's `.lean` is often a sibling that imports the library and
    // declares nothing by the ref's name; the declaration lives in the lake
    // root. Follow the ref there rather than report `decl-not-found`.
    let leanFile = b.lean;
    let src: string;
    try {
      src = readFileSync(leanFile, "utf-8");
    } catch {
      continue;
    }
    const own = stripLeanComments(src);
    if (!findDeclaration(splitDeclarations(own), decl, qualifiedDeclarationNames(own))) {
      lakeIndex ??= indexLakeDeclarations(abs);
      const hit = resolveInLakeIndex(lakeIndex, decl) ?? resolveByModulePath(abs, decl);
      if (hit && hit !== leanFile) {
        leanFile = hit;
        src = readFileSync(leanFile, "utf-8");
        viaLakeRoot++;
      }
    }
    if (!PROVABLE.test(src)) continue;

    const r = probeDeclaration(src, decl, abs, leanBin, 120_000, repoRoot);
    if (r.status === "skipped") {
      skipped++;
      skips[r.reason]++;
      console.log(`  skip  ${b.label}  (${SKIP_EXPLANATION[r.reason]})`);
      continue;
    }
    probed++;
    if (r.status === "closed") closed++;
    const incomplete = incompleteRungs(r.ladder);
    for (const t of incomplete) unavailableRungs.add(t);
    decls[decl] = {
      closed: r.status === "closed",
      steps: r.status === "closed" ? r.steps : undefined,
      tactic: r.status === "closed" ? r.tactic : undefined,
      // Recorded so a `closed: false` can be read honestly: if a rung
      // never answered, the goal was not tested against it.
      ladder_unavailable: incomplete.length ? incomplete : undefined,
      ladder_inapplicable: r.ladder.inapplicable?.length ? r.ladder.inapplicable : undefined,
      lean_path: leanFile.startsWith(repoRoot) ? leanFile.slice(repoRoot.length + 1) : leanFile,
      checked_at: new Date().toISOString(),
    };
    console.log(
      `  ${r.status === "closed" ? `CLOSED(${r.tactic}, step ${r.steps})` : "not closed"}  ${b.label}`,
    );
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(
      {
        $schema: "lean-triviality/v1",
        generated_at: new Date().toISOString(),
        oracle: `lean-tactic-ladder(${TACTIC_LADDER.join("|")})`,
        decls,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\nprobed ${probed}, closed ${closed}, skipped ${skipped}`);
  if (viaLakeRoot) console.log(`  ${String(viaLakeRoot).padStart(4)}  declarations found by following the ref into the lake root`);
  for (const [reason, n] of Object.entries(skips)) {
    if (n) console.log(`  ${String(n).padStart(4)}  ${reason} — ${SKIP_EXPLANATION[reason as SkipReason]}`);
  }
  if (unavailableRungs.size) {
    console.log(
      `\n  !! ladder incomplete: ${[...unavailableRungs].join(", ")} gave no answer in this ` +
        `environment (absent, or timed out). Every "not closed" above was measured against a SHORT ladder and is ` +
        `recorded as such; the criterion reads those as n/a, not as "not trivial".`,
    );
  }
  if (probed > 0 && closed === 0) {
    console.log(
      `\n  note: 0 of ${probed} closed. That is only evidence about the corpus if the probe ` +
        `can close anything at all — see scripts/tests/lean-triviality-probe.test.ts, which ` +
        `pins the ladder against declarations of known difficulty.`,
    );
  }
  console.log(`-> ${out}`);
}
