/**
 * A TODO — one human actor's work state, as a knowledge-graph node.
 *
 * @module schemas/todo
 *
 * ## What a todo is, and why it is content
 *
 * A todo records that a **person** has something outstanding. That is not the
 * agent work plan: `beans/` is the agent work plan, and `AGENTS.md` is emphatic
 * that no second store may be stood up beside it. A todo is the other thing
 * `AGENTS.md` already carves out beside beans — *"the content-review feedback
 * workflow … a separate domain feature, not the agent work-plan"* — and it is
 * **content**, authored and owned by the folio, not by the harness.
 *
 * ## It carries the four coordinates of the role model
 *
 * `AGENTS.md` states the model in one sentence, and every word of it is a
 * distinct declared object:
 *
 * > **An actor performs a task in a process as a role, using that role's skills.**
 *
 * A todo is a piece of that sentence left unfinished, so it is tagged by the
 * same four things: who ({@link ExternalIdentity}), acting as what
 * ({@link TodoTags.roles}), in which process ({@link TodoTags.processes}), on
 * which task ({@link TodoTags.tasks}). Tagging it any other way invents a
 * second vocabulary for facts the knowledge graph already names.
 *
 * ## A task reference carries its process
 *
 * A BPMN activity id is unique only **within** its process — `A_Implement`
 * names one thing in `crdm-requirements` and could name another anywhere else.
 * So {@link TaskRef} is a pair, never a bare string. The same lesson the
 * subprocess interpreter learned: a step id without its phase is not an
 * address, and resolving one by guessing is how a token lands in the wrong
 * diagram.
 *
 * ## An identity is provider-qualified
 *
 * `litlfred` is not an identity; `github:litlfred` is. A bare handle cannot be
 * compared across systems, and two providers' namespaces are free to collide.
 *
 * The link to a declared {@link ActorDefinition} is **optional on purpose**.
 * Somebody who comments on a pull request is a real person with a real
 * outstanding item whether or not `.claude/skills/actors/` has heard of them,
 * and refusing to record the todo until they are declared would lose exactly
 * the feedback that arrives from outside. `actor: undefined` means **not
 * linked**, which is a third state — never "anonymous", and never silently
 * resolved to a default actor.
 */

import { z } from "zod";

/**
 * A task, addressed as the pair it actually is.
 *
 * See the module header: an activity id alone is not an address.
 */
export const TaskRefSchema = z.object({
  /** BPMN process id, e.g. `Process_CRDM`. */
  process: z.string().min(1),
  /** Activity id within that process, e.g. `A_Implement`. */
  task: z.string().min(1),
});
export type TaskRef = z.infer<typeof TaskRefSchema>;

/**
 * Who, named in a system that can name them.
 *
 * `provider` is open rather than an enum: the set of systems a folio's people
 * arrive from is the folio's business, and a closed list would reject a real
 * person for being on the wrong forge.
 */
export const ExternalIdentitySchema = z.object({
  /** The naming system — `github`, `google`, `git`, an institutional IdP. */
  provider: z.string().min(1),
  /** The handle or address **within that provider**. */
  id: z.string().min(1),
  /** Display name, when the provider gave one. Never used for matching. */
  displayName: z.string().optional(),
  /**
   * The declared actor this identity belongs to, when it is known to be one.
   *
   * Absent means NOT LINKED, which is a real and common state — see the module
   * header. It must not be read as anonymous, and must never be defaulted.
   */
  actor: z.string().optional(),
});
export type ExternalIdentity = z.infer<typeof ExternalIdentitySchema>;

/**
 * A reference to any other node of the knowledge graph.
 *
 * The four tag axes — role, process, task, identity — are the ones with
 * MEANING: they say who this is outstanding for and where in the work it sits.
 * This is the open one, for everything a todo merely needs to POINT AT: the
 * skill it is about, the requirement it blocks, the block it was raised
 * against, a workflow decision it disagrees with.
 *
 * `kind` is an open string rather than an enum on purpose. The node kinds are
 * an open registry (`BASE_GRAPH_KINDS`), and a closed list here would refuse a
 * reference to a kind a downstream instance added — which is the one thing a
 * general-purpose reference must not do.
 *
 * It is deliberately NOT a place to re-express a tag. A `references` entry
 * naming a role says "see also"; the `roles` tag says "this is outstanding in
 * that lane". Collapsing them would lose the distinction every consumer of the
 * tags depends on.
 */
export const KgRefSchema = z.object({
  /** The node kind — `skill`, `requirement`, `block`, `process`, … */
  kind: z.string().min(1),
  /** The node's id within that kind. */
  id: z.string().min(1),
  /** Why it is referenced, when that is not obvious from the pair. */
  note: z.string().optional(),
});
export type KgRef = z.infer<typeof KgRefSchema>;

/**
 * The knowledge-graph edges a todo carries.
 *
 * Every array defaults to empty, and an empty array is a **determined empty**:
 * this todo is tagged with no role, as against a todo whose tags were never
 * filled in. The two are indistinguishable in this shape, deliberately — the
 * distinction that matters at read time is whether a tag RESOLVES, which
 * {@link resolveTodoTags} answers with its own third state.
 */
export const TodoTagsSchema = z.object({
  /** Role ids — the swimlane this is outstanding in. `skills/roles/roles.json`. */
  roles: z.array(z.string()).default([]),
  /** BPMN process ids this todo belongs to. */
  processes: z.array(z.string()).default([]),
  /** Specific activities, each with its process. */
  tasks: z.array(TaskRefSchema).default([]),
  /**
   * Who it is outstanding FOR, or who raised it.
   *
   * An array because **several people can be tagged on one todo** — a question
   * for two reviewers is one item, not two, and splitting it would lose that
   * they are being asked the same thing.
   */
  identities: z.array(ExternalIdentitySchema).default([]),
  /** Anything else in the graph this points at. See {@link KgRefSchema}. */
  references: z.array(KgRefSchema).default([]),
});
export type TodoTags = z.infer<typeof TodoTagsSchema>;

/** How a tag came out when checked against the knowledge graph. */
export type TagResolution = "resolved" | "dangling" | "not-checked";

export interface ResolvedTag {
  /** Which axis — `role`, `process`, `task`, `actor`. */
  axis: "role" | "process" | "task" | "actor";
  /** The reference as written, e.g. `crdm-requirements▸A_Implement`. */
  ref: string;
  state: TagResolution;
}

/**
 * What the knowledge graph currently declares, for checking tags against.
 *
 * Each field is optional, and **absent means "could not be read"** — not
 * "empty". That distinction is the whole point: a shallow checkout with no
 * `skills/` must report every role tag as `not-checked`, never as dangling. A
 * wall of false dangling findings is how a check gets switched off.
 */
export interface KgIndex {
  roles?: ReadonlySet<string>;
  processes?: ReadonlySet<string>;
  /** Task ids per process id. */
  tasks?: ReadonlyMap<string, ReadonlySet<string>>;
  actors?: ReadonlySet<string>;
}

/**
 * Check every tag against the graph, reporting three states per tag.
 *
 * Reports rather than throws, for the reason `kg-export` reports its dangling
 * `declaresSkill` edges rather than failing: a todo naming a role somebody
 * later renamed is a **data** defect in content a person wrote, and blocking
 * on it would hold the folio hostage to a backlog.
 */
export function resolveTodoTags(tags: TodoTags, kg: KgIndex): ResolvedTag[] {
  const out: ResolvedTag[] = [];
  const check = (
    axis: ResolvedTag["axis"],
    ref: string,
    known: ReadonlySet<string> | undefined,
  ): void => {
    out.push({
      axis,
      ref,
      state: known === undefined ? "not-checked" : known.has(ref) ? "resolved" : "dangling",
    });
  };

  for (const r of tags.roles) check("role", r, kg.roles);
  for (const p of tags.processes) check("process", p, kg.processes);

  for (const t of tags.tasks) {
    const ref = `${t.process}▸${t.task}`;
    if (kg.tasks === undefined) {
      out.push({ axis: "task", ref, state: "not-checked" });
      continue;
    }
    const within = kg.tasks.get(t.process);
    // A task in a process the index does not know is DANGLING, not
    // not-checked: the index was read, and it does not contain that process.
    out.push({ axis: "task", ref, state: within?.has(t.task) ? "resolved" : "dangling" });
  }

  for (const i of tags.identities) {
    // Only a LINKED identity is checkable. An unlinked one is not dangling —
    // see the module header: a person outside the actor registry is a real
    // person, and reporting them as a broken reference would be wrong.
    if (i.actor !== undefined) check("actor", i.actor, kg.actors);
  }

  return out;
}

/** Tags that did not resolve. Never includes `not-checked`. */
export function danglingTags(resolved: ResolvedTag[]): ResolvedTag[] {
  return resolved.filter((r) => r.state === "dangling");
}

// ── The node ────────────────────────────────────────────────────

/**
 * A todo node.
 *
 * The status/priority/origin vocabulary is NOT restated here — it is
 * `TodoStatus`, `TodoPriority` and `TodoOrigin` in `types.ts`, where the
 * existing store and the `todo-review` skill already read it. Two spellings of
 * one enum is the drift this repository keeps paying for; this module adds the
 * KG tagging that was missing and takes nothing over.
 */
export const TodoNodeSchema = z.object({
  /** Stable id within its store. */
  id: z.string().min(1),
  /** One line. */
  summary: z.string().min(1),
  /**
   * The markdown narrative — context, rationale, the question being asked.
   *
   * Read AFTER the tags, and that ordering is the point rather than a style
   * choice: the tags say who this is for and where it sits, which is what a
   * reader needs before prose means anything. A renderer that leads with the
   * narrative makes every todo look like an undifferentiated note.
   */
  comment: z.string().default(""),
  /** `TodoStatus` from `types.ts`, not re-enumerated here. */
  status: z.string().min(1),
  /** `TodoPriority` from `types.ts`. */
  priority: z.string().min(1),
  /** `TodoOrigin` from `types.ts`. */
  origin: z.string().min(1),
  /** ISO 8601. */
  createdAt: z.string().min(1),
  updatedAt: z.string().optional(),
  /** Block label this is attached to, when it is attached to one. */
  targetLabel: z.string().optional(),
  /** The knowledge-graph edges — see {@link TodoTagsSchema}. */
  tags: TodoTagsSchema.default({ roles: [], processes: [], tasks: [], identities: [], references: [] }),
  /**
   * What this file IS, declared inside it.
   *
   * The same convention the workflow instances use (`folio-workflow-instance/v1`)
   * and for the same reason `#263` gave: a directory may hold more than one
   * part of a graph, and telling the parts apart by file extension is "a
   * coincidence of the current layout, not a contract". A declaration inside
   * the file is the contract.
   */
  $schema: z.literal("folio-todo/v1"),
});
export type TodoNode = z.infer<typeof TodoNodeSchema>;

/** The `$schema` tag every todo file carries. */
export const TODO_SCHEMA_TAG = "folio-todo/v1";
