/**
 * Find a criterion's checker by asking the graph, not by importing it.
 *
 * `qa-sweep.ts` dispatched like this:
 *
 * ```ts
 * const checker = AUTOMATED_CHECKERS[id] ?? DAK_AUTOMATED_CHECKERS[id];
 * ```
 *
 * — the generic sweep naming one adapter's checker table. That is a
 * wrong-direction dependency (core → smart-base) and it does not generalise:
 * a third adapter is a third `??`, and a folio bringing its own criteria has
 * nowhere to put them.
 *
 * ## The graph already knows
 *
 * Every automated criterion declares where its checker lives —
 * `QaCriterionDefinition.source_file`, resolved through
 * `getCriterionSourceFile()`. That field already exists and is already
 * load-bearing: it is what `script_hash` is computed over, so a criterion
 * pointed at the wrong file never invalidates.
 * `scripts/tests/qa-criterion-source-file.test.ts` pins declared == actual for
 * every automated criterion, which is exactly the guarantee discovery needs.
 *
 * So the dispatch table was a second answer to a question the registry already
 * answered, and the two were free to disagree.
 *
 * ## Why this removes an import edge rather than hiding one
 *
 * The module specifier is a **variable**, read from the criterion.
 * `repo-partition` counts a dynamic `import("./literal")` as an edge and a
 * variable one as no edge, and that is the right distinction rather than a
 * loophole: the edge disappears exactly when the target stops being
 * hardcoded. Nothing here names `qa-checkers-dak.ts`; it is reached because a
 * `dak-*` criterion says so.
 *
 * ## Two subjects, declared not inferred
 *
 * A criterion audits a **block** (its checker takes {@link CheckerPaths}) or a
 * **script** (its checker takes a path string). Discovery partitions on the
 * declared `subject` field, never on the domain name: `script-quality` is a
 * bucket label, and a second script axis under any other name would otherwise
 * be handed to the block sweep and receive a `CheckerPaths` object where its
 * checker expects a string.
 *
 * ## Resolved once, up front
 *
 * The sweep's inner loop is synchronous and hot, so discovery is one pass
 * before it and the loop reads a Map. A criterion whose module exports no
 * checker is **reported**, not silently folded into "needs an agent":
 * "declared automated but nothing implements it" and "deliberately needs an
 * agent" are different facts with different fixes, and the sweep already
 * records the second.
 *
 * @module content/pipeline/qa-checker-discovery
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import type {
  CheckerPaths,
  CheckerResult,
  QaCriterionDefinition,
  QaCriterionSubject,
} from "../../schemas/block-qa";
import {
  QA_CRITERIA_REGISTRY,
  getCriterionSourceFile,
} from "./qa-criteria-registry";

const ROOT = resolve(import.meta.dir, "../..");

/** Audits one content block against its companion files. */
export type BlockChecker = (paths: CheckerPaths) => CheckerResult;
/** Audits one source script, given its absolute path. */
export type ScriptChecker = (scriptPath: string) => CheckerResult;

/**
 * `does_not_default_to_float` → `checkDoesNotDefaultToFloat`;
 * `dak-bpmn-has-process` → `checkDakBpmnHasProcess`.
 *
 * Both separators, because the corpus uses both: the script axis is
 * snake_case and everything else is kebab-case.
 */
export function checkerFunctionName(criterionId: string): string {
  const pascal = criterionId
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return `check${pascal}`;
}

/** An automated criterion whose declared module yielded no checker. */
export interface UnimplementedCriterion {
  criterion: string;
  sourceFile: string;
  reason: string;
}

export interface CheckerDiscovery<T> {
  /** Criterion id → its checker, for every one that resolved. */
  checkers: Map<string, T>;
  /**
   * Automated criteria whose declared module exports no checker under either
   * convention. Never rendered as a pass and never as "needs an agent".
   */
  unimplemented: UnimplementedCriterion[];
  /**
   * The opposite disagreement: a criterion the registry declares
   * `automated: false`, whose declared module nevertheless exports a checker
   * for it. That checker has never run — the sweep short-circuits to
   * "needs-agent" before reaching dispatch — so it is code with no caller and
   * no test coverage from the sweep, aging against a criterion nobody is
   * running it on.
   *
   * It is reported rather than resolved because the fix is a judgement: either
   * the criterion should be `automated: true` and the checker is finished, or
   * the checker was abandoned and should go. Discovery cannot tell which, and
   * guessing either way is worse than saying so. Found on the first run:
   * `voice-statement-no-interpretation`.
   */
  orphaned: Array<{ criterion: string; sourceFile: string }>;
}

/**
 * A module the sweep tried to load: its namespace, or why it would not load.
 *
 * The failure is remembered rather than retried because **a second dynamic
 * import of a module whose evaluation threw does not throw again**. Measured
 * on Bun 1.3.11, in eight lines and with no import cycle anywhere:
 *
 * ```ts
 * // boom.ts:  export const BEFORE = 1; const _ = explode(); export const AFTER = {};
 * await import("./boom.ts");   // REJECTS: "top-level failure"
 * const mod = await import("./boom.ts");   // RESOLVES
 * Object.keys(mod);            // THROWS: Cannot access 'AFTER' before initialization
 * ```
 *
 * The second import hands back the namespace of a module whose body aborted
 * partway, so every binding after the throw is still in its temporal dead
 * zone. Several criteria share one checker file, so discovery imported the
 * same path once per criterion and hit exactly that: the first got an honest
 * "module did not load", and the second took down the sweep.
 *
 * Caching the failure fixes it at the cause. Every criterion in a file that
 * would not load now gets the same reason, which is also the more useful
 * report — one broken checker module is one finding, not one finding and a
 * crash.
 */
export type LoadedModule = Record<string, unknown> | { loadError: string };

/** Absent `subject` means `"block"` — see the field's own documentation. */
export function criterionSubject(def: QaCriterionDefinition): QaCriterionSubject {
  return def.subject ?? "block";
}

/**
 * Load every automated block criterion's checker from the module the registry
 * names. One pass; call it before the sweep loop, not inside it.
 */
export function discoverBlockCheckers(): Promise<CheckerDiscovery<BlockChecker>> {
  return discoverFor<BlockChecker>("block");
}

/** The same, for the script axis. */
export function discoverScriptCheckers(): Promise<CheckerDiscovery<ScriptChecker>> {
  return discoverFor<ScriptChecker>("script");
}

/**
 * Import a checker module at most once, remembering a failure as a failure.
 *
 * Exported for {@link LoadedModule}'s test: the behaviour it guards against is
 * a platform one, so it is pinned against a fixture that throws rather than
 * against the corpus, which is green and therefore proves nothing here.
 *
 * The specifier is a VARIABLE — the target comes from the criterion — so this
 * module names no checker file and depends on none.
 */
export async function loadCheckerModule(
  abs: string,
  cache: Map<string, LoadedModule>,
): Promise<LoadedModule> {
  const seen = cache.get(abs);
  if (seen) return seen;
  let mod: LoadedModule;
  try {
    mod = (await import(abs)) as Record<string, unknown>;
  } catch (e) {
    mod = { loadError: e instanceof Error ? e.message : String(e) };
  }
  cache.set(abs, mod);
  return mod;
}

async function discoverFor<T>(subject: QaCriterionSubject): Promise<CheckerDiscovery<T>> {
  const checkers = new Map<string, T>();
  const unimplemented: UnimplementedCriterion[] = [];
  const orphaned: CheckerDiscovery<T>["orphaned"] = [];
  const modules = new Map<string, LoadedModule>();

  const load = (abs: string): Record<string, unknown> | undefined => {
    const seen = modules.get(abs);
    return seen && !("loadError" in seen) ? seen : undefined;
  };

  for (const def of QA_CRITERIA_REGISTRY) {
    if (criterionSubject(def) !== subject) continue;
    const sourceFile = getCriterionSourceFile(def.id);
    const abs = join(ROOT, sourceFile);

    if (!def.automated) {
      // Only reported off an ALREADY-loaded module. Importing a module for a
      // criterion nobody automates would make every sweep pay for a report,
      // and the automated criteria sharing that file load it anyway.
      const seen = load(abs);
      if (seen && findChecker<T>(seen, def.id)) orphaned.push({ criterion: def.id, sourceFile });
      continue;
    }

    if (!existsSync(abs)) {
      unimplemented.push({
        criterion: def.id,
        sourceFile,
        reason: "declared source file does not exist",
      });
      continue;
    }

    const mod = await loadCheckerModule(abs, modules);
    if ("loadError" in mod) {
      unimplemented.push({
        criterion: def.id,
        sourceFile,
        reason: `module did not load: ${mod.loadError}`,
      });
      continue;
    }

    const found = findChecker<T>(mod, def.id);
    if (found) checkers.set(def.id, found);
    else {
      unimplemented.push({
        criterion: def.id,
        sourceFile,
        reason: `exports neither a dispatch-table entry "${def.id}" nor ${checkerFunctionName(def.id)}()`,
      });
    }
  }

  return { checkers, unimplemented, orphaned };
}

/**
 * Every export of `mod` that can actually be read right now.
 *
 * `Object.values` is what this used to be, and it CRASHES THE WHOLE SWEEP when
 * any one export is a `const` still in its temporal dead zone — `Object.keys`
 * throws too, which is why the guard is around the whole enumeration rather
 * than around each read.
 *
 * **The cause was NOT an import cycle**, though this comment and the commit
 * that added the guard (`fd57e83c`) both said so. Measured 2026-09-21 by
 * reproducing the failure at that commit's parent and instrumenting it: there
 * is no runtime import cycle in this repository, then or now. The half-
 * evaluated module came from a second dynamic import of a module whose
 * evaluation had already thrown — see {@link LoadedModule}, which fixes that
 * at the cause. `qa-checkers-extended.ts` aborted at its top-level
 * `findContentRepoRoot()` on an unparseable declaration, thousands of lines
 * above where `EXTENDED_AUTOMATED_CHECKERS` is declared.
 *
 * Caching the failure is the repair; this is the second half, and it is NOT
 * redundant. A module registry is keyed by path and shared by the whole
 * process, so a module some OTHER caller already imported twice is already
 * poisoned before discovery sees it: `loadCheckerModule` then caches a
 * namespace, not a failure, and only this guard stands between that and a
 * crashed sweep. Pinned by `checker-module-load-failure.test.ts`, which
 * reaches `findChecker` with exactly such a namespace.
 *
 * Over the corpus as it stands the guard changes nothing — discovery yields
 * the same 63 block and 10 script checkers with it removed. Do not read that
 * as dead code, and do not go looking for the cycle; it is not there.
 */
function moduleValues(mod: Record<string, unknown>): unknown[] {
  // `Object.keys` ITSELF throws on such a namespace, so the guard has to be
  // around the enumeration and not only around each read.
  let keys: string[];
  try {
    keys = Object.keys(mod);
  } catch {
    return [];
  }
  const out: unknown[] = [];
  for (const key of keys) {
    try {
      out.push(mod[key]);
    } catch {
      // In its temporal dead zone — see above.
    }
  }
  return out;
}

/**
 * A dispatch-table entry keyed by the id, else `check<PascalCaseId>`.
 *
 * Exported so the guard in {@link moduleValues} can be pinned against a
 * poisoned namespace — see `checker-module-load-failure.test.ts`.
 */
export function findChecker<T>(mod: Record<string, unknown>, criterionId: string): T | undefined {
  for (const value of moduleValues(mod)) {
    if (value && typeof value === "object" && criterionId in (value as Record<string, unknown>)) {
      const entry = (value as Record<string, unknown>)[criterionId];
      if (typeof entry === "function") return entry as T;
    }
  }
  const named = mod[checkerFunctionName(criterionId)];
  return typeof named === "function" ? (named as T) : undefined;
}
