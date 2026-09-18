/**
 * Actors, Roles and Skills — who does a BPMN task, and what they need to know.
 *
 * Three things were being conflated across this repository, and the conflation
 * is why nothing could be audited. Separated:
 *
 * - **Actor** — a concrete participant. Human or agentic. `litlfred` is an
 *   actor; so is the ingestion engine. An actor exists independently of any
 *   process and persists across all of them.
 * - **Role** — *the swimlane*. A persona an actor **takes on** because of the
 *   lane it is acting in. `Reviewer` is a role; nobody *is* a reviewer outside
 *   a process, they are acting as one inside it. A role carries a collection
 *   of **Skills**.
 * - **Skill** — an instruction body. What the actor needs to know to perform
 *   the task it has been handed.
 *
 * So: **an actor performs a task in a process as a role, using that role's
 * skills.** Every word in that sentence is a distinct object here, and the
 * audit in `scripts/kg-audit.ts` checks each join in it.
 *
 * ## Why a role is the lane and not the person
 *
 * Because the same actor is a different thing in two diagrams, and because two
 * different actors are the same thing in one. In `crdm-requirements.bpmn` the
 * session agent acts in `Lane_Agent`; in `bean-lifecycle.bpmn` the very same
 * session agent acts in `Lane_Sibling` from the other diagram's point of view,
 * where its beans are explicitly *not its own to close*. The skills differ
 * because the **lane** differs, not because the actor did.
 *
 * The prior modelling had this backwards. `.claude/skills/actors/*.json` holds
 * eighteen entries with an `inherits` chain — `author` inherits `reviewer`
 * inherits `viewer` — which is a **role** lattice wearing an actor's name. The
 * things it describes (can review, can push) are capabilities of a position,
 * not properties of a person. Those files are kept and read as actors, and
 * {@link readActors} reports the ones that are really roles rather than
 * silently reinterpreting them; migrating them is bean work, not a rename.
 *
 * ## Hierarchy: roles compose down a subprocess chain
 *
 * A process calls a subprocess, and the actor keeps acting. It does not stop
 * being the outer role; it **additionally** takes on the inner lane's role. So
 * the skills available at a task are the union along the whole call path, not
 * just the innermost lane's set. {@link resolveRoleStack} computes that union
 * and keeps the path, because a reader needs to know not only *that* a skill
 * was available but *which* role supplied it.
 *
 * Two distinct compositions, deliberately not merged:
 *
 * - `inherits` — a role IS-A role. `qc-reviewer` inherits `reviewer`, and gets
 *   its skills, everywhere, in every process. Static.
 * - the subprocess **stack** — a role is acting INSIDE another role's task.
 *   Dynamic, and only for the duration of that call.
 *
 * Collapsing them would make `reviewer` permanently hold every skill any
 * caller ever had, which is precisely the over-broad closure that makes an
 * audit worthless.
 *
 * ## Lanes are free text, and that is the defect this module addresses
 *
 * Measured on 2026-09-18 across the twenty diagrams in `docs/workflows/`:
 * **60 distinct lane names for roughly two dozen actual roles.** "Reviewer /
 * SME", "Reviewer / subject-matter expert", "Reviewer (SME or editor)" and
 * "Review Committee" are four spellings of one position; "Work plan — beans
 * (shared by humans and agents)", "Work plan — beans (shared)" and "Work plan
 * (beans)" are three of another. Nothing joined any of them to anything, so
 * no tool could answer "which skills does this task's performer have" and no
 * check could find a lane nobody had defined.
 *
 * A role therefore declares the lane names it **binds** ({@link RoleDef.lanes},
 * exact match). That resolves the existing corpus without editing twenty BPMN
 * files, and it makes the *next* unbound lane a finding rather than a silence.
 * A diagram may also bind explicitly with `<folio:role ref="…"/>` on the lane,
 * which wins over name matching — see {@link laneRoleRef}.
 *
 * ## Three states
 *
 * Absent declaration → `undefined`, and callers fall back to documented
 * defaults. Present but unparseable → **throws**, because a role graph nobody
 * can read leaves every consumer assigning tasks to nobody. An unknown
 * `actorKind` or a dangling `inherits` → rejected at read, not accepted and
 * ignored.
 *
 * @module schemas/role-graph
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { FOLIO_NS } from "./namespaces";

/** Directory, relative to the `kg` graph root, holding the role declaration. */
export const ROLE_GRAPH_DIR = "roles";
/** Filename carrying the role graph. */
export const ROLE_GRAPH_FILENAME = "roles.json";

// ── Actors ──────────────────────────────────────────────────────

/**
 * What kind of thing an actor is.
 *
 * `agent` and `system` are both non-human and are still distinguished: an
 * agent exercises judgement and can be handed a skill to read, a system runs
 * a fixed program and cannot. A lane owned by a system that carries skill
 * refs is a modelling error worth seeing, which is why the audit can ask.
 */
export const ACTOR_KINDS = ["person", "agent", "system", "external"] as const;
export type ActorKind = (typeof ACTOR_KINDS)[number];

/**
 * A concrete participant — the thing that persists across processes.
 *
 * Deliberately thin. An actor is an identity plus what kind of thing it is;
 * everything about *what it can do* belongs to the role it takes on. Anything
 * richer here recreates the confusion this module exists to end.
 */
export interface ActorDef {
  id: string;
  name: string;
  kind: ActorKind;
  description?: string;
  /**
   * Roles this actor is eligible to take on. Advisory, not a permission
   * system: it says who is expected in a lane, and the audit uses it to report
   * a role no actor can fill. Empty means "unconstrained", not "none".
   */
  roles?: string[];
}

// ── Roles ───────────────────────────────────────────────────────

/** A role — a BPMN swimlane, as a declared object. */
export interface RoleDef {
  /** Stable id. Referenced by `<folio:role ref>` and by `inherits`. */
  id: string;
  /** Human label. Not used for matching — {@link RoleDef.lanes} is. */
  name: string;
  summary: string;
  /**
   * What kind of actor takes this role on. `external` marks a participant
   * outside the instance's control (a registry, a third-party service).
   */
  actorKind: ActorKind;
  /**
   * Exact BPMN lane names this role binds, across every diagram.
   *
   * A list rather than one name because the corpus spells one position several
   * ways and normalising sixty lane strings in twenty diagrams is a separate,
   * riskier change than declaring the synonyms. New diagrams should use
   * `<folio:role ref>` and need not add a name here.
   */
  lanes: string[];
  /** Skills available to an actor in this role, before inheritance. */
  skills: string[];
  /** Roles this one IS-A. Skills are unioned transitively; cycles rejected. */
  inherits?: string[];
}

/** The declared role graph. */
export interface RoleGraph {
  name: string;
  roles: RoleDef[];
  /** Actors, when declared alongside. Usually read from the actor directory. */
  actors?: ActorDef[];
}

export const ActorDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(ACTOR_KINDS),
  description: z.string().optional(),
  roles: z.array(z.string()).optional(),
});

export const RoleDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  actorKind: z.enum(ACTOR_KINDS),
  lanes: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  inherits: z.array(z.string()).optional(),
});

export const RoleGraphSchema = z.object({
  name: z.string().min(1),
  roles: z.array(RoleDefSchema).default([]),
  actors: z.array(ActorDefSchema).optional(),
});

// ── Reading ─────────────────────────────────────────────────────

/**
 * Read the role graph from a `kg` directory (this repo: `skills/`).
 *
 * Absent → `undefined`. Unparseable, duplicate ids, or an `inherits` naming a
 * role that is not declared → throws. A dangling `inherits` is rejected at
 * read rather than left for the audit because {@link resolveRoleSkills} would
 * otherwise silently return a short skill set, and a *quietly* incomplete
 * answer is the failure mode this repository keeps paying for.
 */
export function readRoleGraph(kgRoot: string): RoleGraph | undefined {
  const p = join(kgRoot, ROLE_GRAPH_DIR, ROLE_GRAPH_FILENAME);
  if (!existsSync(p)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (typeof raw === "object" && raw !== null) delete (raw as Record<string, unknown>)._comment;
  const parsed = RoleGraphSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`${p} is not a valid role graph: ${parsed.error.message}`);

  const graph = parsed.data as RoleGraph;
  const ids = new Set<string>();
  for (const r of graph.roles) {
    if (ids.has(r.id)) throw new Error(`${p}: role id "${r.id}" is declared twice.`);
    ids.add(r.id);
  }
  for (const r of graph.roles) {
    for (const parent of r.inherits ?? []) {
      if (!ids.has(parent)) {
        throw new Error(`${p}: role "${r.id}" inherits "${parent}", which is not declared.`);
      }
    }
  }
  // A cycle makes the skill closure non-terminating in the obvious
  // implementation and meaningless in any other, so it is refused here rather
  // than defended against at every call site.
  for (const r of graph.roles) detectCycle(graph, r.id, []);
  return graph;
}

function detectCycle(graph: RoleGraph, id: string, path: string[]): void {
  if (path.includes(id)) {
    throw new Error(`role inheritance cycle: ${[...path, id].join(" → ")}`);
  }
  const role = graph.roles.find((r) => r.id === id);
  for (const parent of role?.inherits ?? []) detectCycle(graph, parent, [...path, id]);
}

/**
 * Read the actor registry.
 *
 * Reads `.claude/skills/actors/*.json`, whose entries predate this module and
 * carry `type` rather than `kind` plus an `inherits` chain that is really a
 * role lattice. They are mapped, not rewritten: `type: "person"` → `person`,
 * `"system"` → `system`, anything else → `agent`. An entry carrying `inherits`
 * is returned with {@link LoadedActor.looksLikeRole} set, so a caller can
 * report the migration debt instead of either ignoring it or acting on a
 * field that means something else here.
 */
export interface LoadedActor extends ActorDef {
  /** The file it came from, so a finding can name it. */
  path: string;
  /** Carries `inherits` — i.e. it is modelling a role, not an actor. */
  looksLikeRole: boolean;
}

export function readActors(actorsDir: string): LoadedActor[] {
  if (!existsSync(actorsDir)) return [];
  const out: LoadedActor[] = [];
  for (const f of readdirSync(actorsDir).filter((f) => f.endsWith(".json")).sort()) {
    const p = join(actorsDir, f);
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
    } catch (e) {
      throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
    const type = typeof raw.type === "string" ? raw.type : "agent";
    out.push({
      id: String(raw.id ?? f.slice(0, -5)),
      name: String(raw.name ?? raw.id ?? f.slice(0, -5)),
      kind: type === "person" ? "person" : type === "system" ? "system" : "agent",
      description: typeof raw.description === "string" ? raw.description : undefined,
      roles: Array.isArray(raw.roles) ? (raw.roles as string[]) : undefined,
      path: p,
      looksLikeRole: Array.isArray(raw.inherits) && raw.inherits.length > 0,
    });
  }
  return out;
}

// ── Resolution ──────────────────────────────────────────────────

/** Where a skill in a resolved set came from. */
export interface SkillProvenance {
  skill: string;
  /** The role that declared it — may be an ancestor, not the role asked for. */
  via: string;
  /** Depth in the `inherits` walk; 0 is the role itself. */
  depth: number;
}

export function findRole(graph: RoleGraph, id: string): RoleDef | undefined {
  return graph.roles.find((r) => r.id === id);
}

/**
 * The skills an actor has while acting in this role, closed over `inherits`.
 *
 * Provenance is returned rather than a bare set because "which role gave me
 * this" is the question an audit finding has to answer. The first declaration
 * encountered wins on duplicates — nearest ancestor, breadth-first — so the
 * reported `via` is the closest role that supplies it.
 */
export function resolveRoleSkills(graph: RoleGraph, roleId: string): SkillProvenance[] {
  const seenRole = new Set<string>();
  const bySkill = new Map<string, SkillProvenance>();
  let frontier = [roleId];
  let depth = 0;
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      if (seenRole.has(id)) continue;
      seenRole.add(id);
      const role = findRole(graph, id);
      if (!role) continue;
      for (const s of role.skills) {
        if (!bySkill.has(s)) bySkill.set(s, { skill: s, via: id, depth });
      }
      next.push(...(role.inherits ?? []));
    }
    frontier = next;
    depth += 1;
  }
  return [...bySkill.values()].sort((a, b) => a.skill.localeCompare(b.skill));
}

/**
 * The role acting at the bottom of a subprocess call path, with everything the
 * outer roles contribute.
 *
 * `path` runs OUTERMOST FIRST. The union is taken across the whole path — an
 * actor descending into a subprocess keeps what it already had — and each
 * skill keeps the role it came from, so a reader can see that a task deep in a
 * call chain was performed with a skill supplied three levels up. That is
 * exactly the fact a flat union destroys.
 */
export interface RoleStack {
  /** Role ids, outermost first. Unresolvable ids are kept and flagged. */
  path: string[];
  /** Ids in `path` that are not declared. */
  unresolved: string[];
  skills: SkillProvenance[];
}

export function resolveRoleStack(graph: RoleGraph, path: string[]): RoleStack {
  const unresolved = path.filter((id) => !findRole(graph, id));
  const bySkill = new Map<string, SkillProvenance>();
  // Innermost last, and the innermost role's own declaration should be the one
  // reported when two levels declare the same skill: walk inward, overwriting.
  for (const id of path) {
    for (const p of resolveRoleSkills(graph, id)) bySkill.set(p.skill, p);
  }
  return {
    path,
    unresolved,
    skills: [...bySkill.values()].sort((a, b) => a.skill.localeCompare(b.skill)),
  };
}

/**
 * The role a BPMN lane binds.
 *
 * `explicitRef` — the lane's own `<folio:role ref="…"/>` — wins when present,
 * because a diagram that has said which role it means must not be second-
 * guessed by a string table. Falling back to exact lane-name matching is what
 * lets the existing corpus resolve at all.
 */
export function roleForLane(
  graph: RoleGraph,
  laneName: string | undefined,
  explicitRef?: string,
): RoleDef | undefined {
  if (explicitRef) return findRole(graph, explicitRef);
  if (!laneName) return undefined;
  return graph.roles.find((r) => r.lanes.includes(laneName));
}

/** Every lane name any role binds — the denominator for a coverage report. */
export function boundLaneNames(graph: RoleGraph): Set<string> {
  const s = new Set<string>();
  for (const r of graph.roles) for (const l of r.lanes) s.add(l);
  return s;
}

// ── Graph projection ────────────────────────────────────────────

/**
 * JSON-LD projection, matching {@link module:schemas/agent-harness}'s: the
 * authored shape is stored, the graph form is derived, and there is one truth.
 */
export function toJsonLd(graph: RoleGraph): Record<string, unknown> {
  return {
    "@context": {
      fa: FOLIO_NS,
      skills: `${FOLIO_NS}hasSkill`,
      lanes: `${FOLIO_NS}bindsLane`,
      inherits: `${FOLIO_NS}isA`,
      roles: `${FOLIO_NS}declaresRole`,
    },
    "@type": `${FOLIO_NS}RoleGraph`,
    name: graph.name,
    roles: graph.roles.map((r) => ({
      "@id": `#${r.id}`,
      "@type": `${FOLIO_NS}Role`,
      name: r.name,
      summary: r.summary,
      actorKind: r.actorKind,
      lanes: r.lanes,
      skills: r.skills,
      ...(r.inherits?.length ? { inherits: r.inherits.map((i) => ({ "@id": `#${i}` })) } : {}),
    })),
  };
}
