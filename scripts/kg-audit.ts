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
import { basename, dirname, join, relative, resolve } from "node:path";

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
  readPermissions,
  resolveRoleSkills,
  roleForLane,
  findRole,
  fulfilmentKindsForBpmnType,
  type RoleGraph,
  type LoadedActor,
} from "../schemas/role-graph.js";
import { loadProcessModel, isActivity, type ProcessModel } from "../src/workflow/process-model.js";
import { loadDecisionTable, possibleOutcomes } from "../src/workflow/decision-table.js";
import { knownSkills } from "./known-skills.js";
import { LOCAL_PACKAGES } from "../src/tools/skill-fetch.js";

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
const CAPABILITY_DIR = join(root, ".claude", "skills", "capabilities");
const REQUIREMENT_DIR = join(KG_ROOT, "requirements");

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
  processIds: Set<string>,
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
  const unresolvedCall: KgFinding[] = [];
  const calls = activities.filter((n) => n.calledElement !== undefined);

  // Lane ids whose role is declared `actedUpon` — a store or an external
  // system that is written to rather than a participant that acts.
  const actedUponLanes = new Set(
    graph
      ? m.lanes.filter((l) => roleForLane(graph, l.name, l.roleRef)?.actedUpon === true).map((l) => l.id)
      : [],
  );
  const actedUponNode = (n: { laneId?: string }): boolean =>
    n.laneId !== undefined && actedUponLanes.has(n.laneId);

  // Lane ids whose role PERFORMS but by judgement — a stakeholder signing off.
  // Unlike `actedUpon`, somebody really does the step; no instruction body can
  // produce the answer for them.
  const judgementLanes = new Set(
    graph
      ? m.lanes.filter((l) => roleForLane(graph, l.name, l.roleRef)?.judgementOnly === true).map((l) => l.id)
      : [],
  );
  const judgementNode = (n: { laneId?: string }): boolean =>
    n.laneId !== undefined && judgementLanes.has(n.laneId);
  for (const n of activities) {
    for (const ref of n.skills) {
      if (!skills.has(ref)) {
        danglingSkill.push({ where: n.id, detail: `names skill "${ref}", which resolves to no skill in this instance.` });
      }
    }
    // A call activity is implemented by the process it calls, not by a skill.
    // Demanding a `<folio:skill ref>` of it asks the diagram to name a second,
    // redundant implementation — and the one that matters is checked by
    // `call-activity-resolves` below, so the exemption leaves no gap.
    //
    // An `actedUpon` lane is the same category error one level up: the corpus
    // and an external registry are WRITTEN TO, not participants that act, and
    // the role graph already says so — `role-has-actor` is `n/a` for them for
    // exactly this reason. Asking what skill the corpus uses to be committed
    // into has no answer to give.
    //
    // Three declared exemptions, and each one is READ from a declaration
    // rather than inferred: an `actedUpon` lane (nothing performs it), a
    // `judgementOnly` lane (somebody performs it, but no procedure yields the
    // answer), and `<folio:no-skill reason>` on the activity itself. Because
    // every legitimate case now SAYS SO, what is left is a real gap — which is
    // what lets this criterion gate instead of staying advisory.
    if (
      n.skills.length === 0 &&
      n.calledElement === undefined &&
      !actedUponNode(n) &&
      !judgementNode(n) &&
      n.noSkillReason === undefined
    ) {
      noSkill.push({
        where: n.id,
        detail:
          `"${n.name}" names no skill. Give it <folio:skill ref="…"/>, or, if none could exist, ` +
          `declare <folio:no-skill reason="…"/> saying why.`,
      });
    }
    if (n.calledElement !== undefined && !processIds.has(n.calledElement)) {
      unresolvedCall.push({
        where: n.id,
        detail:
          `calls "${n.calledElement}", which is the id of no process this instance can load. That is either a typo ` +
          `or a process hosted elsewhere, and this audit cannot tell which — so it is recorded as unknown.`,
      });
    }
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

  // Can the lane's role actually be filled by something that can perform this
  // step? The diagram's task TYPE already answers which kinds may — BPMN says a
  // userTask is done by a person and a serviceTask without one — and until now
  // nothing joined that answer to the role graph's `actorKind`.
  //
  // Scoped the same way `activity-names-skill` is, and for the same reason. An
  // `actedUpon` lane is a store, and "the corpus cannot perform a serviceTask"
  // is a finding nobody can act on. An activity whose lane is unbound or absent
  // is already reported by `lane-binds-role` / `activity-in-lane`; repeating it
  // here would make one defect look like two.
  const wrongKind: KgFinding[] = [];
  let kindApplicable = 0;
  if (graph) {
    for (const n of activities) {
      if (actedUponNode(n)) continue;
      const roleId = n.laneId ? laneRole.get(n.laneId) : undefined;
      if (!roleId) continue;
      const role = findRole(graph, roleId);
      if (!role) continue;
      const allowed = n.fulfilment?.kinds ?? fulfilmentKindsForBpmnType(n.type);
      if (!allowed) continue; // a bpmn:Task or call activity asserts nothing
      kindApplicable += 1;
      if (allowed.includes(role.actorKind)) continue;
      const how = n.fulfilment
        ? `<folio:fulfilment/> on the step allows ${allowed.join(", ")} (${n.fulfilment.reason})`
        : `a ${n.type.replace("bpmn:", "")} is performed by ${allowed.join(" or ")}`;
      wrongKind.push({
        where: n.id,
        detail:
          `"${n.name}" — ${how}, but its lane's role "${roleId}" is filled by a ${role.actorKind}. ` +
          `Either the task type is wrong, the lane is wrong, or the step really does admit that kind — ` +
          `in which case say so with <folio:fulfilment kinds="…" reason="…"/>.`,
      });
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

  const servable = servableSkills();
  const unservable: KgFinding[] = [];
  for (const n of activities) {
    for (const ref of n.skills) {
      if (!skills.has(ref)) continue; // a dangling ref is a different finding
      if (!servable.has(ref)) {
        unservable.push({
          where: n.id,
          detail: `names skill "${ref}", which exists but no local package serves — skill_fetch would answer "package not found".`,
        });
      }
    }
  }

  const criteria: Record<string, KgCriterionEntry> = {
    "skill-ref-resolves": entry(danglingSkill),
    "skill-servable": entry(unservable),
    "decision-ref-resolves": entry(danglingDecision, decisionRefs.length > 0),
    "role-ref-resolves": entry(danglingRoleRef, Boolean(graph)),
    "activity-in-lane": entry(noLane, m.lanes.length > 0),
    "lane-binds-role": entry(unboundLane, Boolean(graph) && m.lanes.length > 0),
    "role-carries-activity-skill": entry(skillNotCarried, Boolean(graph) && m.lanes.length > 0),
    "activity-names-skill": entry(noSkill),
    "activity-fulfilment-kind": entry(wrongKind, Boolean(graph) && kindApplicable > 0),
    // Three states, not two. A resolved target passes; a process with no call
    // activity is `n/a`; a target this instance cannot load is `unknown`,
    // because it may be hosted elsewhere — see the note on the criterion.
    "call-activity-resolves":
      calls.length === 0
        ? { result: "n/a" as KgResult, findings: [] }
        : unresolvedCall.length
          ? { result: "unknown" as KgResult, findings: unresolvedCall }
          : { result: "pass" as KgResult, findings: [] },
  };
  if (!graph) {
    // No role graph is a state the audit can be in, and it is not a pass.
    for (const id of ["role-ref-resolves", "lane-binds-role", "role-carries-activity-skill", "activity-fulfilment-kind"]) {
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

/**
 * Every skill file, across every package.
 *
 * Walks `skills/` rather than reading a manifest: a skill a manifest forgot is
 * still a file an agent can be pointed at, and the audit should see it.
 * `kg-qa/` is excluded — those are this audit's own sidecars.
 *
 * **A file that declares itself part of a skill is not a skill.** A long skill
 * split into an entry point plus siblings — the pattern `AGENTS.md` prescribes
 * for `MEMORY.md`, "keep it under 200 lines, split detail into sibling files
 * the agent reads on demand" — would otherwise be audited as several skills,
 * and each fragment measured against thresholds meant for a whole one. Found
 * exactly that way: splitting five over-length skills turned 5 findings into
 * 4 new ones on their own fragments.
 *
 * The test is the file's own `part-of:` declaration, not its path, because
 * this repo has paid for "told apart by where it happens to sit" before —
 * a declaration inside the file is the contract, a location is a coincidence.
 *
 * It cannot be used to hide a skill: the declaration only counts when the
 * named parent exists AND the file sits inside that parent's own directory,
 * so `part-of: something-else` in an arbitrary file excludes nothing.
 */
function isPartOfASkill(path: string): boolean {
  const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(path, "utf-8"));
  const parent = fm && /^part-of:\s*(\S+)\s*$/m.exec(fm[1]!)?.[1];
  if (!parent) return false;
  const dir = dirname(path);
  return basename(dir) === parent && existsSync(join(dirname(dir), `${parent}.md`));
}

function skillFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== KG_QA_DIRNAME) walk(p);
      } else if (e.name.endsWith(".md") && !isPartOfASkill(p)) {
        out.push(p);
      }
    }
  };
  walk(KG_ROOT);
  return out.sort();
}

/**
 * Brevity, measured per skill and recorded in a sidecar.
 *
 * Brevity is a property of an artefact, so it belongs here rather than as
 * advice inside the skill files. "Aim for shortness" in twenty skills is
 * twenty sentences nothing measures, nothing enforces, and every future edit
 * quietly ignores. A number in a sidecar is checkable and its trend is
 * visible in the diff.
 *
 * Thresholds measured across 123 skill files on 2026-09-18: median 178,
 * p75 279, p90 391, max 1280 lines. 280 and 400 are those two percentiles
 * rounded — "longer than three quarters of its peers" rather than an opinion.
 */
function auditSkills(auditorHash: string): KgQaReport[] {
  const out: KgQaReport[] = [];
  for (const file of skillFiles()) {
    const rel = relative(root, file);
    const lines = readFileSync(file, "utf-8").split("\n");
    const n = lines.length;

    // Headings only, and only at the same depth — two `### Why` under
    // different `##` sections are not a repeat. Comparing across depths would
    // flag every skill with a conventional structure.
    const seen = new Map<string, number>();
    const repeats: KgFinding[] = [];
    let inFence = false;
    for (const l of lines) {
      if (/^```/.test(l.trim())) { inFence = !inFence; continue; }
      if (inFence) continue;
      const m = /^(#{2,6})\s+(.+?)\s*$/.exec(l);
      if (!m) continue;
      const key = `${m[1]!.length}:${m[2]!.toLowerCase()}`;
      const prior = seen.get(key);
      if (prior !== undefined) {
        repeats.push({ where: rel, detail: `heading "${m[2]}" repeated (also at line ${prior})` });
      } else {
        seen.set(key, lines.indexOf(l) + 1);
      }
    }

    out.push(
      report(
        "skill",
        basename(file, ".md"),
        rel,
        createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12),
        {
          "skill-is-brief": entry(
            n > 280 ? [{ where: rel, detail: `${n} lines; p75 of the skill corpus is 279.` }] : [],
          ),
          "skill-not-a-document": entry(
            n > 400 ? [{ where: rel, detail: `${n} lines; p90 is 391. At this length it is a document.` }] : [],
          ),
          "skill-no-repeated-heading": entry(repeats),
        },
        auditorHash,
      ),
    );
  }
  return out;
}

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

// ── Per-requirement criteria ────────────────────────────────────

/**
 * Requirements are the fifth KG node kind, and the last one whose joins went
 * unchecked.
 *
 * A requirement is not a skill and not a role: it is a conformance obligation
 * that POINTS AT them. `satisfiedBy` names the skill or capability that
 * discharges a statement, `actors` names who is bound by it, and `derivedFrom`
 * names the broader requirement it specialises. Three reference types, and
 * until now nothing resolved any of them — measured on 2026-09-18, one
 * `satisfiedBy` and three `derivedFrom` refs pointed at nothing.
 *
 * They are `critical` rather than `major` for the same reason a dangling
 * `<folio:skill ref>` is: a reader following the reference gets nothing. The
 * grading check is `major` — an ungraded statement is still readable, it just
 * cannot be conformance-tested.
 */
interface LoadedRequirement {
  id: string;
  file: string;
  path: string;
  raw: {
    id?: string;
    derivedFrom?: string[];
    actors?: string[];
    statements?: { key?: string; conformance?: string; actors?: string[]; satisfiedBy?: { kind?: string; ref?: string }[] }[];
  };
}

function readRequirements(): LoadedRequirement[] {
  if (!existsSync(REQUIREMENT_DIR)) return [];
  const out: LoadedRequirement[] = [];
  for (const f of readdirSync(REQUIREMENT_DIR).filter((f) => f.endsWith(".json")).sort()) {
    const p = join(REQUIREMENT_DIR, f);
    try {
      const raw = JSON.parse(readFileSync(p, "utf-8")) as LoadedRequirement["raw"];
      out.push({ id: raw.id ?? f.slice(0, -5), file: f, path: p, raw });
    } catch (e) {
      throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : e}`);
    }
  }
  return out;
}

function auditRequirements(
  reqs: LoadedRequirement[],
  skills: Set<string>,
  actors: LoadedActor[],
  auditorHash: string,
): KgQaReport[] {
  const capabilities = new Set<string>();
  if (existsSync(CAPABILITY_DIR)) {
    for (const f of readdirSync(CAPABILITY_DIR)) {
      if (f.endsWith(".json")) capabilities.add(f.slice(0, -5));
    }
  }
  const actorIds = new Set(actors.map((a) => a.id));
  const reqIds = new Set(reqs.map((r) => r.id));

  return reqs.map((r) => {
    const hash = sha256(readFileSync(r.path, "utf-8"));
    const satisfied: KgFinding[] = [];
    const badActors: KgFinding[] = [];
    const ungraded: KgFinding[] = [];

    for (const a of r.raw.actors ?? []) {
      if (!actorIds.has(a)) badActors.push({ where: r.id, detail: `binds actor "${a}", which the registry does not declare.` });
    }
    for (const st of r.raw.statements ?? []) {
      const key = st.key ?? "(unkeyed)";
      if (!st.conformance) {
        ungraded.push({ where: key, detail: `statement "${key}" carries no \`conformance\` grade — it cannot be conformance-tested.` });
      }
      for (const a of st.actors ?? []) {
        if (!actorIds.has(a)) badActors.push({ where: `${r.id}/${key}`, detail: `binds actor "${a}", which the registry does not declare.` });
      }
      for (const sb of st.satisfiedBy ?? []) {
        const ref = sb.ref ?? "";
        const ok = sb.kind === "skill" ? skills.has(ref) : sb.kind === "capability" ? capabilities.has(ref) : true;
        if (!ok) {
          satisfied.push({
            where: `${r.id}/${key}`,
            detail: `is satisfiedBy ${sb.kind} "${ref}", which does not exist — the thing claimed to discharge this statement cannot be opened.`,
          });
        }
      }
    }
    const badParents = (r.raw.derivedFrom ?? [])
      .filter((d) => !reqIds.has(d))
      .map((d) => ({ where: r.id, detail: `derives from "${d}", which is not a declared requirement.` }));

    const criteria: Record<string, KgCriterionEntry> = {
      "requirement-satisfied-by-resolves": entry(satisfied),
      "requirement-actors-resolve": entry(badActors),
      "requirement-derived-from-resolves": entry(badParents, (r.raw.derivedFrom ?? []).length > 0),
      "requirement-statements-graded": entry(ungraded, (r.raw.statements ?? []).length > 0),
    };
    return report("requirement", r.id, relative(root, r.path), hash, criteria, auditorHash);
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

/**
 * Every skill `skill_fetch` can actually hand to an agent.
 *
 * Read from `LOCAL_PACKAGES` in `src/tools/skill-fetch.ts` rather than from a
 * list here, because a second copy of "which directories are served" is a
 * second answer free to disagree with the first — and the whole defect this
 * criterion exists for was a directory missing from that one table.
 */
function servableSkills(): Set<string> {
  const out = new Set<string>();
  for (const dir of Object.values(LOCAL_PACKAGES)) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) if (f.endsWith(".md")) out.add(f.slice(0, -3));
  }
  return out;
}

/**
 * Skills the Claude Code harness loads directly from `.claude/skills/local/`.
 *
 * Reachable without any manifest or package: the harness reads the directory.
 * `scripts/generate-registry.ts` treats this same directory, and only this one
 * under `.claude/skills/`, as `SkillDefinition`.
 */
function localHarnessSkills(): Set<string> {
  const out = new Set<string>();
  const dir = join(root, ".claude", "skills", "local");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".md")) out.add(f.slice(0, -3));
    else if (f.endsWith(".json")) out.add(f.slice(0, -5));
  }
  return out;
}

/**
 * Skills a REMOTE package declares it provides.
 *
 * `skills/remote-packages/*.json` name an external repo and, under
 * `wrapper.skills`, the skills it supplies — `claude-scientific-skills`
 * provides `scientific-visualization`, `hypothesis-generation` and
 * `scientific-critical-thinking`. Their bodies are not in this checkout until
 * the package is synced, so they are correctly ABSENT from `knownSkills()`:
 * nothing here can serve one.
 *
 * But a local manifest naming one is not lying — it is naming a skill that
 * comes from a dependency. Counting them only for `manifest-skill-exists` is
 * the distinction: *can this instance serve it* and *is this entry a real
 * skill somewhere* are different questions, and collapsing them would have had
 * this criterion demand the deletion of three correct manifest entries the
 * first time it ran. That very nearly happened.
 */
function remotePackageSkills(): Set<string> {
  const out = new Set<string>();
  const dir = join(root, "skills", "remote-packages");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      const p = JSON.parse(readFileSync(join(dir, f), "utf-8")) as { wrapper?: { skills?: string[] } };
      for (const s of p.wrapper?.skills ?? []) out.add(s);
    } catch {
      // A remote-package file that will not parse is validate-skills.ts's finding.
    }
  }
  return out;
}

/** Manifest entries, with the package each came from, for the reverse check. */
function manifestEntries(): { pkg: string; skill: string }[] {
  const out: { pkg: string; skill: string }[] = [];
  const skillsRoot = join(root, "skills");
  if (!existsSync(skillsRoot)) return out;
  for (const d of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const mp = join(skillsRoot, d.name, "package-manifest.json");
    if (!existsSync(mp)) continue;
    try {
      const m = JSON.parse(readFileSync(mp, "utf-8")) as { skills?: string[] };
      for (const s of m.skills ?? []) out.push({ pkg: d.name, skill: s });
    } catch {
      // `validate-skills.ts`'s finding, not this one's.
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
  for (const s of servableSkills()) reachable.add(s);
  for (const s of localHarnessSkills()) reachable.add(s);
  for (const r of graph?.roles ?? []) for (const s of r.skills) reachable.add(s);
  for (const p of processes) {
    for (const n of p.model?.nodes.values() ?? []) for (const s of n.skills) reachable.add(s);
  }
  const orphans = [...skills]
    .filter((s) => !reachable.has(s))
    .sort()
    .map((s) => ({ where: s, detail: `skill "${s}" is listed by no package manifest, carried by no role and named by no activity.` }));

  // The OTHER question, asked separately because the answers differ by two
  // orders of magnitude: what does the actor → role → task model actually
  // reach? `reachable` above is dominated by the servable clause, so it passes
  // over almost everything; this counts only the two clauses that are part of
  // the process model. Coverage, never a gate — see the criterion's note.
  const modelled = new Set<string>();
  for (const r of graph?.roles ?? []) for (const s of r.skills) modelled.add(s);
  for (const p of processes) {
    for (const n of p.model?.nodes.values() ?? []) for (const s of n.skills) modelled.add(s);
  }
  const unmodelled = [...skills]
    .filter((s) => !modelled.has(s))
    .sort()
    .map((s) => ({
      where: s,
      detail: `no role carries "${s}" and no activity names it — reached, if at all, by direct invocation.`,
    }));

  const declaredRoles = new Set((graph?.roles ?? []).map((r) => r.id));
  const badActorRoles = actors.flatMap((a) =>
    (a.roles ?? [])
      .filter((r) => !declaredRoles.has(r))
      .map((r) => ({
        where: a.id,
        detail: `${relative(root, a.path)} lists role "${r}", which the role graph does not declare.`,
      })),
  );

  const capabilities = new Set<string>();
  if (existsSync(CAPABILITY_DIR)) {
    for (const f of readdirSync(CAPABILITY_DIR)) if (f.endsWith(".json")) capabilities.add(f.slice(0, -5));
  }
  const badCaps: KgFinding[] = [];
  for (const a of actors) {
    for (const c of a.capabilities ?? []) {
      if (!capabilities.has(c)) {
        badCaps.push({
          where: a.id,
          detail: `${relative(root, a.path)} claims capability "${c}", which the registry does not declare.`,
        });
      }
    }
  }

  const declaredPerms = new Set((readPermissions(KG_ROOT)?.permissions ?? []).map((p) => p.id));
  const badPerms: KgFinding[] = [];
  for (const a of actors) {
    for (const perm of a.permissions ?? []) {
      if (!declaredPerms.has(perm)) {
        badPerms.push({
          where: a.id,
          detail: `${relative(root, a.path)} claims permission "${perm}", which skills/permissions/permissions.json does not declare.`,
        });
      }
    }
  }

  const roleish = actors
    .filter((a) => a.looksLikeRole)
    .map((a) => ({ where: a.id, detail: `${relative(root, a.path)} carries \`inherits\` — an actor does not inherit, a role does. Migration debt from before roles were declared.` }));

  return report(
    "graph",
    "kg",
    null,
    null,
    {
      "skill-has-entry-point": entry(orphans),
      // `unknown` when there is no role graph: with no roles declared, every
      // skill looks unmodelled and the count would be the whole corpus — a
      // number that says nothing about the corpus and everything about the
      // missing file. Reporting it as a finding would be a wall of noise.
      "skill-in-role-or-process": graph
        ? entry(unmodelled)
        : { result: "unknown" as KgResult, findings: [{ where: "—", detail: "no role graph declared." }] },
      "manifest-skill-exists": (() => {
        const remote = remotePackageSkills();
        return entry(
          manifestEntries()
            .filter((e) => !skills.has(e.skill) && !remote.has(e.skill))
            .map((e) => ({
              where: `${e.pkg}/${e.skill}`,
              detail:
                `skills/${e.pkg}/package-manifest.json names "${e.skill}", which resolves to no skill here ` +
                `and is declared by no remote package.`,
            })),
        );
      })(),
      // Without a role graph there is nothing to resolve against, and reporting
      // every actor's roles as dangling would be a wall of false findings.
      "actor-roles-resolve": graph
        ? entry(badActorRoles)
        : { result: "unknown", findings: [{ where: "—", detail: "no role graph to resolve actor roles against." }] },
      "actor-capabilities-resolve": entry(badCaps),
      "actor-permissions-resolve": entry(badPerms),
      "actor-is-not-a-role": entry(roleish),
    },
    auditorHash,
  );
}

// ── Sidecar IO ──────────────────────────────────────────────────

function sidecarPath(r: KgQaReport): string {
  // A skill's sidecar sits beside the skill, because skills live under
  // several packages and a single directory would collide two packages'
  // same-named skills into one file.
  if (r.subject.kind === "skill" && r.subject.path) {
    const abs = join(root, r.subject.path);
    return join(dirname(abs), KG_QA_DIRNAME, `${basename(abs, ".md")}.kg-qa.json`);
  }
  const dirFor: Record<KgSubjectKind, string> = {
    process: join(WORKFLOW_DIR, KG_QA_DIRNAME),
    decision: join(DECISION_DIR, KG_QA_DIRNAME),
    role: join(KG_ROOT, "roles", KG_QA_DIRNAME),
    requirement: join(KG_ROOT, "requirements", KG_QA_DIRNAME),
    // Fallback only: a skill's sidecar sits beside the skill itself, resolved
    // above, because one shared directory would collide two packages' skills
    // of the same name.
    skill: join(KG_ROOT, KG_QA_DIRNAME),
    graph: join(KG_ROOT, "roles", KG_QA_DIRNAME),
  };
  const stem = r.subject.path ? basename(r.subject.path).replace(/\.(bpmn|dmn|json)$/, "") : r.subject.id;
  const name = r.subject.kind === "role" || r.subject.kind === "requirement" ? r.subject.id : stem;
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
const processIds = new Set(processes.flatMap((p) => (p.model ? [p.model.id] : [])));
for (const p of processes) reports.push(await auditProcess(p, graph, skills, processIds, auditorHash));
reports.push(...(await auditDecisions(processes, auditorHash)));
if (graph) {
  reports.push(...auditRoles(graph, join(KG_ROOT, "roles", "roles.json"), processes, actors, skills, auditorHash));
}
reports.push(...auditRequirements(readRequirements(), skills, actors, auditorHash));
reports.push(...auditSkills(auditorHash));
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
