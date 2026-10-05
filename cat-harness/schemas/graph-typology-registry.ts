/**
 * The graph-typology registry — **a leaf, and that is its whole job**.
 *
 * A graph typology says what a declared directory holds: whether it `renderable`,
 * and which layer it `holds`. The kinds themselves, the registry they live in,
 * and the shared instance every reader consults are all here.
 *
 * ## Why this is its own module
 *
 * It was inside `schemas/cat-harness.ts`, and that made ONE import impossible:
 * `folio-graph-typology.ts` — core's registration of the only renderable kind —
 * imported `cat-harness.ts` for `defaultGraphTypologies`, so `cat-harness.ts` could
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
 * With the registry on a leaf, `folio-graph-typology.ts` imports only this file —
 * **core importing the harness, the allowed direction** — and `cat-harness.ts`
 * triggers the registration itself. So the kind is registered by the time
 * anything can call a reader, because you cannot reach a reader without
 * loading `cat-harness.ts`. The failure stops being a thing callers must
 * remember and becomes **structurally impossible**.
 *
 * ## What did NOT change, deliberately
 *
 * Core still OWNS `folio`. The definition, its `renderable: true` and the
 * argument for both stay in `schemas/folio-graph-typology.ts`, and a bare harness
 * registry still does not know the kind — `cat-harness.test.ts` asserts that
 * and still passes, because it seeds its own registry. This moves WHERE THE
 * MECHANISM LIVES, not who owns the kind; option 2 on #465 (adding `folio` to
 * `BASE_GRAPH_TYPOLOGIES`) is the one that would have overturned the boundary, and
 * `GraphTypologyDef.renderable` carries the reason it must not: *"a layer that
 * cannot render must not own the renderable kind."*
 *
 * @module schemas/graph-typology-registry
 * @graphNode schema
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { declaredNodeFiles } from "./declared-nodes";
import { GraphTypologyNodeSchema, kindDefOf } from "./graph-typology-node";
import { ValidatorNodeSchema, type ValidatorNode } from "./validator-node";
import { namespaceForLayer } from "./namespaces";
import { BOOTSTRAP_GRAPH_TYPOLOGIES } from "../../bootstrap-tools/schemas/graph";


// ── Graph typologies ─────────────────────────────────────────────────

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
 * See `skills/kg/kg-core/content-context-and-state-graphs.md`.
 */
export type GraphLayer = "content" | "context" | "state" | "derived";

/** What a declared directory's graph typology means. */
/**
 * Where ONE `$schema` family of a graph typology is defined. Bean `rdkm`.
 *
 * Three forms, because the corpus has all three and collapsing them would
 * make two of them lie:
 *
 * | form | means | example |
 * |---|---|---|
 * | `validator` | a Zod schema, `module#Export` — runnable | `kg-qa/v1` → `KgQaReportSchema` |
 * | `shape` | a TypeScript type, `module#Name` — readable, NOT runnable | `qa-witness/v1` → `QaWitness` |
 * | `external` | a specification nobody here types; the node conforms to it | a JSON Schema document, `https://json-schema.org/draft/2020-12/schema` |
 *
 * `external` is not a gap — the shape is somebody else's, and it is named
 * rather than restated.
 *
 * There was a fourth, `writtenBy`: no type at all, just the module that wrote
 * the family. It recorded the gap as data, and it was also this registry — a
 * `@general` node — naming its dependent. #1168 B6b typed all nine families
 * that used it (beans `dv8v`, `d4lb`) and removed the form, so an untyped
 * family can no longer be registered: it is either typed or it is not listed.
 */
export type NodeSchemaRef = (
  | { validator: string; shape?: never; external?: never }
  | { shape: string; validator?: never; external?: never }
  | { external: string; validator?: never; shape?: never }
  // A family LISTED with no code of its own: its validator is a
  // `folio-validator/v1` node that names it (bean riit, owner 2026-10-04: the
  // validator names the family). The registry fills `validator` in from it.
  | { validator?: never; shape?: never; external?: never }
) & {
  /**
   * Files of this family are GENERATOR OUTPUT — a script writes every one, so
   * nothing in them is authored and a reader must not judge them as prose.
   *
   * It says THAT a generator writes the family, never WHICH one: naming the
   * writer is what the removed `writtenBy` form did, and it made this registry
   * (a `@general` node) name its dependents (#1168 B6b). A boolean carries the
   * fact a consumer needs without the edge. Absent means authored or unknown —
   * never assume generated. `folio-intake/v1` is the case that shows why the
   * two differ: `writtenBy` named its CONSUMER, and its files are authored.
   *
   * Read by `check-reference-direction` to skip generated files (bean `zhg2`).
   */
  generated?: true;
};

/**
 * @general — a node others depend on: it points only at other general nodes,
 * never at its dependents (data-modelling step 8; checked by `arrow-direction`).
 */
export interface GraphTypologyDef {
  /**
   * Whose namespace the kind is named in, when it is not the harness's:
   * `core` for the folio's own furniture (`voices`, `library`, `todos`, …).
   * A kind bootstrap defines is bootstrap's whatever this says
   * (`BOOTSTRAP_GRAPH_TYPOLOGIES`). The kind IS its individual,
   * `<ns>graphTypology/<name>` ({@link graphTypologyIri}); there is no class per kind.
   * Owner, 2026-09-30 (bean `3r47`): "Drop per-kind classes" — bootstrap names
   * a kind as one `GraphTypology` individual, and the harness now does the same.
   */
  layer?: "core";
  /**
   * Does every instance have ITS OWN graph of this kind — so an instance that
   * inherits a directory of this kind gets its own copy created?
   *
   * The per-entry `dependents: "reproduce" | "skip"` answered this until
   * 2026-09-30, when the owner retired it (option A: "make dependents:
   * reproduce automatic behaviour so [we] don't need it"). It is a fact about
   * the KIND: a folio has its own `uploads/`, `library/`, `docs/`, `qa`
   * results and work plan; it does not have its own empty `schemas/`,
   * `tools/` or `code`. Stated once here, it cannot disagree between two
   * declarations of the same kind — which the per-entry field did, e.g.
   * `docs` was `reproduce` once and `skip` four times.
   *
   * Absent means no: an inherited directory of the kind is a MEMBER of the
   * subgraph exactly where it already exists, and is never created empty
   * (the `dh4f` rule). {@link materialiseDirectories} reads it.
   */
  perInstance?: true;
  /**
   * Is a graph of this kind expected to render as a website?
   *
   * The only behavioural distinction in the vocabulary — and the reason
   * `folio` is not declared here. The harness **cannot render**: the
   * just-the-docs pipeline and the webpage content type belong to
   * `folio-assist-core`. A layer that cannot render must not own the
   * renderable kind, so `folio` is REGISTERED by core rather than declared
   * here. See `schemas/folio-graph-typology.ts`.
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
   * `check:graph-typology-work` for every state kind, which is how a new kind
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
   * `skills/kg/kg-core/content-context-and-state-graphs.md` carries the definition,
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
  /**
   * What every navigation surface CALLS a destination of this kind: the
   * viewer rail, the Jekyll sidebar, FOLDERS, the landing's viewer list, the
   * glass tiles and the Stickies row.
   *
   * Owner, 2026-10-01, bean `ob3m` finding 6, option 1 of 4, "One name
   * everywhere": each destination gets ONE label, used the same way on every
   * surface, and where the harness matters the surface APPENDS it as a
   * qualifier ("Skills · C@T Harness") rather than changing the base name.
   * Measured before: 7 destinations carried two names, among them `docs` vs
   * "Docs — cat-harness" and `methodology` vs "Methodologies".
   *
   * The plural display name for a count noun ("Skills", "Methodologies"),
   * and the collective noun otherwise ("Library", "Health"). Optional: a kind
   * that declares none is shown by {@link kindTitle}'s fallback. The single
   * reader is `scripts/lib/nav-label.ts`. A surface that composes its own
   * string is the defect this field exists to remove, and `check:nav-names`
   * fails it.
   */
  title?: string;
  // No `skill` (#1168, B3). A kind named the skill that says how to read it —
  // the general node naming its dependent, and read by nothing. The skill
  // now names the kinds it reads, in its front matter (`graph-typologies:`), and
  // `kg:audit` resolves each against this registry (`skill-graph-typologies-resolve`).
  /**
   * Where the shape of a node in this graph is defined — a repo-relative
   * module path, or a `$schema` tag the files themselves carry.
   *
   * Optional because not every kind has one answer: `cat-harness` holds node
   * kinds typed in different places — skills, workflows, roles, actors — and a
   * single pointer there would be a lie of precision rather than a fact.
   *
   * **It is NOT a validator**, and {@link GraphTypologyDef.validator} is why.
   */
  schema?: string;
  /**
   * What RUNTIME-VALIDATES a node of this kind — `module#Export`, naming a
   * Zod schema.
   *
   * ## Why this is not {@link GraphTypologyDef.schema}
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
   * | `cat-harness` | mixed `.ts` and `.json` | several node types; {@link GraphTypologyDef.schema} calls one pointer here "a lie of precision" |
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
   * **Mutually exclusive with {@link GraphTypologyDef.validator} and
   * {@link GraphTypologyDef.nodeSchemas}** — a kind cannot both have a runnable
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
   * its own filename** — and this is that rule at the graph-typology level. The
   * kind knows what its declaration is called; a directory name is a
   * filesystem accident.
   *
   * Absent means the kind has no nested declaration, and `declaredKinds`
   * falls back to the directory-name convention plus `graph.json` so an
   * unmigrated graph keeps working.
   */
  declarationFile?: string;
  /**
   * Is a directory of this kind GROUPED BY CONCERN — `<dir>/<group>/`, with
   * the groups named from within by {@link declarationFile} and drawn from
   * the `concern-group` code list (bean `9umr`; placement PR0c, bean `ejye`)?
   *
   * Owner, 2026-09-29: *"declared sub-graphs of cat-harness based on semantic
   * concern … dont need a separate facet. built into location."* — and the
   * split list of 2026-09-30: *schemas, skills, uml, processes, library,
   * tests*. A fact about the KIND, so a kind that groups cannot disagree with
   * itself between two declarations, the reason `perInstance` lives here.
   *
   * A group is declared ONCE, by the instance that declares the subgraph
   * (the harness), and inherited: each higher instance's same-named
   * `<dir>/<group>/` is a named MEMBER of it (option A, bean `1g4s`). So a
   * higher instance adds no group of its own. `scripts/concern-groups.ts`
   * resolves groups and members; `check:concern-groups` holds the rules.
   * Requires {@link declarationFile}, since that is where groups are named.
   */
  concernGroups?: true;
  /**
   * The kind this one is a SUB-GRAPH of, when it is one.
   *
   * Owner, 2026-09-23 (issue #1164): proposals live in *"a docs/proposals/
   * sub-graph declared sub-sub-graph (which starts closed in navbar, general
   * behavior)"*. GENERAL is the operative word: this is not a special case for
   * proposals, it is a relation any kind may declare, and every surface that
   * lists kinds draws a kind with `within` INSIDE its parent's row, folded
   * shut until the reader opens it. `check:graph-typology-within` holds the
   * relation to a registered kind and forbids a cycle.
   *
   * A relation between KINDS, not directories: the navbar lists graphs by
   * kind, and a directory nested on disk is not thereby a sub-graph (the
   * `beans/workflow/` history above is exactly that confusion).
   */
  within?: string;
  /**
   * The kind's mark, when the kind is DECLARED as a node (bean dmx1) rather
   * than listed here: it travels with the kind, so `schemas/avatars.ts` does
   * not have to be a second central table. A kind listed here keeps its entry
   * in `AVATARS`.
   */
  avatar?: { glyph: string; tone: number; reads: string };
  /** The navbar tile icon (a name in `TILE_GLYPHS`); on cat-harness's own kinds too since sod4 #5, so `graph-tiles.ts` keeps no table. */
  tileIcon?: string;
  /**
   * `false` keeps the kind out of every PUBLISHED graph: not one edge of a
   * published artefact may lead to it (`isPublishedGraphTypology`). Absent means
   * published. Was `UNPUBLISHED_GRAPH_TYPOLOGIES` in cat-harness.ts (sod4 #5).
   */
  published?: false;
  /**
   * The kind's directory may be scanned for SKILL BODIES (`*.md` with a
   * `name:` front matter). Was `SKILL_BEARING_GRAPH_TYPOLOGIES` (sod4 #5).
   */
  skillBearing?: true;
  /**
   * The kind IS harness knowledge-graph content — the `cat-harness` umbrella
   * and the kinds split out of it. Was `KG_CONTENT_GRAPH_TYPOLOGIES` (sod4 #5).
   */
  kgContent?: true;
  /**
   * What a directory of this kind HOLDS, as the kind table states it: the
   * editorial prose that used to be hand-written in that table's `contents`
   * column (owner, 2026-10-04: the prose moves onto the kind, and the table is
   * generated from it). Longer and more careful than `summary`, which stays
   * the one line a tile or a tooltip shows.
   */
  description?: string;
  /** A remark the table's `renderable` column carries beside yes/no ("the plain just-the-docs pipeline"). */
  renderableNote?: string;
  /** A directory of this kind may be declared by ANY layer, not only the kind's owner (the table's "and any layer"). */
  anyLayer?: true;
}

/**
 * The graph typologies the **harness itself** defines.
 *
 * **The map below is the only answer to how many, and this sentence deliberately
 * does not give one.** It read "Four, and deliberately none of them renderable"
 * over a map of fourteen — and the version before that read "Five" over a map of
 * four, which bean `5o3a` records #269 correcting. A count in prose is a claim
 * that has to be maintained, it was maintained wrongly twice, and nothing checks
 * it. `Object.keys(BASE_GRAPH_TYPOLOGIES).length` is checkable and free.
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
export const BASE_GRAPH_TYPOLOGIES: Readonly<Record<string, GraphTypologyDef>> = {
  // The META-KIND (bean dmx1): a directory of graph typology `typologies` holds the
  // harness's own graph typologies, one `folio-graph-typology/v1` node per file. Owner,
  // 2026-10-04: no central registry for subgraph types; a `typologies/` graph
  // (option 1 of 3). The base layer declares this one kind in code because a
  // reader needs it to find all the others.
  typologies: {
    description:
      "the graph typologies a harness declares it OWNS, one `folio-graph-typology/v1` node per file (`schemas/graph-typology-node.ts`), loaded by the registry on first use across every instance; a name two files declare is refused. Owner, 2026-10-04: *\"there should not be a central registry for declaring mount tools and subgraph types\"*, and a `typologies/` graph rather than a contributions hook or a field in `<instance>.json` (option 1 of 3). The base layer lists only this one kind in code, because a reader needs it to find the rest. Bean `dmx1`.",
    title: "Graph typologies",
    renderable: false,
    holds: "content",
    nodeSchemas: {
      "folio-graph-typology/v1": {},
    },
    summary:
      "The graph typologies a harness declares it owns, one node per kind, so no central registry " +
      "names another harness's subgraph types. Loaded across the instances on first use.",
  },
  // The second META-KIND (bean riit): a directory of graph typology `validators`
  // holds the validators a harness's code provides, one `folio-validator/v1`
  // node each, naming the kind and family it validates. The registry joins them
  // onto the kinds. Owner, 2026-10-04: validators are KG nodes, and the
  // validator names the family.
  validators: {
    description:
      "the validators a harness's code provides, one `folio-validator/v1` node each (`schemas/validator-node.ts`), naming the graph typology and `$schema` family it checks and the Zod export that checks it; the registry joins each onto its kind on first use, and refuses a second answer for one family. Owner, 2026-10-04: validators are KG nodes, and the validator names the family (option 1 of 2). Bean `riit`.",
    title: "Validators",
    renderable: false,
    holds: "content",
    nodeSchemas: {
      "folio-validator/v1": {},
    },
    summary:
      "The validators a harness's code provides, one node each naming the graph typology and $schema " +
      "family it checks and the Zod export that checks it, joined onto the kinds on first use.",
  },
  // The fourth and fifth META-KINDS (bean riit, step 3b): a harness's QA
  // checkers and pipeline-plugin implementations, one node each, registered
  // for a folio through its dependency tree. Owner, 2026-10-04: every
  // contribution is a node, one graph per contribution type.
  "qa-checkers": {
    description:
      "the QA checkers a harness's code provides, one `folio-qa-checker/v1` node each (`schemas/contribution-nodes.ts`): the criterion it answers, and the dispatch table (`path#Export`, keyed by the criterion) that holds the code. `loadContributions` registers them for every folio whose dependency tree includes the harness. Owner, 2026-10-04: every contribution is a node, one graph per type (option 1 of 2), scoped by the dependency tree (option 1 of 3). Bean `riit`, step 3b.",
    title: "QA checkers",
    renderable: false,
    holds: "content",
    nodeSchemas: {
      "folio-qa-checker/v1": {},
    },
    summary:
      "The QA checkers a harness provides, one node per criterion naming the table that holds the code; " +
      "registered for a folio through its dependency tree.",
  },
  "pipeline-plugins": {
    description:
      "the generic pipeline's slots a harness fills, one `folio-pipeline-plugin/v1` node each (`schemas/contribution-nodes.ts`): the slot (`content/pipeline/pipeline-plugins.ts`), and the table of implementations (`path#Export`, keyed by slot, typed against the slots' contract). `loadContributions` registers them for every folio whose dependency tree includes the harness. Bean `riit`, step 3b; the slots themselves are bean `squu`'s.",
    title: "Pipeline plugins",
    renderable: false,
    holds: "content",
    nodeSchemas: {
      "folio-pipeline-plugin/v1": {},
    },
    summary:
      "The generic pipeline slots a harness fills, one node per slot naming the table of implementations; " +
      "registered for a folio through its dependency tree.",
  },
  // The third META-KIND (bean riit, step 2): a directory of graph typology
  // `block-kinds` holds the block kinds a harness's adapter owns, one
  // `folio-block-kind/v1` node each. `block-kinds.ts` DISCOVERS them across
  // every instance; no module lists them.
  "block-kinds": {
    description:
      "the block kinds a harness's content adapter owns, one `folio-block-kind/v1` node each (`schemas/block-kind-node.ts`): the kind string, its adapter and narrowest profile, label prefix, RDF types, builder and English heading. `schemas/block-kinds.ts` discovers them across every instance's declared graph, so no module lists the kinds. Owner, 2026-10-04: *\"kinds need to be discoverable … not centrally managed\"*; document kinds live in folio-assistant-core and the math kinds in folio-assistant-sci (option 2 of 3). Bean `riit`, step 2; sod4 finding #1.",
    title: "Block kinds",
    renderable: false,
    holds: "content",
    nodeSchemas: {
      "folio-block-kind/v1": {},
    },
    summary:
      "The block kinds a harness's adapter owns, one node per kind carrying its label prefix, " +
      "RDF types, profile and builder. Discovered across the instances; no module lists them.",
  },
  // A content adapter's block VOCABULARY (bean riit, step 5): one
  // `folio-content-adapter/v1` node per vocabulary. `block-kinds.ts` derives
  // CONTENT_ADAPTERS from the typed ones; no module lists the vocabularies.
  "content-adapters": {
    description:
      "the block VOCABULARIES a harness owns, one `folio-content-adapter/v1` node each (`schemas/content-adapter-node.ts`): the name every block-kind node's `adapter` names, the companion roles its blocks can have, whether cat-harness's code types it, and for an untyped one its vocabulary module. `schemas/block-kinds.ts` derives `CONTENT_ADAPTERS` from the typed nodes and `schemas/block-qa.ts` derives `ADAPTER_COMPANION_ROLES`; an untyped vocabulary reaches a folio through its dependency tree. Owner, 2026-10-05, option 1 of 3: the vocabulary is a node and the server adapter CLASS is not, since the two do not line up (`document` has a class and no vocabulary, `dak` a vocabulary and no class). Bean `riit`, step 5.",
    title: "Content adapters",
    renderable: false,
    holds: "content",
    nodeSchemas: {
      "folio-content-adapter/v1": {},
    },
    summary:
      "The block vocabularies a harness owns, one node per vocabulary carrying its companion roles " +
      "and whether the platform's code types it. Discovered across the instances; no module lists them.",
  },
  tools: {
    tileIcon: "tools",
    description:
      "Tool definitions, themselves nodes in the KG",
    title: "Tools",
    renderable: false,
    // A Tool node is an authored definition of a mechanism. It says what this
    // instance CAN DO, not what anybody did.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
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
  // `kg` remains readable as a deprecated alias — see GRAPH_TYPOLOGY_ALIASES.
  "cat-harness": {
    kgContent: true,
    skillBearing: true,
    description:
      "the harness layer's own knowledge graph, where a directory holds MORE THAN ONE of its parts — in practice the `[\"schemas\", \"cat-harness\"]` entries, where it means \"a schema IS a knowledge-graph node\". Renamed from `kg` on 2026-09-19; `kg` still reads, deprecated. **Not itself deprecated** by the 2026-09-21 split: an alias maps one name to one name, and this would have to become three. A downstream declaration still saying `[\"cat-harness\"]` keeps parsing and keeps being scanned for skills; what it loses is the finer query, which it never had.",
    title: "Harness graph",
    // Its identity is its individual, `…/cat-harness/ns#graphTypology/cat-harness`
    // (`graphTypologyIri`). It was also a class, `KGraph`, from 2026-09-21 until
    // the per-kind classes went (bean `3r47`, 2026-09-30); the concept that
    // name stood for is bootstrap's Knowledge Graph. `kg` and `cat-harness`
    // remain two spellings of this one kind (GRAPH_TYPOLOGY_ALIASES).
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
  // An alias cannot express a split: `GRAPH_TYPOLOGY_ALIASES` maps one name to one
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
    tileIcon: "skills",
    kgContent: true,
    skillBearing: true,
    anyLayer: true,
    description:
      "Skill packages — the authored instruction bodies an Actor performs a Task from. A Skill is a **Capability with defined inputs and outputs**, stated generically so it is portable across forges, binaries and machines. Split out of `cat-harness` on 2026-09-21.",
    title: "Skills",
    // THE FROM-WITHIN NODE for a skills directory (bean cmsl, owner
    // 2026-09-30, round 4): `skills/skills.json` names the instance
    // directories declared inside `skills/` — `voices/`, and `lean/` in
    // folio-assistant-sci — so the nesting is declared where the #980 ruling
    // says it must be, never by a root declaration reaching down.
    declarationFile: "skills.json",
    // Its `topics` ARE its concern groups (bean 9umr) — the first kind that
    // grouped, and the shape every other grouping kind now follows.
    concernGroups: true,
    renderable: false,
    // A Skill is a Capability with defined inputs and outputs — an authored
    // instruction body. It states what can be done, never what was done.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-voice/v1": {},
      "folio-voice-skill/v1": {},
      // A synced remote skill's pinned, per-file fixity record (issue #556).
      "folio-remote-skill/v1": {},
      // `skills.json`, the node that names a skills directory's TOPICS (bean `9umr`).
      "skill-topics/v1": {},
    },
    // bootstrap's own sentence, read rather than restated (bean r3gy, D1).
    summary: BOOTSTRAP_GRAPH_TYPOLOGIES["skills"],
  },
  processes: {
    tileIcon: "processes",
    kgContent: true,
    anyLayer: true,
    description:
      "Executable BPMN processes and the DMN tables their gateways compute from. The diagrams are the source of truth rather than illustrations of one. **Where a running instance GOT TO is not here** — that is `workflow-state`, which is `state` rather than `content`. Two questions, two graphs. Split out of `cat-harness` on 2026-09-21.",
    title: "Processes",
    // Grouped by concern from within: `processes/processes.json` names the
    // groups, `processes/<group>/` holds them, a DMN under
    // `processes/<group>/decisions/` (placement proposal §1.2, PR0c).
    declarationFile: "processes.json",
    concernGroups: true,
    // No `nodeSchemas` entry for its `concern-groups/v1` file: this kind
    // states `validatorNotApplicable`, and the two are exclusive. That one
    // file is graded by `check:concern-groups`, which parses it with
    // `ConcernGroupsSchema`.
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
    // bootstrap's own sentence, read rather than restated (bean r3gy, D1).
    summary: BOOTSTRAP_GRAPH_TYPOLOGIES["processes"],
  },
  scenarios: {
    kgContent: true,
    anyLayer: true,
    description:
      "Actors, the Roles they take on, and the User Stories those Roles serve. `roles.json` and `stories.json`; a User Story points at its Role (#1168), where it was once free text on the role. Split out of `cat-harness` on 2026-09-21.",
    title: "Scenarios",
    renderable: false,
    // Actors, the Roles they take, and the User Stories those Roles serve.
    //
    // `roles.json` and `stories.json`. A User Story points at its Role
    // (#1168); it was `Role.useCases`, free text on the role, until then —
    // the gap this kind was named ahead of, so that fixing it needed no rename.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    // bootstrap's own sentence, read rather than restated (bean r3gy, D1).
    summary: BOOTSTRAP_GRAPH_TYPOLOGIES["scenarios"],
  },
  // ── What an Actor may do: W3C ODRL 2.2 policies — issue #1180 ──────────
  //
  // Owner, 2026-09-23: permissions are *"W3C ODRL 2.2"*, and policies are
  // their own graph typology rather than a file inside `scenarios`. A policy is
  // authored, and is true whether or not anything reads it, so it `holds`
  // content like the role graph beside it: it owes no viewer.
  policies: {
    anyLayer: true,
    description:
      "What an Actor may DO: W3C ODRL 2.2 policies (issue #1180). One rule per (assignee, action), scoped by `cat-harness:process`, `cat-harness:task` and `cat-harness:role` constraints when it needs to be; actions are the profile in `skills/permissions/permissions.json`, inheriting through `includedIn`. A downstream instance inherits these with ODRL's `inheritFrom` instead of copying them. No login is ever written here: identity is the data store's.",
    title: "Policies",
    renderable: false,
    holds: "content",
    schema: "schemas/odrl.ts",
    // declared-path-literal: this table IS the declaration, as on `health`.
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
    anyLayer: true,
    description:
      "judgement methodologies, one sub-graph each — a NAMED, EXTERNAL way of reaching a judgement, adopted whole. `kepner-tregoe` for a decision, `madr` for its record, `dmn` for the computable case, `grade` for certainty of evidence. They are **parallel rather than composable**: which applies is contextual, and blending them gives a house method that cites nobody. A separate kind from `cat-harness` for three properties a skill lacks — extractable (adopted work lifts out with its declaration when the field moves on), referenced rather than inlined (two skills quoting one method is two copies free to drift), and exempt from `skill-is-brief`, since a faithful rendering of an external standard must not be truncated to a house limit. Any layer may declare one: the harness carries the domain-neutral methods, `smart-kg` carries GRADE. Governed by [`methodology-adoption`](../../process/process-core/methodology-adoption.md).",
    title: "Methodologies",
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
  // `folio-graph-typology.ts`: "a layer that cannot render must not own the
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
    description:
      "documentation **about** the knowledge graph — how the harness works, what its directories hold, how a process runs. Distinct from `folio` by its SUBJECT, not its format. Added 2026-09-20: this table carried no renderable harness kind until the harness gained a plain just-the-docs renderer, and the rule reads in its true form — a layer owns the kinds it CAN render.",
    renderableNote: "the plain just-the-docs pipeline, no extensions",
    title: "Docs",
    perInstance: true,
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
      "folio-todo-index/v1": {},
      "folio-semantic-zoom/v1": {},
      "folio-qa-graph/v1": { shape: "content/pipeline/qa-graph-index.ts#QaGraphIndex" },
      "folio-translation-index/v1": { shape: "content/pipeline/translation-index.ts#TranslationIndex" },
      "folio-bean-index/v1": { generated: true },
      "node-kind-index/1.0.0": { generated: true },
      "folio-translation-status/v1": { generated: true },
      "folio-schema-graph/v1": { generated: true },
      "folio-library-index/v1": { generated: true },
      // The per-entry block graph, one file per library entry (bean `7nvr`).
      // Same writer as the index and deliberately a SEPARATE family: the index
      // answers "what entries are there" and this answers "what is in one",
      // and the corpus holds 1715 blocks over ~1 MB against a 44 KB index, so
      // they are fetched at different times by different questions.
      "folio-library-entry/v1": { generated: true },
      "folio-voices-index/v1": { generated: true },
      "folio-graph-projection/v1": { generated: true },
      // The media-type sidecar beside each content-addressed payload under
      // docs/payload/sha256/ (bean `f233`), written by gen-subgraph-jsonld.
      // Its validator is the node `validators/payload-sidecar.json`.
      "cat-harness-payload/v1": { generated: true },
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
    description:
      "proposals for the harness's own features — initial analysis, MVP, options — argued before they are agreed. A **sub-graph of `docs`** (`within: \"docs\"`), declared from within by `docs/docs.json`; the navbar folds it under Docs. Issue #1164.",
    renderableNote: "its pages are built by `docs`",
    title: "Proposals",
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
    description:
      "what the harness promises, one page per shipped feature: a proposal MOVED here on ship, its front matter a `Requirement` (`bootstrap/schemas/requirement.schema.json`), checked by `check:requirements`. A **sub-graph of `docs`**, declared from within. Issue #1164.",
    renderableNote: "its pages are built by `docs`",
    title: "Requirements",
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
  "auto-docs": {
    description:
      "derived indexes over the other graphs — one page per auto-doc TYPE crossed with each SUB-GRAPH that type reaches, written by `scripts/gen-auto-docs.ts` and never by hand. A **sub-graph of `docs`** (`within: \"docs\"`), declared from within by `docs/docs.json`; its own sub-sub-graphs are named one level further down by `auto-docs.json`, which is GENERATED from that script's `TYPES` because they carry `collect()` functions that cannot live in JSON. `derived`, and the question that settles it against its parent is the same one everywhere: a `docs` page is RE-AUTHORED, an index is REGENERATED. Bean `xsrv`, owner 2026-10-03.",
    renderableNote: "its pages are built by `docs`",
    // NOT a site of its own: its pages are built by `docs`, which it is
    // `within`. The harness still owns exactly one renderable kind — the same
    // reason `proposals` and `requirements` are false above.
    renderable: false,
    within: "docs",
    // THE FROM-WITHIN NODE, one level further down. `docs/docs.json` names
    // this kind as a sub-graph of `docs`; this file names ITS sub-sub-graphs,
    // one per auto-doc TYPE. The owner, 2026-10-03: *"auto-docs is one
    // declared subgraph, with declared sub-sub-graphs per writer."* Bean
    // `xsrv`.
    //
    // It is GENERATED, and that is load-bearing rather than incidental:
    // `gen-auto-docs.ts` already holds the types in `TYPES`, whose `collect()`
    // functions cannot live in JSON. A hand-kept copy would be a second answer
    // to "what auto-doc types exist", free to disagree the moment either
    // moves.
    declarationFile: "auto-docs.json",
    // `derived`, by the three questions `content-context-and-state-graphs`
    // asks. Does a process write it? YES — `gen-auto-docs.ts`, every build.
    // Does it stand on its own? NO — every page is an index OF another graph,
    // and detached from that graph it lists nothing. Regenerate or re-author?
    // REGENERATE, purely: there is no authored byte in any of these pages, and
    // deleting one costs a command rather than a decision.
    //
    // That last answer is what separates it from its parent. `docs` is
    // `content` because you would RE-AUTHOR a docs page; you would never
    // re-author an index, and an index somebody hand-edited is a defect rather
    // than a contribution — which is why the subject check refuses a generated
    // page (`check:docs-populated`) and why this arc keys the family by
    // `route` rather than by `tip`.
    holds: "derived",
    validatorNotApplicable:
      "its nodes are generated index PAGES — HTML and markdown with no fixed JSON shape — so a registry " +
      "validator would be a category error, as on `proposals`. What is checked mechanically is the " +
      "derivation instead: `auto:docs:check` fails on a stale page, and refuses outright when a type " +
      "collects nothing while its graph's directories hold files, which is a moved source rather than an " +
      "empty graph (bean `06e3`).",
    summary:
      "Derived indexes over the other graphs — one page per auto-doc TYPE crossed with each SUB-GRAPH " +
      "that type reaches. A sub-graph of `docs`, written by `scripts/gen-auto-docs.ts` and never by hand. " +
      "Distinct from `docs` itself by the one question that settles the layer: a docs page is re-authored, " +
      "an index is regenerated.",
  },
  "external-schema": {
    description:
      "the specifications this instance depends on (`external-schemas/`) — one record per specification, pinning the EDITION in use, with the operative terms DERIVED from the corpus rather than hand-listed. `content`, and the call goes against the obvious reading: a process DOES write these files (`external-schemas.ts --write` refreshes `terms[]`), which sounds like `state`, but the axis asks what the graph IS and the subject matter here is a DECISION — which specifications we depend on, at which edition, and what each term operatively means. `derived` would be destructive: it says \"regenerate it\", and regenerating a deleted record recovers neither the authored edition, nor the `usedBy` blast radius, nor a line of the `operative` prose. UNDECLARED until 2026-09-22, which is `dh4f` inverted — a held directory nothing declares, so every consumer fanning out over declared directories skipped a registry pinning four external namespaces. Governed by [`vocabulary-authority`](vocabulary-authority.md) and [`schema-management`](schema-management.md).",
    title: "External schemas",
    perInstance: true,
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
    // A SECOND family in the same directory — bean `7wou`. A record pins an
    // edition; this is that edition's CONTENT, snapshotted so
    // `check:term-mapping`'s fhir half can assert "this code is in the
    // published IG at version X" offline. The directory is a place to look
    // and the file declares what it is, which is why `loadSpecs` now reads
    // `$schema` instead of parsing every `*.json` as a record.
    // BOTH families are listed. Declaring `nodeSchemas` at all makes this the
    // complete account of the directory, so the record's own family has to
    // appear beside the new one — `check:kind-validators` reports an unlisted
    // family as unmapped, which is the right answer and the reason the
    // kind-level `validator` above is not a fallback.
    nodeSchemas: {
      "folio-external-schema/v1": {},
      "folio-pinned-terminology/v1": {},
    },
    summary:
      "The specifications this instance depends on — one record per specification, pinning the " +
      "EDITION in use, with the operative terms derived from the corpus rather than hand-listed; " +
      "and, beside a record, the pinned edition's own codes where something resolves against them.",
  },
  // Code lists — a closed set of codes, each with a label, a definition and a
  // source, published as a SKOS concept scheme (schemas/code-list.ts). Owner,
  // 2026-09-23: "list of codes and corresponding narrative desc and source
  // should be part of a node/asset". `content`, by the same argument
  // `external-schema` makes: the subject matter is a DECISION — which answers
  // an adjudication may give, which namespaces are ours — and a person makes
  // it. Diagrams and `schemas/namespaces.ts` READ these; nothing writes them.
  "code-list": {
    description:
      "closed sets of codes (`code-lists/`) — one `folio-code-list/v1` file per list, each code with a label, a definition, a source and, where it stands for one, a value; published as SKOS concept schemes. `content`, by the same argument as `external-schema`: the subject matter is a DECISION — which answers an adjudication may give, which namespaces are ours — and a person makes it. Diagrams (`<cat-harness.processes:adjudication list>`) and `schemas/namespaces.ts` READ these. Owner, 2026-09-23. Governed by [`code-lists`](../../library/library-core/code-lists.md).",
    title: "Code lists",
    renderable: false,
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    summary:
      "Closed sets of codes — adjudication answers, the namespaces this project mints — one file " +
      "per list, every code carrying its definition and source, published as SKOS.",
  },
  // Vocabulary mappings — one value carried into several target vocabularies,
  // declared as data rather than as a line in a generator
  // (schemas/vocab-mapping.ts). Bean `k74z`, owner 2026-10-02: option 1 of
  // `docs/proposals/vocabulary-mappings-2026-10-02.md`. `content`, by the
  // `code-list` argument: which predicate a field becomes, and which of two
  // is authoritative, is a DECISION somebody makes. Generators read these
  // through the `vocab-map` Tool; nothing writes them.
  "vocab-mapping": {
    description:
      "vocabulary mapping tables (`vocab-mappings/`) — one `folio-vocab-mapping/v1` table per source content type and target node, saying which source field becomes which target predicate and with what relationship. Shaped like a FHIR ConceptMap: an existing ConceptMap is representable here, and a table can be produced as one with every loss reported (`schemas/vocab-mapping-fhir.ts`). `content`, by the `code-list` argument: which predicate a field becomes, and which of two is authoritative, is a DECISION. Generators READ these through the `vocab-map` Tool; nothing writes them. Owner, 2026-10-02 (bean `k74z`). Governed by [`vocabulary-authority`](vocabulary-authority.md).",
    renderable: false,
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    summary:
      "Vocabulary mappings — which source field becomes which target predicate, with its stated " +
      "relationship, one ConceptMap-shaped table per source and target; representable from and " +
      "producible as a FHIR ConceptMap.",
  },
  schemas: {
    tileIcon: "schemas",
    description:
      "schema definitions, self-declared in the smart-base manner",
    title: "Schemas",
    // Grouped by concern from within (`schemas/schemas.json`), PR0c.
    declarationFile: "schemas.json",
    concernGroups: true,
    renderable: false,
    // A shape is the subject matter of the schema graph. It is true before
    // anything is validated against it.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      // The FROM-WITHIN node naming this directory's concern groups
      // (placement PR0c): `concern-groups/v1`.
      "concern-groups/v1": {},
      "http://json-schema.org/draft-07/schema#": { external: "JSON Schema draft-07" },
      "https://json-schema.org/draft/2020-12/schema": { external: "JSON Schema 2020-12" },
      "folio-source-descriptor/v1": {},
    },
    // bootstrap's own sentence, read rather than restated (bean r3gy, D1).
    summary: BOOTSTRAP_GRAPH_TYPOLOGIES["schemas"],
  },
  // UML renderings of the declared sub-graphs — one `.puml` and one `.mmd`
  // per named sub-graph and per instance, both written from one model by
  // `scripts/gen-uml-overview.ts`. `derived`: regenerated, never authored, so
  // a finding against one is a finding against the generator or its inputs.
  uml: {
    description:
      "UML class diagrams of every named sub-graph a harness declares (`uml/overview/<instance>/<sub-graph>.puml` and `.mmd`), written from one model by `scripts/gen-uml-overview.ts` and rendered on `docs/uml/overview/`. The groupings are the declaration entries; the classes are read from each graph typology's registered `validator`, so a kind with none is drawn as *could not determine*. `derived`: regenerated, never authored.",
    title: "UML",
    // Grouped by concern from within (`uml/uml.json`), PR0c — one generated
    // pair per declared sub-subgraph, so the grouping is the generator's input.
    declarationFile: "uml.json",
    concernGroups: true,
    // No `nodeSchemas` entry for its `concern-groups/v1` file: this kind
    // states `validatorNotApplicable`, and the two are exclusive. That one
    // file is graded by `check:concern-groups`, which parses it with
    // `ConcernGroupsSchema`.
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
      "its graph typologies register — PlantUML and Mermaid from one model.",
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
    description:
      "QA verdicts and their projections under `test/results/` — **seven `$schema` families**, each named in the kind's `nodeSchemas` (see §\"Node schemas, one per `$schema` family\"): `kg-qa/v1`, `block-qa/v1` and `folio-test-run/v1` are Zod-validated, `qa-witness/v1`, `qa-results/v1` and `translation-qa/v1` are TypeScript shapes, and `folio-qa-index/v1` has no declared type at all. This row said \"one `qa-witness/v1` document per subject\" until 2026-09-23, when 591 of the 728 nodes were other families. Generated, never hand-edited. **The checkout holds the WORKING COPY; the record is on the orphan `qa-reports` branch**, keyed `main/<sha>/` or `pr/<n>/<sha>/`, written by the CI job `qa-publish` through `scripts/qa-store.ts` (arc `3fva`) — see §\"`storage` — a directory kept on a branch\". Judgements are not here: they are the `attestations` kind. Read witnesses with the [`qa-witness`](../../sdlc/sdlc-core/qa-witness.md) skill.",
    title: "QA",
    perInstance: true,
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
      "kg-qa/v1": {},
      // The auditor's identity for the `kg-qa/v1` files beside it — one per
      // instance, not one per sidecar, for the reason `KG_QA_MANIFEST_SCHEMA`
      // gives. Registered under `skills` until 2026-09-27, because the file
      // lived in `skills/`; it moved to `test/results/` when auditing every
      // instance made the old home CREATE a skills directory holding no skills,
      // and this registration had to move with it. A kind claiming a `$schema`
      // whose files live in another kind's directory is a validator aimed at
      // nothing.
      "kg-qa-manifest/v1": {},
      "block-qa/v1": {},
      "folio-test-run/v1": {},
      "qa-witness/v1": { shape: "content/pipeline/qa-witness.ts#QaWitness" },
      "qa-results/v1": { shape: "scripts/qa-results.ts#QaResult" },
      "translation-qa/v1": { shape: "content/pipeline/translation-block-qa.ts#TranslationBlockQaReport" },
      // Written inline by two call sites and typed by neither — recorded,
      // not invented. `qa-graph-index.ts` names the tag only to say it is
      // NOT its own (`NOT_TO_BE_CONFUSED_WITH`).
      "folio-qa-index/v1": { generated: true },
      // Which authored pages have a translation projection (bean `4l4d`) —
      // the list `head_custom.html` once read from `_data/`, now an asset.
      "folio-qa-translation-pages/v1": { generated: true },
      // The detangle sidecars, in cat-harness
      // qa directory. `detangle` was its own instance until 2026-09-23 and is
      // now a directory of this harness (bean `byql`), so the shape is an
      // ordinary instance-relative path under `schemas/` and needs no `detangle:` qualifier.
      "folio-detangle-sidecar/v1": { shape: "schemas/detangle-sidecar.ts#DetangleSidecar" },
      // The per-graph LSI index sidecar (bean `ansc`): fingerprint, pole terms,
      // neighbours and findings — never the vectors.
      "folio-lsi-index/v1": { shape: "scripts/lsi.ts#LsiSidecar" },
      // A downstream tool's run record (bean `fq5u`): outcome and input
      // fingerprint, read by kg:audit's `tool-downstream-fresh`.
      "folio-tool-run/v1": {},
      // The viewer-navbar audit (bean `edx7`). A VERDICT PER PAGE rather than
      // a count, because the owner's rule has two clauses -- present unless
      // EXPLICITLY removed -- and a count cannot tell a deliberate removal
      // from a generator nobody wired.
      "viewer-nav-qa/v1": {},
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
    description:
      "repository health reports — one `\"$schema\": \"health-report/v1\"` document per sweep, carrying each check's three-state verdict, the thresholds it applied and the **basis** each threshold was chosen on. A separate kind from `qa` because the SUBJECT differs, not the producer: a QA verdict judges an artefact this instance produced, a health report judges the instance itself — its size, its publish branch, its work plan. Generated by `test/health/run.ts`; never hand-edited. Shape in `schemas/health-report.ts`.",
    title: "Health",
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
  },
  // QA ATTESTATIONS — the judgement half of a QA verdict (bean `2gst`, arc
  // `3fva`). Split out of the `qa` kind by owner ruling D2 (a), 2026-10-01:
  // derived script verdicts move to the `qa-reports` branch, and every
  // non-script verdict stays on main. A `kg-qa/v1` sidecar used to carry its
  // `pair_attestations` and `voice_reviews` beside script verdicts, so moving
  // the file would have taken the judgements with it — and every reader read
  // an absent sidecar as "never attested" and re-baselined (defect C4 of the
  // reader audit). A SEPARATE kind, not a `nodeSchemas` row under `qa`,
  // because the two answer different questions about deletion: a `qa` file can
  // be regenerated from the tree, an attestation cannot.
  //
  // `state` by the one question, the same answer `review-verdicts` gives: a
  // running audit WRITES it (a first-sight baseline, an attestation that moves
  // with the prose), and detached from the subject it judges it asserts
  // nothing. `recordsWork: false` — a judgement is finished, not in flight.
  //
  // ONE layout for every family — bean `8wj1` (block-qa, translation-qa) is a
  // member of the same `QaAttestationsSchema` union, not a second store:
  // `<attestations dir>/<family>/<mirrored subject path>.attestations.json`.
  attestations: {
    description:
      "the JUDGEMENT half of a QA verdict, kept apart from the derived half: one `qa-attestations/v1` file per subject at `test/attestations/<family>/<mirrored subject path>.attestations.json`, where `<family>` is the derived family it sits beside (`kg-qa`, bean `2gst`; `block-qa` and `translation-qa`, bean `8wj1` — whose derived reports keep a projection composed from the store). Split out of `qa` by owner ruling D2 (a), 2026-10-01 (bean `2gst`): derived verdicts move to the `qa-reports` branch, and judgements stay on main, where a `git rm` of derived results cannot reach them. A separate kind because the two answer the deletion question differently: a `qa` file can be regenerated, an attestation cannot. Every entry pins the hash it attested, so a stale one is detectable. `state`, like `review-verdicts`. Reads answer hit / miss / absent / corrupt / unknown. On a miss or an absent store a WRITER moves the judgements a prior derived file still carries into the store as it saves (owner ruling 2, 2026-10-01); a corrupt or unreadable store is `unknown` and refused. Shape in `schemas/qa-attestations.ts`.",
    renderable: false,
    holds: "state",
    recordsWork: false,
    summary:
      "QA attestations — the judgements a QA family carries across runs (pair attestations, voice " +
      "reviews, agent and human verdicts), one `qa-attestations/v1` file per subject, mirroring the " +
      "derived family's tree. Kept on main where deleting derived results cannot reach them; each " +
      "entry pins the hash it attested, so a stale one is detectable.",
    schema: "schemas/qa-attestations.ts",
    // declared-path-literal: this table IS the declaration, as on `health`.
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
    anyLayer: true,
    description:
      "Source code — the modules, scripts and entry points an instance holds. Registered 2026-09-22 (bean `ylj7`) after a measurement: most of this repository's `.ts` files sat in no declared directory — **re-derive it with `bun run check:code-accounting` rather than reading a number here, because it moves every round** — " +
      "so the one property every checker here depends on — *an undeclared file is one no checker has a reason to look at* (`v8gh`) — did not hold for most of the code. The owner's first proposal was to move everything under `<stub>/src`; the measurement confirmed the **mechanism** and argued against the **destination**, because `schemas/` is already a declared graph, `content/pipeline/` is core's subject, and `scripts/` are entry points named **by path** in `package.json` and CI. So they are declared where they are, and `<stub>/src` is the convention for new instances. `content`: authored with an intention, re-authored rather than regenerated, and it stands on its own. **Not renderable** — `renderable` asks whether the graph is wired to the site build as pages, and the generated references are built from schemas and skills, not from this. Being declared says nothing about whether a Tool node **claims** the code; that is a second axis, and beans `d308` and `ce65` own it. `check:code-accounting` reports both and refuses to average them.",
    title: "Code",
    // Grouped by concern from within (`<dir>/code.json`), PR0c — for the TEST
    // directories first: unit tests in `scripts/tests/<group>/`, e2e in
    // `test/<group>/` (owner ruling 5, 2026-09-30: "split along same semantic
    // lines as skills"). `code` rather than a new `tests` kind: a test file is
    // code, and the grouping is a fact about location, not a new kind.
    declarationFile: "code.json",
    concernGroups: true,
    // No `nodeSchemas` entry for its `concern-groups/v1` file: this kind
    // states `validatorNotApplicable`, and the two are exclusive. That one
    // file is graded by `check:concern-groups`, which parses it with
    // `ConcernGroupsSchema`.
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
    description:
      "QA reports — one `qa-report/v1` document per TOOL RUN, carrying that run's own successes, warnings and errors, the files it processed, the files it **expected** and the ones that were missing, plus the provenance and toolchain versions upstream records nowhere. A third subject beside its two neighbours, and that is the whole reason it is a separate kind: a `qa` witness judges an **artefact**, a `health` report judges the **repository**, a `qa-report` records an **execution**. Registered 2026-09-22 on evidence rather than design — every DAK pre/post script already writes exactly this document and the IG Publisher already writes `qa.json`, and nothing downstream read either. Upstream's snake_case field names are kept deliberately, so an upstream report validates byte for byte and a change upstream fails instead of being quietly re-mapped. `state`: a running process writes it. Three rules are structural rather than left to a checker — a summary may not disagree with the details it counts, `files_missing` must be a subset of `files_expected`, and `running` is never a pass. Shape in `schemas/qa-report.ts`.",
    title: "QA reports",
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
  },
  // Test plans -- what a SYSTEM UNDER TEST must do, case by case, and the DMN
  // rule that decides whether it did. Strawperson, bean `ygzh` (arc `3fva`,
  // proposal §3.2), shaped after the held FHIR R5 TestPlan source.
  //
  // `content` by the one question: a running process READS a plan and never
  // writes it -- the tester resolves it, the certifier applies its
  // `exitCriteria` -- and somebody authors it with an intention. It also
  // passes both supporting questions: detached from every run it still says
  // what is required, and you would re-author it rather than regenerate it.
  // NOT `context`, the near miss: `context` is a record ABOUT content, read
  // at session start; a plan is the subject matter of a certification, as a
  // skill is of an agent's work. That is also why the run points at the plan
  // and never the reverse -- a plan listing its runs would be rewritten by
  // every execution, which is content turned into state.
  //
  // NOT renderable: `renderable` asks whether the graph is wired to the SITE
  // BUILD, and nothing in the docs build reads a plan. Saying `true` would
  // promise a page per plan that no generator makes.
  //
  // Declared, no directory: nothing authors a plan yet. Plan #1 is
  // `crdm-detect` (§3.3), and no fixture was manufactured to make a count
  // non-zero -- the row `qa-report` and `binary-release` also carry.
  "test-plan": {
    description:
      "test plans — one `test-plan/v1` document per plan, shaped after the held FHIR R5 TestPlan source: the system-under-test kind and version range, the `req:` requirements it is evidence for, test cases whose assertion ids are criterion ids, test data that is either FIXED (committed, and evidence once reviewed) or GENERATED (template + params + seed, never stored materialised — bean `vm6m`), and the certification rule as a DMN reference. Strawperson, bean `ygzh`. `content`: a process reads a plan and never writes it, and it still says what is required when detached from every run. The run points at the plan and never the reverse, because a plan listing its runs would be rewritten by every execution. Declared, no directory. Shape in `schemas/test-plan.ts`.",
    renderable: false,
    holds: "content",
    summary:
      "Test plans -- one `test-plan/v1` document per plan, in the FHIR R5 TestPlan shape: the " +
      "system-under-test kind and version range, the `req:` requirements it is evidence for, " +
      "test cases whose assertions are criterion ids, fixed (reviewed) or generated " +
      "(template + params + seed) test data, and the certification rule as a DMN reference.",
    schema: "schemas/test-plan.ts",
    // declared-path-literal: this table IS the declaration, as for `health`.
  },
  // Test reports -- the verdicts ONE run of ONE plan reached against ONE
  // system under test, with a per-plan rollup. Strawperson, bean `ygzh`.
  //
  // `state` by the one question: the tester's run WRITES it, and it fails the
  // stand-alone test the way `qa` and `qa-report` do -- detached from the plan
  // and the system it judges, a list of case ids marked `pass` asserts
  // nothing. NOT `derived`: re-running a plan against a system produces a NEW
  // report under a new run id rather than the same one again, which is the
  // line `qa-report` and `binary-release` already draw.
  //
  // A separate kind from `qa-report`, and the difference is the subject: that
  // records what a TOOL said about its own run; this records what a TESTER
  // found about SOMEBODY ELSE -- the system under test, which the schema
  // forbids from writing its own verdict. Folding them would hand a certifier
  // a script's self-report as if it were a test result.
  //
  // `recordsWork: false` -- live state, but nothing anybody is partway
  // through. A running report is a run in flight, not a work item, and
  // `testReportVerdict` reports it as `unknown` rather than as clean.
  //
  // NOT renderable, for the reason `health` and `qa-report` give: the site
  // build does not read it. The owner's `py74` ruling -- separate family
  // panels, never one total -- governs any dashboard later built over it,
  // and the schema already refuses a total.
  //
  // Declared, no directory: proposal §3.2 writes these to the `qa-reports`
  // branch under `tests/<plan-id>/<sut>/<run-id>/`, which does not exist yet
  // (beans `ygzh` and the branch work in arc `3fva`).
  "test-report": {
    description:
      "test reports — one `test-report/v1` document per run of a plan against a system under test, per-case verdicts in the block-qa entry shape, and a rollup for that ONE plan. **Never a total across plans** — the owner's `py74` ruling, enforced by a strict top level that has no field for a second plan or a total. Strawperson, bean `ygzh`. `state`: the run writes it, and re-running produces a new report rather than the same one. A separate kind from `qa-report` because the subject differs — that is a tool's account of its OWN run, this is a tester's finding about SOMEBODY ELSE, which is why the system under test may not write its own verdict. The rollup may not disagree with the cases, and `running` is never a pass. Written to the `qa-reports` branch under `tests/<plan-id>/<sut>/<run-id>/`; declared, no directory. Shape in `schemas/test-report.ts`.",
    renderable: false,
    holds: "state",
    recordsWork: false,
    summary:
      "Test reports -- one `test-report/v1` document per run of a plan against a system under " +
      "test: per-case verdicts in the block-qa entry shape, a rollup for that ONE plan that may " +
      "not disagree with its cases, and never a total across plans. `running` is never a pass, " +
      "and the system under test never writes its own verdict. Generated by the run.",
    schema: "schemas/test-report.ts",
    // declared-path-literal: this table IS the declaration, as for `health`.
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
    description:
      "(renamed from `glossary` on 2026-09-23, owner: \"Rename harness one\") the swimlane glossary's retirement ledger (`glossary/`) — every concept this instance has ever minted, with the date it was first seen and the date it stopped being derivable. `state` but **not** work (`recordsWork: false`): a bean is something somebody is partway through, this is a record that a term exists. Only the ledger is stored — the glossary DOCUMENT is derived from the corpus each run, which is exactly why the ledger has to exist: a derived document has no memory, so without it a retired term and one that never existed look the same. Written by `scripts/glossary-export.ts`; read with the [`swimlane-glossary`](../../process/process-core/swimlane-glossary.md) skill.",
    title: "Swimlane glossary",
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
      "glossary-ledger/1.0.0": {},
    },
    // NOT work. A bean is something somebody is partway through; this is a
    // record that a term exists, true whether or not anybody is doing
    // anything. `check:graph-typology-work` refuses a `state` kind that has not
    // decided, and it was right to: "state" alone does not say whether a
    // reader is looking at a queue or at a fact.
    recordsWork: false,
    // cat-harness's own kind since 2026-09-30 (owner, bean `xsqm`): the
    // ledger is harness state, hosted here for every instance it exports,
    // so the kind moved up from bootstrap with it. Written by
    // scripts/glossary-export.ts; the glossary document itself is derived and
    // not stored here — only the ledger, the one fact that cannot be re-derived.
    summary:
      "A Subgraph recording every term a Knowledge Graph's Processes have ever named, and when each stopped being used, so a retired term is never silently reused.",
  },
  models: {
    description:
      "which languages a model is good at, and whether a human checked (`models/models.json`). `context`: READ when a session opens, never written by a process — a person grants a validation, an agent never does, because a model's own claim about its languages is precisely what the validation state exists to distrust. In BOOTSTRAP because an agent reaching for the language it should communicate in has not yet loaded the harness that would otherwise answer. One INPUT to the [`communication-language`](../../conduct/conduct-core/communication-language.md) determination, never the answer.",
    title: "Models",
    renderable: false,
    // `context`: READ when a session opens, never written by a process. That
    // is the whole point of the kind — a person grants a validation, an agent
    // never does, because a model's own claim about which languages it
    // handles well is precisely what the validation state exists to distrust.
    // A `state` kind would say a process may write it, and the first process
    // that did would be manufacturing its own evidence.
    holds: "context",
    // declared-path-literal: this table IS the declaration, as on `health`.
    validator: "bootstrap-tools:schemas/model-registry.ts#ModelRegistrySchema",
    // bootstrap's own sentence, read rather than restated (bean r3gy, D1).
    // The harness's detail, formerly in the summary: read when a session opens
    // as ONE input to the communication-language determination and never as
    // the answer; declared in bootstrap because an agent reaching for it has
    // not yet loaded the harness.
    summary: BOOTSTRAP_GRAPH_TYPOLOGIES["models"],
  },
  beans: {
    tileIcon: "beans",
    description:
      "the work plan as a whole (`beans/`); its inner nodes are declared by `beans/beans.json`",
    title: "Beans",
    perInstance: true,
    renderable: false,
    // The work plan. Its own declaration already splits WHAT IS BEING WORKED
    // ON from WHERE IT GOT TO — both are records about content, neither is
    // content.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    // EVERY nested kind's `$schema` family belongs here, not only on the child.
    // `check:kind-validators` routes a node by the family map of the kind whose
    // DIRECTORY contains it, and the directory is `beans/` — so a family
    // declared solely on the child is unmapped the moment a node of it exists.
    // `folio-workflow-instance/v1` is `workflow-state`'s family and was already
    // here for exactly this reason; `folio-session-survey/v1` is
    // `session-survey`'s and was not, because until 2026-09-27 no survey had
    // ever been published and a map with no nodes cannot be caught failing to
    // route one (`1xhc`).
    nodeSchemas: {
      "folio-workflow-instance/v1": { shape: "src/workflow/instance.ts#InstanceState" },
      // Runnable, unlike its neighbour: `SessionSurveySchema` is a Zod schema,
      // so a published survey is PARSED rather than merely typed.
      "folio-session-survey/v1": {},
      // `merge-queue`'s family, missing for the same reason as the survey's:
      // no queue entry existed until the steward's first ACKs on 2026-10-04,
      // and the first one made `check:kind-validators:require-all` red. The
      // SAME validator the child declares, so the two cannot disagree.
      "folio-merge-queue-entry/v1": {},
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
    description:
      "work items — one Markdown file each, in the layout the `beans` CLI reads. Authored by people and agents.",
    title: "Bean definitions",
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
  // Bean `m61r`, issue #1853: one pull request's addendum to a bean, in a file
  // of its own, so sibling pull requests stop conflicting on one bean they all
  // append to (`ob3m` cost five hand-merges in one afternoon, 2026-10-02).
  "bean-notes": {
    description:
      "one pull request's addendum to a bean — one Markdown file per branch per bean, `$schema: folio-bean-note/v1` in its front matter, named `<bean>--<date>--<branch>.md` so two pull requests never write one path; `README.md` beside them is the generated index. Bean `m61r`: `ob3m` cost five hand-merges in one afternoon while every finding was appended to the bean. `state`, and `recordsWork: false` because a note is a record about a bean, whose work is counted on the bean. Convention: [`bean-coordination`](../../sdlc/sdlc-core/bean-coordination.md) §\"Adding to a bean — a note, not an append\".",
    renderable: false,
    // Written by a session as it works, like the beans it adds to. Not
    // `context`: a process writes it.
    holds: "state",
    // A note is a RECORD about a bean, not a second work item. The work it
    // describes is the bean's, and is counted there; an agent told this graph
    // is active would look for work to pick up and find a log.
    recordsWork: false,
    schema: "schemas/bean-note.ts",
    validatorNotApplicable:
      "no instance declares a directory of this kind — it is nested inside `beans/`, declared by " +
      "`beans/beans.json`, and its nodes are Markdown with YAML front matter. `beans:notes:check` " +
      "parses each against `BeanNoteFrontMatterSchema` and re-derives its file name.",
    summary:
      "Bean notes — one Markdown file per pull request per bean, `$schema: folio-bean-note/v1` in " +
      "its front matter, named `<bean>--<date>--<branch>.md` so two pull requests never write one " +
      "path. Indexed by a generated README.",
  },
  "session-survey": {
    description:
      "published surveys of a commit window — one JSON each, `\"$schema\": \"folio-session-survey/v1\"`. Bean `6ptx`: eight sessions surveyed the same ~2435-commit window in one minute and that day produced ONE authored commit. Each records the window's **two edge commits**, so a later session computes the uncovered delta (`bun run survey:owed`) instead of re-deriving the range — staleness decidable rather than guessed, and an unreachable upper edge reads as *unusable*, never as covered. `state` because a running session writes it; `recordsWork: false` because a survey is a READING of work, not work anybody is partway through.",
    title: "Session surveys",
    renderable: false,
    // Written BY a running session, for other sessions to read. That makes it
    // state rather than context: `interaction/` is context because no process
    // writes it, and this one exists only because a process did.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      // A RUNNABLE validator rather than a `shape`: this is a zod schema, so the
      // nodes can actually be parsed instead of merely typed. `workflow-state`
      // next door can only offer a TypeScript shape, which `check:kind-validators`
      // reports as "not runnable — could not determine".
      "folio-session-survey/v1": {},
    },
    schema: "schemas/session-survey.ts",
    // A survey is a READING of work, not work anybody is partway through. An
    // agent told this graph is active would arrive looking for something to
    // pick up and find a finished report — the distinction `recordsWork`'s own
    // docblock draws against `uploads`.
    recordsWork: false,
    summary:
      "Published surveys of a commit window — one JSON file each, carrying " +
      "`\"$schema\": \"folio-session-survey/v1\"` and the window's two edge commits, " +
      "so a later session can compute what it is NOT covered for instead of re-deriving " +
      "the whole range (bean `6ptx`).",
  },
  "workflow-state": {
    description:
      "running BPMN instances — one JSON each, `\"$schema\": \"folio-workflow-instance/v1\"`. Owned by the interpreter, never hand-edited.",
    title: "Workflow state",
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

  // The merge queue — what the merge STEWARD decided about an open pull
  // request. Bean `hfag`'s last open box, and the one that made the schema
  // homeless: `schemas/merge-queue.ts` has existed since the epic's first
  // commit, `MergeQueueEntrySchema` validates an entry, and nothing declared
  // anywhere an entry could LIVE. A schema with no declared graph is reachable
  // only by the module that imports it, which is `dh4f` pointed the other way
  // — not a declared directory nothing holds, but a held shape nothing
  // declares.
  //
  // `state` by the one question `content-context-and-state-graphs` asks: a
  // running process WRITES it. A steward records a placement, a hold or an
  // ejection as the train proceeds; nothing authors a queue entry outside a
  // run, and re-running is how you arrive at the next one.
  //
  // It sits in `beans/` beside `workflow-state` ON PURPOSE, and the pairing is
  // the point: the queue holds the DECISIONS, a finished train run holds the
  // EVIDENCE of what those decisions met (`TrainMemberEvidenceSchema`). Two
  // kinds, one store, because a reader asking "why did #1899 go in that train"
  // needs both and should look in one place.
  //
  // `recordsWork: true` — an entry is a pull request someone is partway
  // through placing, which is exactly what that flag is for (beans, todos,
  // workflow-state). A held entry with an unexpired hold is open work.
  "merge-queue": {
    description:
      "a merge steward's DECISIONS about an open pull request — one JSON each, `\"$schema\": \"folio-merge-queue-entry/v1\"`: priority class, rank or override with its reason, a hold with its expiry, the train it joined, an ejection with its evidence. **Never a fact GitHub owns** — CI, mergeability, labels and the head SHA are read live at decision time and refused BY NAME by the schema, because a stored copy is a second answer that goes stale on the next push. The one exception is an evidence snapshot on a FINISHED train run, which is history rather than a claim about now. Declared at `beans/queue/`, beside `workflow-state`: this holds the decisions, a finished run next door holds the evidence they met. `state` because a steward writes it as the train proceeds; `recordsWork: true` because a held entry is open work. Shape in `schemas/merge-queue.ts`; read with [`merge-queue`](../../sdlc/sdlc-core/merge-queue.md). Bean `hfag`.",
    renderable: false,
    holds: "state",
    recordsWork: true,
    schema: "schemas/merge-queue.ts",
    // declared-path-literal: this table IS the declaration, as on `health` and
    // `workflow-state`. The validator is the SAME export the steward's tooling
    // imports, so the kind and the writer cannot drift into two answers.
    nodeSchemas: {
      "folio-merge-queue-entry/v1": {},
    },
    summary:
      "A merge steward's DECISIONS about an open pull request — priority, rank or override with its reason, " +
      "a hold with its expiry, the train it joined, an ejection with its evidence. " +
      "Never a fact GitHub owns: CI, mergeability, labels and the head SHA are read live and refused by name here.",
  },
  // The todo graph. NOT a second work plan: `beans` is the agent work plan and
  // `AGENTS.md` forbids standing up another. This is the thing that document
  // already carves out beside it — "the content-review feedback workflow … a
  // separate domain feature, not the agent work-plan" — and it is CONTENT,
  // owned by the folio. A todo records a PERSON's outstanding work, tagged by
  // the four coordinates of the role model: who, as which role, in which
  // process, on which task.
  todos: {
    description:
      "human actors' outstanding work as a whole (`todos/`); its inner nodes are declared by `todos/todos.json`",
    title: "Todos",
    perInstance: true,
    layer: "core",
    renderable: false,
    // A person's outstanding items. Outstanding is the word that settles it —
    // an item records a position, not a fact.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-board/v1": {},
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
    description:
      "boards — one file each, `\"$schema\": \"folio-board/v1\"`. A board is a **diagram OF** a folio, not a container of one: it declares what it shows, and a folio with no board is complete. The semantic half of the OMG split the owner named — *\"treat it like OMG specs and BPMN layout. relationship first, visualiztion alter.\"*",
    title: "Boards",
    renderable: false,
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    // NOT work. A board is a way of LOOKING at work, and `check:graph-typology-work`
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
    description:
      "where each note sits on each board — `board-positions.json`, keyed by board then by note id, in board units. The **Diagram Interchange** half: it points at notes and is never pointed back at, which is why a note carries no `x`, `y`, `board` or `position`. `state` rather than `content`, because a running process writes it every time somebody moves a note.",
    title: "Board positions",
    renderable: false,
    // Written by a running process every time somebody moves a note. It is
    // Diagram Interchange: where things were drawn, not what is true.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
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
    description:
      "todo nodes — one file each, `\"$schema\": \"todo/1.0.0\"`. Authored by people, and by agents on their behalf.",
    title: "Todo items",
    layer: "core",
    renderable: false,
    // As `todos`.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
    summary:
      "Todo nodes — one file each, carrying `\"$schema\": \"todo/1.0.0\"`. " +
      "Authored by people and by agents on their behalf.",
  },

  // BACK IN THE BASE LAYER, 2026-10-04 (bean riit). dmx1 moved this kind to
  // folio-assistant-core's typologies/ graph the same day; that broke the invariant
  // DEFAULT_DIRECTORIES states ("the harness cannot default a directory to a
  // kind it does not know"), because the harness defaults `uploads/` beside
  // `library/` — and the two are ONE pipeline, so they belong in one place.
  // The two stages of the document-ingestion pipeline. They are declared as
  // SEPARATE kinds rather than one `sources` kind because the whole point
  // of the pair is that they are not interchangeable: the corpus-grep
  // checklist searches `library/` and not `uploads/`, so a source still in
  // `uploads/` makes a clean grep read as "nobody has done this" while the
  // file sits on disk. Collapsing them into one kind would erase exactly
  // the distinction `content/docs/document-ingestion/uploads-and-library-
  // are-two-stages-of-one-pipeline.md` exists to state. A QUEUE, and a
  // queue is a position in a pipeline. The declaration already says these
  // files are NOT L1 and read as absent to every corpus consumer: the file
  // is on disk and the content does not exist yet. Local since bean `tlat`
  // moved the extraction contract down (placement PR5). The document
  // adapter writes an upload's description beside its intake (bean `d4lb`),
  // in the same family the IRIS catalogue records use. A queued source may
  // itself BE a JSON Schema: the SPDX 3.1-RC1 schema held in
  // uploads/spdx-3-1-rc1-machine-readable/ (bean `sd5v`) declares the meta-
  // schema as its `$schema`. It conforms to a specification nobody here
  // types, so it is `external`, as on `schemas` and `docs`.
  uploads: {
    description: "the incoming queue — raw files as dropped, before ingestion. NOT L1, and not greppable as corpus.",
    title: "Uploads",
    perInstance: true,
    layer: "core",
    renderable: false,
    holds: "state",
    nodeSchemas: {"folio-extraction/v1": {}, "folio-intake/v1": {}, "folio-dublin-core/v1": {}, "https://json-schema.org/draft/2020-12/schema": {"external": "JSON Schema 2020-12"}},
    recordsWork: false,
    summary: "The incoming queue — raw files as dropped, before ingestion. NOT L1, and not greppable as corpus: a document here reads as absent to every consumer.",
    avatar: {"glyph": "M12 17V5m0 0l-4 4m4-4l4 4M5 19h14", "tone": 200, "reads": "an arrow onto a line — something arriving"},
    tileIcon: "uploads",
  },
  library: {
    tileIcon: "library",
    description:
      "L1 source content — one `<bib-slug>/` per ingested document, holding `sections/*.md`, `structure.json` and, where scanned, `ocr/page-NNN.txt`.",
    title: "Library",
    perInstance: true,
    // Grouped by concern from within (`library/library.json`), PR0c — and
    // ruled 2026-09-30 (issue 3, option A): the physical split is
    // `library/<group>/<slug>/`; a new upload lands UNFILED at
    // `library/<slug>/`, and filing is a core cataloguing refinement. The
    // declaration is what lets a walker tell a group from a source.
    declarationFile: "library.json",
    concernGroups: true,
    layer: "core",
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
      // The FROM-WITHIN node naming this directory's concern groups
      // (placement PR0c): `concern-groups/v1`.
      "concern-groups/v1": {},
      "folio-document-images/v1": {},
      "folio-image-verdicts/v1": { shape: "scripts/apply-image-verdicts.ts#VerdictFile" },
      // The section analogue of image verdicts (bean `fnqn`): which sections are
      // mostly SAMPLE text. Read by summaries and the LSI units.
      "folio-section-verdicts/v1": {},
      // The OTHER layer of the same page — bean `a8wy`. `folio-document-images`
      // holds what the PDF PLACES; this holds the positioned text of a figure
      // the PDF DRAWS, for which there is no image object to place. Two
      // families rather than one because a vector figure has no rectangle to
      // measure coverage on, no `xref` to dedupe by and no pixel to inspect,
      // so `role` and `basis` would each mean two things.
      "folio-vector-labels/v1": {},
      // The vector figures ASSEMBLED and RENDERED — bean `ay3x`. Every entry
      // carries a basis naming who or what looked; the extractor's assigns no
      // role, and the role arrives by inspection through `image-verdicts.json`.
      "folio-vector-figures/v1": {},
      // The JUDGEMENT half of the vector arm — bean `a8wy`. Stands to
      // `folio-vector-labels` as `folio-image-verdicts` stands to
      // `folio-document-images`: the measurement says where every text line
      // sits, this says what somebody reading them concluded, and its
      // required `basis` records whether they rendered the page. A
      // labels-only reading gets the nouns right and the relations wrong, so
      // a reader has to be able to tell the two apart.
      "folio-figure-descriptions/v1": {},
      // Agent summaries of prose blocks, beside the blocks rather than in
      // them — the blocks stay verbatim and `ingested` (owner, 2026-09-24).
      // The semantic half of its QA is `block-summaries` in check-l1-complete.
      "folio-block-summaries/v1": {},
      // What the site mount must not publish from this directory (bean `cw35`).
      // Written by the instance's generator from its licence gates; the mount
      // validates it with this schema and refuses to mount if it cannot.
      "folio-withheld/v1": {},
      // A slide deck's accessibility report, per check (bean `scfh`).
      "folio-slides-accessibility/v1": {},
      // A source recorded and not held, its text withheld by licence (bean `scfh`).
      "folio-referenced-source/v1": {},
    },
    summary:
      "L1 source content — one `<bib-slug>/` per ingested document, holding `sections/*.md`, " +
      "`structure.json` and, where the source was scanned, `ocr/page-NNN.txt`. Every " +
      "knowledge-graph reference to a source resolves through here, never to a loose path " +
      "or a bare URL.",
  },
  // What a folio's computations recorded — bean `qou-qb6t` (story T1 of the
  // qou tools migration), and the owner's ruling of 2026-10-04: "all witnesses
  // tools will need to go into the KG". A witness is the output node of a
  // producer Tool; this kind is what makes that output a graph node.
  //
  // `derived` on `library`'s reasoning: a witness is written by its producer
  // and regenerated by re-running it, never edited in place, so a finding
  // against one is a finding against its producer. `core` because the
  // `computation.witness` field that wires a witness to a content block is a
  // core block field, and nothing about a witness is specific to mathematics.
  //
  // One `validator`, not per-tag `nodeSchemas`: witnesses carry no reliable
  // `$schema` (22 of qou's carry one, in seven spellings), so they are selected
  // by their `.witness.json` suffix. The validator is the ENVELOPE every
  // witness meets; the producer contract is a separate schema whose failures
  // `witness:conformance` reports as findings. Both are documented in
  // `schemas/computation-witness.ts`.
  "computation-witness": {
    title: "Computation witnesses",
    layer: "core",
    renderable: false,
    holds: "derived",
    schema: "schemas/computation-witness.ts",
    // Its validator is `validators/computation-witness.json` (bean riit, step
    // 1c: no authored kind carries validator code).
    summary:
      "What a folio's computations recorded: one `<name>.witness.json` per producer run, naming the " +
      "engine, the script and its hash, the commit, and each assertion with its computed and expected " +
      "values. Written by the producer and regenerated by re-running it; addressable from prose and " +
      "wired to a content block through `computation.witness`.",
  },
  // Binary releases — WHAT WAS PUBLISHED, under what version, with what
  // digest. Never the bytes.
  //
  // Registered on the owner's ruling, 2026-09-30 — OPTION A of bean `rjug`:
  // *"a `binary-release` kind, `holds: "state"`, one node per release,
  // recording id, version, digest, size and where it is fetched from, never
  // the bytes."*
  //
  // OPTION B WAS REUSING `materialization`, and the bean asked for the
  // reservation to be decided rather than assumed: *"a release is an EVENT
  // with a version and a digest, not a materialisation state."* Bean `gpdo`
  // has since landed (owner's pick 2026-09-23, "Third purpose"; issue #1194,
  // still open) and it SHARPENS that mismatch rather than softening it.
  // `MATERIALIZATION_PURPOSES` is now `working | archival | both | compiled`,
  // and every one of the four is a purpose of A COPY THIS INSTANCE HOLDS —
  // may I re-fetch it, are these the stored bytes, both, or was it built from
  // the inputs we have now. A release's subject is a publication UPSTREAM: it
  // happened whether or not a byte was ever fetched here, and it stays true
  // after every local copy is gone. `gpdo` added a third question to
  // materialization and a release answers that one no better than the other
  // two — it has no inputs, it has a version.
  //
  // So the two COMPOSE rather than substitute. A release node says "v1.8.0
  // published package.tgz, this many bytes, this sha256, at this URL"; a
  // materialization record says "and a copy is here, taken for this purpose".
  // Asking a materialization node what was released returns an answer about
  // what was FETCHED — the `catalogue`-vs-`library` confusion one corpus
  // over.
  //
  // `state` by the one question: the release pipeline WRITES it as it runs,
  // and it fails the stand-alone test the way `qa` and `health` do — detached
  // from the thing released, a digest asserts nothing. NOT `derived`, which is
  // the call worth stating now that `derived` exists and the entry above takes
  // it: a derived graph is regenerated from a source that still exists, while
  // re-running a release pipeline produces a DIFFERENT release with a new
  // version and a new digest. Same distinction `qa-report` draws.
  //
  // `recordsWork: false` -- live state, but nothing anybody is partway
  // through. A published release is a completed fact; an arriving agent
  // cannot pick one up.
  //
  // NOT renderable. A release ledger is a provenance record consulted when
  // somebody asks where a file went, not a page anybody reads: it is the same
  // answer `health` and `qa-report` give, and for the same reason — the site
  // build does not read it, and `renderable` asks about the site build rather
  // than about legibility. Note what saying `true` would actually promise: a
  // published page per release, listing every asset's fetch URL, including
  // the ones a deploy phase deleted on purpose. The kind exists to make that
  // history ASKABLE, not to republish it.
  //
  // The case it exists for is the deploy purge. `rjug` names the >100 MB files
  // the WHO deploy phase DELETES before deployment; after the purge nothing
  // anywhere records that they existed -- not the deployed site, not the
  // repository, and not a materialization record, because no copy was kept.
  // Hence `deleted-before-deploy` as a disposition, hence `fetchedFrom`
  // required even on a purged asset, and hence the rule that a DECIDED
  // disposition must say why: a removal with no recorded reason cannot be told
  // from an accident, which is `deletion-requires-confirmation` written into a
  // shape.
  "binary-release": {
    description:
      "published binary releases — one `folio-binary-release/v1` document per release, carrying its id, version and origin, and for each asset the size, the sha256 where one is known, where it is fetched from, and what became of it. **Never the bytes**: the schema is strict throughout. Registered 2026-09-30 on the owner's ruling (bean `rjug`, Option A); Option B was reusing `materialization`, and bean `gpdo`'s `compiled` purpose landing since has sharpened that mismatch rather than softening it — all four materialization purposes are purposes of A COPY THIS INSTANCE HOLDS, while a release is a publication UPSTREAM that stays true after every local copy is gone. The two compose rather than substitute. `state`: the release pipeline writes it, and re-running produces a DIFFERENT release rather than the same one again, which is why this is not `derived` although `ig-metadata-index` above is. `recordsWork: false` — a published release is a completed fact, not something anybody is partway through. The case it exists for is the deploy purge: after the WHO deploy phase deletes its >100 MB files, nothing else anywhere records that they existed, so a purged asset must still say where to fetch it and why it went — a removal with no recorded reason cannot be told from an accident. Shape in `schemas/binary-release.ts`.",
    title: "Binary releases",
    renderable: false,
    holds: "state",
    recordsWork: false,
    // declared-path-literal: this table IS the declaration, as on `health`.
    schema: "schemas/binary-release.ts",
    summary:
      "Published binary releases -- one `folio-binary-release/v1` document per release, " +
      "carrying its id, version and origin, and for each asset the size, the sha256 where " +
      "one is known, where it is fetched from, and what became of it. Never the bytes: the " +
      "schema is strict throughout, and a file a deploy phase deleted must still say where " +
      "to get it back and why it went.",
  },
  // Named editorial voice profiles, overlaid on the base house voice. A
  // separate kind from `kg` because a voice is OPT-IN per folio while a skill is
  // simply available: the activation list in `harness.config.json` is what makes
  // a voice apply, and a graph typology that conflated the two would have no place
  // to record that this instance ships four voices and activates none.
  voices: {
    description:
      "editorial voice profiles — one JSON each, `\"$schema\": \"folio-voice/v1\"`. Every rule cites its source. **Opt-in**: shipping a voice does not apply it.",
    title: "Voices",
    perInstance: true,
    layer: "core",
    renderable: false,
    // THE FROM-WITHIN NODE, as on `docs` (owner 2026-09-30, bean `rkqp`:
    // "vendors/<id>/ should be declared subgraphs along with vendors/").
    // `skills/voices/voices.json` names the sub-graphs a voices directory
    // holds; only those are read as part of it. Absent means none.
    declarationFile: "voices.json",
    // An authored rule set. A voice is true whether or not any prose has been
    // written against it.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    summary:
      "Editorial voice profiles — one JSON each, carrying `\"$schema\": \"folio-voice/v1\"`. " +
      "Every rule cites the ingested source or KG node it was derived from. Opt-in per folio.",
  },
  // ── SUB-GRAPH OF `voices` — bean `rkqp`, owner 2026-09-30 ──────────────
  //
  // A vendor voice specialises a base voice for one agent vendor (Claude,
  // Gemini CLI, ...). ONE kind serves both levels: `vendors/` and each
  // `vendors/<id>/` hold the same thing, vendor voice profiles, and a kind
  // says what is held rather than how deep. `vendors/vendors.json` declares
  // each `<id>/`; the chain stops where a directory carries no declaration.
  "voice-vendors": {
    description:
      "a base voice specialised for one agent vendor — `folio-voice/v1` with `extends` naming the base. A **sub-graph of `voices`** (`within: \"voices\"`), declared from within: `voices/voices.json` names `vendors/`, and `vendors/vendors.json` names each `<id>/`. `loadVoices` descends only where a declaration says to and **refuses** an undeclared voice directory rather than skipping it. Bean `rkqp`, owner 2026-09-30.",
    title: "Voice vendors",
    layer: "core",
    renderable: false,
    within: "voices",
    declarationFile: "vendors.json",
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `voices`.
    summary:
      "Vendor voice profiles — a base voice specialised for one agent vendor, " +
      "`folio-voice/v1` with `extends` naming the base. A sub-graph of `voices`, " +
      "declared from within by `voices.json`, each vendor declared by `vendors.json`.",
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
    description:
      "themes an instance DERIVED from a source it holds — a served stylesheet, or a style guide's stated rules. One Theme node each, carrying `kind: sticky \\| webpage \\| publication`; the palette vocabulary is shared across every kind and only the geometry varies. Every value cites where it was measured. NOT the platform's own twelve themes, which are furniture in `cat-harness/schemas/themes.ts` — a palette read off a WHO style guide is subject matter.",
    title: "Themes",
    renderable: false,
    // Authored-from-a-source, like `voices` and for the same reason: a theme is
    // true whether or not anything has been rendered with it. The DERIVATION
    // does not make it state — `catalogue` settles that argument two entries
    // up, and the same answer holds here.
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    summary:
      "Themes derived from an instance's own sources — one Theme node each, carrying " +
      "`kind: sticky | webpage | publication`. The palette vocabulary is shared across " +
      "every kind and only the geometry varies; every value cites where it was measured.",
  },
  "document-kinds": {
    description:
      "DOCUMENT KINDS a harness contributes — named structures of sections a document authored with it follows, `fixed` (exactly these sections) or `semi-fixed` (these required, others allowed). One `folio-document-kind/v1` JSON each; every kind and section names its sources, and `computedFrom` names the declared graphs a section derives from. Not a content profile: a profile constrains which BLOCK KINDS a folio may contain and is a compile-time union in core; a kind is a structure, contributed as data. Stage D5 of the smart-* separation, #1767.",
    renderable: false,
    // Authored-from-a-source, like `themes`: a document kind is true whether
    // or not any document has been written in it yet. Core knows that kinds
    // exist and never which — a harness contributes its own as data (stage
    // D5 of the smart-* separation, #1767, bean `qvxh`).
    holds: "content",
    // declared-path-literal: this table IS the declaration, as on `health`.
    nodeSchemas: {
      "folio-document-kind/v1": {},
      // How one subject realises a kind, computed by the kind's owner — a
      // second family in this directory because it is DERIVED from another
      // graph (an IG's artefact index), where the kind is authored.
      "folio-document-kind-coverage/v1": {},
    },
    summary:
      "Document kinds — named structures of sections (fixed or semi-fixed) that a document " +
      "authored with a harness follows, one `folio-document-kind/v1` JSON each, plus computed " +
      "`folio-document-kind-coverage/v1` reports of how a subject realises one. Every kind and " +
      "section names its sources; `computedFrom` names the declared graphs a section derives from.",
  },
  "todo-feedback": {
    description:
      "feedback items — todos raised against a specific block, carrying the submitter's identity. Read by `todo-review`.",
    title: "Todo feedback",
    layer: "core",
    renderable: false,
    // As `todos`, plus a submitter's identity — which makes it more obviously
    // a record OF something rather than the something.
    holds: "state",
    // declared-path-literal: this table IS the declaration, as on `health`.
    recordsWork: false, // live state, but nothing anybody is partway through
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
  // On the name: `.fsh` is FHIR Shorthand in this codebase (`smart-base/schemas/dak.ts`,
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
    // declared-path-literal: the description is the kind table's prose
    // (generated by kind:table, bean dmx1) and names the shape module for a
    // reader; `schema` below is the declaration.
    description:
      "a SESSION's context — the acting actor, the instances it has open, the beans it claimed and what it waits on. Distinct from `workflow-state`, which is where ONE instance got to: a session spans processes, and a session with nothing open is the commonest state there is. `actor` is required because nothing else can supply it. **Registered ahead of a directory**: nothing writes one yet, and the state machine that will is bean `3nfv`. Shape in `schemas/session-context.ts`; read with [`session-context`](../../process/workflow/session-context.md).",
    title: "Session state",
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
    description:
      "how a PERSON wants to be asked — committed, read at session start by every agent. `context`: read during a process, never written by one; it changes when a person states a preference. Also `harness.config.json`'s `interaction` key, which defaults here, so the declaration and the config name one place.",
    title: "Interaction",
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
      "folio-interaction/v1": {},
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
    description:
      "how far an agent has read an issue — `lastCommentId`, `lastUpdatedAt`, `checkedAt`, one file per issue. **Not the comments**: an id and two timestamps, never a body. Two marks because a comment EDITED after being read keeps its id. Read with [`issue-working`](../../sdlc/sdlc-core/issue-working.md); shape in `src/issue-watch/seen-comments.ts`.",
    title: "Issue marks",
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
      "folio-issue-mark/v1": {},
    },
    summary: "How far an agent has read an issue — the comment id and the edit time it accounted for.",
  },

  memory: {
    description:
      "agent memory — durable facts an agent carries between sessions, one `\"$schema\": \"folio-memory/v1\"` node each. Read during a process and never written by one; it changes when a human directs an authoring agent. Declared at `memory/`, **repository-scoped** — these are facts about the repository carried by the agents working in it, and `.claude/agents/` sits at the repository root too. They were in `skills/memory/` until 2026-09-20 (bean `07xs`), where the containing kind was `content` and the contents were `context`.",
    title: "Memory",
    renderable: false,
    holds: "context",
    // declared-path-literal: this table IS the declaration, as on `health` — a validator is a
    // module#Export resolved by resolveKindValidator. Read by gen-uml-overview.ts to draw the nodes.
    summary: "Durable facts an agent carries between sessions. Read during a process, never written by one.",
  },

  // A confirmation the owner gave IN ADVANCE — `skills/conduct/conduct-core/confirmation-waiver.md`.
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
    description:
      "confirmations a person granted **in advance** — one `\"$schema\": \"folio-waiver/v1\"` node each, naming one gate class, scoped to a session or a process run, and carrying an expiry. Declared over the **same directory as `memory`**, `memory/`, and told apart from it by that tag rather than by a subdirectory: a directory is a place to look and may hold more than one part of a graph. `context` by the same test as `memory` — a process reads a waiver before a gate fires and no step writes one. Skill: [`confirmation-waiver`](../../conduct/conduct-core/confirmation-waiver.md).",
    title: "Waivers",
    renderable: false,
    holds: "context",
    schema: "schemas/waiver.ts",
    // declared-path-literal: as on `health` and `translation-sources` — this
    // table IS the declaration, so resolving `validator` through one would be
    // reading it from here. `check:kind-validators` proves it still loads.
    summary:
      "Confirmations a person granted in advance — each naming one gate, scoped to a session or a process run, each expiring.",
  },

  "fsh-guts": {
    published: false,
    description:
      "Deprecated and throwaway structured content — kept, addressable and exported, and deliberately absent from the site. The destination for anything that would otherwise be deleted. **THAT IS TRUE AGAIN AS OF 2026-09-23, AND WAS NOT FOR SOME TIME.** The kind also held `proposals/` — the LIVE design corpus, cited as the governing scheme by seven skills and four code modules — so an agent that read this row, learned the kind was throwaway and skipped it had skipped the schemes it needed. That is exactly what happened (bean `5kn6`): a session proposed three options for a question `instance-versioning.md` §3.3 and an owner ruling of 2026-09-20 had already settled. **The owner's fix was to move them, not to re-describe the kind** — *\"proposals not in fsh-guts but docs/ for needed &lt;stub&gt;\"* — so proposals now live in the `docs/` of the instance whose stub they concern, published rather than hidden. What remains here is `retired/` and one-off migration `scripts/`, which are what the label always described. **The lesson survives the fix**: a kind whose name tells an agent to skip it must not hold anything an agent needs.",
    renderableNote: "on purpose",
    title: "FSH guts",
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
  // The root declaration of a SUBSCRIBED substrate, cached at its pin by
  // `kg:subscribe` (issue #1719, slice 4). DERIVED, by the test the other
  // derived kinds pass: it is produced from a source — the substrate's bytes
  // at a commit — and regenerated by re-running the command, never edited.
  // Not `content`: nobody here authors it, and a finding against it is a
  // finding against the substrate or the fetch. Not `context`: `kg:subscribe`
  // writes it, and a process writing a `context` graph is a defect.
  "substrate-snapshot": {
    description:
      "the root declaration of each Knowledge Graph this instance SUBSCRIBES to (`subscriptions/`), one `folio-substrate-snapshot/v1` file per `subscriptions` entry: the upstream bytes at the pinned commit, their sha256, and the harnesses and subgraphs the substrate offers. `derived`: written by `bun run kg:subscribe` from somebody else's bytes and regenerated, never edited; `kg:subscribe:check` re-hashes and re-judges each one offline. It WRAPS the upstream `<name>.json` rather than copying it, because a bare copy carries `name` equal to its stem and would read as an instance declaration to every scanner. Issue #1719.",
    title: "Substrate snapshots",
    renderable: false,
    holds: "derived",
    // declared-path-literal: this table IS the declaration, as on `health`.
    // ONE family, so `validator` rather than `nodeSchemas`: a `nodeSchemas`
    // map claims nodes exist to route, and `check:kind-validators` fails one
    // that examined none — the right rule, and false here until the first real
    // subscription, which this tree deliberately does not carry. Every node is
    // tagged `folio-substrate-snapshot/v1` regardless, so moving to
    // `nodeSchemas` then is a one-line change.
    //
    // A SECOND family now lives here too, and the validator does not cover it:
    // the `folio-kg-materialization/v1` part records `kg:materialize` writes
    // (slices 5-6). Their schema embeds core's `MaterializationSchema`, so it
    // is core's (`folio-assistant-core/schemas/kg-materialization.ts`) and
    // this registry cannot name it without pointing up the arrow. They are
    // JUDGED by `kg:materialize:check` instead; `kg:validate` on one reports
    // it against the snapshot schema, which is a known gap, not a verdict.
    summary:
      "The root declaration of each Knowledge Graph this instance subscribes to, cached byte for byte at " +
      "the pinned commit with its fixity, and what the substrate judgement found in it; and each chosen " +
      "subgraph or asset materialised from it, with its fixity, provenance and gate answers.",
  },
  "translation-sources": {
    description:
      "the gettext side of translation — `.pot` templates, `.po` catalogues and their `TranslationNode` manifests, one directory per target locale. The INPUT to injection; there is deliberately **no kind for the rendered output**. Read with the [`translation-manager`](../../library/library-core/translation-manager.md) skill; shape in `schemas/translation.ts`.",
    title: "Translation sources",
    perInstance: true,
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
  },
};

/** A graph typology name. Open, not a closed union — downstream layers add kinds. */
export type GraphTypology = string;

/** Thrown when a kind is registered twice with different meanings. */
export class GraphTypologyConflictError extends Error {
  constructor(name: string, detail?: string) {
    super(
      `graph typology "${name}" is already registered with a different definition` +
        (detail ? ` (${detail})` : "") +
        `. Kinds are a shared vocabulary — rename, or register once.`,
    );
    this.name = "GraphTypologyConflictError";
  }
}

/**
 * The graph-typology vocabulary, extensible by the layers above the harness.
 *
 * An instance registry rather than a bare module constant, so that a test — or
 * a process resolving more than one instance — cannot leak registrations into
 * the next. `defaultGraphTypologies` is the convenience shared instance; every read
 * accepts an explicit one.
 *
 * Registration is **idempotent for an identical definition** and throws on a
 * conflicting one, the same rule `schemas/contributions.ts` uses: a diamond
 * dependency graph reaches core twice and must not fail for it, while two
 * different layers claiming one name is a real collision.
 */
/**
 * Graph typologies that were renamed, mapped to what they are now.
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
 * Deliberately a lookup rather than a field on `GraphTypologyDef`: a kind that is
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
  folio: "schemas/folio-graph-typology.js",
  glossary: "schemas/glossary-graph-typology.js",
};

export const GRAPH_TYPOLOGY_ALIASES: Readonly<Record<string, string>> = {
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
export function resolveGraphTypology(name: string): { kind: string; deprecated?: string } {
  const to = GRAPH_TYPOLOGY_ALIASES[name];
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
 * the next field added to `GraphTypologyDef` has one place to be considered.
 */
function sameKind(a: GraphTypologyDef, b: GraphTypologyDef): boolean {
  return a.layer === b.layer && a.renderable === b.renderable && a.holds === b.holds;
}

/** The layer whose namespace names a kind: bootstrap's for a kind bootstrap defines. */
export function graphTypologyLayer(name: string, def?: Pick<GraphTypologyDef, "layer">): "bootstrap" | "core" | "harness" {
  if (Object.hasOwn(BOOTSTRAP_GRAPH_TYPOLOGIES, name)) return "bootstrap";
  return def?.layer ?? "harness";
}

/** A kind's identity: its `GraphTypology` individual, `<layer ns>graphTypology/<name>`. */
export function graphTypologyIri(name: string, def?: Pick<GraphTypologyDef, "layer">): string {
  return `${namespaceForLayer(graphTypologyLayer(name, def))}graphTypology/${name}`;
}

export class GraphTypologyRegistry {
  private kinds = new Map<string, GraphTypologyDef>();
  /** Which file declared each kind loaded from a `typologies/` graph (bean dmx1). */
  private declaredIn = new Map<string, string>();
  /** Validator nodes, keyed `kind\u0000family`, kept so a kind registered LATER (core's `folio`) is joined too. */
  private validatorNodes = new Map<string, { file: string; node: ValidatorNode }>();
  private loaded = false;

  /**
   * @param seed the kinds this layer lists in code
   * @param declaredUnder a checkout whose instances' `typologies/` graphs are
   *   loaded on first use; omitted, the registry holds only `seed` and what is
   *   `register`ed (a test's private registry)
   */
  constructor(
    seed: Readonly<Record<string, GraphTypologyDef>> = BASE_GRAPH_TYPOLOGIES,
    private readonly declaredUnder?: string,
  ) {
    for (const [k, v] of Object.entries(seed)) this.kinds.set(k, v);
  }

  /**
   * Load every declared kind node under {@link declaredUnder}, once. Lazy, so
   * importing the registry touches no filesystem; on FIRST USE rather than at a
   * call site, so a reader that imports only this module still sees every
   * harness's kinds. A node that does not parse, or a name two files declare,
   * THROWS with the path: a kind silently missing reads as "not a known kind",
   * which is the dh4f shape.
   */
  private ensureDeclared(): void {
    if (this.loaded || this.declaredUnder === undefined) return;
    this.loaded = true;
    for (const { file, node } of declaredKindNodes(this.declaredUnder)) {
      const prior = this.declaredIn.get(node.kind);
      if (prior === file) continue;
      if (prior !== undefined || this.kinds.has(node.kind)) {
        throw new GraphTypologyConflictError(node.kind, `declared by ${prior ?? "the base layer's code"} and by ${file}`);
      }
      this.kinds.set(node.kind, kindDefOf(node));
      this.declaredIn.set(node.kind, file);
    }
    for (const v of declaredValidatorNodes(this.declaredUnder)) {
      const key = `${v.node.validates.kind}\u0000${v.node.validates.family ?? ""}`;
      const prior = this.validatorNodes.get(key);
      if (prior && prior.file !== v.file) {
        throw new Error(`two validators for ${describeValidator(v.node)}: ${prior.file} and ${v.file}. One family, one validator.`);
      }
      this.validatorNodes.set(key, v);
    }
    // A validator naming a kind not registered YET is joined by `register`
    // (core registers `folio` in code after load); one naming no kind at all
    // is `check:kind-validators`' finding.
    for (const name of [...this.kinds.keys()]) this.joinValidators(name);
  }

  /** Fill each listed family's (or the kind's own) validator in from the node that names it. */
  private joinValidators(name: string): void {
    const def = this.kinds.get(name);
    if (!def) return;
    let next: GraphTypologyDef | undefined;
    for (const { file, node } of this.validatorNodes.values()) {
      if (node.validates.kind !== name) continue;
      next ??= { ...def, ...(def.nodeSchemas ? { nodeSchemas: { ...def.nodeSchemas } } : {}) };
      const family = node.validates.family;
      if (family === undefined) {
        if (next.validator !== undefined && next.validator !== node.schema) {
          throw new Error(`${file}: kind "${name}" already names a validator in code (${next.validator}); two answers for one kind`);
        }
        next.validator = node.schema;
        continue;
      }
      const entry = next.nodeSchemas?.[family];
      if (entry === undefined) throw new Error(`${file}: validates family "${family}", which kind "${name}" does not list`);
      if ((entry.validator !== undefined && entry.validator !== node.schema) || entry.shape !== undefined || entry.external !== undefined) {
        throw new Error(`${file}: family "${family}" of kind "${name}" already has an answer in code; two answers for one family`);
      }
      (next.nodeSchemas as Record<string, NodeSchemaRef>)[family] = { ...entry, validator: node.schema } as NodeSchemaRef;
    }
    if (next) this.kinds.set(name, next);
  }

  /** The validator node joined onto `kind` (and `family`), when one is. */
  validatorNodeFor(kind: string, family?: string): { file: string; node: ValidatorNode } | undefined {
    this.ensureDeclared();
    return this.validatorNodes.get(`${resolveGraphTypology(kind).kind}\u0000${family ?? ""}`);
  }

  /** Every validator node loaded, for a check that a node names a kind that exists. */
  validatorNodeList(): { file: string; node: ValidatorNode }[] {
    this.ensureDeclared();
    return [...this.validatorNodes.values()];
  }

  /** The file that declared `name`, when it came from a `typologies/` graph. */
  declaredBy(name: string): string | undefined {
    this.ensureDeclared();
    return this.declaredIn.get(resolveGraphTypology(name).kind);
  }

  register(name: string, def: GraphTypologyDef): void {
    const existing = this.kinds.get(name);
    if (existing) {
      if (sameKind(existing, def)) return; // diamond
      throw new GraphTypologyConflictError(name);
    }
    this.kinds.set(name, def);
    this.joinValidators(name);
  }

  // `has` and `get` resolve a deprecated spelling, so a declaration written
  // against the old vocabulary still finds its kind. Resolution happens HERE
  // and nowhere else: a second place that knows the old name is a second place
  // that can forget it.
  has(name: string): boolean {
    this.ensureDeclared();
    return this.kinds.has(resolveGraphTypology(name).kind);
  }

  get(name: string): GraphTypologyDef | undefined {
    this.ensureDeclared();
    return this.kinds.get(resolveGraphTypology(name).kind);
  }

  names(): string[] {
    this.ensureDeclared();
    return [...this.kinds.keys()];
  }

  /** The kind a `GraphTypology` individual names, or `undefined`. */
  forIri(iri: string): string | undefined {
    this.ensureDeclared();
    for (const [k, v] of this.kinds) if (graphTypologyIri(k, v) === iri) return k;
    return undefined;
  }
}

/**
 * Every `folio-graph-typology/v1` node in every `typologies/` graph the instances under
 * `repoRoot` declare, files sorted for a stable order. Read RAW from each
 * declaration (only `directories[].graphTypologies`, `path` and `scope`), because
 * the declaration's Zod schema lives in `cat-harness.ts`, which imports this
 * module.
 */
export function declaredKindNodes(repoRoot: string): { file: string; node: ReturnType<typeof GraphTypologyNodeSchema.parse> }[] {
  return declaredNodeFiles(repoRoot, "typologies").map(({ file, raw }) => {
    const parsed = GraphTypologyNodeSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`${file} is not a folio-graph-typology/v1 node: ${parsed.error.message}`);
    return { file, node: parsed.data };
  });
}

/** Every `folio-validator/v1` node in every declared `validators/` graph (bean riit). */
export function declaredValidatorNodes(repoRoot: string): { file: string; node: ValidatorNode }[] {
  return declaredNodeFiles(repoRoot, "validators").map(({ file, raw }) => {
    const parsed = ValidatorNodeSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`${file} is not a folio-validator/v1 node: ${parsed.error.message}`);
    return { file, node: parsed.data };
  });
}

function describeValidator(n: ValidatorNode): string {
  return n.validates.family ? `kind "${n.validates.kind}", family "${n.validates.family}"` : `kind "${n.validates.kind}"`;
}

/**
 * The shared registry: the base layer's kinds above, plus every kind the
 * instances of THIS checkout declare in their `typologies/` graphs (bean dmx1),
 * loaded on first use. Core registers `folio` into it at load.
 */
export const defaultGraphTypologies = new GraphTypologyRegistry(
  BASE_GRAPH_TYPOLOGIES,
  resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."),
);

/**
 * The display name of a graph typology: its declared {@link GraphTypologyDef.title},
 * or, for a kind that declares none, the kind word with its first letter
 * capitalised and hyphens read as spaces (`code-list` → "Code list").
 *
 * Never the bare kind word. That is what the rail and the sidebar showed until
 * 2026-10-01, while the glass called the same page by its tile title, which is
 * how one destination came to carry two names (bean `ob3m`, finding 6).
 */
export function kindTitle(kind: string, registry: GraphTypologyRegistry = defaultGraphTypologies): string {
  const declared = registry.get(kind)?.title;
  if (declared !== undefined && declared.trim() !== "") return declared.trim();
  const words = kind.replace(/-/g, " ").trim();
  return words === "" ? kind : words.charAt(0).toUpperCase() + words.slice(1);
}
