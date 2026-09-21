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
 * A module the sweep tried to load: its namespace, or why it would not load.
 *
 * The failure is remembered rather than retried, and that is not an
 * optimisation — **a second dynamic import of a module whose evaluation threw
 * does not throw again.** Measured on Bun 1.3.11, in eight lines and with no
 * import cycle anywhere:
 *
 * ```ts
 * // boom.ts:  export const BEFORE = 1; const _ = explode(); export const AFTER = {};
 * await import("./boom.ts");             // REJECTS: "top-level failure"
 * const mod = await import("./boom.ts"); // RESOLVES
 * Object.keys(mod);                      // THROWS: Cannot access 'AFTER' before initialization
 * ```
 *
 * The single-import case rejects correctly, which is why one import proves
 * nothing. Several criteria share one checker file, so discovery imported the
 * same path once per criterion and hit exactly that: the first got the real
 * error, and every one after it got the half-built namespace that
 * {@link readModule} exists to survive.
 *
 * Caching keeps the CAUSE. Without it the first criterion reports
 * `cold-chain-guidance.config.json is not valid JSON` and its siblings report
 * "module did not finish evaluating" — the symptom {@link readModule}
 * correctly declines to guess past. One broken checker module should be one
 * finding, stated once, in the words of the thing that actually failed.
 */
export type LoadedModule = Record<string, unknown> | { loadError: string };

/**
 * Import a checker module at most once, remembering a failure as a failure.
 *
 * Exported for its test: the behaviour it guards against is the platform's, so
 * it is pinned against a fixture that throws rather than against the corpus,
 * which is green and therefore proves nothing here.
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
      const seenRead = seen && readModule(seen);
      if (seenRead && findChecker<T>(seenRead, def.id)) orphaned.push({ criterion: def.id, sourceFile });
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

    // READ BEFORE ASKING. A namespace that cannot be enumerated belongs to a
    // module that threw while evaluating, and saying it "exports neither" a
    // checker would be a determined answer about a file nobody could read.
    // `await import()` above does not always re-throw for such a module — it
    // can hand back the half-built namespace — so this is the only place the
    // distinction can still be made.
    const read = readModule(mod);
    if (read === undefined) {
      unimplemented.push({
        criterion: def.id,
        sourceFile,
        reason:
          "module did not finish evaluating — its exports were never bound, so nothing here " +
          "can say whether it implements this criterion. The real error is at that module's " +
          "own top level; this is the symptom.",
      });
      continue;
    }

    const found = findChecker<T>(read, def.id);
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
 * A module namespace read safely, or `undefined` when it CANNOT BE READ AT
 * ALL — which means the module threw while evaluating.
 *
 * ## What actually happens, corrected 2026-09-21
 *
 * This was introduced (PR #695) with the diagnosis *"the module is part of an
 * import cycle and is being read while it is mid-evaluation"*. **That was
 * wrong, and measuring said so**: the import graph has 950 modules and exactly
 * two strongly-connected components, and neither contains
 * `qa-checkers-extended.ts`. There is no cycle.
 *
 * The real mechanism is a **module-scope side effect that throws**.
 * `qa-checkers-extended.ts` opens with `const REPO_ROOT =
 * findContentRepoRoot()`, and that resolved through a declaration which would
 * not parse. Evaluation aborted at line 49, so `EXTENDED_AUTOMATED_CHECKERS`
 * three thousand lines below was never bound — and a later `await import()`
 * handed back the half-built namespace rather than re-throwing. Reading any
 * binding on it, or even enumerating its keys, then raises "Cannot access X
 * before initialization", naming a symptom three thousand lines from the
 * cause.
 *
 * `findContentRepoRoot` no longer throws there (same PR), but the shape
 * remains reachable: a dozen pipeline modules do filesystem work at module
 * scope, and any of them can fail the same way.
 *
 * ## Why the namespace is read through here at all
 *
 * `Object.keys` ITSELF throws on such a namespace — the ownKeys trap
 * evaluates — so the guard has to wrap the enumeration rather than each read.
 *
 * **And the failure has to keep its own name.** The first version returned an
 * empty list, which made `discoverFor` report *"exports neither a dispatch-
 * table entry nor check<Id>()"* — a DETERMINED, FALSE statement about a module
 * nobody could read. Returning `undefined` is what lets the caller say "did
 * not load" instead, which is the difference between a third state and a
 * wrong answer.
 */
export interface ModuleRead {
  /** Readable exports, in enumeration order. */
  values: unknown[];
  /** One export by name, `undefined` if it is unreadable or absent. */
  byName(name: string): unknown;
}

export function readModule(mod: Record<string, unknown>): ModuleRead | undefined {
  let keys: string[];
  try {
    keys = Object.keys(mod);
  } catch {
    return undefined; // the module never finished evaluating
  }
  const values: unknown[] = [];
  for (const key of keys) {
    try {
      values.push(mod[key]);
    } catch {
      // One binding unreadable while the rest are fine: skip it. A value that
      // cannot be read is not a dispatch table.
    }
  }
  return {
    values,
    byName(name) {
      try {
        return mod[name];
      } catch {
        return undefined;
      }
    },
  };
}

/** A dispatch-table entry keyed by the id, else `check<PascalCaseId>`. */
function findChecker<T>(read: ModuleRead, criterionId: string): T | undefined {
  for (const value of read.values) {
    if (value && typeof value === "object" && criterionId in (value as Record<string, unknown>)) {
      const entry = (value as Record<string, unknown>)[criterionId];
      if (typeof entry === "function") return entry as T;
    }
  }
  const named = read.byName(checkerFunctionName(criterionId));
  return typeof named === "function" ? (named as T) : undefined;
}
