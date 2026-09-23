/**
 * What an actor carries forward, attached to a node of the knowledge graph.
 *
 * @module schemas/carried-note
 *
 * ## Two things that looked unrelated and are one
 *
 * A **todo** records that a person has something outstanding. A **memory
 * entry** records what an agent learned. They were built as separate
 * mechanisms, and the author's framing is what joins them:
 *
 * > todos = human memory, the agent's `MEMORY.md` is agent memory. beans are
 * > agent workflow management. no human workflow management.
 *
 * So the axes are **memory** and **workflow management**, not "human thing"
 * and "agent thing":
 *
 * | | memory | workflow management |
 * |---|---|---|
 * | human actor | **todos** | *— nothing —* |
 * | agent actor | **`MEMORY.md`** | **beans** |
 *
 * Both halves of the memory column answer one question — *what do I carry into
 * the next task?* — and differ only in **storage** and **trigger point**. That
 * is what this module is: the metadata they share, so a consumer can ask "what
 * is outstanding here" without caring which actor kind left it.
 *
 * Getting that pairing wrong is easy and was got wrong once here: beans reads
 * like the human's todo list because `AGENTS.md` calls it "the single todo
 * mechanism". It is not. It is the agent's workflow management, and naming it
 * after a quadrant it does not occupy is the same coincidence-not-contract
 * drift this repo keeps paying for, in vocabulary rather than in layout.
 *
 * ## The reference vocabulary is shared, and it has THREE kinds
 *
 * A note points at three different sorts of thing, and collapsing any two
 * loses something a consumer needs:
 *
 * - a **knowledge-graph node** — {@link KgRefSchema}: a kind and an id;
 * - a **person** — {@link ExternalIdentitySchema}: provider-qualified, because
 *   `litlfred` is not an identity and `github:litlfred` is;
 * - an **external artefact** — {@link ArtefactRefSchema}: an issue, a pull
 *   request, a commit. New here, and it closes a real gap: an issue is neither
 *   a node of this graph nor a person, so before this there was nowhere to put
 *   one. Agent memory has been recording them in **prose** — an entry reading
 *   "Bean `lq7e`" is a string in a paragraph, which nothing can resolve and
 *   nothing can audit.
 *
 * ## Why the base carries no status
 *
 * A todo has a lifecycle: open, done, scrapped. A memory entry does not — a
 * TRAP is not "open", and marking one "done" would say the failure it records
 * has stopped being possible. So `status` lives on the todo, not here, and a
 * consumer that wants "everything outstanding" filters the todos rather than
 * reading a status field that memory would have to fake.
 *
 * @graphNode schema
 */

import { z } from "zod";

import { AlsoAboutSchema, NoteAnchorSchema } from "./note-anchor.js";
import { nodeKind } from "./node-kind.js";

/**
 * A task, addressed as the pair it actually is.
 *
 * A BPMN activity id is unique only **within** its process — `A_Implement`
 * names one thing in `crdm-requirements` and could name another anywhere else.
 * So this is a pair, never a bare string: a step id without its phase is not
 * an address, and resolving one by guessing is how a token lands in the wrong
 * diagram.
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
 *
 * The link to a declared actor is **optional on purpose**. Somebody who
 * comments on a pull request is a real person with a real outstanding item
 * whether or not `.claude/skills/actors/` has heard of them. `actor: undefined`
 * means **not linked** — a third state, never "anonymous", and never silently
 * resolved to a default actor.
 */
export const ExternalIdentitySchema = z.object({
  /** The naming system — `github`, `google`, `git`, an institutional IdP. */
  provider: z.string().min(1),
  /** The handle or address **within that provider**. */
  id: z.string().min(1),
  /** Display name, when the provider gave one. Never used for matching. */
  displayName: z.string().optional(),
  /** The declared actor this identity belongs to, when known. */
  actor: z.string().optional(),
});
export type ExternalIdentity = z.infer<typeof ExternalIdentitySchema>;

/**
 * A reference to any other node of the knowledge graph.
 *
 * `kind` is a string rather than an enum because graph kinds are an open
 * registry, and a closed list here would refuse a reference to a kind a
 * downstream instance added — the one thing a general-purpose reference must
 * not do.
 *
 * It is deliberately NOT a place to re-express a tag. A `references` entry
 * naming a role says "see also"; the `roles` tag says "this is outstanding in
 * that lane".
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
 * Artefact kinds a note can point at. Open, for the same reason `provider` is.
 *
 * `commit` rather than `sha`: a SHA is how a commit is spelled, not what it
 * is, and a tag or a branch tip names the same thing without being one.
 */
export const ARTEFACT_KINDS = ["issue", "pull-request", "commit", "run", "release"] as const;

/**
 * An external artefact — an issue, a PR, a commit.
 *
 * The third reference kind, and the one that was missing. An issue is not a
 * node of this knowledge graph and not a person, so neither {@link KgRefSchema}
 * nor {@link ExternalIdentitySchema} could hold one. What happened instead is
 * visible in the agent memories today: references written into prose, as
 * `Bean \`lq7e\`` or `#203` mid-sentence, where nothing resolves them and
 * nothing notices when they rot.
 *
 * `repo` is optional because a note inside a repository usually means its own,
 * and requiring it would make every local reference verbose enough that people
 * go back to writing prose.
 */
export const ArtefactRefSchema = z.object({
  /** What sort of artefact. See {@link ARTEFACT_KINDS} — open, not an enum. */
  kind: z.string().min(1),
  /** Its identifier within the provider: `203`, a SHA, a run id. */
  id: z.string().min(1),
  /** `github`, `gitlab`, … Defaults to the instance's own forge when absent. */
  provider: z.string().optional(),
  /** `owner/repo`. Absent means **this** repository. */
  repo: z.string().optional(),
  /** Why it is referenced. */
  note: z.string().optional(),
});
export type ArtefactRef = z.infer<typeof ArtefactRefSchema>;

/**
 * The knowledge-graph edges a carried note holds.
 *
 * Every array defaults to empty, and an empty array is a **determined empty**:
 * this note is tagged with no role, as against one whose tags were never
 * filled in. The two are indistinguishable in this shape, deliberately — the
 * distinction that matters at read time is whether a tag RESOLVES, which the
 * resolver answers with its own third state.
 */
export const NoteTagsSchema = z.object({
  /** Role ids — the swimlane this sits in. `scenarios/roles.json`. */
  roles: z.array(z.string()).default([]),
  /** BPMN process ids this belongs to. */
  processes: z.array(z.string()).default([]),
  /** Specific activities, each with its process. */
  tasks: z.array(TaskRefSchema).default([]),
  /**
   * Who it is for, or who raised it.
   *
   * An array because **several people can be tagged on one note** — a question
   * for two reviewers is one item, not two, and splitting it would lose that
   * they are being asked the same thing.
   */
  identities: z.array(ExternalIdentitySchema).default([]),
  /** Anything else in the graph this points at. See {@link KgRefSchema}. */
  references: z.array(KgRefSchema).default([]),
  /**
   * Issues, pull requests, commits. See {@link ArtefactRefSchema}.
   *
   * Separate from `references` because these do not resolve against the
   * knowledge graph at all — a resolver that tried would report every one of
   * them dangling, which is worse than not checking.
   */
  artefacts: z.array(ArtefactRefSchema).default([]),
});
export type NoteTags = z.infer<typeof NoteTagsSchema>;

/** Empty tags, spelled once so callers do not each write the literal. */
export const EMPTY_NOTE_TAGS: NoteTags = {
  roles: [],
  processes: [],
  tasks: [],
  identities: [],
  references: [],
  artefacts: [],
};

/**
 * The metadata a todo and a memory entry share.
 *
 * Extended rather than used directly — see `schemas/todo.ts` and
 * `schemas/memory.ts`. What is here is what a consumer can read without
 * knowing which actor kind left the note.
 */
export const CarriedNoteSchema = z.object({
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
   * narrative makes every note look like an undifferentiated one.
   */
  comment: z.string().default(""),
  /** ISO 8601. */
  createdAt: z.string().min(1),
  updatedAt: z.string().optional(),
  /**
   * Block label this is attached to, when it is attached to one.
   *
   * **Kept, not deprecated.** Every note in the corpus carries this and the
   * e2e fixtures address it directly. {@link NoteAnchorSchema} does not
   * replace it — an anchor of kind `block` IS this field with its state made
   * explicit, and `anchorOf` derives one from a note that has only this.
   */
  targetLabel: z.string().optional(),
  /**
   * Where this note is attached, as a three-state answer.
   *
   * **The state `targetLabel` cannot express is page-global.** With an
   * optional string, a note somebody deliberately floated to the top of a page
   * and one that fell off a block are both `undefined` — and the second is a
   * defect while the first is a choice, so a tool that cannot tell them apart
   * can only guess which to report.
   *
   * Optional because absent is its own answer: a note with no `anchor` has not
   * been re-anchored since the field existed, and {@link anchorOf} reads its
   * position off `targetLabel` exactly rather than guessing. Defaulting it to
   * `none` at rest would erase that distinction and re-label every legacy
   * block-attached note as unattached.
   */
  anchor: NoteAnchorSchema.optional(),
  /**
   * Content nodes this note is ALSO about, without being attached to them.
   *
   * The owner's CRDM Q1 ruling: **one primary + declared secondaries.** The
   * anchor above stays the single attachment — the panel and the badge are
   * built from it alone — and these are the edges a board draws as lines.
   * `note-anchor.ts` carries why, and `notesAt` is the one reader that
   * returns both relations from one pass so they cannot drift apart.
   *
   * Optional rather than defaulted: an absent list and an empty one mean the
   * same thing, and `alsoAboutLabels` is what collapses them, so nothing
   * written before this field existed gains a key it never had.
   */
  alsoAbout: AlsoAboutSchema.optional(),
  /** The knowledge-graph edges — see {@link NoteTagsSchema}. */
  tags: NoteTagsSchema.default(EMPTY_NOTE_TAGS),
});

/**
 * The carried note as a node KIND, so a kind built on it (a todo) declares it
 * as a parent and is composed by the one walk (`schemas/node-kind.ts`, bean
 * `a1lq`) instead of `.extend()`ing it.
 */
export const CarriedNoteKind = nodeKind("carried-note", [], CarriedNoteSchema.shape);
export type CarriedNote = z.infer<typeof CarriedNoteSchema>;
