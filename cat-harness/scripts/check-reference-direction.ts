#!/usr/bin/env bun
/**
 * Nothing names an instance that depends on it.
 *
 * Owner, 2026-09-23: *"if sub1 depends (directly or through chain) stub0, no
 * references/context etc points stub0 → sub1."*
 *
 * `bootstrap-tools/schemas/graph.test.ts` enforces this for ONE instance
 * (`bootstrap/`, bean `iwtn`). This is the same invariant over all of them,
 * through the direction computation `check:partition` already uses, so the
 * import axis and the prose axis cannot give two answers (bean `zhg2`).
 *
 * The rule itself is `schemas/reference-direction.ts`; the direction is
 * `schemas/layer-direction.ts`. What is here is discovery, this instance's
 * exemptions, and the report — the parts that are genuinely about running the
 * tool over a checkout, split the way `repo-partition.ts` splits from
 * `partition/engine.ts`.
 *
 * ## The repository-name collision, and what {@link collisionOf} decides
 *
 * The root instance's name IS the repository's name, and until 2026-09-29 that
 * made every occurrence of it `undetermined` in one move: **11,090 of 14,299
 * occurrences on main, 78 % of everything read.** The ambiguity was in the
 * INSTRUMENT rather than in the architecture. An occurrence carries more than
 * the name it matched — a URL around it, an owner in front of it, a path
 * segment after it — and of 13,160 word-bounded occurrences of the root's name
 * under `cat-harness/`, 11,419 sit inside an `http(s)` URL and 14 point into a
 * directory the root instance actually declares. So the resolver built here
 * answers, per occurrence, which of three things the string is; the verdict
 * `names-repository` carries the answer for the repository case, and the
 * genuinely ambiguous residue is still `undetermined`.
 *
 * It reads the root's DECLARED directories to decide, which is the same
 * discipline as {@link GENERATOR_WRITTEN} below and holds for the same reason:
 * a directory added to the declaration tomorrow is recognised without an edit
 * here. **The file's own principle is unchanged** — a file that merely
 * MENTIONS a name cannot exempt itself, and nothing here lets it: the three
 * collision answers are read off the occurrence's shape, not off anything the
 * file claims about itself.
 *
 * ## It writes a COMMITTED sidecar, and until 2026-09-30 it did not
 *
 * The axis printed a verdict and committed nothing, which is the one failure
 * this repository has already named twice. `kg:audit`: *"a printed verdict is
 * gone, which makes 'unbound since it was drawn' and 'broken in the commit
 * under review' indistinguishable"*. `audit:coverage` exists for the same
 * reason one level out. For this axis both readings were available and
 * nothing chose between them: **"never audited" and "audited clean" looked
 * identical**, because there was nothing to look at. Bean `yj6r` recorded it
 * as the third of three gaps.
 *
 * So `cat-harness/test/results/reference-direction.qa-results.json` now holds
 * what the axis says, in the `qa-results/v1` shape every other whole-corpus
 * result here uses.
 *
 * ### What is RECORDED, and what stays in the printed report
 *
 * The line is drawn between **a count of verdicts** and **a count of files**,
 * and it is drawn there because those two answer different questions:
 *
 *  - A **verdict** count — wrong-direction, exempt, `names-repository`,
 *    undetermined — IS this axis's answer. "1,206 occurrences point up the
 *    arrow" is the measurement, not an incidental fact about the tree, and a
 *    reader holding only the file needs it to tell a clean axis from an
 *    unaudited one. It moves when the corpus's references move, which is when
 *    a reader WANTS to see it move. Recorded, in {@link CENSUS_FAMILY}.
 *  - A **file** count — how many files were skipped because their directory
 *    declares a machine-written graph, how many declared themselves generator
 *    output, how many files were walked — is a CENSUS. It moves when somebody
 *    adds a page, says nothing about direction, and `audit-coverage` already
 *    paid for committing one: *"a census moves on any commit and a gate keyed
 *    on it is stale by default"*, and worse, *"regenerating the L1 verdicts
 *    under `library/` made this report stale, so a QA writer in one graph
 *    turned another graph's coverage gate red."* Printed, never recorded.
 *
 * ### Freshness: `--check` grades the STATES, never the counts
 *
 * A committed sidecar goes stale, and the question every one of them has to
 * answer is what its `--check` fails on. This one fails on the **states**
 * disagreeing — the baseline's held and baselined sets, the entries the tree
 * has outgrown, the new offenders, the instances that declare no `needs`.
 * Those move when a RULING moves: somebody adds a file naming an instance
 * above it, or fixes one. That is exactly the diff a reviewer has to see.
 *
 * ### The backlog is a BASELINE, and `--check` enforces a one-way ratchet
 *
 * Owner, Q-B 2026-10-01: every file holding a wrong-direction reference on the
 * seed commit is recorded in `reference-direction-baseline.json` beside this
 * script, with the SET of instances above it that it names. A.10 of the same
 * ruling: that covers files naming ONE instance as well as several. Then:
 *
 *  - a file the baseline does not cover — unlisted, or listed but naming an
 *    instance its entry does not — is a NEW OFFENDER, and both forms exit 1;
 *  - an entry the tree has outgrown is TRIMMED (nothing left) or NARROWED
 *    (fewer targets) by the plain run, which is the writer `bun run regen`
 *    pairs with `--check`; `--check` fails until that is committed, because a
 *    stale entry is a hole the file could regress back through;
 *  - nothing ever ADDS a key. The one way a key changes is a git rename the
 *    writer detects itself, and only onto a subset of the old targets.
 *
 * That changes what `--check` used to promise ("does not fail on the
 * backlog"): the backlog is now the baseline, so what `--check` fails on is
 * not backlog but regression, and the drain is done when the store is empty.
 * The fix is to REWORD in place so the file names nothing above it (Q1), not
 * to move it. The `✗` lines print on both forms.
 *
 * It does **not** fail on the verdict counts moving, even though it records
 * them. Grading a number that changes whenever anybody writes a paragraph
 * makes a gate that is stale by default, and a gate that is stale by default
 * is one people learn to regenerate without reading — `audit-coverage`'s
 * finding, applied here rather than rediscovered. {@link comparableDirection}
 * is where the line is enforced, and the `--check` message SAYS what it
 * compared, so nobody reads a pass as a guarantee about the counts.
 *
 * ### `--check` does not write, and that is bean `ymsu`
 *
 * A gate that repairs the tree the rest of the run is judging makes a later
 * gate's verdict meaningless — `kg:detangle` repairs `schemas.detangle.json`
 * and both `kg:detangle:check` and `uml:overview:check` then read the repaired
 * copy, which is two witnesses already. A third was not going to come from
 * here. `--check` reads, compares and returns; the plain run is the writer.
 *
 * Usage:
 *   bun run cat-harness/scripts/check-reference-direction.ts            # summary; trim the baseline and WRITE the sidecar; exit 1 on a new offender
 *   … --findings           # every wrong-direction occurrence
 *   … --undetermined       # what it declined to judge, and why
 *   … --check              # do NOT write; exit 1 on a new offender, a baseline behind the tree, or a stale sidecar (CI)
 *   … --strict             # exit 1 on any wrong-direction occurrence
 *   … --seed [--held <f>]  # write the baseline ONLY if absent; <f> lists the paths to record as `held`
 *
 * @module scripts/check-reference-direction
 * @covers computed — the set it reads is DERIVED from the declarations on the
 *   run in front of you: every declared directory whose graph kind is neither
 *   `state` nor `derived`, plus every file that has not declared itself
 *   generator output. Writing today's answer as a literal list of kinds would
 *   be the snapshot that goes stale silently, which is the failure this file
 *   already refuses for `GENERATOR_WRITTEN` and for every count in its own
 *   prose.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import {
  BASE_GRAPH_KINDS,
  findDeclarationFile,
  instanceRootsIn,
  isDerivedGraph,
  isStateGraph,
  rootForScope,
} from "../schemas/cat-harness.js";
import { ancestorsOf, flattenDependencies } from "../schemas/dependency-order.js";
import { allowedFromNeeds, type LayerRule } from "../schemas/layer-direction.js";
import {
  classifyReference,
  occurrencesOf,
  type NameCollision,
  type Occurrence,
  type ReferenceExemption,
  type ReferenceVerdict,
} from "../schemas/reference-direction.js";
import { buildQaResult, QA_RESULTS_DIR, writeQaResult, type QaResult } from "./qa-results.js";

const REPO_ROOT = join(import.meta.dir, "..", "..");
/**
 * The INSTANCE root, which is where the sidecar goes — never {@link REPO_ROOT}.
 *
 * `QA_RESULTS_DIR` mirrors this instance's `qa-results` declaration, and
 * `audit-coverage.ts` paid for getting this wrong: its first version wrote to
 * `<repo>/test/results/`, a directory no declaration names, so every consumer
 * scanning the declared graphs read a clean run over the one file it exists to
 * produce.
 */
const INSTANCE_ROOT = join(import.meta.dir, "..");

// ── What is scanned ─────────────────────────────────────────────
//
// Instance roots come from `instanceRootsIn`, never from a glob and never
// from a list here: a literal written for this purpose on 2026-09-21 was
// silently missing six nodes (64 where the declaration resolves 70), and the
// run over it looked exactly like a complete one.
//
// The directories below are not declared graphs and no declaration would
// answer them — they are a checkout's machinery (`.git`, `node_modules`) or
// content this axis cannot read as a reference: `translations/` holds the
// same prose in other languages, so a name there is the ORIGINAL's reference
// counted again, once per locale.
// declared-path-literal: checkout machinery and per-locale copies of prose already counted at its source; none is a declared graph directory
const SKIP_DIRS = new Set([".git", "node_modules", "translations"]);
/**
 * Kinds of graph whose contents a PROCESS writes.
 *
 * This is the generated-file question answered from the DECLARATION rather
 * than from a path or a marker, which is the only form of it this repository
 * accepts. `holds` is already on every graph kind and already means exactly
 * this: `content` is produced by authors, `context` is read and never
 * written, `state` is written by a running process as it runs, `derived` is
 * computed from something else.
 *
 * A name in machine output is not an authored reference. The rule is
 * `qa-checkers-dak.ts`'s, which this cannot import across the layer boundary
 * (`cat-harness` is depended on BY core, so importing core here would be the
 * very defect this file reports): *"A finding on a generated file is
 * unactionable — the fix is in the spreadsheet row or in the generator, and a
 * `fail` recorded against the artefact points at neither."*
 *
 * Its caution applies too — *"only an explicit marker counts. Inferring
 * 'generated' from a path or a naming convention would silently exempt
 * authored content"* — and a declaration is a stronger warrant than a marker,
 * not a weaker one: the instance SAYS what a process does with the directory,
 * and `check:graph-kind-work` already gates that it said something.
 *
 * Asked through `isStateGraph`/`isDerivedGraph` rather than by reading
 * `holds` directly, because those two are deliberately NOT each other's
 * negations and both are false for a kind the registry does not know. An
 * unregistered kind has said nothing, so the file is READ — the conservative
 * direction, since the cost of reading an excluded file is a finding somebody
 * dismisses, while the cost of excluding a read one is a leak nobody sees.
 *
 * A DIRECTORY is not the only unit this is declared at, and taking it as the
 * only one cost 429 false findings on the first run (2026-09-23): three
 * projections under `docs/` — `assets/{schemas,beans,voices}/index.json` —
 * are written by generators while sitting in a `content` graph, because the
 * directory holds documentation and these are files inside it. The FILE
 * family is declared too, and {@link GENERATOR_WRITTEN} reads that.
 */
/**
 * Every `$schema` a graph kind declares a GENERATOR writes.
 *
 * The second half of the machine-written question, at file granularity, and
 * read from the same declarations as the first — `nodeSchemas[…].generated`
 * in the graph-kind registry. Eight families across `docs` and `qa`.
 *
 * It read `writtenBy` until main removed that form (#1168 B6b, beans `dv8v`,
 * `d4lb`): the registry is a `@general` node, and naming each family's writer
 * named its dependents. `generated: true` says the same fact without the edge.
 * It is also STRICTER than what it replaced: `writtenBy` could name a
 * family's consumer, so `folio-intake/v1` — authored files that
 * `library-graph.ts` only reads — was skipped as if generated. It is now read.
 *
 * Derived rather than listed, and that is the point: the three projections
 * this was written for are `folio-schema-graph/v1`, `folio-bean-index/v1` and
 * `folio-voices-index/v1`, but listing those three would have left the other
 * six — and the tenth, the day somebody declares it — reporting as authored
 * prose. A literal written for exactly this purpose on 2026-09-21 was
 * silently missing six nodes; this is the same mistake one directory over.
 *
 * It also needs no change to any generator. The alternative considered was
 * having each of the three emit a `"_generated"` key, the way
 * `sync-docs-harness.ts` does: three edits, three regenerated artefacts, and
 * a convention a fourth generator would have to remember. The declaration
 * already says it, so nothing needs to start saying it again.
 */
const GENERATOR_WRITTEN: ReadonlySet<string> = new Set(
  Object.values(BASE_GRAPH_KINDS).flatMap((k) =>
    Object.entries(k.nodeSchemas ?? {})
      .filter(([, d]) => (d as { generated?: true }).generated === true)
      .map(([schema]) => schema),
  ),
);

/**
 * Does the file SAY a generator wrote it, in its own first lines?
 *
 * Two conventions in the corpus, both self-declarations rather than
 * inferences from a path:
 *
 *  - a top-level `"_generated"` key in JSON — `sync-docs-harness.ts` into
 *    `docs/_data/harness.json` all along, and `glossary-page.ts` into the
 *    SKOS assets and the extracted glossary schemes (bean `ws99`);
 *  - a `generated:` front-matter key in Markdown — `gen-skill-docs.ts` and
 *    `gen-schema-docs.ts` into the `docs/reference/**` mirrors (#1222),
 *    `gen-uml-overview.ts` into `docs/uml/`, and `glossary-page.ts` and
 *    `gen-docs-pages.ts` into their own pages (`ws99`).
 *
 * No count of either: the summary line prints how many files take this route
 * on the run in front of you, and a number written down here is a claim about
 * a corpus that changes whenever a generator gains a page. This paragraph
 * carried two such numbers and both were stale within four days.
 *
 * The mirrors are the clearest case for reading a declaration rather than a
 * path: each is a COPY of a skill that sits one directory away, so a finding
 * on one is the same finding twice and its fix is in neither — it is in the
 * source skill. AGENTS.md has forbidden hand-editing them since before this
 * check existed; the files simply never said so themselves.
 *
 * Front matter only, and only the first lines: a page that DISCUSSES
 * generation must not be able to exempt itself by mentioning the word.
 *
 * JSON is read the way {@link isGeneratorWritten} reads it — PARSED, and
 * `_generated` taken from the top level wherever it sits. It was a regex
 * anchored to the first key until bean `ws99`, which is a different rule than
 * the one this docblock states: it made POSITION part of the contract, so a
 * file whose first key is `$schema` or `@context` could not declare itself
 * without moving the key that says what it IS. Both are worth keeping first —
 * `$schema` because every validator looks for it there, `@context` because a
 * JSON-LD reader does — so the position requirement cost the declaration
 * rather than buying anything. The principle the regex was defending is
 * unchanged and is met better by parsing, in the words of this file's own
 * {@link isGeneratorWritten}: *"Parsing and reading the top level is the
 * difference between what a file IS and what it mentions."* A `_generated`
 * nested inside a projection of another file is still not this file's
 * declaration, and a whole-text scan would have read it as one.
 *
 * Markdown keeps the head-only front-matter route unchanged: there is no
 * top level to read in prose, so the first lines are the only place a page
 * can speak about itself rather than about its subject.
 */
export function declaresGenerated(abs: string): boolean {
  let text: string;
  try {
    text = readFileSync(abs, "utf-8");
  } catch {
    return false;
  }
  if (abs.endsWith(".json") || abs.endsWith(".jsonld")) {
    try {
      const top = JSON.parse(text) as unknown;
      if (typeof top !== "object" || top === null || Array.isArray(top)) return false;
      return (top as { _generated?: unknown })._generated !== undefined;
    } catch {
      return false; // unparseable is not a licence to skip it
    }
  }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text.slice(0, 2000));
  return fm !== null && /^generated:\s*\S/m.test(fm[1]!);
}

/**
 * Is this file one a generator writes, by its own `$schema`?
 *
 * Only a TOP-LEVEL `$schema` counts. `docs/assets/schemas/index.json` carries
 * the string `generatedAt` four times deeper in — as a FIELD NAME inside a
 * schema projection — so a marker scan over the text says "generated" about
 * any file that describes a generated one. Parsing and reading the top level
 * is the difference between what a file IS and what it mentions.
 */
function isGeneratorWritten(abs: string): boolean {
  if (!abs.endsWith(".json") && !abs.endsWith(".jsonld")) return false;
  try {
    const top = JSON.parse(readFileSync(abs, "utf-8")) as unknown;
    if (typeof top !== "object" || top === null || Array.isArray(top)) return false;
    const schema = (top as { $schema?: unknown }).$schema;
    return typeof schema === "string" && GENERATOR_WRITTEN.has(schema);
  } catch {
    return false; // unparseable is not a licence to skip it
  }
}

/** Text this axis can read. A binary or an image carries no reference a reader follows. */
const EXTENSIONS = new Set([".ts", ".tsx", ".md", ".json", ".jsonld", ".bpmn", ".dmn", ".yml", ".yaml"]);

/**
 * X3 — the LAYERING SPECIFICATIONS (owner, Q-B 2026-10-01: "adopt the X3
 * exemption for the 3 layering specifications").
 *
 * Each of these files has the instance graph as its SUBJECT: it is the
 * document or the code that DEFINES which instance sits on which layer, so it
 * cannot do its job without naming the layers above it. Moved to any one
 * layer it could no longer describe the others — the 2026-09-24 PENDING
 * rationale, now ruled rather than held. A named list, never a pattern: a
 * file earns a place here only by an owner ruling, and a regex would admit
 * the next file that merely resembles one.
 *
 * This file is one of the three. Until the ruling it sat in its own PENDING
 * list, on the argument that a carve made by the checker for the checker is
 * the one nobody else can audit; the ruling answers that by being the
 * owner's carve rather than the checker's, and it is counted in the summary
 * like every other exemption.
 */
// declared-path-literal: the three files the owner's X3 ruling names, repo-root-relative because that is how an occurrence's file is reported
const LAYERING_SPECIFICATIONS = [
  "cat-harness/scripts/partition/instance-rules.ts",
  "smart-base/skills/content/authoring-who-smart-guidelines/smart-stack-layering.md",
  "cat-harness/scripts/check-reference-direction.ts",
] as const;

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── This instance's exemptions ──────────────────────────────────
//
// Same contract as `iwtn`'s `ALLOW`: each entry states WHY the text is not a
// reference to the instance whose name it contains. A regex with no reason is
// a hole, and these are COUNTED in the summary rather than disappearing, so
// an exemption doing more work than anyone intended is visible.

const EXEMPTIONS: readonly ReferenceExemption[] = [
  {
    pattern: /https?:\/\/\S+/,
    reason:
      "the occurrence sits on a line carrying a URL — an ADDRESS, not a reference. `iwtn`'s ALLOW makes exactly this carve for bootstrap's own publication address and source repository: a location is where a thing is, not a dependency on it",
  },
  {
    pattern: /(?<![A-Za-z0-9_-])[a-z][a-z0-9-]*:[A-Za-z][A-Za-z0-9]*/,
    reason:
      "a CURIE — `<prefix>:<Term>`, the compact form of a schema identifier. The owner's ruling the same day: nothing should point outside its subgraph *\"except SDO schema definitions (e.g. OMG:bpmn....)\"*, and `iwtn`'s ALLOW already carves the `folio:` BPMN prefix and `folio-*/v1` schema ids on that basis. A vocabulary term is a NAME, and a name that happens to share a string with an instance is not a reference to it",
  },
  {
    file: /(^|\/)(test|tests|__tests__)\/|\.(test|spec)\.tsx?$|(^|\/)eval\//,
    reason:
      "TEST MATERIAL. Not a carve invented here — it is the rule the import axis already applies, stated in `partition/instance-rules.ts`: *\"A test may reach anywhere it needs to; that is what a test is for.\"* A fixture naming a downstream instance is exercising the layering, not depending on it, and the two axes agreeing on this is the point of absorbing one into the other. `check:partition` buckets 486 modules as `(test material)` on the same ground",
  },
  {
    pattern: /^\s*(\/\/|\*|#)?\s*declared-path-literal:/,
    reason:
      "`check:declared-paths`'s own exemption marker, whose reason text necessarily names the directory it is excusing. Scanning it would make satisfying one gate breach another",
  },
  {
    file: new RegExp(`^(${LAYERING_SPECIFICATIONS.map(escapeRe).join("|")})$`),
    reason:
      "X3, a LAYERING SPECIFICATION (owner, Q-B 2026-10-01): the file's subject IS the instance graph — it defines the layers, so it names them. Moved to any one layer it could no longer describe the others. A named list of three, ruled by the owner, never a pattern",
  },
];

/**
 * X1 — a TRANSLATION MIRROR (owner, Q-B 2026-10-01: "exempt translation
 * mirrors").
 *
 * The existing `SKIP_DIRS` rule applied consistently rather than a new carve:
 * `translations/` is skipped because a name there is the ORIGINAL's reference
 * counted again, once per locale. The locale copies under `docs/<lang>/` and
 * `docs/guides/<lang>/` are the same thing in another place, so a reference in
 * one is fixed in its English source and re-translated, never in the copy.
 *
 * Decided by what the FILE declares, never by its path: front matter carrying
 * a `lang:` other than `en` AND a `translation_source:`. Both, because `lang:`
 * alone is on every English source page too, and a page that merely mentions
 * translation must not be able to exempt itself — the same head-only reading
 * {@link declaresGenerated} uses. Applied per file in {@link analyse} and
 * consulted LAST, so any other exemption that matches keeps its own reason.
 */
const TRANSLATION_MIRROR: ReferenceExemption = {
  file: /(?:)/,
  reason:
    "X1, a TRANSLATION MIRROR (owner, Q-B 2026-10-01): the file's front matter declares a non-English `lang:` and a `translation_source:`, so every name in it is its source page's reference counted again — the reason `translations/` is skipped. Fixed in the source and re-translated, never in the copy",
};

/** How many exemptions this axis declares, each with a stated reason — {@link EXEMPTIONS} plus {@link TRANSLATION_MIRROR}. */
export const EXEMPTIONS_DECLARED = EXEMPTIONS.length + 1;

/** Does the file declare itself a translation of another page, in its own front matter? */
export function declaresTranslationMirror(abs: string): boolean {
  if (!abs.endsWith(".md")) return false;
  let text: string;
  try {
    text = readFileSync(abs, "utf-8");
  } catch {
    return false;
  }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text.slice(0, 4000));
  if (fm === null) return false;
  const lang = /^lang:\s*["']?([A-Za-z-]+)["']?\s*$/m.exec(fm[1]!)?.[1];
  return lang !== undefined && lang.toLowerCase() !== "en" && /^translation_source:\s*\S/m.test(fm[1]!);
}

// ── Discovery ───────────────────────────────────────────────────

interface Instance {
  root: string;
  name: string;
  needs: readonly string[] | undefined;
  /** Absolute paths this instance declares as holding machine-written graphs. */
  machineWritten: string[];
  /**
   * The directory paths this instance DECLARES, exactly as declared — relative
   * segments like `uploads/` or `tools/`, not absolute and not resolved.
   *
   * Unresolved on purpose, because what they answer is a question about TEXT:
   * given an occurrence of this instance's name, does the text go on to name
   * one of the instance's own directories? That is the one test that
   * distinguishes `<name>/uploads/x.pdf` — a reference to the instance — from
   * `<name>/docs/guides/x.md`, which is a path in the repository. The root
   * instance's own name is written `<name>` here rather than spelled out, for
   * the reason the module docblock gives about this file's own text: an
   * example that spells it out is itself a wrong-direction reference, and a
   * gate whose documentation breaches it is the shape this repository already
   * carves `declared-path-literal` for. Resolving them to absolute paths
   * would answer a different
   * question (does this file exist), and for the root instance every relative
   * path in the tree resolves inside its root, so that question answers yes
   * for everything.
   */
  declaredPaths: string[];
}

/** True when EVERY kind the directory declares is machine-written — conservative, so a directory that also holds authored content keeps being read. */
function declaresMachineWritten(kinds: readonly string[] | undefined): boolean {
  if (kinds === undefined || kinds.length === 0) return false;
  return kinds.every((k) => isStateGraph(k) || isDerivedGraph(k));
}

function instances(repoRoot: string): Instance[] {
  return instanceRootsIn(repoRoot).map((root) => {
    const decl = JSON.parse(readFileSync(join(root, findDeclarationFile(root)!), "utf-8")) as {
      name?: string;
      needs?: string[];
      directories?: { path?: string; graphKinds?: string[]; scope?: "instance" | "repository" }[];
    };
    // `rootForScope`, NEVER `join(root, path)`. A directory entry may carry
    // `scope: "repository"`, and it then resolves against the REPO ROOT
    // rather than against the declaring instance — 23 of the 45 entries in
    // `cat-harness.json` do, more than half, including `beans/`, `todos/`,
    // `issue-marks/` and six `*/library/` trees.
    //
    // Composing `join(root, path)` for those yields `cat-harness/beans/`,
    // which does not exist, so the directory was not excluded and every file
    // in it was read as authored prose. Measured cost below.
    const machineWritten = (decl.directories ?? [])
      .filter((d) => d.path !== undefined && declaresMachineWritten(d.graphKinds))
      .map((d) => join(rootForScope(root, d.scope), d.path!));
    // A declaration with no `name` cannot be a reference TARGET (nothing to
    // match) and cannot own files by name either, so it is skipped rather
    // than given a fallback that would invent an instance.
    const declaredPaths = (decl.directories ?? [])
      .map((d) => d.path)
      .filter((d): d is string => d !== undefined && d !== "");
    return { root, name: decl.name ?? "", needs: decl.needs, machineWritten, declaredPaths };
  });
}

/**
 * The instance a file belongs to: the INNERMOST declaring root containing it.
 *
 * The root instance's directory contains every other one, so "which instance
 * is this file in" has 17 true answers by containment and exactly one useful
 * one. Longest matching root wins.
 */
function ownerOf(abs: string, all: readonly Instance[]): string | undefined {
  let best: Instance | undefined;
  for (const i of all) {
    if (i.name === "") continue;
    if ((abs === i.root || abs.startsWith(i.root + sep)) && (best === undefined || i.root.length > best.root.length)) {
      best = i;
    }
  }
  return best?.name;
}

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p));
    else if (EXTENSIONS.has(e.name.slice(e.name.lastIndexOf(".")))) out.push(p);
  }
  return out;
}

// ── The scan ────────────────────────────────────────────────────

export interface ReferenceReport {
  instances: number;
  /** Every occurrence, with the verdict that was reached and its basis. */
  classified: { occurrence: Occurrence; verdict: ReferenceVerdict }[];
  /** Files in a directory DECLARED to hold a machine-written graph. Counted, so the exclusion is visible rather than silent. */
  skippedMachineWritten: number;
  /** Files that declare THEMSELVES generator output — by `$schema`, by a top-level `_generated`, or by `generated:` front matter. Counted separately from the directory rule: a different declaration, at a different granularity. */
  skippedGeneratorWritten: number;
  /** Instances whose `needs` nobody has declared. Reported, never assumed. */
  undeclared: string[];
}

export function analyse(root = REPO_ROOT): ReferenceReport {
  const all = instances(root).filter((i) => i.name !== "");
  const byName = new Map(all.map((i) => [i.name, i]));
  const needs = new Map(all.map((i) => [i.name, i.needs]));

  const flat = flattenDependencies(
    all.map((i) => ({ id: i.name, needs: (i.needs ?? []).filter((n) => byName.has(n)), fatal: false })),
  );
  if (flat.problems.length > 0) {
    // Refused rather than walked, the same as `kg-detangle`: no ancestor set
    // exists for a broken graph, and a partial one reports allowed
    // references as wrong-direction.
    throw new Error(
      `check:reference-direction: the instance needs graph is broken — ${flat.problems.map((p) => p.detail).join("; ")}`,
    );
  }
  const anc = ancestorsOf(flat.order);
  const rule: LayerRule = { allowed: allowedFromNeeds(needs, anc) };

  /** Who sits ABOVE `name`: every instance with `name` among its ancestors. */
  const above = new Map<string, string[]>(
    all.map((i) => [i.name, all.filter((u) => anc.get(u.name)?.has(i.name)).map((u) => u.name)]),
  );
  /**
   * What THIS occurrence of a name that collides with the repository's name
   * actually names.
   *
   * `undefined` for the ordinary case — the target's name is not the
   * repository's, so nothing here applies and the arrow decides. Only an
   * instance rooted AT the repository root collides, because only then is the
   * instance's name the repository's name.
   *
   * The three answers, in the order they are tested, and the order is the
   * substance:
   *
   *  1. **`"instance"`** — the text carries `<name>/<declared directory>`, so
   *     it points into a directory this instance actually DECLARES. Tested
   *     FIRST, so `https://…/<name>/uploads/x.pdf` is the instance rather than
   *     an address: a URL into an instance's own directory is still a
   *     reference to that instance, and putting the URL test first would have
   *     excused it. (`<name>` rather than the root's actual name, for the
   *     reason {@link Instance}'s `declaredPaths` gives: the spelled-out
   *     example would be a wrong-direction reference in this very file.)
   *  2. **`"repository"`** — the name sits inside an `http(s)` URL (an
   *     ADDRESS), or appears as `<owner>/<name>` (a repository slug), or as
   *     `<name>/` followed by any other path segment (a path in the
   *     repository, not in the instance).
   *  3. **`"unknown"`** — a bare prose mention: no path, no URL, nothing to
   *     tell the repository from the instance. Still `undetermined`, and that
   *     is the honest residue rather than a case to be eliminated.
   *
   * It reads the DECLARATION rather than a path literal, which is this
   * repository's standing rule for the generated-file question two functions
   * up and holds for the same reason: `uploads/` and `tools/` are what the
   * root declares TODAY, and a fourth directory added tomorrow is recognised
   * without an edit here.
   */
  const collisionOf = (occ: Occurrence): NameCollision | undefined => {
    const target = byName.get(occ.to);
    if (target === undefined || target.root !== root) return undefined;
    const { text } = occ;
    const name = occ.to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Bounded at BOTH ends, for the reason `occurrencesOf` is: an unbounded
    // `<name>/tools` also matches `<name>/toolsmiths`, and an unbounded left
    // edge matches a longer instance name ending in the target's.
    for (const declared of target.declaredPaths) {
      const seg = declared.replace(/^\.?\/+/, "").replace(/\/+$/, "");
      if (seg === "") continue;
      const esc = seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![A-Za-z0-9_-])${name}/${esc}(?![A-Za-z0-9_-])`).test(text)) return "instance";
    }
    const inUrl = (text.match(/https?:\/\/\S+/g) ?? []).some((u) =>
      new RegExp(`(?<![A-Za-z0-9_-])${name}(?![A-Za-z0-9_-])`).test(u),
    );
    if (inUrl) return "repository";
    if (new RegExp(`[A-Za-z0-9_.-]+/${name}(?![A-Za-z0-9_-])`).test(text)) return "repository";
    if (new RegExp(`(?<![A-Za-z0-9_-])${name}/[A-Za-z0-9_.@-]`).test(text)) return "repository";
    return "unknown";
  };

  // Every declared machine-written directory, across every instance. Flat
  // rather than per-instance because an instance may declare a directory
  // inside another's root (`cat-harness.json` declares
  // `folio-assistant-core/schemas/`), and the file is machine-written either
  // way — the declaration is about the DIRECTORY, not about who scans it.
  const machineWritten = all.flatMap((i) => i.machineWritten);
  const isMachineWritten = (abs: string): boolean =>
    machineWritten.some((d) => abs === d || abs.startsWith(d.endsWith(sep) ? d : d + sep));

  const classified: ReferenceReport["classified"] = [];
  let skippedMachineWritten = 0;
  let skippedGeneratorWritten = 0;
  for (const abs of filesUnder(root)) {
    if (isMachineWritten(abs)) {
      skippedMachineWritten++;
      continue;
    }
    if (isGeneratorWritten(abs) || declaresGenerated(abs)) {
      skippedGeneratorWritten++;
      continue;
    }
    const from = ownerOf(abs, all);
    if (from === undefined) continue;
    const targets = above.get(from) ?? [];
    if (targets.length === 0) continue;
    let text: string;
    try {
      text = readFileSync(abs, "utf-8");
    } catch {
      continue; // unreadable is not clean, but it is also not a finding about direction
    }
    const file = relative(root, abs).split(sep).join("/");
    // X1 is a property of the FILE, read once, and appended LAST so any other
    // exemption that also matches keeps its own reason.
    const exemptions = declaresTranslationMirror(abs) ? [...EXEMPTIONS, TRANSLATION_MIRROR] : EXEMPTIONS;
    for (const to of targets) {
      for (const hit of occurrencesOf(text, to)) {
        const occurrence: Occurrence = { file, line: hit.line, text: hit.text.trim(), from, to };
        classified.push({ occurrence, verdict: classifyReference(occurrence, rule, collisionOf, exemptions) });
      }
    }
  }
  return {
    instances: all.length,
    classified,
    skippedMachineWritten,
    skippedGeneratorWritten,
    undeclared: all.filter((i) => i.needs === undefined).map((i) => i.name).sort(),
  };
}

// ── The baseline: a one-way ratchet ─────────────────────────────
//
// Owner, Q-B 2026-10-01: every file holding a wrong-direction reference today
// is BASELINED, a new one fails, and a fixed one is trimmed. A.10 of the same
// ruling: the ratchet covers files naming ONE instance above them as well as
// files naming several, so a new file naming one higher instance fails too.
// Q1 of the same ruling: the fix is to REWORD in place, so the store is the
// checklist — the drain is done when it is empty.

/** Where the baseline lives: beside this script, the way the other `*-baseline.json` files do. */
export const BASELINE_FILE = "reference-direction-baseline.json";
const BASELINE_PATH = join(import.meta.dir, BASELINE_FILE);

/**
 * Why an entry is in the store. Provenance only — both are trimmed and
 * narrowed by the same rule, and both are fixed the same way (reword).
 *
 *  - `held` — the 2026-09-24 `PENDING` list (issue #1219): files naming
 *    several instances above them, held as a question. Folded in at the seed
 *    so the writer can trim them; a TypeScript literal could not be.
 *  - `baselined` — everything else that held a wrong-direction reference on
 *    the seed commit: "baselined 2026-10-01".
 */
export type BaselineStatus = "held" | "baselined";

export interface BaselineEntry {
  status: BaselineStatus;
  /** The date the entry entered the store. */
  since: string;
  note: string;
  /**
   * The instances above it that the file names — a SET, never a count. A
   * count cannot see a file that swaps one instance for another (2 → 2), and
   * the `names` field of the `PENDING` list this replaces had rotted in 24 of
   * 43 entries because nothing graded it.
   */
  targets: string[];
}

export interface Baseline {
  _generated: string;
  _comment: string;
  entries: Record<string, BaselineEntry>;
}

export interface RatchetResult {
  /** A file holding a wrong-direction reference that the baseline does not list, OR a listed file naming an instance its entry does not. Exit 1. */
  newOffenders: { file: string; targets: string[]; added: string[] }[];
  /** Entries with no wrong-direction reference left (or no file left). Removed by the writer. */
  trimmed: { file: string; why: string }[];
  /** Entries whose target set shrank but is not empty. Narrowed by the writer. */
  narrowed: { file: string; from: string[]; to: string[] }[];
  /** Entries moved along a git rename — the writer only, and only onto a subset of the old targets. */
  rekeyed: { from: string; to: string }[];
  /** What the writer writes: `prior` minus `trimmed`, with `narrowed` and `rekeyed` applied. There is no code path that adds a key. */
  next: Baseline;
}

/** Each file holding a wrong-direction reference, and the instances above it that it names. */
export function wrongTargetsByFile(report: ReferenceReport): Map<string, Set<string>> {
  const byFile = new Map<string, Set<string>>();
  for (const c of report.classified) {
    if (c.verdict.verdict !== "wrong-direction") continue;
    const s = byFile.get(c.occurrence.file) ?? new Set<string>();
    s.add(c.occurrence.to);
    byFile.set(c.occurrence.file, s);
  }
  return byFile;
}

const byKey = <T>(rec: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.keys(rec).sort().map((k) => [k, rec[k]!]));

/**
 * The ratchet. Pure: a scan and the committed baseline in, the verdict and the
 * next baseline out — no filesystem, no git, no printing.
 *
 * `renames` maps a NEW path to the OLD one (`git diff -M`), and only the
 * writer passes it: a pure `git mv` of a baselined file would otherwise read
 * as trimmed-at-old plus new-offender-at-new, and S5 moves hundreds. A rename
 * re-keys only onto a SUBSET of the old entry's targets — a move that also
 * names a new instance is still a new offender, and its old entry is trimmed.
 */
export function applyRatchet(
  report: ReferenceReport,
  prior: Baseline,
  renames: ReadonlyMap<string, string> = new Map(),
  unseen: ReadonlySet<string> = new Set(),
): RatchetResult {
  const byFile = wrongTargetsByFile(report);
  const entries: Record<string, BaselineEntry> = {};
  const newOffenders: RatchetResult["newOffenders"] = [];
  const narrowed: RatchetResult["narrowed"] = [];
  const rekeyed: RatchetResult["rekeyed"] = [];
  const consumed = new Set<string>();

  for (const file of [...byFile.keys()].sort()) {
    const targets = [...byFile.get(file)!].sort();
    const p = prior.entries[file];
    if (p !== undefined) {
      const added = targets.filter((t) => !p.targets.includes(t));
      if (added.length > 0) {
        newOffenders.push({ file, targets, added });
        entries[file] = p; // kept as it was: the ratchet never widens an entry
      } else if (targets.length < p.targets.length) {
        narrowed.push({ file, from: [...p.targets], to: targets });
        entries[file] = { ...p, targets };
      } else {
        entries[file] = p;
      }
      continue;
    }
    const old = renames.get(file);
    const po =
      old !== undefined && !byFile.has(old) && !consumed.has(old) ? prior.entries[old] : undefined;
    if (old !== undefined && po !== undefined && targets.every((t) => po.targets.includes(t))) {
      consumed.add(old);
      rekeyed.push({ from: old, to: file });
      entries[file] = { ...po, targets };
      continue;
    }
    newOffenders.push({ file, targets, added: po === undefined ? targets : targets.filter((t) => !po.targets.includes(t)) });
  }

  // An entry the scan could not SEE (`unseen`: its file is in a checkout that
  // is not there, such as a submodule nobody initialised) is carried, never
  // trimmed: "could not read it" is not "fixed", and trimming it would
  // re-admit the file the moment that checkout is restored.
  for (const f of unseen) if (prior.entries[f] !== undefined && !byFile.has(f)) entries[f] = prior.entries[f]!;
  const trimmed = Object.keys(prior.entries)
    .filter((f) => !byFile.has(f) && !consumed.has(f) && !unseen.has(f))
    .sort()
    .map((file) => ({ file, why: "no wrong-direction reference left" }));

  return {
    newOffenders,
    trimmed,
    narrowed,
    rekeyed,
    next: { _generated: prior._generated, _comment: prior._comment, entries: byKey(entries) },
  };
}

const BASELINE_COMMENT =
  "Every file holding a wrong-direction reference — naming one or more instances above it (owner Q-B 2026-10-01, A.10). " +
  "status 'held' = the 2026-09-24 PENDING list (issue #1219), folded in; status 'baselined' = 'baselined 2026-10-01'. " +
  "The fix is to REWORD in place (Q1). A new offender fails; a fixed entry is trimmed by `bun run check:reference-direction` (and `bun run regen`). The drain is done when `entries` is empty.";

/**
 * Seed the store from a scan. Refuses when one exists: a second seed would
 * re-admit every regression since the first, which is the one thing the
 * ratchet exists to prevent.
 */
export function seedBaseline(
  report: ReferenceReport,
  existing: Baseline | undefined,
  opts: { held: ReadonlySet<string>; sha: string; today: string },
): { ok: true; baseline: Baseline } | { ok: false; error: string } {
  if (existing !== undefined) {
    return {
      ok: false,
      error: "a baseline already exists — --seed writes only an ABSENT one; the ratchet only ever shrinks it",
    };
  }
  const byFile = wrongTargetsByFile(report);
  const entries: Record<string, BaselineEntry> = {};
  for (const file of [...byFile.keys()].sort()) {
    const targets = [...byFile.get(file)!].sort();
    entries[file] =
      opts.held.has(file) && targets.length > 1
        ? { status: "held", since: "2026-09-24", note: "PENDING, issue #1219", targets }
        : { status: "baselined", since: opts.today, note: `baselined ${opts.today} (owner Q-B: reword in place)`, targets };
  }
  return {
    ok: true,
    baseline: {
      _generated: `check-reference-direction.ts — seeded once by --seed on ${opts.sha}; every later write only removes, narrows or re-keys along a rename (one-way ratchet). Do not add entries by hand.`,
      _comment: BASELINE_COMMENT,
      entries,
    },
  };
}

/** Stable bytes: top-level keys in a fixed order, entries sorted, one trailing newline. */
export function serialiseBaseline(b: Baseline): string {
  const entries = byKey(
    Object.fromEntries(
      Object.entries(b.entries).map(([f, e]) => [f, { status: e.status, since: e.since, note: e.note, targets: [...e.targets].sort() }]),
    ),
  );
  return JSON.stringify({ _generated: b._generated, _comment: b._comment, entries }, null, 2) + "\n";
}

function readBaseline(path: string): Baseline | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf-8")) as Baseline;
}

/**
 * Renames on this branch, NEW path → OLD path, or `undefined` when they could
 * not be determined — never an empty map in that case, because "no renames"
 * would trim every moved entry and report its new path as an offender.
 *
 * Against the merge base with `origin/main` (or `$REFDIR_BASE`), and against
 * the WORKING TREE, so a staged `git mv` counts before it is committed. The
 * writer calls this; `--check` never does — CI's shallow checkout may not hold
 * the merge base, and the check must stay a pure comparison.
 */
export function gitRenames(root: string): Map<string, string> | undefined {
  const git = (...a: string[]) => spawnSync("git", ["-C", root, ...a], { encoding: "utf-8" });
  let base = process.env.REFDIR_BASE;
  if (base === undefined || base === "") {
    const mb = git("merge-base", "HEAD", "origin/main");
    if (mb.status !== 0) return undefined;
    base = mb.stdout.trim();
  }
  const d = git("diff", "-M", "--name-status", "--diff-filter=R", base);
  if (d.status !== 0) return undefined;
  const out = new Map<string, string>();
  for (const line of d.stdout.split("\n")) {
    const [kind, from, to] = line.split("\t");
    if (kind?.startsWith("R") && from && to) out.set(to, from);
  }
  return out;
}

// ── The committed sidecar ───────────────────────────────────────

/** The sidecar's stem: `<instance>/test/results/<stem>.qa-results.json`. */
export const SIDECAR_STEM = "reference-direction";

/**
 * The one family {@link comparableDirection} holds OUT of the staleness key.
 *
 * Named rather than spelled at each use, because the whole freshness decision
 * turns on which family this is — a second spelling one edit out of step would
 * silently start grading the counts, or silently stop grading a state.
 */
export const CENSUS_FAMILY = "verdict-census";

/**
 * The DETERMINATIONS this axis has reached — everything `--check` grades.
 *
 * Every field here moves when a RULING moves, never when somebody writes a
 * paragraph that names nothing above it: a file gains or loses a target, an
 * entry is trimmed, an instance starts or stops declaring `needs`. That is the
 * property that makes grading them worth doing, and it is the property the
 * verdict counts do not have.
 */
export interface DirectionStates {
  /** Entries held from the 2026-09-24 `PENDING` list, with their targets. */
  held: { file: string; targets: string[] }[];
  /** Entries baselined 2026-10-01, with their targets. */
  baselined: { file: string; targets: string[] }[];
  /** Entries the tree has outgrown — trimmed or narrowed by the writer. Non-empty means the committed baseline is behind the tree. */
  baselineBehind: { file: string; why: string }[];
  /** Files the baseline does not cover. This is what exits 1. */
  newOffenders: { file: string; targets: string[]; added: string[] }[];
  /** Instances that declare no `needs`, so nothing about their layer is known. */
  undeclaredInstances: string[];
}

/**
 * Reduce a scan and a baseline to the determinations, with no filesystem and
 * no printing. Pure and exported so a test can exercise it on a three-file
 * synthetic tree. The real corpus is deliberately out of reach of this suite:
 * a prior session's tests walked it and pushed a sibling past its 5 s budget.
 */
export function directionStates(report: ReferenceReport, baseline: Baseline): DirectionStates {
  const r = applyRatchet(report, baseline);
  const of = (s: BaselineStatus) =>
    Object.entries(baseline.entries)
      .filter(([, e]) => e.status === s)
      .map(([file, e]) => ({ file, targets: [...e.targets].sort() }))
      .sort((a, b) => a.file.localeCompare(b.file));
  return {
    held: of("held"),
    baselined: of("baselined"),
    baselineBehind: [
      ...r.trimmed,
      ...r.narrowed.map((n) => ({ file: n.file, why: `names fewer instances now: ${n.from.join(", ")} → ${n.to.join(", ")}` })),
    ].sort((a, b) => a.file.localeCompare(b.file)),
    newOffenders: r.newOffenders,
    undeclaredInstances: [...report.undeclared].sort(),
  };
}

/**
 * The verdict counts — this axis's ANSWER, recorded but never graded.
 *
 * Only verdicts. `skippedMachineWritten` and `skippedGeneratorWritten` are
 * counts of FILES and stay in the printed report, for the reason the module
 * docblock gives: a file census says nothing about direction and moves on any
 * commit that adds a page. The held and baselined OCCURRENCE counts are
 * verdict counts about the store; its membership — the part that is a
 * decision — is in {@link DirectionStates} and IS graded.
 */
export function directionCensus(report: ReferenceReport, states: DirectionStates): Record<string, number> {
  const n = (v: ReferenceVerdict["verdict"]) => report.classified.filter((c) => c.verdict.verdict === v).length;
  const wrong = report.classified.filter((c) => c.verdict.verdict === "wrong-direction");
  const held = new Set(states.held.map((p) => p.file));
  const baselined = new Set(states.baselined.map((p) => p.file));
  return {
    instances: report.instances,
    occurrences: report.classified.length,
    allowed: n("allowed"),
    wrongDirection: wrong.length,
    wrongDirectionFiles: new Set(wrong.map((c) => c.occurrence.file)).size,
    exempt: n("exempt"),
    namesRepository: n("names-repository"),
    undetermined: n("undetermined"),
    heldFiles: states.held.length,
    heldOccurrences: wrong.filter((c) => held.has(c.occurrence.file)).length,
    baselinedFiles: states.baselined.length,
    baselinedOccurrences: wrong.filter((c) => baselined.has(c.occurrence.file)).length,
  };
}

/**
 * Assemble the sidecar. Pure — takes a scan, returns the document.
 *
 * `exemptionsDeclared` is the number of exemptions, each of which carries a
 * stated reason in the source. It is recorded with the states rather than with
 * the counts because an exemption appearing or disappearing is an edit
 * somebody made, not a corpus that moved.
 */
export function buildDirectionResult(args: {
  report: ReferenceReport;
  baseline: Baseline;
  exemptionsDeclared: number;
  script?: string;
  scriptAbsPath?: string;
  now?: Date;
}): QaResult {
  const states = directionStates(args.report, args.baseline);
  const census = directionCensus(args.report, states);
  const script = args.script ?? join("cat-harness", "scripts", "check-reference-direction.ts");
  return buildQaResult({
    script,
    scriptAbsPath: args.scriptAbsPath ?? join(import.meta.dir, "check-reference-direction.ts"),
    subject: { kind: "reference-direction", id: "instances" },
    families: {
      "new-offenders": {
        summary:
          "A file holding a wrong-direction reference that the baseline (`cat-harness/scripts/" + BASELINE_FILE + "`) " +
          "does not cover — unlisted, or listed but now naming an instance its entry does not (`added`). This is " +
          "the set both the plain run and `--check` exit 1 on: the ratchet only ever shrinks (owner Q-B 2026-10-01). " +
          "Fix it by rewording so it names nothing above it (Q1); never by adding it to the baseline.",
        entries: states.newOffenders,
      },
      "baseline-behind": {
        summary:
          "A baseline entry the tree has outgrown — no wrong-direction reference left, or fewer instances named " +
          "than the entry lists. A stale entry is a hole (the file could regress and pass), so `--check` fails on " +
          "it; `bun run check:reference-direction` (or `bun run regen`) trims or narrows it.",
        entries: states.baselineBehind,
      },
      held: {
        summary:
          "Baseline entries held from the 2026-09-24 `PENDING` list (issue #1219), with the instances each names. " +
          "Not findings: the committed record, so a reader with only this file can tell a held question from an " +
          "axis nobody has run. Fixed the same way as any other entry (reword) and trimmed by the same rule.",
        entries: states.held,
      },
      baselined: {
        summary:
          "Baseline entries recorded at the seed (\"baselined 2026-10-01\"), with the instances each names — the " +
          "files naming ONE instance above them as well as several (owner Q-B A.10). Membership only ever shrinks.",
        entries: states.baselined,
      },
      "instances-undeclared": {
        summary:
          "An instance that declares no `needs`, so nothing about its layer is known and every " +
          "reference from it is `undetermined`. `[]` is the floor; absent is nobody-has-said, and " +
          "collapsing the two would make an undeclared instance look either tangled or spotless.",
        entries: states.undeclaredInstances.map((name) => ({ instance: name })),
      },
      [CENSUS_FAMILY]: {
        summary:
          "Not findings, and NOT graded: what the axis says on the run that wrote this. Verdict " +
          "counts are recorded because they ARE this axis's answer — a reader holding only this " +
          "file cannot otherwise tell `audited clean` from `never audited`, which is the whole " +
          "reason the sidecar exists. They are not graded because they move whenever anybody " +
          "writes a paragraph, and `audit-coverage` already established that a gate keyed on a " +
          "number like that is stale by default. FILE counts are not here at all — how many files " +
          "were skipped as machine-written or self-declared generator output is a census of the " +
          "tree, not a statement about direction, and stays in the printed report. " +
          `${states.held.length + states.baselined.length} file(s) in the baseline; ${args.exemptionsDeclared} exemption(s) declared, each with a stated reason.`,
        entries: [census],
      },
    },
  });
}

/**
 * The staleness key — everything except the timestamp and the counts.
 *
 * `total` goes too, because it SUMS a family that is not graded: leaving it in
 * would grade the census through the back door, which is the same mistake in a
 * place nobody would look for it.
 *
 * `producer.script_hash` stays IN. A result is allowed to be old; it is not
 * allowed to have been written by a producer that no longer exists, because
 * then what it says is the old code's answer — `check:harness-state`'s rule
 * for `health`, and the reason it is a hash rather than an age.
 */
export function comparableDirection(r: QaResult): string {
  const { total: _total, families, ...rest } = r;
  const graded = Object.fromEntries(Object.entries(families).filter(([k]) => k !== CENSUS_FAMILY));
  return JSON.stringify({ ...rest, families: graded });
}

/**
 * Is the committed sidecar's RULING what this run computed?
 *
 * `absent` is its own answer and never folded into `current`. A missing
 * sidecar reported as not-stale is the `dh4f` defect precisely — no record at
 * all reading identically to a clean one.
 *
 * It reads and returns. It does not write, does not create the directory, and
 * does not repair what it is reporting: bean `ymsu` has two witnesses already
 * and this is not going to be the third.
 */
export function directionSidecarState(
  instanceRoot: string,
  fresh: QaResult,
): "absent" | "stale" | "current" {
  const p = join(instanceRoot, QA_RESULTS_DIR, `${SIDECAR_STEM}.qa-results.json`);
  if (!existsSync(p)) return "absent";
  try {
    return comparableDirection(JSON.parse(readFileSync(p, "utf-8")) as QaResult) === comparableDirection(fresh)
      ? "current"
      : "stale";
  } catch {
    return "stale";
  }
}

// ── Reporting ───────────────────────────────────────────────────

/** Where a run reads and writes. Defaults are this checkout; a test points them at a temp tree. */
export interface RunOptions {
  repoRoot?: string;
  instanceRoot?: string;
  baselinePath?: string;
  /** NEW → OLD paths, or `undefined` when they could not be determined. Only the writer asks. */
  renames?: () => Map<string, string> | undefined;
  /** The commit the seed records; asked of git when omitted. */
  seedSha?: () => string;
}

const list = (xs: readonly string[]) => xs.join(", ");

export function run(args: readonly string[], opts: RunOptions = {}): number {
  const repoRoot = opts.repoRoot ?? REPO_ROOT;
  const instanceRoot = opts.instanceRoot ?? INSTANCE_ROOT;
  const baselinePath = opts.baselinePath ?? BASELINE_PATH;
  // `--check` reads and compares; it never writes. Bean `ymsu` — a gate that
  // repairs the tree the rest of the run is judging makes a later gate's
  // verdict meaningless, and this repository has two of those already.
  const check = args.includes("--check");
  const seed = args.includes("--seed");
  const report = analyse(repoRoot);
  const baselineWhere = relative(repoRoot, baselinePath).split(sep).join("/");

  if (report.instances === 0) {
    console.error("check:reference-direction: found 0 declared instances — wrong root, or the tree moved.");
    return 2;
  }

  if (seed) {
    const heldArg = args.indexOf("--held");
    const held = new Set<string>(
      heldArg >= 0 && args[heldArg + 1] !== undefined
        ? readFileSync(args[heldArg + 1]!, "utf-8").split("\n").map((l) => l.trim()).filter((l) => l !== "")
        : [],
    );
    const sha =
      opts.seedSha?.() ??
      (spawnSync("git", ["-C", repoRoot, "rev-parse", "--short=11", "HEAD"], { encoding: "utf-8" }).stdout.trim() || "unknown");
    const s = seedBaseline(report, readBaseline(baselinePath), { held, sha, today: new Date().toISOString().slice(0, 10) });
    if (!s.ok) {
      console.error(`✗ --seed refused: ${s.error} (${baselineWhere})`);
      return 2;
    }
    writeFileSync(baselinePath, serialiseBaseline(s.baseline));
    const all = Object.values(s.baseline.entries);
    console.log(
      `seeded ${baselineWhere} on ${sha}: ${all.length} file(s) — ` +
        `${all.filter((e) => e.status === "held").length} held, ${all.filter((e) => e.status === "baselined").length} baselined ` +
        `(${all.filter((e) => e.targets.length > 1).length} naming several instances above them, ${all.filter((e) => e.targets.length === 1).length} naming one)`,
    );
    return 0;
  }

  const prior = readBaseline(baselinePath);
  if (prior === undefined) {
    console.error(`✗ no baseline at ${baselineWhere} — run \`bun run check:reference-direction --seed\` once, and commit it.`);
    return 2;
  }

  const of = (v: ReferenceVerdict["verdict"]) => report.classified.filter((c) => c.verdict.verdict === v);
  const wrong = of("wrong-direction");
  const undet = of("undetermined");
  const exempt = of("exempt");
  const namesRepo = of("names-repository");

  console.log(`Reference direction — ${report.instances} instances, ${report.classified.length} name occurrences pointing up the dependency arrow\n`);
  console.log(`  wrong-direction   ${String(wrong.length).padStart(5)}   in ${new Set(wrong.map((c) => c.occurrence.file)).size} files`);
  console.log(`  exempt            ${String(exempt.length).padStart(5)}   ${EXEMPTIONS_DECLARED} exemptions, each with a stated reason`);
  // Its OWN line, never folded into `allowed` and never into the two skipped
  // counts below. It is a different statement from all three: the occurrence
  // was read, it was judged, and what it names owes no direction.
  console.log(`  names-repository  ${String(namesRepo.length).padStart(5)}   names the repository or its address, which is not a layer`);
  console.log(`  undetermined      ${String(undet.length).padStart(5)}   declined to judge — NOT clean`);
  // PRINTED, never recorded. Both are counts of FILES — they move when
  // somebody adds a generated page and say nothing about direction. See the
  // module docblock for where the line is drawn and why.
  console.log(`\n  Not read, both answered from a declaration rather than a path:`);
  console.log(`    ${report.skippedMachineWritten} file(s) — their DIRECTORY declares a graph a process writes (holds state/derived)`);
  console.log(`    ${report.skippedGeneratorWritten} file(s) — the FILE declares itself generator output (\`$schema\` declared generated, \`_generated\`, or \`generated:\` front matter)`);

  if (wrong.length > 0) {
    const byPair = new Map<string, number>();
    for (const c of wrong) {
      const k = `${c.occurrence.from} → ${c.occurrence.to}`;
      byPair.set(k, (byPair.get(k) ?? 0) + 1);
    }
    console.log("\nWrong-direction, by pair:");
    for (const [k, v] of [...byPair].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);
  }

  if (args.includes("--findings")) {
    console.log("\nEvery wrong-direction occurrence:");
    for (const c of wrong) console.log(`  ${c.occurrence.file}:${c.occurrence.line}  [→ ${c.occurrence.to}]  ${c.occurrence.text.slice(0, 100)}`);
  }

  // The three-state discipline, stated in the output rather than left to a
  // reader's charity. Still printed, and still in these words, for as long as
  // ANY occurrence is undetermined.
  if (undet.length > 0) {
    console.log("\nUndetermined is not a pass. Two things land there:");
    if (report.undeclared.length > 0) {
      console.log(`  · ${report.undeclared.length} instance(s) declare no \`needs\`, so nothing about their layer is known: ${report.undeclared.join(", ")}`);
    }
    const rootNamed = new Set(undet.map((c) => c.occurrence.to));
    if (rootNamed.size > 0) {
      console.log(`  · the target's name is also the repository's name (${[...rootNamed].join(", ")}) and the occurrence is a bare mention — no path and no URL — so a name match cannot tell the instance from the repository`);
    }
    if (args.includes("--undetermined")) {
      for (const c of undet.slice(0, 200)) console.log(`    ${c.occurrence.file}:${c.occurrence.line}  ${c.verdict.basis}`);
    }
  }

  // The ratchet. `--check` never asks git (it must stay a pure comparison, and
  // CI's shallow checkout may not hold the merge base); the writer does, and
  // says so when it cannot tell rather than reading that as "no renames".
  let renames = new Map<string, string>();
  if (!check) {
    const r = (opts.renames ?? (() => gitRenames(repoRoot)))();
    if (r === undefined) console.log("\n  could not determine renames — re-keying nothing");
    else renames = r;
  }
  // Entries whose file is absent AND whose top-level directory is absent or
  // empty: this checkout cannot see them (a submodule nobody initialised).
  // A third state: never trimmed, and never a pass under `--check`.
  const unseen = new Set(
    Object.keys(prior.entries).filter((f) => {
      if (existsSync(join(repoRoot, f))) return false;
      const top = join(repoRoot, f.split("/")[0]!);
      return !existsSync(top) || readdirSync(top).length === 0;
    }),
  );
  if (unseen.size > 0) {
    console.log(
      `\n  could not determine ${unseen.size} baseline entr(y/ies): their checkout is absent or empty ` +
        "(submodules not initialised?). Kept, not trimmed.",
    );
  }
  const ratchet = applyRatchet(report, prior, renames, unseen);
  const baselineNow = check ? prior : ratchet.next;

  const entries = Object.values(baselineNow.entries);
  console.log(
    `\n  baseline ${baselineWhere}: ${entries.length} file(s) — ` +
      `${entries.filter((e) => e.status === "held").length} held, ${entries.filter((e) => e.status === "baselined").length} baselined. ` +
      `The ratchet only ever shrinks it (owner Q-B 2026-10-01).`,
  );
  for (const k of ratchet.rekeyed) console.log(`    re-keyed along a rename: ${k.from} → ${k.to}`);
  const behind = ratchet.trimmed.length + ratchet.narrowed.length;
  if (behind > 0) {
    const verb = check ? "✗ the committed baseline is BEHIND the tree" : "· trimmed/narrowed and written";
    console.log(`\n${verb} — ${behind} entr(y/ies):`);
    for (const t of ratchet.trimmed) console.log(`    ${t.file} — ${t.why}`);
    for (const n of ratchet.narrowed) console.log(`    ${n.file} — ${list(n.from)} → ${list(n.to)}`);
    if (check) console.log("  run `bun run check:reference-direction` (or `bun run regen`) and commit the baseline.");
  }
  if (ratchet.newOffenders.length > 0) {
    console.error(`\n✗ ${ratchet.newOffenders.length} NEW file(s) name an instance above them that the baseline does not cover:`);
    for (const o of ratchet.newOffenders) console.error(`    ${o.file} — names ${list(o.targets)} (new: ${list(o.added)})`);
    console.error("  A lower instance may not name one that depends on it. Reword so it names nothing above it (owner Q-B, Q1); the baseline is never widened.");
  }

  if (!check) {
    const text = serialiseBaseline(ratchet.next);
    if (readFileSync(baselinePath, "utf-8") !== text) writeFileSync(baselinePath, text);
  }

  // The sidecar is built from what was just measured against the baseline
  // this run leaves behind, and written — or, under `--check`, compared and
  // left alone. It happens BEFORE the exits, so the states that make this
  // exit 1 are RECORDED rather than suppressed.
  const scriptAbs = join(instanceRoot, "scripts", "check-reference-direction.ts");
  const fresh = buildDirectionResult({
    report,
    baseline: baselineNow,
    exemptionsDeclared: EXEMPTIONS_DECLARED,
    script: relative(repoRoot, scriptAbs).split(sep).join("/"),
    scriptAbsPath: scriptAbs,
  });
  const where = relative(repoRoot, join(instanceRoot, QA_RESULTS_DIR, `${SIDECAR_STEM}.qa-results.json`)).split(sep).join("/");
  const state = directionSidecarState(instanceRoot, fresh);
  if (!check) writeQaResult(instanceRoot, SIDECAR_STEM, fresh);
  // The message names WHAT was compared. A `--check` that passed silently
  // would be read as a guarantee about the counts, which it is not and by
  // design cannot be.
  console.log(
    `\n  sidecar: ${where}` +
      `\n    graded — the baseline's held and baselined sets, the entries it has outgrown, the new offenders, the instances with no \`needs\`` +
      `\n    recorded, NOT graded — the verdict counts, which move whenever the corpus does`,
  );
  if (state !== "current") {
    const msg =
      state === "absent" ? `no committed sidecar at ${where}` : `the committed sidecar at ${where} records different STATES from this run`;
    console.log(check ? `\n✗ ${msg} — run \`bun run check:reference-direction\` and commit it.` : `\n· ${msg} — written.`);
  }

  if (ratchet.newOffenders.length > 0) return 1;
  if (check) return behind > 0 || unseen.size > 0 || state !== "current" ? 1 : 0;
  if (args.includes("--strict") && wrong.length > 0) {
    console.error(`\n✗ ${wrong.length} wrong-direction reference(s). A lower instance may not name one that depends on it.`);
    return 1;
  }
  return 0;
}

if (import.meta.main) process.exit(run(process.argv.slice(2)));
