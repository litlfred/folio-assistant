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
 * answer is what its `--check` fails on. This one fails on a graded **state**
 * that is NEW against a baseline — a (file, instance-above-it) pair that
 * holds a wrong-direction reference (A.10), an entry that no longer
 * qualifies, an instance that declares no `needs`. (A multi-destination file
 * nobody has listed is still RECORDED, but A.10 subsumes it as a gate.) Bean `0dav`: the baseline is the committed working copy until QA
 * results leave `main`, and `--against <ref>` on the `qa-reports` branch
 * after; a missing one is UNKNOWN and not gated (proposal §2.3). It used to
 * fail on the committed states merely DISAGREEING, which has no subject once
 * nothing is committed. Those move when a RULING moves: somebody adds a file with no single
 * destination, or an entry stops qualifying. That is exactly the diff a
 * reviewer has to see, and it is not produced by an unrelated merge.
 *
 * It answers that ONE question and only that: `--check` does not also fail on
 * the backlog. `audit:coverage --check` settled the same trade — a gate that
 * refused every push until somebody drained a backlog is a gate switched off
 * within a week. The backlog exit stays on the plain form, and the `✗` lines
 * print on both, so a `--check` that returns 0 cannot be read as a clean axis.
 *
 * ### A.10 — the backlog is the BASELINE, so a new pair fails (owner, Q-B 2026-10-01)
 *
 * The `wrong-direction` family records every file holding a wrong-direction
 * reference, ONE entry per file and per instance above it that the file
 * names — single-destination files as well as multi-destination ones. It is
 * in `failOnNew`, so `--check` is a one-way ratchet without a second store:
 * every pair in the baseline sidecar is inherited, a pair the baseline does not
 * hold (a new file, or a known file naming a further instance) fails, and a
 * pair that disappears is resolved. The fix is to REWORD in place (Q1).
 *
 * The baseline is the `qa-reports` entry `--against` names; CI passes
 * `--against main`. Without one the comparison is UNKNOWN and not gated, so
 * the regenerated sidecar is committed in the same change that alters what
 * this axis records — that copy is what the next `main` entry publishes.
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
 *   bun run cat-harness/scripts/check-reference-direction.ts            # summary, and WRITE the sidecar
 *   … --findings           # every wrong-direction occurrence
 *   … --undetermined       # what it declined to judge, and why
 *   … --check              # do NOT write; fail ONLY on a graded state NEW against the baseline
 *   … --check --against R  # ...the baseline read from the qa-reports branch (`main`, `<sha>`, `pr/<n>`)
 *   … --strict             # exit 1 on any wrong-direction occurrence
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

import { existsSync, readdirSync, readFileSync } from "node:fs";
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
import {
  againstOrUsage,
  buildQaResult,
  judgeQaResult,
  judgeUsage,
  qaResultPath,
  writeQaResult,
  type QaResult,
} from "./qa-results.js";

const REPO_ROOT = join(import.meta.dir, "..", "..");
/**
 * The INSTANCE root, which is where the sidecar goes — never {@link REPO_ROOT}.
 *
 * `qaResultPath` mirrors this instance's `qa-results` declaration, and
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
  },  {
    file: new RegExp(`^(${LAYERING_SPECIFICATIONS.map(escapeRe).join("|")})$`),
    reason:
      "X3, a LAYERING SPECIFICATION (owner, Q-B 2026-10-01): the file's subject IS the instance graph — it defines the layers, so it names them. Moved to any one layer it could no longer describe the others. A named list of three, ruled by the owner, never a pattern",
  },
];

/**
 * Known wrong-direction references awaiting the owner's ruling.
 *
 * `iwtn`'s `PENDING`, generalised: a leak nobody has ruled on yet is made
 * VISIBLE rather than silent. Every entry is a FILE, with the number of
 * distinct instances it names, and it earns its place by ONE property —
 * **it names more than one instance above it, so "move it up" has no single
 * destination.**
 *
 * That is the whole membership rule, and it is mechanical: `names > 1`. It
 * is checked, not asserted — an entry whose file has dropped to one target
 * is reported stale, the same as one with no findings left.
 *
 * ## Why these are pending rather than exempt
 *
 * The owner ruled on 2026-09-24 that naming is naming: a lower instance may
 * not name a higher one, and the fix is to move the file up. For the 117
 * files that name exactly one instance that is a well-defined instruction.
 * For these 50 it is not, and the reasons differ by kind:
 *
 *  - **Declarations and registries** — `cat-harness.json` names
 *    `folio-assistant-core/schemas/` BECAUSE IT DECLARES THAT DIRECTORY.
 *    Moving it up does not remove the reference; it removes the
 *    declaration. Same for `avatars.ts`, `ig-chrome.ts`, `graph-kind-
 *    registry.ts`, `namespaces.ts` — registries keyed by instance.
 *  - **Specifications about the layering** — `instance-rules.ts`,
 *    `smart-stack-layering.md` and this file. RULED since (owner, Q-B
 *    2026-10-01, X3): they left this list for {@link LAYERING_SPECIFICATIONS},
 *    an exemption, because their subject IS the instance graph.
 *  - **Prose naming two or more** — a genuine choice between destinations
 *    that nobody has made.
 *
 * Grouping them by kind here would be a judgement this list has no standing
 * to make: the owner's ruling settles the single-destination case and
 * explicitly did NOT settle this one, so the honest record is the mechanical
 * fact (`names`) plus the count, not a category somebody could mistake for a
 * decision. Issue #1219.
 *
 * **It compares as a SET.** A new multi-target file fails, and so does a
 * FIXED one — a PENDING that only grows stops meaning anything.
 *
 * That half fired on bean `ws99`, which is the first evidence it works.
 * `cat-harness/docs/ig-publisher.md` and `cat-harness/docs/publication-workflow.md`
 * were held here as prose naming two or three instances with no single
 * destination. They are not prose: `gen-docs-pages.ts` writes both, and once it
 * began saying so in their front matter they stopped being read at all. Their
 * entries were DELETED rather than left, because an entry recording a choice
 * nobody has to make any more is a question the owner would be asked twice.
 * Neither file was edited to earn that — the generator was.
 */
const PENDING: readonly { file: string; names: number }[] = [
  { file: "smart-base/skills/content/authoring-who-smart-guidelines/toolchain-ownership.md", names: 4 },
  { file: "cat-harness/docs/cat-harness/published-graphs.md", names: 4 },
  { file: "cat-harness/cat-harness.json", names: 2 },
  { file: "cat-harness/schemas/avatars.ts", names: 6 },
  { file: "smart-base/skills/content/authoring-who-smart-guidelines/smart-base-tools.md", names: 2 },
  { file: "smart-base/skills/content/authoring-who-smart-guidelines/ig-artifact-ingestion.md", names: 2 },
  { file: "folio-assistant-core/scripts/ingest-ig-artifacts.ts", names: 3 },
  { file: "fhir-harness/schemas/ig-chrome.ts", names: 5 },
  { file: "cat-harness/schemas/cat-harness.ts", names: 2 },
  { file: "smart-base/skills/content/authoring-who-smart-guidelines/dak-postprocessing.md", names: 5 },
  { file: "cat-harness/skills/kg/kg-core/directory-conventions.md", names: 2 },
  // declared-path-literal: a FINDING's location, recorded repo-root-relative because that is
  // what `analyse` reports. No declaration can answer where a finding is, and this one does not
  // resolve from THIS instance's root because the file is in another instance — which is the
  // very fact the entry records.
  { file: "folio-assistant-core/schemas/fhir-artifact-index.ts", names: 2 },
  { file: "fhir-harness/fhir-harness.json", names: 6 },
  { file: "cat-harness/schemas/jsonld.ts", names: 2 },
  { file: "fhir-harness/AGENTS.md", names: 4 },
  { file: "smart-base/skills/content/authoring-who-smart-guidelines/dak-preprocessing.md", names: 3 },
  { file: "cat-harness/skills/kg/kg-core/kg-export.md", names: 2 },
  { file: "cat-harness/schemas/graph-kind-registry.ts", names: 2 },
  { file: "cat-harness/scripts/dak-pdf.ts", names: 2 },
  { file: "cat-harness/scripts/external-schemas.ts", names: 3 },
  { file: "cat-harness/docs/methodologies/index.md", names: 2 },
  { file: "fhir-harness/skills/fhir-ig-base/ig-publisher-fork.md", names: 2 },
  { file: "smart-base/schemas/dak.ts", names: 2 },
  { file: "cat-harness/schemas/namespaces.ts", names: 2 },
  { file: "cat-harness/scripts/kg-export.ts", names: 2 },
  { file: "cat-harness/scripts/layout-norms-baseline.json", names: 2 },
  { file: "cat-harness/tools/discover.ts", names: 2 },
  { file: "cat-harness/skills/ui/ui-core/harness-tiles.md", names: 2 },
  { file: "cat-harness/schemas/harness-config.ts", names: 3 },
  { file: "cat-harness/content/docs/ig-publisher/what-it-cannot-be-asked-for.md", names: 2 },
  { file: "cat-harness-tools/scripts/check-context-emission.ts", names: 3 },
  { file: "cat-harness/scripts/harness-schema-export.ts", names: 2 },
  { file: "cat-harness/docs/wireframes/voices/intent.md", names: 2 },
  { file: "smart-ig/README.md", names: 2 },
  { file: "smart-ig/AGENTS.md", names: 2 },
  { file: "smart-base/smart-base.json", names: 2 },
  { file: "smart-base/README.md", names: 2 },
  { file: "smart-base/AGENTS.md", names: 2 },
  { file: "smart-base/tools/index.ts", names: 2 },
  { file: "fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md", names: 2 },
  { file: "fhir-harness/scripts/ingest-ig-chrome.ts", names: 2 },
  { file: "fhir-harness/scripts/gen-ig-pages.ts", names: 3 },
  { file: "cat-harness/docs/processes/index.md", names: 2 },
  { file: "smart-ig/smart-ig.json", names: 2 },
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

/** A `PENDING` row: a file with no single destination, and how many it names. */
export interface PendingEntry {
  file: string;
  names: number;
}

/**
 * The DETERMINATIONS this axis has reached — everything `--check` grades.
 *
 * Every field here moves when a RULING moves, never when somebody writes a
 * paragraph: a file acquires or loses a second destination, an entry stops
 * qualifying, an instance starts or stops declaring `needs`. That is the
 * property that makes grading them worth doing, and it is the property the
 * verdict counts do not have.
 */
export interface DirectionStates {
  /** The `PENDING` list as the source declares it. Membership is the ruling. */
  pendingHeld: PendingEntry[];
  /** Entries that no longer qualify — the half that makes `PENDING` honest. */
  pendingStale: { file: string; why: string }[];
  /** Files naming several instances above them that nobody has listed. This is what exits 1. */
  multiDestinationUnlisted: { file: string; names: number }[];
  /** Instances that declare no `needs`, so nothing about their layer is known. */
  undeclaredInstances: string[];
  /**
   * A.10 (owner, Q-B 2026-10-01): EVERY file holding a wrong-direction
   * reference, single- and multi-destination alike — one entry per file and
   * per instance above it that the file names.
   *
   * Per (file, target) rather than per file, so that a file already in the
   * baseline which starts naming a FURTHER instance above it is a new entry
   * too; a count per file could not see a file trading one target for
   * another. Graded under `--check` as NEW-against-the-baseline only: the
   * backlog is inherited, a new pair fails, a fixed pair is resolved.
   */
  wrongDirection: { file: string; target: string }[];
}

/**
 * Reduce a scan to the four determinations, with no filesystem and no printing.
 *
 * Pure and exported so a test can exercise it on a three-file synthetic tree.
 * The real corpus is deliberately out of reach of this suite: a prior session's
 * tests walked it and pushed a sibling past its 5 s budget.
 */
export function directionStates(
  report: ReferenceReport,
  pending: readonly PendingEntry[],
): DirectionStates {
  const wrong = report.classified.filter((c) => c.verdict.verdict === "wrong-direction");
  const byFile = new Map<string, Set<string>>();
  for (const c of wrong) {
    byFile.set(c.occurrence.file, new Set([...(byFile.get(c.occurrence.file) ?? []), c.occurrence.to]));
  }
  const listed = new Set(pending.map((p) => p.file));
  const pendingStale = [
    ...pending
      .filter((p) => !byFile.has(p.file))
      .map((p) => ({ file: p.file, why: "no wrong-direction reference left" })),
    ...pending
      .filter((p) => (byFile.get(p.file)?.size ?? 0) === 1)
      .map((p) => ({ file: p.file, why: "now names ONE instance, so it has a destination and is not pending" })),
  ].sort((a, b) => a.file.localeCompare(b.file));
  const multiDestinationUnlisted = [...byFile]
    .filter(([f, to]) => to.size > 1 && !listed.has(f))
    .map(([file, to]) => ({ file, names: to.size }))
    .sort((a, b) => a.file.localeCompare(b.file));
  return {
    pendingHeld: [...pending].sort((a, b) => a.file.localeCompare(b.file)),
    pendingStale,
    multiDestinationUnlisted,
    undeclaredInstances: [...report.undeclared].sort(),
    wrongDirection: [...byFile]
      .flatMap(([file, to]) => [...to].map((target) => ({ file, target })))
      .sort((a, b) => a.file.localeCompare(b.file) || a.target.localeCompare(b.target)),
  };
}

/**
 * The verdict counts — this axis's ANSWER, recorded but never graded.
 *
 * Only verdicts. `skippedMachineWritten` and `skippedGeneratorWritten` are
 * counts of FILES and stay in the printed report, for the reason the module
 * docblock gives: a file census says nothing about direction and moves on any
 * commit that adds a page.
 *
 * `pendingOccurrences` is a count of OCCURRENCES held by the `PENDING` list,
 * which is a verdict count about a ruling rather than a census of the tree, so
 * it belongs with these. Its membership — the part that is a decision — is in
 * {@link DirectionStates} and IS graded.
 */
export function directionCensus(
  report: ReferenceReport,
  states: DirectionStates,
): Record<string, number> {
  const n = (v: ReferenceVerdict["verdict"]) => report.classified.filter((c) => c.verdict.verdict === v).length;
  const wrong = report.classified.filter((c) => c.verdict.verdict === "wrong-direction");
  const held = new Set(states.pendingHeld.map((p) => p.file));
  return {
    instances: report.instances,
    occurrences: report.classified.length,
    allowed: n("allowed"),
    wrongDirection: wrong.length,
    wrongDirectionFiles: new Set(wrong.map((c) => c.occurrence.file)).size,
    exempt: n("exempt"),
    namesRepository: n("names-repository"),
    undetermined: n("undetermined"),
    pendingFiles: states.pendingHeld.length,
    pendingOccurrences: wrong.filter((c) => held.has(c.occurrence.file)).length,
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
  pending: readonly PendingEntry[];
  exemptionsDeclared: number;
  script?: string;
  scriptAbsPath?: string;
  now?: Date;
}): QaResult {
  const states = directionStates(args.report, args.pending);
  const census = directionCensus(args.report, states);
  const script = args.script ?? join("cat-harness", "scripts", "check-reference-direction.ts");
  return buildQaResult({
    script,
    scriptAbsPath: args.scriptAbsPath ?? join(import.meta.dir, "check-reference-direction.ts"),
    subject: { kind: "reference-direction", id: "instances" },
    families: {
      "multi-destination-unlisted": {
        summary:
          "A file holding a wrong-direction reference to MORE THAN ONE instance above it, which " +
          "`PENDING` does not list. `names > 1` is the whole membership rule, so an unlisted one " +
          "is an unrecorded question rather than a finding somebody can act on: \"move it up\" has " +
          "no single destination. This is the set the script exits 1 on, and recording it is not " +
          "resolving it — whether these join `PENDING` or are ruled on is issue #1219's question.",
        entries: states.multiDestinationUnlisted,
      },
      "pending-stale": {
        summary:
          "A `PENDING` entry that no longer qualifies — either no wrong-direction reference is left " +
          "in the file, or it now names exactly one instance and so HAS a destination. The set is " +
          "compared both ways on purpose: a list that only grows stops meaning anything.",
        entries: states.pendingStale,
      },
      "pending-held": {
        summary:
          "The files held pending a ruling, as the source declares them. Not findings: the RULING, " +
          "committed, so a reader with only this file can tell a question nobody has answered from " +
          "an axis nobody has run. Membership moves only when somebody edits the list, which is why " +
          "it is graded while the occurrence count it holds is not.",
        entries: states.pendingHeld,
      },
      "wrong-direction": {
        summary:
          "A.10 (owner, Q-B 2026-10-01): every file holding a wrong-direction reference — naming ONE " +
          "instance above it or several — one entry per file and per instance it names. The backlog, " +
          "recorded so that `--check` can tell an inherited pair from a NEW one: a file newly naming " +
          "an instance above it, single destination or not, fails; one that stops is resolved. The " +
          "fix is to REWORD in place (Q1), not to move the file.",
        entries: states.wrongDirection,
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
          `${states.pendingHeld.length} file(s) held pending; ${args.exemptionsDeclared} exemption(s) declared, each with a stated reason.`,
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
  const p = qaResultPath(instanceRoot, SIDECAR_STEM);
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

const GATE = "check:reference-direction";

/**
 * The families `--check` fails on when an entry is NEW against the baseline.
 * Exported so the tests judge with the gate's own list, not a copy of it.
 */
// `multi-destination-unlisted` is RECORDED and no longer in this list:
// A.10's `wrong-direction` subsumes it. A file newly naming several
// instances above it newly holds at least one (file, instance) pair, and
// that pair is what fails, whatever PENDING says — the ruling (Q1:
// reword in place) retired "list it pending" as the answer to a new one.
// Grading both would fail one defect twice, and would fail a PR on files
// a STALE baseline never recorded: measured on this change, `main`'s
// entry predated seven multi-destination files already on `main`.
export const CHECK_FAIL_ON_NEW = ["wrong-direction", "pending-stale", "instances-undeclared"] as const;

function main(): number {
  const args = process.argv.slice(2);
  // `--check` reads and compares; it never writes. Bean `ymsu` — a gate that
  // repairs the tree the rest of the run is judging makes a later gate's
  // verdict meaningless, and this repository has two of those already.
  const check = args.includes("--check");
  if (check) {
    const usage = judgeUsage(GATE, args, ["--against", "--findings", "--undetermined", "--strict"]);
    if (usage !== undefined) return usage;
  }
  const { against, exit: badRef } = againstOrUsage(GATE, args);
  if (badRef !== undefined) return badRef;
  const report = analyse();

  if (report.instances === 0) {
    console.error("check:reference-direction: found 0 declared instances — wrong root, or the tree moved.");
    return 2;
  }

  const of = (v: ReferenceVerdict["verdict"]) => report.classified.filter((c) => c.verdict.verdict === v);
  const wrong = of("wrong-direction");
  const undet = of("undetermined");
  const exempt = of("exempt");
  const namesRepo = of("names-repository");
  const states = directionStates(report, PENDING);

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
  // reader's charity — `zlmp`'s tool says the same sentence about its own
  // unjudged edges, and that sentence is the reason its 43 → 49 is legible.
  // Still printed, and still in these words, for as long as ANY occurrence is
  // undetermined. Narrowing the repository-name case from a blanket to the
  // occurrences that really are ambiguous shrank this bucket; it did not
  // retire it, and a reader who stops seeing the sentence would reasonably
  // conclude that it had.
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

  // PENDING is checked BOTH ways, which is the half that makes it honest.
  const heldFiles = new Set(states.pendingHeld.map((p) => p.file));
  const held = wrong.filter((c) => heldFiles.has(c.occurrence.file));
  console.log(
    `\n  of the wrong-direction count, ${held.length} occurrence(s) in ${PENDING.length} file(s) are PENDING —` +
      ` each names more than one instance above it, so there is no single place to move it to (issue #1219)`,
  );

  if (states.pendingStale.length > 0) {
    console.error(`\n✗ ${states.pendingStale.length} PENDING entr(y/ies) no longer qualify — delete them:`);
    for (const p of states.pendingStale) console.error(`    ${p.file} — ${p.why}`);
  }
  if (states.multiDestinationUnlisted.length > 0) {
    console.error(`\n✗ ${states.multiDestinationUnlisted.length} file(s) name several instances above them and are not in PENDING:`);
    for (const p of states.multiDestinationUnlisted) console.error(`    ${p.file} — names ${p.names}`);
  }

  // The sidecar is built from what was just measured, and written — or, under
  // `--check`, compared and left alone. It happens AFTER the report and BEFORE
  // the exits, so the states that make this exit 1 are RECORDED rather than
  // suppressed: a run that refuses still says, in a committed file, what it
  // refused over.
  const fresh = buildDirectionResult({
    report,
    pending: PENDING,
    exemptionsDeclared: EXEMPTIONS_DECLARED,
    script: relative(REPO_ROOT, join(INSTANCE_ROOT, "scripts", "check-reference-direction.ts")),
    scriptAbsPath: join(INSTANCE_ROOT, "scripts", "check-reference-direction.ts"),
  });
  const where = relative(REPO_ROOT, qaResultPath(INSTANCE_ROOT, SIDECAR_STEM));
  if (!check) writeQaResult(INSTANCE_ROOT, SIDECAR_STEM, fresh);
  // The message names WHAT was compared. A `--check` that passed silently
  // would be read as a guarantee about the counts, which it is not and by
  // design cannot be.
  console.log(
    `\n  sidecar: ${where}` +
      `\n    graded — every (file, target) wrong-direction pair (A.10), the PENDING entries that` +
      ` no longer qualify, the instances with no \`needs\`; the unlisted multi-destination files are recorded` +
      `\n    recorded, NOT graded — the verdict counts, which move whenever the corpus does`,
  );
  // `--check` answers ONE question, and since bean `0dav` it is: did THIS
  // change add a graded state? — a file newly naming an instance above it
  // (A.10, single or multi destination), a `PENDING` entry newly no longer qualifying, an
  // instance newly declaring no `needs`. Against a baseline: the committed
  // working copy until QA leaves `main`, `--against <ref>` (a `qa-reports`
  // ref) after. It used to be "is the committed ruling what this run
  // computed", and that question has no subject once nothing is committed —
  // a baseline that is not there is UNKNOWN, reported and not gated
  // (proposal §2.3).
  //
  // `pending-held` is graded in the record but not here: membership moves only
  // when somebody edits `PENDING`, and that edit is in the diff under review.
  //
  // It still does not fail on the INHERITED backlog, for `audit-coverage --check`'s
  // reason: a gate that refused every push until somebody drained a backlog is
  // a gate switched off within a week. The backlog exit below is the PLAIN
  // form's, and the `✗` lines above print either way, so a `--check` that
  // returns 0 cannot be mistaken for a clean axis.
  if (check) {
    if (states.pendingStale.length > 0 || states.multiDestinationUnlisted.length > 0) {
      console.log(
        `\n  (the ${states.pendingStale.length + states.multiDestinationUnlisted.length} state(s) above are RECORDED, not graded here —` +
          ` \`bun run check:reference-direction\` is the form that exits 1 on them)`,
      );
    }
    console.log("");
    return judgeQaResult({
      gate: `${GATE}:check`,
      fresh,
      failOnNew: [...CHECK_FAIL_ON_NEW],
      baseline: { root: INSTANCE_ROOT, stem: SIDECAR_STEM, writer: GATE, against },
    }).exit;
  }
  // Unchanged, and deliberately so: recording a state is not resolving it.
  if (states.pendingStale.length > 0 || states.multiDestinationUnlisted.length > 0) return 1;

  if (args.includes("--strict") && wrong.length > 0) {
    console.error(`\n✗ ${wrong.length} wrong-direction reference(s). A lower instance may not name one that depends on it.`);
    return 1;
  }
  return 0;
}

if (import.meta.main) process.exit(main());
