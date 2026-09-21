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
import { kgDirectories, ownKgRoots, workflowDirs, workflowFiles } from "./known-skills.js";
// `Dirent` for the orphan-sidecar sweep (bean `3jj9`), which walks the
// results tree with `withFileTypes` to tell a directory from a file.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import {
  KG_QA_SCHEMA,
  KG_QA_DIRNAME,
  kgQaSidecarPath,
  sweepOrphans,
  type OrphanSidecar,
  KG_QA_MANIFEST_SCHEMA,
  KG_QA_MANIFEST_PATH,
  KG_CRITERIA_BY_ID,
  criteriaFor,
  tally,
  worstSeverity,
  type KgCriterionEntry,
  type KgFinding,
  type KgQaManifest,
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
import { raciBreaches, raciRowsOf, type RaciBreachKind } from "./raci-chart.js";
import { loadDecisionTable, possibleOutcomes } from "../src/workflow/decision-table.js";
import {
  consultedSkills,
  unpublishedSkills,
  isSkillMd,
  knownSkills,
  remotePackageDeclarations,
  remotePackageSkills,
} from "./known-skills.js";
import { LOCAL_PACKAGES } from "../src/tools/skill-fetch.js";
import { repoRootFor, DECLARATION_SUFFIX } from "../schemas/cat-harness.js";
import { CONVENTION_GROUP } from "../schemas/convention.js";

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
function readsProse(r: { actedUpon?: boolean; actorKinds: string[] }): boolean {
  // ANY, not every. A role a person may take on has prose read in it, even
  // where a mechanical actor may also fill the lane — the question is whether
  // the instructions can reach a reader, and one reader is enough.
  return !r.actedUpon && r.actorKinds.some((k) => k === "person" || k === "agent");
}

const root = resolve(import.meta.dir, "..");
const WORKFLOW_DIR = join(root, "processes");
const DECISION_DIR = join(WORKFLOW_DIR, "decisions");
const KG_ROOT = join(root, "skills");
const ACTOR_DIR = join(repoRootFor(root), ".claude", "skills", "actors");
const CAPABILITY_DIR = join(repoRootFor(root), ".claude", "skills", "capabilities");
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
): KgQaReport {
  return {
    $schema: KG_QA_SCHEMA,
    subject: { kind, id, path },
    source_hash: sourceHash,
    criteria,
    totals: tally(criteria),
  };
}

// ── Corpus ──────────────────────────────────────────────────────

interface LoadedProcess {
  /** ABSOLUTE path. Was a bare basename joined to one WORKFLOW_DIR, which
   *  stopped being a single directory once an instance can declare several. */
  file: string;
  model?: ProcessModel;
  error?: string;
}

async function loadProcesses(): Promise<LoadedProcess[]> {
  // Every declared knowledge-graph directory, via the same helper the other
  // consumers use, so none of them can disagree about where diagrams live.
  const files = workflowFiles(root).filter((f) => f.endsWith(".bpmn"));
  const out: LoadedProcess[] = [];
  for (const file of files) {
    try {
      out.push({ file, model: await loadProcessModel(file) });
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
): Promise<KgQaReport> {
  const rel = relative(root, p.file);
  const hash = sha256(readFileSync(p.file, "utf-8"));

  if (!p.model) {
    return report("process", basename(p.file, ".bpmn"), rel, hash, allUnknown("process", `the diagram would not load: ${p.error}`));
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
        detail: `lane "${lane.name ?? lane.id}" matches no declared role. Add the name to a role's \`lanes\` in scenarios/roles.json, or bind it with <folio:role ref="…"/>.`,
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
  // nothing joined that answer to the role graph's `actorKinds`.
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
      // INTERSECTION, non-empty. The step says which kinds may perform it and
      // the role says which may take it on; the step is fillable when some
      // kind satisfies both. Requiring every kind the role admits would fail a
      // lane the moment it was widened to include a second one, which is
      // exactly backwards.
      if (role.actorKinds.some((k) => allowed.includes(k))) continue;
      const how = n.fulfilment
        ? `<folio:fulfilment/> on the step allows ${allowed.join(", ")} (${n.fulfilment.reason})`
        : `a ${n.type.replace("bpmn:", "")} is performed by ${allowed.join(" or ")}`;
      wrongKind.push({
        where: n.id,
        detail:
          `"${n.name}" — ${how}, but its lane's role "${roleId}" admits only ${role.actorKinds.join(", ")}. ` +
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

  // CONVENTION REFS. The dangling direction only — see the criterion's note
  // in `kg-qa.ts` for why absence is deliberately not a finding.
  const conventionDir = join(repoRootFor(root), ".claude", "skills", CONVENTION_GROUP);
  const knownConventions = existsSync(conventionDir)
    ? new Set(readdirSync(conventionDir).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)))
    : undefined;
  const danglingConvention: KgFinding[] = [];
  let conventionRefs = 0;
  if (knownConventions) {
    for (const n of m.nodes.values()) {
      for (const c of n.conventions ?? []) {
        conventionRefs += 1;
        if (!knownConventions.has(c.ref)) {
          danglingConvention.push({
            where: n.id,
            detail: `names convention \`${c.ref}\` (${c.scope} scope), which is not in ${CONVENTION_GROUP}/`,
          });
        }
      }
    }
  }

  // RACI. ONE implementation, shared with `bun run raci` — `raciBreaches`
  // tags each breach with its kind, so three severities can be filed
  // separately without a second copy of the rule. Two answers to "is this
  // chart sound" is the drift this whole cluster exists to prevent.
  //
  // Rows come from the model already loaded here rather than from re-reading
  // the diagram: the sidecar records that file's content hash, so a second
  // parse would be filed under the first one's hash and free to disagree.
  const raciRows = raciRowsOf(m);
  const raciAll = graph
    ? raciBreaches(raciRows, new Set((graph.roles ?? []).map((r) => r.id)))
    : [];
  const raciOf = (k: RaciBreachKind): KgFinding[] =>
    raciAll.filter((b) => b.kind === k).map((b) => ({ where: b.activity, detail: b.detail }));
  // Applicable only where the diagram CLAIMS something. An activity with no
  // RACI is `n/a`, never a failure: annotation is incremental by design and
  // the rule is on what a diagram claims, not on how much it has claimed.
  const raciApplies = Boolean(graph) && raciRows.length > 0;

  const criteria: Record<string, KgCriterionEntry> = {
    "raci-role-resolves": entry(raciOf("role-undeclared"), raciApplies),
    "raci-single-accountable": entry(raciOf("accountable-count"), raciApplies),
    "raci-accountable-not-consulted": entry(raciOf("accountable-also-consulted"), raciApplies),
    // `n/a` when the diagram binds none, which is most of them — distinct
    // from `pass`, because a process with nothing to resolve has not been
    // shown to resolve anything.
    "convention-ref-resolves": entry(danglingConvention, conventionRefs > 0),
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
    for (const id of [
      "role-ref-resolves",
      "lane-binds-role",
      "role-carries-activity-skill",
      "activity-fulfilment-kind",
      // Every RACI value IS a role, so with no registry none of the three can
      // be resolved. `unknown` rather than `pass` — the third state, and the
      // reason this audit writes sidecars rather than printing a verdict.
      "raci-role-resolves",
      "raci-single-accountable",
      "raci-accountable-not-consulted",
    ]) {
      criteria[id] = { result: "unknown", findings: [{ where: "—", detail: "no role graph declared at scenarios/roles.json." }] };
    }
  }
  return report("process", m.id, rel, hash, criteria);
}

// ── Per-decision criteria ───────────────────────────────────────

async function auditDecisions(
  processes: LoadedProcess[],
): Promise<KgQaReport[]> {
  const decisionDirs = workflowDirs(root)
    .map((d) => join(d, "decisions"))
    .filter((d) => existsSync(d));
  if (decisionDirs.length === 0) return [];
  const referenced = new Set<string>();
  for (const p of processes) {
    for (const n of p.model?.nodes.values() ?? []) {
      if (n.decisionRef) referenced.add(n.decisionRef.replace(/^decisions\//, ""));
    }
  }

  const out: KgQaReport[] = [];
  for (const abs of decisionDirs
    .flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".dmn")).map((f) => join(d, f)))
    .sort()) {
    const f = basename(abs);
    const rel = relative(root, abs);
    const hash = sha256(readFileSync(abs, "utf-8"));
    // Every `<decision id>` the file declares. Read from the XML rather than
    // through the loader, because the loader needs a decision id to be given.
    const ids = [...readFileSync(abs, "utf-8").matchAll(/<(?:dmn:)?decision\s[^>]*id="([^"]+)"/g)].map((m) => m[1]!);
    if (ids.length === 0) {
      out.push(report("decision", f.replace(/\.dmn$/, ""), rel, hash, allUnknown("decision", "no <decision id=…> found in the file.")));
      continue;
    }
    const findings: KgFinding[] = [];
    for (const id of ids) {
      const ref = `${f}#${id}`;
      if (!referenced.has(ref)) {
        findings.push({ where: id, detail: `decision "${ref}" is referenced by no gateway in processes/. Either wire it with <folio:decision ref="decisions/${ref}"/> or delete it.` });
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
    out.push(report("decision", f.replace(/\.dmn$/, ""), rel, hash, { "decision-outcomes-used": entry(findings) }));
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
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      // A declared-but-absent directory is `dh4f`: scanning nothing and
      // reporting a clean run over it. Skipped here and surfaced by
      // `check:harness-dirs`, which is the check that owns that question.
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== KG_QA_DIRNAME) walk(p);
      } else if (e.name.endsWith(".md") && !isPartOfASkill(p) && isSkillMd(p)) {
        out.push(p);
      }
    }
  };
  for (const r of ownKgRoots(root)) walk(r);
  // Deduplicated: two declared roots may nest, and a skill found twice would
  // be audited twice into one sidecar path — the second verdict silently
  // overwriting the first, which is the collision `sidecarPath` exists to
  // avoid one level down.
  return [...new Set(out)].sort();
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
function auditSkills(): KgQaReport[] {
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

    // `stub:` in the front matter, if any. Read positionally rather than with a
    // YAML parser because the front matter here is already walked line-by-line
    // above, and a stub's reason is a single scalar.
    let stubReason: string | undefined;
    if (lines[0]?.trim() === "---") {
      for (let i = 1; i < lines.length; i += 1) {
        const l = lines[i]!;
        if (l.trim() === "---") break;
        const m = /^stub:\s*(.+?)\s*$/.exec(l);
        if (m) {
          stubReason = m[1]!.replace(/^["']|["']$/g, "");
          break;
        }
      }
    }

    out.push(
      report(
        "skill",
        basename(file, ".md"),
        rel,
        createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 12),
        {
          // A stub declares itself in front matter, and the DECLARATION is the
          // contract — not a filename convention, not a line count. Same rule
          // as every other node kind here: extension is a coincidence, a
          // declaration inside the file is binding.
          //
          // The reason is carried into the finding rather than summarised,
          // because "this is a stub" without "and here is what would finish it"
          // is a note nobody can act on.
          "skill-is-a-stub": entry(
            stubReason === undefined
              ? []
              : [{ where: rel, detail: stubReason }],
          ),
          "skill-is-brief": entry(
            n > 280 ? [{ where: rel, detail: `${n} lines; p75 of the skill corpus is 279.` }] : [],
          ),
          "skill-not-a-document": entry(
            n > 400 ? [{ where: rel, detail: `${n} lines; p90 is 391. At this length it is a document.` }] : [],
          ),
          "skill-no-repeated-heading": entry(repeats),
        },
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
      // The other direction, and the one that was unanswerable while a role
      // carried a single kind: an actor declares this role, so is its OWN kind
      // among the kinds the role admits?
      //
      // `n/a` for an `actedUpon` lane (a store has no actor) and `unknown`
      // where no entry declares `roles` at all — the same two scopings
      // `role-has-actor` uses, for the same reasons, so the two directions of
      // one question cannot disagree about when it is askable.
      "actor-kind-fits-role": r.actedUpon
        ? entry([], false)
        : anyActorDeclaresRoles
        ? entry(
            actors
              .filter((a) => (a.roles ?? []).includes(r.id))
              .filter((a) => !r.actorKinds.includes(a.kind))
              .map((a) => ({
                where: a.id,
                detail:
                  `actor "${a.id}" is a ${a.kind} and declares role "${r.id}", which admits ` +
                  `${r.actorKinds.join(", ")}. Either the role is too narrow — widen its ` +
                  `\`actorKinds\` — or the actor cannot take this role on and its \`roles\` ` +
                  `list is wrong. The descriptions of both are where to settle it.`,
              })),
          )
        : {
            result: "unknown",
            findings: [
              {
                where: r.id,
                detail:
                  "the actor registry declares no `roles` on any entry, so actor-kind fit could not be evaluated. " +
                  "This is a gap in the registry, not a pass.",
              },
            ],
          },
    };
    return report("role", r.id, rel, hash, criteria);
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
    return report("requirement", r.id, relative(root, r.path), hash, criteria);
  });
}

// ── Graph roll-up ───────────────────────────────────────────────

/**
 * Every package manifest this instance declares, with the package it names.
 *
 * ## Two defects this replaces, and both were the same shape
 *
 * `manifestSkills` and `manifestEntries` each walked `join(root, "skills")` and
 * each scanned exactly one level of subdirectories. So:
 *
 * 1. **The path was hardcoded**, not read from the declaration. That is the
 *    defect `harness.json` exists to remove, and the third instance of it found
 *    in two days — `KG_ROOT` here and `SKILLS_CATEGORIES` in `gen-skill-docs`
 *    were the others. A hardcoded root scans the wrong tree the moment the
 *    layout moves, which it did on 2026-09-20.
 * 2. **A manifest AT a declared directory was invisible**, because the walk only
 *    looked inside subdirectories. `gen-skill-docs` already documents that two
 *    declared directories — `bootstrap` and `cat-harness-src` — "hold their
 *    skills DIRECTLY rather than in package subdirectories". So a manifest for
 *    those could not be found however correctly it was written, which is why
 *    `confirm-harness` reported as listed by no package manifest while being
 *    perfectly declarable.
 *
 * One walk now, returning both shapes the callers wanted, so the two cannot
 * drift apart again.
 */
function manifestPackages(): { pkg: string; skill: string }[] {
  const out: { pkg: string; skill: string }[] = [];
  const read = (mp: string, pkg: string): void => {
    if (!existsSync(mp)) return;
    try {
      const m = JSON.parse(readFileSync(mp, "utf-8")) as { skills?: string[] };
      for (const s of m.skills ?? []) out.push({ pkg, skill: s });
    } catch {
      // A manifest that will not parse is `validate-skills.ts`'s finding, not
      // this one's. Treating it as "declares nothing" here would turn one
      // defect into a hundred unrelated orphan reports.
    }
  };
  for (const d of kgDirectories(root)) {
    // A manifest at the declared directory itself: the shape `bootstrap` and
    // `cat-harness-src` use.
    read(join(d.absPath, "package-manifest.json"), d.id);
    if (!existsSync(d.absPath)) continue;
    // ...and one per package subdirectory: the shape `skills/` uses.
    for (const e of readdirSync(d.absPath, { withFileTypes: true })) {
      if (e.isDirectory()) read(join(d.absPath, e.name, "package-manifest.json"), e.name);
    }
  }
  return out;
}

function manifestSkills(): Set<string> {
  return new Set(manifestPackages().map((m) => m.skill));
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
  const dir = join(repoRootFor(root), ".claude", "skills", "local");
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".md")) out.add(f.slice(0, -3));
    else if (f.endsWith(".json")) out.add(f.slice(0, -5));
  }
  return out;
}

/** Manifest entries, with the package each came from, for the reverse check. */
function manifestEntries(): { pkg: string; skill: string }[] {
  return manifestPackages();
}

/**
 * Nested instances in this tree whose graph this audit does not read.
 *
 * ## Why this is reported rather than fixed
 *
 * Reading them would be the defect. `instance-graph-isolation.test.ts` guards a
 * leak that was LIVE on 2026-09-19: a filesystem walk discovered
 * `bootstrap/processes/` from the repository root and put 88 references to a
 * bootstrap process into folio-assistant's published graph. One instance's graph
 * must not carry another's nodes, and this audit is right not to.
 *
 * What was wrong is that nothing said so. The silence was read as a blind spot on
 * 2026-09-20 and "fixed" by declaring the nested directory at the root, which
 * re-introduced that leak until the test stopped it. So the unread corpus is
 * counted here: a reported number is not deducible-and-mis-deducible.
 *
 * A declaration counts as an instance when it names `directories`. That excludes
 * `docs/_data/harness.json`, which `sync-docs-harness` writes with the
 * reader-facing fields only — a Jekyll data file, not an instance.
 */
function unreadNestedInstances(): KgFinding[] {
  const repo = repoRootFor(root);
  const out: KgFinding[] = [];
  const walk = (dir: string, depth: number): void => {
    if (depth > 3) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        walk(p, depth + 1);
        continue;
      }
      if (!e.name.endsWith(DECLARATION_SUFFIX)) continue;
      // Not this audit's own instance, whichever directory that is.
      if (resolve(dir) === resolve(root)) continue;
      let decl: { directories?: unknown[]; name?: string };
      try {
        decl = JSON.parse(readFileSync(p, "utf-8")) as typeof decl;
      } catch {
        continue;
      }
      if (!Array.isArray(decl.directories) || decl.directories.length === 0) continue;
      const diagrams = workflowFiles(dir).filter((f) => f.endsWith(".bpmn")).length;
      out.push({
        where: relative(repo, p),
        detail:
          `nested instance "${decl.name ?? relative(repo, dir)}" declares its own graph, and this audit ` +
          `does not read it — ${diagrams} diagram(s) there are unaudited by this run. That is correct: ` +
          `one instance's graph must not carry another's nodes. Audit it from its OWN root, and do NOT ` +
          `declare its directories here — that re-introduces the leak ` +
          `instance-graph-isolation.test.ts guards.`,
      });
    }
  };
  walk(repo, 0);
  return out.sort((a, b) => a.where.localeCompare(b.where));
}

/**
 * The graph directories this audit actually read, as a phrase for a finding.
 *
 * ## Why every graph-ranging finding has to carry this
 *
 * A finding that says a skill is "named by no activity" is true OF THE GRAPH IT
 * RANGED OVER and says nothing about any other. Worded absolutely it reads as a
 * fact about the repository, and on 2026-09-20 a session read it that way:
 * `confirm-harness` is named three times by `bootstrap/processes/`, which this
 * audit does not read, so the absolute wording looked like a blind spot. The
 * session "fixed" it by declaring that directory at the root and re-introduced a
 * defect `instance-graph-isolation.test.ts` had been written the day before to
 * prevent — one instance's graph carrying another's nodes, which had put 88
 * references to a bootstrap process into folio-assistant's published graph.
 *
 * The isolation is correct and the scoping is correct. **Only the sentence was
 * wrong**, and it cost a change a test had to stop. Bean `sa8y`.
 */
function graphScope(): string {
  // No filter: `kgDirectories` already returns only the declared
  // knowledge-graph directories, which is exactly the set this audit walks.
  //
  // The DECLARED path string, not a computed relative one. Computing it against
  // this script's root printed `../bootstrap/skills` once the tree moved into
  // `cat-harness/`, which is accurate and reads like a bug — and it is the
  // declaration that a reader would go and edit. "Resolve, do not compose",
  // applied to a diagnostic rather than to a link.
  const dirs = kgDirectories(root).map((d) => `\`${d.id}\` at \`${d.path}\``);
  return dirs.length > 0 ? dirs.join(", ") : "no knowledge-graph directory declared";
}

/** Appended to any finding whose range is this instance's graph and not the tree. */
function scopedToThisGraph(): string {
  return (
    ` In this instance's graph only (read: ${graphScope()}) —` +
    " a nested instance may name it, and this audit does not read one."
  );
}

function auditGraph(
  graph: RoleGraph | undefined,
  processes: LoadedProcess[],
  actors: LoadedActor[],
  skills: Set<string>,
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
    .map((s) => ({
      where: s,
      detail:
        `skill "${s}" is listed by no package manifest, carried by no role and named by no activity.` +
        scopedToThisGraph(),
    }));

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
  // `consulted: true` is skipped, and that is the criterion becoming
  // MEANINGFUL rather than being relaxed. A skill that is reference material
  // belongs in no lane by its nature — `directory-conventions` is what a
  // performer reads, not a step anybody takes — so counting it as unbound
  // measured the criterion rather than the corpus. Bean `y1w9`.
  const consulted = consultedSkills(root);
  // A skill that must never reach a published graph cannot be carried by a
  // published role either, so reporting it as unbound measures the strip
  // rather than the corpus.
  //
  // `fsh-guts` is the standing case and it is STRUCTURAL, not an oversight:
  // a role carrying it emits a dangling `hasSkill` edge into the export,
  // because every emitter strips the node while the edge keeps its name.
  // Measured 2026-09-20 — adding it to `docs-authoring-agent` broke
  // `kg-export.test.ts` on exactly that. So the criterion would report it
  // forever and the only "fix" available would re-introduce the leak the
  // owner's "NEVER include fsh-guts in the KG" rule exists to prevent.
  //
  // Exempting on the DECLARATION rather than on the name, per the owner's
  // 2026-09-20 answer: the skill says `published: false` in its own front
  // matter, and this reads what it said. The narrower, safer direction is
  // deliberate — a skill is exempt here only because it opted out of
  // publication, never merely because nothing happens to bind it.
  const unpublished = unpublishedSkills(root);
  const unmodelled = [...skills]
    .filter((s) => !modelled.has(s) && !consulted.has(s) && !unpublished.has(s))
    .sort()
    .map((s) => ({
      where: s,
      detail:
        `no role carries "${s}" and no activity names it — reached, if at all, by direct invocation.` +
        scopedToThisGraph(),
    }));

  // The OTHER direction, and the reason the exemption is safe to grant. A
  // skill cannot be reference material AND a step somebody performs: if a
  // lane or a role claims it, either the annotation is wrong or the binding
  // is. Without this, `consulted: true` would be an unfalsifiable opt-out of
  // the criterion, which is a worse field than the one `qif9` removed.
  const consultedButPerformed = [...consulted]
    .filter((s) => modelled.has(s))
    .sort()
    .map((s) => ({
      where: s,
      detail:
        `"${s}" declares \`consulted: true\` — reference material nobody performs — ` +
        `but a role carries it or an activity names it. One of the two is wrong.` +
        scopedToThisGraph(),
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
      "consulted-skill-not-performed": entry(consultedButPerformed, consulted.size > 0),
      "skill-in-role-or-process": graph
        ? entry(unmodelled)
        : { result: "unknown" as KgResult, findings: [{ where: "—", detail: "no role graph declared." }] },
      // A REMOTE DECLARATION IS NOT RESOLUTION — measured 2026-09-19, bean `nup0`.
      //
      // This criterion used to accept an entry that any file under
      // `skills/remote-packages/` named, on the reading that "is this a real skill
      // somewhere" is the manifest's question, distinct from "can this instance
      // serve it". The distinction is right. What is missing is that nothing here
      // implements the "somewhere": `shallow-clone` exists only as a Zod enum
      // value, `src/tools/skill-fetch.ts` and `scripts/generate-registry.ts`
      // contain no mention of `remote-packages/` at all, and the single consumer —
      // `scripts/generate-docs.ts` — reads those files solely for Docker
      // requirements, which is what `schemas/skill-package.ts` documents them as.
      // (That consumer was retired to `fsh-guts/scripts/` on 2026-09-20,
      // having never been invoked in any commit since the root commit — bean
      // `folio-assistant-3w0i`. The reading below only gets stronger.)
      //
      // So an entry resolvable only that way publishes a registry name that
      // `skill_fetch` answers "not found" for, which is exactly the defect this
      // criterion is `critical` about.
      //
      // The allowance existed to stop this criterion demanding the deletion of
      // three `authoring-math` entries. Those three were deleted two hours later
      // by a session that had not seen it, and — measured above — deleting them
      // was RIGHT. The allowance was protecting the wrong answer.
      //
      // `remotePackageSkills` stays, to CLASSIFY the finding rather than excuse
      // it. "Declared by a remote package nothing syncs" and "named nowhere at
      // all" have different remedies, and a finding that does not say which is one
      // somebody has to measure again.
      "manifest-skill-exists": (() => {
        const remote = remotePackageSkills(root);
        return entry(
          manifestEntries()
            .filter((e) => !skills.has(e.skill))
            .map((e) => ({
              where: `${e.pkg}/${e.skill}`,
              detail: remote.has(e.skill)
                ? `skills/${e.pkg}/package-manifest.json names "${e.skill}", which this instance holds no ` +
                  `body for. A file under skills/remote-packages/ declares it, but nothing in this ` +
                  `repository syncs or serves a remote package — neither skill_fetch nor the registry ` +
                  `reads that directory — so the entry publishes a name that cannot be fetched. Implement ` +
                  `the sync or drop the entry; the declaration alone is not enough.`
                : `skills/${e.pkg}/package-manifest.json names "${e.skill}", which resolves to no skill here ` +
                  `and is declared by no remote package.`,
            })),
        );
      })(),
      // The other half of the same measurement, and the one the owner asked to
      // FAIL rather than be explained. `manifest-skill-exists` above asks
      // whether a MANIFEST names something unresolvable; this asks whether a
      // REMOTE PACKAGE declares something this instance cannot serve — five
      // names today, across two wrappers that both claim a weekly shallow-clone
      // nothing performs. Bean `wlqd`.
      //
      // Read from the wrapper files rather than from `remotePackageSkills`'s
      // flattened set, because a finding has to name WHICH wrapper declares it:
      // the two have different owners and different remedies.
      "remote-skill-is-servable": entry(
        remotePackageDeclarations(root)
          .filter((d) => !skills.has(d.skill))
          .map((d) => ({
            where: `${d.file}/${d.skill}`,
            detail:
              `skills/remote-packages/${d.file} declares "${d.skill}", which this instance holds no body ` +
              `for and cannot serve — skill_fetch does not read that directory and the generated registry ` +
              `does not carry it. The wrapper declares sync ${JSON.stringify(d.sync ?? null)}, and nothing ` +
              `performs it. Implement the sync (a platform capability change: GitHub issue + CRDM workflow ` +
              `first), or drop the declaration so the name stops being published.`,
          })),
      ),
      // Without a role graph there is nothing to resolve against, and reporting
      // every actor's roles as dangling would be a wall of false findings.
      "actor-roles-resolve": graph
        ? entry(badActorRoles)
        : { result: "unknown", findings: [{ where: "—", detail: "no role graph to resolve actor roles against." }] },
      "actor-capabilities-resolve": entry(badCaps),
      "actor-permissions-resolve": entry(badPerms),
      "actor-is-not-a-role": entry(roleish),
      "nested-instance-audited": entry(unreadNestedInstances()),
    },
  );
}

// ── Sidecar IO ──────────────────────────────────────────────────

function sidecarPath(r: KgQaReport): string {
  // ANY subject that records its own path resolves its directory from THAT,
  // not from a table keyed on its kind.
  //
  // This was skill-only, for a reason that turned out to be general: skills
  // live under several packages, so one directory per kind would collide two
  // packages' same-named skills into one sidecar. Processes have exactly that
  // shape the moment an instance declares more than one knowledge-graph
  // directory — `bootstrap/processes/` and `crdm/workflows/` can each hold a
  // `review.bpmn`, and a kind-keyed table sends both to one file, so one
  // silently overwrites the other's findings.
  //
  // So the table below is now what its own comment already called it for
  // skills: a FALLBACK, for subjects that carry no path — a role, a
  // requirement, the graph itself.
  const dirFor: Record<KgSubjectKind, string> = {
    process: WORKFLOW_DIR,
    decision: DECISION_DIR,
    role: join(KG_ROOT, "roles"),
    requirement: join(KG_ROOT, "requirements"),
    skill: KG_ROOT,
    graph: join(KG_ROOT, "roles"),
  };
  const stem = r.subject.path ? basename(r.subject.path).replace(/\.(bpmn|dmn|json|md)$/, "") : r.subject.id;
  const name = r.subject.kind === "role" || r.subject.kind === "requirement" ? r.subject.id : stem;
  const dir = r.subject.path ? dirname(join(root, r.subject.path)) : dirFor[r.subject.kind];
  return kgQaSidecarPath(root, dir, name);
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
  // `scenarios/`, not `KG_ROOT` — the role graph moved out of the skills tree
  // on 2026-09-21 and is a declared directory of its own now. `KG_ROOT` is
  // still the skills root, which is what every other use of it here wants.
  graph = readRoleGraph(join(root, "scenarios")) ?? readRoleGraph(KG_ROOT);
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
for (const p of processes) reports.push(await auditProcess(p, graph, skills, processIds));
reports.push(...(await auditDecisions(processes)));
if (graph) {
  reports.push(...auditRoles(graph, join(KG_ROOT, "roles", "roles.json"), processes, actors, skills));
}
reports.push(...auditRequirements(readRequirements(), skills, actors));
reports.push(...auditSkills());
reports.push(auditGraph(graph, processes, actors, skills));

// Write or compare.
//
// THE MANIFEST IS ONE FILE, AND THAT IS THE POINT. The auditor's hash used to
// be copied into every sidecar, where it could not differ between files —
// `auditorHash` is computed once above and there is no subset mode — so the
// copies were 218 restatements of one fact. Measured 2026-09-19: one added
// comment line in this script rewrote 218 sidecars with no verdict changed,
// which is what made two concurrent branches conflict by construction.
const stale: string[] = [];

const manifest: KgQaManifest = {
  $schema: KG_QA_MANIFEST_SCHEMA,
  auditor: {
    script: "scripts/kg-audit.ts",
    script_hash: auditorHash,
    engine_version: ENGINE_VERSION,
  },
};
const manifestPath = join(root, KG_QA_MANIFEST_PATH);
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
if (check) {
  const current = existsSync(manifestPath) ? readFileSync(manifestPath, "utf-8") : undefined;
  if (current !== manifestText) stale.push(KG_QA_MANIFEST_PATH);
} else {
  mkdirSync(join(manifestPath, ".."), { recursive: true });
  writeFileSync(manifestPath, manifestText);
}

/**
 * A sidecar whose subject MOVED follows it, instead of dying in place.
 *
 * Bean `lps0` asked for this and #760 walked straight into it: moving
 * `corpus-grep` from `src/skills/` to `skills/folio-core/` left its verdict
 * stranded at the old path, where the sweep below correctly reported it as
 * auditing a file that is not there. A verdict that has to be re-derived on
 * every relocation is a verdict nobody keeps.
 *
 * ## Why this is not the deletion the sweep refuses
 *
 * The sweep's own rule — REPORTED, NEVER DELETED — exists because an orphan
 * can mean the subject is temporarily UNDISCOVERED rather than gone, and
 * deleting on that evidence destroys a verdict to hide a declaration gap.
 * Nothing here deletes. A relocation PRESERVES the artefact and its history;
 * it moves the file to where its subject now lives, and an orphan that does
 * not match a moved subject is left exactly where it is, to be reported.
 *
 * ## The three conditions, and why each is required
 *
 * 1. `subjectExists === false` — CONFIRMED gone, never `undefined`. The third
 *    state is "could not read the sidecar", and a sidecar whose identity could
 *    not be read is precisely the one that must not be moved on a guess.
 * 2. The identity is `kind` + `id`, not the path and not the basename. The
 *    path is what changed; two packages can hold a same-named skill, so a
 *    basename match would move one package's verdict onto another's subject.
 * 3. Exactly ONE orphan and exactly ONE unwritten target per identity. Any
 *    ambiguity is left alone and reported: a verdict moved onto the wrong
 *    subject is worse than an orphan, because an orphan announces itself and
 *    a misfiled verdict reads as healthy.
 */
interface Relocation {
  from: string;
  to: string;
  identity: string;
}

function relocateSidecars(
  root: string,
  targets: ReadonlyMap<string, string>,
): Relocation[] {
  const orphans = sweepOrphans(root, new Set(targets.values()));
  const byIdentity = new Map<string, OrphanSidecar[]>();
  for (const o of orphans) {
    // Condition 1 and 2: confirmed gone, and carrying an identity to match on.
    if (o.subjectExists !== false || !o.kind || !o.id) continue;
    const key = `${o.kind}:${o.id}`;
    (byIdentity.get(key) ?? byIdentity.set(key, []).get(key)!).push(o);
  }

  const moved: Relocation[] = [];
  for (const [key, rows] of byIdentity) {
    const dest = targets.get(key);
    // Condition 3: one orphan, one destination, and nothing already there.
    if (rows.length !== 1 || dest === undefined) continue;
    if (existsSync(dest)) continue;
    const from = join(root, rows[0]!.sidecar);
    if (!existsSync(from)) continue;
    mkdirSync(join(dest, ".."), { recursive: true });
    renameSync(from, dest);
    moved.push({ from: rows[0]!.sidecar, to: relative(root, dest), identity: key });
  }
  return moved;
}

// Targets FIRST, so a relocation can run before anything is written: once a
// fresh sidecar exists at the new path there is nothing left to move, and the
// old one is an orphan forever.
const targets = new Map<string, string>();
for (const r of reports) {
  if (r.subject.kind && r.subject.id) targets.set(`${r.subject.kind}:${r.subject.id}`, sidecarPath(r));
}
if (!check) {
  const moved = relocateSidecars(root, targets);
  for (const m of moved) {
    console.log(`  → moved ${m.from}\n      to ${m.to}  (${m.identity} relocated)`);
  }
}

const written = new Set<string>();
for (const r of reports) {
  const p = sidecarPath(r);
  written.add(resolve(p));
  const text = serialise(r);
  if (check) {
    const current = existsSync(p) ? readFileSync(p, "utf-8") : undefined;
    if (current !== text) stale.push(relative(root, p));
  } else {
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, text);
  }
}

// ── A SIDECAR NO REPORT ACCOUNTS FOR.
//
// The loop above compares each report against its file. It never looks the
// other way, so a sidecar whose SUBJECT has been renamed or deleted is
// structurally invisible: nothing regenerates it, nothing prunes it, and
// `--check` compares it against nothing.
//
// Measured, bean `3jj9`: `bootstrap/processes/bootstrap.kg-qa.json` sat in
// the tree auditing `bootstrap/processes/bootstrap.bpmn`, a path that does
// not exist — the process had been renamed to `initialize-harness.bpmn`.
// It reported `lane-binds-role: pass` over a file nobody had, while the live
// diagram had no sidecar at all, and `kg:audit:check` exited 0 across both.
// A verdict about a file that is gone is worse than no verdict: it is the
// one a reader trusts.
//
// REPORTED, NEVER DELETED. An orphan can also mean the subject is
// temporarily unreachable — here the real cause is bean `pve3`, the root
// declaring `bootstrap/skills/` but not `bootstrap/processes/`, so the
// process is simply not discovered from this root. Deleting on that
// evidence would destroy a verdict to hide a declaration gap.
// `deletion-requires-confirmation` — the agent reports, a person decides.
const orphans = sweepOrphans(root, written);
if (orphans.length > 0) {
  const gone = orphans.filter((o) => o.subjectExists === false);
  const present = orphans.filter((o) => o.subjectExists === true);
  const unknown = orphans.filter((o) => o.subjectExists === undefined);
  console.error(`\n\u2717 ${orphans.length} sidecar(s) audit a subject no report covers:`);
  const show = (label: string, rows: OrphanSidecar[], advice: string): void => {
    if (rows.length === 0) return;
    console.error(`\n  ${label} (${rows.length}):`);
    for (const o of rows.sort((a, b) => (a.sidecar < b.sidecar ? -1 : 1))) {
      console.error(`    ${o.sidecar}`);
    }
    console.error(`    ${advice}`);
  };
  show(
    "SUBJECT GONE",
    gone,
    "The audited file is not there. The verdict describes nothing; the sidecar is dead.",
  );
  show(
    "SUBJECT PRESENT, NOT AUDITED",
    present,
    "The file exists and this run did not audit it. Either discovery is wrong, or it\n" +
      "    is excluded on purpose — `isPartOfASkill` excludes a fragment that declares\n" +
      "    `part-of:`, and a sidecar predating that exclusion is stale, not evidence.",
  );
  show(
    "SUBJECT UNREADABLE",
    unknown,
    "The sidecar could not be parsed or names no path, so which case this is could\n" +
      "    not be determined. That is not a pass for it.",
  );
  console.error("\n  Reported, never deleted — `deletion-requires-confirmation`.");
  // And, since 2026-09-20, this FAILS `kg:audit:check`. Reporting without
  // failing is what let twelve of these accumulate: the finding printed `✗` on
  // every run while the gate set announced "53 gates pass", so the only reader
  // who would ever act on it was one already reading the log for another reason.
  //
  // Failing the check does NOT delete anything — the line above still holds, and
  // the remedy is still a person's. What changes is that the remedy cannot be
  // indefinitely deferred in silence.
  console.error("  It fails `kg:audit:check`; removing a dead sidecar is still yours to authorise.");
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
  // ORPHANS FAIL, and they did not until the count reached zero.
  //
  // The sweep printed its findings to stderr and `orphans` appeared nowhere in
  // this expression, so `kg:audit:check` reported twelve and exited 0 — a
  // report nobody fails on, which is `xom7`: from inside a checkout that looks
  // exactly like a clean run. CI ran this command and was green over all of
  // them.
  //
  // Gating earlier would have been gating a backlog, which is how a check gets
  // switched off within a week. The repository's own precedent is the ruff
  // comment in `code-quality-gates.yml`: **a check is an error only once its
  // count is zero.** The twelve were cleared in the commit that added this
  // line — four whose subject had moved, eight written before
  // `isPartOfASkill` existed — so it starts at zero and any new one is a
  // regression rather than debt.
  //
  // Three further points, from a second session that reached this same change
  // independently and whose merge is where these were folded in:
  //
  //   · WHY the severity gate could not already see them: orphans are computed
  //     outside `reports`, so `worstSeverity` has nothing to rank. They are not
  //     findings ABOUT a subject — a stale sidecar is a verdict that has not
  //     caught up, an orphaned one a verdict about something this run did not
  //     judge — which is why they sit beside `stale` rather than inside the
  //     severity ladder.
  //   · ALL THREE orphan groups count, the UNREADABLE one included. `AGENTS.md`
  //     on this repository's own sweeps: could-not-determine "is never rendered
  //     as clean" and it "outranks a finding" — a sweep blind on one check has
  //     not cleared the others. Excluding the unresolvable case would put the
  //     third state back on the pass side.
  //   · Only `--check` gates. Bare `kg:audit` is the WRITER and still exits 0,
  //     or regenerating after a rename would fail the very command you run to
  //     fix it.
  process.exit(stale.length || tripped || orphans.length > 0 ? 1 : 0);
}
process.exit(0);
