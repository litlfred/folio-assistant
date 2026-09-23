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
 * **The graph kinds.** `ToolGraph`, `KGraph`, `BeanGraph` and the rest
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
export const TERM_LAYERS = ["bootstrap", "harness", "core"] as const;

/**
 * The layers, as a value — and THE ORDER IS PART OF THE CONTRACT.
 *
 * It is the direction rule above, written so code can read it: index 0 may be
 * named by nothing below it, and each layer may name the ones before it. Two
 * consumers already depend on that reading — the `--layer` slice in
 * `ns-export.ts` compares indices, and its SKOS scheme ordering sorts by them —
 * so this is not an incidental array order that a tidy-up may sort.
 *
 * IT EXISTS BECAUSE THE TYPE ALONE COULD NOT BE READ AT RUNTIME (#807). A
 * union has no value, so every site that needed to CHECK a layer wrote the
 * three names out again, and the copies drifted: `ns-export.ts` validated
 * against `cat-bootstrap` while the error message beside it already said
 * `bootstrap`, so a rejected `--layer bootstrap` printed
 *
 *     --layer must be bootstrap, harness or core (got bootstrap)
 *
 * — a message that names the value it just refused. The failure was real and
 * ordinary; what made it cost an afternoon is that it was UNREADABLE, so it
 * looked like an impossible state rather than two lists out of step.
 *
 * So the type is derived from this tuple rather than declared beside it: a
 * layer added here is a layer the type gains, and a message composed from it
 * cannot disagree with the predicate that used it.
 */
export type TermLayer = (typeof TERM_LAYERS)[number];

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
  FshGutsNode: {
    layer: "harness",
    gloss:
      "One item in the trashcan: something deprecated or thrown away, kept and addressable rather than deleted, and deliberately absent from the rendered site. Carries where it used to live, so it is not an orphan.",
  },
  /**
   * The two CONTENT-TYPE markers — what a repository asserts it is.
   *
   * Distinct from a graph kind, which says what is in a DIRECTORY. These say
   * what the REPOSITORY is, and a repository is a set of them: `smart-base` is
   * a DAK and a SUSHI project at once. `DAK` is not here because it is WHO's
   * term in WHO's namespace, which is the point — a marker's type IRI belongs
   * to whoever defines the type, and only the ones we mint need glossing here.
   */
  Instance: {
    layer: "harness",
    gloss:
      "A repository carrying a harness declaration — it names itself, its published stub, and the directories it holds.",
    seeAlso: "/agentic-harness.html",
  },
  Folio: {
    layer: "harness",
    gloss:
      "A repository that authors folio content — it declares a content type, and `folio_init` wrote its config. Distinct from an Instance: this repository's `cat-harness/` is an Instance and is not a Folio.",
    seeAlso: "/getting-started.html",
  },
  SushiProject: {
    layer: "harness",
    gloss:
      "A repository SUSHI will build — FSH compiled to a FHIR implementation guide. Minted here because SUSHI publishes no logical model for its own config; this is our name for the membership, not a claim to define SUSHI.",
  },

  Actor: {
    layer: "bootstrap",
    gloss:
      "A concrete participant — human, agentic or mechanical — that persists across processes and takes on a role in each.",
    seeAlso: "/agentic-harness.html",
  },
  Convention: {
    layer: "harness",
    gloss:
      "A standing rule an actor must hold while performing a task, bound to a process, a lane or an activity rather than loaded unconditionally. Resolution is first-binding-wins along that order, not a merge, so a reader asking why a rule applies here gets one answer.",
    seeAlso: "/agentic-harness.html",
  },
  Requirement: {
    layer: "harness",
    gloss:
      "A stated need a change must satisfy, elicited and signed off in the CRDM process before implementation begins. Distinct from the issue that tracks it and the bean that plans the work.",
    seeAlso: "/crdm-methodology.html",
  },
  Role: {
    layer: "bootstrap",
    gloss:
      "A BPMN swimlane: the persona an actor takes on because of the lane it is acting in, carrying that lane's skills.",
    seeAlso: "/agentic-harness.html",
  },
  LaneUsage: {
    gloss:
      "One appearance of a glossary concept as a swimlane in one BPMN process — " +
      "the process it is in, the label that process gave the lane, and that " +
      "lane's own documentation. A usage is an occurrence, not a term: it is " +
      "regenerated wholesale and never retired, while a concept is a term " +
      "somebody may have cited.",
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
  Asset: {
    layer: "bootstrap",
    gloss:
      "A file an instance declares as its own, with the role that file plays for it — the instance " +
      "saying what something IS rather than a scan inferring it.",
    seeAlso: "/architecture/harness-instances.html",
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
  inSubgraph: {
    gloss:
      "The DECLARED DIRECTORY a node was projected from — the named subgraph it belongs to, as a " +
      "link to that directory's own node rather than a bare id. Derived from the instance's " +
      "declaration, longest path prefix winning, and INHERITED through `partOf` for nodes that " +
      "have no path of their own (a ProcessNode is part of a diagram, not a file). A node with no " +
      "value belongs to no declared directory — vocabulary nodes are minted from the namespace " +
      "rather than from any file — and that absence is reported as its own state rather than " +
      "folded into a default.",
  },
  localId: { gloss: "The node's own identifier within its file, before any IRI is minted." },
  module: { gloss: "The source module a node was projected from." },
  path: { gloss: "A declared directory's path, relative to the instance root." },
  // `assetRole` and not `role`: an asset's role is a free string naming what
  // the FILE is for, while a Role is a node an actor takes on in a swimlane.
  // One spelling for both would give a consumer a literal where it expects a
  // node, and the two would be indistinguishable in the graph.
  assetRole: {
    gloss:
      "What a declared asset is FOR, as the instance names it — `instance-readme`, " +
      "`agent-instructions`. A literal, and not the swimlane Role, which is a node with skills.",
  },
  typeIri: { gloss: "The IRI of a node's type, so a consumer need not parse the `@type` string." },
  // Convention terms (bean `3190`). Three separate glosses rather than one,
  // because they are three separate claims and a reader deciding whether a
  // rule still holds needs them apart.
  statement: {
    gloss:
      "What a convention REQUIRES, in one line. Distinct from rdfs:comment, which is prose about " +
      "the node: this is the rule itself, and a consumer filtering for enforceable text needs the two apart.",
  },
  rationale: {
    gloss:
      "Why a convention holds, so a reader can tell whether it still does. Kept separate from the " +
      "statement deliberately — a rule and its justification collapsed into one field is a rule nobody " +
      "can retire, because nothing is left that says what would falsify it.",
  },
  applies: {
    gloss:
      "The surfaces a convention governs — `typescript`, `bpmn`, `commit-message`. A filter, not prose, " +
      "and open rather than enumerated: a closed set would have to be edited before a convention about a " +
      "new surface could exist.",
  },
  nodeKind: { gloss: "Which kind of node this is, where the type alone is not specific enough." },
  graphKind: { gloss: "The kind of graph a directory declares it holds." },
  holdsGraph: { gloss: "A graph kind found in this directory." },
  renderable: { gloss: "Whether a directory's contents are published as a website." },
  scans: { gloss: "A directory an instance will look in." },
  scope: { gloss: "Which root a declared path resolves against — the instance's or the repository's." },
  dependents: {
    gloss:
      "Whether an instance depending on this one materialises its own copy of a declared directory. " +
      "Orthogonal to `scope`, which says where a path resolves rather than who gets one.",
  },

  // ── The trashcan ─────────────────────────────────────────────────────
  // `movedFrom` is the one that earns its keep: without it a node in
  // `fsh-guts/` is an orphan — a reader sees what it says and not where it
  // came from, which is the "abandonment or accident" ambiguity the
  // never-delete rule exists to prevent.
  movedOn: { gloss: "When a node was moved into the trashcan." },
  movedFrom: { gloss: "Where a node in the trashcan used to live." },
  issue: { gloss: "The issue that superseded this node, or that it was written for." },
  bean: { gloss: "The work-plan item a node was written under, where there is one." },
  nodeCount: { gloss: "How many nodes a graph or directory yielded." },
  flowCount: { gloss: "How many sequence flows a process carries." },

  // ── Actors, roles, skills ────────────────────────────────────────────
  actorKind: { gloss: "Whether an actor is human, agentic or mechanical." },
  // TWO terms, not one, and `kg-export.ts` explains why at the point of use:
  // an actor IS one kind of thing, a role ADMITS several. Collapsing them
  // would assert that a lane open to both a person and an agent is itself
  // some third kind of actor.
  actorKinds: { gloss: "Which kinds of actor a role admits." },
  reach: {
    gloss:
      "What this actor can reach off its own machine — internet, " +
      "egress-restricted or air-gapped. The same vocabulary the deployment " +
      "declares, at the level of one participant; absent means undeclared, " +
      "which is not `internet`.",
  },
  hasSkill: { gloss: "A skill this role carries." },
  // The two declared exemptions, and they are NOT one flag under two names.
  // `actedUpon` says the role never acts, so `role-has-actor` is `n/a`;
  // `judgementOnly` says it acts but no procedure yields its answer, so
  // `activity-names-skill` is. Collapsing them would give a store an actor,
  // or a stakeholder a skill.
  actedUpon: { gloss: "Whether this role is written to rather than performed, so no actor takes it on." },
  judgementOnly: { gloss: "Whether this role acts by judgement, so no skill can be named for its tasks." },
  declaresSkill: { gloss: "A skill this package declares." },
  declaresRole: { gloss: "A role this registry declares." },
  bindsLane: { gloss: "A BPMN lane this role is bound to." },
  hasLaneUsage: {
    gloss:
      "One appearance of this glossary concept as a swimlane in one process. " +
      "The scope note lives on the usage rather than on the concept because a " +
      "note answers what the lane is accountable for IN THIS PROCESS: measured " +
      "2026-09-21, all 26 lane names appearing in more than one diagram carry " +
      "different documentation in each.",
  },
  ofConcept: { gloss: "The glossary concept this lane usage is an appearance of." },
  inProcess: { gloss: "The BPMN process this lane usage appears in." },
  performerVaries: {
    // `bootstrap`, with `Role`, not `harness` with the glossary machinery: it
    // is a fact a LANE declares about itself, and the only diagram declaring
    // it is bootstrap's own. A term in the layer above would make bootstrap's
    // diagram depend on the harness to say what it means.
    layer: "bootstrap",
    gloss:
      "Whether this lane declines to name a persona because its performer is " +
      "whoever invoked the process. A term so marked has no definition, and " +
      "that absence is an assertion rather than a gap.",
  },
  isA: { gloss: "A role this one inherits from, statically and everywhere." },
  roleName: { gloss: "The role's own name, as a lane binds it." },
  performedBy: { gloss: "The role that performs this activity." },
  implementedBy: { gloss: "The skill that implements this activity." },
  assignments: { gloss: "The role-to-lane bindings a diagram carries." },
  permissionName: { gloss: "A permission's name, as an actor holds it." },
  hasCapability: { gloss: "A capability this actor's environment provides." },
  providesCapability: { gloss: "A capability this node makes available." },
  requiresCapability: { gloss: "A capability this node needs before it can run." },
  fallbackToCapability: {
    gloss:
      "The capability that stands in for this one when it is absent. It must not " +
      "transitively require the capability it replaces — such a substitute is " +
      "unavailable in exactly the case it exists for.",
  },

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
  omitted: {
    gloss:
      "Instance-bound collectors that were NOT run, on a foreign instance's " +
      "document — so a reader can tell 'this instance has no tools' from " +
      "'tools were never looked for'.",
  },
  // ── Published dependency set (instance-versioning.md §3.4) ───────────
  //
  // `packageId`, `version` and `uri` are FHIR's own spellings, kept so a
  // consumer that already reads `ImplementationGuide.dependsOn` reads this
  // without translating.
  dependsOn: { gloss: "The instances this publishable instance depends on, as FHIR-shaped {packageId, version, uri} records." },
  packageId: { gloss: "A dependency's reverse-DNS id — the identity a consumer resolves." },
  // A dependency's `version` reuses `schema:softwareVersion`, already declared
  // in the export's term table, so it is deliberately not glossed here.
  uri: { gloss: "A dependency's canonical URL, stable across its versions." },
  dependsOnGaps: {
    gloss:
      "Dependency edges that could NOT become a record, each with which of the " +
      "four reasons applies — so a reader can tell 'depends on nothing' from " +
      "'depends on things none of which is publishable'.",
  },
  dependsOnUnavailable: {
    gloss:
      "Why there is no dependsOn block, when the reason is not an empty " +
      "dependency set — never rendered as 'depends on nothing'.",
  },

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
