/**
 * The sidecar's own rules — the ones a reader relies on when they read a
 * committed `.kg-qa.json` without re-running the audit.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  KG_CRITERIA,
  KG_CRITERIA_BY_ID,
  KG_QA_SCHEMA,
  KgQaReportSchema,
  criteriaFor,
  tally,
  worstSeverity,
  type KgQaReport,
} from "./kg-qa";

describe("the criteria registry", () => {
  test("ids are unique", () => {
    expect(new Set(KG_CRITERIA.map((c) => c.id)).size).toBe(KG_CRITERIA.length);
  });

  test("every criterion applies to at least one subject kind", () => {
    for (const c of KG_CRITERIA) expect(c.applies.length).toBeGreaterThan(0);
  });

  test("every subject kind has at least one criterion, so no kind is audited vacuously", () => {
    for (const kind of ["process", "decision", "role", "graph"] as const) {
      expect(criteriaFor(kind).length).toBeGreaterThan(0);
    }
  });

  test("a broken reference is critical and a coverage gap is not", () => {
    expect(KG_CRITERIA_BY_ID["skill-ref-resolves"]!.severity).toBe("critical");
    expect(KG_CRITERIA_BY_ID["activity-names-skill"]!.severity).toBe("minor");
  });
});

describe("tally and worstSeverity", () => {
  const mk = (criteria: KgQaReport["criteria"]): KgQaReport => ({
    $schema: KG_QA_SCHEMA,
    subject: { kind: "process", id: "P", path: "p.bpmn" },
    source_hash: "sha256:x",
    auditor: { script: "s", script_hash: "sha256:y", engine_version: "1" },
    criteria,
    totals: tally(criteria),
  });

  test("totals cannot disagree with the criteria block", () => {
    const r = mk({
      a: { result: "pass", findings: [] },
      b: { result: "fail", findings: [{ where: "n", detail: "d" }] },
      c: { result: "n/a", findings: [] },
    });
    expect(r.totals).toEqual({ pass: 1, fail: 1, "n/a": 1, unknown: 0 });
  });

  test("a clean report has no severity", () => {
    expect(worstSeverity(mk({ "skill-ref-resolves": { result: "pass", findings: [] } }))).toBeUndefined();
  });

  test("`unknown` counts as a failure — it is never read as a pass", () => {
    expect(worstSeverity(mk({ "skill-ref-resolves": { result: "unknown", findings: [] } }))).toBe("critical");
  });

  test("`unknown` is NOT promoted past its criterion's own severity", () => {
    expect(worstSeverity(mk({ "activity-names-skill": { result: "unknown", findings: [] } }))).toBe("minor");
  });

  test("the worst severity wins, not the most frequent", () => {
    const w = worstSeverity(
      mk({
        "activity-names-skill": { result: "fail", findings: [] },
        "lane-binds-role": { result: "fail", findings: [] },
        "skill-ref-resolves": { result: "fail", findings: [] },
      }),
    );
    expect(w).toBe("critical");
  });
});

describe("the sidecars committed in this repository", () => {
  const roots = [
    join(import.meta.dir, "..", "skills", "workflows", "kg-qa"),
    join(import.meta.dir, "..", "skills", "workflows", "decisions", "kg-qa"),
    join(import.meta.dir, "..", "skills", "roles", "kg-qa"),
  ].filter(existsSync);

  const files = roots.flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".kg-qa.json")).map((f) => join(d, f)));

  test("there are some", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test("every one validates against the schema", () => {
    for (const f of files) {
      const parsed = KgQaReportSchema.safeParse(JSON.parse(readFileSync(f, "utf-8")));
      if (!parsed.success) throw new Error(`${f}: ${parsed.error.message}`);
    }
  });

  test("every criterion key is a registered criterion, and applies to that subject kind", () => {
    for (const f of files) {
      const r = JSON.parse(readFileSync(f, "utf-8")) as KgQaReport;
      const allowed = new Set(criteriaFor(r.subject.kind).map((c) => c.id));
      for (const id of Object.keys(r.criteria)) {
        expect(KG_CRITERIA_BY_ID[id], `${f}: unknown criterion ${id}`).toBeDefined();
        expect(allowed.has(id), `${f}: ${id} does not apply to ${r.subject.kind}`).toBe(true);
      }
    }
  });

  test("no sidecar records a `fail` with no findings — a failure a reader cannot act on", () => {
    for (const f of files) {
      const r = JSON.parse(readFileSync(f, "utf-8")) as KgQaReport;
      for (const [id, e] of Object.entries(r.criteria)) {
        if (e.result === "fail") expect(e.findings.length, `${f}: ${id}`).toBeGreaterThan(0);
      }
    }
  });

  test("no critical criterion is failing on main", () => {
    const bad: string[] = [];
    for (const f of files) {
      const r = JSON.parse(readFileSync(f, "utf-8")) as KgQaReport;
      for (const [id, e] of Object.entries(r.criteria)) {
        if (e.result !== "pass" && e.result !== "n/a" && KG_CRITERIA_BY_ID[id]?.severity === "critical") {
          bad.push(`${r.subject.kind}:${r.subject.id} ${id}=${e.result}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
