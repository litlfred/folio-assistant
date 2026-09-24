/**
 * The QA/QC report over PROV-O: the agentic engine's after-check.
 *
 * Issue #1180, step 5 of `docs/proposals/odrl-prov-actor-model.md`. The
 * deterministic engine checks the ODRL policy BEFORE a task and refuses
 * (`src/workflow/authorize.ts`, issue #1207). An agent swarm acts first, so
 * the same policy has to be checked AFTER, from the record of what was done
 * (`content/docs/agentic-harness/bpmn-execution.md`: "one skill, two
 * engines"). This script is that check.
 *
 * For every workflow instance in `beans/workflows/` (and every subprocess
 * instance inside it), for each history entry whose node is an activity or a
 * decision in its process model:
 *
 * 1. **The record.** One `prov:Activity`, validated by `ProvActivitySchema`:
 *    `prov:agent` is the entry's actor, `prov:hadRole` the role the node's
 *    lane binds (`laneBinding`), `prov:hadPlan` `<process stem>#<node id>`,
 *    `prov:startedAtTime` the entry's `at`, and `cat-harness:underPolicy` the
 *    uid(s) of every policy evaluated. Written per instance to
 *    `docs/assets/prov/<instance>.prov.jsonld`.
 * 2. **The check.** `authorizeTask`, the before-check itself, re-run with the
 *    principal `asserted`, because history records only a name. Nothing is
 *    re-implemented here: a second copy of the rule would be a second answer
 *    free to disagree with the first.
 *
 * ## Nothing is invented
 *
 * `ProvAssociationSchema` requires `prov:agent` and `prov:hadRole`. An entry
 * with no actor, or in a lane that binds no role, cannot honestly fill them,
 * so NO activity is emitted for it and the gap is a finding (`no-actor`,
 * `no-role`). PROV-O itself makes `hadRole` optional; the schema does not,
 * and filling it with a guess to satisfy the schema is the fabrication this
 * report exists to catch.
 *
 * Owner, 2026-09-24, asked whether to relax that to PROV-O's optional
 * `hadRole`: *"Keep required"*. The page says so.
 *
 * ## Advisory: findings do not fail the build
 *
 * Owner, 2026-09-23: advisory first (see `authorize.ts`). So a finding is
 * reported, never fatal. `--check` fails only on stale outputs, a
 * `prov:Activity` that does not validate, or an internal error (a process
 * model that cannot be loaded). `unknown` is never read as permit.
 *
 * Usage:  bun run cat-harness/scripts/prov-qaqc.ts [--check]
 *
 * @module cat-harness/scripts/prov-qaqc
 * @covers workflow-state, policies, scenarios — it re-checks the ODRL policy AFTER the fact
 *   from the workflow record, so its subjects are the instance state, the policies it grades
 *   against, and the role graph naming the actors
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";

import { repoRootFor, siteDirFor } from "../schemas/cat-harness.js";
import { CAT_HARNESS_NS, FOLIO_BASE } from "../schemas/namespaces.js";
import { ProvActivitySchema, type ProvActivity } from "../schemas/prov.js";
import { laneBinding, type RoleGraph } from "../schemas/role-graph.js";
import { accessContext, type AccessContext, type Principal } from "../src/core/access.js";
import { authorizeTask, type TaskAuthVerdict } from "../src/workflow/authorize.js";
import type { HistoryEntry, InstanceState } from "../src/workflow/instance.js";
import { isActivity, isDecision, loadProcessModel, type ProcessModel } from "../src/workflow/process-model.js";
import { listInstances } from "../src/workflow/store.js";
import { roleGraphFor, workflowFiles } from "./known-skills.js";

const HARNESS = resolve(import.meta.dir, "..");
const REPO = repoRootFor(HARNESS);
/** The platform site the report publishes to: the declared site directory, never a literal. */
const SITE = join(HARNESS, siteDirFor(HARNESS));
export const PAGE = join(SITE, "prov-qaqc", "index.md");
export const ASSETS = join(SITE, "assets", "prov");

/** The PROV-O namespace. `prov:` in every term below expands to it. */
export const PROV_NS = "http://www.w3.org/ns/prov#";

export const FINDING_KINDS = [
  "no-actor",
  "no-role",
  "undeclared-actor",
  "not-eligible",
  "unknown",
  "deny",
  "authz-disagrees",
  "node-not-in-model",
  "source-moved",
  "source-missing",
] as const;
export type FindingKind = (typeof FINDING_KINDS)[number];

/** What each kind means, for the page. */
export const FINDING_MEANING: Readonly<Record<FindingKind, string>> = {
  "no-actor": "the entry names nobody; no activity is emitted, because `prov:agent` is required and would have to be invented",
  "no-role": "the node's lane binds no role; no activity is emitted, because `ProvActivitySchema` requires `prov:hadRole` (PROV-O itself does not)",
  "undeclared-actor": "the actor is not declared in `.claude/skills/actors/`",
  "not-eligible": "the actor's `roles` do not include the role the lane binds",
  unknown: "no ODRL policy grants `perform-task` here; `unknown` is never permit",
  deny: "an ODRL policy prohibits `perform-task` here",
  "authz-disagrees": "the verdict recorded in the entry's `authz` differs from the one recomputed now",
  "node-not-in-model": "the entry names a node its process model does not have",
  "source-moved":
    "the `.bpmn` the instance recorded is gone; the diagram was found by file name, as `workflow_start` resolves one, and its process id matches the instance's",
  "source-missing": "the `.bpmn` the instance recorded is gone and no diagram with that name and process id exists; nothing in it can be checked",
};

export interface Finding {
  instance: string;
  /** Index of the entry in its instance's `history`; -1 for a finding about the instance itself. */
  entry: number;
  node: string;
  kind: FindingKind;
  detail: string;
}

export interface InstanceReport {
  /** The instance id; a subprocess is `<parent>/<call activity>`. */
  id: string;
  /** Repo-relative path of the `.bpmn`. */
  source: string;
  activities: ProvActivity[];
  findings: Finding[];
  /** Activities or decisions in history, whether or not an activity was emitted. */
  checked: number;
}

export interface Report {
  /** Top-level instance id → its reports (itself first, then its subprocesses). */
  instances: Map<string, InstanceReport[]>;
  policies: string[];
  /** Activities that did not validate. Fatal under `--check`. */
  invalid: string[];
}

/** `code-change-review.bpmn` → `code-change-review`, lower-case so it satisfies `PLAN_REF`. */
export function processStem(source: string): string {
  return basename(source).replace(/\.bpmn$/i, "").toLowerCase();
}

/** JSON with every object's keys sorted, so the output is byte-stable. */
export function stableJson(v: unknown): string {
  const sort = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(sort)
      : x && typeof x === "object"
        ? Object.fromEntries(
            Object.keys(x as Record<string, unknown>)
              .sort()
              .map((k) => [k, sort((x as Record<string, unknown>)[k])]),
          )
        : x;
  return `${JSON.stringify(sort(v), null, 2)}\n`;
}

/** The role the node's lane binds, or why there is none. */
function laneRole(model: ProcessModel, nodeId: string, graph: RoleGraph | undefined): { role?: string; why?: string } {
  const node = model.nodes.get(nodeId)!;
  const lane = model.lanes.find((l) => l.id === node.laneId);
  if (!lane) return { why: "the node sits in no lane" };
  if (!graph) return { why: "no role graph is declared, so no lane's binding can be judged" };
  const b = laneBinding(graph, lane);
  switch (b.kind) {
    case "bound":
      return { role: b.role.id };
    case "variable":
      return { why: `lane "${lane.name ?? lane.id}" declares that its performer varies` };
    case "dangling":
      return { why: `lane "${lane.name ?? lane.id}" names role "${b.ref}", which is not declared` };
    case "contradictory":
      return { why: `lane "${lane.name ?? lane.id}" both names role "${b.ref}" and says its performer varies` };
    default:
      return { why: `lane "${lane.name ?? lane.id}" binds no role` };
  }
}

/** The fields of a recorded verdict the recomputed one must agree with. */
function disagreement(recorded: TaskAuthVerdict, now: TaskAuthVerdict): string | undefined {
  const diffs: string[] = [];
  if (recorded.authorized !== now.authorized) diffs.push(`policy ${recorded.authorized} → ${now.authorized}`);
  if (recorded.assignment !== now.assignment) diffs.push(`assignment ${recorded.assignment} → ${now.assignment}`);
  if ((recorded.role ?? null) !== (now.role ?? null)) diffs.push(`role ${recorded.role ?? "(none)"} → ${now.role ?? "(none)"}`);
  if (recorded.allowed !== now.allowed) diffs.push(`allowed ${recorded.allowed} → ${now.allowed}`);
  return diffs.length ? `recorded vs recomputed: ${diffs.join("; ")}` : undefined;
}

/**
 * One instance's history, as PROV activities and findings. Pure apart from
 * its inputs: the model, the role graph and the access context are supplied.
 */
export function reportInstance(
  id: string,
  state: Pick<InstanceState, "source" | "history">,
  model: ProcessModel,
  graph: RoleGraph | undefined,
  ctx: AccessContext,
): InstanceReport & { invalid: string[] } {
  const activities: ProvActivity[] = [];
  const findings: Finding[] = [];
  const invalid: string[] = [];
  const policies = [...ctx.policies.keys()].sort();
  const stem = processStem(state.source);
  let checked = 0;

  state.history.forEach((h: HistoryEntry, i) => {
    const add = (kind: FindingKind, detail: string) => findings.push({ instance: id, entry: i, node: h.node, kind, detail });
    const node = model.nodes.get(h.node);
    if (!node) {
      add("node-not-in-model", `${h.node} is not a node of ${model.id} as the diagram now stands`);
      return;
    }
    if (!isActivity(node) && !isDecision(node)) return;
    checked++;

    const { role, why } = laneRole(model, h.node, graph);
    // Since the engine went strict (bean `n2l9`), an entry recorded under a
    // verdict carries the principal that verdict was computed for: the actor
    // GitHub vouched for, not the name the caller typed (which may be a login).
    // Re-check THAT. An entry without one records only a name, which is
    // asserted and nothing more.
    const actor = (h.authz ? h.authz.actor : h.actor?.trim()) || null;
    const principal: Principal = h.authz
      ? { actor: h.authz.actor, authenticatedBy: h.authz.authenticatedBy, account: h.authz.account }
      : actor
        ? { actor, authenticatedBy: "asserted" }
        : { actor: null, authenticatedBy: "none" };
    const v = authorizeTask(ctx, { principal, process: model.id, task: h.node, ...(role ? { role } : {}) });

    if (!actor) add("no-actor", "no actor recorded; no prov:Activity emitted rather than an invented prov:agent");
    if (!role) add("no-role", `${why}; no prov:Activity emitted rather than an invented prov:hadRole`);
    if (v.assignment === "unknown-actor") add("undeclared-actor", `"${actor}" is not a declared actor`);
    if (v.assignment === "not-eligible") {
      const roles = ctx.actors.get(actor!)?.roles ?? [];
      add("not-eligible", `${actor} may act as ${roles.join(", ")}, not as ${role}`);
    }
    if (v.authorized === "unknown") add("unknown", `no policy grants perform-task for ${model.id}/${h.node}${role ? ` as ${role}` : ""}`);
    if (v.authorized === "deny") add("deny", `a policy prohibits perform-task for ${model.id}/${h.node}${role ? ` as ${role}` : ""}`);
    if (h.authz) {
      const d = disagreement(h.authz, v);
      if (d) add("authz-disagrees", d);
    }

    if (!actor || !role || policies.length === 0) return;
    // The engine's own record, written as the step was recorded, is the
    // authority when it exists; deriving one is for entries that predate it.
    const activity = h.prov ?? {
      "@type": "prov:Activity" as const,
      "@id": `${id}#${i}`,
      "prov:startedAtTime": h.at,
      "prov:qualifiedAssociation": {
        "prov:agent": actor,
        "prov:hadRole": role,
        "prov:hadPlan": `${stem}#${h.node}`,
      },
      "cat-harness:underPolicy": policies.length === 1 ? policies[0]! : policies,
    };
    const r = ProvActivitySchema.safeParse(activity);
    if (r.success) activities.push(r.data);
    else invalid.push(`${id}#${i}: ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
  });

  return { id, source: state.source, activities, findings, checked, invalid };
}

/**
 * Where an instance's diagram is now. The recorded `source` when it exists;
 * otherwise the declared diagram with the same file name AND the same process
 * id (the rule `workflow_start` resolves a stem by, plus the id so a
 * different process that happens to share a name is not taken for it).
 */
async function locate(
  repo: string,
  state: Pick<InstanceState, "source" | "processId">,
  candidates: () => string[],
): Promise<{ path: string; moved: boolean } | undefined> {
  const recorded = isAbsolute(state.source) ? state.source : join(repo, state.source);
  if (existsSync(recorded)) return { path: recorded, moved: false };
  const stem = basename(state.source);
  for (const f of candidates().filter((c) => basename(c) === stem).sort()) {
    if ((await loadProcessModel(f)).id === state.processId) return { path: f, moved: true };
  }
  return undefined;
}

/** Every instance in `repo`, its subprocesses included, sorted by id. */
export async function buildReport(
  repo: string = REPO,
  opts: { ctx?: AccessContext; graph?: RoleGraph; instances?: InstanceState[]; diagrams?: string[] } = {},
): Promise<Report> {
  const ctx = opts.ctx ?? accessContext(HARNESS);
  const graph = "graph" in opts ? opts.graph : roleGraphFor(HARNESS);
  let diagrams: string[] | undefined = opts.diagrams;
  const candidates = () => (diagrams ??= workflowFiles(HARNESS).filter((f) => f.endsWith(".bpmn")));
  const models = new Map<string, Promise<ProcessModel>>();
  const model = (p: string) => {
    if (!models.has(p)) models.set(p, loadProcessModel(p));
    return models.get(p)!;
  };

  const instances = new Map<string, InstanceReport[]>();
  const invalid: string[] = [];
  const all = (opts.instances ?? listInstances(repo)).slice().sort((a, b) => a.id.localeCompare(b.id, "en"));
  for (const top of all) {
    const out: InstanceReport[] = [];
    const walk = async (id: string, s: InstanceState) => {
      const where = await locate(repo, s, candidates);
      const note = (kind: FindingKind, detail: string): Finding => ({ instance: id, entry: -1, node: s.processId, kind, detail });
      if (!where) {
        out.push({ id, source: s.source, activities: [], checked: 0, findings: [note("source-missing", `${s.source} does not exist, and no declared diagram of that name defines ${s.processId}`)] });
      } else {
        const r = reportInstance(id, s, await model(where.path), graph, ctx);
        invalid.push(...r.invalid);
        const moved = where.moved
          ? [note("source-moved", `${s.source} does not exist; read ${relative(repo, where.path).split("\\").join("/")}, which defines ${s.processId}`)]
          : [];
        out.push({ id: r.id, source: r.source, activities: r.activities, findings: [...moved, ...r.findings], checked: r.checked });
      }
      for (const k of Object.keys(s.children ?? {}).sort()) await walk(`${id}/${k}`, s.children![k]!);
    };
    await walk(top.id, top);
    instances.set(top.id, out);
  }
  return { instances, policies: [...ctx.policies.keys()].sort(), invalid };
}

/** The PROV JSON-LD log for one top-level instance and its subprocesses. */
export function provDocument(id: string, parts: InstanceReport[]): Record<string, unknown> {
  return {
    // `@base` as `schemas/jsonld.ts` emits it: an instance id and its `#<n>`
    // entries are relative, and a JSON-LD processor must resolve them to IRIs
    // (publish:verify expands every published file and refuses a relative @id).
    "@context": { "@base": FOLIO_BASE, prov: PROV_NS, "cat-harness": CAT_HARNESS_NS },
    "@id": id,
    "@graph": parts.flatMap((p) => p.activities),
  };
}

export function assetName(id: string): string {
  return `${id}.prov.jsonld`;
}

export function totals(r: Report): { checked: number; activities: number; byKind: Record<FindingKind, number> } {
  const byKind = Object.fromEntries(FINDING_KINDS.map((k) => [k, 0])) as Record<FindingKind, number>;
  let checked = 0;
  let activities = 0;
  for (const parts of r.instances.values()) {
    for (const p of parts) {
      checked += p.checked;
      activities += p.activities.length;
      for (const f of p.findings) byKind[f.kind]++;
    }
  }
  return { checked, activities, byKind };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\|/g, "\\|");

export function renderPage(r: Report): string {
  const t = totals(r);
  const totalFindings = FINDING_KINDS.reduce((n, k) => n + t.byKind[k], 0);
  const kindRows = FINDING_KINDS.map((k) => `| \`${k}\` | ${t.byKind[k]} | ${FINDING_MEANING[k]} |`).join("\n");
  const sections = [...r.instances].map(([top, parts]) => {
    const n = parts.reduce((a, p) => a + p.findings.length, 0);
    const acts = parts.reduce((a, p) => a + p.activities.length, 0);
    const checked = parts.reduce((a, p) => a + p.checked, 0);
    const rows = parts.flatMap((p) =>
      p.findings.map((f) => `| \`${esc(p.id)}\` | ${f.entry < 0 ? "(instance)" : f.entry} | \`${esc(f.node)}\` | \`${f.kind}\` | ${esc(f.detail)} |`),
    );
    return [
      `### ${top}`,
      "",
      `${checked} step(s) checked, ${acts} \`prov:Activity\` emitted, ${n} finding(s). ` +
        `Source${parts.length > 1 ? "s" : ""}: ${parts.map((p) => `\`${p.source}\``).join(", ")}. ` +
        `[PROV JSON-LD]({{ '/assets/prov/${assetName(top)}' | relative_url }})`,
      "",
      ...(rows.length
        ? ["| instance | entry | node | finding | detail |", "|---|---|---|---|---|", ...rows]
        : ["No findings."]),
    ].join("\n");
  });
  return `---
layout: default
title: PROV-O QA/QC report
nav_order: 91
permalink: /prov-qaqc/
---
<!-- Generated by cat-harness/scripts/prov-qaqc.ts. Do not hand-edit: \`check:prov-qaqc\` fails on the difference. -->

# PROV-O QA/QC report

The after-check for the agentic engine (issue #1180, step 5). The deterministic engine checks the ODRL policy **before** a task and refuses. An agent swarm acts first, so this report checks the **same** policy **after** the fact. It reads each workflow instance's history, writes it as W3C PROV-O, and re-runs \`authorizeTask\`, the before-check, on every step. Because history records only a name, the actor is treated as \`asserted\`.

**Advisory.** The owner chose advisory first (2026-09-23), so findings are reported here and do not fail the build. \`check:prov-qaqc\` fails only when these outputs are stale, when a \`prov:Activity\` does not validate against \`ProvActivitySchema\`, or on an internal error. \`unknown\` is never read as permit.

**Nothing is invented.** An entry with no actor, or in a lane that binds no role, gets no \`prov:Activity\`, because the schema requires \`prov:agent\` and \`prov:hadRole\`. It gets a finding instead. Every entry is \`asserted\`, so that is not listed as a finding.

**\`prov:hadRole\` stays required.** PROV-O makes it optional, and the owner decided on 2026-09-24 to keep it required here anyway ("Keep required"): a step in a lane that binds no role is reported as \`no-role\`, never logged without a role.

## Totals

${r.instances.size} instance(s), ${t.checked} step(s) checked, ${t.activities} \`prov:Activity\` emitted, ${totalFindings} finding(s). Policies evaluated: ${r.policies.map((p) => `\`${p}\``).join(", ") || "none"}.

| finding | count | means |
|---|---|---|
${kindRows}

## By instance

${sections.join("\n\n")}

## Regenerate

\`bun run prov:qaqc\` writes this page and the logs under \`assets/prov/\`. \`bun run check:prov-qaqc\` checks that they are current.
`;
}

/** Every file this generator owns, path → content. */
export function outputs(r: Report, site: { page: string; assets: string } = { page: PAGE, assets: ASSETS }): Map<string, string> {
  const out = new Map<string, string>([[site.page, renderPage(r)]]);
  for (const [id, parts] of r.instances) out.set(join(site.assets, assetName(id)), stableJson(provDocument(id, parts)));
  return out;
}

/** Stale and orphaned outputs, relative to what `files` says they should be. */
export function staleness(files: Map<string, string>, assets: string = ASSETS): { stale: string[]; orphans: string[] } {
  const orphans = existsSync(assets)
    ? readdirSync(assets).map((f) => join(assets, f)).filter((p) => !files.has(p))
    : [];
  const stale = [...files].filter(([p, s]) => !existsSync(p) || readFileSync(p, "utf-8") !== s).map(([p]) => p);
  return { stale, orphans };
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  let r: Report;
  try {
    r = await buildReport();
  } catch (e) {
    console.error(`✗ prov-qaqc: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(2);
  }
  if (r.invalid.length) {
    console.error(`✗ ${r.invalid.length} prov:Activity record(s) do not validate:`);
    for (const f of r.invalid) console.error(`  ${f}`);
    process.exit(1);
  }
  const t = totals(r);
  const summary = `${r.instances.size} instance(s), ${t.checked} step(s), ${t.activities} activit${t.activities === 1 ? "y" : "ies"}; findings (advisory): ${FINDING_KINDS.map((k) => `${k} ${t.byKind[k]}`).join(", ")}`;
  const files = outputs(r);
  const { stale, orphans } = staleness(files);
  if (check) {
    if (stale.length || orphans.length) {
      for (const p of stale) console.error(`✗ stale: ${relative(REPO, p)}`);
      for (const p of orphans) console.error(`✗ orphan: ${relative(REPO, p)}`);
      console.error("Run `bun run prov:qaqc` and commit the result.");
      process.exit(1);
    }
    console.log(`✓ PROV-O QA/QC report current: ${summary}`);
    process.exit(0);
  }
  for (const [p, s] of files) {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, s);
  }
  for (const p of orphans) rmSync(p);
  console.log(`Wrote ${relative(REPO, PAGE)} and ${r.instances.size} PROV log(s): ${summary}`);
}
