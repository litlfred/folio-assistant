/**
 * Discovery must resolve exactly what the old dispatch tables resolved, and
 * must report the two ways the registry and the checker files can disagree.
 *
 * The equivalence test is the load-bearing one: replacing a hardcoded table
 * with a lookup is only safe if the lookup finds the same functions, and
 * "finds a function with the right name" is not the same claim as "finds the
 * same function object".
 *
 * @module scripts/tests/qa-checker-discovery.test
 */
import { describe, test, expect } from "bun:test";

import {
  checkerFunctionName,
  criterionSubject,
  discoverBlockCheckers,
  discoverScriptCheckers,
} from "../../content/pipeline/qa-checker-discovery.ts";
import { QA_CRITERIA_REGISTRY } from "../../content/pipeline/qa-criteria-registry.ts";

const block = await discoverBlockCheckers();
const script = await discoverScriptCheckers();

describe("checkerFunctionName", () => {
  test("kebab-case ids", () => {
    expect(checkerFunctionName("dak-bpmn-has-process")).toBe("checkDakBpmnHasProcess");
  });

  test("snake_case ids — the script axis uses them", () => {
    expect(checkerFunctionName("does_not_default_to_float")).toBe("checkDoesNotDefaultToFloat");
  });

  test("a single word", () => {
    expect(checkerFunctionName("deprecated")).toBe("checkDeprecated");
  });
});

describe("subject partition", () => {
  test("absent means block", () => {
    expect(criterionSubject({ id: "x", domain: "d", description: "", default_severity: "minor", depends_on: [], automated: true })).toBe("block");
  });

  test("every script-quality criterion declares subject: script", () => {
    const undeclared = QA_CRITERIA_REGISTRY.filter(
      (c) => c.domain === "script-quality" && criterionSubject(c) !== "script",
    );
    expect(undeclared.map((c) => c.id)).toEqual([]);
  });

  test("the two sets are disjoint", () => {
    const both = [...block.checkers.keys()].filter((id) => script.checkers.has(id));
    expect(both).toEqual([]);
  });

  test("a script checker never lands in the block set", () => {
    // The failure this guards is silent, not loud: handed a CheckerPaths
    // object where it expects a path, a script checker reads
    // "[object Object]" off disk and reports a clean file.
    expect(block.checkers.has("does_not_default_to_float")).toBe(false);
    expect(script.checkers.has("does_not_default_to_float")).toBe(true);
  });
});

describe("every automated criterion resolves, from the module the registry names", () => {
  // This replaced an equivalence check against the merged `AUTOMATED_CHECKERS`
  // table. That assertion was TRANSITIONAL — it proved the migration faithful
  // at the commit that made it — and keeping it meant keeping a six-way
  // aggregation alive with no production caller, purely as a fixture. The
  // durable invariant is the one below: each criterion resolves, and it
  // resolves from the file the registry declares, which is also the file whose
  // hash invalidates its verdicts.

  test("every automated block criterion resolves", () => {
    const automated = QA_CRITERIA_REGISTRY.filter(
      (c) => c.automated && criterionSubject(c) === "block",
    ).map((c) => c.id);
    expect(automated.length).toBeGreaterThan(50);
    expect(automated.filter((id) => !block.checkers.has(id))).toEqual([]);
  });

  test("each checker comes from the module the registry DECLARES", async () => {
    // Not merely "a function by that name exists somewhere". `source_file` is
    // what `script_hash` is computed over, so a checker resolved from any
    // other module would have its verdicts invalidated by the wrong file's
    // changes — the defect that motivated discovery in the first place.
    const { getCriterionSourceFile } = await import(
      "../../content/pipeline/qa-criteria-registry.ts"
    );
    const root = new URL("../..", import.meta.url).pathname;
    for (const [id, fn] of block.checkers) {
      const mod = (await import(`${root}/${getCriterionSourceFile(id)}`)) as Record<string, unknown>;
      const found = Object.values(mod).some(
        (v) =>
          v === fn ||
          (v !== null && typeof v === "object" && (v as Record<string, unknown>)[id] === fn),
      );
      expect(found).toBe(true);
    }
  });
});

describe("the two disagreements are reported, not swallowed", () => {
  test("nothing automated is unimplemented right now", () => {
    expect(block.unimplemented).toEqual([]);
    expect(script.unimplemented).toEqual([]);
  });

  test("a checker for a criterion declared automated: false is an orphan", () => {
    // Found on the first run. It has never executed: the sweep short-circuits
    // to needs-agent before dispatch, so this is code with no caller.
    const ids = block.orphaned.map((o) => o.criterion);
    expect(ids).toContain("voice-statement-no-interpretation");
  });

  test("every orphan names a criterion the registry really declares non-automated", () => {
    for (const o of block.orphaned) {
      const def = QA_CRITERIA_REGISTRY.find((c) => c.id === o.criterion);
      expect(def?.automated).toBe(false);
    }
  });
});
