#!/usr/bin/env bun
/**
 * Which DECLARED EXECUTABLE ARTEFACTS can actually be reached — measured.
 *
 * Bean `folio-assistant-dxqm`, under `folio-assistant-1xhc`. That epic's line
 * is *a gate that does not fire is indistinguishable from one that passed*.
 * This is the same sentence one level deeper:
 *
 * > **A declared executable artefact that nothing can reach is
 * > indistinguishable, from outside, from a decision nobody takes.**
 *
 * Two instances on 2026-10-04, both past all 217 CI gates:
 *
 * 1. `scripts/merge-queue.ts` derived a PR's facts, evaluated
 *    `merge-priority.dmn` and ordered the merge queue. Its docblock said *"a
 *    library the merge steward and the tile call."* **Nothing called it** — no
 *    `package.json` script, no workflow, and its only importer was its own
 *    test. A human ordered the queue by hand instead.
 * 2. `merge-priority.dmn` used `not("green")` from the day it was drawn, which
 *    this repo's FEEL evaluator refuses. The table was unevaluable by **any**
 *    caller — and its committed `kg-qa` sidecar read `"result": "pass"`.
 *
 * ## What each check measures, and what it deliberately does NOT
 *
 * | family | question | fails |
 * |---|---|---|
 * | `decision-unevaluable` | can this repo's own evaluator read every cell? | `--check` |
 * | `process-unreachable` | would `workflow_start` find this diagram? | `--check` |
 * | `process-ambiguous` | do two diagrams answer to one name? | `--check` |
 * | `module-test-only` | is the only thing reaching this module the thing that proves it works? | `--strict` |
 *
 * **`decision-unevaluable` is not a second answer to `kg-audit`'s
 * `decision-outcomes-used`.** That criterion asks whether a table LOADS and
 * whether its first output column yields outcomes; this asks whether the
 * evaluator can read the cells. The two came apart on the one table that
 * mattered, which is the whole reason this file exists — and the reference
 * question (*is any gateway pointing at this decision?*) stays that
 * criterion's, recorded here as a measurement and never as a finding.
 *
 * **Activity skill refs are not re-checked here.** `check:workflow-refs`
 * already fails the build on a dangling `<bootstrap.processes:skill ref>` and reports an
 * uncovered activity, and `kg-audit`'s `skill-*` criteria locate the same
 * relation per node. A third reader of one fact is a third answer free to
 * disagree with the other two.
 *
 * ## Evaluability is asked of the EVALUATOR, never restated here
 *
 * `unreadableExpressions` lives in `src/workflow/decision-table.ts` beside the
 * grammar it is about, and this script calls it. A checker that re-derived
 * which FEEL this engine accepts would be a second spelling of one grammar,
 * free to go green on a table the engine refuses. Its docblock carries why the
 * probe is `0` and why a comma-separated test has to be split before asking.
 *
 * ## Reachability for a DIAGRAM is asked of the engine's own resolver
 *
 * Same discipline: the denominator is every `.bpmn` any instance DECLARES, and
 * the numerator is `processFiles` — the list `workflow_list` prints and
 * `workflow_start` resolves against. `processFiles` keys by file STEM and keeps
 * the first claimant (`if (!seen.has(stem))`), so a dependency's diagram whose
 * stem collides with the root's is **silently dropped from the list** and
 * cannot be started by either name. Nothing measured that. It is clean today —
 * 85 declared, 85 listed — and a check over a property the repository HAS is
 * what keeps it, which is `1xhc`'s own conclusion about wiring gates.
 *
 * A `calledElement` naming a process no file defines is NOT a finding. The
 * loader's own comment settles it: *"a folio may legitimately call out to a
 * process it does not host"*, and the call stays opaque by design. Counting it
 * would turn a modelling decision into a permanent red.
 *
 * ## For a MODULE, inference fails in both directions, so declaration wins
 *
 * Measured over 1834 tracked `.ts`: **710** are reached by no signal any grep
 * can see. That is not a findings list, it is noise — the great majority are
 * corpora discovered by directory walk (content blocks under `content/docs/`,
 * test files `bun test` globs), and inference cannot tell those from a module
 * nobody can run. A gate keyed on 710 findings is a gate switched off within a
 * week. So the number is PRINTED and never committed, and it is the whole
 * argument for `audit-coverage`'s rule: where a grep fails in both directions
 * at once, prefer a declaration.
 *
 * What IS a finding is a relation, and it is crisp: **the only thing that
 * reaches this module is its own test.** A test proves a module works; it does
 * not make it reachable. Nine modules today, `scripts/merge-queue.ts` first
 * among them — so this slice would have caught finding 1 on the day it landed.
 *
 * A module says how it IS reached with `@entrypoint` in its own docblock:
 *
 *     @entrypoint script:merge:steward
 *     @entrypoint none — written for the merge-steward tile, not built yet (bean `xxxx`)
 *     @entrypoint spawned by scripts/foo.sh
 *
 * A `script:<name>` claim is VERIFIED against `package.json`, because a
 * declaration that can be checked should be; the free-text form is recorded as
 * the author's assertion. Under-claiming is recoverable — the count says so out
 * loud. Over-claiming looks like reachability, which is the defect.
 *
 * ## Why a committed sidecar, and what it buys the soft family
 *
 * A printed verdict cannot tell *"nothing ever reached this"* from *"this lost
 * its caller in the commit under review"*. The sidecar holds the RELATION —
 * which decisions are evaluable, which diagrams the resolver reaches, which
 * modules only their tests reach — and not the census, because a census moves
 * on any commit that adds a file and a gate stale by default is one people
 * learn to regenerate without reading (`audit-coverage`, bean `xutg`).
 *
 * That is also how `module-test-only` bites without a red gate: a tenth
 * test-only module makes the sidecar STALE, `--check` fails, and the author's
 * regeneration puts the new module in the diff. The failure is not wired yet
 * because nine is a backlog rather than a defect; `--strict` is the flag for
 * the day it closes, and bean `dxqm` holds that.
 *
 * ## What `--check` fails on, and why it includes the hard families
 *
 * `audit:coverage` fails `--check` on staleness ALONE, because everything else
 * it reports is an unmet ambition. This one diverges on purpose: an unevaluable
 * decision table and an unreachable diagram are **broken artefacts**, not
 * ambitions, so they fail in the gate that runs on every push. The bare writer
 * stays exit-0 so that regenerating a sidecar can never be confused with the
 * defect, and `--check` does not write — a checker that repairs the staleness
 * it reports cannot be falsified (`generalise-the-fix` Move 3).
 *
 * Usage:
 *   bun run audit:reachability            # print the report, write the sidecar
 *   bun run audit:reachability --check    # ...fail on a stale sidecar OR a broken artefact; writes nothing
 *   bun run audit:reachability --strict   # ...and on a module only its own test reaches
 *
 * @module scripts/audit-reachability
 * @covers processes, code
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, normalize, relative } from "node:path";

import { instanceRootsIn, repoRootFor } from "../schemas/cat-harness.js";
import { gitFiles } from "../schemas/git-corpus.ts";
import { corpusScopeFor, workflowFiles } from "./known-skills.js";
import { processFiles } from "../src/tools/workflow.js";
import { loadProcessModel } from "../src/workflow/process-model.js";
import {
  listDecisions,
  loadDecisionTable,
  unreadableExpressions,
  type UnreadableExpression,
} from "../src/workflow/decision-table.js";
import { QA_RESULTS_DIR, buildQaResult, writeQaResult, type QaResult } from "./qa-results.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
const ROOT = join(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/**
 * How far before a path an invocation may stand and still count as running it.
 *
 * 120 characters. A real invocation puts the two next to each other — `run: bun
 * run <path>` is eight, `execFileSync("bun", ["run", <path>])` about twenty,
 * and the longest in this repository's workflows is a `working-directory` step
 * at under sixty. The measured false positive was **1050**, in a sentence
 * explaining the finding it cleared.
 *
 * It is a threshold, so it is a judgement, and the honest direction for it is
 * TIGHT: too tight produces a visible finding somebody answers in one line with
 * `@entrypoint`, while too loose hides one. That asymmetry is the only reason a
 * number is defensible here at all.
 */
const INVOKE_WINDOW = 120;

/**
 * An invocation — a runtime, a spawn, or this repo's in-process tool dispatch.
 *
 * `\b…\b` on both sides of every token. Unanchored at the tail, `\bexec`
 * matches **exec**utable and `\bdeno` matches **deno**minators, which are the
 * two words any docblock about this subject is certain to contain; both fired
 * in the measured false positive. `import(` keeps its own alternative because
 * a parenthesis is not a word character.
 */
const INVOKES = /\b(bunx?|node|tsx|deno|spawn|spawnSync|exec|execSync|execFile|execFileSync|inProcess)\b|\bimport\(/;

/**
 * Does an invocation stand close enough before `index` on this line to mean
 * that the path there is being RUN rather than written about?
 *
 * ## Measured on this file's own prose, twice
 *
 * The first version asked only whether the LINE carried a token anywhere, and
 * `scripts/artefact-verification.json` then cleared `merge-queue.ts`: the
 * declaration that this very gate obliged its author to write **says** that
 * `merge-train.bpmn` names `scripts/merge-queue.ts` in prose — and that
 * sentence, 1050 characters after the nearest token on a single JSON line,
 * counted as a caller.
 *
 * **Prose about a finding must not be able to clear it.** That is
 * `audit-coverage`'s *a measurement must not be a term in itself*, with the
 * term one file further out than this script's own sidecar exclusion reaches —
 * so an exclusion list could not have caught it and a position rule can.
 *
 * {@link INVOKE_WINDOW} is a threshold and therefore a judgement, and the
 * honest direction for it is TIGHT: too tight produces a visible finding
 * somebody answers in one line with `@entrypoint`, while too loose hides one.
 */
export function invocationBefore(line: string, index: number): boolean {
  return INVOKES.test(line.slice(Math.max(0, index - INVOKE_WINDOW), index));
}

/** This script's own sidecar, derived from the constants that write it. */
const SELF_SIDECAR_STEM = "audit-reachability";

// ── the declared corpus ─────────────────────────────────────────

/**
 * Every `.bpmn` and `.dmn` ANY instance declares, as absolute paths.
 *
 * The union over `instanceRootsIn`, not one instance's corpus scope: scoped
 * from `cat-harness` alone the walk sees 79 of the 85 diagrams, and the six it
 * misses are `bootstrap`'s. A denominator that quietly omits a dependency's
 * artefacts reports a clean run over them — `dh4f`, in the tool whose subject
 * is exactly that.
 */
export function declaredDiagrams(repo: string): { bpmn: string[]; dmn: string[]; instances: string[] } {
  const seen = new Set<string>();
  const instances: string[] = [];
  for (const inst of instanceRootsIn(repo)) {
    let files: string[];
    try {
      files = workflowFiles(inst, corpusScopeFor(inst));
    } catch {
      // An instance whose declaration will not resolve is reported by
      // `check:declared-dirs`; here it contributes nothing and is named.
      continue;
    }
    instances.push(relative(repo, inst) || ".");
    for (const f of files) seen.add(f);
  }
  const all = [...seen].sort();
  return {
    bpmn: all.filter((f) => f.endsWith(".bpmn")),
    dmn: all.filter((f) => f.endsWith(".dmn")),
    instances,
  };
}

// ── decisions ───────────────────────────────────────────────────

export interface DecisionReach {
  /** Repo-relative `.dmn` path. */
  file: string;
  /** The `<decision id>`, as the file declares it. */
  id: string;
  /** `evaluable` · `unevaluable` · `unloadable` */
  state: "evaluable" | "unevaluable" | "unloadable";
  /** Cells this repo's evaluator cannot read. Empty unless `unevaluable`. */
  unreadable: UnreadableExpression[];
  /** The loader's own message. Set only when `unloadable`. */
  why?: string;
  /**
   * Gateways pointing at `<file>#<id>`, across every declared diagram.
   *
   * A MEASUREMENT, never a finding: `kg-audit`'s `decision-outcomes-used`
   * already reports a decision no gateway references, and a second reader of
   * one relation is a second answer free to disagree.
   */
  referencedBy: string[];
}

export async function decisionReach(repo: string, dmn: string[], refs: Map<string, string[]>): Promise<DecisionReach[]> {
  const out: DecisionReach[] = [];
  for (const abs of dmn) {
    const file = relative(repo, abs);
    let declared: { id: string }[];
    try {
      declared = await listDecisions(abs);
    } catch (e) {
      out.push({
        file,
        id: "(file)",
        state: "unloadable",
        unreadable: [],
        why: `the file itself will not parse: ${msg(e)}`,
        referencedBy: [],
      });
      continue;
    }
    if (declared.length === 0) {
      out.push({
        file,
        id: "(none)",
        state: "unloadable",
        unreadable: [],
        why: "declares no <decision id=…>, so no gateway can name anything in it",
        referencedBy: [],
      });
      continue;
    }
    for (const d of declared) {
      const key = `${basename(abs)}#${d.id}`;
      const referencedBy = (refs.get(key) ?? []).sort();
      try {
        const table = await loadDecisionTable(abs, d.id);
        const unreadable = unreadableExpressions(table);
        out.push({
          file,
          id: d.id,
          state: unreadable.length > 0 ? "unevaluable" : "evaluable",
          unreadable,
          referencedBy,
        });
      } catch (e) {
        out.push({ file, id: d.id, state: "unloadable", unreadable: [], why: msg(e), referencedBy });
      }
    }
  }
  return out;
}

// ── processes ───────────────────────────────────────────────────

export interface ProcessReach {
  /** Repo-relative `.bpmn` path. */
  file: string;
  /** The `bpmn:process` id, when the diagram loads. */
  process?: string;
  /** `reachable` · `shadowed` · `unloadable` */
  state: "reachable" | "shadowed" | "unloadable";
  /** The file that claimed this one's stem, when `shadowed`. */
  shadowedBy?: string;
  /** The loader's own message, when `unloadable`. */
  why?: string;
}

/** Two declared artefacts answering to one name — `workflow_start` resolves one and silently not the other. */
export interface Ambiguity {
  /** `stem` (what `workflow_start` matches first) or `process-id` (its fallback). */
  on: "stem" | "process-id";
  name: string;
  files: string[];
}

export async function processReach(
  repo: string,
  bpmn: string[],
): Promise<{ rows: ProcessReach[]; ambiguous: Ambiguity[]; decisionRefs: Map<string, string[]> }> {
  // The list the engine itself serves, so this cannot disagree with it.
  const listed = new Set(processFiles(repo));
  const byStem = new Map<string, string[]>();
  for (const f of bpmn) {
    const stem = basename(f, ".bpmn");
    byStem.set(stem, [...(byStem.get(stem) ?? []), f]);
  }

  const rows: ProcessReach[] = [];
  const byId = new Map<string, string[]>();
  const decisionRefs = new Map<string, string[]>();
  for (const abs of bpmn) {
    const file = relative(repo, abs);
    let id: string | undefined;
    let why: string | undefined;
    try {
      const model = await loadProcessModel(abs);
      id = model.id;
      byId.set(id, [...(byId.get(id) ?? []), abs]);
      for (const n of model.nodes.values()) {
        if (!n.decisionRef) continue;
        const key = n.decisionRef.replace(/^decisions\//, "");
        decisionRefs.set(key, [...(decisionRefs.get(key) ?? []), `${basename(abs)}#${n.id}`]);
      }
    } catch (e) {
      why = msg(e);
    }
    if (why !== undefined) {
      rows.push({ file, state: "unloadable", why });
      continue;
    }
    if (listed.has(abs)) {
      rows.push({ file, process: id, state: "reachable" });
      continue;
    }
    const claimant = (byStem.get(basename(abs, ".bpmn")) ?? []).find((f) => f !== abs && listed.has(f));
    rows.push({
      file,
      process: id,
      state: "shadowed",
      shadowedBy: claimant ? relative(repo, claimant) : undefined,
      why: claimant
        ? "another declared diagram claimed its file stem, and `processFiles` keeps the first claimant"
        : "declared, and not in the list `workflow_list` serves — `workflow_start` cannot resolve it by stem or by process id",
    });
  }

  const ambiguous: Ambiguity[] = [
    ...[...byStem].filter(([, v]) => v.length > 1).map(([name, v]) => ({ on: "stem" as const, name, files: v.map((f) => relative(repo, f)).sort() })),
    ...[...byId].filter(([, v]) => v.length > 1).map(([name, v]) => ({ on: "process-id" as const, name, files: v.map((f) => relative(repo, f)).sort() })),
  ].sort((a, b) => (a.on + a.name).localeCompare(b.on + b.name));

  return { rows, ambiguous, decisionRefs };
}

// ── modules ─────────────────────────────────────────────────────

/**
 * A test file, by either of this repo's two conventions.
 *
 * Deliberately broad on the directory form: `test/` and `tests/` at any depth.
 * It is used for one thing only — splitting an orphaned entry point from a
 * latent one — so a runner that happens to live under `test/` (the health
 * sweep's `test/health/run.ts`) being counted as a test changes a label and
 * never a verdict.
 */
export function isTestModule(rel: string): boolean {
  return /(^|\/)tests?\//.test(rel) || /\.(test|spec|e2e)\.tsx?$/.test(rel);
}

/**
 * Every `@entrypoint` line in a module docblock.
 *
 * `^ \* @entrypoint ` — exactly one space, the star, exactly one space, for
 * `coversIn`'s reason: **a docblock that documents a tag necessarily contains
 * the tag**, and the three examples in THIS file's own header would otherwise
 * read as declarations. Indentation is the distinction JSDoc already provides.
 */
export function entrypointsIn(text: string): string[] {
  return [...text.matchAll(/^ \* @entrypoint (.+)$/gm)].map((m) => m[1]!.trim());
}

/** Does the module DECLARE itself runnable, and how? */
export interface ExecutableShape {
  shebang: boolean;
  /** An `import.meta.main` guard — a command-line branch. */
  mainGuard: boolean;
}

export function executableShape(src: string): ExecutableShape | undefined {
  const shebang = src.startsWith("#!");
  const mainGuard = /import\.meta\.main/.test(src);
  return shebang || mainGuard ? { shebang, mainGuard } : undefined;
}

export interface ModuleReach {
  /** Repo-relative module path. */
  file: string;
  /**
   * `invoked` — something runs it.
   * `declared` — nothing runs it, and it SAYS how it is reached.
   * `entry-point-orphan` — nothing runs it and nothing but a test imports it.
   * `entry-point-latent` — nothing runs it, and it IS a live library.
   */
  state: "invoked" | "declared" | "entry-point-orphan" | "entry-point-latent";
  shape: ExecutableShape;
  /** Where it is invoked from, when `invoked`. */
  via?: string;
  /** Non-test modules importing it. */
  importers: string[];
  /** Test modules importing it. */
  testImporters: string[];
  /** `@entrypoint` claims, when `declared`. */
  entrypoints?: string[];
  /** A `script:<name>` claim naming no `package.json` script. */
  brokenClaims?: string[];
}

/**
 * Which modules DECLARE themselves runnable, and which of those anything runs.
 *
 * ## The subject is a declaration, not a guess
 *
 * The first version of this asked *"is any module reached by nothing?"* and
 * answered **710 of 1834** — noise, not findings. The great majority were
 * corpora discovered by directory walk (content blocks under `content/docs/`,
 * schema modules a registry names, the tests `bun test` globs), and no
 * inference can tell those from a module nobody can run. A gate with 710
 * findings is a gate switched off in a week.
 *
 * Narrowing the SIGNALS did not fix it either: requiring an invocation verb
 * left 34 "only a test imports it" findings, most of them Zod schema modules a
 * declaration points at. **The fix was to narrow the SUBJECT.** A module with
 * a `#!` shebang or an `import.meta.main` guard has SAID it is runnable — that
 * is a declaration inside the file, which is what `directory-conventions`
 * insists a contract must be — and asking whether anything runs it is then a
 * question with one right answer. 440 modules declare it; 20 are run by
 * nothing, and `scripts/merge-queue.ts` is among them. So this slice would have
 * caught finding 1 on the day it landed.
 *
 * ## The two states must not collapse
 *
 * An unrun entry point on a module nothing else imports is a module that exists
 * only as a claim. An unrun entry point on a module twenty others import is a
 * dead CLI branch on a live library — a smaller thing, and a different piece of
 * work. One number for both would hide the first inside the second.
 */
export function moduleReach(repo: string): {
  rows: ModuleReach[];
  modules: number;
  executables: number;
} {
  const corpus = gitFiles(repo, (rel) => !rel.split("/").some((s) => s.startsWith(".")));
  const modules = corpus.files
    .map((abs) => relative(repo, abs))
    .filter((rel) => /\.tsx?$/.test(rel) && !rel.startsWith("node_modules/"))
    .sort();
  const moduleSet = new Set(modules);

  // Importers, resolved the way bun resolves them: a relative specifier, with
  // this repo's `.js`-for-`.ts` convention handled explicitly.
  const importers = new Map<string, Set<string>>();
  const text = new Map<string, string>();
  for (const rel of modules) {
    let src: string;
    try {
      src = readFileSync(join(repo, rel), "utf-8");
    } catch {
      continue;
    }
    text.set(rel, src);
    for (const m of src.matchAll(/(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g)) {
      const spec = m[1]!;
      if (!spec.startsWith(".")) continue;
      const base = normalize(join(dirname(rel), spec));
      const target = [base, base.replace(/\.js$/, ".ts"), base.replace(/\.js$/, ".tsx"), `${base}.ts`, `${base}.tsx`, join(base, "index.ts")].find((c) => moduleSet.has(c));
      if (!target || target === rel) continue;
      const set = importers.get(target) ?? new Set<string>();
      set.add(rel);
      importers.set(target, set);
    }
  }

  // ── named by something that RUNS it ───────────────────────────
  //
  // A path that merely APPEARS in another file is not a caller, and the
  // distinction is not pedantic — it decides whether this report can see
  // finding 1 at all. Measured 2026-10-04: crediting every textual mention
  // credited `scripts/merge-queue.ts`, because `merge-train.bpmn` and
  // `merge-priority.dmn` both NAME it in their `<bpmn:documentation>` prose,
  // and the generated glossary JSON carries that prose onward. A grep over
  // mentions clears the very defect this file exists to catch.
  //
  // So a mention counts only where an INVOCATION stands immediately before the
  // path. {@link invocationBefore} carries the rule and the two ways
  // "somewhere on the line" was measured to be wrong.
  const named = new Map<string, string>();
  // Suffix matching with at least one separator, because a workflow step with
  // a `working-directory` names `scripts/x.ts` for `cat-harness/scripts/x.ts`.
  // Never bare basenames: `index.ts` would then be reached by everything.
  const bySuffix = new Map<string, string[]>();
  for (const rel of modules) {
    const parts = rel.split("/");
    for (let k = parts.length - 2; k >= 0; k--) {
      const suffix = parts.slice(k).join("/");
      bySuffix.set(suffix, [...(bySuffix.get(suffix) ?? []), rel]);
    }
  }
  const noteNames = (src: string, where: string): void => {
    for (const line of src.split("\n")) {
      if (!INVOKES.test(line)) continue;
      for (const m of line.matchAll(/[\w./@-]+\.tsx?\b/g)) {
        // The window immediately before this path, not the whole line.
        if (!invocationBefore(line, m.index)) continue;
        const tok = m[0].replace(/^\.\//, "");
        for (const hit of moduleSet.has(tok) ? [tok] : (bySuffix.get(tok) ?? [])) {
          if (!named.has(hit)) named.set(hit, where);
        }
      }
    }
  };

  // This script's OWN sidecar is excluded, derived from the constants that
  // write it rather than spelled out. Its findings QUOTE the paths it reports,
  // so reading it would credit every module named in a finding with being
  // reached — and the report would clear itself, for ever, one run later.
  // `audit-coverage`'s rule: a measurement must not be a term in itself.
  const selfSidecar = join(ROOT, QA_RESULTS_DIR, `${SELF_SIDECAR_STEM}.qa-results.json`);
  for (const abs of corpus.files) {
    if (abs === selfSidecar) continue;
    const rel = relative(repo, abs);
    if (!/\.(json|ya?ml|sh|mjs|cjs|ts|tsx)$/.test(rel)) continue;
    try {
      noteNames(readFileSync(abs, "utf-8"), rel);
    } catch {
      /* unreadable is not a reachability claim */
    }
  }
  // The DOT-PREFIXED callers, read explicitly because `corpus` excludes every
  // dot segment and these are where most invocation lives: the workflows CI
  // runs, and the slash commands an agent types. Omitting them is not a
  // neutral simplification — measured, reading only `code-quality-gates.yml`
  // reported `minify-site.ts` and `staging-rotate.ts` as run by nothing, and
  // `feature-staging.yml` runs both.
  for (const d of [join(repo, ".github", "workflows"), join(repo, ".claude", "commands")]) {
    if (!existsSync(d)) continue;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      try {
        noteNames(readFileSync(join(d, e.name), "utf-8"), `${relative(repo, d)}/${e.name}`);
      } catch {
        /* ignore */
      }
    }
  }

  let scripts: Record<string, string> = {};
  try {
    scripts = (JSON.parse(readFileSync(join(repo, "package.json"), "utf-8")) as { scripts?: Record<string, string> }).scripts ?? {};
  } catch {
    scripts = {};
  }

  const rows: ModuleReach[] = [];
  let executables = 0;
  for (const rel of modules) {
    if (isTestModule(rel)) continue;
    const shape = executableShape(text.get(rel) ?? "");
    if (!shape) continue;
    executables++;
    const imps = [...(importers.get(rel) ?? [])].sort();
    const nonTest = imps.filter((i) => !isTestModule(i));
    const tests = imps.filter(isTestModule);
    const via = named.get(rel);
    if (via !== undefined) {
      rows.push({ file: rel, state: "invoked", shape, via, importers: nonTest, testImporters: tests });
      continue;
    }
    const claims = entrypointsIn(text.get(rel) ?? "");
    const broken = claims
      .filter((c) => c.startsWith("script:"))
      .map((c) => c.slice("script:".length).split(/\s/)[0]!)
      .filter((name) => scripts[name] === undefined);
    if (claims.length > 0) {
      rows.push({
        file: rel,
        state: "declared",
        shape,
        importers: nonTest,
        testImporters: tests,
        entrypoints: claims,
        ...(broken.length > 0 ? { brokenClaims: broken } : {}),
      });
      continue;
    }
    rows.push({
      file: rel,
      state: nonTest.length === 0 ? "entry-point-orphan" : "entry-point-latent",
      shape,
      importers: nonTest,
      testImporters: tests,
    });
  }
  return { rows: rows.sort((a, b) => a.file.localeCompare(b.file)), modules: modules.length, executables };
}

// ── report ──────────────────────────────────────────────────────

function msg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** The staleness key: the whole result. It carries no timestamp. */
function comparable(r: QaResult): string {
  return JSON.stringify(r);
}

/**
 * Is the committed sidecar what this run computed?
 *
 * `absent` is its own answer: under `--check`, no record at all reads
 * identically to a clean one if both are reported as "not stale".
 */
export function sidecarState(instanceRoot: string, fresh: QaResult): "absent" | "stale" | "current" {
  const p = join(instanceRoot, QA_RESULTS_DIR, `${SELF_SIDECAR_STEM}.qa-results.json`);
  if (!existsSync(p)) return "absent";
  try {
    return comparable(JSON.parse(readFileSync(p, "utf-8")) as QaResult) === comparable(fresh) ? "current" : "stale";
  } catch {
    return "stale";
  }
}

async function main(): Promise<number> {
  const check = process.argv.includes("--check");
  const strict = process.argv.includes("--strict");

  const { bpmn, dmn, instances } = declaredDiagrams(REPO);
  const { rows: processes, ambiguous, decisionRefs } = await processReach(REPO, bpmn);
  const decisions = await decisionReach(REPO, dmn, decisionRefs);
  const { rows: moduleRows, modules, executables } = moduleReach(REPO);

  // `generalise-the-fix` §1.2a: a sweep prints its own denominator. A report
  // over zero diagrams passes every assertion below and has measured nothing.
  if (bpmn.length === 0 || dmn.length === 0 || executables === 0) {
    console.log(
      `⚠ EXAMINED NOTHING — ${bpmn.length} diagram(s), ${dmn.length} decision file(s), ` +
        `${executables} self-declared executable(s) of ${modules} module(s)`,
    );
    return 1;
  }

  const unevaluable = decisions.filter((d) => d.state === "unevaluable");
  const unloadable = decisions.filter((d) => d.state === "unloadable");
  const shadowed = processes.filter((p) => p.state === "shadowed");
  const brokenProcesses = processes.filter((p) => p.state === "unloadable");
  const byModuleState = (s: ModuleReach["state"]): ModuleReach[] => moduleRows.filter((m) => m.state === s);
  const orphans = byModuleState("entry-point-orphan");
  const latent = byModuleState("entry-point-latent");
  const declaredModules = byModuleState("declared");
  const brokenClaims = declaredModules.filter((m) => (m.brokenClaims?.length ?? 0) > 0);

  console.log(
    `Reachability of declared executable artefacts  ` +
      `(${instances.length} instance(s): ${bpmn.length} .bpmn, ${dmn.length} .dmn holding ` +
      `${decisions.length} decision(s), ${executables} self-declared executable(s) of ${modules} module(s))`,
  );
  console.log("");

  const line = (mark: string, label: string, body: string): void => console.log(`  ${mark} ${label.padEnd(24)} ${body}`);
  line(
    unevaluable.length + unloadable.length > 0 ? "✗" : "✓",
    "decisions evaluable",
    `${decisions.length - unevaluable.length - unloadable.length} of ${decisions.length} — this repo's own evaluator reads every cell`,
  );
  line(
    shadowed.length + brokenProcesses.length + ambiguous.length > 0 ? "✗" : "✓",
    "diagrams reachable",
    `${processes.filter((p) => p.state === "reachable").length} of ${bpmn.length} resolve through \`processFiles\`; ${ambiguous.length} name clash(es)`,
  );
  line(
    orphans.length > 0 ? "~" : "✓",
    "entry points run",
    `${byModuleState("invoked").length} of ${executables} are run by something · ` +
      `${orphans.length} orphan(s) · ${latent.length} latent · ${declaredModules.length} declare \`@entrypoint\``,
  );
  console.log("");

  for (const d of [...unevaluable, ...unloadable]) {
    console.log(`✗ ${d.file}#${d.id} — ${d.state === "unloadable" ? "WILL NOT LOAD" : "CANNOT BE EVALUATED"}`);
    if (d.why) console.log(`    ${d.why}`);
    for (const u of d.unreadable) {
      console.log(`    rule ${u.rule}, ${u.side} column ${u.column} (${u.of}): \`${u.expression}\``);
      console.log(`      ${u.message}`);
    }
    console.log(
      `    referenced by ${d.referencedBy.length} gateway(s)${d.referencedBy.length > 0 ? `: ${d.referencedBy.join(", ")}` : ""}`,
    );
  }
  for (const p of [...shadowed, ...brokenProcesses]) {
    console.log(`✗ ${p.file} — ${p.state === "shadowed" ? "DECLARED AND UNREACHABLE" : "WILL NOT LOAD"}`);
    console.log(`    ${p.why}${p.shadowedBy ? ` (claimed by ${p.shadowedBy})` : ""}`);
  }
  for (const a of ambiguous) {
    console.log(`✗ ${a.files.length} diagrams answer to the same ${a.on} \`${a.name}\`: ${a.files.join(", ")}`);
  }
  for (const m of brokenClaims) {
    console.log(`✗ ${m.file} — @entrypoint names no package.json script: ${m.brokenClaims!.join(", ")}`);
  }
  if (orphans.length > 0) {
    console.log(
      `~ ${orphans.length} module(s) DECLARE themselves runnable, are run by nothing, and are imported by ` +
        `nothing but a test. A test proves a module works; it does not make it reachable. Wire it, or say ` +
        `how it IS reached with \`@entrypoint\`:`,
    );
    for (const m of orphans) {
      const how = [m.shape.shebang ? "shebang" : "", m.shape.mainGuard ? "import.meta.main" : ""].filter(Boolean).join(" + ");
      console.log(`    · ${m.file}  [${how}]${m.testImporters.length > 0 ? `  ← ${m.testImporters.join(", ")}` : "  ← nothing at all"}`);
    }
  }
  if (latent.length > 0) {
    console.log(
      `· ${latent.length} live librar(ies) carry a command-line entry point nothing runs — a dead branch ` +
        `on a module that is itself reached. Kept apart from the orphans on purpose: different work.`,
    );
  }

  const result = buildQaResult({
    script: relative(REPO, join(ROOT, "scripts", "audit-reachability.ts")),
    scriptAbsPath: join(ROOT, "scripts", "audit-reachability.ts"),
    subject: { kind: "audit-reachability", id: "declared-executable-artefacts" },
    families: {
      "decision-unevaluable": {
        summary:
          `A declared decision table this repository's OWN FEEL evaluator cannot read, cell by cell — ` +
          `the state \`merge-priority.dmn\` was in for two months while \`kg-audit\` recorded ` +
          `"result": "pass" over it. Load is not evaluability: the loader never looks inside a rule, and ` +
          `\`possibleOutcomes\` reads the first output column only. Fails \`--check\`, because an ` +
          `unevaluable table is a broken artefact rather than an unmet ambition.`,
        entries: [...unevaluable, ...unloadable].map((d) => ({
          file: d.file,
          decision: d.id,
          state: d.state,
          ...(d.why ? { why: d.why } : {}),
          unreadable: d.unreadable,
          referencedBy: d.referencedBy,
        })),
      },
      "process-unreachable": {
        summary:
          `A declared \`.bpmn\` the engine's own resolver cannot reach: shadowed out of \`processFiles\` ` +
          `by another diagram's file stem, or refusing to load. \`workflow_start\` matches on stem first ` +
          `and \`bpmn:process\` id second, both against that list, so a diagram missing from it cannot be ` +
          `started by either name. A \`calledElement\` with no host is NOT here — the loader permits an ` +
          `opaque call by design, and counting it would make a modelling decision a permanent red.`,
        entries: [...shadowed, ...brokenProcesses].map((p) => ({
          file: p.file,
          ...(p.process ? { process: p.process } : {}),
          state: p.state,
          ...(p.shadowedBy ? { shadowedBy: p.shadowedBy } : {}),
          why: p.why,
        })),
      },
      "process-ambiguous": {
        summary:
          `Two declared diagrams answering to one name. \`workflow_start\` resolves one of them and ` +
          `SILENTLY not the other, and \`workflowFile\` throws — so the second is unreachable with ` +
          `nothing saying it exists.`,
        entries: ambiguous,
      },
      "entrypoint-claim-broken": {
        summary:
          `A module whose \`@entrypoint script:<name>\` names no script in \`package.json\`. A declaration ` +
          `that can be checked is checked; the free-text forms are recorded as the author's assertion and ` +
          `not graded, because over-claiming looks like reachability while under-claiming says so out loud.`,
        entries: brokenClaims.map((m) => ({ file: m.file, claims: m.entrypoints, missing: m.brokenClaims })),
      },
      "entry-point-orphan": {
        summary:
          `A module that DECLARES itself runnable — a \`#!\` shebang or an \`import.meta.main\` guard — ` +
          `that nothing runs and nothing but a test imports. Finding 1's shape exactly: ` +
          `\`scripts/merge-queue.ts\` said in its own docblock that the merge steward called it, and the ` +
          `only thing reaching it was the test proving it worked. Reported rather than failed — ` +
          `\`--strict\` fails on it and bean \`folio-assistant-dxqm\` holds the day that wires. It bites ` +
          `anyway: one more entry makes this sidecar stale, \`--check\` fails, and the regeneration puts ` +
          `the new module in the diff.`,
        entries: orphans.map((m) => ({ file: m.file, shape: m.shape, testImporters: m.testImporters })),
      },
      "entry-point-latent": {
        summary:
          `A LIVE library carrying a command-line entry point nothing runs: the module is reached, its ` +
          `\`import.meta.main\` branch is not. Kept apart from the orphans because one number for both ` +
          `would hide a module that exists only as a claim inside a list of dead CLI branches — the ` +
          `\`typed-only\` split in \`audit-coverage\`, for the same reason.`,
        entries: latent.map((m) => ({ file: m.file, shape: m.shape, importers: m.importers.length })),
      },
      // Not findings. The MEASUREMENT, committed, so a reader with only this
      // file can tell "never asked" from "asked and clean" — the whole reason
      // this is a sidecar rather than console output. The CENSUS is printed and
      // not recorded: module totals move on any commit that adds a file, and a
      // gate stale by default is one people learn to regenerate without
      // reading (`audit-coverage`, bean `xutg`).
      "reachability-measured": {
        summary:
          `Every declared decision and diagram with its state, and the gateways pointing at each ` +
          `decision. Not findings: the relation itself, so a diff shows reachability moving. The ` +
          `reference counts are recorded and never graded — \`kg-audit\`'s \`decision-outcomes-used\` ` +
          `owns "no gateway references this decision", and a second reader of one relation is a second ` +
          `answer free to disagree with the first. Activity skill refs are owned by ` +
          `\`check:workflow-refs\` for the same reason and are not re-read here. ` +
          `${decisions.length} decision(s), ${bpmn.length} diagram(s), ${instances.length} declaring instance(s).`,
        entries: [
          ...decisions.map((d) => ({
            kind: "decision" as const,
            file: d.file,
            id: d.id,
            state: d.state,
            referencedBy: d.referencedBy,
          })),
          ...processes.map((p) => ({
            kind: "process" as const,
            file: p.file,
            id: p.process ?? "(unloadable)",
            state: p.state,
            referencedBy: [],
          })),
        ],
      },
      "entrypoint-declared": {
        summary:
          `A self-declared executable nothing runs that SAYS how it is reached. Recorded so a declaration ` +
          `cannot be confused with silence, and so a claim that goes stale shows up in a diff.`,
        entries: declaredModules.map((m) => ({ file: m.file, entrypoints: m.entrypoints, importers: m.importers.length })),
      },
    },
  });

  const state = sidecarState(ROOT, result);
  if (!check) writeQaResult(ROOT, SELF_SIDECAR_STEM, result);
  if (state !== "current") {
    const where = relative(REPO, join(ROOT, QA_RESULTS_DIR, `${SELF_SIDECAR_STEM}.qa-results.json`));
    const what = state === "absent" ? `no committed sidecar at ${where}` : `the committed sidecar at ${where} disagrees with this run`;
    console.log(check ? `\n✗ ${what} — run \`bun run audit:reachability\` and commit it.` : `\n· ${what} — written.`);
  }

  // The hard families fail wherever the GATE runs; the bare writer stays
  // exit-0 so regenerating a sidecar is never confused with the defect.
  const broken =
    unevaluable.length + unloadable.length + shadowed.length + brokenProcesses.length + ambiguous.length + brokenClaims.length;
  if (check && (state !== "current" || broken > 0)) return 1;
  if (strict && orphans.length > 0) return 1;
  return 0;
}

if (import.meta.main) process.exit(await main());
