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
 * The prior modelling had this backwards. `.claude/skills/actors/*.json` held
 * eighteen entries with an `inherits` chain — `author` inherits `reviewer`
 * inherits `viewer` — which is a **role** lattice wearing an actor's name: the
 * things it described (can review, can push) are properties of a position, not
 * of a person. Those entries now carry `roles[]` instead, naming the roles each
 * actor may take on, and the lattice lives in the role graph where `inherits`
 * means what it says.
 *
 * {@link readActors} still reports an entry carrying `inherits` via
 * {@link LoadedActor.looksLikeRole}, and the `actor-is-not-a-role` criterion
 * still fails on one. The migration is done here; the check stays, because the
 * next registry to be written by hand will reach for `inherits` again.
 *
 * `roles: []` and an absent `roles` are **different**: `[]` says the actor
 * takes on no role, which is the honest value for a read-only identity that
 * never appears in a swimlane, while absent says nothing has been asserted.
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
 * Measured on 2026-09-18 across the twenty diagrams in `processes/`:
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
 * `actorKinds` or a dangling `inherits` → rejected at read, not accepted and
 * ignored.
 *
 * @module schemas/role-graph
 * @graphNode schema
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { kgNodeLabelShape } from "./kg-node";
import { join } from "node:path";
import { z } from "zod";

import { NS_PREFIXES, termIri } from "./namespaces";
import { ACTOR_KINDS, type ActorKind } from "./skill-package";
import { NETWORK_REACHES, type NetworkReach } from "./cat-harness";

/** Directory, relative to the `kg` graph root, holding the role declaration. */
export const ROLE_GRAPH_DIR = "roles";
/** Filename carrying the role graph. */
export const ROLE_GRAPH_FILENAME = "roles.json";

// ── Actors ──────────────────────────────────────────────────────

/**
 * What kind of thing an actor is — **human, agentic or mechanical**, plus
 * `external` for a participant outside this instance entirely.
 *
 * Those three words are the author's; `person`, `agent` and `system` are the
 * ids they are spelled with here, and the mapping is one-to-one:
 *
 * | id | the kind it names | what it can be handed |
 * |---|---|---|
 * | `person` | **human** | a skill to read, and a judgement to make |
 * | `agent` | **agentic** | a skill to read, and a judgement to make |
 * | `system` | **mechanical** | a program to run, and nothing to decide |
 * | `external` | outside this instance | nothing — it is not ours to task |
 *
 * There is deliberately no second vocabulary carrying the author's words. Two
 * spellings of one concept is the drift this repository keeps paying for, and
 * a `fulfilment: "mechanical"` field beside `actorKinds: ["system"]` would be a
 * fresh instance of it. The words live in this table; the ids live in the data.
 *
 * ## Why agentic and mechanical must not be one kind
 *
 * **An agent exercises judgement; a mechanical system executes a procedure.**
 * That is the whole difference, and it decides what a task may be handed to:
 * a step requiring a judgement call cannot be given to a build pipeline, and a
 * step that is a fixed program does not need — and should not claim — a reader.
 *
 * The registry said so in prose long before anything could read it.
 * `ci-pipeline`'s own description: *"It runs a fixed program and exercises no
 * judgement, so anything needing a decision belongs in another lane."*
 * `review-agent`'s: *"LLM agent performing NON-MECHANICAL validation …
 * judgement calls escalate to a human reviewer."* Both sentences state the
 * distinction; neither was machine-readable, because every actor file carried
 * a two-valued `type` (`person` or `system`) that collapsed them. Measured
 * 2026-09-19 before the split: **16 `person`, 8 `system`**, with the 8 holding
 * five agents and three mechanical services.
 *
 * That is the same failure `judgementOnly` was introduced for one level up —
 * a load-bearing rule recorded only in a summary, which a later pass is free to
 * re-litigate. See {@link RoleDef.judgementOnly}.
 *
 * ## One vocabulary, re-exported rather than restated
 *
 * The values live in `schemas/skill-package.ts`, the dependency-free base that
 * the registry schema reads. They were declared TWICE until 2026-09-19 — four
 * kinds here, two (`person`, `system`) there — and the registry validated
 * `.claude/skills/actors/*.json` against the narrower one, so the four-kind
 * vocabulary could not be used by the files it was written for. Re-exported so
 * there is one place to change and one answer to give.
 */
export { ACTOR_KINDS, type ActorKind };

/**
 * Kinds that can be handed an instruction body and asked to exercise judgement.
 *
 * The union of **human** and **agentic**. Derived from {@link ACTOR_KINDS}
 * rather than written out again, so a kind added there cannot go unclassified —
 * the same rule `DOCUMENT_BLOCK_KINDS` follows against `BLOCK_KINDS`.
 */
export const JUDGEMENT_KINDS: readonly ActorKind[] = ACTOR_KINDS.filter(
  (k) => k === "person" || k === "agent",
);

/** Kinds that run a fixed program: **mechanical**. */
export const MECHANICAL_KINDS: readonly ActorKind[] = ACTOR_KINDS.filter((k) => k === "system");

/**
 * Which actor kinds may fulfil an activity, **derived from its BPMN type**.
 *
 * BPMN already answers this and the corpus was not reading the answer. The
 * spec's own semantics:
 *
 * - `bpmn:UserTask` — *"performed by a human being with the assistance of a
 *   software application"*. Only a **human** fulfils one.
 * - `bpmn:ServiceTask` — *"uses some sort of service … a Web service or an
 *   automated application"*, with no human in the loop. An **agentic** or
 *   **mechanical** actor fulfils one.
 * - `bpmn:Task` — the abstract task. It says nothing, so neither does this:
 *   `undefined` means unconstrained, not "no kind may fulfil it".
 * - `bpmn:CallActivity` — the constraint belongs to the steps of the process it
 *   calls, each of which is checked in its own diagram. Also unconstrained.
 *
 * `undefined` rather than `ACTOR_KINDS` so a caller can tell "every kind is
 * allowed" from "nothing was asserted" — the third state this repository
 * insists on everywhere else. A declared `<folio:fulfilment/>` overrides it.
 */
export function fulfilmentKindsForBpmnType(bpmnType: string): readonly ActorKind[] | undefined {
  if (bpmnType === "bpmn:UserTask") return JUDGEMENT_KINDS.filter((k) => k === "person");
  if (bpmnType === "bpmn:ServiceTask") return ACTOR_KINDS.filter((k) => k === "agent" || k === "system");
  return undefined;
}

/**
 * A concrete participant — the thing that persists across processes.
 *
 * Deliberately thin. An actor is an identity plus what kind of thing it is;
 * everything about *what it can do* belongs to the role it takes on. Anything
 * richer here recreates the confusion this module exists to end.
 */
export interface ActorDef {
  id: string;
  /** Display text. See `schemas/kg-node.ts` — `title`/`description` everywhere. */
  title: string;
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
  /**
   * Display text. Not used for matching — {@link RoleDef.lanes} is.
   *
   * `title` and `description` rather than `name` and `summary`: they are the
   * two labels EVERY knowledge-graph node carries (`schemas/kg-node.ts`), and a
   * role spelling them differently from a directory or a Tool meant a consumer
   * had to know which kind of node it held before it could print one.
   */
  title: string;
  description: string;
  /**
   * Which kinds of actor may take this role on. `external` marks a participant
   * outside the instance's control (a registry, a third-party service).
   *
   * A SET, not one kind, and the corpus is what settled it. `reviewer` carried
   * `person` alone while `review-agent`'s own description says it performs
   * review and escalates only the judgement calls, and while
   * `editing-hci-validation.bpmn` draws `Task_AgentReview` — "Agent review of
   * the change" — inside that very lane. One kind per role made both of those
   * defects rather than facts, and the only way to record them was to widen
   * the role.
   *
   * Non-empty by construction: an empty list would read as "no actor may take
   * this role", which is not a role. That is the same third-state care
   * `fulfilmentKindsForBpmnType` takes in returning `undefined` rather than
   * `[]` for a task type that asserts nothing.
   *
   * It is a SET on the role and a SINGLE kind on the actor, deliberately. An
   * actor IS one kind of thing; a role ADMITS several. Collapsing either into
   * the other loses a distinction the graph is built on.
   */
  actorKinds: ActorKind[];
  /**
   * Exact BPMN lane names this role binds, across every diagram.
   *
   * A list rather than one name because the corpus spells one position several
   * ways and normalising sixty lane strings in twenty diagrams is a separate,
   * riskier change than declaring the synonyms. New diagrams should use
   * `<folio:role ref>` and need not add a name here.
   */
  lanes: string[];
  /**
   * Who this reader IS, in prose — the persona an author writes for and a QA
   * reviewer checks against.
   *
   * `summary` says what the role DOES. That is enough to draw a swimlane and
   * not enough to write for: it does not say what they already know, what they
   * came to find out, or what would make the page useless to them. An author
   * given only "Writes and revises folio content" will write for nobody in
   * particular, and a QA criterion about jargon or assumed background has no
   * standard to judge against.
   *
   * This is the audience. It is NOT restated per block: a block sits in a
   * lane, the lane is the role, the role carries the persona. Copying it onto
   * every block would invite the two to disagree, and a per-block audience
   * that contradicts its lane is worse than none — it looks authoritative.
   */
  persona?: string;
  /**
   * The voice to address this reader in.
   *
   * Named here rather than inferred, because it does not follow from the
   * persona: the same reader is addressed differently in a normative standard
   * and in a tutorial. The authoring agent picks the voice from here; the QA
   * agent judges against the same string rather than against its own taste,
   * which is what makes a voice finding reviewable instead of an opinion.
   */
  voice?: string;
  /**
   * What this reader is actually trying to do — the cases the content has to
   * serve.
   *
   * Guides both agents in the direction a persona alone cannot: an author
   * knows which questions to answer, and a QA reviewer can ask whether the
   * page answers them. "Is this well written" is unanswerable; "does this let
   * a reviewer find what changed since they last looked" is not.
   */
  useCases?: string[];
  /** Skills available to an actor in this role, before inheritance. */
  skills: string[];
  /** Roles this one IS-A. Skills are unioned transitively; cycles rejected. */
  inherits?: string[];
  /**
   * This lane is **acted upon**, not performed by anybody.
   *
   * `Work plan — beans`, `Corpus (versioned store)` and `Publish — GitHub
   * Pages` are drawn as lanes because tasks act ON them and a reader needs to
   * see where the plan or the corpus is touched. No actor takes them on. The
   * flag exists so the audit can record `role-has-actor` as **n/a** for them
   * rather than as a failure: reporting "no actor can fill the corpus" would
   * be a finding nobody can act on, and a check that produces those is a check
   * somebody switches off.
   */
  actedUpon?: boolean;
  /**
   * The role PERFORMS, but by judgement — no instruction body implements its
   * steps, and naming one would be a lie about what the role does.
   *
   * Distinct from `actedUpon`, and the distinction is the point. A corpus is
   * written to and takes no part; a stakeholder acts, deliberates and is
   * accountable for the outcome — they simply cannot be handed a procedure
   * that produces the answer. `stakeholder`'s own summary has said so in
   * prose since the role graph was written:
   *
   *   > Carries no skills deliberately: sign-off is a judgement, not a
   *   > procedure, and a skill here would suggest an agent could supply it.
   *
   * That prose was load-bearing and unreadable by anything. A later pass
   * measured four `activity-names-skill` findings on the stakeholder lane and
   * came within one commit of "fixing" them by giving the role a skill —
   * which would have re-entered exactly the dead end the summary closed. The
   * flag is that sentence made machine-readable, so the next pass is stopped
   * by the graph rather than by whether it happened to read a summary.
   *
   * Effect: `activity-names-skill` records `n/a` for activities in this
   * role's lanes, which is what lets the criterion GATE on the undeclared
   * ones instead of staying advisory for ever.
   */
  judgementOnly?: boolean;
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
  title: z.string().min(1),
  kind: z.enum(ACTOR_KINDS),
  description: z.string().optional(),
  roles: z.array(z.string()).optional(),
});

export const RoleDefSchema = z.object({
  // Declared in the Zod shape as well as the interface: a field TypeScript
  // accepts and Zod strips is written by an author, type-checks, and vanishes
  // (bean `zdrf`).
  persona: z.string().optional(),
  voice: z.string().optional(),
  useCases: z.array(z.string()).optional(),
  id: z.string().min(1),
  // Required here, though `kgNodeLabelShape` makes both optional in general: a
  // role nobody can name or describe is a lane nobody can fill, and `kg-audit`
  // reports exactly that.
  ...kgNodeLabelShape,
  title: z.string().min(1),
  description: z.string().min(1),
  actorKinds: z.array(z.enum(ACTOR_KINDS)).min(1),
  lanes: z.array(z.string()).default([]),
  /**
   * Skills available to an actor in this role, before inheritance.
   *
   * @ref SkillDefinitionSchema
   */
  skills: z.array(z.string()).default([]),
  /**
   * Roles this one IS-A, outermost last. Static composition, not the scoped
   * subprocess stack.
   *
   * @ref RoleDefSchema
   */
  inherits: z.array(z.string()).optional(),
  actedUpon: z.boolean().optional(),
  judgementOnly: z.boolean().optional(),
  // STRICT: an unknown key is an ERROR, not something to drop quietly.
  //
  // `readRoleGraph` already refuses a bad `actorKinds` and a dangling
  // `inherits` — rejected at read, not accepted and reported later — and this
  // is the case it was missing. A plain `z.object` STRIPS what it does not
  // recognise, so a field an author wrote parses, type-checks, and reaches no
  // graph. That is bean `zdrf`'s failure class, and the comment above is the
  // half of it that was already known; this is the other half.
  //
  // It is not hypothetical. `role-model.md` §"Adding a role" said to write a
  // `summary` — not a field: `title`/`description` are the two labels every
  // kg node carries. PR #453 followed the instruction, and all three
  // bootstrap roles carried a `summary` that reached nothing. Measured
  // 2026-09-20: 0 of 33 root roles, 3 of 3 bootstrap roles. The instruction
  // was corrected in #452; this is what stops the next one.
  //
  // `_`-prefixed documentation keys stay legal — see `withoutComments`. A
  // downstream instance carrying some OTHER extra key will now fail at read
  // where it used to load, and that is the trade taken deliberately: a
  // declaration that silently means less than it says is worse than one that
  // refuses to load and names the key.
}).strict();

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
/**
 * Strip `_`-prefixed documentation keys, at the graph level and on each role.
 *
 * This instance writes rationale into the JSON it declares — `_comment` here,
 * `_comment`/`_title` in `harness.json`, `_lanes_comment` in bootstrap's
 * graph — so the convention is established rather than invented here. It is
 * what makes {@link RoleDefSchema}'s `.strict()` affordable: an unknown key
 * can be an error precisely because there is a spelling for a key that is
 * MEANT not to be read.
 *
 * Generalised from a hardcoded `delete raw._comment`, which honoured the
 * convention for exactly one name — `_lanes_comment` was already being
 * stripped by the schema instead, which is the silence this change exists to
 * remove.
 */
function withoutComments(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const drop = (o: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith("_")));
  const top = drop(raw as Record<string, unknown>);
  if (Array.isArray(top.roles)) {
    top.roles = top.roles.map((r) =>
      typeof r === "object" && r !== null ? drop(r as Record<string, unknown>) : r,
    );
  }
  return top;
}

export function readRoleGraph(kgRoot: string): RoleGraph | undefined {
  // TWO PLACES, because the role graph became a DECLARED DIRECTORY on
  // 2026-09-21 instead of a subdirectory of one.
  //
  // It used to sit at `<skills root>/roles/roles.json`, found by convention
  // from the skills directory. It is now `scenarios/roles.json`, a directory
  // of kind `scenarios` in its own right — so callers that hand this function
  // every declared graph root pass the scenarios directory ITSELF, and
  // joining `roles/` onto it looks one level too deep.
  //
  // Both are tried rather than the old one being dropped: a DOWNSTREAM
  // instance has not moved its file, and every caller here passes all roots
  // and takes the first that answers, so an instance on either layout
  // resolves. Convention first, since that is where an unmigrated instance
  // keeps it.
  const p = [join(kgRoot, ROLE_GRAPH_DIR, ROLE_GRAPH_FILENAME), join(kgRoot, ROLE_GRAPH_FILENAME)]
    .find((c) => existsSync(c));
  if (p === undefined) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const parsed = RoleGraphSchema.safeParse(withoutComments(raw));
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
 * Reads `.claude/skills/actors/*.json`. An entry states its kind in `kind`,
 * against the full {@link ACTOR_KINDS} vocabulary, and an unknown value is
 * **rejected** rather than accepted and ignored — the same rule
 * {@link readRoleGraph} follows for an ACTOR's `kind` — one kind, unlike a role's set. An entry carrying the
 * deprecated `inherits` is returned with {@link LoadedActor.looksLikeRole} set,
 * so a caller can report it instead of either ignoring it or acting on a field
 * that means something else here.
 *
 * ## The legacy `type`, and why it is a fallback rather than the field
 *
 * Every entry carried `type` until 2026-09-19, with two values — `person` and
 * `system` — and `system` covered an LLM agent and a CI runner alike. That is
 * the conflation {@link ACTOR_KINDS} documents: it made "which tasks can this
 * actor perform" unanswerable, because the answer turns on judgement and both
 * sides of the question wore the same label.
 *
 * `type` is still read when `kind` is absent, so an unmigrated downstream
 * registry loads. It maps conservatively — `person` → `person`, anything else
 * → `system` — and **never invents `agent`**: guessing that an entry is agentic
 * because its id ends in `-agent` would put an unreviewed claim into the graph
 * under the appearance of data. A registry that has not said is read as
 * mechanical, which is the reading that refuses it a judgement task rather than
 * granting it one.
 */
export interface LoadedActor extends ActorDef {
  /**
   * Capability ids the actor claims — an environment probe it needs, not a
   * skill. Carried here because nothing resolved them: `fhir-validator` was
   * claimed by three actors and declared nowhere.
   */
  capabilities?: string[];
  /** Permission ids — what it may do. See {@link readPermissions}. */
  permissions?: string[];
  /**
   * What this participant can reach off its own machine.
   *
   * Carried on `LoadedActor` rather than on the thin {@link ActorDef} on
   * purpose. That interface is identity only — *"everything about what it
   * can do belongs to the role it takes on"* — and reach is not what the
   * actor **does**; it is a fact about **where it sits**, exactly like the
   * `capabilities` its machine has. Putting it on `ActorDef` would recreate
   * the confusion that module exists to end; putting it beside
   * `capabilities` is where the environment facts already live.
   *
   * Absent means UNDECLARED, which is not `internet`. See
   * `schemas/actor-reach.ts` for how it composes with the deployment's.
   */
  reach?: NetworkReach;
  /** The file it came from, so a finding can name it. */
  path: string;
  /** Carries `inherits` — i.e. it is modelling a role, not an actor. */
  looksLikeRole: boolean;
}

/**
 * One entry's kind: `kind` when declared, else the legacy `type`.
 *
 * An unrecognised `kind` throws. It is the one case where being permissive
 * costs more than failing: a typo silently read as `system` would quietly
 * disqualify an actor from every judgement task it is meant to perform, and
 * nothing downstream would say so.
 */
function actorKindOf(raw: Record<string, unknown>, path: string): ActorKind {
  if (typeof raw.kind === "string") {
    if (!(ACTOR_KINDS as readonly string[]).includes(raw.kind)) {
      throw new Error(
        `${path}: kind "${raw.kind}" is not an actor kind. One of: ${ACTOR_KINDS.join(", ")}.`,
      );
    }
    return raw.kind as ActorKind;
  }
  return raw.type === "person" ? "person" : "system";
}

/**
 * An actor's declared reach, or `undefined` when it declares none.
 *
 * An unrecognised value throws, for the reason {@link actorKindOf} throws:
 * a typo read permissively would route a signing task to an API the machine
 * cannot call, and the failure would surface as a network error rather than
 * as the declaration mistake it is.
 */
function actorReachOf(raw: Record<string, unknown>, path: string): NetworkReach | undefined {
  if (raw.reach === undefined) return undefined;
  if (typeof raw.reach !== "string" || !(NETWORK_REACHES as readonly string[]).includes(raw.reach)) {
    throw new Error(
      `${path}: reach ${JSON.stringify(raw.reach)} is not a network reach. ` +
        `One of: ${NETWORK_REACHES.join(", ")}.`,
    );
  }
  return raw.reach as NetworkReach;
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
    out.push({
      id: String(raw.id ?? f.slice(0, -5)),
      title: String(raw.title ?? raw.id ?? f.slice(0, -5)),
      kind: actorKindOf(raw, p),
      description: typeof raw.description === "string" ? raw.description : undefined,
      roles: Array.isArray(raw.roles) ? (raw.roles as string[]) : undefined,
      capabilities: Array.isArray(raw.capabilities) ? (raw.capabilities as string[]) : undefined,
      permissions: Array.isArray(raw.permissions) ? (raw.permissions as string[]) : undefined,
      reach: actorReachOf(raw, p),
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
 * JSON-LD projection, matching {@link module:schemas/cat-harness}'s: the
 * authored shape is stored, the graph form is derived, and there is one truth.
 */
export function toJsonLd(graph: RoleGraph): Record<string, unknown> {
  return {
    "@context": {
      ...NS_PREFIXES,
      skills: termIri("hasSkill"),
      lanes: termIri("bindsLane"),
      inherits: termIri("isA"),
      roles: termIri("declaresRole"),
    },
    "@type": termIri("RoleGraph"),
    name: graph.name,
    roles: graph.roles.map((r) => ({
      "@id": `#${r.id}`,
      "@type": termIri("Role"),
      title: r.title,
      description: r.description,
      actorKinds: r.actorKinds,
      lanes: r.lanes,
      skills: r.skills,
      ...(r.inherits?.length ? { inherits: r.inherits.map((i) => ({ "@id": `#${i}` })) } : {}),
    })),
  };
}

// ── Audience ────────────────────────────────────────────────────

/**
 * Why a role id cannot be an audience, or undefined when it can.
 *
 * Two rejections, and the second is the one that is easy to miss:
 *
 * - **unknown** — not a role in this instance's KG. A mistyped audience
 *   scopes QA to nobody, which reads as "no findings" rather than as an error.
 * - **acted upon** — `Work plan — beans`, `Corpus (versioned store)` and
 *   `Publish — GitHub Pages` are lanes because tasks act ON them, not because
 *   anybody performs them. Nothing reads prose written for the corpus. An
 *   audience must be a role an ACTOR can take on.
 */
export function audienceProblem(graph: RoleGraph, id: string): string | undefined {
  const role = findRole(graph, id);
  if (!role) {
    return `"${id}" is not a role in this instance's KG. Known roles: ${graph.roles.map((r) => r.id).join(", ")}`;
  }
  if (role.actedUpon) {
    return `"${id}" is acted upon, not performed — nothing reads prose written for it`;
  }
  return undefined;
}

/** Role ids that may be declared as an audience. */
export function audienceRoles(graph: RoleGraph): RoleDef[] {
  return graph.roles.filter((r) => !r.actedUpon);
}

// ── Permissions ─────────────────────────────────────────────────

/** Directory, relative to the `kg` root, holding the permission vocabulary. */
export const PERMISSION_DIR = "permissions";
export const PERMISSION_FILENAME = "permissions.json";

/**
 * What an actor is ALLOWED to do, as opposed to what it knows or what its
 * machine has.
 *
 * ## Why this is an actor property and not a role property
 *
 * It was tested, not assumed, and the obvious answer was wrong. "Can review"
 * and "can push" are properties of a position, which is what moved `inherits`
 * off actors in 2026-09 — so the natural next step was to move permissions onto
 * Role too. That does not survive contact with the data: a permission
 * **cross-cuts** roles. `content-authoring` is held by actors taking on five
 * different roles; `qa-reporting` by three, one of them a build pipeline and
 * one a human QC reviewer; and `admin` holds `admin-settings` in every one of
 * the five lanes it acts in. Placing them on Role produced **36** conflicts
 * where a permission was held by some but not all actors sharing a role.
 *
 * The distinction that does hold: a **skill** answers *what does the performer
 * of this task need to know*, and belongs to the lane. A **permission** answers
 * *what is this participant allowed to do*, and travels with the participant
 * through every lane it enters.
 */
export interface PermissionDef {
  id: string;
  /** Display text and the sentence under it — `schemas/kg-node.ts`, like every node. */
  title: string;
  description: string;
}

export interface PermissionVocabulary {
  name: string;
  permissions: PermissionDef[];
}

export const PermissionDefSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const PermissionVocabularySchema = z.object({
  name: z.string().min(1),
  permissions: z.array(PermissionDefSchema).default([]),
});

/**
 * Read the permission vocabulary. Absent → `undefined` (an unmigrated instance
 * simply declares none); present but unparseable → throws, on the same rule as
 * every other declaration here.
 */
export function readPermissions(kgRoot: string): PermissionVocabulary | undefined {
  const p = join(kgRoot, PERMISSION_DIR, PERMISSION_FILENAME);
  if (!existsSync(p)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (typeof raw === "object" && raw !== null) delete (raw as Record<string, unknown>)._comment;
  const parsed = PermissionVocabularySchema.safeParse(raw);
  if (!parsed.success) throw new Error(`${p} is not a valid permission vocabulary: ${parsed.error.message}`);
  const ids = new Set<string>();
  for (const perm of parsed.data.permissions) {
    if (ids.has(perm.id)) throw new Error(`${p}: permission id "${perm.id}" is declared twice.`);
    ids.add(perm.id);
  }
  return parsed.data;
}
