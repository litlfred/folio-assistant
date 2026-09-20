/**
 * The `CatHarness` declaration — what an instance IS, at its root.
 *
 * Named for the **harness**, not for folio-assistant, and the distinction is
 * the point: `agentic-harness` is the layer that defines Roles, Skills, Tools
 * and the conventional directories, and every other instance — including
 * `folio-assist-core` — inherits from it. Calling this a "FolioAssistant"
 * declaration would put the platform family's name on a harness-layer concept
 * and imply that an instance must be a folio-assistant to have one. It need
 * not: a Tool repo or a Test repo carries the same declaration.
 *
 * Issue #223, Phase 0.3. Every folio-assistant instance carries one of these
 * at its repository root (`harness.json`). It declares the directories
 * the instance scans for content, and what **kind of graph** each one holds.
 *
 * ## Why a directory declaration rather than a content-type field
 *
 * The obvious reading of "a folio holds zero or more Content instances" is a
 * list of instances under one `contentType`. That is the wrong shape, for a
 * reason that only shows up once the five-repo split is real: the instances an
 * `agentic-harness` holds are not folios at all. They are **Tool definitions**
 * under `tools/`, a **knowledge graph** of skills and workflows under `kg/`,
 * and the **schema graph** under `schemas/`. None of those renders as a
 * document, and none has a `contentType` in the `document | paper` sense.
 *
 * So the general object is not "a folio with instances" but **an instance with
 * directories, each holding a graph**. `folio` is then one graph kind among
 * several — distinguished only by being renderable to a website (see
 * {@link GRAPH_KINDS}). An instance with no `folio/` directory is completely
 * ordinary; `agentic-harness` is exactly that.
 *
 * ## Inheritance
 *
 * An instance inherits its dependencies' directory conventions. `agentic-
 * harness` declares `tools/`, `kg/` and `schemas/`; `folio-assist-core`
 * declares `folio/` and **also scans the three it inherits**, without
 * restating them. This is the same depth-first walk as
 * `schemas/harness-config.ts`, and the same overlay order — deepest dependency
 * first, root last, so the root wins.
 *
 * Overriding is by graph **id**, not by path: an instance that wants its
 * knowledge graph somewhere other than `kg/` redeclares the `kg` id with a
 * different path, and the inherited entry is replaced rather than duplicated.
 * Matching on path instead would make two directories out of one relocation,
 * and every consumer would scan a directory that is not there.
 *
 * ## Self-declarative, in the smart-base sense
 *
 * The declaration is itself a small graph instance: each directory is a node
 * with an `@id` and an `@type` drawn from the folio namespace, so the set of
 * directories an instance scans is queryable by the same machinery as anything
 * else in the knowledge graph, rather than being configuration that only this
 * module understands.
 *
 * @module schemas/cat-harness
 * @graphNode schema
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { z } from "zod";

import {
  KgAssetSchema,
  KgImageSchema,
  kgNodeLabelShape,
  scopeShape,
  type DeclarationScope,
  type KgAsset,
  type KgImage,
  type KgNodeLabels,
} from "./kg-node";
import { NS_PREFIXES, termIri } from "./namespaces";

/** Root-relative filename carrying an instance's declaration. */
export const DECLARATION_FILENAME = "harness.json";

// ── Graph kinds ─────────────────────────────────────────────────

/**
 * The kinds of graph a declared directory can hold.
 *
 * `renderable` is the only behavioural distinction in this table, and it is
 * what makes `folio` special: a folio graph is expected to come out the
 * just-the-docs rendering pipeline as a website. The others are graphs that
 * tools read. Nothing stops a consumer treating them all uniformly — that is
 * the point of making them all graphs — but only a renderable one is wired to
 * the site build.
 */
/** What a declared directory's graph kind means. */
export interface GraphKindDef {
  /** The `@type` IRI this kind projects to. */
  type: string;
  /**
   * Is a graph of this kind expected to render as a website?
   *
   * The only behavioural distinction in the vocabulary — and the reason
   * `folio` is not declared here. The harness **cannot render**: the
   * just-the-docs pipeline and the webpage content type belong to
   * `folio-assist-core`. A layer that cannot render must not own the
   * renderable kind, so `folio` is REGISTERED by core rather than declared
   * here. See `schemas/folio-graph-kind.ts`.
   */
  renderable: boolean;
  summary: string;
  /**
   * The skill that says how to READ a graph of this kind, by name.
   *
   * A property of the KIND rather than of the directory, because a `qa` graph
   * is read the same way wherever it sits — putting it on the directory entry
   * would restate one fact per instance and let the copies drift.
   *
   * Optional, and absent means absent: naming a skill that does not exist
   * would be the fake-reference failure `activity-names-skill` exists to
   * prevent, where silencing a gap costs less than filling it.
   */
  skill?: string;
  /**
   * Where the shape of a node in this graph is defined — a repo-relative
   * module path, or a `$schema` tag the files themselves carry.
   *
   * Optional because not every kind has one answer: `cat-harness` holds node
   * kinds typed in different places — skills, workflows, roles, actors — and a
   * single pointer there would be a lie of precision rather than a fact.
   *
   * **It is NOT a validator**, and {@link GraphKindDef.validator} is why.
   */
  schema?: string;
  /**
   * What RUNTIME-VALIDATES a node of this kind — `module#Export`, naming a
   * Zod schema.
   *
   * ## Why this is not {@link GraphKindDef.schema}
   *
   * The two look like one fact and are not, and the corpus is what settles
   * it. `schema` answers *where is the shape written down*, and its own doc
   * allows a `$schema` tag the files carry. `validator` answers *what can I
   * run*. They diverge today, in the first case anyone looked at:
   *
   * | kind | `schema` | `validator` |
   * |---|---|---|
   * | `qa` | `content/pipeline/qa-witness.ts` | **none** — that module exports TypeScript INTERFACES; no Zod schema for `qa-witness/v1` exists anywhere |
   *
   * So overloading `schema` would have made its one substantial use a lie:
   * a consumer that imported it expecting something parseable would get a
   * module with nothing to call. Two fields, because a case where they
   * differ is already committed.
   *
   * ## `module#Export`, not a bare module
   *
   * A module path names a file, and a file may export thirty schemas —
   * `schemas/health-report.ts` exports five. The `#` form is the convention
   * `<folio:decision ref="file.dmn#Decision_Id"/>` already uses in every BPMN
   * gateway here, so this reuses a spelling rather than minting one.
   *
   * **Resolved relative to the INSTANCE root**, not the repository root. That
   * distinction was invisible until `#437` moved the instance under
   * `cat-harness/`: the three `schema` paths kept working as instance-relative
   * strings while their own doc called them repo-relative, and nothing
   * noticed because nothing read them. `bun run check:kind-validators` is
   * what notices now.
   *
   * Absent means ABSENT — a kind with no runtime schema. A consumer must
   * report that as *could not determine*, never as valid; 13 of the 16 base
   * kinds are in that state and one of them, `qa`, is the largest generated
   * graph here.
   */
  validator?: string;
}

/**
 * The graph kinds the **harness itself** defines.
 *
 * **The map below is the only answer to how many, and this sentence deliberately
 * does not give one.** It read "Four, and deliberately none of them renderable"
 * over a map of fourteen — and the version before that read "Five" over a map of
 * four, which bean `5o3a` records #269 correcting. A count in prose is a claim
 * that has to be maintained, it was maintained wrongly twice, and nothing checks
 * it. `Object.keys(BASE_GRAPH_KINDS).length` is checkable and free.
 *
 * What IS stable and worth saying: **none of them is renderable.** Everything
 * here is a graph a tool reads — how work is done (`tools`), what an actor knows
 * and which process governs it (`cat-harness`), the shapes both are typed against
 * (`schemas`), the work plan with its running-process state (`beans`), and the
 * ingestion, voice and translation inputs. Rendering belongs to `folio`, which
 * the layer above registers.
 *
 * ## Why the work plan is the harness's and not core's
 *
 * `folio` is registered by `folio-assist-core` because only core can render.
 * The work plan has no such constraint in either direction: an instance has
 * work whether or not it has content, and `agentic-harness` itself carries a
 * `beans/` store for its own. A Tool repo and a Test repo have work plans too.
 * So it is declared here — the test for "does this belong to the harness" is
 * whether the harness has one, and it does.
 *
 * ## One `beans` kind, and where the distinction it carried went
 *
 * This map used to hold five kinds, splitting the work plan in two: `workplan`
 * at `beans/` and `process-state` at `beans/workflow/`. The reasoning was that
 * WHAT IS BEING WORKED ON is human- and agent-authored and carries judgement,
 * while WHERE A RUNNING PROCESS GOT TO is a token the interpreter owns and no
 * human is invited to edit — and that a consumer asking for the work plan must
 * not be handed BPMN instance state.
 *
 * That reasoning holds; the mechanism was wrong. The second directory sat
 * INSIDE the first, so a consumer scanning a declared directory could not
 * assume it owned what lay beneath it, and the two were distinguishable only by
 * file extension — which the declaring comment itself called "a coincidence of
 * the current layout, not a contract". Two sibling entries in a flat list
 * misrepresented a containment relation.
 *
 * `beans/` is now a graph with named nodes (`beans/beans.json`,
 * `schemas/bean-graph.ts`), so the distinction lives INSIDE the graph that
 * declares it rather than out here where it had to be inferred. The harness
 * says which directories exist and what kind of graph each holds; the bean
 * graph says what its own nodes are. One fact, one place, at each level — and
 * the consumer that must not be handed instance state asks for a node by name.
 */
export const BASE_GRAPH_KINDS: Readonly<Record<string, GraphKindDef>> = {
  tools: {
    type: termIri("ToolGraph"),
    renderable: false,
    summary: "Tool definitions — themselves nodes in the KG, per the repo taxonomy.",
  },
  // Named for the LAYER that defines it, like every other harness concept.
  //
  // It was `kg`, which named what the graph HOLDS rather than who owns it —
  // the odd one out in a vocabulary where `harness.json`, `CatHarness`
  // and the `cat-harness` instance are all named for the harness. The owner,
  // 2026-09-19: "kg -> cat-harness for naming conventions, no? skills/
  // schemas beans all in cat-harness, voices, uploads library in
  // folio-asst-core."
  //
  // `kg` remains readable as a deprecated alias — see GRAPH_KIND_ALIASES.
  "cat-harness": {
    type: termIri("KnowledgeGraph"),
    renderable: false,
    summary: "Skills, workflows, roles — the harness layer's own knowledge graph.",
  },
  schemas: {
    type: termIri("SchemaGraph"),
    renderable: false,
    summary: "Schema definitions, self-declared in the smart-base manner.",
  },
  // THE ONE RENDERABLE KIND THE HARNESS OWNS, added 2026-09-20.
  //
  // This table carried no renderable kind until now, on the reasoning in
  // `folio-graph-kind.ts`: "a layer that cannot render must not own the
  // renderable kind." The owner's instruction changed the premise, not the
  // principle — cat-harness now ships a renderer:
  //
  //   "docs/ is about documentation about the KG itself ... docs/ in
  //    cat-harness ... only the most basic tooling and process ... builds off
  //    generic process and single justthedocs tool. no extensions. no fancy.
  //    no js (if possible)."
  //
  // So the rule reads, in its true form: A LAYER OWNS THE KINDS IT CAN RENDER.
  // The harness can render plain documentation about itself, and does. `folio`
  // stays core's because the harness cannot serve it — block viewers, LaTeX,
  // QA badges, translation overlays — and that is the same rule, not an
  // exception to it.
  //
  // A first attempt registered this on import, mirroring `folio`, so the
  // assertion "the harness's own vocabulary contains no renderable kind" could
  // stay literally true. That preserved a sentence at the cost of the design:
  // `folio` pays the side-effect-import price because it is CONTRIBUTED by a
  // dependency and may legitimately be absent, whereas `docs` ships with the
  // harness and can never be absent. Twenty consumers would have needed an
  // import for a kind that is always there. The test was updated instead,
  // which is what it means for a premise to have changed.
  //
  // THE BOUNDARY THIS MUST NOT CROSS: the subject, not the feature list. The
  // moment a `docs` page needs a block viewer, a LaTeX pass, a QA badge or a
  // translation overlay, it is describing authored CONTENT and is a `folio`.
  docs: {
    type: termIri("DocsGraph"),
    renderable: true,
    summary:
      "Documentation ABOUT the knowledge graph — how the harness works, what its " +
      "directories hold, how a process runs. Rendered by the plain just-the-docs " +
      "pipeline. Distinct from `folio`, which is content an author CREATES using " +
      "the graph; the difference is the SUBJECT, not the format. The who-iris " +
      "catalogue is `library/`; a note about it is a `folio`; the page explaining " +
      "how ingestion works is `docs`.",
  },
  // The PUBLISHED PROJECTION of QA verdicts, not the verdicts themselves.
  //
  // Declared as its own kind rather than folded into `kg` because the two are
  // different artefacts with different owners: a verdict lives beside its
  // subject and is what a checker wrote, while a witness is that verdict
  // flattened for the web and is what the docs panel fetches. One is edited by
  // fixing a checker; the other is never edited at all.
  //
  // Undeclared until 2026-09-19 — 134 committed files that no instance
  // declaration mentioned, so a consumer scanning the declared directories saw
  // none of them and reported a clean run over the lot.
  qa: {
    type: termIri("QaGraph"),
    renderable: false,
    summary:
      "QA witnesses — one `qa-witness/v1` document per audited subject, in three " +
      "families (`block`, `kg`, `translation`), projected for the docs site from the " +
      "verdicts that live beside their subjects. Generated; never hand-edited.",
    skill: "qa-witness",
    schema: "content/pipeline/qa-witness.ts",
    // No `validator`, and that is a finding rather than an omission: the
    // module above exports TypeScript interfaces only. The largest generated
    // graph in this instance has no runtime schema, so `kg_validate` reports
    // "could not determine" for it — which is the point of saying so here.
  },
  // Repository health reports — what the daily sweep under `test/health/`
  // wrote. A SEPARATE kind from `qa`, and the distinction is the same one that
  // separates `qa` from `cat-harness`: a QA verdict judges an ARTEFACT this
  // repository produced, against criteria that artefact is supposed to meet. A
  // health report judges the REPOSITORY ITSELF — how big it has grown, how
  // much of the publish branch the review previews occupy, whether the work
  // plan has duplicates in it. Nothing it reports is a defect in a file, and
  // no criterion it applies belongs to a subject. Folding it into `qa` would
  // put "the .git directory is 354 MB" beside "this lane binds no role" and
  // leave a consumer asking for verdicts about its content holding a fact
  // about its clone.
  //
  // No `skill`, deliberately: none of the skills in this instance says how to
  // READ a health report, and naming one that does not exist is the
  // fake-reference failure `activity-names-skill` is written to prevent. The
  // field is optional and absent means absent.
  health: {
    type: termIri("HealthGraph"),
    renderable: false,
    summary:
      "Repository health reports — one `health-report/v1` document per sweep, carrying every check's " +
      "three-state verdict, the thresholds it applied and the basis each threshold was chosen on. " +
      "Generated by `test/health/run.ts`; never hand-edited.",
    schema: "schemas/health-report.ts",
    // declared-path-literal: this table IS the declaration. `validator` is the
    // vocabulary entry that other code resolves THROUGH; reading it from a
    // declaration would be reading it from here. `check:kind-validators`
    // is what proves the path still resolves.
    validator: "schemas/health-report.ts#HealthReportSchema",
  },
  // ONE kind for the whole work plan, not one per store. It replaced `workplan`
  // + `process-state` in #266; the rationale is in this map's doc comment above,
  // and the #263 version it supersedes is preserved there too. PR #266 changed
  // the map and left that comment describing the old five-kind design.
  beans: {
    type: termIri("BeanGraph"),
    renderable: false,
    summary:
      "The work plan — what is being worked on, and where each running BPMN instance got to. " +
      "Its inner directories are declared by `beans/beans.json`.",
  },
  // The two parts of the bean graph. They are BASE kinds rather than
  // something `bean-graph.ts` registers separately, because a directory and
  // what it holds is one concept and this is where it lives — `bean-graph.ts`
  // had grown a parallel closed vocabulary (`BEAN_NODE_KINDS`) saying the same
  // thing in different words.
  "bean-defs": {
    type: termIri("BeanDefsGraph"),
    renderable: false,
    summary:
      "Work items — one Markdown file each, in the layout the `beans` CLI reads. " +
      "Authored and edited by people and agents.",
  },
  "workflow-state": {
    type: termIri("WorkflowStateGraph"),
    renderable: false,
    summary:
      "Running BPMN instances — one JSON file each, carrying " +
      "`\"$schema\": \"folio-workflow-instance/v1\"`. Owned by the interpreter, never hand-edited.",
  },
  // The todo graph. NOT a second work plan: `beans` is the agent work plan and
  // `AGENTS.md` forbids standing up another. This is the thing that document
  // already carves out beside it — "the content-review feedback workflow … a
  // separate domain feature, not the agent work-plan" — and it is CONTENT,
  // owned by the folio. A todo records a PERSON's outstanding work, tagged by
  // the four coordinates of the role model: who, as which role, in which
  // process, on which task.
  todos: {
    type: termIri("TodoGraph"),
    renderable: false,
    summary:
      "Human actors' outstanding work — content, owned by the folio, tagged by role, " +
      "process, task and identity. Its inner directories are declared by `todos/todos.json`.",
  },
  "todo-items": {
    type: termIri("TodoItemsGraph"),
    renderable: false,
    summary:
      "Todo nodes — one file each, carrying `\"$schema\": \"folio-todo/v1\"`. " +
      "Authored by people and by agents on their behalf.",
  },
  // The two stages of the document-ingestion pipeline. They are declared as
  // SEPARATE kinds rather than one `sources` kind because the whole point of
  // the pair is that they are not interchangeable: the corpus-grep checklist
  // searches `library/` and not `uploads/`, so a source still in `uploads/`
  // makes a clean grep read as "nobody has done this" while the file sits on
  // disk. Collapsing them into one kind would erase exactly the distinction
  // `content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md`
  // exists to state.
  uploads: {
    type: termIri("UploadsGraph"),
    renderable: false,
    summary:
      "The incoming queue — raw files as dropped, before ingestion. NOT L1, and not " +
      "greppable as corpus: a document here reads as absent to every consumer.",
  },
  // A REMOTE catalogue modelled in the graph without being held. Distinct from
  // `library`, and the distinction is the whole point: `library` is L1 content
  // that IS here, `catalogue` is the shape of a collection of which almost
  // nothing is. A who-iris node says 1,057,223 files exist and that three of
  // them are materialized; folding that into `library` would make a consumer
  // asking "what have we got" receive an answer about what EXISTS.
  //
  // Every node declares a materialization state and there is no default — see
  // folio-assistant-core/schemas/materialization.ts.
  catalogue: {
    type: termIri("CatalogueGraph"),
    renderable: false,
    summary:
      "A remote catalogue modelled by reference — communities, collections and items " +
      "of a corpus the instance does not hold. Every node declares whether its bytes " +
      "are here (`materialized`), elsewhere (`referenced`) or unestablished (`unknown`), " +
      "with no default. Distinct from `library`, which is content that IS here.",
  },
  library: {
    type: termIri("LibraryGraph"),
    renderable: false,
    summary:
      "L1 source content — one `<bib-slug>/` per ingested document, holding `sections/*.md`, " +
      "`structure.json` and, where the source was scanned, `ocr/page-NNN.txt`. Every " +
      "knowledge-graph reference to a source resolves through here, never to a loose path " +
      "or a bare URL.",
  },
  // Named editorial voice profiles, overlaid on the base house voice. A
  // separate kind from `kg` because a voice is OPT-IN per folio while a skill is
  // simply available: the activation list in `harness.config.json` is what makes
  // a voice apply, and a graph kind that conflated the two would have no place
  // to record that this instance ships four voices and activates none.
  voices: {
    type: termIri("VoiceGraph"),
    renderable: false,
    summary:
      "Editorial voice profiles — one JSON each, carrying `\"$schema\": \"folio-voice/v1\"`. " +
      "Every rule cites the ingested source or KG node it was derived from. Opt-in per folio.",
  },
  "todo-feedback": {
    type: termIri("TodoFeedbackGraph"),
    renderable: false,
    summary:
      "Feedback items — todos raised against a specific block, carrying the submitter's " +
      "identity. Read by the `todo-review` skill.",
  },
  // ── The one kind that is not-rendered ON PURPOSE ──────────────────────
  //
  // Every other kind above is `renderable: false` because it is a graph a
  // TOOL reads and there was never a page to make of it. `fsh-guts` is
  // different in kind: its contents COULD be rendered and deliberately are
  // not. It exists so that something can be KEPT without being PUBLISHED.
  //
  // Owner, 2026-09-19: "do not pollute the KG with SDLC churn … it is the
  // trashcan that does not get rendered but … where deprecated, throwaway
  // stuff goes … do not delete unless explicit confirm."
  //
  // **This is what makes the never-delete rule enforceable beyond beans.**
  // `AGENTS.md` already forbids deleting a bean, and gives a reason that was
  // always general: a scrapped item records that something was considered
  // and rejected, which stops the next agent re-entering the dead end, while
  // a deleted one leaves a sibling unable to tell abandonment from accident.
  // An agent removing a page, a diagram or a script had only `rm` and so the
  // rule could not apply to them. Now delete means relocate, and relocate is
  // reversible.
  //
  // On the name: `.fsh` is FHIR Shorthand in this codebase (`schemas/dak.ts`,
  // `jsonld.ts`, `translation-tools.ts`, `block-qa.ts`) and throughout the
  // WHO SMART folios this platform targets. The collision was raised and the
  // owner confirmed the spelling; it is recorded here so the overlap is met
  // as a known fact rather than rediscovered as a defect.
  "fsh-guts": {
    type: termIri("FshGutsGraph"),
    renderable: false,
    summary:
      "Deprecated and throwaway structured content — kept, addressable and exported, and " +
      "deliberately absent from the rendered site. The destination for anything that would " +
      "otherwise be deleted, and for SDLC churn that must not reach the folio's readers.",
    skill: "fsh-guts",
  },
  // The gettext side of translation: `.pot` templates, `.po` catalogues and
  // the `TranslationNode` manifests that make each pair addressable.
  //
  // THE INPUT TO INJECTION, NEVER THE OUTPUT — and there is deliberately no
  // matching kind for the output. A rendered translation is the SAME KIND OF
  // THING as the page it translates: renderable content, differing by a
  // field. `docs/fr/index.md` declares `lang: fr` and `translation_source:
  // index.md` in its own front matter, exactly as a bean declares its status
  // and a workflow instance declares its `$schema`, so the file answers what
  // it is and the directory does not have to be enumerated.
  //
  // An earlier cut of this (PR #351, first draft) added a `translated-content`
  // kind and a `locale` field, with one declaration per locale subtree — ten
  // entries for five locales across two subtrees, growing as
  // O(locales x subtrees). It restated in `cat-harness.json` what all ten
  // files already said in their own front matter, which is one fact in two
  // places and free to drift. The owner's framing is what settles it:
  // "narrative/audio/visual content with text should be translatable. its not
  // so much the node schema itself but its content (e.g. markdown, bpmn)
  // should be translatable" — translatability is a property of a FORMAT
  // within a content type, which `schemas/translation-tools.ts` already
  // declares, not a property of a directory.
  //
  // `.po` catalogues are different: they are not content in any language, and
  // `translations/` was undeclared entirely until 2026-09-19 — the `dh4f`
  // defect in reverse, five committed directories that no declaration
  // mentioned. That is what this kind is for.
  "translation-sources": {
    type: termIri("TranslationSourceGraph"),
    renderable: false,
    summary:
      "POT templates, PO catalogues and their `TranslationNode` manifests, one directory " +
      "per target locale. The INPUT to injection; the rendered output is ordinary content " +
      "that declares its own `lang`.",
    skill: "translation-manager",
    schema: "schemas/translation.ts",
    // `TranslationConfigSchema`, not `TranslationNodeSchema`: this graph's
    // directory holds the CONFIG that declares the sources, and a node is
    // reached through it. Naming the node schema would validate the wrong
    // file and pass.
    // declared-path-literal: as above — the vocabulary cannot resolve itself
    // through the vocabulary. `check:kind-validators` proves it resolves.
    validator: "schemas/translation.ts#TranslationConfigSchema",
  },
};

/** A graph kind name. Open, not a closed union — downstream layers add kinds. */
export type GraphKind = string;

/** Thrown when a kind is registered twice with different meanings. */
export class GraphKindConflictError extends Error {
  constructor(name: string) {
    super(
      `graph kind "${name}" is already registered with a different definition. ` +
        `Kinds are a shared vocabulary — rename, or register once.`,
    );
    this.name = "GraphKindConflictError";
  }
}

/**
 * The graph-kind vocabulary, extensible by the layers above the harness.
 *
 * An instance registry rather than a bare module constant, so that a test — or
 * a process resolving more than one instance — cannot leak registrations into
 * the next. `defaultGraphKinds` is the convenience shared instance; every read
 * accepts an explicit one.
 *
 * Registration is **idempotent for an identical definition** and throws on a
 * conflicting one, the same rule `schemas/contributions.ts` uses: a diamond
 * dependency graph reaches core twice and must not fail for it, while two
 * different layers claiming one name is a real collision.
 */
/**
 * Graph kinds that were renamed, mapped to what they are now.
 *
 * ## Why an alias and not a sweep
 *
 * `AGENTS.md` is explicit that **overrides match on the entry's `id`, not its
 * `path`** — "matching on path makes two knowledge graphs out of one
 * relocation, and every consumer then scans a directory that is not there".
 * The same property that makes ids worth having makes renaming one a
 * CROSS-INSTANCE BREAKING CHANGE: a downstream instance overriding `kg` is
 * overriding nothing the moment the kind is called something else, and the
 * failure is silent — it scans, finds nothing, and reports a clean run over
 * it. That is the `dh4f` shape, delivered to somebody else's repository.
 *
 * So the old name keeps working, and says so. Reading a declaration that uses
 * it succeeds and records a deprecation; writing one is never done by this
 * repository's own tooling. The alias is removed only after a release in
 * which it warned.
 *
 * Aliases are resolved ONCE, at the registry boundary, rather than at each
 * call site — a second place that knows the old name is a second place that
 * can forget it.
 */
export const GRAPH_KIND_ALIASES: Readonly<Record<string, string>> = {
  kg: "cat-harness",
};

/** What a declared kind name means now, and whether it was a deprecated spelling. */
export function resolveGraphKind(name: string): { kind: string; deprecated?: string } {
  const to = GRAPH_KIND_ALIASES[name];
  return to ? { kind: to, deprecated: name } : { kind: name };
}

export class GraphKindRegistry {
  private kinds = new Map<string, GraphKindDef>();

  constructor(seed: Readonly<Record<string, GraphKindDef>> = BASE_GRAPH_KINDS) {
    for (const [k, v] of Object.entries(seed)) this.kinds.set(k, v);
  }

  register(name: string, def: GraphKindDef): void {
    const existing = this.kinds.get(name);
    if (existing) {
      if (existing.type === def.type && existing.renderable === def.renderable) return; // diamond
      throw new GraphKindConflictError(name);
    }
    this.kinds.set(name, def);
  }

  // `has` and `get` resolve a deprecated spelling, so a declaration written
  // against the old vocabulary still finds its kind. Resolution happens HERE
  // and nowhere else: a second place that knows the old name is a second place
  // that can forget it.
  has(name: string): boolean {
    return this.kinds.has(resolveGraphKind(name).kind);
  }

  get(name: string): GraphKindDef | undefined {
    return this.kinds.get(resolveGraphKind(name).kind);
  }

  names(): string[] {
    return [...this.kinds.keys()];
  }

  /** The kind behind a projected `@type`, or `undefined`. */
  forType(type: string): string | undefined {
    for (const [k, v] of this.kinds) if (v.type === type) return k;
    return undefined;
  }
}

/** The shared registry. Core registers `folio` into this at load. */
export const defaultGraphKinds = new GraphKindRegistry();

/** Is a graph of this kind expected to render as a website? */
export function isRenderable(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return registry.get(kind)?.renderable === true;
}

// ── The declaration ─────────────────────────────────────────────

/** One declared content directory. */
export interface ContentDirectory extends KgNodeLabels {
  /**
   * Stable identifier, unique within an instance. Inheritance overrides match
   * on THIS, never on `path` — see the module note on relocation.
   */
  id: string;
  /**
   * The directory, relative to the root {@link scope} names, with or without a
   * trailing slash.
   */
  path: string;
  /**
   * Which root `path` is relative to. Absent means this instance's.
   *
   * See `DeclarationScopeSchema` in `kg-node.ts` for what `repository` means
   * and why it is a field rather than a `../` in the path.
   */
  scope?: DeclarationScope;
  /** What kind of graph lives there. */
  /**
   * Which parts of the knowledge graph this directory holds — an ARRAY,
   * because a directory is a PLACE TO LOOK and may hold more than one.
   *
   * It does not say how to tell the contents apart, and that is deliberate:
   * **the files declare what they are.** A bean carries its id, `title`,
   * `status` and `type` in front matter; a workflow instance carries
   * `"$schema": "folio-workflow-instance/v1"`. A consumer reads a file and
   * the file answers, so a declaration states what to EXPECT rather than how
   * to discriminate.
   *
   * Was singular `graph`. Made an array 2026-09-18 so that this schema and
   * the bean graph state the same fact the same way — they had diverged into
   * `graph: "kg"` here and `kinds: ["bean-defs"]` there, two spellings of one
   * concept.
   */
  graphs: GraphKind[];
}

/** An instance's root declaration. */
export interface CatHarnessDeclaration extends KgNodeLabels {
  /**
   * Images this instance names — its marks, in the graph rather than beside it.
   *
   * See {@link KgImage}: the docs site, the README and the browser tab all want
   * the same picture, and a node is what stops each of them hardcoding its own
   * path to it.
   */
  images?: KgImage[];
  /**
   * Non-image artefacts this instance names — `AGENTS.md` first among them.
   *
   * See {@link KgAsset}. Declared for the same reason {@link images} is: a
   * file nobody declares is a file nobody checks, and `AGENTS.md` was the only
   * root artefact in neither list.
   */
  assets?: KgAsset[];
  /**
   * The id of the {@link images} entry to use as the browser icon.
   *
   * An id and not a path, so moving the file is one edit in one place. A
   * dangling reference is reported by `readDeclaration` rather than silently
   * rendering no icon — a missing favicon looks exactly like a slow one.
   */
  icon?: string;
  /** The instance's name, e.g. `"agentic-harness"`. */
  name: string;
  /**
   * The repository's short name, used as the **filename stem of every artefact
   * this instance publishes** — `<stub>.jsonld` for the knowledge graph,
   * `<stub>.schema.json` for its schema. Defaults to `name`.
   *
   * WHO's `smart-base` derives its stub by stripping the `smart-` prefix from
   * the repository name (`smart-base` → `base` → `https://smart.who.int/base`),
   * so the stub, the directory and the published path are one word. The same
   * convention holds here without the prefix rule: the artefact is named after
   * the repository, so a reader who knows the repo knows the filename.
   *
   * Note the declaration file itself is **not** stub-named — it stays
   * `harness.json`, exactly as `smart-base`'s config stays `dak.json`. A
   * consumer must be able to find the config without already knowing the
   * repository's name; the artefacts it *describes* are free to be named.
   */
  stub?: string;
  /**
   * Where this instance's artefacts are published — the base every `@id` in
   * the exported graph is minted against.
   *
   * Absent means **no absolute IRIs can be minted**, which the exporter reports
   * rather than papering over with a plausible-looking guess: an `@id` that
   * resolves to nothing is worse than an obviously relative one, because it
   * looks dereferenceable and is not.
   */
  canonicalUrl?: string;
  /** Where CI previews are served, when that differs from `canonicalUrl`. */
  previewUrl?: string;
  /**
   * WHAT KIND of host serves this instance's renderings.
   *
   * The `publication host` axis of
   * `docs/proposals/deployment-topologies.md`, accepted 2026-09-19. Four
   * topologies in issue #363 — local git only, private repo, developer and
   * self-sovereign — do not publish to GitHub Pages, and before this nothing
   * could say so.
   *
   * **Distinct from `canonicalUrl`, and from `readme.linkStyle`.** Three
   * different questions that are easy to run together:
   *
   * | field | question | lives in |
   * |---|---|---|
   * | `canonicalUrl` | what base are `@id`s minted against? | `harness.json` |
   * | `publication.host` | what kind of thing serves the rendering? | `harness.json` |
   * | `readme.linkStyle` | how is a link to a published artefact written? | `harness.config.json` |
   *
   * **Absent is a third state and must stay one.** It means the deployment
   * has not said, NOT that it is `github-pages`. Defaulting to Pages is
   * exactly how a local-server deployment gets told it publishes somewhere it
   * does not — the failure this field exists to end.
   *
   * **No `url` here, deliberately.** `canonicalUrl` already holds that fact,
   * and a second URL field is two places to disagree. A local server's
   * address is a `--port` at run time, not a property of the instance.
   */
  publication?: Publication;
  /**
   * The topology axes this deployment declares about itself. See
   * {@link Topology} — every field optional, absent meaning "has not said".
   */
  topology?: Topology;
  /** Directories this instance scans, before inheritance. */
  directories: ContentDirectory[];
}

export const ContentDirectorySchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  ...scopeShape,
  // Open string here, checked against the registry in `readDeclaration`.
  // A closed enum would have to be built at module load, which is before core
  // has registered `folio` — so the enum would reject the one kind the whole
  // rendering pipeline depends on.
  graphs: z.array(z.string().min(1)).min(1),
  ...kgNodeLabelShape,
});

// THERE IS NO `locale` FIELD HERE, and that is a decision rather than an
// omission. A first draft of PR #351 added one, required on a
// `translated-content` directory and refused elsewhere. It worked and it was
// the wrong axis: a translated page already declares `lang` and
// `translation_source` in its own front matter, so the directory entry
// restated what every file inside it already said — one fact in two places,
// free to drift, and growing as O(locales x subtrees).
//
// The rule this repository keeps returning to: a declaration states what to
// EXPECT in a directory, and THE FILES DECLARE WHAT THEY ARE. `beans/` is one
// entry whose contents are told apart by a bean's front matter and a workflow
// instance's `$schema`; `docs/assets/qa/` is one entry holding three witness
// families, told apart by the documents. Translated pages are the same shape:
// one declaration for the content, and `lang` on the file.

/**
 * The conventional directories every instance gets without declaring them.
 *
 * ## Why defaults live in the CONTAINER SCHEMA
 *
 * The owner, 2026-09-19: *"inherit, set default dirs/graphs in container
 * schema definitions."* An instance that follows the convention should declare
 * NOTHING — the friction of a new topical directory ought to be a line, and
 * the friction of a conventional one ought to be zero. Before this, every
 * instance restated the same seven entries, which is seven chances to disagree
 * with the platform about what `beans/` is.
 *
 * `resolveDirectories` seeds from these and the declaration chain overrides
 * **by `id`**, exactly as a dependency's entries are overridden — so a default
 * is not a special case in the resolution rules, it is the outermost link of
 * the chain.
 *
 * ## A default is only real if the directory EXISTS
 *
 * They are filtered by existence at resolve time, and that is not an
 * optimisation. `AGENTS.md`: *"Declare only what exists — a declared-but-absent
 * directory is the bean `dh4f` defect, where a consumer scans nothing and
 * reports a clean run over it."* Seeding a default for `voices/` into an
 * instance with no voices would manufacture exactly that, at scale, in every
 * instance at once.
 *
 * An EXPLICIT declaration is honoured whether or not the directory is there:
 * that is the instance asserting something, and `readDeclaration` already
 * refuses a declaration it cannot read. A default is the platform guessing,
 * and a guess has to be checked.
 *
 * ## What is not here
 *
 * `folio` — the one renderable kind — is registered by CORE, not the harness,
 * and the harness cannot default a directory to a kind it does not know. Any
 * topical directory (`bootstrap/`, `crdm/`, …) is declared, one line each: the
 * platform cannot guess names it has never met, and guessing would re-create
 * the `dh4f` shape for every name it guessed wrong.
 */
// declared-path-literal: THE BASE CASE. These ARE the defaults every other
// site reads through `resolveDirectories`; reading a declaration to learn the
// fallback for an instance that has none is not a thing that can be done.
export const DEFAULT_DIRECTORIES: readonly ContentDirectory[] = [
  { id: "tools", path: "tools/", graphs: ["tools"] },
  { id: "schemas", path: "schemas/", graphs: ["schemas", "cat-harness"] },
  { id: "cat-harness", path: "skills/", graphs: ["cat-harness"] },
  { id: "beans", path: "beans/", graphs: ["beans"] },
  { id: "todos", path: "todos/", graphs: ["todos"] },
  { id: "uploads", path: "uploads/", graphs: ["uploads"] },
  { id: "library", path: "library/", graphs: ["library"] },
  { id: "voices", path: "voices/", graphs: ["voices"] },
];

/**
 * The kinds of host that can serve an instance's renderings.
 *
 * The values are the `publication host` axis of
 * `docs/proposals/deployment-topologies.md` verbatim. Keep them in step: the
 * proposal is what a reader reasons with, this is what a machine reads, and a
 * fifth value invented here without a row there is a vocabulary nobody agreed.
 *
 * `none` is a real answer, not a missing one — a developer checkout that
 * renders nothing publishes nowhere, and saying so is different from not
 * saying.
 */
export const PUBLICATION_HOSTS = [
  "github-pages",
  "local-server",
  "jurisdiction-endpoint",
  "none",
] as const;

export type PublicationHost = (typeof PUBLICATION_HOSTS)[number];

export interface Publication {
  host: PublicationHost;
}

export const PublicationSchema = z.object({
  host: z.enum(PUBLICATION_HOSTS),
});

/**
 * The **forge** axis — where change proposals live.
 *
 * `deployment-topologies.md` §1 axis 1. `none` is local git with no service
 * at all, and is a real answer rather than a missing one.
 */
export const FORGES = ["none", "github", "self-hosted", "jurisdiction-hosted"] as const;
export type Forge = (typeof FORGES)[number];

/**
 * The **network reach** axis — what the harness may call out to.
 *
 * §1 axis 5. The distinction between `egress-restricted` and `air-gapped`
 * carries real weight: they were ONE value in the proposal's first draft, and
 * splitting them is what exposed the hosted-inference contradiction below. A
 * deployment that wants closed hosted models is, by that choice, not
 * air-gapped.
 */
export const NETWORK_REACHES = ["internet", "egress-restricted", "air-gapped"] as const;
export type NetworkReach = (typeof NETWORK_REACHES)[number];

/**
 * The **model provenance** axis — where inference happens and under whose terms.
 *
 * §1 axis 8. Deliberately separate from model *cardinality* (how many): a
 * stack of open-weight local models and a single closed hosted one are both
 * real configurations, and collapsing the two axes is what made the
 * air-gapped contradiction invisible.
 */
export const MODEL_PROVENANCES = ["open-weight-local", "hosted", "mixed"] as const;
export type ModelProvenance = (typeof MODEL_PROVENANCES)[number];

/**
 * The topology axes an instance declares about ITSELF.
 *
 * ## Why only four of the ten
 *
 * `deployment-topologies.md` names ten axes. Four are declared here, and the
 * choice is not arbitrary: these are exactly the axes that
 * {@link topologyConflicts} reads. Declaring the other six would add
 * vocabulary nothing consumes — the `dh4f` defect pointing the other way,
 * where a declaration exists and no code is behind it. They land when a check
 * or a tool needs them.
 *
 * ## Every field is optional, and absent is a THIRD STATE
 *
 * Absent means *this deployment has not said*, never a default. That is not
 * politeness, it is what makes the check safe to add: no instance in
 * existence declares any of these, so a rule that treated absent as a value
 * would refuse every one of them on the day it shipped.
 *
 * The owner's rule, 2026-09-19: **"dont encode rules against a working
 * setup."** A missing constraint fails visibly at the point of use with the
 * real error; a wrong constraint refuses a good deployment at the gate with a
 * confident message, and nobody investigates a settled question.
 *
 * **`publication.host` is axis 3 and is NOT here** — it lives on
 * {@link Publication}, where it already was, because it answers a publication
 * question and has two other fields it must be told apart from. The axes are
 * therefore read from two places, and {@link topologyConflicts} is the single
 * place that joins them rather than a second home for the vocabulary.
 */
export interface Topology {
  forge?: Forge;
  network?: NetworkReach;
  modelProvenance?: ModelProvenance;
  /** Whether the deployment serves people outside the operator. §1 axis 10. */
  outwardFacing?: boolean;
}

export const TopologySchema = z.object({
  forge: z.enum(FORGES).optional(),
  network: z.enum(NETWORK_REACHES).optional(),
  modelProvenance: z.enum(MODEL_PROVENANCES).optional(),
  outwardFacing: z.boolean().optional(),
});

/** One refused combination, with the reason a reader can argue with. */
export interface TopologyConflict {
  /** The two declared values that cannot co-occur, as `axis: value`. */
  pair: [string, string];
  /** Why the mechanism forbids it — an entailment, never a report. */
  reason: string;
}

/**
 * Every incompatible pair a declaration names. Empty is the normal answer.
 *
 * ## The bar for a rule here
 *
 * Each of these is an **entailment of the mechanism**, which is the standard
 * `deployment-topologies.md` §3 sets and the reason the table is short:
 *
 * | encode it | do not encode it |
 * |---|---|
 * | Pages has no per-file media-type configuration; air-gapped compute cannot reach hosted inference | someone said so, however authoritative |
 * | measured, with the command and the date | true of one account, one plan, one version |
 *
 * The operative test is **not how certain the claim feels — it is whether a
 * counter-example is conceivable.**
 *
 * ## Two things deliberately absent
 *
 * **`visibility: private` with `github-pages` is NOT a conflict.** Settled by
 * the owner 2026-09-19: Pages on a private repository exists on some plans,
 * so a deployment may legitimately declare both. It is a *reason to reach for
 * the local server*, not a property of the mechanism. Do not re-litigate it;
 * `visibility` is not even declared, so there is nothing to trip over.
 *
 * **`air-gapped` with `modelProvenance: "mixed"` is NOT refused**, although
 * `hosted` is. **Settled by the owner 2026-09-20**, and for a better reason
 * than the one this comment used to give:
 *
 * > "no air-gapped-mixed. that is mixed already. its a spectrum, based on
 * > the deployment archicutectur of each machine actor."
 *
 * At deployment level `mixed` MEANS THE ACTORS DIFFER FROM EACH OTHER.
 * Refusing it would refuse the normal case — a site where some machine
 * actors reach out and some do not. There is no contradiction to catch,
 * because the deployment value is an aggregate over participants that are
 * individually consistent.
 *
 * That also says what this axis is and is not. Reach is a property of each
 * MACHINE ACTOR; the deployment value describes the population. So a rule
 * pairing `network` with `modelProvenance` can only be sound where the
 * deployment value is UNIFORM — `air-gapped` × `hosted` is refused because
 * `hosted` admits no local participant, and `mixed` is refused by nothing
 * because it asserts variety.
 *
 * The earlier reasoning here — "a counter-example is conceivable" — reached
 * the right answer by a weaker route, and is kept only in the test that
 * records the decision. See `folio-assistant-r0rq` for the per-actor model.
 */
export function topologyConflicts(
  topology: Topology | undefined,
  host: PublicationHost | undefined,
): TopologyConflict[] {
  const t = topology ?? {};
  const out: TopologyConflict[] = [];

  // Every guard below tests for a DECLARED value on both sides. An undeclared
  // axis contributes to no conflict, which is the third state doing its job.
  if (host === "github-pages" && t.forge !== undefined && t.forge !== "github") {
    out.push({
      pair: ["publication.host: github-pages", `topology.forge: ${t.forge}`],
      reason:
        "GitHub Pages is a GitHub product and publishes from a GitHub repository. " +
        "With any other forge there is nothing for it to publish from.",
    });
  }

  if (t.network === "air-gapped" && t.forge === "github") {
    out.push({
      pair: ["topology.network: air-gapped", "topology.forge: github"],
      reason: "An air-gapped deployment cannot reach github.com, so the forge is unreachable.",
    });
  }

  if (t.network === "air-gapped" && t.modelProvenance === "hosted") {
    out.push({
      pair: ["topology.network: air-gapped", "topology.modelProvenance: hosted"],
      reason:
        "Inference cannot leave the airlock. A deployment that wants hosted models " +
        'is, by that choice, `egress-restricted` rather than `air-gapped`.',
    });
  }

  // NOT redundant with the two above, though the proposal calls it a
  // consequence of them. It follows only when `forge` is also declared — and
  // `forge` is optional, so on a declaration that names the network and the
  // host and nothing else, this is the only rule that fires.
  if (t.network === "air-gapped" && host === "github-pages") {
    out.push({
      pair: ["topology.network: air-gapped", "publication.host: github-pages"],
      reason: "An air-gapped deployment cannot reach GitHub Pages to publish to it.",
    });
  }

  if (t.outwardFacing === true && host === "none") {
    out.push({
      pair: ["topology.outwardFacing: true", "publication.host: none"],
      reason:
        "Nothing is served, so nobody outside the operator can reach it. " +
        "Declare a host, or say the deployment is not outward-facing.",
    });
  }

  return out;
}

/** Thrown when a declaration names a combination that cannot exist. */
export class TopologyConflictError extends Error {
  constructor(
    readonly path: string,
    readonly conflicts: TopologyConflict[],
  ) {
    super(
      `${path} declares ${conflicts.length} incompatible ` +
        `combination${conflicts.length === 1 ? "" : "s"}:\n` +
        conflicts.map((c) => `  - ${c.pair[0]} with ${c.pair[1]}\n      ${c.reason}`).join("\n"),
    );
    this.name = "TopologyConflictError";
  }
}

export const CatHarnessDeclarationSchema = z.object({
  name: z.string().min(1),
  ...kgNodeLabelShape,
  images: z.array(KgImageSchema).optional(),
  /**
   * Declared non-image artefacts — `AGENTS.md` first among them.
   *
   * Optional, and absent is the unmigrated case rather than "this instance
   * has none": every instance has an `AGENTS.md`, and until one declares it
   * nothing can check it. See {@link KgAssetSchema}.
   */
  assets: z.array(KgAssetSchema).optional(),
  icon: z.string().min(1).optional(),
  stub: z.string().min(1).optional(),
  canonicalUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
  publication: PublicationSchema.optional(),
  topology: TopologySchema.optional(),
  directories: z.array(ContentDirectorySchema).default([]),
});

/**
 * The stem every published artefact is named with: `stub` when declared,
 * otherwise `name`.
 *
 * One function so the KG export, the schema export and any future artefact
 * cannot disagree about what this instance is called — the naming convention
 * is only worth having if it is computed in one place.
 */
export function artefactStub(d: Pick<CatHarnessDeclaration, "name" | "stub">): string {
  return d.stub ?? d.name;
}

/**
 * Where this instance's renderable site lives in the working tree:
 * `docs/<stub>/`.
 *
 * **The stub segment is the packaging for the repo split (issue #223).** Every
 * layer's pages sit under their own instance's stub, so splitting a layer out
 * is a directory move rather than a sift through a shared tree — and two
 * layers' docs can be checked out side by side without colliding, which is the
 * same job the stub already does for `<base>/<stub>.jsonld` and
 * `<base>/<stub>/` in `publishedAt` below.
 *
 * **It does not change a single published URL.** Jekyll is pointed at this
 * directory as its source root (`docs-site.yml`, `feature-staging.yml`), so
 * the site's internal layout is untouched and every
 * `litlfred.github.io/folio-assistant/...` link resolves exactly as before.
 *
 * **This is NOT the `folio` graph-kind declaration**, and it deliberately
 * stops short of it. `docs/` cannot be declared a directory of this instance
 * yet: `folio` is registered by CORE, and re-measured 2026-09-19 with the
 * entry added, `harness:dirs`, `kg:schema:check` and `docs:harness:check` all
 * throw `unknown graph kind "folio"` and 5 tests fail. What this function does
 * fix is the OTHER half of bean `x4a6` — the site root was spelled out
 * separately in `translation-index.ts`, `gen-docs-pages.ts`,
 * `gen-skill-docs.ts`, `gen-schema-docs.ts` and `translation-qa-sweep.ts`,
 * five copies free to disagree. Now one, and when the split lands it becomes
 * one line reading the declared directory instead of composing it.
 */
export function siteDir(_d: Pick<CatHarnessDeclaration, "name" | "stub">): string {
  // **Relative to the INSTANCE root, and that is the whole of it: `docs`.**
  //
  // This returned `docs/<stub>`, then `<stub>/docs`, and both were composing a
  // stub level into a path because the instance had no directory of its own —
  // every instance artefact and every repository artefact shared one root, so
  // the stub was the only thing keeping two instances apart.
  //
  // The move (bean `wggr`) gave the instance its own directory, and the stub
  // level stopped being something to compose: it IS the instance root. So this
  // function got SHORTER, which is the honest outcome — the layout now
  // expresses directly what the string used to encode.
  //
  // ## It takes the declaration anyway, and the parameter is deliberate
  //
  // Every caller already holds one, the signature is what ~20 call sites are
  // written against, and an instance is free to declare its site elsewhere
  // later. Dropping the parameter would make that a breaking change for a
  // saving of nothing.
  //
  // ## Both ends are measured from the SAME root now, which they were not
  //
  // `siteDirFor` reads `<root>/harness.json`, so its input is the instance
  // root; its output was `<stub>/docs`, measured from the REPOSITORY root.
  // While those were one directory nobody could see the difference. The move
  // separated them and every `join(ROOT, siteDirFor(ROOT), …)` — the shape of
  // every call site here — started composing `cat-harness/cat-harness/docs`.
  // Eighteen failures, all of them that.
  //
  // A caller that genuinely wants the repository-relative form composes it and
  // says so: `join(artefactStub(d), siteDir(d))`. There is exactly one, the
  // `.gitignore` guard, because `git check-ignore` runs at the repository root.
  return "docs";
}

/**
 * The REPOSITORY root, given an instance root.
 *
 * ## Two roots stopped being one directory
 *
 * Until the stub move (bean `wggr`) every instance artefact and every
 * repository artefact sat side by side, so `resolve(import.meta.dir, "../..")`
 * answered both questions and nobody had to ask which one they meant. Moving
 * the instance under `<stub>/` separated them, and **every consumer that had
 * conflated the two now resolves the wrong one** — silently, because the join
 * still produces a plausible path.
 *
 * Measured on the move: 97 test failures and 11 load errors, one cause. Every
 * ENOENT named something correctly at the repository root and looked for it
 * under the instance: `.github/workflows/`, `.gitignore`, `package.json`,
 * `AGENTS.md`, `beans/`, `todos/`, `fsh-guts/`.
 *
 * ## What lives at which root, and why the split is not arbitrary
 *
 * The repository root holds what belongs to the REPOSITORY rather than to any
 * instance in it: the CI configuration that builds it, the package manifest
 * and lockfile that install it, `.gitignore`, and the stores that are never
 * overlaid — `beans/`, `todos/`, `fsh-guts/`, `bootstrap/`. That set is closed
 * by a test rather than by this comment; a repository holding two instances
 * has one of each of those and two of everything else, which is the property
 * that decides membership.
 *
 * Everything else — `skills/`, `schemas/`, `src/`, `content/`, `docs/`,
 * `tools/` — is the instance's and travels with it when the repository splits.
 *
 * ## It is `dirname`, and it is a function anyway
 *
 * One line, and worth a name for two reasons. It makes the QUESTION visible at
 * the call site: `repoRootFor(ROOT)` says "I mean the repository" where
 * `join(ROOT, "..")` says only "up one", and up-one is what the broken callers
 * were already doing by accident. And it is the single place to change if an
 * instance is ever nested deeper than one level, which `siteDir` already
 * anticipates by composing rather than hardcoding.
 *
 * It does NOT verify that the result is a repository. A caller that needs to
 * know asks for the artefact it wants and handles its absence; a check here
 * would turn "this path is not what you think" into a throw at import time in
 * tools that had nothing to do with the question.
 */
export function repoRootFor(instanceRoot: string): string {
  return join(instanceRoot, "..");
}

/**
 * The root a declared `path` or `src` is relative to.
 *
 * The ONE place a declared scope turns into a directory. Every consumer of a
 * declared path goes through `resolveDirectories` or `declaredAssets`, and
 * both go through here, so relocating an instance within its repository is a
 * change to this function rather than a sweep over six declarations.
 */
export function rootForScope(instanceRoot: string, scope?: DeclarationScope): string {
  return scope === "repository" ? repoRootFor(instanceRoot) : instanceRoot;
}

/**
 * The instance directory a module inside it belongs to — the nearest enclosing
 * directory carrying a {@link DECLARATION_FILENAME}.
 *
 * ## Why a walk rather than `process.cwd()`
 *
 * Nine scripts under `scripts/` and `content/pipeline/` read this instance's
 * declaration and got the root from the working directory. That was never a
 * claim about the instance; it was true only because a gate is run from the
 * repository root and the two were one directory. After the move (bean
 * `wggr`) seven CI gates threw `ENOENT: …/harness.json` — which was at least
 * loud. `check-declared-assets` did not throw: it read a declaration that was
 * not there, got no assets, and reported a clean run.
 *
 * An instance's own tooling belongs to exactly one instance — **the one it
 * lives in** — so the honest question is "where am I", and every such script
 * passes `import.meta.dir`.
 *
 * ## Why a walk rather than `resolve(import.meta.dir, "..")`
 *
 * Counting `..` pins the caller's depth: a script moved one directory down
 * starts reading a declaration from somewhere else, and nothing says so. The
 * walk finds the DECLARATION, which is the thing being asked for.
 *
 * Returns `undefined` rather than guessing — a site root guessed wrong writes
 * hundreds of pages into a directory nothing serves. {@link instanceRootFor}
 * is the throwing form for callers that cannot continue without one.
 */
export function findInstanceRoot(start: string): string | undefined {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, DECLARATION_FILENAME))) return dir;
    const up = resolve(dir, "..");
    if (up === dir) return undefined;
    dir = up;
  }
}

/** {@link findInstanceRoot}, throwing rather than returning `undefined`. */
export function instanceRootFor(start: string): string {
  const root = findInstanceRoot(start);
  if (root === undefined) {
    throw new Error(
      `no ${DECLARATION_FILENAME} in ${resolve(start)} or any parent — ` +
        `cannot determine which instance this belongs to`,
    );
  }
  return root;
}

/**
 * `siteDir` for the instance rooted at `root`, read from its declaration.
 *
 * Deliberately a RAW read of `name`/`stub` rather than `readDeclaration`:
 * those two fields are all this needs, and going through the full reader
 * would make every consumer of the site root — four generators and the
 * translation sweep — fail the moment some unrelated directory declares a
 * kind the harness layer has not registered. That is exactly the `folio`
 * situation bean `x4a6` is blocked on, and it must not take the site root
 * down with it.
 *
 * It **throws** rather than defaulting when the declaration is missing or
 * nameless. A site root guessed wrong writes 278 pages into a directory
 * nothing serves, and "could not determine" is never rendered as an answer.
 */
/**
 * Where an instance publishes the instructions for BOOTSTRAPPING INTO IT,
 * relative to that instance's own docs root.
 *
 * ## Why a fixed convention rather than a lookup
 *
 * §5 of the bootstrap proposal has the agent obtain exactly ONE reference —
 * `litlfred/f-a-sci` — and read everything else from that instance's own
 * declaration. That answers *which* instance. It does not answer *where in it*
 * the initialization steps are, and without a fixed answer the agent needs
 * per-instance knowledge of every harness it might be pointed at, which is
 * precisely what one reference was meant to remove.
 *
 * So every cat-harness instance, and every instance that depends on one,
 * publishes them at the SAME place. Bootstrap then needs no special case per
 * target: `f-a-sci`, `smart-base` and a specialised harness nobody has written
 * yet are all read the same way. That is what lets bootstrap initialise into a
 * *specialised* kind rather than only into the one it was written against.
 *
 * ## Composed, never spelled
 *
 * Built from {@link siteDir} rather than written as `docs/bootstrap/...`,
 * because the stub pattern INVERTED on 2026-09-19 — `docs/<stub>` became
 * `<stub>/docs` (bean `wggr`) — and every literal spelling of the old layout
 * had to be found and changed. A convention composed from the one function
 * that knows the site root survives the next relocation; a literal does not.
 */
export const BOOTSTRAP_INIT_DOC = "bootstrap/initialization.md";

/**
 * The path to an instance's initialization instructions, relative to that
 * INSTANCE's root — `docs/bootstrap/initialization.md`.
 *
 * THE one answer, so the README that tells an agent where to look and the
 * check that verifies the file is there cannot disagree about the spelling.
 *
 * ## It was repo-relative, and the move narrowed it
 *
 * This arrived composing `<stub>/docs/...` and its docstring said "full
 * repo-relative path", which was true while {@link siteDir} returned
 * `<stub>/docs`. It returns plain `docs` now, because the instance has a
 * directory of its own and the stub level inside it would repeat the name.
 *
 * So the suffix is IDENTICAL for every instance, which is a stronger version
 * of the property bootstrap relies on than "differs only by site root".
 *
 * ## The open half, stated rather than papered over
 *
 * Bootstrap is handed ONE reference and must reach this file, so it needs the
 * instance's DIRECTORY, and this function no longer supplies it. On this
 * repository the directory is `cat-harness/` while the stub is
 * `folio-assistant` — deliberately different, since the stub names published
 * artefacts and the directory is a filesystem fact — so `<stub>/` would name
 * nothing.
 *
 * Resolving it by scanning the top level for a `harness.json` is the
 * declaration-driven answer and is what {@link findInstanceRoot} already does
 * in the other direction, but it is NOT implemented and is not assumed here.
 * Recorded on bean `wggr`; until then bootstrap can compose this suffix and
 * still needs told which directory to hang it off.
 */
export function initializationDoc(d: Pick<CatHarnessDeclaration, "name" | "stub">): string {
  return `${siteDir(d)}/${BOOTSTRAP_INIT_DOC}`;
}

export function siteDirFor(root: string): string {
  const p = join(root, "harness.json");
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(
      `cannot determine the site root: ${p} is unreadable or not valid JSON ` +
        `(${e instanceof Error ? e.message : String(e)})`,
    );
  }
  const d = raw as { name?: unknown; stub?: unknown };
  const stub = typeof d.stub === "string" && d.stub ? d.stub : d.name;
  if (typeof stub !== "string" || !stub) {
    throw new Error(`cannot determine the site root: ${p} declares neither \`stub\` nor \`name\``);
  }
  return siteDir({ name: stub, stub });
}

/**
 * Where an instance's renderings are published, given the site they are
 * published to.
 *
 * **They sit at the base, not in a subdirectory.** A cat-harness instance's
 * repository IS its declaration that it is a graph — `harness.json` at the
 * root says which graphs are here — so there is nothing for a `kg/` segment to
 * distinguish it from. The stub is what separates one instance's renderings
 * from another's in a tree that overlays several, which is the job a directory
 * would otherwise have been doing.
 *
 * ```
 * <base>/<stub>.jsonld          the knowledge graph
 * <base>/<stub>.json            the same bytes, servable as application/json
 * <base>/<stub>.schema.json     the declaration's schema
 * <base>/<stub>/                the viewer
 * ```
 *
 * **One function so nothing hand-writes a path again.** It was written out in
 * seven template literals across two exporters and two workflows — five of them
 * minting an `$id`, which is an identity, not a link. Relocating the renderings
 * from `kg/` to the base meant editing all seven, and a missed one publishes a
 * document whose own `$id` names a URL that 404s. `skillSchemaId` in
 * `harness-schema-export.ts` already carried this argument for its own corner;
 * this generalises it.
 *
 * A trailing slash on `base` is dropped, and an EMPTY base yields a
 * document-relative path rather than one rooted at `/` — a leading slash would
 * silently retarget every reference at the domain root, which is a different
 * site.
 */
export function renderingPath(base: string, ...segments: string[]): string {
  const b = base.replace(/\/+$/, "");
  const tail = segments.filter((s) => s.length > 0).join("/");
  return b ? `${b}/${tail}` : tail;
}

/**
 * Graph kinds that must NEVER reach a published knowledge graph.
 *
 * Owner, 2026-09-19: *"NEVER include fsh-guts, references to fsh-guts
 * stripped out of KG before sending to publication."*
 *
 * **Keeping the CONTENT out of the render pipeline is not the same as keeping
 * the REFERENCE out of the graph, and the first was shipped believing it
 * covered the second.** An instance's declared directories become nodes in
 * `<stub>.jsonld`, so declaring `fsh-guts/` locally — which is required, or
 * no tool can find it and the never-delete rule has no destination — put its
 * id, path and description into the published graph.
 *
 * **This is not a contradiction of `<base>/fsh-guts.jsonld`.** They are
 * different documents: that one IS the trashcan's graph and is asked for by
 * name; every other published artefact must contain no path to it. A consumer
 * may go there deliberately and must never arrive by following an edge.
 *
 * One list, read by every emitter, so two filters cannot disagree about what
 * is excluded.
 */
export const UNPUBLISHED_GRAPH_KINDS: readonly string[] = ["fsh-guts"] as const;

/** Is this graph kind allowed into a published graph? */
export function isPublishedGraphKind(name: string): boolean {
  return !UNPUBLISHED_GRAPH_KINDS.includes(name);
}

/**
 * Is this SKILL allowed into a published graph?
 *
 * The skill that documents an unpublished kind is itself unpublished, and it
 * carries the kind's name. Leaving it in was the second leak found while
 * building this: the graph-kind and directory nodes were filtered, and
 * `skill/fsh-guts` plus the `declaresSkill` edge from `package/folio-core`
 * still named the trashcan, its purpose and its path.
 *
 * That is the right outcome on the merits as well as the letter. The skill's
 * subject IS where to put SDLC churn, so publishing it advertises the
 * trashcan to every consumer of the folio's graph — the precise thing the
 * owner's instruction forbids.
 *
 * Same list, because the skill and the kind share a name by construction.
 * If that ever stops being true this needs its own list, not a cleverer
 * derivation.
 */
export function isPublishedSkill(name: string): boolean {
  return !UNPUBLISHED_GRAPH_KINDS.includes(name);
}

/**
 * Is this schema module allowed into a published graph?
 *
 * The FOURTH emitter, and it was not exercised until a `schemas/fsh-guts.ts`
 * existed — which is to say the gap was latent from the day the strip was
 * written and only became visible when somebody added the module. The
 * blanket test in `fsh-guts-unpublished.test.ts` caught it on the first run,
 * which is the whole reason that test asserts a string rather than a list of
 * emitters: a new emitter cannot be added to a list nobody remembers to
 * update.
 *
 * Matched on the module's BASENAME, since that is the node's `name` and what
 * a consumer reads. `schemas/log-entry.ts` stays published: it is named
 * after the log, not after the trashcan, and the rule is about naming the
 * trashcan rather than about anything that mentions it. By the same token a
 * schema whose subject is fsh-guts advertises it to every consumer of the
 * folio's graph, which is the precise thing the owner's instruction forbids
 * — the identical argument `isPublishedSkill` records.
 */
export function isPublishedSchemaModule(modulePath: string): boolean {
  const basename = modulePath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? modulePath;
  return isPublishedGraphKind(basename);
}

/**
 * Is this declared directory allowed into a published graph?
 *
 * A directory is excluded when ANY graph it holds is excluded — not when all
 * of them are. `graphs` is an array and a directory may hold more than one
 * part of the graph, so an "all" test would publish a directory that holds
 * both `kg` and `fsh-guts`, naming the trashcan's path in the process.
 */
export function isPublishedDirectory(d: { graphs?: readonly string[] }): boolean {
  return (d.graphs ?? []).every(isPublishedGraphKind);
}

/**
 * The declared publication host for the instance rooted at `root`, or
 * `undefined` when it has not said.
 *
 * **`undefined` is never to be read as `github-pages`.** A caller that wants
 * to tell somebody where a thing rendered must report "not declared" as its
 * own answer — that is the whole defect this field closes, and defaulting
 * here would reintroduce it one layer down where nobody would see it.
 *
 * A RAW read of the one field, like `siteDirFor` and for the same reason: a
 * consumer asking where the site publishes must not fail because some
 * unrelated directory declares a graph kind this layer has not registered.
 */
export function publicationHost(root: string): PublicationHost | undefined {
  const p = join(root, DECLARATION_FILENAME);
  if (!existsSync(p)) return undefined;
  try {
    const raw = JSON.parse(readFileSync(p, "utf-8")) as { publication?: { host?: unknown } };
    const host = raw.publication?.host;
    return PUBLICATION_HOSTS.includes(host as PublicationHost)
      ? (host as PublicationHost)
      : undefined;
  } catch {
    // Unreadable is "has not said", not an error to throw at a caller whose
    // question was only "where does this publish". `readDeclaration` throws
    // for the callers that need a valid declaration.
    return undefined;
  }
}

/**
 * The one conflict decidable from `publication.host` and `readme.linkStyle`
 * together, or `undefined` when there is none.
 *
 * Two facts in two files — the host in `harness.json`, the link style in
 * `harness.config.json` — can now disagree, and that is the cost of making
 * the host its own axis rather than overloading `linkStyle`. This is the
 * check that pays it.
 *
 * **Exactly one rule, and it is an entailment.** `linkStyle: "pages"` writes
 * every published-artefact link under `pagesBaseUrl`, i.e. against a GitHub
 * Pages site. A deployment that declares any other host is saying that site
 * is not where it publishes, so those links point at nothing.
 *
 * **`raw` is deliberately NOT ruled on.** It resolves through
 * `raw.githubusercontent.com` and therefore depends on the FORGE and on
 * repository VISIBILITY — and measured 2026-09-19, this schema declares
 * neither. A rule needing a fact the harness does not have would be a guess
 * wearing a gate's authority, which is the trap
 * `do-not-encode-a-rule-against-a-working-setup` records. When visibility
 * becomes declarable, revisit; until then this returns nothing for `raw`,
 * which is "could not determine", not "fine".
 */
export function publicationLinkStyleConflict(
  host: PublicationHost | undefined,
  linkStyle: string | undefined,
): string | undefined {
  if (host === undefined || linkStyle !== "pages") return undefined;
  if (host === "github-pages") return undefined;
  return (
    `harness.json declares \`publication.host: "${host}"\`, but ` +
    `harness.config.json sets \`readme.linkStyle: "pages"\`, which writes every ` +
    `published-artefact link against a GitHub Pages site this deployment says ` +
    `it does not publish to. Set \`linkStyle\` to \`blob\`, or correct the host.`
  );
}

/**
 * The media type each rendering extension declares, longest extension first.
 *
 * The companion to `renderingPath`: that says WHERE an artefact is, this says
 * WHAT it is. Both were prose in `skills/folio-core/serving-renderings.md` and
 * only one of them was code, so every consumer that served a rendering had to
 * re-derive the type — and `grep` for `ld+json` across this repository's
 * TypeScript returned **nothing** before this existed (measured 2026-09-19).
 *
 * **Order is load-bearing, and it is the whole reason a table is needed.**
 * `.schema.json` must be tried before `.json`, because the second is a suffix
 * of the first.
 *
 * That single row is the entire gap against an ordinary static server, and it
 * is narrower than it is tempting to claim. Measured the same day, both
 * Python's `mimetypes` and `Bun.file().type` already resolve `.jsonld` to
 * `application/ld+json` correctly — so "a general-purpose server cannot serve
 * a rendering" is FALSE and must not be written down as a rule. What no OS
 * table carries is the compound extension: `.schema.json` infers as
 * `application/json`, which parses but loses that the document is a schema.
 */
export const RENDERING_MEDIA_TYPES: readonly (readonly [string, string])[] = [
  [".schema.json", "application/schema+json"],
  [".jsonld", "application/ld+json"],
  [".json", "application/json"],
  [".html", "text/html"],
] as const;

/**
 * The declared media type for a rendering path, or `undefined` when this is
 * not a rendering whose type the declaration fixes.
 *
 * **`undefined` is a third state and callers must keep it one.** It means
 * "this table says nothing", not "serve it as bytes": a server should fall
 * back to its own inference for an ordinary asset rather than forcing a type
 * onto a file the declaration never claimed. Same discipline as
 * `readme-sections`' `skip` and `ci-health`'s "could not check".
 */
export function renderingMediaType(path: string): string | undefined {
  const lower = path.toLowerCase();
  return RENDERING_MEDIA_TYPES.find(([ext]) => lower.endsWith(ext))?.[1];
}

// ── Reading ─────────────────────────────────────────────────────

/**
 * Read one instance's declaration.
 *
 * Returns `undefined` when the file is absent — an instance that has not been
 * migrated yet is not an error, and callers fall back to today's conventions.
 * A file that is present but malformed **throws**: a declaration nobody can
 * read leaves every consumer scanning the wrong directories, which is worse
 * than not having one.
 */
export function readDeclaration(
  instanceRoot: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): CatHarnessDeclaration | undefined {
  const p = join(instanceRoot, DECLARATION_FILENAME);
  if (!existsSync(p)) return undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const parsed = CatHarnessDeclarationSchema.safeParse(stripJsonLd(raw, registry));
  if (!parsed.success) {
    throw new Error(`${p} is not a valid CatHarness declaration: ${parsed.error.message}`);
  }
  // Kind validation is here rather than in the Zod schema because the
  // vocabulary is open: the set of valid kinds is whatever has been registered
  // by the time the declaration is read, not what existed at module load.
  for (const dir of parsed.data.directories) {
    for (const g of dir.graphs) {
      if (!registry.has(g)) {
        throw new Error(
          `${p}: directory "${dir.id}" declares unknown graph kind "${g}". ` +
            `Known kinds: ${registry.names().join(", ")}. ` +
            `A kind contributed by a dependency must be registered before the ` +
            `declaration is read.`,
        );
      }
    }
  }
  // Same reasoning one level down: an `icon` naming an image the declaration
  // does not carry renders nothing, and a missing favicon looks exactly like a
  // slow one — so it is reported rather than left to be noticed.
  if (parsed.data.icon) {
    const ids = (parsed.data.images ?? []).map((i) => i.id);
    if (!ids.includes(parsed.data.icon)) {
      throw new Error(
        `${p}: icon "${parsed.data.icon}" names no declared image. ` +
          (ids.length ? `Declared: ${ids.join(", ")}.` : `No images are declared.`),
      );
    }
  }
  const seen = new Set<string>();
  for (const i of parsed.data.images ?? []) {
    if (seen.has(i.id)) throw new Error(`${p}: image "${i.id}" is declared twice.`);
    seen.add(i.id);
  }
  // A self-contradictory topology is REFUSED rather than reported, which is
  // the one thing bean `folio-assistant-g7vb` asks for that a table of prose
  // cannot do. Refusing here, on the same path as an unregistered graph kind
  // and an icon naming no image, is deliberate: those are also declarations
  // that parse and cannot be true, and a consumer that got a valid-looking
  // object back would carry the contradiction onward.
  //
  // Safe to add because every axis is optional and absent is a third state:
  // no declaration that exists today names either side of any pair, so this
  // throws for nobody until somebody opts in. See {@link topologyConflicts}.
  const conflicts = topologyConflicts(parsed.data.topology, parsed.data.publication?.host);
  if (conflicts.length) throw new TopologyConflictError(p, conflicts);
  return parsed.data;
}

/**
 * Drop JSON-LD keywords before Zod sees the object.
 *
 * The published form carries `@context` and per-node `@id` / `@type`, which
 * are projections of `id` and `graphs` rather than extra data. Keeping them out
 * of the validated shape means the schema describes the authored object and
 * the graph projection stays derivable — the same split as
 * `schemas/jsonld.ts` draws for blocks.
 */
function stripJsonLd(raw: unknown, registry: GraphKindRegistry): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const o = { ...(raw as Record<string, unknown>) };
  delete o["@context"];
  delete o["@type"];
  delete o["@id"];
  if (Array.isArray(o.directories)) {
    o.directories = o.directories.map((d) => {
      if (typeof d !== "object" || d === null) return d;
      const e = { ...(d as Record<string, unknown>) };
      // `@type` recovers `graphs`, and handles both projected forms: a single
      // type stays a string, several become a list. A type the registry does
      // not know is DROPPED rather than guessed — recovering the wrong kind is
      // worse than recovering none, because the reader has no way to tell.
      if (e.graphs === undefined && e["@type"] !== undefined) {
        const types = Array.isArray(e["@type"]) ? e["@type"] : [e["@type"]];
        const kinds = types
          .filter((t): t is string => typeof t === "string")
          .map((t) => registry.forType(t))
          .filter((k): k is string => k !== undefined);
        if (kinds.length > 0) e.graphs = kinds;
      }
      delete e["@type"];
      if (typeof e["@id"] === "string" && e.id === undefined) e.id = (e["@id"] as string).replace(/^#/, "");
      delete e["@id"];
      return e;
    });
  }
  return o;
}

// ── Inheritance ─────────────────────────────────────────────────

/** A directory after inheritance, with the instance that declared it. */
export interface ResolvedDirectory extends ContentDirectory {
  /** Name of the instance whose declaration contributed this entry. */
  declaredBy: string;
  /** Absolute path, resolved against the instance that declared it. */
  absPath: string;
  /** True when the declaring instance is the root rather than a dependency. */
  own: boolean;
}

/**
 * Resolve the directories an instance scans, including inherited ones.
 *
 * `chain` runs deepest dependency first and the root last, so a root
 * redeclaring an inherited id wins. Callers usually get this from
 * `flattenDependencies(resolveDependencyTree(root))` plus the root itself;
 * it is taken as a parameter rather than walked here so this module does not
 * depend on the dependency resolver, and so tests can state a chain directly.
 */
export function resolveDirectories(
  chain: Array<{ name: string; root: string; own?: boolean }>,
  registry: GraphKindRegistry = defaultGraphKinds,
): ResolvedDirectory[] {
  const byId = new Map<string, ResolvedDirectory>();

  // The outermost link: the conventional set, for the root of the chain.
  //
  // Existence-filtered — see DEFAULT_DIRECTORIES on why a default that is not
  // there is the `dh4f` defect rather than a harmless extra. `declaredBy` says
  // `(default)` so a consumer can tell an inherited convention from something
  // an instance chose, and `own` is false: a default is not the instance's own
  // declaration, it is what it did not have to write.
  const rootLink = chain.find((l) => l.own === true) ?? chain[chain.length - 1];
  if (rootLink) {
    for (const dir of DEFAULT_DIRECTORIES) {
      const absPath = resolve(rootLink.root, dir.path);
      if (!existsSync(absPath)) continue;
      byId.set(dir.id, { ...dir, declaredBy: "(default)", absPath, own: false });
    }
  }

  for (const link of chain) {
    const decl = readDeclaration(link.root, registry);
    if (!decl) continue;
    for (const dir of decl.directories) {
      // A REPOSITORY-scoped entry is not inherited. `beans/` and `todos/` are
      // this repository's work plan and this person's outstanding items; a
      // dependency's repository is a different checkout, so inheriting its
      // entry would point every consumer at somebody else's store. The
      // never-overlaid property of those two directories was a rule an agent
      // had to remember until this line; now the resolver holds it.
      if (dir.scope === "repository" && link.own !== true) continue;
      // Override by id, replacing in place so the inherited ORDER is kept: a
      // relocation should not reshuffle what a consumer scans first.
      byId.set(dir.id, {
        ...dir,
        declaredBy: decl.name,
        absPath: resolve(rootForScope(link.root, dir.scope), dir.path),
        own: link.own === true,
      });
    }
    }

  return [...byId.values()];
}

/**
 * The graph kind that holds skills, workflows and roles.
 *
 * Named once because two different resolvers ask for it, and a second spelling
 * is how one of them goes missing when the layout moves.
 */
/**
 * The role an instance's agent-instruction file declares.
 *
 * One constant because the declaration writes it and every checker reads it,
 * and a role spelled twice is a role one side stops finding.
 */
export const AGENT_INSTRUCTIONS_ROLE = "agent-instructions";

/** The role an instance's reader-facing README declares. */
export const INSTANCE_README_ROLE = "instance-readme";

/**
 * Where a declared asset of this role actually is, or `undefined` if the
 * instance declares none.
 *
 * The point of asking rather than composing `join(root, "README.md")`: an
 * asset carries a {@link DeclarationScope}, and this instance's README and
 * `AGENTS.md` are the REPOSITORY's — one of each per checkout, however many
 * instances it holds. `readme:sync` and `readme:audit` composed the path and
 * so looked inside the instance, where `readme:sync:check` reported "No
 * README" and failed the gate on a file that was one directory up.
 *
 * Existence is NOT filtered here, for the same reason {@link declaredAssets}
 * does not filter it: a declared asset that is missing is a finding, and a
 * caller that silently fell back to a composed path would turn that finding
 * into a different file being checked.
 *
 * The first declared entry when a role has several — the same rule as
 * `assetsForRole`, which callers wanting all of them should use instead.
 */
export function declaredAssetPath(
  root: string,
  role: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): string | undefined {
  return declaredAssets(root, registry).find((a) => a.role === role)?.absPath;
}

/**
 * This instance's declared assets, resolved to absolute paths.
 *
 * Existence is reported rather than filtered, unlike the directory defaults:
 * a declared asset that is missing is a FINDING — somebody said this file is
 * ours and it is not there — whereas a conventional directory that is absent
 * is simply a convention this instance did not take up. Silently dropping the
 * first would reproduce `dh4f` in the one place the declaration is an
 * assertion rather than a guess.
 */
export function declaredAssets(
  root: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): Array<KgAsset & { absPath: string; exists: boolean }> {
  const decl = readDeclaration(root, registry);
  return (decl?.assets ?? []).map((a) => {
    const absPath = resolve(rootForScope(root, a.scope), a.src);
    return { ...a, absPath, exists: existsSync(absPath) };
  });
}

export const KG_GRAPH_KIND = "cat-harness";

/**
 * Does this directory hold ONLY the knowledge graph?
 *
 * **Exactly `cat-harness`, not merely including it.** `schemas/` declares
 * `["schemas", "cat-harness"]` — a schema IS a knowledge-graph node, which is
 * why it carries the kind at all — but its `.md` files are READMEs and its
 * nodes are `.ts`. Measured 2026-09-19: including it added `schemas/README.md`
 * and `schemas/block-qa-schema/README.md` to the skill set, giving 150 where
 * the corpus has 149.
 *
 * Requiring YAML front matter instead would have been the principled rule and
 * is measurably wrong here — only 117 of 147 skill bodies carry any, so it
 * would have dropped 30 real skills. A directory holding one kind can be
 * scanned for it; one holding several has to say which file is which.
 */
export function isKgOnlyDirectory(d: ContentDirectory): boolean {
  return d.graphs.length === 1 && d.graphs[0] === KG_GRAPH_KIND;
}

/**
 * One instance's OWN declared directories — no inheritance, no override.
 *
 * ## Why this is not {@link resolveDirectories}
 *
 * `resolveDirectories` answers *"which directory does id X mean for this
 * instance"*, and it answers it **once**: entries override by id, so when a
 * dependency and the root both declare `cat-harness`, the root replaces the
 * dependency's entry and one path comes back. That is correct for its question
 * and is the documented rule — overrides match on `id`, never on `path`.
 *
 * **Overlay is the opposite question.** Loading skills needs EVERY instance's
 * contribution, in order, because a dependency's skills and the root's are both
 * real and the root's merely win *per skill name*. Collapsing them by id
 * discards the dependency entirely.
 *
 * That mismatch is why {@link resolveDirectories} could not be the primitive
 * here, and why the overlay resolver that predates this hardcoded
 * `join(root, "skills")` instead — it needed per-instance paths and reached for
 * a literal to get them. A literal is how a skill goes missing the moment the
 * layout moves; this reads the instance's own declaration instead.
 *
 * ## An undeclared instance still gets the conventions
 *
 * `AGENTS.md`: *"Absent declaration is fine — an unmigrated instance falls
 * back to today's conventions."* So a dependency with a `skills/` directory
 * and no `harness.json` resolves through {@link DEFAULT_DIRECTORIES}, which is
 * where that convention is written down once.
 *
 * **This was a regression before it was a feature.** The first version of this
 * function returned `[]` for an undeclared instance, which silently dropped
 * every unmigrated dependency's skills — caught by
 * `harness-config.test.ts`'s existing overlay test, whose fixture declares
 * nothing. Reading a declaration is the improvement; requiring one would have
 * been a breaking change wearing its clothes.
 *
 * Defaults are existence-filtered, for the same reason `resolveDirectories`
 * filters them: a default that is not there is the `dh4f` defect, where a
 * consumer scans nothing and reports a clean run over it. `declaredBy` says
 * `(default)` so a caller can tell a convention from a choice.
 */
export function ownDirectories(
  link: { name: string; root: string; own?: boolean },
  registry: GraphKindRegistry = defaultGraphKinds,
): ResolvedDirectory[] {
  const decl = readDeclaration(link.root, registry);
  if (!decl) {
    return DEFAULT_DIRECTORIES.map((dir) => ({
      ...dir,
      declaredBy: "(default)",
      absPath: resolve(link.root, dir.path),
      own: false,
    })).filter((d) => existsSync(d.absPath));
  }
  return decl.directories.map((dir) => ({
    ...dir,
    declaredBy: decl.name,
    absPath: resolve(link.root, dir.path),
    own: link.own === true,
  }));
}

// ── Materialisation ─────────────────────────────────────────────

/**
 * What the keep-marker in a materialised directory says.
 *
 * It is a `.gitignore` because that is the one filename whose presence in an
 * otherwise-empty directory is unremarkable, and it **ignores nothing**. The
 * comment is the payload: git tracks files rather than directories, so a
 * declared-but-empty directory vanishes from the next clone without a file in
 * it, and the next person deletes it as debris.
 *
 * Deliberately no `*` / `!.gitignore` pair. Ignoring the contents of
 * `uploads/` would reproduce the defect the two-stage pipeline exists to
 * prevent — a source on disk that every consumer reads as absent — and
 * `library/` is L1 corpus that MUST be committed and greppable. What a folio
 * chooses to ignore is the folio's policy; this file only keeps the directory
 * alive, and is never overwritten once it exists.
 */
export function keepMarker(dir: Pick<ContentDirectory, "id" | "description">): string {
  const what = dir.description?.trim();
  return [
    "# do not delete me",
    "#",
    "# Git tracks files, not directories, so this directory would vanish from",
    "# the next clone without a file in it. This is that file. It ignores",
    "# nothing on purpose — see `keepMarker` in schemas/cat-harness.ts.",
    "#",
    `# ${dir.id}/`,
    ...(what ? wrapComment(what) : []),
    "",
  ].join("\n");
}

/** Wrap a description into `# `-prefixed lines at 76 columns. */
function wrapComment(text: string, width = 74): string[] {
  const words = text.replace(/\s+/g, " ").split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > width) {
      lines.push(`# ${line}`);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(`# ${line}`);
  return lines;
}

/** One directory's outcome from {@link materialiseDirectories}. */
export interface MaterialisedDirectory {
  id: string;
  /**
   * Path the directory was (or would be) created at — inside the instance, or
   * at the repository root for a `repository`-scoped entry.
   */
  absPath: string;
  /** The DECLARED path, as written. Reported so a caller need not recover it
   * from `absPath` — `relative(instanceRoot, absPath)` gives `../beans` for a
   * repository-scoped entry, which is a traversal rather than a name. */
  path: string;
  /** Which root `path` was resolved against; absent means the instance's. */
  scope?: DeclarationScope;
  /** The instance whose declaration contributed the entry — may be a dependency. */
  declaredBy: string;
  /** True when this call created the directory; false when it already existed. */
  created: boolean;
  /** True when this call wrote the keep-marker; false when one was already there. */
  markerWritten: boolean;
}

/**
 * Create every declared directory that does not exist yet, in the instance
 * being set up.
 *
 * WHY THIS EXISTS, and why it must land in the same change as any new
 * declaration: `AGENTS.md` says "declare only what exists — a declared-but-
 * absent directory is the bean `dh4f` defect, where a consumer scans nothing
 * and reports a clean run over it". Absent and empty are indistinguishable to
 * a consumer, so declaring a directory you have not created converts a real
 * gap into a clean run. Materialising is what makes "empty" a DETERMINED
 * empty rather than an unanswered question — the same third-state discipline
 * the README sections and the CI-health report follow.
 *
 * PATHS RESOLVE AGAINST THE INSTANCE, NOT THE DECLARER. An instance inherits
 * its dependencies' directory conventions, so what it inherits is the
 * CONVENTION — an id and a relative path — and it needs that directory in
 * ITSELF. `ResolvedDirectory.absPath` points into the declaring checkout,
 * which for a dependency is somebody else's tree; writing there would be the
 * equivalent of creating folders inside `node_modules`.
 *
 * A path that escapes the root its SCOPE names is REFUSED rather than created,
 * the same rule `schemas/bean-graph.ts` applies to its node paths: a directory
 * outside that root is not a directory of it. A `repository`-scoped entry is
 * materialised at the repository root — `beans/` and `todos/` belong to the
 * checkout rather than to any instance in it, so creating them inside the
 * instance would give the work plan a second home and leave the real one
 * reported MISSING, which is what `harness:dirs:check` said about four
 * directories that were all sitting there.
 *
 * Idempotent. Running it twice creates nothing and overwrites nothing — an
 * existing keep-marker is left exactly as it is, because a folio may have
 * added real ignore rules to it. A directory that already holds files gets no
 * marker: it is not at risk of vanishing, so a file explaining that it might
 * would be both redundant and wrong.
 */
export function materialiseDirectories(
  dirs: ResolvedDirectory[],
  instanceRoot: string,
  opts: { dryRun?: boolean } = {},
): MaterialisedDirectory[] {
  const rootAbs = resolve(instanceRoot);
  const out: MaterialisedDirectory[] = [];
  for (const dir of dirs) {
    const base = rootForScope(rootAbs, dir.scope);
    const abs = resolve(base, dir.path);
    const rel = relative(base, abs);
    if (rel.startsWith("..") || isAbsolute(rel)) {
      const where = dir.scope === "repository" ? "repository" : "instance";
      throw new Error(
        `declared directory "${dir.id}" resolves outside the ${where} ` +
          `(${dir.path} -> ${abs}); a directory outside the ${where} is not a directory of it`,
      );
    }
    const existed = existsSync(abs);
    const markerPath = join(abs, ".gitignore");
    const markerExisted = existed && existsSync(markerPath);
    // The marker earns its place ONLY in a directory that would otherwise be
    // empty — that is the whole failure it addresses. Writing one into a
    // directory that already holds files (this instance's `skills/` holds
    // hundreds) adds a file nobody asked for and says something untrue about
    // why it is there.
    const needsMarker =
      !markerExisted && (!existed || readdirSync(abs).length === 0);
    if (!opts.dryRun) {
      if (!existed) mkdirSync(abs, { recursive: true });
      if (needsMarker) writeFileSync(markerPath, keepMarker(dir), "utf-8");
    }
    out.push({
      id: dir.id,
      path: dir.path,
      ...(dir.scope ? { scope: dir.scope } : {}),
      absPath: abs,
      declaredBy: dir.declaredBy,
      created: !existed,
      markerWritten: needsMarker,
    });
  }
  return out;
}

/** The resolved directories holding renderable (website) graphs. */
export function renderableDirectories(
  dirs: ResolvedDirectory[],
  registry: GraphKindRegistry = defaultGraphKinds,
): ResolvedDirectory[] {
  // Renderable if ANY declared graph is: a directory holding a folio plus
  // something else still renders.
  return dirs.filter((d) => d.graphs.some((g) => isRenderable(g, registry)));
}

/**
 * The absolute path of the directory holding a given graph, read from the
 * instance's declaration.
 *
 * ## The literal this exists to replace
 *
 * `check:declared-paths` found **114** places where a directory
 * `harness.json` already declares is written out in code instead —
 * `join(root, "skills")`, `join(root, "translations", loc)`,
 * `join(root, "uploads")`. Every one of them is a place a topical or
 * relocated layout breaks silently, which is the whole defect the
 * declaration exists to remove.
 *
 * `resolveDirectories` already answered this; what was missing was a call
 * short enough that nobody reaches for the literal instead. One line, one
 * argument, and the caller does not have to build a chain.
 *
 * ## Three states, and the third is why this returns `undefined`
 *
 * A graph the instance does not declare is NOT the same as one declared at
 * the conventional path. `DEFAULT_DIRECTORIES` is existence-filtered, so an
 * instance with no `uploads/` genuinely has no `uploads` graph — and
 * defaulting here would hand a caller a path to a directory that is not
 * there, which is precisely the `dh4f` defect (a consumer scans nothing and
 * reports a clean run over it). Callers that legitimately want the
 * convention as a fallback say so at their own call site, where the choice
 * is visible.
 *
 * Returns the FIRST declaration carrying the graph. A graph declared by two
 * directories is legal — `cat-harness` is, by `schemas/` and `skills/` — so a
 * caller wanting all of them resolves the list itself; this is the accessor
 * for the single-home case, which is every other graph kind here.
 */
export function directoryForGraph(
  root: string,
  graph: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): string | undefined {
  return resolveDirectories([{ name: "(local)", root, own: true }], registry).find((d) =>
    d.graphs.includes(graph as GraphKind),
  )?.absPath;
}

// ── Graph projection ────────────────────────────────────────────

/**
 * Project a declaration to its JSON-LD form — the "very simple graph schema
 * instance" the directories are meant to be.
 *
 * Kept as a function rather than as the stored form so there is one authored
 * shape and one derived shape, not two truths.
 */
export function toJsonLd(
  decl: CatHarnessDeclaration,
  registry: GraphKindRegistry = defaultGraphKinds,
): Record<string, unknown> {
  return {
    "@context": { ...NS_PREFIXES, path: termIri("path"), directories: termIri("scans") },
    "@type": termIri("Harness"),
    name: decl.name,
    ...(decl.title ? { title: decl.title } : {}),
    ...(decl.description ? { description: decl.description } : {}),
    ...(decl.icon ? { icon: { "@id": `#${decl.icon}` } } : {}),
    ...(decl.images?.length
      ? {
          images: decl.images.map((i) => ({
            "@id": `#${i.id}`,
            "@type": termIri("Image"),
            src: i.src,
            ...(i.role ? { role: i.role } : {}),
            ...(i.title ? { title: i.title } : {}),
            ...(i.description ? { description: i.description } : {}),
          })),
        }
      : {}),
    directories: decl.directories.map((d) => {
      const types = d.graphs.map((g) => registry.get(g)?.type ?? termIri("UnknownGraph"));
      return {
        "@id": `#${d.id}`,
        // One type stays a string, several become a list — JSON-LD permits
        // both, and emitting a one-element array for the common case would
        // make every existing published form look changed.
        "@type": types.length === 1 ? types[0] : types,
        path: d.path,
        ...(d.title ? { title: d.title } : {}),
        ...(d.description ? { description: d.description } : {}),
      };
    }),
  };
}
