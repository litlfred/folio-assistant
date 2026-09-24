/**
 * The graph-kind registry — **a leaf, and that is its whole job**.
 *
 * A graph kind says what a declared directory holds: whether it `renderable`,
 * and which layer it `holds`. The kinds themselves, the registry they live in,
 * and the shared instance every reader consults are all here.
 *
 * ## Why this is its own module
 *
 * It was inside `schemas/cat-harness.ts`, and that made ONE import impossible:
 * `folio-graph-kind.ts` — core's registration of the only renderable kind —
 * imported `cat-harness.ts` for `defaultGraphKinds`, so `cat-harness.ts` could
 * not import it back to trigger the registration. A cycle.
 *
 * The cost of that cycle was paid by every caller instead. Whether
 * `readDeclaration` accepted this repository's own declaration depended on
 * whether the process had happened to import core's module — **an import-order
 * property of the process, not a property of the declaration**, which is valid
 * either way. PR #465 hit it five times in a row, enumerated **52 modules**
 * calling a declaration reader without the import, put four options to the
 * owner and merged with the item unchecked. Bean `q2wn` re-opened it by
 * measuring that the partition's own regex could not see a bare side-effect
 * import, so all 25 of those edges were invisible to the one tool that
 * computes this repository's module graph.
 *
 * With the registry on a leaf, `folio-graph-kind.ts` imports only this file —
 * **core importing the harness, the allowed direction** — and `cat-harness.ts`
 * triggers the registration itself. So the kind is registered by the time
 * anything can call a reader, because you cannot reach a reader without
 * loading `cat-harness.ts`. The failure stops being a thing callers must
 * remember and becomes **structurally impossible**.
 *
 * ## What did NOT change, deliberately
 *
 * Core still OWNS `folio`. The definition, its `renderable: true` and the
 * argument for both stay in `schemas/folio-graph-kind.ts`, and a bare harness
 * registry still does not know the kind — `cat-harness.test.ts` asserts that
 * and still passes, because it seeds its own registry. This moves WHERE THE
 * MECHANISM LIVES, not who owns the kind; option 2 on #465 (adding `folio` to
 * `BASE_GRAPH_KINDS`) is the one that would have overturned the boundary, and
 * `GraphKindDef.renderable` carries the reason it must not: *"a layer that
 * cannot render must not own the renderable kind."*
 *
 * @module schemas/graph-kind-registry
 * @graphNode schema
 */
import { termIri } from "./namespaces";


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
/**
 * What a running process does with a graph of this kind.
 *
 * **One question settles it: does a running process WRITE it, READ it, or is it
 * the SUBJECT?**
 *
 * - `content` — the subject. A process may PRODUCE it, and that is usually the
 *   point of the process.
 * - `context` — **static state.** A record about content that a process reads
 *   and never writes. Fixed for the duration of an instance. It changes only
 *   when a human directs an authoring act, outside any process.
 * - `state` — **live state.** A record the process itself writes as it runs. A
 *   bean's status changes because a step completed.
 * - `derived` — produced FROM a source, and regenerated rather than
 *   re-authored. It stands on its own the way `content` does, but a finding
 *   against it is a finding against its GENERATOR.
 *
 * Four values, and **no "could not determine"** — which is a departure from
 * this repo's usual three-state rule for a reason worth stating: a third state is right when a CHECK looked and could not tell, and
 * wrong when an AUTHOR is registering a kind they are defining. Whoever adds a
 * kind knows what a process does with it; letting them decline to say would put
 * the burden on every consumer instead, which is the position the axis exists
 * to end.
 *
 * ## Two of the four arrived by being needed, not by being symmetrical
 *
 * This axis shipped with TWO values and has twice been widened by a case that
 * neither side described. That is the pattern to expect when adding a kind:
 * the value you need may not exist yet, and inventing a fifth is legitimate —
 * but only after the existing four have each been ruled out by a RULE rather
 * than by taste. `derived` was ruled in exactly that way (see
 * `isDerivedGraph`): `context` was refused because a declared process writes
 * `library/` and `context` makes that a defect; `content` was refused because
 * the QA sweep runs *"only on active/working content"*.
 *
 * The axis shipped with two values and the owner refined it the same day,
 * settling bean `mhh9`: *"put memory under state/context as static, during a
 * process. it does not change. agents dont work on it (except when an authoring
 * agent is directed by human). todos, beans are not static."*
 *
 * That is not a subdivision for tidiness. `content` and `state` alone forced
 * two unlike things together: a bean, which a step rewrites, and a memory
 * entry, which no step may touch. A consumer told only "this is state" cannot
 * tell whether writing to it is normal or a bug.
 *
 * See `skills/folio-core/content-context-and-state-graphs.md`.
 */
export type GraphLayer = "content" | "context" | "state" | "derived";

/** What a declared directory's graph kind means. */
/**
 * Where ONE `$schema` family of a graph kind is defined. Bean `rdkm`.
 *
 * Three forms, because the corpus has all three and collapsing them would
 * make two of them lie:
 *
 * | form | means | example |
 * |---|---|---|
 * | `validator` | a Zod schema, `module#Export` — runnable | `kg-qa/v1` → `KgQaReportSchema` |
 * | `shape` | a TypeScript type, `module#Name` — readable, NOT runnable | `qa-witness/v1` → `QaWitness` |
 * | `writtenBy` | no declared type at all; the module that writes it — or, for an authored file, the one that consumes it | `folio-qa-index/v1` |
 * | `external` | a specification nobody here types; the node conforms to it | a JSON Schema document, `https://json-schema.org/draft/2020-12/schema` |
 *
 * `writtenBy` is a finding recorded as data rather than a gap hidden by
 * omission: the family exists on disk and nothing types it. `external` is
 * not a gap — the shape is somebody else's, and it is named rather than
 * restated.
 */
export type NodeSchemaRef =
  | { validator: string; shape?: never; writtenBy?: never; external?: never }
  | { shape: string; validator?: never; writtenBy?: never; external?: never }
  | { writtenBy: string; validator?: never; shape?: never; external?: never }
  | { external: string; validator?: never; shape?: never; writtenBy?: never };

/**
 * @general — a node others depend on: it points only at other general nodes,
 * never at its dependents (data-modelling step 8; checked by `arrow-direction`).
 */
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
  /**
   * Does a graph of this kind record WORK — something somebody is partway
   * through, that an arriving agent could pick up?
   *
   * The question the owner asked for, 2026-09-20:
   *
   * > tell them to determine if active KG (beans/tods) or static (point to
   * > process on determining context)
   *
   * **Narrower than `holds: "state"`, and the difference was measured rather
   * than assumed.** The first attempt read "declares any state graph", which
   * made the repository root and `who-iris` ACTIVE on `uploads` alone — an
   * ingestion queue is live state and is not work anybody is partway through.
   * An agent told "this KG is active" on that basis arrives, looks for
   * something to prioritise, and finds a directory of unprocessed files.
   *
   * Only meaningful for `holds: "state"` kinds: content and context record no
   * position by definition. Optional in the type and REQUIRED by
   * `check:graph-kind-work` for every state kind, which is how a new kind
   * cannot ship undecided without the type gaining a field that is nonsense
   * for the other three layers.
   *
   * Note what this does NOT collapse. `beans` is the agent work plan and
   * `todos` is a PERSON's outstanding work — the vocabulary keeps them apart
   * deliberately and `AGENTS.md` forbids a second work plan. Both record
   * work, so both answer this question `true`; that is the point of asking
   * "records work" rather than "is the work plan".
   */
  recordsWork?: boolean;
  /**
   * Does a graph of this kind say what the instance **IS**, or where something
   * **GOT TO**?
   *
   * The second axis in this table, and the one the vocabulary was missing.
   * `renderable` answers "does this become a website"; this answers "is this
   * the subject matter, or a record about it". A consumer that needs one and
   * is handed the other has no way to tell today.
   *
   * - **`content`** — authored nodes a reader or a tool consumes as the
   *   subject matter. It is what the instance IS. It stands on its own: you
   *   can read a skill, a schema or a library section without knowing what
   *   anybody did with it.
   * - **`context`** — STATIC state. A record about content that a running
   *   process READS and never writes, fixed for the duration of an instance.
   *   It changes only when a human directs an authoring act, outside any
   *   process. A step that writes to a `context` graph is a defect.
   * - **`state`** — LIVE state. A record the process itself WRITES as it
   *   runs: a bean's status changes because a step completed, a workflow
   *   instance's token moves. It REFERENCES content and is meaningless
   *   without it.
   * - **`derived`** — produced FROM a source and REGENERATED rather than
   *   re-authored. It stands on its own the way `content` does — a `library/`
   *   section still reads — but a QA finding against it is a finding against
   *   the ingestion that made it, which is why the sweep skips it. Added
   *   2026-09-20 (bean `hqku`); see `isDerivedGraph` for why neither
   *   `content` nor `context` fitted.
   *
   * **REQUIRED, so a kind cannot go unclassified.** That is the
   * `DOCUMENT_BLOCK_KINDS` discipline — derived as the complement of
   * `MATH_BLOCK_KINDS` precisely so a new block kind cannot slip through
   * unassigned. Here the same guarantee comes from the type being required
   * rather than optional: `tsc` refuses a new kind that does not say, at the
   * keyboard rather than at CI, and an optional field would have made "did
   * not say" indistinguishable from "content".
   *
   * **The discipline is in the skill, not here** —
   * `skills/folio-core/content-context-and-state-graphs.md` carries the definition,
   * the classification of every kind with its reason, the two questions that
   * settle a hard case, and what a consumer may assume about each side. The
   * classification of `fsh-guts`, `qa`, `health` and `uploads` is the part
   * worth reading before adding a kind: none of the four is obvious from its
   * name, and each is decided by the same two questions rather than by taste.
   *
   * SETTLED, and DONE: agent memory is `context` — bean `mhh9`, decided by
   * the owner 2026-09-20 — and the 36 nodes moved to the declared `memory/`
   * graph the same day, as their own change (bean `07xs`), because relocating
   * a directory as a SIDE EFFECT of adding a classification is the shape #395
   * refused and bean `auap` did separately.
   *
   * The case is worth keeping because it proves the rule above: for the hours
   * between, `cat-harness` was correctly `content` while something inside it
   * was `context`, and both statements were true. Classifying the CONTAINING
   * kind is not a ruling on its contents.
   */
  holds: GraphLayer;
  summary: string;
  // No `skill` (#1168, B3). A kind named the skill that says how to read it —
  // the general node naming its dependent, and read by nothing. The skill
  // now names the kinds it reads, in its front matter (`graph-kinds:`), and
  // `kg:audit` resolves each against this registry (`skill-graph-kinds-resolve`).
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
   * `<cat-harness.processes:decision ref="file.dmn#Decision_Id"/>` already uses in every BPMN
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
  /**
   * WHY a runtime validator does not apply to this kind — a reason, not a flag.
   *
   * ## The defect this exists to remove
   *
   * `check:kind-validators` reported *"7 kind(s) declare no validator"* and
   * carried `--require-all` "for the day the gap is meant to be closed".
   * Measured 2026-09-24 (bean `rj0n`): **that day could not come.** Every one of
   * the seven was either not JSON at all, or had no nodes:
   *
   * | kind | what it holds | why Zod cannot apply |
   * |---|---|---|
   * | `processes` | 77 `.bpmn`, 9 `.dmn` | XML |
   * | `uml` | 103 `.puml`, 101 `.mmd` | PlantUML / Mermaid, and `derived` |
   * | `methodology` | 12 `.md` | markdown |
   * | `code` | 1793 `.ts` | TypeScript |
   * | `cat-harness` | mixed `.ts` and `.json` | several node types; {@link GraphKindDef.schema} calls one pointer here "a lie of precision" |
   * | `bean-defs`, `session-state` | nothing | nested, or absent from this repository |
   *
   * So the count read as a seven-item backlog over a real backlog of **zero** —
   * `dh4f` INVERTED. That bean is could-not-determine rendered as clean; this is
   * **not-applicable rendered as a gap**, and it is the more expensive direction,
   * because a flag that can never pass is one somebody eventually deletes. The
   * rule is `check-harness-state`'s, one file over: *a check that cannot pass is
   * indistinguishable from a corpus that cannot be fixed.*
   *
   * ## It is a REASON, and the reason must name a fact
   *
   * A boolean would let a kind opt out by asserting it. The reason has to name
   * the file format or the absent subject — something a reader can check — so
   * this cannot become the polite way to launder a real gap. "We decided not to"
   * is not a reason; ".bpmn is XML" is.
   *
   * Absent means **has not said**, which is the finding `--require-all` fails on.
   * That keeps silence and a decision apart, which is the whole point: a kind
   * added tomorrow without deciding still shows up.
   *
   * **Mutually exclusive with {@link GraphKindDef.validator} and
   * {@link GraphKindDef.nodeSchemas}** — a kind cannot both have a runnable
   * schema and declare that one cannot exist. `check:kind-validators` reports
   * that contradiction rather than picking a winner.
   */
  validatorNotApplicable?: string;
  /**
   * One entry per `$schema` family a node of this kind may carry, keyed by
   * the tag. Bean `rdkm`.
   *
   * ## Why `validator` was not enough
   *
   * `validator` names ONE schema, and `qa` is the case that broke it: its
   * directory holds seven families — `kg-qa/v1`, `qa-witness/v1`,
   * `block-qa/v1`, `qa-results/v1`, `folio-qa-index/v1`, `translation-qa/v1`,
   * `folio-test-run/v1`, counted 2026-09-23 — and a single pointer would have
   * named one of them and said nothing true about the other six. A file
   * already says which family it is (the `$schema` tag), so the tag is the key.
   *
   * ## A kind that declares this claims to be COMPLETE
   *
   * `check:kind-validators` reads every JSON node in the kind's declared
   * directories and fails on a tag with no entry here. Declaring the map is
   * the claim that it names every family; a family that appears later is a
   * finding, not something to skip.
   *
   * When both are set, `nodeSchemas` wins for a node whose tag it names, and
   * `validator` stays the answer for the kind as a whole.
   */
  nodeSchemas?: Readonly<Record<string, NodeSchemaRef>>;
  /**
   * The NESTED DECLARATION a directory of this kind carries, by filename.
   *
   * A graph directory may declare its own inner structure one level down:
   * `beans/beans.json` says the `beans` graph holds `bean-defs` and
   * `workflow-state`, so the root `harness.json` does not restate them. One
   * fact, one place, at each level.
   *
   * ## Why the KIND names the file, and not the directory
   *
   * `declaredKinds` computed it as `${basename(path)}.json` — a filename
   * derived from wherever the directory happened to sit. `bean-graph.ts`
   * states the opposite rule, and states it as a design property: *moving
   * `beans/` to `work/` requires editing nothing inside it.* Both were true
   * of today's layout and they disagree the moment anybody relocates:
   * the walker looks for `work/work.json`, the file is still `work/beans.json`,
   * and the nested kinds vanish from `declared` with nothing said. A silent
   * under-count, which manufactures an `undeclared` finding somewhere else.
   *
   * The owner settled the general rule on 2026-09-20 — **each type declares
   * its own filename** — and this is that rule at the graph-kind level. The
   * kind knows what its declaration is called; a directory name is a
   * filesystem accident.
   *
   * Absent means the kind has no nested declaration, and `declaredKinds`
   * falls back to the directory-name convention plus `graph.json` so an
   * unmigrated graph keeps working.
   */
  declarationFile?: string;
  /**
   * The kind this one is a SUB-GRAPH of, when it is one.
   *
   * Owner, 2026-09-23 (issue #1164): proposals live in *"a docs/proposals/
   * sub-graph declared sub-sub-graph (which starts closed in navbar, general
   * behavior)"*. GENERAL is the operative word: this is not a special case for
   * proposals, it is a relation any kind may declare, and every surface that
   * lists kinds draws a kind with `within` INSIDE its parent's row, folded
   * shut until the reader opens it. `check:graph-kind-within` holds the
   * relation to a registered kind and forbids a cycle.
   *
   * A relation between KINDS, not directories: the navbar lists graphs by
   * kind, and a directory nested on disk is not thereby a sub-graph (the
   * `beans/workflow/` history above is exactly that confusion).
   */
  within?: string;
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
    // A Tool node is an authored definition of a mechanism. It says what this
    // instance CAN DO, not what anybody did.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/tool.ts#ToolDefinitionSchema",
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
    // `KGraph` since 2026-09-21, on the owner's naming: Knowledge Graph is
    // KGraph throughout. This is the EMITTED IRI, so the rename moves the
    // identity a downstream declaration resolves through — `kg` and
    // `cat-harness` are two spellings of this one term, and the IRI is what
    // tells them apart from a third. The namespace is unchanged
    // (`…/cat-harness/ns#`); only the local name moves.
    type: termIri("KGraph"),
    renderable: false,
    // Skills, workflows, roles, requirements — the authored instruction bodies
    // and the diagrams they are named from. See the note on `holds`:
    // classifying the container was never a ruling on its contents — for a
    // few hours on 2026-09-20 it held `memory` nodes, which are `context`
    // (beans `mhh9`, `07xs`).
    holds: "content",
    validatorNotApplicable:
      "it holds several node kinds typed in different places — skills, workflows, roles, actors. `schema` above " +
      "already says why one pointer here would be a lie of precision, and that applies to a validator with more " +
      "force: a runnable one would silently grade 51 JSON files against whichever single shape it named. Each " +
      "family is validated where it is declared.",
    summary: "A Subgraph holding a Harness's own parts, such as Skills, Processes and Roles, where one directory holds more than one of them.",
  },
  // ── THE THREE KINDS SPLIT OUT OF `cat-harness`, 2026-09-21 ─────────────
  //
  // One kind was declared by 22 directories and held FOUR branches of the
  // taxonomy at once — Skills, Workflows, Scenarios and methodologies — so a
  // consumer filtering on kind could not tell them apart. "Give me the
  // Workflows" was not a query anybody could write; it could only be
  // approximated by matching a path, which is exactly the fragility the graph
  // exists to remove. Owner's decision, 2026-09-21, after the census was put
  // to them.
  //
  // ## `cat-harness` SURVIVES, and is not deprecated
  //
  // An alias cannot express a split: `GRAPH_KIND_ALIASES` maps one name to one
  // name, and `cat-harness` would have to become four. It also had a FIFTH job
  // the split does not name — on a directory declaring `["schemas",
  // "cat-harness"]` it means "a schema IS a knowledge-graph node", which is
  // why `isKgOnlyDirectory` tests for the kind EXACTLY rather than for its
  // presence. That job is still real, so the umbrella stays and now means what
  // it always meant on those entries: harness knowledge-graph content whose
  // directory holds more than one part of it.
  //
  // A downstream declaration still saying `["cat-harness"]` therefore keeps
  // parsing. What it loses is the finer query, which is the thing it never had.
  skills: {
    type: termIri("SkillGraph"),
    renderable: false,
    // A Skill is a Capability with defined inputs and outputs — an authored
    // instruction body. It states what can be done, never what was done.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-voice/v1": { validator: "schemas/voices.ts#VoiceProfileSchema" },
      "folio-voice-skill/v1": { validator: "schemas/voice-skill.ts#VoiceSkillSchema" },
      "kg-qa-manifest/v1": { validator: "schemas/kg-qa.ts#KgQaManifestSchema" },
      // A synced remote skill's pinned, per-file fixity record (issue #556).
      "folio-remote-skill/v1": { validator: "schemas/skill-package.ts#RemoteSkillRecordSchema" },
    },
    summary: "Skill packages — the authored instruction bodies an Actor performs a Task from.",
  },
  processes: {
    type: termIri("ProcessGraph"),
    renderable: false,
    // The BPMN and DMN are the source of truth and are READ to run a process;
    // where a running instance GOT TO is `workflow-state`, which is `state`.
    // Two questions, two graphs — see the `workflow-state` skill for why one
    // answer rather than two is the whole point.
    holds: "content",
    // BPMN's shape is an XSD, not a Zod schema, so there is no validator;
    // the pinned edition and its operative terms are the external-schema record.
    schema: "external-schemas/omg-bpmn-2.0.json",
    validatorNotApplicable:
      "its nodes are `.bpmn` and `.dmn` — XML, counted 2026-09-24 as 77 and 9. A Zod schema parses JSON, so one " +
      "here would be a category error; `check:workflows`, `xml-comment-check` and `check-process-documentation` " +
      "grade them instead.",
    summary: "Executable BPMN processes and the DMN tables their gateways compute from.",
  },
  scenarios: {
    type: termIri("ScenarioGraph"),
    renderable: false,
    // Actors, the Roles they take, and the User Stories those Roles serve.
    //
    // `roles.json` and `stories.json`. A User Story points at its Role
    // (#1168); it was `Role.useCases`, free text on the role, until then —
    // the gap this kind was named ahead of, so that fixing it needed no rename.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/role-graph.ts#RoleGraphSchema",
    summary: "Actors, the Roles they take on, and the User Stories those Roles serve.",
  },
  // ── What an Actor may do: W3C ODRL 2.2 policies — issue #1180 ──────────
  //
  // Owner, 2026-09-23: permissions are *"W3C ODRL 2.2"*, and policies are
  // their own graph kind rather than a file inside `scenarios`. A policy is
  // authored, and is true whether or not anything reads it, so it `holds`
  // content like the role graph beside it: it owes no viewer.
  policies: {
    type: termIri("PolicyGraph"),
    renderable: false,
    holds: "content",
    schema: "schemas/odrl.ts",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "schemas/odrl.ts#OdrlPolicySchema",
    summary:
      "W3C ODRL 2.2 policies: which Actor may do which action, scoped by Process, Task and Role " +
      "constraints. Actions are the folio profile in skills/permissions/permissions.json.",
  },
  // ── Judgement methodologies, one sub-graph each ───────────────────────
  //
  // A methodology is a NAMED, EXTERNAL way of reaching a judgement — Kepner-Tregoe
  // for a decision, MADR for its record, DMN for the computable case, GRADE for
  // certainty of evidence. They are **parallel, not composable**: which one applies
  // is contextual, and blending them produces a house method that cites nobody.
  //
  // ## Why its own kind rather than skills
  //
  // Three properties a skill does not have:
  //
  // 1. **Extractable.** A methodology is somebody else's work, adopted. If the
  //    field moves on, or an instance needs a different one, the directory lifts
  //    out and its declaration goes with it. A skill that had inlined the method
  //    could not be lifted — it would have to be rewritten.
  // 2. **Referenced, never inlined.** A skill names the methodology it follows;
  //    the method's own text lives here once. Two skills quoting the same method
  //    is two copies free to drift, which is the duplicate `directory-conventions`
  //    calls unchecked.
  // 3. **Not subject to skill criteria.** `skill-is-brief` caps a skill near 280
  //    lines because a skill is an instruction. A methodology is a FAITHFUL
  //    RENDERING of an external standard, and truncating it to fit a house limit
  //    would misrepresent the standard.
  //
  // Any layer may declare a directory of this kind: the harness carries the
  // domain-neutral ones, `smart-base` carries DIIG and core carries
  // Doc-Researcher. GRADE is not a methodology node: since 2026-09-24 (bean
  // `wg7r`) it is the `grade` skill with its vocabularies as code lists.
  methodology: {
    type: termIri("MethodologyGraph"),
    renderable: false,
    // `context`, by the axis's own criterion and not by resemblance: read
    // during a process, never written by one. A methodology here is somebody
    // else's standard ADOPTED — Kepner-Tregoe, MADR, DMN, GRADE — so a step
    // that decided to amend one would be rewriting the standard rather than
    // recording anything, and the ingestion that brings a new one in is a
    // human-directed act (`methodology-adoption`), exactly as relocating
    // something into `fsh-guts` is.
    //
    // NOT `content`, though the files are prose a reader can follow: what
    // makes `content` is being the folio's SUBJECT MATTER, and a methodology is
    // how a decision about the subject gets made. `renderable: false` above
    // follows from the same fact — nothing here is published as a page.
    holds: "context",
    validatorNotApplicable:
      "its nodes are markdown — 12 files, counted 2026-09-24. `check-methodology-evidence` grades what matters " +
      "about them, which is whether each cited source actually exists in a library.",
    summary:
      "Judgement methodologies, adopted whole and kept independent — parallel ways to reach a decision, selected by context.",
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
    // THE FROM-WITHIN NODE (issue #1164; the owner's #980 ruling: nesting is
    // allowed when "a (Sub?)KGraph node within the first subdir labels all the
    // other ones that exist within it"). `docs/docs.json` names the sub-graphs
    // `docs/` holds — `proposals/`, `requirements/` — the way `beans/beans.json`
    // names `defs/` and `workflows/`. A root declaration reaching down into
    // `docs/proposals/` is the forbidden shape `check:layout-norms` refuses.
    declarationFile: "docs.json",
    // `content`, by the one question: a running process PRODUCES documentation,
    // and it is the subject rather than something read or written in passing.
    // Both supporting questions agree — detach a docs page and it still
    // explains, and you would RE-AUTHOR it rather than arrive at it by
    // re-running anything. Same layer as `cat-harness`, `schemas` and `voices`.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-todo-index/v1": { validator: "schemas/todo-index.ts#TodoIndexSchema" },
      "folio-semantic-zoom/v1": { validator: "schemas/semantic-zoom.ts#SemanticZoomSchema" },
      "folio-qa-graph/v1": { shape: "content/pipeline/qa-graph-index.ts#QaGraphIndex" },
      "folio-translation-index/v1": { shape: "content/pipeline/translation-index.ts#TranslationIndex" },
      "folio-bean-index/v1": { validator: "schemas/site-indexes.ts#BeanIndexSchema" },
      "folio-translation-status/v1": { validator: "schemas/site-indexes.ts#TranslationStatusSchema" },
      "folio-schema-graph/v1": { validator: "schemas/site-indexes.ts#SchemaGraphIndexSchema" },
      "folio-library-index/v1": { validator: "schemas/site-indexes.ts#LibraryIndexSchema" },
      // The per-entry block graph, one file per library entry (bean `7nvr`).
      // Same writer as the index and deliberately a SEPARATE family: the index
      // answers "what entries are there" and this answers "what is in one",
      // and the corpus holds 1715 blocks over ~1 MB against a 44 KB index, so
      // they are fetched at different times by different questions.
      "folio-library-entry/v1": { validator: "schemas/site-indexes.ts#LibraryEntrySchema" },
      "folio-voices-index/v1": { validator: "schemas/site-indexes.ts#VoicesIndexSchema" },
      "folio-graph-projection/v1": { validator: "schemas/site-indexes.ts#FolioGraphProjectionSchema" },
    },
    summary:
      "Documentation ABOUT the knowledge graph — how the harness works, what its " +
      "directories hold, how a process runs. Rendered by the plain just-the-docs " +
      "pipeline. Distinct from `folio`, which is content an author CREATES using " +
      "the graph; the difference is the SUBJECT, not the format. The who-iris " +
      "catalogue is `library/`; a note about it is a `folio`; the page explaining " +
      "how ingestion works is `docs`.",
  },
  // ── SUB-GRAPHS OF `docs` — issue #1164 ──────────────────────────────────
  //
  // A harness feature's documents move through two places, and the move is the
  // point: a PROPOSAL (initial analysis, MVP, options) is argued in
  // `docs/proposals/`, and when the feature ships it is FILED as its
  // requirements in `docs/requirements/`, checked against the bootstrap
  // `Requirement` schema. Two kinds rather than one `docs` with a status,
  // because a reader asking "what does the harness promise" must not be
  // handed arguments that were never agreed — the same reason `beans` does
  // not mix the work plan with instance state.
  proposals: {
    type: termIri("ProposalsGraph"),
    // NOT a site of its own: its pages are built by `docs`, which it is
    // `within`. The harness still owns exactly one renderable kind.
    renderable: false,
    within: "docs",
    // `content`: authored argument, re-authored rather than regenerated.
    holds: "content",
    validatorNotApplicable:
      "its nodes are markdown pages of argument with no fixed shape; a proposal is judged by the owner, " +
      "not parsed. What IS checked mechanically is the move out of it: `check:requirements` refuses a slug " +
      "that sits in both proposals and requirements.",
    summary:
      "Proposals for the harness's own features — initial analysis, MVP, " +
      "options — argued before anything is agreed. A sub-graph of `docs`. When " +
      "the feature ships, its proposal is MOVED to `requirements` and filed " +
      "against the `Requirement` schema.",
  },
  requirements: {
    type: termIri("RequirementsGraph"),
    // NOT a site of its own: its pages are built by `docs`, which it is
    // `within`. The harness still owns exactly one renderable kind.
    renderable: false,
    within: "docs",
    holds: "content",
    schema: "../bootstrap/schemas/requirement.schema.json",
    validatorNotApplicable:
      "its nodes are markdown pages whose FRONT MATTER is a `Requirement`. A registry validator parses a " +
      "JSON node, so one here would be a category error. `check:requirements` extracts the front matter " +
      "and parses it against the Requirement schema instead, and requires the id to match the file name.",
    summary:
      "What the harness promises, one document per shipped feature, each carrying " +
      "a `Requirement` in its front matter. A sub-graph of `docs`. Test runs point " +
      "at these statements by `req:<slug>#<key>`.",
  },
  "external-schema": {
    type: termIri("ExternalSchemaGraph"),
    renderable: false,
    // `content`, and the call is against the obvious reading. A process DOES
    // write these files — `external-schemas.ts --write` refreshes each
    // record's `terms[]` from the corpus — which sounds like `state`. It is
    // not, because the axis asks what the graph IS, and the subject matter
    // here is a DECISION: which specifications this instance depends on, at
    // which edition, and what each term operatively means. A person makes
    // that; the deriver only keeps one field of it honest.
    //
    // `derived` would be worse than wrong, it would be destructive: it says
    // "regenerate it", and regenerating a deleted record cannot recover the
    // authored edition, the `usedBy` blast radius, or a line of the
    // `operative` prose. The writer preserves those precisely because they
    // are not derivable (`prior.get(term)` in the `--write` path).
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "folio-assistant-core:schemas/external-schema.ts#ExternalSchemaSchema",
    summary:
      "The specifications this instance depends on — one record per specification, pinning the " +
      "EDITION in use, with the operative terms derived from the corpus rather than hand-listed.",
  },
  // Code lists — a closed set of codes, each with a label, a definition and a
  // source, published as a SKOS concept scheme (schemas/code-list.ts). Owner,
  // 2026-09-23: "list of codes and corresponding narrative desc and source
  // should be part of a node/asset". `content`, by the same argument
  // `external-schema` makes: the subject matter is a DECISION — which answers
  // an adjudication may give, which namespaces are ours — and a person makes
  // it. Diagrams and `schemas/namespaces.ts` READ these; nothing writes them.
  "code-list": {
    type: termIri("CodeListGraph"),
    renderable: false,
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "schemas/code-list.ts#CodeListSchema",
    summary:
      "Closed sets of codes — adjudication answers, the namespaces this project mints — one file " +
      "per list, every code carrying its definition and source, published as SKOS.",
  },
  schemas: {
    type: termIri("SchemaGraph"),
    renderable: false,
    // A shape is the subject matter of the schema graph. It is true before
    // anything is validated against it.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "http://json-schema.org/draft-07/schema#": { external: "JSON Schema draft-07" },
      "https://json-schema.org/draft/2020-12/schema": { external: "JSON Schema 2020-12" },
      "folio-source-descriptor/v1": { validator: "large-datasets:schemas/source-descriptor.ts#SourceDescriptorSchema" },
    },
    summary: "A Subgraph of schema definitions: files that state the shape other files must have.",
  },
  // UML renderings of the declared sub-graphs — one `.puml` and one `.mmd`
  // per named sub-graph and per instance, both written from one model by
  // `scripts/gen-uml-overview.ts`. `derived`: regenerated, never authored, so
  // a finding against one is a finding against the generator or its inputs.
  uml: {
    type: termIri("UmlGraph"),
    renderable: false,
    holds: "derived",
    // declared-path-literal: this table IS the declaration, as on `health`.
    // Generated: the generator is where the shape of a diagram is written down.
    schema: "scripts/gen-uml-overview.ts",
    validatorNotApplicable:
      "its nodes are `.puml` and `.mmd` — PlantUML and Mermaid source, counted 2026-09-24 as 103 and 101. Not " +
      "JSON, and `derived` besides, so a finding against one is a finding against the generator; " +
      "`uml:overview:check` grades their currency.",
    summary:
      "UML class diagrams of each named sub-graph a harness declares, derived from the node schemas " +
      "its graph kinds register — PlantUML and Mermaid from one model.",
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
    // A verdict is where a REVIEW got to on a subject that lives elsewhere.
    // Detached from the artefact it judges it says nothing — which is the
    // state test, and it is why the sidecar tree MIRRORS each subject's path.
    holds: "state",
    recordsWork: false, // live state, but nothing anybody is partway through
    summary:
      "QA verdicts and their projections — kg-qa audits, block and translation QA, " +
      "qa-witness documents for the docs site, the viewer-navbar audit, result roll-ups " +
      "and test runs; every `$schema` family is named in `nodeSchemas`, which is the list " +
      "— a count here would be a second one, and it was already wrong by one before " +
      "`viewer-nav-qa/v1` was added. Generated; never hand-edited.",
    schema: "content/pipeline/qa-witness.ts",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "kg-qa/v1": { validator: "schemas/kg-qa.ts#KgQaReportSchema" },
      "block-qa/v1": { validator: "schemas/block-qa-schema/js/index.ts#BlockQaReport" },
      "folio-test-run/v1": { validator: "schemas/test-run.ts#TestRunSchema" },
      "qa-witness/v1": { shape: "content/pipeline/qa-witness.ts#QaWitness" },
      "qa-results/v1": { shape: "scripts/qa-results.ts#QaResult" },
      "translation-qa/v1": { shape: "content/pipeline/translation-block-qa.ts#TranslationBlockQaReport" },
      // Written inline by two call sites and typed by neither — recorded,
      // not invented. `qa-graph-index.ts` names the tag only to say it is
      // NOT its own (`NOT_TO_BE_CONFUSED_WITH`).
      "folio-qa-index/v1": { validator: "schemas/site-indexes.ts#QaIndexSchema" },
      // The detangle sidecars, in cat-harness
      // qa directory. `detangle` was its own instance until 2026-09-23 and is
      // now a directory of this harness (bean `byql`), so the shape is an
      // ordinary instance-relative path under `schemas/` and needs no `detangle:` qualifier.
      "folio-detangle-sidecar/v1": { shape: "schemas/detangle-sidecar.ts#DetangleSidecar" },
      // The viewer-navbar audit (bean `edx7`). A VERDICT PER PAGE rather than
      // a count, because the owner's rule has two clauses -- present unless
      // EXPLICITLY removed -- and a count cannot tell a deliberate removal
      // from a generator nobody wired.
      "viewer-nav-qa/v1": { validator: "schemas/viewer-nav-qa.ts#ViewerNavQaSchema" },
    },
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
    // The same shape one level out: where the REPOSITORY got to, measured
    // against thresholds. A report is evidence about an instance, never part
    // of it.
    holds: "state",
    recordsWork: false, // live state, but nothing anybody is partway through
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
  // Source code. Registered 2026-09-22 (bean `ylj7`) after a measurement the
  // owner asked for: of roughly 1,216 `.ts` files in this repository, about
  // 180 sat inside a DECLARED directory. Roughly 85% of the code was in no
  // declared directory at all -- `scripts/`, `content/`, `src/`, `test/` and
  // `adapters/` among them.
  //
  // That is the `v8gh` property, which everything else here already relies on:
  // AN UNDECLARED FILE IS ONE NO CHECKER HAS A REASON TO LOOK AT. A QA axis
  // asking "is this code claimed by a Tool node?" was being asked over 15% of
  // the code while reporting a clean run over the rest, which is `dh4f` in its
  // most expensive form.
  //
  // THE OWNER'S FIRST PROPOSAL WAS A SINGLE `<stub>/src`, and the measurement
  // is what argued against it as a DESTINATION while confirming it as a
  // MECHANISM. Three of the four sources resist a move for different reasons:
  // `schemas/` is already a declared graph (a schema IS a knowledge-graph
  // node), `content/pipeline/` is core's subject so moving it under
  // cat-harness crosses the boundary `repo-partition.ts` enforces, and
  // `scripts/` are entry points named BY PATH in package.json and the CI
  // workflows -- which `check:ci-invocations` and `check:command-paths` guard.
  // So: declare them where they are, and keep `<stub>/src` as the convention
  // for NEW instances.
  //
  // `content` by the one question: somebody authors it, with an intention, and
  // you would re-author rather than regenerate it. It stands on its own -- a
  // module still computes when detached from everything that calls it.
  //
  // NOT renderable, and that is the interesting call. Code is legible and this
  // repository does publish views of it, but `renderable` asks whether the
  // graph is wired to the SITE BUILD as pages, and it is not: the generated
  // references are built from schemas and skills, not from the code graph.
  // Saying `true` here would promise a page for every module.
  //
  // It does NOT answer "is this code claimed". That is a second, separate
  // question -- declared but bound to no Tool node -- and beans `d308` and
  // `ce65` own it. Reporting the two as one number is how the cheap one never
  // gets done.
  code: {
    type: termIri("CodeGraph"),
    renderable: false,
    holds: "content",
    validatorNotApplicable:
      "its nodes are TypeScript — 1793 files, counted 2026-09-24. `tsc` is the validator for code, and " +
      "`check:partition` plus `check-code-accounting` grade the graph over it.",
    summary:
      "Source code -- the modules, scripts and entry points an instance holds. Declared so that " +
      "code is scannable at all: an undeclared file is one no checker has a reason to look at. " +
      "Being declared here says nothing about whether a Tool node claims it, which is a separate " +
      "question and a separate axis.",
  },
  // QA reports -- what a pipeline TOOL recorded about its own run. The FIFTH
  // QA-shaped family here, and a separate kind for the same reason `health` is
  // separate from `qa`, one step further out: a `qa` witness judges an
  // ARTEFACT, a `health` report judges the REPOSITORY, and a `qa-report`
  // records an EXECUTION. Folding it into `qa` would put "this script
  // processed 198 files and expected 199" beside "this lane binds no role",
  // and hand a consumer asking for verdicts about content a fact about a
  // subprocess.
  //
  // Registered on the owner's ruling, 2026-09-22, and on evidence rather than
  // design: every DAK pre/post script already writes exactly this document and
  // the Publisher already writes `qa.json`, and NOTHING DOWNSTREAM READS
  // EITHER. The shape is what they emit, down to upstream's snake_case field
  // names -- `schemas/qa-report.ts` says why renaming them would be a place
  // for producer and consumer to drift silently.
  //
  // `state` by the one question: a running process WRITES it. It is the same
  // shape as `health` one level in -- where a RUN got to, rather than where
  // the repository got to -- and `derived` was considered and rejected: a
  // derived graph is regenerated from a source that still exists, while
  // re-running a tool produces a DIFFERENT report rather than the same one
  // again.
  //
  // `recordsWork: false` -- live state, but nothing anybody is partway
  // through. A half-written report is not work in progress; it is a run that
  // died, which `qaReportVerdict` reports as `unknown` rather than as clean.
  "qa-report": {
    type: termIri("QaReportGraph"),
    renderable: false,
    holds: "state",
    recordsWork: false,
    summary:
      "QA reports -- one `qa-report/v1` document per tool run, carrying the tool's own " +
      "successes, warnings and errors, the files it processed, the files it EXPECTED and " +
      "the ones that were missing, plus the provenance and toolchain versions upstream " +
      "records nowhere. Generated by the run; never hand-edited.",
    schema: "schemas/qa-report.ts",
    // declared-path-literal: this table IS the declaration, as for `health`.
    validator: "schemas/qa-report.ts#QaReportSchema",
  },
  // ONE kind for the whole work plan, not one per store. It replaced `workplan`
  // + `process-state` in #266; the rationale is in this map's doc comment above,
  // and the #263 version it supersedes is preserved there too. PR #266 changed
  // the map and left that comment describing the old five-kind design.
  // RENAMED from `glossary` on 2026-09-23 (owner: "Rename harness one"). The
  // name `glossary` now belongs to folio-assistant-core's kind: local SKOS
  // terms plus references to external SKOS schemes, rendered on every
  // instance's glossary/ page. This is the harness's swimlane-role ledger, one
  // source that page reads.
  "swimlane-glossary": {
    type: termIri("SwimlaneGlossaryGraph"),
    renderable: false,
    // `state`, and NOT `derived` — the interesting call now that `derived`
    // exists. The glossary DOCUMENT is derived and lives in `_kg/`; what is
    // committed here is the LEDGER, whose one fact is the thing regeneration
    // cannot produce: that a term was once minted. A `derived` ledger would
    // say "regenerate it", and regenerating it erases every retirement. So a
    // process writes it as it runs, which is `state` by the axis's own
    // question.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-glossary-ledger/v1": { shape: "scripts/glossary-export.ts#Ledger" },
    },
    // NOT work. A bean is something somebody is partway through; this is a
    // record that a term exists, true whether or not anybody is doing
    // anything. `check:graph-kind-work` refuses a `state` kind that has not
    // decided, and it was right to: "state" alone does not say whether a
    // reader is looking at a queue or at a fact.
    recordsWork: false,
    summary:
      "The swimlane glossary's retirement ledger — every concept this instance has ever minted, " +
      "with the date it was first seen and the date it stopped being derivable. Written by " +
      "scripts/glossary-export.ts; the glossary document itself is derived and not stored here.",
  },
  models: {
    type: termIri("ModelGraph"),
    renderable: false,
    // `context`: READ when a session opens, never written by a process. That
    // is the whole point of the kind — a person grants a validation, an agent
    // never does, because a model's own claim about which languages it
    // handles well is precisely what the validation state exists to distrust.
    // A `state` kind would say a process may write it, and the first process
    // that did would be manufacturing its own evidence.
    holds: "context",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "schemas/model-registry.ts#ModelRegistrySchema",
    summary:
      "Which languages a model is good at, and whether a human checked. Read when a session opens, " +
      "as ONE input to the communication-language determination and never as the answer. " +
      "Declared in bootstrap because an agent reaching for it has not yet loaded the harness.",
  },
  beans: {
    type: termIri("BeanGraph"),
    renderable: false,
    // The work plan. Its own declaration already splits WHAT IS BEING WORKED
    // ON from WHERE IT GOT TO — both are records about content, neither is
    // content.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-workflow-instance/v1": { shape: "src/workflow/instance.ts#InstanceState" },
    },
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
    summary:
      "The work plan — what is being worked on, and where each running BPMN instance got to. " +
      "Its inner directories are declared by `beans/beans.json`.",
    // Named here rather than derived from the directory: `bean-graph.ts` holds
    // that moving `beans/` to `work/` must rename nothing inside it, and a
    // computed `${dirName}.json` would contradict that on the first relocation.
    declarationFile: "beans.json",
  },
  // The two parts of the bean graph. They are BASE kinds rather than
  // something `bean-graph.ts` registers separately, because a directory and
  // what it holds is one concept and this is where it lives — `bean-graph.ts`
  // had grown a parallel closed vocabulary (`BEAN_NODE_KINDS`) saying the same
  // thing in different words.
  "bean-defs": {
    type: termIri("BeanDefsGraph"),
    renderable: false,
    // What is being worked on. A bean names a change to something; it is not
    // the something.
    holds: "state",
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
    validatorNotApplicable:
      "no instance declares a directory of this kind — it is nested inside `beans/`, declared by " +
      "`beans/beans.json`, and reached through its parent. There is nothing here to validate; `check:bean-front-matter` and its four siblings grade the bean store.",
    summary:
      "Work items — one Markdown file each, in the layout the `beans` CLI reads. " +
      "Authored and edited by people and agents.",
  },
  "workflow-state": {
    type: termIri("WorkflowStateGraph"),
    renderable: false,
    // The clearest case in the table: a token's position in a process drawn in
    // the `cat-harness` graph. It cannot be read at all without the diagram it
    // references.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-workflow-instance/v1": { shape: "src/workflow/instance.ts#InstanceState" },
    },
    schema: "src/workflow/instance.ts",
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
    // The kind's own reader, wired 2026-09-20. `skill` is a property of the
    // KIND rather than of a directory because a `workflow-state` graph is read
    // the same way wherever it sits — and it was absent while the skill it
    // names did not exist. A consumer arriving at this kind had the shape and
    // no account of what a token position MEANS, which stores sit beside it,
    // or why a step may write here and not to `memory`.
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
    // A person's outstanding items. Outstanding is the word that settles it —
    // an item records a position, not a fact.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-board/v1": { validator: "schemas/board.ts#BoardSchema" },
    },
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
    summary:
      "Human actors' outstanding work — content, owned by the folio, tagged by role, " +
      "process, task and identity. Its inner directories are declared by `todos/todos.json`.",
    declarationFile: "todos.json",
  },
  // THE BOARD AND ITS LAYOUT, declared as TWO kinds, and the split is the
  // whole design rather than a filing convenience.
  //
  // The owner, 2026-09-20: *"treat it like OMG specs and BPMN layout.
  // relationship first, visualiztion alter."* BPMN separates the semantic
  // model (`bpmn:process`) from **Diagram Interchange** — `BPMNDiagram`,
  // `BPMNShape`, `BPMNEdge` — and the layout document points AT the semantic
  // one, never the other way. So:
  //
  //   boards            what a board IS, and what it shows        content
  //   board-positions   where each note was drawn on it           state
  //
  // A board is a DIAGRAM OF a folio, not a container of one: a folio is
  // complete with no board, and deleting every board loses layout and no
  // content. That is also why `board-positions` is `state` while `boards` is
  // `content` — one is authored and the other is written by a running process
  // as people move things, and `content-context-and-state-graphs` refuses a
  // content node that carries state. It is the same reason a note may not
  // hold `x` and `y`, which `schemas/board-positions.ts` asserts against the
  // source of four schemas.
  boards: {
    type: termIri("BoardGraph"),
    renderable: false,
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/board.ts#BoardSchema",
    // NOT work. A board is a way of LOOKING at work, and `check:graph-kind-work`
    // asks the question because the two are easy to conflate: `beans`, `todos`
    // and `workflow-state` each record something somebody is partway through,
    // and a board records none of it. Deleting every board loses no position
    // in any process.
    recordsWork: false,
    summary:
      "Boards — one JSON file each, carrying `\"$schema\": \"folio-board/v1\"`. " +
      "A board is a diagram OF a folio: it declares what it shows, and a folio with " +
      "no board is complete. Schema: `schemas/board.ts`.",
  },
  "board-positions": {
    type: termIri("BoardPositionsGraph"),
    renderable: false,
    // Written by a running process every time somebody moves a note. It is
    // Diagram Interchange: where things were drawn, not what is true.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/board-positions.ts#BoardPositionsSchema",
    // NOT work either, and this is the sharper of the two. It IS `state` —
    // written by a running process — which is exactly what makes the question
    // worth asking: state that records a POSITION IN A PROCESS is work, and
    // state that records a position ON A CANVAS is not. Losing this file loses
    // where things were drawn and nothing about what is outstanding.
    recordsWork: false,
    summary:
      "Where each note sits on each board — `board-positions.json`, keyed by board " +
      "then by note id, in board units. The layout layer, which points at notes and " +
      "is never pointed back at. Schema: `schemas/board-positions.ts`.",
  },
  "todo-items": {
    type: termIri("TodoItemsGraph"),
    renderable: false,
    // As `todos`.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/todo.ts#TodoNodeSchema",
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
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
    // A QUEUE, and a queue is a position in a pipeline. The declaration
    // already says these files are NOT L1 and read as absent to every corpus
    // consumer: the file is on disk and the content does not exist yet.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-extraction/v1": { validator: "folio-assistant-core:schemas/extraction.ts#ExtractionSchema" },
      "folio-intake/v1": { writtenBy: "scripts/library-graph.ts" },
    },
    recordsWork: false, // live state, but nothing anybody is partway through
    summary:
      "The incoming queue — raw files as dropped, before ingestion. NOT L1, and not " +
      "greppable as corpus: a document here reads as absent to every consumer.",
  },
  library: {
    type: termIri("LibraryGraph"),
    renderable: false,
    // DERIVED, not content — bean `hqku`, and the owner's ruling of
    // 2026-09-20: *"library is static (only if we materialize assets or
    // not)"*, *"can duplicate asset into a folio and work there"*.
    //
    // It still stands on its own — a library section reads without anything
    // else, which is why this was `content` until now and why the skill used
    // it as the example. What changed is the OTHER question: a section is
    // produced from an ingested source and regenerated, never re-authored in
    // place, so a QA finding against one is a finding against the ingestion
    // that made it. `qa-sweep` skips it for exactly that reason.
    //
    // NOT `context`, and that was ruled out by a rule rather than by taste:
    // `context` means a step writing to it is a defect, and
    // `document-ingestion.bpmn` writes `library/`.
    holds: "derived",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-document-images/v1": { validator: "schemas/document-image.ts#ImagesSidecarSchema" },
      "folio-image-verdicts/v1": { shape: "scripts/apply-image-verdicts.ts#VerdictFile" },
      // Agent summaries of prose blocks, beside the blocks rather than in
      // them — the blocks stay verbatim and `ingested` (owner, 2026-09-24).
      // The semantic half of its QA is `block-summaries` in check-l1-complete.
      "folio-block-summaries/v1": { validator: "schemas/block-summary.ts#BlockSummariesSidecarSchema" },
      // What the site mount must not publish from this directory (bean `cw35`).
      // Written by the instance's generator from its licence gates; the mount
      // validates it with this schema and refuses to mount if it cannot.
      "folio-withheld/v1": { validator: "schemas/withheld.ts#WithheldSchema" },
    },
    summary:
      "L1 source content — one `<bib-slug>/` per ingested document, holding `sections/*.md`, " +
      "`structure.json` and, where the source was scanned, `ocr/page-NNN.txt`. Every " +
      "knowledge-graph reference to a source resolves through here, never to a loose path " +
      "or a bare URL.",
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
    // `content`, on the same reasoning that makes `library` content: it is
    // DERIVED from an external source by an import process, and being derived
    // rather than typed is not what the axis asks about. Detach a catalogue
    // node and it still says something standing on its own — this item exists,
    // at this handle, in this collection — so it is not the empty-when-detached
    // shape that marks state. Contrast `uploads`, which is `state`: a queue
    // says nothing once the thing has moved through it.
    //
    // THE TENSION, stated rather than hidden, per the skill's own rule: one
    // FIELD of a catalogue node — `materialization.state` — genuinely is
    // written by a running process, when `materialize-remote` moves a node from
    // `referenced` to `materialized`. That does not make the graph state, for
    // the same reason re-ingesting a PDF does not make `library` state: the
    // axis classifies the KIND, not every field on it. If a consumer ever needs
    // to ask "may a process write this field", that is a question about the
    // field and belongs on `materialization.ts`, not a reclassification here.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-dublin-core/v1": { validator: "folio-assistant-core:schemas/dublin-core.ts#DublinCoreRecordSchema" },
      "folio-catalogue-node/v1": { validator: "folio-assistant-core:schemas/catalogue.ts#CatalogueNodeSchema" },
      "folio-catalogue/v1": { validator: "folio-assistant-core:schemas/catalogue.ts#CatalogueSchema" },
    },
    summary:
      "A remote catalogue modelled by reference — communities, collections and items " +
      "of a corpus the instance does not hold. Every node declares whether its bytes " +
      "are here (`materialized`), elsewhere (`referenced`) or unestablished (`unknown`), " +
      "with no default. Distinct from `library`, which is content that IS here.",
  },
  // The artefact index of a published FHIR Implementation Guide — one graph
  // per IG, keyed by the IG's own canonical URLs.
  //
  // A SIBLING of `catalogue`, not a `flavour` of it, and the reason is the
  // test AGENTS.md sets for a content type applied one level down: different
  // CODE, or only different RULES? A catalogue node is a container or an item;
  // a FHIR artefact is a `resourceType` at a canonical URL, published in
  // several representations at once, in a versioned package, against a FHIR
  // version. None of those five facts has a home on `CatalogueNode`, and a
  // `flavour: "fhir"` smuggling them into free text would be a catalogue that
  // cannot answer the only questions anybody asks of an IG.
  //
  // What the two DO share is `MaterializationSchema`, imported rather than
  // restated — the same move `bean-graph.ts` makes with `ContentDirectorySchema`.
  //
  // NOT `derived`, and the distinction is the one `library`'s own comment
  // draws. `library` is derived because ingestion PRODUCES BYTES HERE and a
  // finding against a section is a finding against the ingestion that made it.
  // This graph models a corpus that stays where it is: 655 of smart-trust's
  // 674 artefacts are `referenced` and always will be. That is the `catalogue`
  // shape exactly — including its mixed case, where a handful of nodes are
  // materialised and the rest are not — so it takes `catalogue`'s answer.
  "fhir-artifact-index": {
    type: termIri("FhirArtifactIndexGraph"),
    renderable: false,
    // `content`, on `catalogue`'s reasoning: detach an artefact node and it
    // still says something standing on its own — this ValueSet exists, at this
    // canonical URL, in this IG, with this JSON Schema. Being assembled by an
    // import process is not what the axis asks about.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-fhir-artifact-index/v1": { validator: "folio-assistant-core:schemas/fhir-artifact-index.ts#FhirArtifactIndexSchema" },
      // The IG's own NAVIGATION, read from its `sushi-config.yaml` — a second
      // family in this directory because it comes from a second SOURCE. The
      // index is harvested from the IG's published OUTPUT; a menu exists only
      // in its SOURCE config, at a commit. Two provenances, so two documents:
      // folding the menu into the index would give one file two answers to
      // "where did this come from" (bean `0818`).
      "folio-ig-menu/v1": { validator: "cat-harness:schemas/ig-menu.ts#IgMenuSchema" },
      // The IG's own CHROME — its palette, its status watermark, its publish
      // box — resolved from the `fhir.template` chain its `ig.ini` names. A
      // THIRD family in this directory because it comes from a third SOURCE,
      // and this one is not even a single source: the index is harvested from
      // the IG's published output, the menu from its `sushi-config.yaml`, and
      // the chrome from separate template repositories the IG merely depends
      // on. Three provenances, three documents (bean `ajx9`).
      "folio-ig-chrome/v1": { validator: "cat-harness:schemas/ig-chrome.ts#IgChromeSchema" },
      "https://json-schema.org/draft/2020-12/schema": { external: "JSON Schema 2020-12" },
    },
    summary:
      "The artefact index of a published FHIR Implementation Guide, reconstructed from its " +
      "published output — every artefact by canonical URL and published representation, with " +
      "the DAK API's JSON Schema / JSON-LD sidecars as an overlay where the IG publishes one. " +
      "No IG publishes such an index itself, so every field records which file it came out of.",
    // NO `schema`/`validator`, and that is the same omission `catalogue` makes
    // two entries up rather than an oversight. Both fields resolve under the
    // DECLARING instance's root — here `cat-harness/` — and this kind's schema
    // lives in `folio-assistant-core/schemas/fhir-artifact-index.ts`, one layer
    // up. `check:kind-validators` catches a path that does not resolve, which
    // is how this was found.
    //
    // The harness must not reach up into core: nothing under `cat-harness/`
    // imports from `folio-assistant-core/`, and a declared path pointing there
    // would be that dependency in all but name. When this repository splits,
    // the kind moves to core with its schema and both fields come back — the
    // `folio` kind is the worked example, registered by core through a
    // load-time side effect rather than declared here.
    //
    // Until then `kg_validate` reports "could not determine" for this graph,
    // and saying so here is the point: an undeclared validator that nobody
    // wrote down reads exactly like a graph with nothing to check.
  },
  // Named editorial voice profiles, overlaid on the base house voice. A
  // separate kind from `kg` because a voice is OPT-IN per folio while a skill is
  // simply available: the activation list in `harness.config.json` is what makes
  // a voice apply, and a graph kind that conflated the two would have no place
  // to record that this instance ships four voices and activates none.
  voices: {
    type: termIri("VoiceGraph"),
    renderable: false,
    // An authored rule set. A voice is true whether or not any prose has been
    // written against it.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/voices.ts#VoiceProfileSchema",
    summary:
      "Editorial voice profiles — one JSON each, carrying `\"$schema\": \"folio-voice/v1\"`. " +
      "Every rule cites the ingested source or KG node it was derived from. Opt-in per folio.",
  },
  // Themes an instance DERIVED from a source it holds — a served stylesheet or
  // a style guide's stated rules. A separate kind from `folio` because a theme
  // is not read: it dresses what is. Separate from `kg` for the reason `voices`
  // is, one step further along — a voice is opt-in per folio, and a theme is
  // opt-in per SURFACE, so neither belongs in the graph of things simply
  // available.
  //
  // The platform's own twelve themes are NOT this graph. They are furniture in
  // `cat-harness/schemas/themes.ts`, and the root AGENTS.md draws the line they
  // would cross: a palette read off a WHO style guide is subject matter, and
  // subject matter does not live in the platform. This kind is what gives it
  // somewhere else to live that a declaration-driven consumer can still find.
  themes: {
    type: termIri("ThemeGraph"),
    renderable: false,
    // Authored-from-a-source, like `voices` and for the same reason: a theme is
    // true whether or not anything has been rendered with it. The DERIVATION
    // does not make it state — `catalogue` settles that argument two entries
    // up, and the same answer holds here.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "schemas/theme.ts#ThemeSchema",
    summary:
      "Themes derived from an instance's own sources — one Theme node each, carrying " +
      "`kind: sticky | webpage | publication`. The palette vocabulary is shared across " +
      "every kind and only the geometry varies; every value cites where it was measured.",
  },
  "todo-feedback": {
    type: termIri("TodoFeedbackGraph"),
    renderable: false,
    // As `todos`, plus a submitter's identity — which makes it more obviously
    // a record OF something rather than the something.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "schemas/constraints.ts#FeedbackItemSchema",
    recordsWork: false, // live state, but nothing anybody is partway through
    summary:
      "Feedback items — todos raised against a specific block, carrying the submitter's " +
      "identity. Read by the `todo-review` skill.",
  },
  "review-verdicts": {
    type: termIri("ReviewVerdictsGraph"),
    renderable: false,
    // Written by a running review: the coordinator's step commits each
    // verdict as it is ingested. A record OF a review, like `todo-feedback`,
    // and not a todo: it asks for nothing.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "folio-assistant-core:schemas/review-verdict.ts#ReviewVerdictSchema",
    recordsWork: false, // a verdict is a finished judgement, not work anybody is partway through
    summary:
      "Reviewers' per-block verdicts — one `folio-review-verdict/v1` JSON each, pinned to the " +
      "block's content hash and committed on the edit-set's feature branch. Read by the review " +
      "coverage gate (`folio-review-coverage`), which counts a verdict only while its hash is current.",
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
  // Agent memory — durable facts an agent carries between sessions.
  //
  // `context`, and it is the kind the third value was added FOR. The owner,
  // settling bean `mhh9` on 2026-09-20: "put memory under state/context as
  // static, during a process. it does not change. agents dont work on it
  // (except when an authoring agent is directed by human). todos, beans are
  // not static."
  //
  // Every clause of that is the `context` definition. A running process READS
  // memory and no step writes it; a step that did would be a defect rather
  // than an update. It changes when a human directs an authoring agent to
  // change it, which is an act OUTSIDE any instance.
  //
  // That is also what separates it from `todos`, its mirror in the 2x2
  // `todos/todos.json` states. Both were called "memory" there — human and
  // agent — and the axis cuts ACROSS that: a todo is an OUTSTANDING ITEM a
  // process closes, so it is live `state`, while a memory entry is an
  // ESTABLISHED FACT nothing mid-process revises. Same quadrant row, opposite
  // sides of this line.
  //
  // DECLARED at `memory/`, repository-scoped, since bean `07xs` — the same
  // day this kind was registered. It was registered ahead of its directory for
  // a few hours, which is the `folio` situation rather than the `dh4f` one:
  // `dh4f` is a DIRECTORY declared and absent, where a consumer scans nothing
  // and reports clean, and nothing scans a kind.
  // A SESSION's context — who is acting, which instances are open, what it
  // waits on. `state`: the session writes it as it goes.
  //
  // Distinct from `workflow-state`, and the line is not a nicety.
  // `workflow-state` is where ONE INSTANCE got to; a session SPANS processes —
  // it starts before any instance, may open several, and outlives each. A
  // session with nothing open is the commonest state there is, and would be
  // unrepresentable as a field on an instance.
  //
  // REGISTERED AHEAD OF A DIRECTORY, like `memory` and like `folio`: nothing
  // writes a session record yet (bean `3nfv` is the state machine that will),
  // and declaring a directory before it exists is the `dh4f` defect, where a
  // consumer scans nothing and reports a clean run. Nothing scans a kind.
  "session-state": {
    type: termIri("SessionStateGraph"),
    renderable: false,
    holds: "state",
    recordsWork: false, // live state, but nothing anybody is partway through
    schema: "schemas/session-context.ts",
    validatorNotApplicable:
      "no instance declares a directory of this kind in this repository, so it has no nodes to validate. If one " +
      "appears this reason stops being true, and the declaration should go with it.",
    summary: "A session's context — the acting actor, the instances it has open, and what it waits on.",
  },

  // Interaction preferences — how a PERSON wants to be asked.
  //
  // `context`, by the same test as `memory`: an agent READS it at session
  // start and no step writes it; it changes when a person states a
  // preference, which is a human-directed act outside any instance. The two
  // are the same shape at different subjects — what the agent knows, and what
  // the person needs.
  //
  // It lived in `.harness/` until 2026-09-20, undeclared, which was not a
  // choice anyone could have defended: this repository's own dot-prefix guard
  // REJECTS a dot-prefixed segment, so the file was in the one place the
  // conventions forbid while being read at the start of every session.
  interaction: {
    type: termIri("InteractionGraph"),
    renderable: false,
    holds: "context",
    // `schema` pointed at `harness-config.ts` until 2026-09-24, and that was
    // wrong in a way worth naming rather than quietly correcting: that module
    // holds the PATH to the node (`interaction: z.string().default(...)`), not
    // its shape. A pointer to where a fact is NOT written is worse than none,
    // because a reader who follows it concludes the shape is undeclared on
    // purpose. Bean `3oqj`; `audit-coverage` is what surfaced it.
    schema: "schemas/interaction.ts",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-interaction/v1": { validator: "schemas/interaction.ts#InteractionNodeSchema" },
    },
    summary: "How a person wants to be asked — read at session start, never written by a process.",
  },
  // The marks an agent leaves on an issue it has read.
  //
  // `state`: a running process writes one each time it checks an issue. NOT
  // the comments — the files carry `lastCommentId`, `lastUpdatedAt` and
  // `checkedAt`, and one of the two in this repository says so in its own
  // note: "the mark records only that the newest was seen". A kind named for
  // the comments would promise a reader the bodies.
  //
  // Two marks rather than one, because a comment EDITED after being read
  // keeps its id: the id alone would call it seen, and an edited requirement
  // is a changed requirement (`issue-working`).
  "issue-marks": {
    type: termIri("IssueMarkGraph"),
    renderable: false,
    holds: "state",
    recordsWork: false, // live state, but nothing anybody is partway through
    schema: "src/issue-watch/seen-comments.ts",
    // declared-path-literal: this table IS the declaration, as on `health`. The
    // shape was a TypeScript interface until 2026-09-24 — the `schema` /
    // `validator` divergence this field's own doc uses `qa` to illustrate — so
    // `check:kind-validators` reported the kind as could-not-determine and
    // `audit-coverage` as reached by nothing. `SeenState` is now derived from
    // the Zod schema, so the two cannot drift. Bean `3oqj`.
    nodeSchemas: {
      "folio-issue-mark/v1": { validator: "src/issue-watch/seen-comments.ts#IssueMarkSchema" },
    },
    summary: "How far an agent has read an issue — the comment id and the edit time it accounted for.",
  },

  memory: {
    type: termIri("MemoryGraph"),
    renderable: false,
    holds: "context",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    validator: "schemas/memory.ts#MemoryNodeSchema",
    summary: "Durable facts an agent carries between sessions. Read during a process, never written by one.",
  },

  // A confirmation the owner gave IN ADVANCE — `skills/folio-core/confirmation-waiver.md`.
  //
  // Owner, 2026-09-20: "human can waive confirmation rights (e.g. for session,
  // for process run)", and "context dependent, should be in memories".
  //
  // `context` by exactly the test that settled `memory` above — a running
  // process READS a waiver before a gate fires and no step writes one; it
  // changes when a person grants or withdraws permission, which is an act
  // OUTSIDE any instance. That is why it is declared over the SAME directory:
  // `memory/` holds both, and the two are told apart by the `$schema` tag
  // inside each file rather than by where it sits. A directory is a place to
  // look and may hold more than one part of a graph.
  //
  // A kind of its own rather than a fourth memory label, and the reason is
  // structural: `MemoryNodeSchema` carries NO status by design — "a TRAP is
  // not open, and marking one done would assert that the failure it records
  // has stopped being possible". A waiver's whole content is that it EXPIRES.
  // Labelling one `stable` would assert the opposite of what the node says.
  waiver: {
    type: termIri("WaiverGraph"),
    renderable: false,
    holds: "context",
    schema: "schemas/waiver.ts",
    // declared-path-literal: as on `health` and `translation-sources` — this
    // table IS the declaration, so resolving `validator` through one would be
    // reading it from here. `check:kind-validators` proves it still loads.
    validator: "schemas/waiver.ts#WaiverNodeSchema",
    summary:
      "Confirmations a person granted in advance — each naming one gate, scoped to a session or a process run, each expiring.",
  },

  "fsh-guts": {
    type: termIri("FshGutsGraph"),
    renderable: false,
    // The one that reads like content, and the one `context` moved. What is
    // in here is deprecated or superseded, so the fact it carries is WHERE
    // SOMETHING GOT TO — which is why it is deliberately absent from the
    // rendered site while being renderable in principle. But no running step
    // writes it: relocating something here is a HUMAN-DIRECTED act, and
    // `deletion-requires-confirmation` is the skill that says so in as many
    // words. Read, never written by a process — which is `context`, and it
    // was `state` for the few hours between the axis landing and `mhh9`
    // being settled. Classified state by the owner 2026-09-20; the refinement
    // the same day moved it, by the same criterion that moved memory.
    holds: "context",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "schemas/fsh-guts.ts#FshGutsNodeSchema",
    summary:
      "Deprecated and throwaway structured content — kept, addressable and exported, and " +
      "deliberately absent from the rendered site. The destination for anything that would " +
      "otherwise be deleted, and for SDLC churn that must not reach the folio's readers.",
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
    // A `.po` catalogue and its manifest are authored content in another
    // language, not a record of a translation having happened.
    holds: "content",
    summary:
      "POT templates, PO catalogues and their `TranslationNode` manifests, one directory " +
      "per target locale. The INPUT to injection; the rendered output is ordinary content " +
      "that declares its own `lang`.",
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
/**
 * Where a known-but-unregistered kind is registered, for the error message.
 *
 * **The message named the DECLARATION ENTRY and not the caller**, so it
 * pointed at `cat-harness.json` — a file that is correct — while the mistake
 * was a missing import in whichever module happened to read it first. Telling
 * somebody a kind "must be registered" without naming the import leaves them
 * to grep for it.
 *
 * Measured 2026-09-21 before adding this: of the **31 real call sites** of
 * `directoryForGraph`/`directoriesForGraph`, **31 reach the registration**, so
 * nothing is broken today and this is a guard against regression rather than a
 * fix. It is worth having because the repository has already paid for this
 * once — `bunfig.toml` records the suite green locally (3198 pass) and red in
 * CI on the same commit, 2026-09-20, from exactly this load-order dependence,
 * with five files latently order-dependent and CI catching only the first.
 *
 * Deliberately a lookup rather than a field on `GraphKindDef`: a kind that is
 * not registered has no def to carry one, which is the whole situation here.
 */
// Exported because `readDeclaration` — which stayed in `cat-harness.ts` —
// names the module to import in its error text. Private to the block until
// the split; the split is what made the consumer external.
export const REGISTRATION_MODULE: Readonly<Record<string, string>> = {
  // declared-path-literal: NOT a declared path — this is the module SPECIFIER
  // a reader must import, quoted inside an error message so the remedy can be
  // pasted. It resolves through the module graph, not through the declaration,
  // so routing it through a directory resolver would be a category error.
  folio: "schemas/folio-graph-kind.js",
  glossary: "schemas/glossary-graph-kind.js",
};

export const GRAPH_KIND_ALIASES: Readonly<Record<string, string>> = {
  kg: "cat-harness",
  // `workflows` was this kind's name for a few hours on 2026-09-21, between
  // the `cat-harness` split and the owner settling the term.
  //
  // PROCESS won on evidence rather than preference. BPMN's own element is
  // `<bpmn:process>`, and WHO's DAK component list — which this platform
  // exists to author against — names "Business processes and decision logic"
  // and "Personas and scenarios". The earlier ruling on bean `rapm`
  // ("prefer workflows over processes") was made before either was checked
  // and is OVERTURNED, not forgotten: the owner, 2026-09-21, *"we have
  // BPMN... seems like process is best"*.
  //
  // An alias rather than a sweep because it is exactly 1:1, which is the one
  // shape this table can express — the `cat-harness` split could not use it
  // and had to keep its umbrella instead.
  workflows: "processes",
};

/** What a declared kind name means now, and whether it was a deprecated spelling. */
export function resolveGraphKind(name: string): { kind: string; deprecated?: string } {
  const to = GRAPH_KIND_ALIASES[name];
  return to ? { kind: to, deprecated: name } : { kind: name };
}

/**
 * Are two registrations of one name the SAME kind, or a conflict?
 *
 * Only the fields that change how a consumer behaves count. `type` is the
 * projected identity, `renderable` decides whether the site build takes it, and
 * `holds` decides whether a consumer asking for content may be handed this —
 * three behavioural facts, and two definitions disagreeing on any of them are
 * two different kinds wearing one name.
 *
 * `summary`, `skill` and `schema` are deliberately NOT compared. They are
 * descriptive: a dependency wording its summary differently is not a conflict,
 * and treating it as one would make a diamond fail on prose.
 *
 * **`holds` was the hole this function exists to close.** The comparison was
 * inline and named `type` and `renderable` only, so when the axis landed, two
 * layers registering one kind on opposite sides of the content/state line would
 * have passed the diamond check and the first would silently have won — the
 * exact "one name, two answers" failure the registry throws to prevent,
 * reintroduced by the field that was added to end it. Named and extracted so
 * the next field added to `GraphKindDef` has one place to be considered.
 */
function sameKind(a: GraphKindDef, b: GraphKindDef): boolean {
  return a.type === b.type && a.renderable === b.renderable && a.holds === b.holds;
}

export class GraphKindRegistry {
  private kinds = new Map<string, GraphKindDef>();

  constructor(seed: Readonly<Record<string, GraphKindDef>> = BASE_GRAPH_KINDS) {
    for (const [k, v] of Object.entries(seed)) this.kinds.set(k, v);
  }

  register(name: string, def: GraphKindDef): void {
    const existing = this.kinds.get(name);
    if (existing) {
      if (sameKind(existing, def)) return; // diamond
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
