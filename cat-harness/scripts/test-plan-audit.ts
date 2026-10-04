/**
 * The four kg-audit criteria over TEST PLANS, the runs that execute them and
 * the reports those runs produce — bean `3o5b`, arc `3fva`, proposal §3.2:
 *
 * > *"the plan resolves, every case was executed or explicitly skipped with a
 * > reason, the data hash is present, and the system under test never wrote
 * > its own verdict."*
 *
 * | criterion | asks |
 * |---|---|
 * | `test-plan-resolves` | does every plan parse with an exit DMN that exists, and does every plan-run and report name a plan, version and system under test that resolve? |
 * | `test-case-executed-or-skipped` | does every terminal report give each plan case a verdict, and name no case the plan lacks? |
 * | `test-data-hash-present` | is every plan-run's data hash known, and does every report carry its run's data hash? |
 * | `test-sut-not-self-judged` | is any verdict's reviewer the system under test? |
 *
 * ## One implementation of each rule, and it is not here
 *
 * The rules already exist in the schemas — `TestPlanSchema`, `TestRunSchema`
 * (`plan` without `sut` is refused), `TestReportSchema` (a self-judged verdict
 * is refused) and `checkAgainstPlan`. This module FOLLOWS the files to each
 * other and calls those; it re-derives nothing. The one place it reads raw
 * JSON before the schema is `test-sut-not-self-judged`, and only so that a
 * report the schema refuses for exactly that reason is reported under the
 * criterion that names it rather than as an anonymous parse failure.
 *
 * ## Third states
 *
 * - Nothing to judge (no plan, no plan-run, no report) is `n/a`, never a pass
 *   over nothing.
 * - A report whose plan cannot be followed has not been checked for its
 *   cases: `test-case-executed-or-skipped` is `unknown` for it, not `pass`.
 *
 * @module scripts/test-plan-audit
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import type { KgCriterionEntry, KgFinding } from "../schemas/kg-qa.js";
import { TestPlanSchema, TEST_PLAN_SCHEMA_ID, type TestPlan } from "../schemas/test-plan.js";
import { TestRunSchema, UNKNOWN_HASH, type SutRef } from "../schemas/test-run.js";
import { TestReportSchema, TEST_REPORT_SCHEMA_ID, checkAgainstPlan } from "../schemas/test-report.js";
import type { SutKind } from "../schemas/test-plan.js";

/** The four criterion ids, in registry order. */
export const TEST_PLAN_CRITERIA = [
  "test-plan-resolves",
  "test-case-executed-or-skipped",
  "test-data-hash-present",
  "test-sut-not-self-judged",
] as const;
export type TestPlanCriterion = (typeof TEST_PLAN_CRITERIA)[number];

/** The part of an actor these criteria read. */
export interface SutActor {
  id: string;
  systemUnderTest?: { kind: SutKind; version: string };
}

export interface TestPlanAuditInput {
  /** Instance root: findings are relative to it, and DMN refs resolve from it. */
  root: string;
  /** Extra bases a DMN ref may be relative to — the process directories. */
  dmnBases?: string[];
  /** Plan files (`test-plan/v1` JSON). */
  plans: string[];
  /** Test-run files (`folio-test-run/v1`). Runs with no `plan` are not plan-runs and are skipped. */
  runs: string[];
  /** Test-report files (`test-report/v1`). */
  reports: string[];
  actors: readonly SutActor[];
}

/** Every `*.json` under the given directories (recursive), sorted. */
export function jsonFilesUnder(dirs: readonly string[]): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d).sort()) {
      if (e.startsWith(".")) continue;
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith(".json")) out.push(p);
    }
  };
  for (const d of dirs) walk(d);
  return out.sort();
}

/** Does `file.dmn#Decision_Id` name a decision in a file that exists? */
export function dmnRefResolves(ref: string, bases: readonly string[]): boolean {
  const [file, id] = ref.split("#");
  if (!file || !id) return false;
  for (const b of bases) {
    const p = resolve(b, file);
    if (!existsSync(p)) continue;
    const xml = readFileSync(p, "utf-8");
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`<(?:[A-Za-z]+:)?decision\\b[^>]*\\bid="${esc}"`).test(xml)) return true;
  }
  return false;
}

function readJson(path: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf-8")) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const issues = (e: { issues: { path: PropertyKey[]; message: string }[] }): string =>
  e.issues.map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`).join("; ");

/** Build the four entries. Pure apart from reading the files it is handed. */
export function auditTestPlans(input: TestPlanAuditInput): Record<TestPlanCriterion, KgCriterionEntry> {
  const rel = (p: string) => relative(input.root, p);
  const bases = [input.root, ...(input.dmnBases ?? [])];
  const actors = new Map(input.actors.map((a) => [a.id, a]));

  const resolves: KgFinding[] = [];
  const executed: KgFinding[] = [];
  const hashes: KgFinding[] = [];
  const selfJudged: KgFinding[] = [];
  let executedUnknown = 0;

  // ── Plans ──────────────────────────────────────────────────────────────
  const plans = new Map<string, TestPlan>();
  for (const f of input.plans) {
    const raw = readJson(f);
    if (!raw.ok) {
      resolves.push({ where: rel(f), detail: `is not JSON: ${raw.error}` });
      continue;
    }
    // A JSON file in a plan directory that does not declare itself a plan is
    // not judged as one — the declaration is the contract, not the directory.
    if ((raw.value as { $schema?: unknown })?.$schema !== TEST_PLAN_SCHEMA_ID) continue;
    const parsed = TestPlanSchema.safeParse(raw.value);
    if (!parsed.success) {
      resolves.push({ where: rel(f), detail: `does not parse as ${TEST_PLAN_SCHEMA_ID}: ${issues(parsed.error)}` });
      continue;
    }
    const plan = parsed.data;
    if (plans.has(plan.id)) {
      resolves.push({ where: rel(f), detail: `plan id \`${plan.id}\` is declared twice — a run naming it cannot be followed to one plan.` });
      continue;
    }
    plans.set(plan.id, plan);
    if (!dmnRefResolves(plan.exitCriteria.decision, bases)) {
      resolves.push({
        where: rel(f),
        detail: `exitCriteria \`${plan.exitCriteria.decision}\` does not resolve to a decision — the certifier would have no rule to apply.`,
      });
    }
  }

  /** The plan a run or report names, and whether its system under test fits it. */
  const follow = (where: string, ref: { id: string; version: string }, sut: SutRef): TestPlan | undefined => {
    const plan = plans.get(ref.id);
    if (!plan) {
      resolves.push({ where, detail: `names plan \`${ref.id}\`, which no test-plan/v1 declares.` });
      return undefined;
    }
    if (plan.version !== ref.version) {
      resolves.push({ where, detail: `executed plan \`${ref.id}\` v${ref.version}; the plan in the tree is v${plan.version}, so what was run cannot be opened.` });
    }
    const actor = actors.get(sut.actor);
    if (!actor) {
      resolves.push({ where, detail: `names system under test \`${sut.actor}\`, which is not a declared actor.` });
    } else if (!actor.systemUnderTest) {
      resolves.push({ where, detail: `system under test \`${sut.actor}\` carries no \`systemUnderTest\` facet — it has not been declared testable.` });
    } else if (actor.systemUnderTest.kind !== plan.scope.kind) {
      resolves.push({
        where,
        detail: `plan \`${plan.id}\` scopes a \`${plan.scope.kind}\`; system under test \`${sut.actor}\` is a \`${actor.systemUnderTest.kind}\`.`,
      });
    }
    return plan;
  };

  // ── Plan-runs ──────────────────────────────────────────────────────────
  let planRuns = 0;
  for (const f of input.runs) {
    const raw = readJson(f);
    if (!raw.ok) continue; // `test-run-skill-resolves` owns an unreadable run.
    if ((raw.value as { plan?: unknown })?.plan === undefined) continue;
    planRuns++;
    const parsed = TestRunSchema.safeParse(raw.value);
    if (!parsed.success) {
      resolves.push({ where: rel(f), detail: `does not parse as a test run: ${issues(parsed.error)}` });
      continue;
    }
    const run = parsed.data;
    if (run.plan && run.sut) follow(rel(f), run.plan, run.sut);
    if (run.data.hash === UNKNOWN_HASH) {
      hashes.push({ where: rel(f), detail: `data hash is \`${UNKNOWN_HASH}\` — what was tested cannot be established.` });
    }
  }

  // ── Reports ────────────────────────────────────────────────────────────
  let reports = 0;
  for (const f of input.reports) {
    const raw = readJson(f);
    if (!raw.ok) {
      resolves.push({ where: rel(f), detail: `is not JSON: ${raw.error}` });
      continue;
    }
    const v = raw.value as {
      $schema?: unknown;
      sut?: { actor?: unknown };
      cases?: Record<string, { reviewer?: { id?: unknown; actor?: unknown } }[]>;
      run?: { data?: unknown };
    };
    if (v?.$schema !== TEST_REPORT_SCHEMA_ID) continue;
    reports++;

    // Read raw FIRST: the schema refuses a self-judged report, and that refusal
    // belongs to this criterion by name.
    const sutActor = typeof v.sut?.actor === "string" ? v.sut.actor : undefined;
    let self = false;
    if (sutActor !== undefined && v.cases && typeof v.cases === "object") {
      for (const [id, entries] of Object.entries(v.cases)) {
        (Array.isArray(entries) ? entries : []).forEach((e, i) => {
          if (e?.reviewer?.id === sutActor || e?.reviewer?.actor === sutActor) {
            self = true;
            selfJudged.push({ where: `${rel(f)}#cases.${id}[${i}]`, detail: `case \`${id}\` was judged by the system under test (\`${sutActor}\`).` });
          }
        });
      }
    }
    if (typeof v.run?.data !== "string" || v.run.data === "" || v.run.data === UNKNOWN_HASH) {
      hashes.push({ where: rel(f), detail: `the report's run carries no known data hash (\`${String(v.run?.data)}\`).` });
    }

    const parsed = TestReportSchema.safeParse(raw.value);
    if (!parsed.success) {
      // Self-judgement alone already has its own finding above.
      const other = parsed.error.issues.filter((i) => !(self && i.path.at(-1) === "reviewer"));
      if (other.length > 0) resolves.push({ where: rel(f), detail: `does not parse as ${TEST_REPORT_SCHEMA_ID}: ${issues({ issues: other })}` });
      executedUnknown++;
      continue;
    }
    const report = parsed.data;
    const plan = follow(rel(f), report.plan, report.sut);
    if (!plan) {
      executedUnknown++;
      continue;
    }
    for (const m of checkAgainstPlan(report, plan)) {
      if (m.kind === "unexecuted-case" || m.kind === "unknown-case") executed.push({ where: rel(f), detail: m.message });
    }
  }

  const anyPlan = plans.size > 0 || input.plans.length > 0;
  const out = {} as Record<TestPlanCriterion, KgCriterionEntry>;
  out["test-plan-resolves"] = entryOf(resolves, anyPlan || planRuns > 0 || reports > 0);
  out["test-case-executed-or-skipped"] =
    reports === 0
      ? { result: "n/a", findings: [] }
      : executed.length > 0
        ? { result: "fail", findings: executed }
        : executedUnknown > 0
          ? {
              result: "unknown",
              findings: [{ where: "—", detail: `${executedUnknown} report(s) could not be followed to their plan, so their cases were not checked.` }],
            }
          : { result: "pass", findings: [] };
  out["test-data-hash-present"] = entryOf(hashes, planRuns > 0 || reports > 0);
  out["test-sut-not-self-judged"] = entryOf(selfJudged, reports > 0);
  return out;
}

function entryOf(findings: KgFinding[], applicable: boolean): KgCriterionEntry {
  if (!applicable) return { result: "n/a", findings: [] };
  return { result: findings.length > 0 ? "fail" : "pass", findings };
}
