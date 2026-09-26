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
  KG_QA_RESULTS_DIR,
  KG_SUBJECT_GRAPH_KINDS,
  KG_SUBJECT_KINDS,
} from "./kg-qa";
import { defaultGraphKinds, repoRootFor } from "./cat-harness.js";

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

  test("a broken reference is critical and an absent one is not", () => {
    expect(KG_CRITERIA_BY_ID["skill-ref-resolves"]!.severity).toBe("critical");
    // `activity-names-skill` was `minor` while it could not tell a legitimate
    // human step from a real gap. Now that every legitimate case is declared
    // — `actedUpon`, `judgementOnly`, `<folio:no-skill reason>` — what is left
    // is a missing join. Still not `critical`: nothing dangles.
    expect(KG_CRITERIA_BY_ID["activity-names-skill"]!.severity).toBe("major");
  });

  test("`activity-skill-has-tool` is minor, so the backlog cannot gate", () => {
    // The grade IS the design. Measured 2026-09-26: 99 distinct activity-named
    // skills, 32 with a Tool, 67 without — 314 located findings across 71
    // process sidecars. `kg:audit:check` gates `critical` and `:strict` adds
    // `major`, so `minor` reports without gating; raising it would redden
    // every sibling branch for a corpus-wide gap its author never touched,
    // which is the "check that cries wolf is a check somebody switches off"
    // failure. `check:tools` already ruled that a skill with no Tool is not an
    // error, because plenty of skills are pure judgement.
    expect(KG_CRITERIA_BY_ID["activity-skill-has-tool"]!.severity).toBe("minor");
    // And it is about a PROCESS, because the located form is its whole reason
    // for existing: `check:tools` has the corpus count already and cannot say
    // which activity hands a performer a skill whose mechanism is prose.
    expect(KG_CRITERIA_BY_ID["activity-skill-has-tool"]!.applies).toEqual(["process"]);
  });

  test("`call-activity-resolves` is not critical — an outward call is not a defect", () => {
    // It was written `critical`, which would have broken the build of the first
    // downstream instance calling a process it does not host. PR #282 states
    // the interpreter's side of the same rule: such a call activity stays
    // opaque rather than failing. The audit cannot tell that case from a typo,
    // so it records `unknown` at `major` — visible under `--strict`, and not a
    // gate. Raising this back to `critical` re-introduces that breakage.
    expect(KG_CRITERIA_BY_ID["call-activity-resolves"]!.severity).toBe("major");
  });
});

describe("tally and worstSeverity", () => {
  const mk = (criteria: KgQaReport["criteria"]): KgQaReport => ({
    $schema: KG_QA_SCHEMA,
    subject: { kind: "process", id: "P", path: "p.bpmn" },
    source_hash: "sha256:x",
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
    // This used `activity-names-skill`, which was the only `minor` criterion
    // applying to a process. Once its exemptions became declarations it earned
    // `major`, and NO process criterion is `minor` any more — so the example
    // has to come from another subject kind. `role-binds-a-lane` is `minor`:
    // a role nothing enters is a real gap with legitimate instances.
    expect(worstSeverity(mk({ "role-binds-a-lane": { result: "unknown", findings: [] } }))).toBe("minor");
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
  // The results tree, walked recursively and derived from the SAME constant
  // the auditor writes with — three hardcoded roots is how this test came to
  // read an empty set when the corpus moved, which its own "there are some"
  // guard then caught. The tree mirrors each subject's path, so it nests.
  const root = join(import.meta.dir, "..", KG_QA_RESULTS_DIR);
  const walk = (d: string): string[] =>
    !existsSync(d)
      ? []
      : readdirSync(d, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory()
            ? walk(join(d, e.name))
            : e.name.endsWith(".kg-qa.json")
              ? [join(d, e.name)]
              : [],
        );
  const files = walk(root);

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

describe("reachability reads the serving registry, not just manifests", () => {
  test("`skill-servable` is major — a body nobody can fetch is a real gap, not a broken link", () => {
    expect(KG_CRITERIA_BY_ID["skill-servable"]!.severity).toBe("major");
    expect(KG_CRITERIA_BY_ID["skill-servable"]!.applies).toEqual(["process"]);
  });

  test("`manifest-skill-exists` is critical and scoped to the graph roll-up", () => {
    expect(KG_CRITERIA_BY_ID["manifest-skill-exists"]!.severity).toBe("critical");
    expect(KG_CRITERIA_BY_ID["manifest-skill-exists"]!.applies).toEqual(["graph"]);
  });

  test("every skill_fetch local package points at a directory that exists", async () => {
    // The defect this whole change came from: `skills/content-lifecycle` was
    // absent from LOCAL_PACKAGES while 52 activities named its skills. A
    // package pointing at a missing directory is the same failure one step on.
    const { LOCAL_PACKAGES } = await import("../src/tools/skill-fetch.js");
    const { existsSync } = await import("node:fs");
    const missing = Object.entries(LOCAL_PACKAGES).filter(([, dir]) => !existsSync(dir));
    expect(missing).toEqual([]);
  });

  test("every directory holding `<skill>.md` that a diagram can name is served", async () => {
    const { LOCAL_PACKAGES } = await import("../src/tools/skill-fetch.js");
    const served = new Set(Object.keys(LOCAL_PACKAGES));
    // `content-lifecycle` is the one this change added; pin it so a future
    // edit to the table cannot silently drop it again.
    expect(served.has("content-lifecycle")).toBe(true);
    expect(served.has("folio-core")).toBe(true);
  });
});

describe("requirements are the fifth node kind and only point", () => {
  test("`requirement` is a subject kind with criteria of its own", () => {
    expect(criteriaFor("requirement").length).toBeGreaterThan(0);
  });

  test("a broken reference out of a requirement, or INTO one, is critical like any other", () => {
    // `satisfies-resolves` is the reference into a requirement: a skill or
    // capability names the statement it discharges (#1168), so a dangling
    // claim is caught from the claimant's side.
    for (const id of [
      "satisfies-resolves",
      "requirement-actors-resolve",
      "requirement-derived-from-resolves",
    ]) {
      expect(KG_CRITERIA_BY_ID[id]!.severity, id).toBe("critical");
    }
  });

  test("an unclaimed statement is minor coverage, not a broken reference", () => {
    expect(KG_CRITERIA_BY_ID["requirement-statement-satisfied"]!.severity).toBe("minor");
    expect(KG_CRITERIA_BY_ID["requirement-satisfied-by-resolves"]).toBeUndefined();
  });

  test("an ungraded statement is major, not critical — readable, just not testable", () => {
    expect(KG_CRITERIA_BY_ID["requirement-statements-graded"]!.severity).toBe("major");
  });

  test("every committed requirement resolves every reference it makes", async () => {
    const { readdirSync, readFileSync, existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = join(import.meta.dir, "..");
    const dir = join(root, "skills", "requirements");
    expect(existsSync(dir)).toBe(true);

    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    const reqs = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")));
    const ids = new Set(reqs.map((r) => r.id));
    const actors = new Set(
      readdirSync(join(repoRootFor(root), ".claude", "skills", "actors")).map((f: string) => f.replace(/\.json$/, "")),
    );

    const bad: string[] = [];
    for (const r of reqs) {
      for (const d of r.derivedFrom ?? []) if (!ids.has(d)) bad.push(`${r.id} derivedFrom ${d}`);
      for (const a of r.actors ?? []) if (!actors.has(a)) bad.push(`${r.id} actor ${a}`);
      for (const st of r.statements ?? []) {
        // The grade is the reason a requirement is a requirement.
        expect(st.conformance, `${r.id}/${st.key} has no conformance grade`).toBeDefined();
        for (const a of st.actors ?? []) if (!actors.has(a)) bad.push(`${r.id}/${st.key} actor ${a}`);
        // What satisfies a statement names it, never the reverse (#1168). The
        // schema is not strict (authors keep `_comment` keys), so without this
        // a re-added `satisfiedBy` would be stripped on parse and read by nobody.
        if ("satisfiedBy" in st) bad.push(`${r.id}/${st.key} carries satisfiedBy — the satisfier declares \`satisfies\` instead`);
      }
    }
    expect(bad).toEqual([]);
  });

  test("`req:agent-workflow` exists — three requirements derive from it", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    expect(existsSync(join(import.meta.dir, "..", "skills", "requirements", "agent-workflow.json"))).toBe(true);
  });
});

describe("KG_SUBJECT_GRAPH_KINDS — the bridge to the graph-kind registry", () => {
  test("every subject kind says which graph it inhabits", () => {
    // `Record<KgSubjectKind, string>` makes this a type error rather than a
    // test failure, which is the point; this asserts it at run time too,
    // because a cast or a JSON round trip can defeat the type.
    for (const k of KG_SUBJECT_KINDS) expect(KG_SUBJECT_GRAPH_KINDS[k]).toBeTruthy();
  });

  test("every named graph is one the registry knows", () => {
    // Without this the map is free to name a graph that does not exist, and
    // `audit-coverage` would emit a row about a kind nothing declares — a
    // coverage claim over an empty set, which reads exactly like coverage.
    const registered = new Set(defaultGraphKinds.names());
    for (const [subject, graph] of Object.entries(KG_SUBJECT_GRAPH_KINDS)) {
      expect(registered.has(graph), `${subject} names graph kind "${graph}", which is not registered`).toBe(true);
    }
  });

  test("every criterion's subject kinds resolve to a graph", () => {
    // `audit-coverage` counts criteria per GRAPH, by looking each criterion's
    // `applies` up in this map. A subject kind missing from it would drop that
    // criterion from every row silently — an under-count that reads as a gap.
    for (const c of KG_CRITERIA) {
      for (const s of c.applies) {
        expect(KG_SUBJECT_GRAPH_KINDS[s], `criterion ${c.id} applies to "${s}", which names no graph`).toBeTruthy();
      }
    }
  });
});
