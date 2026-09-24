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
 * Usage:
 *   bun run cat-harness/scripts/check-reference-direction.ts            # summary
 *   … --findings           # every wrong-direction occurrence
 *   … --undetermined       # what it declined to judge, and why
 *   … --strict             # exit 1 on any wrong-direction occurrence
 *
 * @module scripts/check-reference-direction
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import {
  BASE_GRAPH_KINDS,
  findDeclarationFile,
  instanceRootsIn,
  isDerivedGraph,
  isStateGraph,
} from "../schemas/cat-harness.js";
import { ancestorsOf, flattenDependencies } from "../schemas/dependency-order.js";
import { allowedFromNeeds, type LayerRule } from "../schemas/layer-direction.js";
import {
  classifyReference,
  occurrencesOf,
  type Occurrence,
  type ReferenceExemption,
  type ReferenceVerdict,
} from "../schemas/reference-direction.js";

const REPO_ROOT = join(import.meta.dir, "..", "..");

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
 * read from the same declarations as the first — `nodeSchemas[…].writtenBy`
 * in the graph-kind registry, which already names the script that produces
 * each family. Nine families across `docs`, `qa` and `uploads`.
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
      .filter(([, d]) => (d as { writtenBy?: string }).writtenBy !== undefined)
      .map(([schema]) => schema),
  ),
);

/**
 * Does the file SAY a generator wrote it, in its own first lines?
 *
 * Two conventions already in the corpus, both self-declarations rather than
 * inferences from a path:
 *
 *  - a top-level `"_generated"` key in JSON, which `sync-docs-harness.ts`
 *    has emitted into `docs/_data/harness.json` all along (84 occurrences);
 *  - a `generated:` front-matter key in Markdown, which `gen-skill-docs.ts`
 *    and `gen-schema-docs.ts` now emit into the `docs/reference/**` mirrors
 *    (145 occurrences across 31 pages).
 *
 * The mirrors are the clearest case for reading a declaration rather than a
 * path: each is a COPY of a skill that sits one directory away, so a finding
 * on one is the same finding twice and its fix is in neither — it is in the
 * source skill. AGENTS.md has forbidden hand-editing them since before this
 * check existed; the files simply never said so themselves.
 *
 * Front matter only, and only the first lines: a page that DISCUSSES
 * generation must not be able to exempt itself by mentioning the word.
 */
function declaresGenerated(abs: string): boolean {
  let head: string;
  try {
    head = readFileSync(abs, "utf-8").slice(0, 2000);
  } catch {
    return false;
  }
  if (/^\s*\{\s*"_generated"\s*:/.test(head)) return true;
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(head);
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
 *  - **Specifications about the layering** — `instance-rules.ts` names the
 *    repos it partitions into; `smart-stack-layering.md` names all eight
 *    layers because it is the document that DEFINES the stack. Move it up
 *    to any one layer and it can no longer describe the other seven.
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
 */
const PENDING: readonly { file: string; names: number }[] = [
  // THIS FILE, and it is listed rather than exempted on purpose.
  //
  // A findings list names the files it holds findings about, and the name of
  // a file under `smart-base/` contains `smart-base` — so this module cannot
  // record a finding without matching itself, and its rationale above cannot
  // explain the classes without naming them. A narrow exemption was written
  // first and then deleted: an exemption carved by the checker, for the
  // checker, is the one carve nobody else can audit, and the list it would
  // have kept it off is the list that exists to be audited. It qualifies on
  // exactly the published rule — it names more than one instance above it
  // and has no single destination — so it goes where everything else that
  // qualifies goes.
  { file: "cat-harness/scripts/check-reference-direction.ts", names: 4 },
  { file: "cat-harness/skills/authoring-who-smart-guidelines/smart-stack-layering.md", names: 8 },
  { file: "cat-harness/skills/authoring-who-smart-guidelines/toolchain-ownership.md", names: 4 },
  { file: "cat-harness/docs/cat-harness/published-graphs.md", names: 4 },
  { file: "cat-harness/cat-harness.json", names: 2 },
  { file: "cat-harness/schemas/avatars.ts", names: 6 },
  { file: "cat-harness/scripts/partition/instance-rules.ts", names: 2 },
  { file: "cat-harness/skills/authoring-who-smart-guidelines/smart-base-tools.md", names: 2 },
  { file: "cat-harness/skills/authoring-who-smart-guidelines/ig-artifact-ingestion.md", names: 2 },
  { file: "cat-harness/scripts/ingest-ig-artifacts.ts", names: 3 },
  { file: "cat-harness/schemas/ig-chrome.ts", names: 6 },
  { file: "cat-harness/schemas/cat-harness.ts", names: 2 },
  { file: "cat-harness/skills/authoring-who-smart-guidelines/dak-postprocessing.md", names: 5 },
  { file: "cat-harness/skills/folio-core/directory-conventions.md", names: 2 },
  // declared-path-literal: a FINDING's location, recorded repo-root-relative because that is
  // what `analyse` reports. No declaration can answer where a finding is, and this one does not
  // resolve from THIS instance's root because the file is in another instance — which is the
  // very fact the entry records.
  { file: "folio-assistant-core/schemas/fhir-artifact-index.ts", names: 2 },
  { file: "fhir-harness/fhir-harness.json", names: 6 },
  { file: "cat-harness/schemas/jsonld.ts", names: 2 },
  { file: "fhir-harness/AGENTS.md", names: 4 },
  { file: "cat-harness/skills/authoring-who-smart-guidelines/dak-preprocessing.md", names: 3 },
  { file: "cat-harness/skills/folio-core/kg-export.md", names: 2 },
  { file: "cat-harness/schemas/graph-kind-registry.ts", names: 2 },
  { file: "cat-harness/scripts/dak-pdf.ts", names: 2 },
  { file: "cat-harness/scripts/external-schemas.ts", names: 3 },
  { file: "cat-harness/docs/methodologies/index.md", names: 2 },
  { file: "fhir-harness/skills/fhir-ig-base/ig-publisher-fork.md", names: 2 },
  { file: "cat-harness/schemas/dak.ts", names: 2 },
  { file: "cat-harness/schemas/namespaces.ts", names: 2 },
  { file: "cat-harness/scripts/kg-export.ts", names: 2 },
  { file: "cat-harness/scripts/layout-norms-baseline.json", names: 2 },
  { file: "cat-harness/tools/discover.ts", names: 2 },
  { file: "cat-harness/docs/ig-publisher.md", names: 3 },
  { file: "cat-harness/skills/folio-core/harness-tiles.md", names: 2 },
  { file: "cat-harness/schemas/harness-config.ts", names: 3 },
  { file: "cat-harness/content/docs/ig-publisher/what-it-cannot-be-asked-for.md", names: 2 },
  { file: "cat-harness/scripts/check-context-emission.ts", names: 3 },
  { file: "cat-harness/scripts/check-artifact-index.ts", names: 2 },
  { file: "cat-harness/scripts/harness-schema-export.ts", names: 2 },
  { file: "cat-harness/docs/wireframes/voices/intent.md", names: 2 },
  { file: "smart-ig/README.md", names: 2 },
  { file: "smart-ig/AGENTS.md", names: 2 },
  { file: "smart-base/smart-base.json", names: 2 },
  { file: "smart-base/README.md", names: 2 },
  { file: "smart-base/AGENTS.md", names: 2 },
  { file: "smart-base/tools/index.ts", names: 2 },
  { file: "fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md", names: 2 },
  { file: "cat-harness/content/docs/publication-workflow/every-workflow-in-the-repo.md", names: 2 },
  { file: "cat-harness/scripts/ingest-ig-chrome.ts", names: 2 },
  { file: "cat-harness/scripts/gen-object-model-uml.ts", names: 2 },
  { file: "cat-harness/docs/processes/index.md", names: 2 },
  { file: "cat-harness/docs/publication-workflow.md", names: 2 },
  { file: "smart-ig/smart-ig.json", names: 2 },
];

// ── Discovery ───────────────────────────────────────────────────

interface Instance {
  root: string;
  name: string;
  needs: readonly string[] | undefined;
  /** Absolute paths this instance declares as holding machine-written graphs. */
  machineWritten: string[];
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
      directories?: { path?: string; graphKinds?: string[] }[];
    };
    const machineWritten = (decl.directories ?? [])
      .filter((d) => d.path !== undefined && declaresMachineWritten(d.graphKinds))
      .map((d) => join(root, d.path!));
    // A declaration with no `name` cannot be a reference TARGET (nothing to
    // match) and cannot own files by name either, so it is skipped rather
    // than given a fallback that would invent an instance.
    return { root, name: decl.name ?? "", needs: decl.needs, machineWritten };
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
  const sharesNameWithRepository = (name: string): boolean => byName.get(name)?.root === root;

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
    const file = relative(root, abs);
    for (const to of targets) {
      for (const hit of occurrencesOf(text, to)) {
        const occurrence: Occurrence = { file, line: hit.line, text: hit.text.trim(), from, to };
        classified.push({ occurrence, verdict: classifyReference(occurrence, rule, sharesNameWithRepository, EXEMPTIONS) });
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

// ── Reporting ───────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const report = analyse();

  if (report.instances === 0) {
    console.error("check:reference-direction: found 0 declared instances — wrong root, or the tree moved.");
    process.exit(2);
  }

  const of = (v: ReferenceVerdict["verdict"]) => report.classified.filter((c) => c.verdict.verdict === v);
  const wrong = of("wrong-direction");
  const undet = of("undetermined");
  const exempt = of("exempt");

  console.log(`Reference direction — ${report.instances} instances, ${report.classified.length} name occurrences pointing up the dependency arrow\n`);
  console.log(`  wrong-direction   ${String(wrong.length).padStart(5)}   in ${new Set(wrong.map((c) => c.occurrence.file)).size} files`);
  console.log(`  exempt            ${String(exempt.length).padStart(5)}   ${EXEMPTIONS.length} exemptions, each with a stated reason`);
  console.log(`  undetermined      ${String(undet.length).padStart(5)}   declined to judge — NOT clean`);
  console.log(`\n  Not read, both answered from a declaration rather than a path:`);
  console.log(`    ${report.skippedMachineWritten} file(s) — their DIRECTORY declares a graph a process writes (holds state/derived)`);
  console.log(`    ${report.skippedGeneratorWritten} file(s) — the FILE declares itself generator output (\`$schema\` writtenBy, \`_generated\`, or \`generated:\` front matter)`);

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
  console.log("\nUndetermined is not a pass. Two things land there:");
  if (report.undeclared.length > 0) {
    console.log(`  · ${report.undeclared.length} instance(s) declare no \`needs\`, so nothing about their layer is known: ${report.undeclared.join(", ")}`);
  }
  const rootNamed = new Set(undet.map((c) => c.occurrence.to));
  if (rootNamed.size > 0) {
    console.log(`  · the target's name is also the repository's name (${[...rootNamed].join(", ")}), so a name match cannot tell the instance from the repository`);
  }
  if (args.includes("--undetermined")) {
    for (const c of undet.slice(0, 200)) console.log(`    ${c.occurrence.file}:${c.occurrence.line}  ${c.verdict.basis}`);
  }

  // PENDING is checked BOTH ways, which is the half that makes it honest.
  const byFile = new Map<string, Set<string>>();
  for (const c of wrong) {
    byFile.set(c.occurrence.file, new Set([...(byFile.get(c.occurrence.file) ?? []), c.occurrence.to]));
  }
  const pendingFiles = new Set(PENDING.map((p) => p.file));
  const held = wrong.filter((c) => pendingFiles.has(c.occurrence.file));
  console.log(
    `\n  of the wrong-direction count, ${held.length} occurrence(s) in ${PENDING.length} file(s) are PENDING —` +
      ` each names more than one instance above it, so there is no single place to move it to (issue #1219)`,
  );

  const gone = PENDING.filter((p) => !byFile.has(p.file));
  const settled = PENDING.filter((p) => (byFile.get(p.file)?.size ?? 0) === 1);
  if (gone.length > 0 || settled.length > 0) {
    console.error(`\n✗ ${gone.length + settled.length} PENDING entr(y/ies) no longer qualify — delete them:`);
    for (const p of gone) console.error(`    ${p.file} — no wrong-direction reference left`);
    for (const p of settled) console.error(`    ${p.file} — now names ONE instance, so it has a destination and is not pending`);
    process.exit(1);
  }
  const missing = [...byFile].filter(([f, to]) => to.size > 1 && !pendingFiles.has(f));
  if (missing.length > 0) {
    console.error(`\n✗ ${missing.length} file(s) name several instances above them and are not in PENDING:`);
    for (const [f, to] of missing) console.error(`    ${f} — names ${to.size}`);
    process.exit(1);
  }

  if (args.includes("--strict") && wrong.length > 0) {
    console.error(`\n✗ ${wrong.length} wrong-direction reference(s). A lower instance may not name one that depends on it.`);
    process.exit(1);
  }
}

if (import.meta.main) main();
