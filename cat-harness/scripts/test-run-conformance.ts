/**
 * Does a recorded test run test the skill it names, as that skill specifies?
 *
 * A test run points at the skill it tests (`TestRun.skill`, #1168 B4); the
 * skill points at its contracts (`input:`/`output:` in its front matter, B3b).
 * Following the two pointers gives the question this module answers for every
 * recorded case: does what went in fit the skill's input contract, and does
 * what came out fit its output contract? A run whose cases do not fit measured
 * something other than the skill it claims.
 *
 * Three answers, kept apart, because a check that folds "could not check"
 * into "passed" reports a clean run over nothing:
 *
 * - `unresolved` — the run does not parse, or names no skill that exists;
 * - `nonconforming` — a case violates the contract;
 * - `unchecked` — the skill declares no contract, the contract is external
 *   (not fetched here), or the run records no cases.
 *
 * The contract is read as JSON Schema by Zod's own `fromJSONSchema`: the JSON
 * files are the contract, and no second schema is authored beside them
 * (bean `319n`).
 *
 * @module scripts/test-run-conformance
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fromJSONSchema, type ZodType } from "zod";
import { TestRunSchema } from "../schemas/test-run.js";
import { contractFile, skillContracts } from "./skill-contracts.js";

export interface RunFinding {
  where: string;
  detail: string;
}

export interface TestRunConformance {
  unresolved: RunFinding[];
  nonconforming: RunFinding[];
  unchecked: RunFinding[];
  /** Runs whose every case was checked against both contracts. */
  checked: number;
  /** Every `*.test-run.json` found. */
  runs: number;
}

/** The `*.test-run.json` files directly under `dir`. */
export function testRunFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".test-run.json"))
    .sort()
    .map((f) => join(dir, f));
}

/** At most this many violations are listed per run; the count is always given. */
const SHOWN = 3;

export function checkTestRuns(root: string, resultsDir: string, knownSkills: Set<string>): TestRunConformance {
  const out: TestRunConformance = { unresolved: [], nonconforming: [], unchecked: [], checked: 0, runs: 0 };
  const contracts = skillContracts(root);
  const schemaCache = new Map<string, ZodType | Error>();
  const load = (ref: string): ZodType | Error | undefined => {
    const f = contractFile(root, ref);
    if (f === undefined) return undefined;
    if (!schemaCache.has(f)) {
      try {
        schemaCache.set(f, fromJSONSchema(JSON.parse(readFileSync(f, "utf-8"))));
      } catch (e) {
        schemaCache.set(f, e instanceof Error ? e : new Error(String(e)));
      }
    }
    return schemaCache.get(f);
  };

  for (const file of testRunFiles(resultsDir)) {
    out.runs++;
    const where = relative(root, file);
    const parsed = TestRunSchema.safeParse(JSON.parse(readFileSync(file, "utf-8")));
    if (!parsed.success) {
      out.unresolved.push({ where, detail: `does not parse as a test run: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}` });
      continue;
    }
    const run = parsed.data;
    if (!knownSkills.has(run.skill)) {
      out.unresolved.push({ where, detail: `names skill "${run.skill}", which does not exist.` });
      continue;
    }
    const c = contracts.get(run.skill);
    if (c?.input === undefined || c.output === undefined) {
      out.unchecked.push({ where, detail: `skill "${run.skill}" declares no ${c?.input === undefined ? "input" : "output"} contract, so its cases cannot be checked.` });
      continue;
    }
    if (run.cases === undefined || run.cases.length === 0) {
      out.unchecked.push({ where, detail: "records no cases — only aggregates, which no contract can check." });
      continue;
    }
    const input = load(c.input);
    const output = load(c.output);
    if (input === undefined || output === undefined) {
      out.unchecked.push({ where, detail: `skill "${run.skill}" has an external contract, which this offline check does not fetch.` });
      continue;
    }
    if (input instanceof Error || output instanceof Error) {
      const e = input instanceof Error ? input : (output as Error);
      out.unresolved.push({ where, detail: `the contract of "${run.skill}" cannot be read as JSON Schema: ${e.message}` });
      continue;
    }
    const bad: string[] = [];
    run.cases.forEach((k, i) => {
      if (!input.safeParse(k.input).success) bad.push(`case ${i}: input`);
      if (!output.safeParse(k.output).success) bad.push(`case ${i}: output`);
    });
    if (bad.length > 0) {
      out.nonconforming.push({
        where,
        detail:
          `${bad.length} of ${run.cases.length * 2} case halves violate the contract of "${run.skill}": ` +
          `${bad.slice(0, SHOWN).join(", ")}${bad.length > SHOWN ? ", …" : ""}.`,
      });
    } else {
      out.checked++;
    }
  }
  return out;
}
