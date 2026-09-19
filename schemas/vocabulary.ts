/**
 * What each term in the folio namespace MEANS — one brief gloss apiece.
 *
 * ## Why this file exists
 *
 * `FOLIO_NS` is `https://litlfred.github.io/folio-assistant/ns#`, and every
 * class and property the graph projects hangs off it. **Nothing served that
 * stem.** `scripts/tests/kg-export.test.ts` exempted it from the dead-link
 * check BY NAME, commenting "an IRI stem, not a file — nothing serves it and
 * nothing should try to." That was right while a term only had to be an
 * IDENTIFIER. It stopped being right when the owner asked, 2026-09-19, that
 * the bootstrap README link almost every word to its definition: a definition
 * has to dereference.
 *
 * Fourth instance of the defect bean `blv9` records — a link-shaped value that
 * does not resolve — after the `/kg/` literal, a Skill's `instructions` path,
 * and the templates' asset paths.
 *
 * ## What is NOT here, deliberately
 *
 * **The graph kinds.** `ToolGraph`, `KnowledgeGraph`, `BeanGraph` and the rest
 * already carry a `summary` in `BASE_GRAPH_KINDS`, so `ns-export` reads it
 * from there. Restating them here would be a second answer to one question,
 * free to disagree — the drift this repository keeps paying for. A gloss below
 * for a term the registry already describes is a bug, and the completeness
 * test says so.
 *
 * **Rich description.** One sentence each, per the owner: "each of these
 * schemas should have BRIEF definitions. rich descriptions and
 * interpretations in cat-harness/ docs." A gloss says what the term IS so a
 * reader following a link from the README knows what word they just met. It
 * does not explain the design; that is what the prose pages are for.
 *
 * @module schemas/vocabulary
 * @graphNode schema
 */

/**
 * Which layer owns a term — and therefore which instances must carry it.
 *
 * The owner, 2026-09-19: "we shouldnt need voicegraph or librarygrph or
 * previewgrapjh in bootstrap!!" Exactly right, and the flat vocabulary I first
 * wrote had no way to say so. A bootstrap instance reads a declaration, walks
 * a dependency tree and hands over; it has no opinion about editorial voices,
 * an L1 library or a preview target, and a vocabulary that makes it define
 * them has made bootstrap carry the thing bootstrap exists to defer.
 *
 * Same three layers the repository split uses, so this does not invent a
 * fourth axis:
 *
 * - `bootstrap` — readable with nothing loaded: the declaration, its
 *   directories, and the actor/role/process/skill sentence the first BPMN
 *   needs. Nothing here may require the harness.
 * - `harness` — the agentic machinery: tools, capabilities, requirements,
 *   work plan, process detail.
 * - `core` — authored content and what surrounds it: voices, library,
 *   uploads, todos, the folio itself.
 *
 * The direction rule holds here as everywhere: core may name a harness term,
 * harness may name a bootstrap term, and never the reverse.
 */
export type TermLayer = "bootstrap" | "harness" | "core";

/** A term's gloss, and where a reader goes for more. */
export interface TermGloss {
  /** Which layer owns it. Absent means `harness` — the middle, not a guess. */
  readonly layer?: TermLayer;
  /** One sentence. What the term IS, not why it was designed that way. */
  readonly gloss: string;
  /** Site-relative page carrying the full treatment, when one exists. */
  readonly seeAlso?: string;
}

/**
 * The node classes — the things the graph has instances OF.
 *
 * The first five are the sentence `AGENTS.md` opens its role model with — "an
 * actor performs a task in a process as a role, using that role's skills" —
 * split into its terms. They are lifted rather than invented, because a
 * vocabulary that disagrees with the file agents read first is worse than no
 * vocabulary.
 */
export const CLASS_GLOSSES: Readonly<Record<string, TermGloss>> = {
  Actor: {
    layer: "bootstrap",
    gloss:
      "A concrete participant — human, agentic or mechanical — that persists across processes and takes on a role in each.",
    seeAlso: "/agentic-harness.html",
  },
  Role: {
    layer: "bootstrap",
    gloss:
      "A BPMN swimlane: the persona an actor takes on because of the lane it is acting in, carrying that lane's skills.",
    seeAlso: "/agentic-harness.html",
  },
  Skill: {
    layer: "bootstrap",
    gloss: "The instruction body an actor needs to perform a task.",
    seeAlso: "/skills.html",
  },
  SkillPackage: {
    gloss: "A directory of skills shipped and versioned together.",
    seeAlso: "/skills.html",
  },
  Process: {
    layer: "bootstrap",
    gloss: "A BPMN process: lanes that bind roles, activities that name skills, and the flow between them.",
    seeAlso: "/publication-workflow.html",
  },
  ProcessNode: {
    layer: "bootstrap",
    gloss: "One element of a process — an activity, a gateway, a start or end event.",
    seeAlso: "/publication-workflow.html",
  },
  SequenceFlow: {
    layer: "bootstrap",
    gloss: "A directed edge between two process nodes.",
    seeAlso: "/publication-workflow.html",
  },
  Tool: {
    gloss: "A callable operation the harness exposes, declared as a node rather than only as code.",
    seeAlso: "/architecture.html",
  },
  Schema: {
    gloss: "A schema definition, itself a node in the knowledge graph rather than an island beside one.",
  },
  Capability: {
    gloss: "Something an actor's environment provides — a binary, a service, a credential — probed rather than assumed.",
  },
  Directory: {
    layer: "bootstrap",
    gloss: "A declared place to look, naming the kinds of graph found in it.",
    seeAlso: "/architecture.html",
  },
  GraphKind: {
    layer: "bootstrap",
    gloss: "What a declared directory holds — the vocabulary a consumer matches on to decide whether to scan it.",
    seeAlso: "/architecture.html",
  },
  // `Harness`, not `CatHarness`, and `cat:` not `bs:`. The owner, 2026-09-19:
  // "but why bs:catharness? shouldnt that be in cat?... and maybe we name the
  // type scheme harness so it is more readable cat:harness". Right on both:
  // the declaration is the harness's own object, and `cat:CatHarness`
  // stuttered the layer into the term.
  Harness: {
    layer: "harness",
    gloss: "An instance's root declaration: the directories it scans and the graphs they hold.",
    seeAlso: "/architecture.html",
  },
  Image: {
    layer: "core",
    gloss: "A declared picture belonging to an instance, carrying its role, its layout and any text region.",
  },
  RoleGraph: {
    gloss: "The role registry as a graph — every role, what it inherits, and the lanes it binds.",
  },
  // Registered outside BASE_GRAPH_KINDS — `folio-graph-kind.ts` adds the first
  // and the other two are reporting states — so they carry no `summary` for
  // `ns-export` to read and are glossed here instead.
  FolioGraph: {
    layer: "core",
    gloss: "Authored content — the folio itself, rendered to a website.",
    seeAlso: "/content-types.html",
  },
  PreviewGraph: {
    layer: "core",
    gloss: "A staging target: the same folio built for review rather than for release.",
  },
  UnknownGraph: {
    layer: "core",
    gloss:
      "A declared graph kind nothing recognises — reported as its own state, never silently treated as empty.",
  },
};

/**
 * The properties — the edges and literals a node carries.
 *
 * Brief to the point of terseness on purpose. A reader arrives here from a
 * single word in a README and wants to know what that word denotes; anything
 * longer is the prose pages' job.
 */
export const PROPERTY_GLOSSES: Readonly<Record<string, TermGloss>> = {
  // ── Structure ────────────────────────────────────────────────────────
  partOf: { gloss: "The node this one belongs to." },
  inPackage: { gloss: "The skill package a skill ships in." },
  localId: { gloss: "The node's own identifier within its file, before any IRI is minted." },
  module: { gloss: "The source module a node was projected from." },
  path: { gloss: "A declared directory's path, relative to the instance root." },
  typeIri: { gloss: "The IRI of a node's type, so a consumer need not parse the `@type` string." },
  nodeKind: { gloss: "Which kind of node this is, where the type alone is not specific enough." },
  graphKind: { gloss: "The kind of graph a directory declares it holds." },
  holdsGraph: { gloss: "A graph kind found in this directory." },
  renderable: { gloss: "Whether a directory's contents are published as a website." },
  scans: { gloss: "A directory an instance will look in." },
  nodeCount: { gloss: "How many nodes a graph or directory yielded." },
  flowCount: { gloss: "How many sequence flows a process carries." },

  // ── Actors, roles, skills ────────────────────────────────────────────
  actorKind: { gloss: "Whether an actor is human, agentic or mechanical." },
  // TWO terms, not one, and `kg-export.ts` explains why at the point of use:
  // an actor IS one kind of thing, a role ADMITS several. Collapsing them
  // would assert that a lane open to both a person and an agent is itself
  // some third kind of actor.
  actorKinds: { gloss: "Which kinds of actor a role admits." },
  hasSkill: { gloss: "A skill this role carries." },
  declaresSkill: { gloss: "A skill this package declares." },
  declaresRole: { gloss: "A role this registry declares." },
  bindsLane: { gloss: "A BPMN lane this role is bound to." },
  isA: { gloss: "A role this one inherits from, statically and everywhere." },
  roleName: { gloss: "The role's own name, as a lane binds it." },
  performedBy: { gloss: "The role that performs this activity." },
  implementedBy: { gloss: "The skill that implements this activity." },
  assignments: { gloss: "The role-to-lane bindings a diagram carries." },
  permissionName: { gloss: "A permission's name, as an actor holds it." },
  hasCapability: { gloss: "A capability this actor's environment provides." },
  providesCapability: { gloss: "A capability this node makes available." },
  requiresCapability: { gloss: "A capability this node needs before it can run." },

  // ── Instructions and contracts ───────────────────────────────────────
  hasInstructions: { gloss: "Whether a skill has an instruction body at all." },
  instructionsPath: { gloss: "Where a skill's instruction body lives, relative to the instance root." },
  instructionLines: { gloss: "How long a skill's instruction body is." },
  hasIOContract: { gloss: "Whether a skill declares input and output schemas." },
  inputSchema: { gloss: "The published schema a skill's input must satisfy." },
  outputSchema: { gloss: "The published schema a skill's output satisfies." },
  io: { gloss: "A skill's input/output contract, taken together." },
  hasManifest: { gloss: "Whether a package carries a manifest listing its skills." },
  requirements: { gloss: "The conformance statements this node is held to." },
  satisfies: { gloss: "A requirement this node satisfies." },

  // ── Tools ────────────────────────────────────────────────────────────
  invoke: { gloss: "How a tool is called." },
  install: { gloss: "How a tool is obtained, where it is not already present." },
  meta: { gloss: "A tool's own descriptive metadata." },
  maintains: { gloss: "An artefact this tool generates and keeps current." },
  maintainsFrom: { gloss: "The source a maintained artefact is generated from." },
  maintainedBy: { gloss: "The tool that generates and keeps this artefact current." },
  canonicalDocument: { gloss: "The document a node's canonical IRI resolves to." },

  // ── Process ──────────────────────────────────────────────────────────
  bpmnType: { gloss: "The BPMN element type a process node was read from." },
  startNode: { gloss: "The node a process begins at." },
  incoming: { gloss: "A sequence flow arriving at this node." },
  outgoing: { gloss: "A sequence flow leaving this node." },
  from: { gloss: "The node a sequence flow leaves." },
  to: { gloss: "The node a sequence flow arrives at." },
  decisionRef: { gloss: "The DMN table that computes this gateway's branch." },
  enforcement: { gloss: "Whether a process's steps are strict or advisory." },
  relaxable: { gloss: "Whether a step may be relaxed by a downstream package." },
  touchesWorkPlan: { gloss: "Whether completing this step performs a work-plan operation." },
  workPlanOp: { gloss: "The work-plan operation a step performs — claim, note or resolve." },

  // ── Provenance ───────────────────────────────────────────────────────
  sourceKind: { gloss: "What kind of source a node was read from." },
  sourcePath: { gloss: "The file a node was read from." },
  sourceCommitSha: { gloss: "The commit the export was taken at." },
  sourceCommitAt: { gloss: "When that commit was made." },
  sourceTreeDirty: { gloss: "Whether the working tree had uncommitted changes when the export ran." },
  sourceCommitUnavailable: { gloss: "That the commit could not be determined — never rendered as clean." },

  // ── Staging provenance ───────────────────────────────────────────────
  //
  // Arrived on main while this branch was open, and `ns:check` refused the
  // merge until they were defined — which is the gate doing precisely what it
  // was written for. Every one was minted and glossed nowhere.
  staging: { gloss: "Which build produced this document, when it is a staging preview rather than a release." },
  stagingBranch: { gloss: "The branch a staging preview was built from." },
  stagingSha: { gloss: "The commit a staging preview was built from." },
  stagingRef: { gloss: "The pull request a staging preview belongs to." },
  stagingRun: { gloss: "The CI run that produced a staging preview." },

  // ── Reporting ────────────────────────────────────────────────────────
  counts: { gloss: "How many nodes of each type the export produced." },
  detection: { gloss: "How a value was arrived at, where it was inferred rather than declared." },
  ambiguous: { gloss: "That more than one answer matched, and none was chosen." },
};

/**
 * Which layer owns a term, by name — the ONE answer, used to mint its IRI.
 *
 * `namespaces.ts` calls this to decide which namespace a term hangs off, so
 * the layer and the IRI cannot disagree. An earlier draft kept a separate
 * `GRAPH_KIND_LAYERS` map inside `ns-export.ts`, which decided the same fact a
 * second time and in a different file from the one that mints the type — the
 * shape of drift this repository keeps paying for.
 *
 * A name this file does not gloss is `harness`, the middle. Same default and
 * same reasoning as {@link TermGloss.layer}: over-assigning to harness costs
 * an instance a term it did not need, while under-assigning to bootstrap makes
 * the base depend on something above it.
 */
export function termLayer(name: string): TermLayer {
  return CLASS_GLOSSES[name]?.layer ?? PROPERTY_GLOSSES[name]?.layer ?? "harness";
}
