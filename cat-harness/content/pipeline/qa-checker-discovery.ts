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

async function discoverFor<T>(subject: QaCriterionSubject): Promise<CheckerDiscovery<T>> {
  const checkers = new Map<string, T>();
  const unimplemented: UnimplementedCriterion[] = [];
  const orphaned: CheckerDiscovery<T>["orphaned"] = [];
  const modules = new Map<string, Record<string, unknown>>();

  const load = (abs: string): Record<string, unknown> | undefined => modules.get(abs);

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

    let mod = modules.get(abs);
    if (!mod) {
      try {
        // A VARIABLE specifier: the target comes from the criterion, so this
        // module names no checker file and depends on none.
        mod = (await import(abs)) as Record<string, unknown>;
      } catch (e) {
        unimplemented.push({
          criterion: def.id,
          sourceFile,
          reason: `module did not load: ${e instanceof Error ? e.message : String(e)}`,
        });
        continue;
      }
      modules.set(abs, mod);
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
 * any one export is a `const` still in its temporal dead zone — which happens
 * when the module is part of an import cycle and is being read while it is
 * mid-evaluation. Measured 2026-09-21: `qa-checkers-extended.ts`'s
 * `EXTENDED_AUTOMATED_CHECKERS`, reached through such a cycle, took down a
 * sweep that had nothing to do with it.
 *
 * Skipping an unreadable binding is right rather than merely convenient: a
 * value that cannot be read is not a dispatch table, and the alternative is
 * that one cycle anywhere in the corpus silently costs every criterion its
 * checker. The cycle itself is NOT fixed here and is not claimed to be — this
 * makes discovery survive it and say nothing false about it.
 */
function moduleValues(mod: Record<string, unknown>): unknown[] {
  // `Object.keys` ITSELF throws here, which is why the guard is around the
  // whole thing rather than around each read: a module namespace in a cycle
  // answers its ownKeys trap by evaluating, and one binding in its temporal
  // dead zone rejects the enumeration outright.
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

/** A dispatch-table entry keyed by the id, else `check<PascalCaseId>`. */
function findChecker<T>(mod: Record<string, unknown>, criterionId: string): T | undefined {
  for (const value of moduleValues(mod)) {
    if (value && typeof value === "object" && criterionId in (value as Record<string, unknown>)) {
      const entry = (value as Record<string, unknown>)[criterionId];
      if (typeof entry === "function") return entry as T;
    }
  }
  const named = mod[checkerFunctionName(criterionId)];
  return typeof named === "function" ? (named as T) : undefined;
}
