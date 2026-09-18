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
import { AUTOMATED_CHECKERS } from "../../content/pipeline/qa-checkers-voice.ts";
import { DAK_AUTOMATED_CHECKERS } from "../../content/pipeline/qa-checkers-dak.ts";

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

describe("equivalence with the dispatch tables it replaced", () => {
  const table = new Map<string, unknown>([
    ...Object.entries(AUTOMATED_CHECKERS),
    ...Object.entries(DAK_AUTOMATED_CHECKERS),
  ]);

  test("every automated block criterion resolves", () => {
    const automated = QA_CRITERIA_REGISTRY.filter(
      (c) => c.automated && criterionSubject(c) === "block",
    ).map((c) => c.id);
    expect(automated.length).toBeGreaterThan(50);
    expect(automated.filter((id) => !block.checkers.has(id))).toEqual([]);
  });

  test("it finds the SAME function object, not merely one by that name", () => {
    const differs = [...block.checkers.keys()].filter(
      (id) => table.has(id) && table.get(id) !== block.checkers.get(id),
    );
    expect(differs).toEqual([]);
  });

  test("it resolves nothing the tables did not", () => {
    expect([...block.checkers.keys()].filter((id) => !table.has(id))).toEqual([]);
  });

  test("what the tables hold beyond it is registered-elsewhere, not lost", () => {
    // The tables carry checkers for criteria this folio's registry does not
    // register: the `q-usage` axis is folio-optional (`folioOptionalAxes()`),
    // so those criteria are absent here and present in a folio that opts in.
    // Discovery follows the registry, which is the point.
    const extra = [...table.keys()].filter((id) => !block.checkers.has(id));
    const registered = new Set(QA_CRITERIA_REGISTRY.map((c) => c.id));
    for (const id of extra) {
      const inRegistry = registered.has(id);
      // Either the criterion is not registered in this folio at all, or it is
      // registered as needing an agent — in which case it is an orphan, and
      // the next describe asserts it is reported as one.
      expect(inRegistry ? block.orphaned.some((o) => o.criterion === id) : true).toBe(true);
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
