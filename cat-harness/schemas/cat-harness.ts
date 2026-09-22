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
  type Dirent,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, basename } from "node:path";
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
import { StickyContributionSchema, type StickyContribution } from "./sticky-contribution";

/**
 * The suffix every instance declaration carries — `<name>.config.json`.
 *
 * ## `harness.json` is gone, and this replaced it
 *
 * The owner, 2026-09-21: *"Excise harness.json.. only
 * `<harness-stub>.config.json` makes instantiation at root of repo"*.
 *
 * There used to be TWO files with no overlap in content: `harness.json` held
 * the DECLARATION (`name`, `directories`, `assets`, `needs`, `stickies`) and
 * `<name>.config.json` held the CONFIG (`contentType`, `adapter`,
 * `dependencies`, `translation`). One instance, two files, and a reader had to
 * know which question each answered. They are one file now.
 *
 * ## A fixed filename cannot be discovered, and that was the point
 *
 * `harness.json` was a CONSTANT, so discovery asked `existsSync(dir +
 * "/harness.json")` and the declared `name` inside was free to be anything.
 * Under `<name>.config.json` the FILENAME CARRIES THE NAME, so the two cannot
 * disagree — and {@link findDeclarationFile} checks exactly that rather than
 * trusting either half.
 *
 * ## What tells a declaration from a plain config — the NAME, then the SUFFIX
 *
 * **A `name` field**, and since 2026-09-21 the suffix as well.
 *
 * Until then both ended `.config.json`, so the only discriminator was inside
 * the file: carrying `name` made it a declaration, lacking one made it a
 * config. That worked and was still the thing `b5f0` §1 warned about — two
 * different schemas, with two different readers, sharing one filename shape
 * and told apart only by which directory they sat in.
 *
 * The owner reversed §1's REPLACE ruling on 2026-09-21 and took its other
 * option, the one `b5f0` recorded as *"`<name>.json` + `<name>.config.json`
 * would at least pair them"*:
 *
 * | file | schema | reader |
 * |---|---|---|
 * | `<name>.json` in the instance | {@link CatHarnessDeclarationSchema} | `readDeclaration` |
 * | `<name>.config.json` at the instantiation root | `HarnessConfigSchema` | `readHarnessConfig` |
 *
 * The `name` check STAYS rather than being replaced by the suffix.
 * {@link findDeclarationFile} still requires the filename stem to equal the
 * declared `name`, which is what makes a declaration self-identifying: a
 * consumer opening a repository it has never seen scans, parses, and takes the
 * file that agrees with itself. That is the property migration-plan I.8 asked
 * for, and it is the reason the suffix could move at all — nothing here
 * derives a filename from a DIRECTORY name, so a clone renamed on disk still
 * resolves.
 */
export const DECLARATION_SUFFIX = ".json";

/**
 * The suffix of an instantiation root's CONFIG, as against its declaration.
 *
 * These were ONE suffix until 2026-09-21, because the declaration had been
 * folded into the config. The owner's reversal separates them again, so there
 * are now two things to spell and they must not be spelled by one constant:
 * composing a config path from {@link DECLARATION_SUFFIX} produced
 * `cat-harness.json` for a file that is `cat-harness.config.json`, and
 * `check:instance-config` reported all three real configs as orphans.
 */
export const CONFIG_SUFFIX = ".config.json";

/**
 * The CONFIG filename for an instance of this name — `<name>.config.json`.
 *
 * Defined HERE and re-exported by `schemas/harness-config.ts`, which is where
 * it used to live — that module imports this one, so the dependency only runs
 * one way. The rationale was "one speller, or the config and the declaration
 * drift apart at the first rename"; that still holds, but the thing being
 * spelled once is now each filename rather than both, and the pair below is
 * what keeps them from drifting.
 */
export function instanceConfigFilename(name: string): string {
  return `${name}${CONFIG_SUFFIX}`;
}

/**
 * The DECLARATION filename for an instance of this name — `<name>.json`.
 *
 * Its sibling above spells the config. Both exist so that neither is composed
 * at a call site: a literal `${name}.json` is the thing that survives a
 * suffix change and then resolves to nothing.
 */
export function instanceDeclarationFilename(name: string): string {
  return `${name}${DECLARATION_SUFFIX}`;
}

/**
 * The declaration file in this directory, or `undefined` if there is none.
 *
 * Scans for `*.json` and returns the one that both carries a `name` and
 * whose filename stem EQUALS that name. A file failing either half is not a
 * declaration: no `name` means it is a plain config, and a mismatched stem is
 * the rename-half-done case `check:instance-config` already reports.
 *
 * **Several declarations in one directory THROWS.** Picking one silently is
 * the `dh4f` shape — a consumer reads a declaration, gets an answer, and
 * reports a clean run over the instance it did not see. There is no correct
 * choice to make here, so the caller is told rather than guessed at.
 */
export function findDeclarationFile(dir: string): string | undefined {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    // Unreadable directory is "could not look", and a caller asking "is there
    // a declaration here" gets `undefined` either way. The distinction is not
    // lost: every caller that needs it re-reads and throws.
    return undefined;
  }
  const found: string[] = [];
  const broken: string[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(DECLARATION_SUFFIX)) continue;
    const stem = entry.slice(0, -DECLARATION_SUFFIX.length);
    if (stem.length === 0) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, entry), "utf-8"));
    } catch {
      // UNPARSEABLE IS NOT ABSENT. Skipping it here would make "this instance
      // declared something and it is broken" indistinguishable from "there is
      // nothing here" — the `xom7` failure, where a sweep that could not look
      // reports a clean run. It cannot be matched on `name` (there is no
      // parse), so it is collected separately and `readDeclaration` throws on
      // it rather than returning `undefined`.
      //
      // BUT ONLY WHEN IT COULD PLAUSIBLY BE THIS INSTANCE'S. The suffix was
      // `.config.json` until 2026-09-21, which made "unparseable file with
      // this suffix" a near-certain broken declaration. A bare `.json` makes
      // it near-certainly NOT one: a malformed `folio/landing.json` — a
      // landing sticky, nothing to do with declarations — was reported as a
      // broken declaration and took `readDeclaration` down with it.
      //
      // The two admissible signals, neither of which is used for RESOLUTION:
      // a sibling `<stem>.config.json`, which is the pairing the split
      // created, or a stem equal to the directory's own name. Matching the
      // directory here does NOT reintroduce what migration-plan I.8 warned
      // about — that is about deriving a declaration's location from a
      // directory name, and resolution still goes only through a file
      // agreeing with its own `name`. This is error REPORTING: the cost of
      // being wrong is a worse message, not a missed instance.
      const plausible = stem === basename(dir) || entries.includes(`${stem}${CONFIG_SUFFIX}`);
      if (plausible) broken.push(entry);
      continue;
    }
    if ((raw as { name?: unknown })?.name === stem) found.push(entry);
  }
  // A VALID declaration wins over a broken sibling: a directory may hold an
  // unrelated `*.config.json` that is merely malformed, and that must not stop
  // the instance being read.
  //
  // With NOTHING valid, the broken one is returned rather than thrown on, and
  // that is the whole third-state design. DISCOVERY MUST BE TOTAL —
  // `instanceRootsIn` asks "which directories are instances" and a throw there
  // takes out every caller, including the ones written to REPORT an unreadable
  // declaration (`workPlanGraphsIn`, `isActiveKg`). Returning it reproduces
  // the old semantics exactly: `harness.json` present made the directory an
  // instance, and `readDeclaration` threw when it came to parse it. Present
  // and unreadable stays distinguishable from absent, which is the property;
  // where the error is raised is not.
  if (found.length === 0 && broken.length > 0) return broken.sort()[0];
  if (found.length > 1) {
    throw new Error(
      `${resolve(dir)} carries ${found.length} declarations (${found.sort().join(", ")}). ` +
        "A directory is one instance; picking one silently would hide the others.",
    );
  }
  return found[0];
}

/**
 * The full path to this directory's declaration, or `undefined` if there is
 * none.
 *
 * The replacement for `join(dir, DECLARATION_FILENAME)`, which every reader
 * used to compose. It cannot be composed any more — the filename carries the
 * instance's name, so the only way to know it is to look.
 */
export function declarationPathIn(dir: string): string | undefined {
  const f = findDeclarationFile(dir);
  return f === undefined ? undefined : join(dir, f);
}

/**
 * `*.config.json` files in this directory that will not parse.
 *
 * Separate from {@link findDeclarationFile} because the two answer different
 * questions: that one says which file IS the declaration, this one says what
 * could not be read at all. A caller reporting instance health needs both, and
 * folding them would make a broken sibling look like a missing instance.
 */
export function unparseableConfigsIn(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.endsWith(DECLARATION_SUFFIX) && e.length > DECLARATION_SUFFIX.length)
    .filter((e) => {
      try {
        JSON.parse(readFileSync(join(dir, e), "utf-8"));
        return false;
      } catch {
        return true;
      }
    })
    .sort();
}

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
    summary: "The harness layer's own knowledge graph, where a directory holds more than one of its parts.",
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
    summary: "Executable BPMN processes and the DMN tables their gateways compute from.",
  },
  scenarios: {
    type: termIri("ScenarioGraph"),
    renderable: false,
    // Actors, the Roles they take, and the User Stories those Roles serve.
    //
    // NAMED FOR WHAT IT WILL HOLD, and one third of that is not declared yet:
    // a Role carries `useCases` as free-text strings, so a User Story cannot
    // be pointed at or traced to the Workflow it justifies. Naming the kind
    // now is what gives that gap somewhere to be fixed; calling it `roles`
    // would have to be renamed the moment it was.
    holds: "content",
    summary: "Actors, the Roles they take on, and the User Stories those Roles serve.",
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
  // domain-neutral ones, `smart-kg` carries GRADE, because certainty-of-evidence
  // grading belongs to WHO L1 guideline development rather than to the harness.
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
    // `content`, by the one question: a running process PRODUCES documentation,
    // and it is the subject rather than something read or written in passing.
    // Both supporting questions agree — detach a docs page and it still
    // explains, and you would RE-AUTHOR it rather than arrive at it by
    // re-running anything. Same layer as `cat-harness`, `schemas` and `voices`.
    holds: "content",
    summary:
      "Documentation ABOUT the knowledge graph — how the harness works, what its " +
      "directories hold, how a process runs. Rendered by the plain just-the-docs " +
      "pipeline. Distinct from `folio`, which is content an author CREATES using " +
      "the graph; the difference is the SUBJECT, not the format. The who-iris " +
      "catalogue is `library/`; a note about it is a `folio`; the page explaining " +
      "how ingestion works is `docs`.",
  },
  schemas: {
    type: termIri("SchemaGraph"),
    renderable: false,
    // A shape is the subject matter of the schema graph. It is true before
    // anything is validated against it.
    holds: "content",
    summary: "Schema definitions, self-declared in the smart-base manner.",
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
  // ONE kind for the whole work plan, not one per store. It replaced `workplan`
  // + `process-state` in #266; the rationale is in this map's doc comment above,
  // and the #263 version it supersedes is preserved there too. PR #266 changed
  // the map and left that comment describing the old five-kind design.
  models: {
    type: termIri("ModelGraph"),
    renderable: false,
    // `context`: READ when a session opens, never written by a process. The
    // distinction is the whole point of the kind — a person grants a
    // validation, an agent never does, because a model's own claim about
    // which languages it handles well is precisely what the validation state
    // exists to distrust. A `state` kind would say a process may write it,
    // and the first process that did would be manufacturing its own evidence.
    holds: "context",
    summary:
      "Which languages a model is good at, and whether a human checked. Read when a session opens, " +
      "as ONE input to the communication-language determination and never as the answer. " +
      "Declared in bootstrap because an agent reaching for it has not yet loaded the harness.",
  },
  glossary: {
    type: termIri("GlossaryGraph"),
    renderable: false,
    // `state`, and the whole kind exists for one fact a process WRITES: that a
    // term was once minted. The glossary DOCUMENT is derived from the corpus
    // and rebuilt every run, so it carries no memory — delete a role from
    // `roles.json` and its concept stops appearing, which is what "never
    // existed" also looks like. Retirement has to be distinguishable from
    // accident (`deletion-requires-confirmation`), so the ledger is committed
    // and the document is built from the corpus UNION it.
    holds: "state",
    // NOT work. A bean is something somebody is partway through; this is a
    // record that a term exists, which is true whether or not anybody is
    // doing anything. `check:graph-kind-work` refuses a `state` kind that has
    // not decided, and it was right to: "state" alone does not say whether a
    // reader is looking at a queue or at a fact.
    recordsWork: false,
    summary:
      "The swimlane glossary's retirement ledger — every concept this instance has ever minted, " +
      "with the date it was first seen and the date it stopped being derivable. Written by " +
      "scripts/glossary-export.ts; the glossary document itself is derived and not stored here.",
  },
  beans: {
    type: termIri("BeanGraph"),
    renderable: false,
    // The work plan. Its own declaration already splits WHAT IS BEING WORKED
    // ON from WHERE IT GOT TO — both are records about content, neither is
    // content.
    holds: "state",
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
    recordsWork: true, // beans (agent), todos (person), workflow-state (a process mid-flight)
    // The kind's own reader, wired 2026-09-20. `skill` is a property of the
    // KIND rather than of a directory because a `workflow-state` graph is read
    // the same way wherever it sits — and it was absent while the skill it
    // names did not exist. A consumer arriving at this kind had the shape and
    // no account of what a token position MEANS, which stores sit beside it,
    // or why a step may write here and not to `memory`.
    skill: "workflow-state",
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
    // NOT work. A board is a way of LOOKING at work, and `check:graph-kind-work`
    // asks the question because the two are easy to conflate: `beans`, `todos`
    // and `workflow-state` each record something somebody is partway through,
    // and a board records none of it. Deleting every board loses no position
    // in any process.
    recordsWork: false,
    skill: "todo-manager",
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
    // NOT work either, and this is the sharper of the two. It IS `state` —
    // written by a running process — which is exactly what makes the question
    // worth asking: state that records a POSITION IN A PROCESS is work, and
    // state that records a position ON A CANVAS is not. Losing this file loses
    // where things were drawn and nothing about what is outstanding.
    recordsWork: false,
    skill: "todo-manager",
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
    summary:
      "The artefact index of a published FHIR Implementation Guide, reconstructed from its " +
      "published output — every artefact by canonical URL and published representation, with " +
      "the DAK API's JSON Schema / JSON-LD sidecars as an overlay where the IG publishes one. " +
      "No IG publishes such an index itself, so every field records which file it came out of.",
    skill: "ig-artifact-ingestion",
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
    skill: "session-context",
    schema: "schemas/session-context.ts",
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
    schema: "schemas/harness-config.ts",
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
    summary: "How far an agent has read an issue — the comment id and the edit time it accounted for.",
  },

  memory: {
    type: termIri("MemoryGraph"),
    renderable: false,
    holds: "context",
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
    skill: "confirmation-waiver",
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
    // A `.po` catalogue and its manifest are authored content in another
    // language, not a record of a translation having happened.
    holds: "content",
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
const REGISTRATION_MODULE: Readonly<Record<string, string>> = {
  // declared-path-literal: NOT a declared path — this is the module SPECIFIER
  // a reader must import, quoted inside an error message so the remedy can be
  // pasted. It resolves through the module graph, not through the declaration,
  // so routing it through a directory resolver would be a category error.
  folio: "schemas/folio-graph-kind.js",
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

/** Is a graph of this kind expected to render as a website? */
export function isRenderable(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return registry.get(kind)?.renderable === true;
}

/**
 * What a running process does with a graph of this kind, or `undefined` for a
 * kind this registry does not know.
 *
 * **`undefined` is a further state and callers must not collapse it.** An
 * unregistered kind has not said `content`; it has not said anything, and a
 * consumer that reads the absence as content will hand somebody a QA verdict
 * where they asked for a skill. The predicates below are deliberately NOT each
 * other's negations for the same reason.
 */
export function graphLayer(kind: string, registry: GraphKindRegistry = defaultGraphKinds): GraphLayer | undefined {
  return registry.get(kind)?.holds;
}

/** Does this kind hold the subject matter? False for an unregistered kind. */
export function isContentGraph(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return graphLayer(kind, registry) === "content";
}

/**
 * Is this STATIC state — read during a process and never written by one?
 *
 * False for an unregistered kind, and false for `content`. There is
 * deliberately no `isNotContent` convenience: "is this the subject matter" and
 * "may a step write this" are different questions, and one predicate answering
 * both is how two call sites come to disagree about which they asked.
 */
export function isContextGraph(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return graphLayer(kind, registry) === "context";
}

/**
 * Is this LIVE state — a record a running process writes as it goes?
 *
 * **Narrowed when `context` arrived.** It previously answered for every
 * non-content kind, so a caller asking "may a step write this" got `true` for
 * a memory entry. Anything that meant "not content" must now say which of the
 * two it meant.
 */
export function isStateGraph(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return graphLayer(kind, registry) === "state";
}

/**
 * Is this DERIVED material — produced from a source, regenerable, and not the
 * working corpus?
 *
 * Owner, 2026-09-20: *"library is static (only if we materialize assets or
 * not)"* and *"can duplicate asset into a folio and work there"*. Bean `hqku`.
 *
 * **Why `context` was the wrong answer, and it was ruled out by a rule rather
 * than by taste.** `library/` is static for authoring — nobody edits a section
 * in place; the asset is duplicated into the folio and worked on there. That
 * sounds exactly like `context`. But `context` carries *"a step that writes to
 * it is a defect, not an update"*, and `document-ingestion.bpmn` WRITES
 * `library/`. Declaring it `context` would have made a declared process a
 * defect by the axis's own rule.
 *
 * **And `content` was wrong in the other direction.** The sweep rule is *"only
 * on active/working content"* (owner, 2026-09-20): a QA finding against a
 * derived section is a finding against its GENERATOR, not against the corpus,
 * and it sends a reviewer to fix the wrong file.
 *
 * The skill's two supporting questions disagree here — *"does it stand on its
 * own?"* says content (a library section still reads), *"would you regenerate
 * it or re-author it?"* says regenerate — and the skill's instruction for that
 * case is to **say so rather than picking**. This layer is saying so.
 */
export function isDerivedGraph(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  return graphLayer(kind, registry) === "derived";
}

/**
 * May a running process WRITE to a graph of this kind?
 *
 * The question `isStateGraph` is usually being asked in service of, named so a
 * caller does not have to know that `state` is the only writable layer — and
 * so that adding a fourth value later is one edit here rather than a search
 * for every `=== "state"`.
 *
 * `content` is `false` on purpose even though a process certainly produces
 * content: writing content is the SUBJECT of an authoring process, governed by
 * the HCI validation gate and the commit boundary, not a bookkeeping write a
 * step performs in passing. Those are the writes this predicate is about.
 */
export function processMayWrite(kind: string, registry: GraphKindRegistry = defaultGraphKinds): boolean {
  const layer = graphLayer(kind, registry);
  return layer === undefined ? false : layerIsWritable(layer);
}

/**
 * THE rule, in one place: only `state` is written by a running step.
 *
 * Extracted when declared ASSETS gained a layer (bean `7syd`), because the
 * alternative was a second `=== "state"` in {@link processMayWriteAsset} —
 * and the promise {@link processMayWrite} already made, that a fourth layer is
 * one edit rather than a search, is only true while there is one site to edit.
 *
 * It takes a {@link GraphLayer} and not a kind on purpose: a declared asset
 * has a layer and no graph kind, so a kind-shaped rule could not have been
 * reused and would have been copied instead.
 */
export function layerIsWritable(layer: GraphLayer): boolean {
  return layer === "state";
}

/** Every registered kind on one side of the line, sorted. */
export function graphKindsOfLayer(layer: GraphLayer, registry: GraphKindRegistry = defaultGraphKinds): string[] {
  return registry.names().filter((n) => graphLayer(n, registry) === layer).sort();
}

// ── The declaration ─────────────────────────────────────────────

/**
 * One declared place to look, with no statement about inheritance.
 *
 * The base both an instance directory and a GRAPH NODE share. See
 * {@link GraphNodeDirectorySchema} for why the two are not one type.
 */
export interface GraphNodeDirectory extends KgNodeLabels {
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
  graphKinds: GraphKind[];
}

/**
 * One declared directory of an INSTANCE — a place to look, plus what a
 * dependent does about it.
 *
 * The single field separating this from {@link GraphNodeDirectory} is the
 * one a graph node cannot answer: nothing resolves a node across instances,
 * so "does a dependent get its own?" has no meaning there.
 */
export interface ContentDirectory extends GraphNodeDirectory {
  /**
   * Whether a DEPENDENT instance materialises its own copy of this directory.
   *
   * Orthogonal to {@link GraphNodeDirectory.scope}, which says where a path
   * RESOLVES. This says whether a folio depending on this instance gets one
   * of its own. Required, because neither default is safe — see
   * {@link DependentMaterialisationSchema} for the measurement.
   */
  dependents: DependentMaterialisation;

  /**
   * What makes this subgraph reachable — a renderer, a documentation entry,
   * and a governing skill — or the reasons it does not need one.
   *
   * OPTIONAL on purpose, unlike {@link dependents} above. An absent field is
   * exactly the finding `check:subgraph-coverage` exists to raise, so making
   * it required would both destroy the measurement and bill every concurrent
   * branch for a field they had no reason to know about — which is what
   * `dependents` did the day it landed. See {@link SubgraphCoverageSchema}.
   */
  coverage?: SubgraphCoverage;

  /**
   * Which theme this subgraph renders on — one answer for every surface that
   * renders it (navbar section, board panel, sticky).
   *
   * Absent means the instance's own theme. See {@link ContentDirectorySchema}
   * for why it lives on the directory and why the methodologies take
   * `analyst`.
   */
  theme?: string;
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
  /** Graphs known but not held — {@link RemoteGraph}. */
  remoteGraphs?: RemoteGraph[];
  /**
   * Sticky notes this layer contributes to the landing board.
   *
   * **A contribution, not a list somebody else owns.** The owner's ask was
   * *"each intiator should create its own sticky"*, and this is the seam that
   * makes it true: the board is composed from whatever the layers present
   * declare, so a new layer adds its card by declaring one rather than by
   * editing a constant in the layer above. See
   * {@link StickyContribution} for why this is a declaration rather than a
   * code registry — bootstrap holds no TypeScript and may not import the
   * layer composed on top of it, so a registry is a seam it cannot reach.
   *
   * Optional, and absent means **this layer contributes none** rather than
   * "unmigrated". That is the honest reading and the useful one: a bare
   * bootstrap instance with no cat is the owner's ruling, and a default here
   * would hand one back.
   */
  stickies?: StickyContribution[];
  /**
   * What this instance is excused from rendering, and what it carries instead.
   *
   * See {@link RenderExemption}. **Absent is the normal case** — every
   * instance owes a visualiser per declared subgraph, which is the `2krx` QA
   * axis. Present means a layer has traded that obligation for another one it
   * names, and it is refused without a `reason` and an `owes`.
   */
  renderExemption?: RenderExemption;

  /**
   * The instances this one is BUILT ON — its layer stack, foundation first.
   *
   * The owner, 2026-09-20: *"So bootsteap, cat harness, fa-core, f-a, from
   * bottom to top."*
   *
   * **Absent is UNDETERMINED, `[]` is the floor**, and a consumer that
   * treated them as the same would place every unlabelled instance beside
   * the bootstrap. See the schema field for why this is declared rather
   * than computed, and why it is optional.
   */
  needs?: string[];
}

/**
 * Whether a DEPENDENT instance materialises its own copy of this directory.
 *
 * ## The question this answers, and why `scope` cannot
 *
 * `scope` says WHERE a path resolves — against the instance or against the
 * repository. This asks something orthogonal: when another instance depends on
 * mine, **does it get one of its own?** The two are independent, and treating
 * them as one axis was measured and refused: moving one queue by giving
 * `uploads` `scope: "repository"` turned **6 tests red**, three of them the
 * guarantee a dependent inherits its own `uploads/` and `library/`.
 *
 * - **`reproduce`** — the directory is part of the SHAPE a folio has. A
 *   dependent gets its own, empty, with a keep marker. `uploads/` and
 *   `library/` are the worked examples: an ingestion queue with the
 *   dependency's files in it would be worse than useless.
 * - **`skip`** — the directory is merely WHERE THIS INSTANCE'S CONTENT LIVES.
 *   A dependent reads it through the overlay and materialises nothing.
 *   `schemas/`, `tools/` and `src/skills/` are the platform's own.
 *
 * ## It does not touch resolution, only materialisation
 *
 * A `skip` entry is still RESOLVED into a dependent's directory list, because
 * that is how the cross-instance overlay serves a dependency's skills —
 * `skill_list` and `skill_fetch` depend on it. What `skip` suppresses is
 * `mkdirSync`, nothing else. Conflating the two would break the overlay to fix
 * a directory-creation problem.
 *
 * ## Why REQUIRED, when nearly every other field here is optional
 *
 * Because neither default is safe, which is unusual and is the whole argument.
 * Defaulting to `reproduce` is today's behaviour and ships junk: simulated on a
 * fresh folio depending on this instance, **12 directories are inherited** and
 * four of them are the platform's own, each materialised empty with a committed
 * keep marker — the `dh4f` shape, shipped downstream to every folio.
 * Defaulting to `skip` silently stops a folio getting an ingestion queue, and
 * nothing would fail. A field whose wrong value is invisible either way is a
 * field that has to be written down, so this follows the `BLOCK_KINDS`
 * discipline: a directory added without a classification does not compile.
 */
export const DependentMaterialisationSchema = z.enum(["reproduce", "skip"]);
export type DependentMaterialisation = z.infer<typeof DependentMaterialisationSchema>;

/**
 * A place to look, with no statement about inheritance.
 *
 * ## Why this is separate from {@link ContentDirectorySchema}
 *
 * One schema served two jobs that differ in exactly one respect. An INSTANCE
 * directory can be inherited by a dependent, so "does a dependent get its own?"
 * is a real question about it. A GRAPH NODE — `beans/defs`, `todos/feedback` —
 * lives inside a graph that is inherited or not as a whole; nothing ever
 * resolves a node across instances, so the question has no answer there.
 *
 * Making `dependents` required on the shared schema forced every graph node to
 * state something meaningless, and a required field that is sometimes noise is
 * a required field people learn to fill in without reading. That is the
 * failure mode the requirement exists to prevent, arriving by the back door.
 *
 * **This is a split, not a restatement.** `ContentDirectorySchema` extends this
 * one, so the shape is still declared once — which is the property
 * `bean-graph.ts` and `todo-graph.ts` were reusing it for.
 */
/**
 * Accept the pre-2026-09-21 spelling `graphs` where `graphKinds` is absent.
 *
 * An in-tree declaration is migrated by the same commit that renames the
 * field; a DOWNSTREAM one is not, and `readDeclaration` throws on a
 * present-but-unreadable declaration rather than falling back. Without this an
 * unmigrated folio would stop resolving its own directories — the breakage
 * `GRAPH_KIND_ALIASES` exists to prevent one layer down, for exactly the same
 * kind of rename.
 *
 * Deliberately NOT a merge: if a declaration carries both, `graphKinds` wins
 * and the legacy key is ignored, because two spellings that disagree is the
 * one case where guessing which is current would be worse than either answer.
 */
function acceptLegacyGraphsKey(v: unknown): unknown {
  if (typeof v !== "object" || v === null) return v;
  const o = v as Record<string, unknown>;
  if (o.graphKinds !== undefined || o.graphs === undefined) return v;
  const { graphs, ...rest } = o;
  return { ...rest, graphKinds: graphs };
}

const GraphNodeDirectoryShape = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  ...scopeShape,
  // Open string here, checked against the registry in `readDeclaration`.
  // A closed enum would have to be built at module load, which is before core
  // has registered `folio` — so the enum would reject the one kind the whole
  // rendering pipeline depends on.
  //
  // NAMED `graphKinds` SINCE 2026-09-21, AND THE OLD NAME WAS THE CONFLATION.
  // The field lists KINDS, never graphs: `{ path: "voices/", graphKinds: ["voices"] }`
  // says the graph here is OF KIND `voices`, but read literally it asserts the
  // directory IS the voices graph — and `cat-harness` is declared by 22
  // directories, so twenty-two of them each claimed to be the one cat-harness
  // graph. That is why `GraphKind` read as redundant beside it: the type was
  // honest and the data was not.
  graphKinds: z.array(z.string().min(1)).min(1),
  ...kgNodeLabelShape,
});

/** The directory schema callers use — legacy `graphs` accepted, `graphKinds` canonical. */
export const GraphNodeDirectorySchema = z.preprocess(acceptLegacyGraphsKey, GraphNodeDirectoryShape);

/**
 * What makes a declared subgraph REACHABLE — and the reasons it may not need
 * to be.
 *
 * The owner, 2026-09-20: *"everytime an instance names a directory as a
 * subgraph, it needs (QA valduation) to have visualizer, documenationentry. QA
 * if no skill, no tools."* Three obligations that fail differently, so they are
 * three fields rather than one flag:
 *
 * - `visualiser` — something renders it. Without one, a reader cannot LOOK.
 * - `docs` — something says what it is FOR. Without one, a reader who finds it
 *   cannot tell what belongs in it.
 * - `skill` — a skill governs it. Without one there is nothing for an agent to
 *   invoke, so the graph is agent-unreachable even where a human can read it.
 *   This is the sharpest of the three and the easiest to miss, because the
 *   directory looks perfectly fine.
 *
 * ## Every field is OPTIONAL, and that is deliberate
 *
 * `dependents` was made REQUIRED four hours before this was written, and the
 * bill landed on a sibling branch within the hour: `main` added two directory
 * entries without it, and CI on the merged tree reported 166 failures and 35
 * errors. Nothing was wrong with either side. **A required field is a change
 * every concurrent branch pays for**, and this one does not need to be
 * required to do its job — an absent field is exactly the finding the axis
 * exists to raise.
 *
 * ## `exempt` carries a REASON, never a bare true
 *
 * Not every subgraph wants a viewer: `interaction/` is read by an agent at
 * session start and a human page for it may be pointless. But an opt-out with
 * no reason is a silence list, and the next person cannot tell a considered
 * waiver from a shrug. So the value is the reason, and the axis prints it.
 */
/**
 * ONE visualisation of a subgraph — where it is rendered, and what to call it.
 *
 * The owner, 2026-09-20, correcting the framing of the question put to them:
 *
 * > its not a function of nodes, its a function of a harness watching a
 * > directort in repo root/ … if harness declares visaluzers, those should
 * > have tile. defaults to theme, but new can be changed. harness can declare
 * > >= 1 visualiztion (which then has a title)
 *
 * So a directory may be rendered more than once — a library as a shelf and as
 * a map are two visualisations of one graph — and each needs a name, because a
 * tile that says only "library" cannot say which of the two it opens.
 *
 * ## Every field but `ref` is optional, and that is the inheritance rule
 *
 * A visualisation that states only where it is rendered is **complete rather
 * than invalid** — the same rule `semantic-zoom.ts` encodes and for the same
 * reason. `title` falls back to the directory's id, `surfaces` to both, `theme`
 * to the directory's, `hidden` to false. Requiring any of them would make every
 * existing declaration in this repository invalid on the commit that added the
 * field, which is the cost `dependents` already charged once.
 */
export const VisualisationSchema = z.object({
  /** The page that renders it, **relative to the REPOSITORY root** — see {@link SubgraphCoverageSchema.visualiser}. */
  ref: z.string().min(1),
  /** What a tile calls it. Absent falls back to the directory's id. */
  title: z.string().min(1).optional(),
  /**
   * Where its tile appears. Absent means BOTH.
   *
   * Q11, 2026-09-20: *one declaration, per-surface visibility.* A tile is
   * declared once and says where it shows — never two registries free to
   * disagree about what a tile is.
   */
  surfaces: z.array(z.enum(["navbar", "board"])).nonempty().optional(),
  /**
   * Whether this tile starts out of frame. Absent means shown.
   *
   * Q9: *declared default, reader may override.* The folio says which tiles
   * start hidden; a reader's own hiding is theirs alone and is committed
   * nowhere — which is `reader-filter.ts`'s rule on another surface.
   */
  hidden: z.boolean().optional(),
  /** The tile's theme. Absent means the directory's, then the instance's. */
  theme: z.string().min(1).optional(),
  /**
   * WHICH GLYPH the tile wears, by NAME. Absent falls back to the generic
   * node-graph glyph every tile shared before this field existed.
   *
   * ## A name, and emphatically not markup
   *
   * `tileLink` assigns its glyph with `innerHTML`. A field carrying SVG would
   * therefore make a DECLARATION an HTML injection site — and a declaration is
   * inherited: a dependency's `<instance>.json` reaches this instance through
   * `resolveSkillDirs`, so the markup would not even have to be written by
   * somebody with commit access here.
   *
   * So this names a glyph in the client's own registry and default-denies
   * anything it does not know, which is R17's rule (*"skill tool hints for
   * XSSrsiction"*) applied one surface along: an allow-list is wrong only
   * about things it refuses, and a refusal is visible.
   *
   * ## Why an unknown name is a FALLBACK and not a failure
   *
   * The registry lives in `docs-ui.js` and the declaration lives here, so the
   * two are deployed together but AUTHORED apart — a folio may declare a glyph
   * against a newer platform than the one rendering it. A tile that vanished
   * or threw on an unrecognised name would turn a cosmetic mismatch into a
   * missing navigation entry. It renders the generic glyph instead, which is
   * exactly what it rendered before anybody declared one.
   */
  icon: z.string().min(1).optional(),
  /**
   * WHERE this visualisation may be published. Absent means everywhere, which
   * is what every visualisation did before this field existed.
   *
   * `"staging-only"` renders the page and keeps it OUT of the canonical
   * deploy: visible in a local build and in a `STAGING/<slug>/` preview,
   * absent from the published site.
   *
   * ## Why a graph would want that
   *
   * `fsh-guts` is the worked case and the owner's ruling of 2026-09-21. Its
   * declaration calls it *"the trashcan that is kept"* — deprecated content
   * relocated rather than deleted, because a scrapped item stops the next
   * agent re-entering a dead end while a deleted one cannot be told from an
   * accident. It was DELIBERATELY unrendered so that something could be kept
   * without being published, and the owner then asked to see it. Both things
   * are wanted: a reader here can browse it, a reader of the published site
   * does not meet it.
   *
   * ## The default is the SAFE direction, and that is the whole design
   *
   * Composition hides a staging-only visualisation unless it is positively
   * told otherwise (`compose-docs --staging`). So a forgotten flag HIDES TOO
   * MUCH — a missing page in a preview, immediately visible to whoever is
   * looking at the preview, and fixed by re-running with the flag.
   *
   * The opposite default fails the other way: a canonical build that forgets
   * its flag PUBLISHES content somebody chose not to publish, which is not
   * visible from the build at all and is not undone by deleting the page
   * afterwards. When the two error directions are that asymmetric, the
   * default belongs on the recoverable side.
   *
   * This is deliberately NOT expressed as `hidden`. That field says where a
   * tile appears among tiles; this says whether the page may be deployed, and
   * a reader who can reach a page by typing its URL is not helped by a tile
   * that declined to mention it.
   */
  publish: z.enum(["staging-only"]).optional(),
});
export type Visualisation = z.infer<typeof VisualisationSchema>;

/**
 * What `coverage.visualiser` accepts: one path, or several visualisations.
 *
 * **A bare string still parses**, and that is the whole shape of this change.
 * 27 declared paths in this repository are bare strings today; a widening that
 * cost each of them an edit would be a required-field change wearing an
 * optional one's clothes, and every concurrent branch would pay for it.
 */
export const VisualiserDeclarationSchema = z.union([
  z.string().min(1),
  z.array(VisualisationSchema).nonempty(),
]);
export type VisualiserDeclaration = z.infer<typeof VisualiserDeclarationSchema>;

/**
 * Every visualisation a directory declares, normalised.
 *
 * The ONE place a bare string becomes a list, so no consumer has to know that
 * the field has two shapes — which is this repository's standing rule: *a
 * downstream consumer must never have to string-manipulate, re-derive, or
 * assume a rule in order to use what we publish.*
 *
 * `[]` for a directory that declares none. That is a real answer and a
 * different one from "declares a visualiser that does not resolve", which is
 * `flh4`'s distinction and is checked elsewhere.
 */
export function visualisationsOf(
  coverage: SubgraphCoverage | undefined,
  directoryId: string,
): Array<Visualisation & { title: string }> {
  const v = coverage?.visualiser;
  if (v === undefined) return [];
  const list: Visualisation[] = typeof v === "string" ? [{ ref: v }] : v;
  return list.map((entry) => ({ ...entry, title: entry.title ?? directoryId }));
}

/** Does this visualisation's tile appear on this surface? Absent means both. */
export function showsOn(v: Visualisation, surface: "navbar" | "board"): boolean {
  return v.surfaces === undefined || v.surfaces.includes(surface);
}

export const SubgraphCoverageSchema = z.object({
  /**
   * The page that renders this subgraph, **relative to the REPOSITORY root**
   * — not to the instance, which is what the sibling `path` on
   * {@link ContentDirectorySchema} is relative to.
   *
   * The two bases differ and nothing said so until 2026-09-20. Measured then
   * across both declarations in this repository: of 27 coverage paths, **25
   * resolve only from the repo root**, 2 from both (the root declaration's
   * own, where the two roots coincide) and **none** from the instance root
   * alone.
   *
   * It is worth stating here rather than leaving to be rediscovered, because
   * a consumer whose instance root is a subdirectory gets a plausible wrong
   * answer rather than an error: `state-visualizer.ts` runs with
   * `ROOT = cat-harness/`, so `join(ROOT, cov)` finds nothing and reports
   * every declared visualiser as absent. That very nearly shipped as a page
   * of false "the declared visualiser is not there" findings (bean `flh4`),
   * and it was caught only because the corpus was measured first.
   *
   * Whether the asymmetry should stay is bean `yt7j` and is the owner's call:
   * 27 declared paths resolve against it today, so this comment records the
   * behaviour rather than changing it.
   */
  visualiser: VisualiserDeclarationSchema.optional(),
  /** The documentation entry, **relative to the REPOSITORY root** — as {@link visualiser}. */
  docs: z.string().min(1).optional(),
  /** The skill that governs it, by NAME rather than by path, so no base applies. */
  skill: z.string().min(1).optional(),
  /**
   * What produces this directory's SERIALISATIONS — `json`, `jsonld` and
   * `schema.json` at the directory's own URL.
   *
   * The owner, 2026-09-20: *"all dir urls should have json, jsonld,
   * schema.json like `<base-url>/beans.jsonld`"*.
   *
   * **This is the one obligation with no by-kind exemption, and `hfkl` is why.**
   * `bootstrap` is excused a visualiser — *"it is exception to
   * harness/layer not having visualtion/workflow visualizer. but it must have
   * its json/jsonld… that is its existence."* The thing it is excused INTO is
   * this. So a directory may be exempt from being LOOKED at and is never
   * exempt from being READABLE BY A MACHINE: the visualiser is the courtesy,
   * the serialisation is the existence claim.
   *
   * ## It is NOT WAIVABLE, and that is the one asymmetry in this object
   *
   * Every other criterion here takes an `exempt.<criterion>` reason, because a
   * waiver with a reason is how this repository records a considered exception
   * rather than a silence. This one does not, on the owner's ruling,
   * 2026-09-20: *"harnesses cannot override there being in the KG."*
   *
   * An instance may decide nothing renders a directory, nothing documents it
   * and nothing governs it — those are choices about EFFORT. Whether its nodes
   * are addressable is not a choice about effort, it is the claim that they
   * are in the graph at all. A harness that could waive it could declare a
   * directory into the knowledge graph and then make its contents
   * unreachable, which is the `dh4f` defect with a signature on it.
   *
   * So `exempt` below carries three keys and not four, deliberately. If this
   * ever grows a fourth, that ruling has been reversed and the reversal
   * belongs here.
   */
  serialisations: z.string().min(1).optional(),
  exempt: z
    .object({
      visualiser: z.string().min(1).optional(),
      docs: z.string().min(1).optional(),
      skill: z.string().min(1).optional(),
      // NO `serialisations` — see the field above. Not an omission.
    })
    .optional(),
});
export type SubgraphCoverage = z.infer<typeof SubgraphCoverageSchema>;

const ContentDirectoryShape = GraphNodeDirectoryShape.extend({
  dependents: DependentMaterialisationSchema,
  coverage: SubgraphCoverageSchema.optional(),
  /**
   * This directory is what answers at the instance's own route, `/<instance>/`.
   *
   * `mount-instance-docs.ts` publishes an instance's content twice: at
   * `/<kind>/<instance>/` for every renderable kind it declares, and once at
   * `/<instance>/` — the instance's themed root, per the owner's 2026-09-20
   * ruling that *"`/docs/who-iris/` should be the cat-harness handler default
   * for docs. who-iris themed at `/who-iris/`."*
   *
   * **Until this field existed, the second route went to whichever kind sorted
   * first alphabetically** — and the comment doing the sorting said, in as many
   * words, that the choice "is the instance's own business". It was not: it was
   * the alphabet's. who-iris declaring both `docs` and `library` made that
   * concrete, because `docs` sorts first and the themed root would have served
   * the documentation, contradicting the ruling it was implementing.
   *
   * Optional, because an instance declaring ONE renderable kind has nothing to
   * choose. With several and none marked, the mount reports the root as
   * UNDETERMINED and keeps the deterministic order rather than silently
   * picking — a site must serve something there, and a quiet pick is how the
   * wrong page became the front door in the first place.
   */
  instanceRoot: z.boolean().optional(),
  /**
   * This directory is AUTHORED FOR THE SITE'S PIPELINE, so compose it into the
   * Jekyll source instead of mounting its built output.
   *
   * Two ways an instance's content can reach the site, and they are not
   * interchangeable:
   *
   * | | when | what it gets |
   * |---|---|---|
   * | **mounted** (default) | after Jekyll, copied into `_site` | nothing — no layout, no sidebar, no front matter |
   * | **composed** (`true`) | before Jekyll, into `_docs/<instance>/` | the real just-the-docs page: sidebar, nav, language bar, QA badges |
   *
   * The owner's ruling on `n0nf` has both readings in one sentence — *"harness
   * can have docs/ which then get listed under `cat-harness/docs/<harness>`,
   * there is also docs/ dir in repo root … other harness augment or overlay
   * ontop of that"*. `compose-docs.ts` read the second clause and
   * `mount-instance-docs.ts` the first, and neither implemented *listed under*
   * as composition. This field is that clause.
   *
   * **Opt-in, and it must stay opt-in.** `who-iris/` is a REPLICA of IRIS:
   * just-the-docs' layout would replace IRIS's chrome with folio-assistant's,
   * which is the opposite of what a replica is for, and
   * `mount-instance-docs.ts` says exactly that where it declines to run Jekyll
   * over these directories. A composed default would silently restyle it.
   *
   * A composed directory holds **markdown with front matter**, not finished
   * HTML — Jekyll renders it. Declaring `composed` over a directory of
   * `<!doctype html>` files publishes them as page BODIES inside a layout,
   * which is a nested document rather than an error, so nothing downstream can
   * catch it for you.
   */
  composed: z.boolean().optional(),
  /**
   * Which theme this subgraph renders on.
   *
   * The owner, 2026-09-20: *"theme for analyst apply to the methodlogies
   * (CRDM, MADR, SDLC, etc.)"*, with *"use judgement"* on how.
   *
   * ## Why the DIRECTORY carries it
   *
   * A theme was previously declarable in two places — a sticky
   * (`StickyContribution.theme`) and, since bean `5y4b`, a todo. Neither
   * answers "what does this SUBGRAPH look like", which is the question a
   * per-instance navbar section and a board panel both ask (`603s`, `6lb8`).
   * Putting it on the directory means one methodology declares its theme once
   * and every surface that renders the methodology agrees, instead of each
   * surface deciding separately and drifting.
   *
   * ## Judgement applied: the methodologies take `analyst`, and nothing else does
   *
   * `methodologies`, `methodology-crdm`, `methodology-raci` and
   * `smart-kg-methodologies` — the four directories that hold or index a
   * methodology. MADR and SDLC are named in the instruction and do not exist
   * yet; they inherit the answer when they are declared, which is the point of
   * writing it on the directory rather than per page.
   *
   * Not applied to the rest. A theme on every directory would make the field
   * mean nothing, and this repository's own rule is that a distinction which
   * fires on every subject is not a distinction.
   *
   * ## Open string, like every other theme reference here
   *
   * Closing the enum means importing the theme table into the declaration
   * reader, and that reader is what the site build, the gates and every
   * consumer of a `harness.json` go through. An unknown theme is a rendering
   * finding, not a parse error.
   */
  theme: z.string().min(1).optional(),
});

/** As {@link GraphNodeDirectorySchema}, for an instance's own directories. */
export const ContentDirectorySchema = z.preprocess(acceptLegacyGraphsKey, ContentDirectoryShape);

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
  // `dependents` on the CONVENTIONAL set, classified by the same question as
  // every declared entry: would a folio depending on this one want its own?
  //
  // The four `skip` entries are the platform's own machinery — a folio reads
  // this instance's schemas, tools and skills through the overlay and has no
  // use for four empty directories bearing those names. The four `reproduce`
  // entries are the shape a folio HAS: its own work plan, its own todos, its
  // own ingestion queue, its own L1 library.
  //
  // `beans/` and `todos/` are marked `reproduce` and it costs nothing, because
  // both are repository-scoped and `resolveDirectories` never inherits a
  // repository-scoped entry in the first place. Classifying them anyway keeps
  // the rule "every entry carries one" free of an exception nobody would
  // remember — and if either ever loses that scope, the classification it
  // already has is the right one.
  { id: "tools", path: "tools/", dependents: "skip", graphKinds: ["tools"] },
  { id: "schemas", path: "schemas/", dependents: "skip", graphKinds: ["schemas", "cat-harness"] },
  { id: "cat-harness", path: "skills/", dependents: "skip", graphKinds: ["skills"] },
  // THE CONVENTION, as of 2026-09-21: an instance's KGraph is five sibling
  // directories rather than one with subdirectories. `scenarios/` and
  // `processes/` were `skills/roles/` and `skills/workflows/`, found by
  // walking down from the skills root.
  //
  // They are listed here and not only in the declarations because
  // `DEFAULT_DIRECTORIES` is what an instance with NO declaration resolves
  // against — AGENTS.md: "an unmigrated instance falls back to today's
  // conventions". Leaving them out made that fallback describe yesterday's,
  // which is how the workflow-coverage fixtures went blind: they write a
  // temp root with no declaration, so every diagram they create resolved
  // through this list or not at all.
  //
  // Existence-filtered like every other entry, so an instance that has no
  // `processes/` is not claimed to have an empty one — the `dh4f` defect.
  { id: "scenarios", path: "scenarios/", dependents: "skip", graphKinds: ["scenarios"] },
  { id: "processes", path: "processes/", dependents: "skip", graphKinds: ["processes"] },
  { id: "beans", path: "beans/", dependents: "reproduce", graphKinds: ["beans"] },
  { id: "todos", path: "todos/", dependents: "reproduce", graphKinds: ["todos"] },
  { id: "uploads", path: "uploads/", dependents: "reproduce", graphKinds: ["uploads"] },
  { id: "library", path: "library/", dependents: "reproduce", graphKinds: ["library"] },
  // `skills/voices/`, not `voices/`, since 2026-09-21 — a voice IS a skill, and
  // the four this repository ships moved under `skills/` with the rest of the
  // `kg` graph (bean `btuv`). The convention stated here and the fallback
  // `VOICES_DIR` in `schemas/voices.ts` are ONE fact, and they disagreed for a
  // day: this said `voices/` while that said `skills/voices`.
  //
  // The disagreement was harmless only by accident — `resolveDirectories`
  // drops an entry whose directory is absent, so an undeclared instance with
  // voices under `skills/` got `undefined` here and fell through to
  // `VOICES_DIR`. An accident is not a mechanism, and the next reader would
  // have had to rediscover it to know which of the two was right.
  //
  // The LEGACY path is not dropped: `loadVoices` probes `voices/` when the new
  // one is absent, for the same reason `voiceFilesIn` reads both file layouts
  // — a downstream folio must not be broken by an upgrade it did not ask for.
  { id: "voices", path: "skills/voices/", dependents: "reproduce", graphKinds: ["voices"] },
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

/**
 * A graph this instance KNOWS ABOUT but does not hold.
 *
 * The owner, 2026-09-20: *"any top level repos or KGs in the repo, or
 * navigable if external/remote pointed to in the core harness schema (need to
 * extend so graphs can be url of remote graph)"*.
 *
 * ## A remote graph is NOT a directory, and that is the whole modelling
 *
 * The first cut made `ContentDirectory.path` optional and added a `url` beside
 * it. That is wrong twice over. `bean-graph.ts` and `todo-graph.ts` REUSE
 * `ContentDirectorySchema` for their own nodes — AGENTS.md says so outright,
 * *"a bean-graph entry IS a ContentDirectory"* — and a bean store is never
 * remote, so relaxing the shared schema weakened two graphs that had nothing
 * to do with the change. And a field that is sometimes a path and sometimes an
 * address is one field with two meanings, which every consumer then has to
 * guess between.
 *
 * So this is its own node kind. It has an `id` and `graphs` like a directory,
 * because those are what make it addressable and filterable; it has no `path`,
 * because there is nothing here.
 *
 * ## It is `materialization` at the graph level
 *
 * `folio-assistant-core/schemas/materialization.ts` already names the states a
 * body of content is in, and a declared graph is in the same ones: a
 * `ContentDirectory` is **materialized** (bytes here), a `RemoteGraph` is
 * **referenced** (we know it exists and where, we hold none of it).
 *
 * A reader may FOLLOW a remote graph — the KG viewer does, to keep a hierarchy
 * of named subgraphs navigable across instances that are not in this checkout.
 * Anything that wants the CONTENTS goes through `materialize-remote`: the five
 * gates and a declared purpose, rather than fetching it merely because it has
 * an address.
 */
export interface RemoteGraph extends KgNodeLabels {
  /** Stable identifier, unique within an instance — as on a directory, and for the same reason. */
  id: string;
  /** Where it is. A reader may follow this; a consumer wanting its bytes may not, without the gates. */
  url: string;
  /** Which parts of the knowledge graph live there. */
  graphKinds: GraphKind[];
}

export const RemoteGraphSchema = z
  .object({
    id: z.string().min(1),
    url: z.string().url(),
    graphKinds: z.array(z.string().min(1)).min(1),
    ...kgNodeLabelShape,
  })
  // STRICT, and that is the point rather than tidiness: without it a stray
  // `path` on a remote graph is silently accepted, and the declaration then
  // carries two answers to where the graph is — the exact confusion this node
  // kind exists to prevent. Caught by its own test on the hour it was written.
  .strict();

/**
 * The local path of a declared directory, or `undefined` when the graph is
 * REMOTE.
 *
 * Every consumer that needs bytes on disk goes through this, so "this graph is
 * not in this checkout" is a case each one has to answer rather than a
 * `string` it can assume. When `url` landed on 2026-09-20 the compiler named
 * the whole set in nine errors across six files — which is the set that had
 * been assuming a local path all along, and the reason `path` was made
 * optional rather than widened to hold a URL. A field that is sometimes a path
 * and sometimes an address is one field with two meanings, and every consumer
 * then has to guess which it got.
 */

/**
 * What a {@link RenderExemption} may excuse an instance from.
 *
 * Two entries, because the owner named two and they fail differently: a
 * subgraph nobody can look at, and a process nobody can look at. Closed, so a
 * declaration cannot excuse itself from an obligation nobody has defined.
 */
export const RENDER_OBLIGATIONS = [
  "visualiser",
  "workflow-visualiser",
  /**
   * The instance's OWN `docs/` — its source documentation, at
   * `<instance>/docs/`, as against a handler's rendering of it.
   *
   * Added 2026-09-21 for bean `op30`, and it reuses this mechanism rather than
   * minting a second opt-out because the requirements are identical: an
   * exemption needs a REASON, and a reason with no substitute is a hole. The
   * `owes` field already refuses the hole.
   */
  "own-docs",
] as const;
export type RenderObligation = (typeof RENDER_OBLIGATIONS)[number];

/**
 * An instance's declared exemption from the rendering obligations, with a
 * reason and a substitute.
 *
 * ## The rule this encodes is a FLOOR THAT RISES, not a flat requirement
 *
 * [`cat-harness-minimum`](../docs/architecture/cat-harness-minimum.md) carries
 * *"if it produces something a human looks at, it is not the harness"*, and
 * the same architecture states that an instance renders by default. Read
 * flatly the two cannot both hold. The owner settled it on 2026-09-20: the
 * requirement **starts** at `cat-harness` rather than applying uniformly.
 *
 * | layer | visualiser | its own `.json` / `.jsonld` |
 * |---|---|---|
 * | `bootstrap` | **exempt** — it is the navbar FOOTER | **required** |
 * | `cat-harness` | required | required |
 * | everything above | required | required |
 *
 * `cat-harness` is where the rest begins to apply for an obligation rather
 * than a convention: it is what supplies the layers above with `folio/`, and a
 * layer that hands its dependents a folio and renders nothing itself is asking
 * of them what it did not do.
 *
 * ## Why `owes` is REQUIRED, when it could have been prose in a doc
 *
 * Because an exemption with no substitute is a hole, and a list of holes with
 * no substitutes is a silence list — which is exactly what `2krx` says an
 * opt-out must not become: *"an opt-out needs a REASON per entry … or it
 * becomes a silence list."* bootstrap does not simply drop out of the
 * requirement; in the owner's words its `.json`/`.jsonld` *"is its
 * existence"*, so it trades a criterion it could fail quietly for one it
 * cannot. `owes` is where that trade is written down, and
 * {@link renderExemptionProblems} refuses an empty one.
 *
 * ## Declared locally, validated globally
 *
 * The declaration is local because only the instance knows why. The guard
 * against the exemption SPREADING is not — {@link renderExemptionProblems}
 * takes the count of claimants across the repository, because "only the bottom
 * layer may claim this" is a fact about the stack and cannot be seen from one
 * file. A second claimant is a finding rather than a silent widening: that is
 * the failure mode a self-declared exemption otherwise has, and it is the
 * reason this is not simply a boolean.
 */
export interface RenderExemption {
  /** Which obligations are excused. Non-empty. */
  of: RenderObligation[];
  /** Why this layer is the exception. Prose, and required. */
  reason: string;
  /**
   * What it carries INSTEAD — the criterion it cannot fail quietly.
   *
   * Required. An exemption whose substitute is unstated is indistinguishable
   * from a layer that simply never got round to rendering.
   */
  owes: string;
  /**
   * Where the instance IS reachable, since it renders nothing of its own.
   *
   * Repository-relative, under the site-owning harness's site directory —
   * the same shape `coverage.visualiser` and `coverage.docs` use.
   *
   * ## Why an exemption needs this at all
   *
   * `owes` says what the layer carries instead; it does not say where a
   * READER goes. Those came apart on the navbar: bootstrap is instantiated
   * and correctly has no viewer, so `harness-tiles` found no href and
   * `nav_footer_custom.html` rendered its tab as a greyed `<span>`. The
   * owner, 2026-09-21: *"Boostrap should be clicable. even though it doesnt
   * render itself, cat-bootrap does take over ... render responsibles of
   * bootrstraps json(ld) and documentation."*
   *
   * So the exemption said "I do not render myself" without saying "so go
   * here instead", and `pb04`'s rule — a tab with nowhere to go is not a
   * link — correctly produced a dead tab from a correct declaration. This
   * field is the missing half.
   *
   * ## Optional, and absent is a real state
   *
   * An exempt instance with nothing published about it anywhere has no
   * honest target, and a link invented for it would 404. Absent leaves the
   * tab unlinked, which is what it should be in that case.
   *
   * Consumers MUST check the file exists before linking — a declared path
   * that does not resolve is `flh4`'s defect, and it is a different finding
   * from "nothing is published".
   */
  reachableAt?: string;
}

export const RenderExemptionSchema = z.object({
  of: z.array(z.enum(RENDER_OBLIGATIONS)).min(1),
  reason: z.string().min(1),
  owes: z.string().min(1),
  reachableAt: z.string().min(1).optional(),
});

/**
 * Is this instance excused from `obligation`?
 *
 * The predicate the `2krx` axis calls before raising a no-visualiser finding,
 * so the exemption is read from the declaration rather than from a hardcoded
 * instance name in the checker. A name literal would make the rule true only
 * for the one instance somebody remembered.
 */
export function isExemptFrom(
  d: Pick<CatHarnessDeclaration, "renderExemption">,
  obligation: RenderObligation,
): boolean {
  return d.renderExemption?.of.includes(obligation) ?? false;
}

/**
 * Everything wrong with the exemptions declared across a repository.
 *
 * Empty means every claim is well-formed AND there is at most one claimant.
 * Takes the whole set rather than one declaration for the reason
 * {@link RenderExemption} gives: the shape being guarded is a stack, and a
 * second claimant cannot be seen from the first one's file.
 *
 * **At most one, not exactly one.** A repository that vendors no bootstrap
 * has nothing to exempt, and failing it for that would be asking it to declare
 * something to stay green — which is how a declaration stops meaning anything.
 */
export function renderExemptionProblems(
  claimants: ReadonlyArray<{ name: string; renderExemption?: RenderExemption }>,
): string[] {
  const problems: string[] = [];
  const claiming = claimants.filter((c) => c.renderExemption !== undefined);
  for (const c of claiming) {
    const parsed = RenderExemptionSchema.safeParse(c.renderExemption);
    if (!parsed.success) {
      problems.push(
        `${c.name}: renderExemption is malformed — ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ")}`,
      );
    }
  }
  if (claiming.length > 1) {
    problems.push(
      `${claiming.length} instances claim a renderExemption (${claiming
        .map((c) => c.name)
        .sort()
        .join(", ")}) — the exemption is the BOTTOM of the stack and there is ` +
        `one bottom. A second claimant is the requirement spreading upward, ` +
        `which is what this refuses to do quietly.`,
    );
  }
  return problems;
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
  /**
   * Graphs this instance knows about and does not hold — see {@link RemoteGraph}.
   * A SEPARATE array from `directories`, not a variant of one, because a remote
   * graph has no directory.
   */
  remoteGraphs: z.array(RemoteGraphSchema).default([]),
  stickies: z.array(StickyContributionSchema).optional(),
  renderExemption: RenderExemptionSchema.optional(),
  /**
   * The instances this one is BUILT ON — its layer stack, foundation first.
   *
   * The owner, 2026-09-20, giving the spine in one sentence:
   *
   * > So bootsteap, cat harness, fa-core, f-a, from bottom to top.
   *
   * ## Why this is declared rather than computed
   *
   * The layering was real before it was written down — `bootstrap`'s
   * `renderExemption` already argues from it (*"a floor that RISES … it starts
   * at cat-harness, which is obliged because it supplies the layers above with
   * `folio/`"*) — but it lived only in prose, so every consumer that needed the
   * order had to know it. The navbar needed it and would otherwise have
   * hardcoded four names, which is the failure `hfkl` put the exemption in the
   * declaration to avoid: a rule true only for the instances somebody
   * remembered.
   *
   * ## OPTIONAL, and an absent value is UNDETERMINED rather than "needs nothing"
   *
   * Required would be a change every concurrent branch pays for — `dependents`
   * cost a sibling branch 166 failures on the merged tree four hours after it
   * was made required. And the two states are genuinely different: `[]` is an
   * instance asserting it sits on nothing, which is true of exactly one
   * instance here, while absent is nobody having said. A consumer that treated
   * absent as `[]` would place every unlabelled instance on the floor beside
   * the bootstrap.
   *
   * Names, not paths: an instance is identified by its `name` everywhere else
   * in this schema, and a path would break the moment a directory moved.
   */
  needs: z.array(z.string().min(1)).optional(),
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
 * Resolve a `coverage.visualiser` / `coverage.docs` value to an absolute path.
 *
 * **The base is the REPOSITORY root, and the owner ruled it so on 2026-09-21**
 * (bean `yt7j`, issue #619). This function is that ruling, and it is the only
 * place the base is written down as code rather than as prose.
 *
 * ## Why this exists rather than a `resolve()` at each call site
 *
 * A declared `path` states its own base — instance-relative by default,
 * repository-relative when the entry carries `scope: "repository"`. **A
 * coverage value states nothing.** So the asymmetry `yt7j` records is not
 * "two fields use two bases"; it is *one field declares its base and the other
 * does not*, and a consumer holding a bare string has no way to ask.
 *
 * The cost of leaving that to each caller was measured, not imagined:
 * `state-visualizer.ts` has `ROOT = cat-harness/`, so the obvious
 * `join(ROOT, cov)` reported EVERY declared visualiser as absent. That very
 * nearly shipped as a page of false "the declared visualiser is not there"
 * findings, and it was caught only because the corpus happened to be measured
 * first. The next consumer has no such luck — which is the whole argument for
 * one named answer, the same one {@link siteDirFor} makes about the site root.
 *
 * ## Resolving against "whichever root happens to work" is not a kindness
 *
 * `check-subgraph-coverage.ts` tried the instance root and then the repository
 * root, accepting either. That is worse than picking wrong: a path that is
 * incorrect in its declared base passes anyway via the other, so the check
 * cannot enforce the convention it documents, and the corpus is free to drift
 * into a mix nobody can read. Measured 2026-09-21 before tightening it: of
 * **45** coverage paths in this repository, **45 resolve from the repository
 * root** and the fallback was load-bearing for none.
 *
 * ## Take the repository root; do not derive it here
 *
 * The parameter is the REPOSITORY root, not an instance root, because
 * {@link repoRootFor} overshoots for the one instance where it matters: the
 * root declaration's instance root IS the repository, so going up one lands
 * outside the checkout entirely. A caller that holds an instance root and
 * knows it is nested composes `repoRootFor` itself, at a call site where that
 * assumption is visible.
 *
 * It does not check that the result exists. A caller asking "does this
 * resolve" wants {@link existsSync} on the answer and a three-state verdict
 * around it; folding the question in here would give every consumer a boolean
 * where some of them need to say *where* they looked.
 */
export function resolveCoveragePath(repoRoot: string, coveragePath: string): string {
  return resolve(repoRoot, coveragePath);
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
 * directory carrying a declaration — see {@link findDeclarationFile}.
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
    if (findDeclarationFile(dir) !== undefined) return dir;
    const up = resolve(dir, "..");
    if (up === dir) return undefined;
    dir = up;
  }
}

/**
 * Every instance in `repoRoot` — the repository root itself when it declares,
 * plus each immediate subdirectory that does.
 *
 * {@link findInstanceRoot} walks UP from a path to the instance owning it;
 * this is the same fact in the other direction, and until now it was the
 * direction nobody had implemented — the note on {@link initializationDoc}
 * said so explicitly ("*NOT implemented and is not assumed here*", bean
 * `wggr`).
 *
 * **Two gates were each carrying their own literal `["cat-harness",
 * "bootstrap"]` instead** (`check-declared-assets`, `check-instance-render`),
 * and by 2026-09-20 there were FOUR instances: those two, `folio-assist-core`,
 * and the repository root. So both gates reported clean runs over sets that
 * excluded half the subject — `dh4f` again, in the two checks whose whole job
 * is to look at instances.
 *
 * `check-instance-render`'s literal even sat under the docstring "*Every
 * instance this repository owns — the root, and any beside it*", which was
 * false in both halves: the root was not in the list and two instances beside
 * it were missing. **A list that has to be edited when a directory is added is
 * a list that will be wrong**, and the fix is to ask the filesystem rather
 * than to lengthen it (bean `6tkl`).
 *
 * Scanning is deliberately ONE level deep and skips dot-prefixed segments,
 * matching the dot-prefix guard the directory conventions already apply
 * everywhere else. Results are sorted so a caller's report is stable, with the
 * repository root first when it declares.
 */
export function instanceRootsIn(repoRoot: string): string[] {
  const root = resolve(repoRoot);
  const out: string[] = [];
  if (findDeclarationFile(root) !== undefined) out.push(root);

  let entries: Dirent[];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    // Unreadable root is "could not determine", and a caller that treats an
    // empty list as "no instances" is the very failure this function exists
    // to end — so say nothing rather than claim an empty set.
    return out;
  }

  const subs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => join(root, e.name))
    .filter((p) => findDeclarationFile(p) !== undefined)
    .sort();

  return out.concat(subs);
}

/** {@link findInstanceRoot}, throwing rather than returning `undefined`. */
export function instanceRootFor(start: string): string {
  const root = findInstanceRoot(start);
  if (root === undefined) {
    throw new Error(
      `no \`<name>${DECLARATION_SUFFIX}\` in ${resolve(start)} or any parent — ` +
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
 * publishes them at the SAME place. CatBootstrap then needs no special case per
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
export const CAT_BOOTSTRAP_INIT_DOC = "bootstrap/initialization.md";

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
 * CatBootstrap is handed ONE reference and must reach this file, so it needs the
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
  return `${siteDir(d)}/${CAT_BOOTSTRAP_INIT_DOC}`;
}

export function siteDirFor(root: string): string {
  const file = findDeclarationFile(root);
  // Named as a DIRECTORY when there is none: under `<name>.config.json` there
  // is no single filename to report as missing, and "no declaration in <dir>"
  // is the fact anyway.
  const p = file === undefined ? resolve(root) : join(root, file);
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
 * {@link artefactStub} for the instance rooted at `root`, read from its
 * declaration — the RAW read, for the same reason {@link siteDirFor} takes one.
 *
 * `readDeclaration` validates the whole declaration, which means it throws
 * when ANY directory in it names a graph kind the harness layer has not
 * registered. `siteDirFor` documents that hazard above and avoids it; this is
 * the missing half, and its absence was a real cost rather than a tidiness
 * point: the 2026-09-21 stub rename (issue #649) needed the published artefact
 * name in two Playwright suites, and `readDeclaration` threw there on exactly
 * the unregistered-kind path `siteDirFor` warns about — in a browser job,
 * where the failure reads as "no tests found" rather than as a bad read.
 *
 * Throws rather than defaulting, like its sibling. A guessed artefact name
 * sends a consumer to a document nothing publishes, and "could not determine"
 * is never rendered as an answer.
 */
export function artefactStubFor(root: string): string {
  // Named as a DIRECTORY when there is no declaration, the same way
  // `siteDirFor` is: under `<name>.json` there is no single filename to
  // report as missing, and "no declaration in <dir>" is the fact anyway.
  const file = findDeclarationFile(root);
  const p = file === undefined ? resolve(root) : join(root, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(
      `cannot determine the artefact stub: ${p} is unreadable or not valid JSON ` +
        `(${e instanceof Error ? e.message : String(e)})`,
    );
  }
  const d = raw as { name?: unknown; stub?: unknown };
  const stub = typeof d.stub === "string" && d.stub ? d.stub : d.name;
  if (typeof stub !== "string" || !stub) {
    throw new Error(`cannot determine the artefact stub: ${p} declares neither \`stub\` nor \`name\``);
  }
  return stub;
}

/**
 * A declared asset's path, as the PUBLISHED site serves it.
 *
 * `docs/assets/img/x.webp` → `/assets/img/x.webp`. An instance declares an
 * image by its repo-relative path, and the site build copies the site
 * directory's CONTENTS to the site root — so the declared prefix is exactly
 * what a published URL does not carry.
 *
 * **Derived from {@link siteDirFor}, never from the literal `docs/`.** Two
 * consumers needed this and the first wrote the literal; the second would have
 * copied it, and an instance that moves its site directory would then serve
 * two different answers — one correct, one a 404 that looks like a missing
 * image. `site-dir-single-answer.test.ts` exists for exactly this class of
 * duplicate.
 *
 * A path that does not start with the site directory is **passed through
 * unchanged**: it is either already site-relative or points somewhere this
 * function has no business rewriting, and guessing would turn a working
 * external URL into a broken local one.
 */
export function publishedAssetPath(root: string, src: string): string {
  const prefix = `${siteDirFor(root)}/`;
  return src.startsWith(prefix) ? `/${src.slice(prefix.length)}` : src;
}

/**
 * Where this sticky's declaration can be read and edited, on the forge.
 *
 * ## Both, because they are different acts
 *
 * The owner: *"edit tool = link to github pages edit directrly ... rendeding
 * shows edit src icon (and also need view icon)"*. `/blob/` is reading and
 * `/edit/` opens the editor; a reader who wants to check what a card says
 * should not be taken to a text box, and one who wants to fix it should not
 * have to find the button themselves.
 *
 * ## Absent, not broken, when there is no forge
 *
 * *"if github tools avaialable in rendering pipeline"* — so this is a real
 * probe rather than a hardcoded address. `detectRepoUrl` reads `origin` and
 * `upload-url.ts` already refuses a non-github.com remote for the same reason:
 * the `/edit/<branch>/<path>` form is GitHub's, and emitting it for another
 * forge is a guess wearing a URL's clothes.
 *
 * Returning `undefined` is what makes the control ABSENT rather than dead. A
 * link that 404s is worse than no link: it invites a click, and on a private
 * repository it 404s for exactly the reader who cannot edit, which reads as
 * "this page is broken" rather than "you cannot do this".
 *
 * `declaredIn` is repo-relative and comes from the SUBJECT itself, so a card
 * contributed by `bootstrap` links to `bootstrap/harness.json` rather
 * than to whichever declaration happened to be read first — and a todo links
 * to its own file.
 *
 * ## It lives HERE, below both callers
 *
 * It was in `landing-sticky.ts` until bean `pb04` gave the todo index the
 * same two controls. The owner, 2026-09-20: *"notes exist lower down than
 * folio. make sure arrows correct."* This is not about stickies — it is
 * "where is this file on the forge" — and leaving it up there made a
 * note-layer generator reach sideways into the folio-facing module.
 * `repo-partition` allowed it, because both are `core`; the layer arrow was
 * still wrong. Beside {@link publishedAssetPath}, which is the same shape of
 * transform, both callers point DOWN at one answer instead of at each other.
 */
export function sourceLinks(
  repoUrl: string | undefined,
  declaredIn: string,
  branch: string,
): { viewHref: string; editHref: string } | undefined {
  if (repoUrl === undefined) return undefined;
  const path = declaredIn.split("/").map(encodeURIComponent).join("/");
  return {
    viewHref: `${repoUrl}/blob/${branch}/${path}`,
    editHref: `${repoUrl}/edit/${branch}/${path}`,
  };
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
 * Does an instance declaring a directory of this kind owe a **visualiser**?
 *
 * The owner, 2026-09-20: *"if there is active state directory in repo root/
 * (**not part of the static KG**) like `beans/`, `todos/`, `fsh-guts/` those
 * have their vuisalizers too as requiement of handler.... needs to render
 * sometihng for each 'state' dir it declares/inits."*
 *
 * So the discriminator is the owner's own parenthetical: **is this the static
 * knowledge graph, or is it active material about the work?** Authored
 * subject matter you can read as itself; a record of where something got to
 * you cannot, which is why it needs something that renders it.
 *
 * That is exactly `holds !== "content"`, and the phrasing is not a
 * coincidence — `content` is defined on {@link GraphLayer} as *"authored
 * nodes a reader or a tool consumes as the subject matter… It stands on its
 * own"*. A graph that stands on its own does not need a viewer to be
 * legible. Everything else does.
 *
 * ## The rule this is NOT, and why that matters
 *
 * The first derivation was `holds === "state"`, and it was falsified inside
 * ten minutes: it covers `beans` and `todos` and **misses `fsh-guts`**, which
 * the owner names in the same sentence. `mhh9` reclassified `fsh-guts` from
 * `state` to `context` earlier the SAME DAY, on the ground that no running
 * step writes it — relocating something there is a human-directed act.
 *
 * `holds !== "content"` survives that move, because both `state` and
 * `context` are on the same side of it. That is the test a rule over this
 * axis has to pass: a kind changing category within the non-content layers
 * must not silently change what it owes.
 *
 * ## `renderable` is the one structural exemption
 *
 * A `renderable` kind is its own view — `docs` and `folio` render to pages,
 * so demanding a separate viewer would be asking for a second rendering of
 * the same thing. Both are already `holds: "content"`, so this is belt and
 * braces rather than a second rule; it is stated because a future renderable
 * kind that is not content would otherwise acquire an obligation it meets by
 * construction.
 *
 * ## Bootstrap is exempt by INSTANCE, not by kind
 *
 * `hfkl` carries the owner's ruling that `bootstrap` has no visualiser
 * *"but it must have its json/jsonld... that is its existence"*. That
 * exemption lives in the checker as `VISUALISER_EXEMPT_INSTANCES`, keyed on
 * the instance name, so every other instance declaring the same kind keeps
 * the obligation. An axis that dropped bootstrap by KIND would stop checking
 * the one thing bootstrap must have.
 */
export function owesVisualiser(
  kind: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): boolean {
  const def = registry.get(kind);
  // An UNKNOWN kind owes one, and that is deliberate rather than a fallback.
  //
  // `graphLayer` returns `undefined` here and its doc comment is explicit
  // that callers must not collapse that into `content`. This one does not:
  // it collapses the unknown into OWING, which is the opposite direction and
  // the safe one. A kind nobody has classified must not escape an obligation
  // by being unmentioned — the same reason `DOCUMENT_BLOCK_KINDS` is a
  // derived complement rather than a list.
  if (!def) return true;
  if (def.renderable) return false;
  return def.holds !== "content";
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
export function isPublishedDirectory(d: { graphKinds?: readonly string[] }): boolean {
  return (d.graphKinds ?? []).every(isPublishedGraphKind);
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
  const file = findDeclarationFile(root);
  if (file === undefined) return undefined;
  const p = join(root, file);
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
    `the declaration declares \`publication.host: "${host}"\`, but ` +
    `the config sets \`readme.linkStyle: "pages"\`, which writes every ` +
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
  const file = findDeclarationFile(instanceRoot);
  if (file === undefined) return undefined;
  const p = join(instanceRoot, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf-8"));
  } catch (e) {
    throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const parsed = CatHarnessDeclarationSchema.safeParse(stripJsonLd(raw, registry));
  if (!parsed.success) {
    // ── The one failure worth naming, because it is the one that arrives by
    //    MERGE rather than by editing ───────────────────────────────────────
    //
    // `dependents` is required, so any branch that adds a directory entry
    // while this field exists — and any branch cut before it existed —
    // produces a declaration that will not parse the moment the two meet. That
    // is not hypothetical: main added `methodology-crdm` and `methodology-raci`
    // while the field was in review, and CI on the merged tree reported **166
    // failures and 35 errors** whose only visible cause was a raw Zod dump
    // repeated across every test that reads a declaration.
    //
    // Nothing was wrong with either side. The author of the other branch did
    // not know the field existed, and 166 red tests are a terrible way to find
    // out. So the missing-field case says which entries, and what to write.
    const missing = parsed.error.issues
      .filter((i) => i.path.length === 3 && i.path[0] === "directories" && i.path[2] === "dependents")
      .map((i) => {
        const dirs = (raw as { directories?: Array<{ id?: string }> })?.directories ?? [];
        return dirs[i.path[1] as number]?.id ?? `#${String(i.path[1])}`;
      });
    if (missing.length > 0) {
      throw new Error(
        `${p}: ${missing.length} directory entr${missing.length === 1 ? "y is" : "ies are"} ` +
          `missing the required \`dependents\` field: ${missing.join(", ")}.\n` +
          `  Add \`"dependents": "reproduce"\` if an instance depending on this one should get its ` +
          `OWN copy of the directory (\`uploads/\`, \`library/\`, \`folio/\`),\n` +
          `  or \`"dependents": "skip"\` if it merely says where THIS instance's content lives ` +
          `(\`schemas/\`, \`tools/\`, \`src/skills/\`).\n` +
          `  It has no default on purpose: \`reproduce\` would ship empty directories into every ` +
          `downstream folio, and \`skip\` would silently deny one its ingestion queue.`,
      );
    }
    throw new Error(`${p} is not a valid CatHarness declaration: ${parsed.error.message}`);
  }
  // Kind validation is here rather than in the Zod schema because the
  // vocabulary is open: the set of valid kinds is whatever has been registered
  // by the time the declaration is read, not what existed at module load.
  for (const dir of parsed.data.directories) {
    for (const g of dir.graphKinds) {
      if (!registry.has(g)) {
        throw new Error(
          `${p}: directory "${dir.id}" declares unknown graph kind "${g}". ` +
            `Known kinds: ${registry.names().join(", ")}. ` +
            `A kind contributed by a dependency must be registered before the ` +
            `declaration is read.` +
            (REGISTRATION_MODULE[g] === undefined
              ? ""
              : ` Add \`import "${REGISTRATION_MODULE[g]}";\` to the module that ` +
                `reads this declaration — the import is for its SIDE EFFECT, so it ` +
                `takes no binding and must not be elided.`),
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
      if (e.graphKinds === undefined && e["@type"] !== undefined) {
        const types = Array.isArray(e["@type"]) ? e["@type"] : [e["@type"]];
        const kinds = types
          .filter((t): t is string => typeof t === "string")
          .map((t) => registry.forType(t))
          .filter((k): k is string => k !== undefined);
        if (kinds.length > 0) e.graphKinds = kinds;
      }
      delete e["@type"];
      if (typeof e["@id"] === "string" && e.id === undefined) e.id = (e["@id"] as string).replace(/^#/, "");
      delete e["@id"];
      return e;
    });
  }
  return o;
}

// ── Subgraphs ───────────────────────────────────────────────────

/**
 * A FOLDER CORRESPONDS TO A SUBGRAPH, and subgraphs should be DISCONNECTED.
 *
 * The owner, 2026-09-20, settling bean `x4v4`: *"`cat-harness/methodologies/`
 * is a subgraph. should be disconnected. convention folder corresponds to
 * subgraph (but may be in process of being disentangled). use schema
 * declaration/definition."*
 *
 * The question it settles is not cosmetic. `methodologies/` is declared as a
 * `methodology` graph, and `methodologies/crdm/` and `methodologies/raci/`
 * are declared as `cat-harness` graphs INSIDE it. Nothing said whether the
 * inner graphs' nodes were also the outer one's, and the two readings differ
 * by every node underneath — a consumer scanning `methodologies/` either
 * sees two methodologies or sees two methodologies plus three skills and
 * eight diagrams.
 *
 * **They are not.** A subgraph's nodes are its own. `methodologies/` holds
 * two nodes, and each of those is a graph in its own right.
 *
 * ## Containment is DERIVED, never declared
 *
 * A `parent` or `contains` field would restate what the paths already say,
 * and this repository has paid for one fact in two places often enough to
 * stop writing the second one: the retired skill `roles:` field cost 260
 * dangling values, and `fallbackRole` was removed (bean `85e8`) for exactly
 * this shape — two statements with nothing asserting they agree.
 *
 * So containment is computed from the declaration that already exists. The
 * one thing a reader must know is that **`id` still governs overrides** —
 * path governs only containment. Matching an override on path makes two
 * graphs out of one relocation, which is the rule `resolveDirectories`
 * already states and this does not weaken.
 *
 * ## "Should be" is an intent, and the corpus does not meet it yet
 *
 * Measured 2026-09-20: CRDM's skills reference **seven** skills in
 * `folio-core` (`staging-review`, `interaction-modality`, `todo-manager`,
 * `theme-ui-review`, `directory-conventions`, `decision-comparison`,
 * `data-modelling`). So the methodology subgraphs are entangled today, which
 * is what the owner's *"may be in process of being disentangled"*
 * anticipates.
 *
 * That is why `check:subgraphs` REPORTS and does not gate. A gate that fails
 * on seven edges nobody has yet decided about is the *"check that cries wolf
 * is a check somebody switches off"* failure `known-skills.ts` names — and
 * this session already reached it once by a different route, counting test
 * literals in `check-declared-paths` (bean `dhol`).
 */
export interface SubgraphRelation {
  /** The containing directory's `id`. */
  parent: string;
  /** Directories nested immediately inside it, by `id`. */
  children: string[];
}

/** `a/b/` contains `a/b/c/`; a path never contains itself. */
function pathContains(outer: string, inner: string): boolean {
  const o = `${outer.replace(/\/+$/, "")}/`;
  const i = inner.replace(/\/+$/, "");
  return i !== o.replace(/\/$/, "") && `${i}/`.startsWith(o);
}

/**
 * The subgraph tree, derived from declared paths.
 *
 * Only IMMEDIATE containment: with `a/`, `a/b/` and `a/b/c/` all declared,
 * `a` has one child and not two. A transitive answer would make a node's
 * owner ambiguous, which is the question this whole function exists to give
 * one answer to.
 *
 * Scope matters and is honoured: a `repository`-scoped entry and an
 * instance-relative one resolve against different roots, so they are
 * compared by ABSOLUTE path where one is available. `smart-kg/methodologies/`
 * is repository-scoped precisely so it lifts out whole, and reading it as a
 * child of an instance-relative `methodologies/` would be wrong on both the
 * path and the intent.
 */
export function subgraphTree(
  dirs: ReadonlyArray<{ id: string; path: string; absPath?: string }>,
): SubgraphRelation[] {
  const key = (d: { path: string; absPath?: string }): string => d.absPath ?? d.path;
  const out: SubgraphRelation[] = [];
  for (const parent of dirs) {
    const children = dirs
      .filter((c) => c.id !== parent.id && pathContains(key(parent), key(c)))
      // Immediate only: drop any child that is itself inside another child.
      .filter((c, _i, all) => !all.some((m) => m.id !== c.id && pathContains(key(m), key(c))))
      .map((c) => c.id)
      .sort();
    if (children.length > 0) out.push({ parent: parent.id, children });
  }
  return out.sort((a, b) => a.parent.localeCompare(b.parent));
}

/**
 * The directory that owns a node at `path`, which is the DEEPEST containing
 * declaration rather than the first one found.
 *
 * This is the function a consumer actually needs, and getting it wrong is the
 * `x4v4` defect in its concrete form: a sweep over `methodologies/` that
 * collects `methodologies/crdm/crdm-detect.md` has attributed a CRDM node to
 * the methodology graph, and every count computed from it is then wrong in a
 * way nothing reports.
 */
export function owningDirectory<T extends { id: string; path: string; absPath?: string }>(
  dirs: readonly T[],
  path: string,
): T | undefined {
  // Compare in the SPACE OF THE PATH GIVEN. `resolveDirectories` populates
  // `absPath`, so keying on it unconditionally makes every relative query
  // return `undefined` — measured on the first run of this function, where
  // all four probes answered "no declaration contains it" over a corpus in
  // which all four are declared.
  //
  // That failure mode is the reason this comment exists rather than a tidier
  // one-liner: `undefined` is a LEGITIMATE answer (a node in no declared
  // directory), so a mismatch does not look like a bug, it looks like a
  // finding. A sweep built on it would have reported a clean, empty result
  // over the whole corpus.
  const absolute = path.startsWith("/");
  const keyOf = (d: T): string | undefined => (absolute ? d.absPath : d.path);
  const containing = dirs.filter((d) => {
    const k = keyOf(d);
    return k !== undefined && pathContains(k, path);
  });
  if (containing.length === 0) return undefined;
  return containing.reduce((deep, d) => ((keyOf(d) ?? "").length > (keyOf(deep) ?? "").length ? d : deep));
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
 * How a declared asset REACHES the agent that needs it.
 *
 * Two values, and the line between them is mechanical rather than a matter of
 * taste. **`injected`** is spliced into a prompt, so it pays the harness's
 * budget — `MEMORY.md`'s first 200 lines, *with the overflow dropped
 * silently*. **`file`** is opened by a reader, so nothing truncates it.
 *
 * That is why `AGENTS.md` may be long and a memory entry may not, and it is
 * the reason the rule is worth declaring rather than describing: a rule in
 * prose cannot be asked, and `agent-memory.md` carried this one as a table for
 * a day with nothing able to check it.
 */
export type AssetDelivery = "file" | "injected";

/** What a declared asset ROLE means — asked once, for every instance. */
export interface AssetRoleDef {
  /** What this artefact is FOR — one line. */
  purpose: string;
  /**
   * Which {@link GraphLayer} the role's file belongs to.
   *
   * **REQUIRED, for {@link GraphKindDef.holds}'s reason.** An optional field
   * would make "did not say" indistinguishable from `content`, and the whole
   * point of declaring it is that a step writing to a `context` asset is a
   * DEFECT rather than an update. `tsc` refuses a role that does not say.
   */
  layer: GraphLayer;
  /** {@link AssetDelivery} — and required, so a new role decides it at the keyboard. */
  delivery: AssetDelivery;
}

/**
 * What each asset role is, declared once — purpose, layer and delivery.
 *
 * ## Why this lives on the ROLE and not on the asset
 *
 * The owner, 2026-09-20, on `AGENTS.md`:
 *
 * > it is an asset and has a defined purpose (that is part of skills of
 * > mantiaing agent memroies)
 *
 * A `purpose` field beside `role` on every asset would be a second answer to
 * one question, free to disagree with the first: eleven instances would each
 * spell out what `instance-readme` is for, and the eleventh would say
 * something slightly different. The role already IS the purpose — this is
 * where the role says so, once, for every instance that declares it.
 *
 * It was tried the other way first. A `purpose` key was written into
 * `cat-harness/harness.json` and {@link KgAssetSchema} silently stripped it,
 * which is worse than absent: the declaration read as if it carried a purpose
 * and no consumer ever saw one. {@link strayAssetRoleKeys} is what now catches
 * that, because the stripping is silent by design and will stay that way.
 *
 * ## Why one table and not three maps
 *
 * `purpose`, `layer` and `delivery` were nearly added as three
 * `Record<string, …>` constants side by side. Three maps keyed on the same
 * thing is a shape where one gains a key the others lack and nothing says so —
 * a role with a purpose and no layer would read as governed, and
 * `assetRoleLayer` would return `undefined` for a role this layer plainly
 * owns. One record of objects makes that state unrepresentable.
 *
 * ## Both are `context`, and the owner said so in those words
 *
 * > its static content at process runtime and treated as an asset like
 * > memories
 *
 * That is {@link GraphLayer | `context`} word for word — READ at session
 * start, never written by a running process — and it is the same layer agent
 * memory holds, which is what *"like memories"* asks for. Bean `7syd`.
 *
 * ## The two that matter, and the line between them
 *
 * `instance-readme` says what the instance IS; `agent-instructions` says what
 * to DO. The second **augments and never restates** the first — the owner
 * again, on the same day:
 *
 * > agents.md should give good coldstart instructions (dont duplicatae
 * > readme.md) but augment.
 *
 * That is checkable rather than a matter of taste, and it is why both are
 * required of every instance: a reader arriving with either question is
 * entitled to a file that answers only theirs.
 *
 * Absent from this map means the role is one this layer does not govern —
 * `bootstrap-initialization` is bootstrap's, and a purpose invented
 * for it here would be the platform speaking for a layer it does not own.
 */
export const ASSET_ROLES: Readonly<Record<string, AssetRoleDef>> = {
  [INSTANCE_README_ROLE]: {
    purpose:
      "What this instance IS, for a reader — its entry point, and the human half of the pair.",
    layer: "context",
    delivery: "file",
  },
  [AGENT_INSTRUCTIONS_ROLE]: {
    purpose:
      "What a cold agent DOES here, in order — augmenting the README rather than restating it, and read as a file so no injection budget truncates it.",
    layer: "context",
    delivery: "file",
  },
};

/**
 * What a role's asset is for, or `undefined` for a role this layer does not
 * govern. The accessor exists so a caller reads {@link ASSET_ROLES} through
 * one door, as the graph-kind registry is read through `get`.
 */
export function assetRolePurpose(role: string): string | undefined {
  return ASSET_ROLES[role]?.purpose;
}

/**
 * Which layer a role's asset belongs to, or `undefined` for an ungoverned role.
 *
 * `undefined` is the THIRD STATE and is never to be read as a permissive
 * default: it means nobody here has classified this role, not that the file is
 * free for a process to rewrite. {@link processMayWriteAsset} preserves it for
 * exactly that reason.
 */
export function assetRoleLayer(role: string): GraphLayer | undefined {
  return ASSET_ROLES[role]?.layer;
}

/** How a role's asset reaches its reader, or `undefined` for an ungoverned role. */
export function assetRoleDelivery(role: string): AssetDelivery | undefined {
  return ASSET_ROLES[role]?.delivery;
}

/**
 * May a running process WRITE a declared asset of this role?
 *
 * `undefined` when the role is not one this layer governs — *could not
 * determine*, which a caller must not render as either answer. A gate treats
 * it as a finding; a consumer that needs a decision asks the layer that owns
 * the role.
 *
 * The rule itself is {@link layerIsWritable}, shared with
 * {@link processMayWrite} so that assets and graphs cannot come to disagree
 * about what `context` permits. Two predicates spelling `=== "state"`
 * separately is how one of them survives a fourth layer being added.
 */
export function processMayWriteAsset(role: string): boolean | undefined {
  const layer = assetRoleLayer(role);
  return layer === undefined ? undefined : layerIsWritable(layer);
}

/**
 * Asset declarations carrying a key that the ROLE already answers.
 *
 * {@link KgAssetSchema} is a non-strict `z.object`, so an unknown key is
 * dropped without a word — and that is not a defect to fix here, because the
 * schema is also how a downstream instance carries a key this layer has not
 * learned about yet. What it costs is recorded above: a `purpose` written into
 * `cat-harness/harness.json` read as if it carried one, and no consumer ever
 * saw it.
 *
 * So the finding is raised against the RAW declaration rather than the parsed
 * one — after parsing, the evidence is gone. Returns one entry per offending
 * key, with the instance root and the asset id, because "some instance has a
 * stray key" is not something anybody can act on.
 */
export function strayAssetRoleKeys(
  root: string,
): Array<{ root: string; asset: string; key: string }> {
  const file = findDeclarationFile(root);
  if (file === undefined) return [];
  const p = join(root, file);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    // A declaration that will not parse is a finding somebody else already
    // raises loudly; reporting it a second time here would send a reader to
    // the wrong check. It is NOT silently clean either — `readDeclaration`
    // throws on it, so no caller reaches a verdict through this path.
    return [];
  }
  const assets = (raw as { assets?: unknown })?.assets;
  if (!Array.isArray(assets)) return [];
  const out: Array<{ root: string; asset: string; key: string }> = [];
  for (const a of assets) {
    if (typeof a !== "object" || a === null) continue;
    const rec = a as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : typeof rec.src === "string" ? rec.src : "<unnamed>";
    for (const key of ROLE_OWNED_ASSET_KEYS) {
      if (key in rec) out.push({ root, asset: id, key });
    }
  }
  return out;
}

/**
 * The keys an asset may NOT restate, because {@link ASSET_ROLES} answers them.
 *
 * Derived from the interface rather than typed out, so adding a field to
 * {@link AssetRoleDef} cannot leave this list behind — the failure this whole
 * mechanism exists to catch, reproduced one level up.
 */
export const ROLE_OWNED_ASSET_KEYS = [
  "purpose",
  "layer",
  "delivery",
] as const satisfies readonly (keyof AssetRoleDef)[];

export const REQUIRED_ASSET_ROLES = [INSTANCE_README_ROLE, AGENT_INSTRUCTIONS_ROLE] as const;

/**
 * Is this checkout an ACTIVE knowledge graph, or a static one?
 *
 * The question an arriving agent asks before anything else, and the owner's
 * own framing (2026-09-20):
 *
 * > tell them to determine if active KG (beans/tods) or static (point to
 * > process on determining context)
 *
 * **ACTIVE** means somebody has work recorded here that an arriving agent
 * could pick up: beans, todos, or a BPMN instance mid-flight. **STATIC**
 * means the graph is there to be read.
 *
 * ## Asked of the REPOSITORY, not of one instance
 *
 * Measured 2026-09-21: the root instance declares no work-plan graph and
 * `cat-harness` declares `beans` and `todos` at `scope: "repository"`. So a
 * person standing at the repository root plainly has a work plan while the
 * root instance alone scores static. The question is about the checkout —
 * "is there work recorded anywhere I can see" — and answering it per instance
 * gets it wrong for the one place a reader actually stands.
 *
 * ## Derived, never listed
 *
 * The set is read from {@link GraphKindDef.recordsWork}, so adding a graph
 * kind forces the decision at the kind rather than requiring somebody to
 * remember a list here. A hardcoded set would be a list pretending to be a
 * rule — the shape this repository keeps paying for.
 */
export function workPlanGraphsIn(
  repoRoot: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): { plan: Array<{ instance: string; kinds: string[] }>; unreadable: string[] } {
  const plan: Array<{ instance: string; kinds: string[] }> = [];
  const unreadable: string[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    let decl;
    try {
      decl = readDeclaration(root, registry);
    } catch {
      // REPORTED, never skipped. An unreadable declaration is "could not
      // determine", and swallowing it renders STATIC — which would send an
      // agent past a work plan nobody could parse, telling it there is
      // nothing here. The first draft of this function did exactly that.
      unreadable.push(root);
      continue;
    }
    if (decl === undefined) continue;
    const kinds = [
      ...new Set((decl.directories ?? []).flatMap((d) => d.graphKinds ?? [])),
    ].filter((k) => registry.get(k)?.recordsWork === true);
    if (kinds.length > 0) plan.push({ instance: decl.name ?? root, kinds: kinds.sort() });
  }
  return { plan, unreadable };
}

/**
 * {@link workPlanGraphsIn} as the answer an arriving agent needs — and it has
 * THREE values, not two.
 *
 * `undefined` is "could not determine": some declaration in this checkout did
 * not parse, so the absence of a work plan is unproven. A boolean would
 * collapse that into `false` and tell the agent there is nothing here.
 */
export function isActiveKg(
  repoRoot: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): boolean | undefined {
  const { plan, unreadable } = workPlanGraphsIn(repoRoot, registry);
  if (plan.length > 0) return true;
  return unreadable.length > 0 ? undefined : false;
}

/**
 * State kinds that have not said whether they record work.
 *
 * Empty is the contract, enforced by `check:graph-kind-work`. The field is
 * optional in the TYPE because it is meaningless for `content`, `context` and
 * `derived` — a required field would force three layers to answer a question
 * that does not apply to them — so the "cannot ship undecided" property lives
 * in a gate instead, which is how this repository handles the same shape
 * elsewhere.
 */
export function undecidedWorkKinds(
  registry: GraphKindRegistry = defaultGraphKinds,
): string[] {
  // `names()` then `get()`, because the registry is not iterable — it exposes
  // `has`/`get`/`names` so that a deprecated kind spelling resolves in exactly
  // one place. Iterating its private map would bypass that.
  return registry
    .names()
    .filter((name) => {
      const def = registry.get(name);
      return def?.holds === "state" && def.recordsWork === undefined;
    })
    .sort();
}

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
 * The kinds whose directories hold SKILL BODIES, and may be scanned for them.
 *
 * `cat-harness` is here because a downstream declaration that has not migrated
 * still spells a skill directory that way, and dropping it would make every
 * unmigrated instance's skills unreachable rather than merely unclassified.
 *
 * `processes` and `scenarios` are NOT here, and that is the split doing its
 * job: `processes/` holds only `.bpmn` and `scenarios/` only `roles.json`, so
 * neither ever contributed a skill body — they were scanned only because they
 * sat inside a directory that did.
 *
 * No count on purpose. This said "51 `.bpmn` files" and the directory holds
 * 50 — a number that was either wrong when written or true for an afternoon,
 * and AGENTS.md's rule for exactly this is to count the directory rather than
 * quote the paragraph. It also still said `workflows` after that kind was
 * renamed to `processes`.
 */
export const SKILL_BEARING_GRAPH_KINDS: readonly string[] = ["skills", KG_GRAPH_KIND];

/**
 * Every kind that IS harness knowledge-graph content — the umbrella and the
 * three kinds split out of it.
 *
 * Distinct from {@link SKILL_BEARING_GRAPH_KINDS}, and the difference is the
 * whole point of the split: a consumer asking "is this the KGraph?" wants all
 * four, while one asking "may I scan this for skill bodies?" wants two. One
 * list serving both questions is what made `cat-harness` ambiguous.
 */
export const KG_CONTENT_GRAPH_KINDS: readonly string[] = [
  KG_GRAPH_KIND,
  "skills",
  "processes",
  "scenarios",
];

/**
 * Does this directory hold ONLY the knowledge graph?
 *
 * **Exactly one skill-bearing kind, not merely including one.** `schemas/` declares
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
  return d.graphKinds.length === 1 && SKILL_BEARING_GRAPH_KINDS.includes(d.graphKinds[0]!);
}

/**
 * Does this directory hold ONLY harness knowledge-graph content, of any of its
 * kinds?
 *
 * **Wider than {@link isKgOnlyDirectory}, and the two must not be merged.**
 * This one answers "is there a KGraph node in here at all" — which is what a
 * consumer looking for roles, BPMN or requirements needs. The narrow one
 * answers "may I read every `.md` in here as a Skill body", which is false for
 * `workflows/` (51 `.bpmn`) and `scenarios/` (one `roles.json`).
 *
 * Before the 2026-09-21 split those directories declared `["cat-harness"]` and
 * so satisfied BOTH questions by accident. Restoring their reachability is
 * what this function is for: without it the split would have silently removed
 * every `bootstrap` process from the exported graph, which is precisely
 * the `dh4f` shape — a consumer reporting a clean run over what it never
 * visited.
 *
 * `schemas/` is excluded by the same `length === 1` test and for the same
 * measured reason given on the narrow one.
 */
export function isKgContentDirectory(d: ContentDirectory): boolean {
  return d.graphKinds.length === 1 && KG_CONTENT_GRAPH_KINDS.includes(d.graphKinds[0]!);
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

  // The conventional set FIRST, existence-filtered, and then declared entries
  // override it by id — which is `resolveDirectories`' order, and now this
  // function's too.
  //
  // ## The disagreement this closes (bean `rday`)
  //
  // These were the same declaration read by two resolvers that answered
  // differently. `resolveDirectories` seeded `DEFAULT_DIRECTORIES` at the root
  // link whatever the declaration said; this one applied them ONLY to a root
  // with no declaration at all. So a declaration's mere EXISTENCE withdrew
  // every convention from this function's callers, and `directories` defaults
  // to `[]` in the schema — meaning the minimal honest declaration,
  // `{ "name": "x" }`, silently emptied the result.
  //
  // Measured 2026-09-20: `resolveSkillDirs` over a fixture with a `skills/`
  // directory on disk went from 3 to 0 the moment the fixture was given a
  // name. Nothing failed except the tests that happened to assert an overlay;
  // a consumer would have read it as "this instance has no skills".
  //
  // Seeding unconditionally is the smaller of the two fixes the bean named
  // (the other was teaching the schema to tell an ABSENT `directories` from an
  // empty one, which is a migration). It is also the one that makes the rule
  // sayable in a sentence: **a declaration adds and overrides; it does not
  // withdraw.** An instance that genuinely owns none of the conventional
  // directories says so by not having them on disk — the existence filter is
  // what makes that the same answer either way, and it is the same reason
  // `DEFAULT_DIRECTORIES` carries: a declared-but-absent directory is `dh4f`,
  // where a consumer scans nothing and reports a clean run over it.
  const byId = new Map<string, ResolvedDirectory>();
  for (const dir of DEFAULT_DIRECTORIES) {
    const absPath = resolve(link.root, dir.path);
    if (!existsSync(absPath)) continue;
    byId.set(dir.id, { ...dir, declaredBy: "(default)", absPath, own: false });
  }
  if (!decl) return [...byId.values()];

  for (const dir of decl.directories
    // A REPOSITORY-scoped entry is not inherited, for the reason
    // `resolveDirectories` gives: a dependency's repository is a different
    // checkout, so inheriting its entry points every consumer at somebody
    // else's store. Stated in both resolvers because both are entry points.
    .filter((dir) => dir.scope !== "repository" || link.own === true)
    .map((dir) => ({
      ...dir,
      declaredBy: decl.name,
      // THROUGH `rootForScope`, not `resolve(link.root, …)`. This function was
      // the third consumer of a declared path and the one that did not go
      // through the one place a scope turns into a directory — which made
      // `rootForScope`'s own doc comment ("every consumer … goes through
      // here") false from the day this was written.
      //
      // The consequence was silent and it was `dh4f`. `cat-harness/harness.json`
      // declares `bootstrap/skills/` at `scope: "repository"`; resolving it
      // against the INSTANCE gave `cat-harness/bootstrap/skills`, which is not
      // there, and `resolveSkillDirs` drops a directory that does not exist.
      // So `skill_fetch` answered "package not found" for every bootstrap
      // skill while the declaration naming them was correct and present, and
      // nothing reported a problem: a clean pass over an empty set. Eight
      // entries here carry `scope: "repository"`; `bootstrap` is the one that
      // was harmed, because it is the only kg-only one among them.
      absPath: resolve(rootForScope(link.root, dir.scope), dir.path),
      own: link.own === true,
    }))) {
    // Override by id, replacing IN PLACE so the conventional order survives a
    // relocation — the same rule and the same reason as `resolveDirectories`:
    // a consumer should not have its scan order reshuffled because a
    // declaration moved one directory.
    byId.set(dir.id, dir);
  }
  return [...byId.values()];
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
    // ── What a DEPENDENT gets, and what it does not ───────────────────
    //
    // An instance always materialises what it DECLARED ITSELF; `dependents`
    // governs only what an INHERITED entry does here. `skip` means the entry
    // names where the declaring instance's own content lives — `schemas/`,
    // `tools/`, `src/skills/` — and a dependent has no use for an empty
    // directory of that name.
    //
    // Measured before this existed: a fresh folio depending on this instance
    // inherits 12 directories, four of them the platform's own, and every one
    // was created with a committed keep marker. That is the `dh4f` shape —
    // a consumer scanning a directory that exists and is empty, reporting a
    // clean run over it — manufactured for every downstream folio by the tool
    // written to prevent it.
    //
    // RESOLUTION IS UNTOUCHED. A `skip` entry stays in the resolved list, so
    // the cross-instance overlay still serves the dependency's skills through
    // `skill_list` and `skill_fetch`. The only thing suppressed here is
    // `mkdirSync`.
    if (dir.own !== true && dir.dependents === "skip") continue;
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
    // ── The scope trap ────────────────────────────────────────────────
    //
    // `scope` is optional and its ABSENCE is meaningful: the path resolves
    // against the instance rather than the repository. Omit it on an entry
    // that meant `repository` and the declaration silently names a different
    // directory — and this function then CREATES that directory, with a keep
    // marker, turning declared-but-absent into declared-and-empty. The
    // `dh4f` false pass, wearing a tidier face, manufactured by the tool
    // written to prevent it.
    //
    // That is not hypothetical: it happened here on 2026-09-20, to the two
    // entries (`interaction`, `issue-marks`) added the same day, and stood
    // for about an hour with every gate green.
    //
    // So: before creating anything, look at the OTHER root. A directory of
    // this name already sitting there, with content, is overwhelmingly a
    // missing or wrong `scope` rather than a coincidence — and creating an
    // empty twin beside it is the one outcome that helps nobody.
    const otherBase = rootForScope(rootAbs, dir.scope === "repository" ? undefined : "repository");
    if (otherBase !== base) {
      const twin = resolve(otherBase, dir.path);
      // The condition is "this one is EMPTY and the twin has content", not
      // "this one is absent" — so it DETECTS the mistake already standing as
      // well as preventing a new one. A first draft tested absence only, and
      // would have refused to create the empty twin while saying nothing
      // about the empty twin already sitting there from an hour earlier.
      // A guard that cannot see the case that motivated it is half a guard.
      const emptyish = !existsSync(abs) || readdirSync(abs).every((f) => f === ".gitignore");
      if (emptyish && existsSync(twin) && readdirSync(twin).length > 0) {
        throw new Error(
          `declared directory "${dir.id}" is empty at ${abs}, ` +
            `while ${twin} already holds content. That is what a missing or wrong ` +
            `\`scope\` looks like: ${dir.scope === "repository" ? "the entry says `repository` and the content is in the instance" : "the entry omits `scope`, so it resolves against the instance, and the content is at the repository root"}. ` +
            `A consumer following the declaration scans the empty one and reports a clean run. ` +
            `Fix \`scope\` on the declaration rather than materialising both.`,
        );
      }
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
  return dirs.filter((d) => d.graphKinds.some((g) => isRenderable(g, registry)));
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
 * ## Ambiguity REFUSES rather than picking, and that is the point
 *
 * A graph declared by two directories is legal — `cat-harness` is declared by
 * four (`schemas/`, `skills/`, `bootstrap/skills/`, `src/skills/`) and
 * `methodology` by two. This used to return the FIRST of them, under a comment
 * saying it was "the accessor for the single-home case". That precondition was
 * stated and enforced by nothing, which is this repository's own rule broken
 * in one line: an unavoidable duplicate is fine, an UNCHECKED one is not.
 *
 * The cost is on the record. Bean `wggr`: a by-graph lookup for `cat-harness`
 * resolves to `schemas/`, not `skills/`, because `schemas/` declares
 * `["schemas", "cat-harness"]` and comes first. An audit walked `schemas/`,
 * wrote **37** sidecars against the wrong subjects, and exited **0**. Nothing
 * threw, because the wrong answer is indistinguishable from the right one at
 * the call site — *"a by-graph lookup is not a weaker version of a by-id
 * lookup; for `cat-harness` it resolves to a DIFFERENT DIRECTORY."*
 *
 * So an ambiguous kind now throws, naming every candidate. Measured before the
 * change: **none of the 34 call sites in this repository asks for either
 * ambiguous kind** — every one passed `library`, `translation-sources`,
 * `uploads`, `schemas`, `fsh-guts`, `todos` or `memory`, all single-homed at
 * the time. The throw was therefore unreachable, and existed for the caller
 * who had not been written yet, which is the one `wggr` was.
 *
 * **That caller arrived the same day.** Bean `frs5` moved the corpus out of
 * the platform into `who-iris/library/` and `folio-assistant-sci/library/`, so
 * `library` has TWO homes and `schemas` has FOUR (`cat-harness/`,
 * `folio-assistant-core/`, `large-datasets/`, `detangle/`). The paragraph
 * above is kept as written and corrected here rather than edited, because
 * what it records — a throw added for a caller nobody had written — is worth
 * more beside the date it stopped being true than it is silently updated.
 *
 * Every site that wanted one was migrated: scanners fan out through
 * {@link directoriesForGraph}, write targets refuse through this, and the four
 * that wanted THEIR OWN instance's directory ask
 * {@link instanceDirectoryForGraph}, which is a third question neither of the
 * other two answers. `scripts/tests/no-silent-first-directory.test.ts` fails
 * on a new `directoriesForGraph(…)[0]`, since the last fix of this shape was
 * one site at a time and left thirty-one.
 *
 * {@link directoriesForGraph} is the honest accessor when several homes are
 * what you want; a by-ID lookup through {@link resolveDirectories} is the
 * answer when you want a particular one.
 */
export function directoryForGraph(
  root: string,
  graph: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): string | undefined {
  const all = matchingDirectories(root, graph, registry);
  if (all.length > 1) {
    throw new Error(
      `graph "${graph}" is declared by ${all.length} directories, so there is no single ` +
        `directory for it: ${all.map((d) => `${d.id} (${d.path})`).join(", ")}. ` +
        `Returning the first silently is bean \`wggr\` — it resolved \`cat-harness\` to ` +
        `\`schemas/\` and wrote 37 sidecars against the wrong subjects on a run that exited 0. ` +
        `Use \`directoriesForGraph\` if you want all of them, or look the directory up by its ` +
        `\`id\` through \`resolveDirectories\` if you want a particular one.`,
    );
  }
  return all[0]?.absPath;
}

/** Every directory this instance declares as holding `graph`, in declaration order. */
function matchingDirectories(
  root: string,
  graph: string,
  registry: GraphKindRegistry,
): ResolvedDirectory[] {
  return resolveDirectories([{ name: "(local)", root, own: true }], registry).filter((d) =>
    d.graphKinds.includes(graph as GraphKind),
  );
}

/**
 * Every directory holding `graph`, for the callers {@link directoryForGraph}
 * now refuses.
 *
 * Empty means the instance declares the graph nowhere — the same third state
 * its sibling documents, and for the same reason: a caller that wants the
 * convention as a fallback says so at its own call site, where the choice is
 * visible, rather than being handed a path to a directory that is not there.
 */
export function directoriesForGraph(
  root: string,
  graph: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): string[] {
  return matchingDirectories(root, graph, registry).map((d) => d.absPath);
}

/**
 * Where a folio's authored content lives — **asked, not assumed**.
 *
 * Bean `hs08`. The owner's ruling, 2026-09-20: *"content/ shouldnt be expected
 * anymore. folio/ was renamed as default/convention"*, then *"no content/
 * fallback. excise!!!!!"* — and then the part that makes this function
 * necessary rather than tidy:
 *
 * > *"qou can declare a new folio at content/"*
 *
 * That is the whole point of a declaration. A folio is not obliged to put its
 * content under `folio/`; it says where its `folio` graph is, and consumers
 * read the declaration. `litlfred/qou` keeps `content/` and stays readable by
 * declaring it — **but only if the platform asks.**
 *
 * It did not. After the excision, 162 sites spelled `join(root, "folio")` as a
 * literal, so a declaration naming anything else was ignored and the folio was
 * invisible. The rename was done; the *mechanism* the rename exists to serve
 * was not wired up. This is that wiring, in one place.
 *
 * ## Why `"folio"` is named HERE, in the harness
 *
 * `ot9a` set the falsifier: *"if the harness still has to know the string
 * `folio` anywhere for the declaration to validate, the re-siting is
 * cosmetic."* The harness does still know it — this module is `harness` by
 * `repo-partition`, as are `content/pipeline/repo-root.ts` and `scripts/`.
 *
 * That is not this function reintroducing the problem; it is this function
 * CONCENTRATING it. The harness knew the string in 162 places before and knows
 * it in one now, which is the difference between a fact you can audit and one
 * you can only grep for. Only a `harness` module can serve every caller —
 * `allowed` gives `core: ["core", "harness"]` and `harness: ["harness"]`, so
 * a core home would be unreachable from the harness half.
 *
 * ## The fallback is the CONVENTION, not `content/`
 *
 * An instance that declares nothing gets `folio/`. It never gets `content/`:
 * that root is excised, and a folio keeping it must SAY so. Silence means the
 * convention, and the convention is `folio/`.
 *
 * @param root repository root to resolve against
 * @returns the declared folio directory, else `<root>/folio`
 */
export function folioDir(root: string): string {
  try {
    // declared-path-literal: the base case. This IS where the convention is
    // written down; resolving it through a declaration would be circular.
    return directoryForGraph(root, "folio") ?? join(root, "folio");
  } catch (e) {
    // An instance whose declaration does not KNOW the `folio` kind — core
    // registers it by load-time side effect (`schemas/folio-graph-kind.ts`)
    // and a harness-only process may not have reached it. That is `ot9a`'s
    // fragility, and the convention is the right answer for it.
    //
    // Narrow deliberately: any OTHER failure is a malformed declaration, and
    // swallowing it would report a guess as an answer. "Could not determine"
    // is never rendered as a clean result.
    if (e instanceof Error && /unknown graph kind "folio"/.test(e.message)) {
      // DO NOT fall back here. This was the first version and it was wrong in
      // the one way that matters: with the kind unregistered, the declaration
      // cannot be READ, so returning the convention answers a question nobody
      // could answer. A folio declaring `content/` — which the owner has said
      // qou will do — would be silently invisible, and the caller would get a
      // plausible path instead of a fault.
      //
      // "Could not determine" is never rendered as a clean result. Fail, and
      // say what to import.
      throw new Error(
        `folioDir(${root}): the \`folio\` graph kind is not registered, so the ` +
          `instance's declaration cannot be read and its folio directory is ` +
          `UNKNOWN — not "folio/". Import \`schemas/folio-graph-kind.js\` for ` +
          `its load-time registration before calling this. Falling back to the ` +
          `convention here would silently ignore a folio that declares another ` +
          `path (bean hs08; the fragility is ot9a).`,
      );
    }
    throw e;
  }
}

/**
 * {@link folioDir} resolved AT LOAD, but whose FAILURE is raised AT USE.
 *
 * ## Why both halves matter, and why neither can move
 *
 * Twenty modules open with `const FOLIO_DIR = folioDir(REPO_ROOT)`. That
 * throws on a malformed declaration, and a throw at module scope **aborts
 * evaluation** — so every export below the failing line is left unbound, and
 * `await import()` can hand back the half-built namespace rather than
 * re-throwing. Bean `95s1` spent an afternoon on the result: an error 3,186
 * lines from its cause, resembling a circular import closely enough that the
 * bean was opened as one.
 *
 * **Resolution stays at load, and that is not inertia.** `findContentRepoRoot`
 * reads `process.cwd()`, so moving resolution to first use would let a
 * `process.chdir` change the answer. `checker-missing-evidence.test.ts` says
 * so in its own words — it uses ABSOLUTE fixture paths *because*
 * `qa-checkers-extended` captures the root at module load, so a test's chdir
 * changes nothing. Memoising on first use would be worse still: whichever
 * caller ran first would win, making the value test-order dependent.
 *
 * So only the THROW moves. The value is computed now, under the cwd the module
 * was loaded with; the error waits until somebody asks for it, and arrives
 * naming the module that could not resolve.
 *
 * ## What the caller sees
 *
 * A function rather than a string, which is the whole cost of this: use sites
 * call it. In exchange the failure reaches them with a cause attached instead
 * of surfacing as an unrelated binding's dead zone three thousand lines away.
 */
export function folioDirDeferred(root: string, moduleUrl: string): () => string {
  return deferResolution(() => folioDir(root), {
    moduleUrl,
    what: "its folio directory",
    under: resolve(root),
  });
}

/**
 * The same deferral, for any module-scope value whose computation can throw on
 * a declaration.
 *
 * ## Why this exists beside {@link folioDirDeferred} rather than instead of it
 *
 * `folioDir` was the whole hazard until 2026-09-21, and the gate was written
 * to match a call in FIRST position — `const X = folioDir(...)`. Widening it
 * found twelve more sites the anchored pattern could not see, and they are not
 * a different defect:
 *
 * ```ts
 * const LEDGER_PATH = join(folioDir(REPO_ROOT), "bib-qa-verifications.json");
 * const UPLOADS_DIR = directoryForGraph(REPO_ROOT, "uploads") ?? join(REPO_ROOT, "uploads");
 * ```
 *
 * The throwing call is nested, so no wrapper around `folioDir` alone reaches
 * it. What has to be deferred is the WHOLE expression. And two more resolvers
 * throw for the same reason — `directoryForGraph` and `directoriesForGraph`,
 * measured against a directory holding `{ not json` — so a second
 * function-specific wrapper would already be a third.
 *
 * `folioDirDeferred` keeps its name and its message: it is called from twenty
 * modules, and its wording is the thing a reader meets when the failure
 * arrives. It is now a thin call to this.
 *
 * ## Same contract, one generalisation
 *
 * Resolution stays at LOAD, for the reason on `folioDirDeferred`: several
 * resolvers read `process.cwd()` transitively, and moving the computation to
 * first use would let a `process.chdir` change the answer — while memoising on
 * first use would be worse, making the value depend on whichever caller ran
 * first. Only the throw moves.
 *
 * Generic in the value because not every one is a string:
 * `q-usage-audit.ts` resolves `string[]`.
 */
export function deferResolution<T>(
  compute: () => T,
  context: { moduleUrl: string; what: string; under: string },
): () => T {
  let value: T | undefined;
  let ok = false;
  let failure: unknown;
  try {
    value = compute();
    ok = true;
  } catch (e) {
    failure = e;
  }
  return () => {
    // `ok` rather than `value !== undefined`: a resolver may legitimately
    // return `undefined`, and treating that as a failure would raise this
    // error over a value that resolved perfectly well.
    if (ok) return value as T;
    throw new Error(
      `${context.moduleUrl} could not resolve ${context.what} when it loaded, and this is ` +
        `the first use of that value. The declaration under ${context.under} is what ` +
        `failed: ${failure instanceof Error ? failure.message : String(failure)}`,
      { cause: failure },
    );
  };
}

/**
 * The directory a graph has AT THIS INSTANCE'S OWN ROOT — repository-scoped
 * entries pointing at sibling instances excluded.
 *
 * ## A third question, found by reading the callers rather than by design
 *
 * `a02m` began with two shapes in mind: scan every home, or expect exactly
 * one (`directoryForGraph`, reinstated on `main` the same day with the
 * refusing semantics this branch had built separately as
 * `directoryForGraph` — two names for one question, resolved in favour of
 * main's). Both were wrong for the four `schemas` call sites, which is how this
 * one was found. `check-tools`, `harness-schema-export`, `gen-schema-docs` and
 * `fsh-guts/generate-docs` all compose `join(schemasRoot(root), "skills")` or
 * `"generated"` — a path INSIDE the directory. They are not asking "who
 * declares schemas", they are asking "where is MY schemas directory".
 *
 * ## `own` is NOT the discriminator, and assuming it was is a correction
 *
 * The first version of this filtered on `ResolvedDirectory.own`. Measured:
 * from the `cat-harness` root all FOUR `schemas` directories are `own` —
 * `cat-harness/schemas` plus `folio-assistant-core/`, `large-datasets/` and
 * `detangle/`, each declared by cat-harness's own `harness.json` with
 * `scope: "repository"` because this repository stages three future instances
 * as sibling top-level directories. `own` distinguishes the root from a
 * DEPENDENCY, which is a different question and not the one being asked.
 *
 * The discriminator is `scope`, and `rootForScope` above is where it already
 * means exactly this: a repository-scoped entry resolves against the
 * REPOSITORY root, everything else against the instance root. So this asks for
 * the entries that resolve against `root` itself — the directory that is
 * genuinely this instance's, not one it points at from across the repository.
 *
 * ## Why `[0]` was not already wrong here
 *
 * `resolveDirectories` happens to order the root's instance-scoped
 * declarations first, so `[0]` landed on the intended one. A reordering, or a
 * staged sibling declared earlier, would have moved it silently — and the
 * symptom would be a generator writing its output into another instance's
 * tree, with a clean exit code.
 */
export function instanceDirectoryForGraph(
  root: string,
  graph: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): string | undefined {
  const here = matchingDirectories(root, graph, registry).filter(
    (d) => d.own && d.scope !== "repository",
  );
  if (here.length > 1) {
    throw new Error(
      `instance at ${root} declares ${here.length} directories for graph "${graph}" at its own root, ` +
        `and this call site expects one: ${here.map((d) => `${d.id} → ${d.absPath}`).join("; ")}.`,
    );
  }
  return here[0]?.absPath;
}

/**
 * EVERY declared directory, remote entries included — the navigable set.
 *
 * The complement of {@link resolveDirectories}, which answers "where do I
 * scan" and therefore drops remote graphs because there is nothing on disk to
 * walk. This one answers **"what is declared"**, which is the question the KG
 * viewer asks: the owner, 2026-09-20, wants the hierarchy of named subgraphs
 * filterable *"or navigable if external/remote pointed to in the core harness
 * schema"*, and a graph whose bytes are elsewhere is still a node in that
 * hierarchy.
 *
 * Two functions rather than a flag, because the two questions have different
 * right answers and a caller that passed the wrong flag would get a plausible
 * list either way.
 */
export interface DeclaredGraph extends KgNodeLabels {
  id: string;
  graphKinds: GraphKind[];
  declaredBy: string;
  /** Set iff the graph is HERE. */
  absPath?: string;
  /** Set iff the graph is elsewhere. Exactly one of the two, always. */
  url?: string;
}

export function declaredGraphs(
  root: string,
  registry: GraphKindRegistry = defaultGraphKinds,
): DeclaredGraph[] {
  const decl = readDeclaration(root, registry);
  if (!decl) return [];
  return [
    ...decl.directories.map((d) => ({
      ...d,
      declaredBy: decl.name,
      absPath: resolve(rootForScope(root, d.scope), d.path),
    })),
    ...(decl.remoteGraphs ?? []).map((g) => ({ ...g, declaredBy: decl.name })),
  ];
}
/**
 * The local path of a declared directory, or `undefined` when the graph is
 * REMOTE.
 *
 * Every consumer that needs bytes on disk goes through this, so "this graph is
 * not in this checkout" is a case each one has to answer rather than a
 * `string` it can assume. When `url` landed on 2026-09-20 the compiler named
 * the whole set in nine errors across six files — which is the set that had
 * been assuming a local path all along, and the reason `path` was made
 * optional rather than widened to hold a URL. A field that is sometimes a path
 * and sometimes an address is one field with two meanings, and every consumer
 * then has to guess which it got.
 */
export function localPathOf(d: { path?: string; url?: string }): string | undefined {
  return d.path;
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
    "@context": {
      ...NS_PREFIXES,
      path: termIri("path"),
      directories: termIri("scans"),
      scope: termIri("scope"),
      dependents: termIri("dependents"),
    },
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
      const types = d.graphKinds.map((g) => registry.get(g)?.type ?? termIri("UnknownGraph"));
      return {
        "@id": `#${d.id}`,
        // One type stays a string, several become a list — JSON-LD permits
        // both, and emitting a one-element array for the common case would
        // make every existing published form look changed.
        "@type": types.length === 1 ? types[0] : types,
        path: d.path,
        // `dependents` is REQUIRED, so a projection that dropped it produced a
        // document that no longer parses as a declaration — caught by the
        // round-trip test rather than by review.
        dependents: d.dependents,
        // ...and `scope` was ALREADY being dropped, silently, because it is
        // optional: a declaration round-tripped through JSON-LD came back
        // saying every path resolves against the instance. `beans/`, `todos/`
        // and six others are repository-scoped, so the projection was lossy
        // about the one field that decides WHERE they are. Found while adding
        // the line above; nothing had caught it because an absent optional
        // field parses cleanly and means something else.
        ...(d.scope ? { scope: d.scope } : {}),
        ...(d.title ? { title: d.title } : {}),
        ...(d.description ? { description: d.description } : {}),
      };
    }),
  };
}

/**
 * The graph kinds an instance DECLARES — its own, not the universal registry's.
 *
 * Moved here from `scripts/check-instance-render.ts` (bean `3jj9`) so the two
 * exporters can read one fact. `kg-export` needs it to stop emitting every
 * kind any layer defines into every instance's graph: `bootstrap` published
 * 16 GraphKind nodes while declaring exactly one. The render check already
 * imports `kg-export`, so importing back would have been a cycle — and a
 * declaration's own contents belong beside the declaration reader anyway.
 *
 * Follows NESTED declarations, which is the part a plain read of
 * `directories[].graphKinds` misses: `beans/beans.json` is what says `bean-defs`
 * and `workflow-state` exist, and an instance that owns them would otherwise
 * be reported as not owning them.
 */
export function declaredKinds(
  root: string,
  decl: CatHarnessDeclaration,
  registry: GraphKindRegistry = defaultGraphKinds,
): Set<string> {
  const kinds = new Set<string>();
  for (const d of decl.directories ?? []) {
    for (const g of d.graphKinds ?? []) kinds.add(g);
    // The nested declaration, if the directory carries one — how `beans/` says
    // what its inner nodes are without `harness.json` restating them.
    //
    // ASKED OF THE KIND FIRST, and that is the fix rather than the tidy-up.
    // This computed `${basename(path)}.json` and nothing else, while
    // `bean-graph.ts` held that moving `beans/` to `work/` must rename nothing
    // inside it. Both true of today's layout, contradictory on the first
    // relocation: the walk would look for `work/work.json`, the file would
    // still be `work/beans.json`, and the nested kinds would drop out of
    // `declared` silently — under-counting, which manufactures an `undeclared`
    // finding somewhere else. `declarationFile` on the kind is where that fact
    // now lives, once.
    //
    // The directory-name convention stays as a FALLBACK, after it: a graph
    // whose kind declares no filename is unmigrated, not broken, and an
    // instance that never relocates behaves exactly as before.
    const dirName = basename(d.path.replace(/\/+$/, ""));
    const declared = (d.graphKinds ?? [])
      .map((g) => registry.get(g)?.declarationFile)
      .filter((f): f is string => typeof f === "string");
    for (const candidate of [...declared, `${dirName}.json`, "graph.json"]) {
      const p = join(declaredKindsEntryRoot(root, d), candidate);
      if (!existsSync(p)) continue;
      try {
        const nested = JSON.parse(readFileSync(p, "utf-8")) as {
          directories?: Array<{ graphKinds?: string[]; kinds?: string[] }>;
        };
        for (const nd of nested.directories ?? []) {
          for (const g of [...(nd.graphKinds ?? []), ...(nd.kinds ?? [])]) kinds.add(g);
        }
      } catch {
        // A nested file that will not parse is not this check's finding to
        // make — `check:harness-dirs` owns that and says so loudly. Skipping
        // here would understate `declared` and manufacture an `undeclared`,
        // so the kinds it would have contributed are simply not added and the
        // reason is recorded by the caller if it matters.
      }
    }
  }
  return kinds;
}


/** Where a declared directory actually is, honouring `scope`. */
function declaredKindsEntryRoot(root: string, d: { path: string; scope?: string }): string {
  const base = d.scope === "repository" ? repoRootFor(root) : root;
  return resolve(base, d.path);
}
