#!/usr/bin/env bun
/**
 * Audit the knowledge graph — processes, decisions, roles, skills — and write
 * one QA sidecar per audited node.
 *
 * The model it checks is one sentence: **an actor performs a task in a process
 * as a role, using that role's skills.** Every join in that sentence is a place
 * two independently-edited files can stop agreeing, and until now only one of
 * them was checked at all (`check-workflow-refs.ts`, on skill refs). This walks
 * the rest:
 *
 *   activity ──names──▶ skill          skill-ref-resolves
 *   activity ──sits in─▶ lane          activity-in-lane
 *   lane     ──is─────▶ role           lane-binds-role · role-ref-resolves
 *   role     ──carries▶ skill          role-carries-activity-skill · role-skills-resolve
 *   role     ──is-a───▶ role           role-inherits-resolves
 *   actor    ──takes on▶ role          role-has-actor
 *   gateway  ──computes▶ decision      decision-ref-resolves · decision-outcomes-used
 *
 * ## Why sidecars rather than a console report
 *
 * `check-workflow-refs.ts` prints and exits, so its previous answer is gone.
 * That makes "this lane has been unbound since the day it was drawn" and "this
 * lane broke in the commit under review" indistinguishable, and a reviewer
 * cannot separate a new defect from inherited debt. The sidecars are committed,
 * so the diff says exactly which findings a change introduced. Same argument,
 * and same file shape, as the block sweep's `*.qa.json` and the script sweep's
 * `*.script-qa.json`; schema in `schemas/kg-qa.ts`.
 *
 * ## Gate
 *
 *   bun run kg:audit            write sidecars, print a summary, exit 0
 *   bun run kg:audit --check    fail on a `critical` finding, or on a stale sidecar
 *   bun run kg:audit --strict   ...and on `major` too
 *   bun run kg:audit --json     the full report set, for a tool
 *
 * A diagram that will not load records `unknown` against every criterion,
 * including the critical ones, so it fails `--check`. `unknown` is never
 * written as a pass.
 *
 * @module scripts/kg-audit
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import {
  KG_QA_SCHEMA,
  KG_QA_DIRNAME,
  KG_CRITERIA_BY_ID,
  criteriaFor,
  tally,
  worstSeverity,
  type KgCriterionEntry,
  type KgFinding,
  type KgQaReport,
  type KgResult,
  type KgSeverity,
  type KgSubjectKind,
} from "../schemas/kg-qa.js";
import {
  readRoleGraph,
  readActors,
  resolveRoleSkills,
  roleForLane,
  type RoleGraph,
  type LoadedActor,
} from "../schemas/role-graph.js";
import { loadProcessModel, isActivity, type ProcessModel } from "../src/workflow/process-model.js";
import { loadDecisionTable, possibleOutcomes } from "../src/workflow/decision-table.js";
import { knownSkills } from "./known-skills.js";

const ENGINE_VERSION = "1";

/**
 * Does anybody in this role read prose?
 *
 * Only a reader needs a persona, a voice and use cases. Three kinds do not:
 * an `actedUpon` lane is a store that tasks act ON (the corpus, the work
 * plan); a `system` is a pipeline that consumes files, not pages; an
 * `external` participant is outside this instance entirely.
 *
 * Scoping this way rather than asking every role is what keeps the finding
 * actionable. "The IG publisher service has no persona" is a finding nobody
 * can act on, and a check that produces those is a check somebody switches
 * off — the same argument `role-has-actor` already makes for `actedUpon`.
 */
function readsProse(r: { actedUpon?: boolean; actorKind: string }): boolean {
  return !r.actedUpon && (r.actorKind === "person" || r.actorKind === "agent");
}

const root = resolve(import.meta.dir, "..");
const WORKFLOW_DIR = join(root, "skills", "workflows");
const DECISION_DIR = join(WORKFLOW_DIR, "decisions");
const KG_ROOT = join(root, "skills");
const ACTOR_DIR = join(root, ".claude", "skills", "actors");

const sha256 = (s: string) => `sha256:${createHash("sha256").update(s).digest("hex")}`;

/**
 * A criterion's outcome, built from its findings.
 *
 * One helper rather than a ternary at fourteen call sites, because the rule
 * "no findings means pass" has one exception — a criterion that did not apply
 * — and writing that by hand each time is how one of them ends up reporting a
 * clean pass over something it never looked at.
 */
function entry(findings: KgFinding[], applicable = true): KgCriterionEntry {
  if (!applicable) return { result: "n/a", findings: [] };
  return { result: findings.length ? "fail" : "pass", findings };
}

/** Every criterion for this kind recorded as `unknown`, with one reason. */
function allUnknown(kind: KgSubjectKind, reason: string): Record<string, KgCriterionEntry> {
  const out: Record<string, KgCriterionEntry> = {};
  for (const c of criteriaFor(kind)) {
    out[c.id] = { result: "unknown", findings: [{ where: "—", detail: reason }] };
  }
  return out;
}

function report(
  kind: KgSubjectKind,
  id: string,
  path: string | null,
  sourceHash: string | null,
  criteria: Record<string, KgCriterionEntry>,
  auditorHash: string,
): KgQaReport {
  return {
    $schema: KG_QA_SCHEMA,
    subject: { kind, id, path },
    source_hash: sourceHash,
    auditor: { script: "scripts/kg-audit.ts", script_hash: auditorHash, engine_version: ENGINE_VERSION },
    criteria,
    totals: tally(criteria),
  };
}

// ── Corpus ──────────────────────────────────────────────────────

interface LoadedProcess {
  file: string;
  model?: ProcessModel;
  error?: string;
}

async function loadProcesses(): Promise<LoadedProcess[]> {
  const files = readdirSync(WORKFLOW_DIR).filter((f) => f.endsWith(".bpmn")).sort();
  const out: LoadedProcess[] = [];
  for (const file of files) {
    try {
      out.push({ file, model: await loadProcessModel(join(WORKFLOW_DIR, file)) });
    } catch (e) {
      out.push({ file, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}

// ── Per-process criteria ────────────────────────────────────────

async function auditProcess(
  p: LoadedProcess,
  graph: RoleGraph | undefined,
  skills: Set<string>,
  auditorHash: string,
): Promise<KgQaReport> {
  const rel = relative(root, join(WORKFLOW_DIR, p.file));
  const hash = sha256(readFileSync(join(WORKFLOW_DIR, p.file), "utf-8"));

  if (!p.model) {
    return report("process", p.file.replace(/\.bpmn$/, ""), rel, hash, allUnknown("process", `the diagram would not load: ${p.error}`), auditorHash);
  }
  const m = p.model;
  const activities = [...m.nodes.values()].filter(isActivity);

  const danglingSkill: KgFinding[] = [];
  const noSkill: KgFinding[] = [];
  const noLane: KgFinding[] = [];
  const skillNotCarried: KgFinding[] = [];
  for (const n of activities) {
    for (const ref of n.skills) {
      if (!skills.has(ref)) {
        danglingSkill.push({ where: n.id, detail: `names skill "${ref}", which resolves to no skill in this instance.` });
      }
    }
    if (n.skills.length === 0) noSkill.push({ where: n.id, detail: `"${n.name}" names no skill.` });
    if (!n.lane) noLane.push({ where: n.id, detail: `"${n.name}" sits in no lane, so no role — and therefore no actor — performs it.` });
  }

  // Lanes → roles.
  const danglingRoleRef: KgFinding[] = [];
  const unboundLane: KgFinding[] = [];
  const laneRole = new Map<string, string>(); // lane id → role id
  for (const lane of m.lanes) {
    const role = graph ? roleForLane(graph, lane.name, lane.roleRef) : undefined;
    if (lane.roleRef && graph && !role) {
      danglingRoleRef.push({ where: lane.id, detail: `binds role "${lane.roleRef}", which is not declared in the role graph.` });
      continue;
    }
    if (!role) {
      unboundLane.push({
        where: lane.id,
        detail: `lane "${lane.name ?? lane.id}" matches no declared role. Add the name to a role's \`lanes\` in skills/roles/roles.json, or bind it with <folio:role ref="…"/>.`,
      });
      continue;
    }
    laneRole.set(lane.id, role.id);
  }

  // Does the lane's role carry what its activities demand?
  if (graph) {
    for (const n of activities) {
      const roleId = n.laneId ? laneRole.get(n.laneId) : undefined;
      if (!roleId) continue; // already reported as an unbound lane or a laneless activity
      const carried = new Set(resolveRoleSkills(graph, roleId).map((s) => s.skill));
      for (const ref of n.skills) {
        if (!skills.has(ref)) continue; // a dangling ref is a different finding
        if (!carried.has(ref)) {
          skillNotCarried.push({
            where: n.id,
            detail: `needs skill "${ref}", but its lane's role "${roleId}" does not carry it.`,
          });
        }
      }
    }
  }

  // Gateways computing their branch from a DMN table.
  const decisionRefs = [...m.nodes.values()].filter((n) => n.decisionRef);
  const danglingDecision: KgFinding[] = [];
  for (const n of decisionRefs) {
    const [file, decId] = n.decisionRef!.split("#");
    const abs = join(m.dir, file ?? "");
    if (!existsSync(abs)) {
      danglingDecision.push({ where: n.id, detail: `names decision file "${file}", which does not exist.` });
      continue;
    }
    try {
      await loadDecisionTable(abs, decId ?? "");
    } catch (e) {
      danglingDecision.push({ where: n.id, detail: `decision "${n.decisionRef}" will not load: ${e instanceof Error ? e.message : e}` });
    }
  }

  const criteria: Record<string, KgCriterionEntry> = {
    "skill-ref-resolves": entry(danglingSkill),
    "decision-ref-resolves": entry(danglingDecision, decisionRefs.length > 0),
    "role-ref-resolves": entry(danglingRoleRef, Boolean(graph)),
    "activity-in-lane": entry(noLane, m.lanes.length > 0),
    "lane-binds-role": entry(unboundLane, Boolean(graph) && m.lanes.length > 0),
    "role-carries-activity-skill": entry(skillNotCarried, Boolean(graph) && m.lanes.length > 0),
    "activity-names-skill": entry(noSkill),
  };
  if (!graph) {
    // No role graph is a state the audit can be in, and it is not a pass.
    for (const id of ["role-ref-resolves", "lane-binds-role", "role-carries-activity-skill"]) {
      criteria[id] = { result: "unknown", findings: [{ where: "—", detail: "no role graph declared at skills/roles/roles.json." }] };
    }
  }
  return report("process", m.id, rel, hash, criteria, auditorHash);
}

// ── Per-decision criteria ───────────────────────────────────────

async function auditDecisions(
  processes: LoadedProcess[],
  auditorHash: string,
): Promise<KgQaReport[]> {
  if (!existsSync(DECISION_DIR)) return [];
  const referenced = new Set<string>();
  for (const p of processes) {
    for (const n of p.model?.nodes.values() ?? []) {
      if (n.decisionRef) referenced.add(n.decisionRef.replace(/^decisions\//, ""));
    }
  }

  const out: KgQaReport[] = [];
  for (const f of readdirSync(DECISION_DIR).filter((f) => f.endsWith(".dmn")).sort()) {
    const abs = join(DECISION_DIR, f);
    const rel = relative(root, abs);
    const hash = sha256(readFileSync(abs, "utf-8"));
    // Every `<decision id>` the file declares. Read from the XML rather than
    // through the loader, because the loader needs a decision id to be given.
    const ids = [...readFileSync(abs, "utf-8").matchAll(/<(?:dmn:)?decision\s[^>]*id="([^"]+)"/g)].map((m) => m[1]!);
    if (ids.length === 0) {
      out.push(report("decision", f.replace(/\.dmn$/, ""), rel, hash, allUnknown("decision", "no <decision id=…> found in the file."), auditorHash));
      continue;
    }
    const findings: KgFinding[] = [];
    for (const id of ids) {
      const ref = `${f}#${id}`;
      if (!referenced.has(ref)) {
        findings.push({ where: id, detail: `decision "${ref}" is referenced by no gateway in skills/workflows/. Either wire it with <folio:decision ref="decisions/${ref}"/> or delete it.` });
        continue;
      }
      try {
        const table = await loadDecisionTable(abs, id);
        if (possibleOutcomes(table).length === 0) {
          findings.push({ where: id, detail: `table "${id}" can return no outcome, so the gateway it backs can never route.` });
        }
      } catch (e) {
        findings.push({ where: id, detail: `table "${id}" will not load: ${e instanceof Error ? e.message : e}` });
      }
    }
    out.push(report("decision", f.replace(/\.dmn$/, ""), rel, hash, { "decision-outcomes-used": entry(findings) }, auditorHash));
  }
  return out;
}

// ── Per-role criteria ───────────────────────────────────────────

function auditRoles(
  graph: RoleGraph,
  graphPath: string,
  processes: LoadedProcess[],
  actors: LoadedActor[],
  skills: Set<string>,
  auditorHash: string,
): KgQaReport[] {
  const hash = sha256(readFileSync(graphPath, "utf-8"));
  const rel = relative(root, graphPath);

  const corpusLanes = new Set<string>();
  const explicitRefs = new Set<string>();
  for (const p of processes) {
    for (const lane of p.model?.lanes ?? []) {
      if (lane.name) corpusLanes.add(lane.name);
      if (lane.roleRef) explicitRefs.add(lane.roleRef);
    }
  }
  const declared = new Set(graph.roles.map((r) => r.id));
  const anyActorDeclaresRoles = actors.some((a) => (a.roles ?? []).length > 0);

  return graph.roles.map((r) => {
    const badSkills = r.skills
      .filter((s) => !skills.has(s))
      .map((s) => ({ where: s, detail: `role "${r.id}" carries skill "${s}", which resolves to no skill in this instance.` }));
    const badParents = (r.inherits ?? [])
      .filter((i) => !declared.has(i))
      .map((i) => ({ where: i, detail: `role "${r.id}" inherits "${i}", which is not declared.` }));
    const usedLanes = r.lanes.filter((l) => corpusLanes.has(l));
    const bindsSomething = usedLanes.length > 0 || explicitRefs.has(r.id);
    const laneFindings: KgFinding[] = bindsSomething
      ? []
      : [{ where: r.id, detail: `role "${r.id}" binds no lane in any diagram — nothing can enter it. Either a lane name has drifted, or the role is dead.` }];

    const criteria: Record<string, KgCriterionEntry> = {
      "role-skills-resolve": entry(badSkills),
      "role-inherits-resolves": entry(badParents, (r.inherits ?? []).length > 0),
      "role-binds-a-lane": entry(laneFindings),
      // The lane is the audience, so a role that READS has to be writable-for.
      "role-has-persona": !readsProse(r)
        ? entry([], false)
        : entry(
            r.persona && r.persona.trim().length > 0
              ? []
              : [{ where: r.id, detail: `role "${r.id}" has no persona — an author has nobody to write for.` }],
          ),
      "role-declares-voice": !readsProse(r)
        ? entry([], false)
        : entry(
            r.voice && r.voice.trim().length > 0
              ? []
              : [{ where: r.id, detail: `role "${r.id}" declares no voice — authoring and QA would each pick their own.` }],
          ),
      "role-has-use-cases": !readsProse(r)
        ? entry([], false)
        : entry(
            (r.useCases ?? []).length > 0
              ? []
              : [{ where: r.id, detail: `role "${r.id}" declares no use cases — nothing says what this reader came to do.` }],
          ),
      // `actedUpon` lanes are stores, not participants — the work plan, the
      // corpus, the publish target. Asking which actor fills the corpus is not
      // a question, so it is `n/a` rather than a failure nobody can act on.
      "role-has-actor": r.actedUpon
        ? entry([], false)
        : anyActorDeclaresRoles
        ? entry(
            actors.some((a) => (a.roles ?? []).includes(r.id))
              ? []
              : [{ where: r.id, detail: `no declared actor lists role "${r.id}" as one it can take on.` }],
          )
        : {
            result: "unknown",
            findings: [
              {
                where: r.id,
                detail:
                  "the actor registry declares no `roles` on any entry, so actor-to-role eligibility could not be evaluated. " +
                  "This is a gap in the registry, not a pass.",
              },
            ],
          },
    };
    return report("role", r.id, rel, hash, criteria, auditorHash);
  });
}

// ── Graph roll-up ───────────────────────────────────────────────

function manifestSkills(): Set<string> {
  const out = new Set<string>();
  const skillsRoot = join(root, "skills");
  if (!existsSync(skillsRoot)) return out;
  for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mp = join(skillsRoot, d.name, "package-manifest.json");
    if (!existsSync(mp)) continue;
    try {
      const m = JSON.parse(readFileSync(mp, "utf-8")) as { skills?: string[] };
      for (const s of m.skills ?? []) out.add(s);
    } catch {
      // A manifest that will not parse is `validate-skills.ts`'s finding, not
      // this one's. Treating it as "declares nothing" here would turn one
      // defect into a hundred unrelated orphan reports.
    }
  }
  return out;
}

function auditGraph(
  graph: RoleGraph | undefined,
  processes: LoadedProcess[],
  actors: LoadedActor[],
  skills: Set<string>,
  auditorHash: string,
): KgQaReport {
  const reachable = manifestSkills();
  for (const r of graph?.roles ?? []) for (const s of r.skills) reachable.add(s);
  for (const p of processes) {
    for (const n of p.model?.nodes.values() ?? []) for (const s of n.skills) reachable.add(s);
  }
  const orphans = [...skills]
    .filter((s) => !reachable.has(s))
    .sort()
    .map((s) => ({ where: s, detail: `skill "${s}" is listed by no package manifest, carried by no role and named by no activity.` }));

  const declaredRoles = new Set((graph?.roles ?? []).map((r) => r.id));
  const badActorRoles = actors.flatMap((a) =>
    (a.roles ?? [])
      .filter((r) => !declaredRoles.has(r))
      .map((r) => ({
        where: a.id,
        detail: `${relative(root, a.path)} lists role "${r}", which the role graph does not declare.`,
      })),
  );

  const roleish = actors
    .filter((a) => a.looksLikeRole)
    .map((a) => ({ where: a.id, detail: `${relative(root, a.path)} carries \`inherits\` — an actor does not inherit, a role does. Migration debt from before roles were declared.` }));

  return report(
    "graph",
    "kg",
    null,
    null,
    {
      "skill-reachable": entry(orphans),
      // Without a role graph there is nothing to resolve against, and reporting
      // every actor's roles as dangling would be a wall of false findings.
      "actor-roles-resolve": graph
        ? entry(badActorRoles)
        : { result: "unknown", findings: [{ where: "—", detail: "no role graph to resolve actor roles against." }] },
      "actor-is-not-a-role": entry(roleish),
    },
    auditorHash,
  );
}

// ── Sidecar IO ──────────────────────────────────────────────────

function sidecarPath(r: KgQaReport): string {
  const dirFor: Record<KgSubjectKind, string> = {
    process: join(WORKFLOW_DIR, KG_QA_DIRNAME),
    decision: join(DECISION_DIR, KG_QA_DIRNAME),
    role: join(KG_ROOT, "roles", KG_QA_DIRNAME),
    graph: join(KG_ROOT, "roles", KG_QA_DIRNAME),
  };
  const stem = r.subject.path ? basename(r.subject.path).replace(/\.(bpmn|dmn|json)$/, "") : r.subject.id;
  const name = r.subject.kind === "role" ? r.subject.id : stem;
  return join(dirFor[r.subject.kind], `${name}.kg-qa.json`);
}

function serialise(r: KgQaReport): string {
  return `${JSON.stringify(r, null, 2)}\n`;
}

// ── Main ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const check = args.includes("--check");
const strict = args.includes("--strict");
const asJson = args.includes("--json");

const auditorHash = sha256(readFileSync(join(root, "scripts", "kg-audit.ts"), "utf-8"));
const skills = knownSkills(root);
const actors = readActors(ACTOR_DIR);

let graph: RoleGraph | undefined;
let graphError: string | undefined;
try {
  graph = readRoleGraph(KG_ROOT);
} catch (e) {
  graphError = e instanceof Error ? e.message : String(e);
}
if (graphError) {
  console.error(`Could not read the role graph: ${graphError}`);
  console.error("This is NOT a pass. Nothing was audited against roles.");
  process.exit(2);
}

const processes = await loadProcesses();
const reports: KgQaReport[] = [];
for (const p of processes) reports.push(await auditProcess(p, graph, skills, auditorHash));
reports.push(...(await auditDecisions(processes, auditorHash)));
if (graph) {
  reports.push(...auditRoles(graph, join(KG_ROOT, "roles", "roles.json"), processes, actors, skills, auditorHash));
}
reports.push(auditGraph(graph, processes, actors, skills, auditorHash));

// Write or compare.
const stale: string[] = [];
for (const r of reports) {
  const p = sidecarPath(r);
  const text = serialise(r);
  if (check) {
    const current = existsSync(p) ? readFileSync(p, "utf-8") : undefined;
    if (current !== text) stale.push(relative(root, p));
  } else {
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, text);
  }
}

if (asJson) {
  console.log(JSON.stringify({ reports, stale }, null, 2));
} else {
  const rank: Record<KgSeverity, number> = { minor: 1, major: 2, critical: 3 };
  const counts: Record<KgResult, number> = { pass: 0, fail: 0, "n/a": 0, unknown: 0 };
  for (const r of reports) for (const k of Object.keys(counts) as KgResult[]) counts[k] += r.totals[k] ?? 0;

  console.log(`Knowledge-graph audit  (${reports.length} subjects, ${skills.size} skills, ${graph?.roles.length ?? 0} roles)\n`);
  console.log(`  pass ${counts.pass}   fail ${counts.fail}   n/a ${counts["n/a"]}   unknown ${counts.unknown}\n`);

  const bySeverity = new Map<KgSeverity, { subject: string; criterion: string; findings: number }[]>();
  for (const r of reports) {
    for (const [id, e] of Object.entries(r.criteria)) {
      if (e.result !== "fail" && e.result !== "unknown") continue;
      const sev = KG_CRITERIA_BY_ID[id]?.severity ?? "minor";
      const list = bySeverity.get(sev) ?? bySeverity.set(sev, []).get(sev)!;
      list.push({ subject: `${r.subject.kind}:${r.subject.id}`, criterion: id, findings: e.findings.length });
    }
  }
  for (const sev of (["critical", "major", "minor"] as KgSeverity[])) {
    const rows = bySeverity.get(sev) ?? [];
    if (!rows.length) continue;
    console.log(`${sev.toUpperCase()}  — ${rows.reduce((n, r) => n + r.findings, 0)} finding(s)`);
    for (const row of rows) console.log(`  · ${row.subject.padEnd(42)} ${row.criterion} (${row.findings})`);
    console.log("");
  }

  if (check && stale.length) {
    console.error(`${stale.length} sidecar(s) are stale. Run \`bun run kg:audit\` and commit:`);
    for (const s of stale) console.error(`  · ${s}`);
  }

  const worst = reports.map(worstSeverity).filter(Boolean) as KgSeverity[];
  const top = worst.sort((a, b) => rank[b] - rank[a])[0];
  console.log(top ? `Worst severity: ${top}` : "Clean.");
}

if (check) {
  const gate: KgSeverity[] = strict ? ["critical", "major"] : ["critical"];
  const tripped = reports.some((r) => {
    const w = worstSeverity(r);
    return w !== undefined && gate.includes(w);
  });
  process.exit(stale.length || tripped ? 1 : 0);
}
process.exit(0);
