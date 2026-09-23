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
  defaultGraphKinds,
  findDeclarationFile,
  instanceRootsIn,
  resolveGraphKind,
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
 * NOT a complete answer, and the gap is named rather than papered over:
 * three projections under a `docs` directory (`assets/schemas/index.json`,
 * `assets/beans/index.json`, `assets/voices/index.json`, 440 occurrences
 * measured 2026-09-23) are generated but sit in a `content` graph and carry
 * no self-declaration, so they are reported as findings. The fix is one line
 * in each generator — emit `"_generated"`, as `sync-docs-harness.ts` already
 * does for `docs/_data/harness.json` — not a path rule here.
 */
const MACHINE_WRITTEN = new Set(["state", "derived"]);

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
 * Known-unfixed wrong-direction references, as `<file>: <count>`.
 *
 * Exactly `iwtn`'s `PENDING`, and for the same reason: a leak nobody has
 * ruled on yet is made VISIBLE rather than silent. It is compared as a SET,
 * so a new leak fails and so does a fixed one — a `PENDING` that only ever
 * grows is a list that stops meaning anything.
 *
 * Populated by `--emit-pending` once the owner has ruled on the classes in
 * the report. Empty is honest today: nothing has been ruled, so nothing is
 * pending rather than everything being quietly excused.
 */
const PENDING: readonly string[] = [];

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
  return kinds.every((k) => {
    const holds = BASE_GRAPH_KINDS[resolveGraphKind(k, defaultGraphKinds).kind]?.holds;
    return holds !== undefined && MACHINE_WRITTEN.has(holds);
  });
}

function instances(): Instance[] {
  return instanceRootsIn(REPO_ROOT).map((root) => {
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
  /** Instances whose `needs` nobody has declared. Reported, never assumed. */
  undeclared: string[];
}

export function analyse(root = REPO_ROOT): ReferenceReport {
  const all = instances().filter((i) => i.name !== "");
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
  for (const abs of filesUnder(root)) {
    if (isMachineWritten(abs)) {
      skippedMachineWritten++;
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
  console.log(`\n  ${report.skippedMachineWritten} file(s) not read: their directory DECLARES a graph a process writes (holds state/derived).`);

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

  const found = [...new Set(wrong.map((c) => c.occurrence.file))].sort();
  const stale = PENDING.filter((p) => !found.includes(p));
  if (stale.length > 0) {
    console.error(`\n✗ ${stale.length} PENDING entr(y/ies) no longer leak — delete them, a PENDING that only grows stops meaning anything:`);
    for (const s of stale) console.error(`    ${s}`);
    process.exit(1);
  }

  if (args.includes("--strict") && wrong.length > 0) {
    console.error(`\n✗ ${wrong.length} wrong-direction reference(s). A lower instance may not name one that depends on it.`);
    process.exit(1);
  }
}

if (import.meta.main) main();
