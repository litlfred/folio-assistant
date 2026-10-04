#!/usr/bin/env bun
/**
 * Every graph kind that declares a validator — does it actually load?
 *
 * Bean `folio-assistant-i31r`. Two failure modes, and only one of them fails
 * the build:
 *
 * 1. **A declared validator that does not resolve** — a wrong path, a missing
 *    export, or a module that exports an interface rather than a Zod schema.
 *    That is a defect and it fails. It is also not hypothetical: the three
 *    `schema` paths on these kinds silently became instance-relative when
 *    `#437` moved the instance under `cat-harness/`, and nothing noticed,
 *    because nothing read them.
 * 2. **A kind with no validator at all** — reported, never failed. 13 of 16
 *    base kinds are in that state today and one is `qa`, the largest
 *    generated graph here. Failing on it would make the check unrunnable;
 *    hiding it would report a clean sweep over most of the corpus.
 *
 * `--require-all` turns state 2 into a failure, for the day the gap is meant
 * to be closed.
 *
 * @module folio-assistant/scripts/check-kind-validators
 * @covers validators, block-kinds, qa-checkers, pipeline-plugins, computed — every
 *   `qa-checkers` and `pipeline-plugins` node is loaded through the platform root's dependency
 *   tree and must resolve to the code its table ref names; every discovered block kind is checked against
 *   the kinds BlockSchema types, both directions; every `folio-validator/v1` node is parsed, resolved and
 *   joined onto a kind (one naming no kind is a finding), which is fixed coverage of the
 *   `validators` graph; the KINDS it sweeps are whichever declare `nodeSchemas`, so that half
 *   is computed and a literal list would go stale silently
 */

// The REGISTRY, not BASE_GRAPH_KINDS: since bean dmx1 a harness DECLARES its
// kinds in a kinds/ graph, and a sweep over the code list alone stopped checking
// every kind that moved (fhir-harness's, cat-openapi's, core's). Measured
// 2026-10-04 while building riit; core's code-registered kinds are imported too.
import { BASE_GRAPH_KINDS, declaredKindNodes, defaultGraphKinds } from "../../cat-harness/schemas/graph-kind-registry.js";
import { FOLIO_GRAPH_KIND } from "../../cat-harness/schemas/folio-graph-kind.js";
import { GLOSSARY_GRAPH_KIND } from "../../cat-harness/schemas/glossary-graph-kind.js";
import { BLOCK_KINDS } from "../../cat-harness/schemas/block-kinds.js";
import { typedBlockKinds } from "../../cat-harness/schemas/constraints.js";
import { readdirSync, readFileSync, statSync } from "node:fs";

import { gitCorpus } from "../../cat-harness/schemas/git-corpus.ts";
import { join, relative } from "node:path";

import { directoriesForGraph, instanceRootsIn, readDeclaration } from "../../cat-harness/schemas/cat-harness.js";
import { resolveKindValidator, resolveNodeSchemas, stripAnnotations } from "../../cat-harness/schemas/kind-validator.js";
import { HARNESS_ROOT, REPO_ROOT } from "./lib/roots.ts";
import { ContributionRegistry } from "../../cat-harness/schemas/contributions.js";
import { loadContributionsSync } from "../../cat-harness/schemas/harness-config.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
const instanceRoot = HARNESS_ROOT;

export interface ValidatorSweep {
  resolved: string[];
  /**
   * A kind that has DECIDED a runtime validator cannot apply, with its reason.
   *
   * Bean `rj0n`. These were counted as `undeclared` until 2026-09-24, which made
   * the gap read as seven items over a real backlog of zero and made
   * `--require-all` a flag that could never pass. Kept as its own list rather
   * than folded into `resolved`, because "a schema parses these nodes" and "no
   * schema can" are different facts and a reader needs both.
   */
  notApplicable: { kind: string; reason: string }[];
  /** Has NOT said — the only state `--require-all` fails on. */
  undeclared: string[];
  unresolvable: { kind: string; reason: string }[];
  /**
   * A kind claiming BOTH a runnable schema and that none can exist. Reported
   * rather than resolved by precedence: picking a winner would let a
   * contradiction ship silently, and there is no reading under which both are
   * true.
   */
  contradictory: string[];
}

/** Code in another repository: it cannot declare a validator node in this one. */
export const FOREIGN_REPOSITORY_PREFIXES: readonly string[] = ["bootstrap-tools:", "bootstrap:"];

/**
 * Every validator string a kind's AUTHORED definition still carries: the code
 * list, the kinds/ nodes and core's two code-registered kinds, read BEFORE the
 * registry joins validator nodes on, which is what tells a string an author
 * wrote from one the registry filled in.
 */
export function authoredValidatorStrings(): { kind: string; family?: string; ref: string }[] {
  const out: { kind: string; family?: string; ref: string }[] = [];
  const add = (kind: string, d: { validator?: string; nodeSchemas?: Readonly<Record<string, unknown>> }) => {
    if (d.validator) out.push({ kind, ref: d.validator });
    for (const [family, e] of Object.entries(d.nodeSchemas ?? {})) {
      const v = (e as { validator?: string }).validator;
      if (v) out.push({ kind, family, ref: v });
    }
  };
  for (const [k, d] of Object.entries(BASE_GRAPH_KINDS)) add(k, d);
  add("folio", FOLIO_GRAPH_KIND);
  add("glossary", GLOSSARY_GRAPH_KIND);
  for (const { node } of declaredKindNodes(join(import.meta.dir, "..", ".."))) add(node.kind, node);
  return out;
}

export async function sweep(root: string): Promise<ValidatorSweep> {
  const out: ValidatorSweep = { resolved: [], notApplicable: [], undeclared: [], unresolvable: [], contradictory: [] };
  for (const kind of defaultGraphKinds.names()) {
    const def = defaultGraphKinds.get(kind);
    const na = def?.validatorNotApplicable;
    // The contradiction first, because everything below would otherwise pick a
    // winner between two claims that cannot both hold.
    if (na && (def?.validator || def?.nodeSchemas)) {
      out.contradictory.push(kind);
      continue;
    }
    const r = await resolveKindValidator(kind, root);
    if (r.state === "resolved") out.resolved.push(kind);
    // A kind that names its `$schema` families is checked per family above,
    // so it is not "undeclared" merely for having no kind-level validator.
    else if (r.state === "undeclared" && def?.nodeSchemas) out.resolved.push(`${kind} (per $schema family)`);
    else if (r.state === "undeclared" && na) out.notApplicable.push({ kind, reason: na });
    else if (r.state === "undeclared") out.undeclared.push(kind);
    else out.unresolvable.push({ kind: r.kind, reason: r.reason });
  }
  return out;
}

/** What a per-family sweep found for one kind that declares `nodeSchemas`. */
export interface FamilySweep {
  kind: string;
  /** Tag → [nodes, nodes that parsed] — parsed only for Zod families. */
  counts: Record<string, { nodes: number; checked: number; parsed: number; state: string }>;
  /** A tag on disk the map does not name — the map claimed completeness. */
  unmapped: { tag: string; example: string }[];
  /** A family whose reference does not resolve. */
  unresolvable: { tag: string; reason: string }[];
  /** A node that fails its family's Zod schema. */
  invalid: { file: string; issue: string }[];
  /** No instance declares a directory of this kind — nested, or not yet present. */
  noDirectory?: boolean;
  /** Directories of this kind stored on a branch FAMILY: by declaration not in the checkout (bean lehh). */
  onFamily?: number;
}

/**
 * The JSON nodes in {@link dir} — asked of git, not of the disk.
 *
 * Two defects, both hit on 2026-09-26 the moment a gate installed a
 * publishable package's devDependencies (bean `rsi6`):
 *
 * 1. **It swept `node_modules/`.** A declared directory containing an
 *    untracked subtree meant thousands of third-party `.json` files routed
 *    through this repository's `$schema` map — and a tag the map does not
 *    name is a FAILURE here, so every one of them would have been a finding.
 * 2. **A dangling symlink CRASHED it.** `statSync` on `node_modules/.bin/`
 *    threw `ENOENT` and took the whole sweep with it, so the check reported
 *    nothing at all rather than reporting what it could not read. A checker
 *    that dies is strictly worse than one that says "could not determine".
 *
 * `gitCorpus` fixes the first; `statSync` is now guarded for the second,
 * because a broken symlink is a fact about the tree and not a reason to stop.
 */
function jsonFiles(dir: string): string[] {
  const listed = gitCorpus(dir, ["*.json"]);
  if (listed !== undefined) return listed;

  // Fallback for a directory git cannot answer about — a temp fixture, or a
  // path outside any work tree. Looser than the git answer, so it can only
  // over-report.
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const p = join(dir, e);
    let isDir: boolean;
    try {
      isDir = statSync(p).isDirectory();
    } catch {
      return []; // dangling symlink, or a race: not readable is not a crash
    }
    return isDir ? jsonFiles(p) : p.endsWith(".json") ? [p] : [];
  });
}

/**
 * Bean `rdkm`: for every kind that declares `nodeSchemas`, read each JSON
 * node in its declared directories, route it by its `$schema` tag, and
 * validate it where the family has a Zod schema. A tag the map does not name
 * fails — declaring the map is the claim that it is complete.
 */
export async function sweepFamilies(root: string): Promise<FamilySweep[]> {
  const out: FamilySweep[] = [];
  for (const kind of defaultGraphKinds.names()) {
    const def = defaultGraphKinds.get(kind)!;
    if (!def.nodeSchemas) continue;
    const fams = await resolveNodeSchemas(kind, root);
    const byTag = new Map(fams.map((f) => [f.tag, f]));
    const s: FamilySweep = { kind, counts: {}, unmapped: [], unresolvable: [], invalid: [] };
    for (const f of fams) if (f.state === "unresolvable") s.unresolvable.push({ tag: f.tag, reason: f.reason });
    const dirs = new Set<string>();
    // A directory stored on a BRANCH FAMILY (bean lehh) holds its nodes on the
    // family's branches by declaration, never in the checkout: named, not swept.
    const onFamily = new Set<string>();
    for (const inst of instanceRootsIn(join(root, ".."))) {
      for (const e of readDeclaration(inst)?.directories ?? []) {
        const st = e.storage as { keyedBy?: string } | undefined;
        const src = e.source as { kind?: string } | undefined;
        if (e.graphKinds.includes(kind as never) && (st?.keyedBy === "family" || src?.kind === "family")) onFamily.add(join(inst, e.path).replace(/\/$/, ""));
      }
      for (const d of directoriesForGraph(inst, kind)) if (!onFamily.has(d.replace(/\/$/, ""))) dirs.add(d);
    }
    s.onFamily = onFamily.size;
    if (dirs.size === 0 && onFamily.size > 0) {
      out.push(s);
      continue;
    }
    if (dirs.size === 0) {
      s.noDirectory = true;
      out.push(s);
      continue;
    }
    for (const dir of dirs) {
      for (const file of jsonFiles(dir)) {
        let node: unknown;
        try {
          node = JSON.parse(readFileSync(file, "utf8"));
        } catch {
          continue; // not a node; a malformed file is another check's finding
        }
        const tag = (node as { $schema?: unknown } | null)?.$schema;
        if (typeof tag !== "string") continue;
        const fam = byTag.get(tag);
        const rel = relative(join(root, ".."), file);
        if (!fam) {
          if (!s.unmapped.some((u) => u.tag === tag)) s.unmapped.push({ tag, example: rel });
          continue;
        }
        const c = (s.counts[tag] ??= { nodes: 0, checked: 0, parsed: 0, state: fam.state });
        c.nodes++;
        if (fam.state !== "resolved") continue;
        c.checked++;
        const r = fam.schema.safeParse(stripAnnotations(node));
        if (r.success) c.parsed++;
        else s.invalid.push({ file: rel, issue: `${r.error.issues[0]?.path.join(".")}: ${r.error.issues[0]?.message}` });
      }
    }
    out.push(s);
  }
  return out;
}

async function main(): Promise<number> {
  const requireAll = process.argv.includes("--require-all");
  const families = await sweepFamilies(instanceRoot);
  let familyFail = false;
  for (const f of families) {
    const nodes = Object.values(f.counts).reduce((a, c) => a + c.nodes, 0);
    console.log(`${f.kind}: ${Object.keys(f.counts).length} $schema famil(ies) over ${nodes} node(s)`);
    for (const [tag, c] of Object.entries(f.counts)) {
      console.log(
        c.checked
          ? `  ✓ ${tag}: ${c.parsed}/${c.checked} parse`
          : c.state === "external"
              ? `  · ${tag}: ${c.nodes} node(s), an external specification — named, not run here`
              : `  · ${tag}: ${c.nodes} node(s), a TypeScript shape, not runnable — could not determine`,
      );
    }
    if (f.onFamily && Object.keys(f.counts).length === 0) {
      console.log(`  · ${f.onFamily} director(ies) on a branch FAMILY by declaration — the nodes are on the family's branches, not in this checkout, so not examined here`);
    } else if (f.noDirectory) {
      console.log(`  · no instance declares a ${f.kind} directory — nothing to route (a nested kind is reached through its parent)`);
    } else if (nodes === 0) {
      console.log(`  ✗ EXAMINED NOTHING — ${f.kind} declares nodeSchemas and no node was found`);
      familyFail = true;
    }
    for (const u of f.unmapped) console.log(`  ✗ unmapped family ${u.tag} (e.g. ${u.example})`);
    for (const u of f.unresolvable) console.log(`  ✗ ${u.tag}: ${u.reason}`);
    if (f.unmapped.length || f.unresolvable.length) familyFail = true;
    for (const i of f.invalid.slice(0, 10)) console.log(`  ✗ ${i.file} — ${i.issue}`);
    if (f.invalid.length) familyFail = true;
  }
  if (families.length) console.log("");
  const r = await sweep(instanceRoot);
  const total = r.resolved.length + r.notApplicable.length + r.undeclared.length + r.unresolvable.length + r.contradictory.length;

  if (total === 0) {
    // A sweep over no kinds has not passed. This repository has paid three
    // times for a check that ticked over an empty set.
    console.log("⚠ EXAMINED NOTHING — no graph kinds are registered");
    return 1;
  }

  console.log(
    `${total} graph kind(s): ${r.resolved.length} with a validator that loads, ` +
      `${r.notApplicable.length} where one cannot apply`,
  );
  for (const k of r.resolved) console.log(`  ✓ ${k}`);
  // Printed with the REASON, never as a bare count. A reader has to be able to
  // check the claim — the reason names a file format or an absent subject, so
  // "not applicable" cannot become the polite way to launder a real gap.
  for (const n of r.notApplicable) console.log(`  · ${n.kind} — no runtime validator applies: ${n.reason}`);

  if (r.contradictory.length > 0) {
    console.log(
      `\n✗ ${r.contradictory.length} kind(s) claim BOTH a runnable schema and that none can exist — ` +
        `there is no reading under which both hold: ${r.contradictory.join(", ")}`,
    );
    return 1;
  }

  // THE CLEAN BREAK (bean riit, step 1c): a kind's AUTHORED definition names
  // no validator code; a `folio-validator/v1` node names the kind instead. The
  // one exception is code in ANOTHER repository (a submodule such as
  // bootstrap-tools), which cannot declare a node here; it is named, not failed.
  const authored = authoredValidatorStrings();
  const foreign = authored.filter((a) => FOREIGN_REPOSITORY_PREFIXES.some((p) => a.ref.startsWith(p)));
  const inline = authored.filter((a) => !foreign.includes(a));
  for (const f of foreign) console.log(`  · ${f.kind}${f.family ? ` ${f.family}` : ""}: validator in another repository (${f.ref}), kept as a string until it declares a node`);
  if (inline.length > 0) {
    console.log(`\n✗ ${inline.length} validator(s) written into a kind's definition rather than declared as a validators/ node:`);
    for (const i of inline) console.log(`  ✗ ${i.kind}${i.family ? ` ${i.family}` : ""}: ${i.ref}`);
    return 1;
  }

  // A VALIDATOR NODE naming a kind no instance declares (bean riit): the
  // registry cannot join it to anything, so its code checks nothing. A node
  // naming an unlisted family already throws at load, with its path.
  const orphans = defaultGraphKinds.validatorNodeList().filter((v) => !defaultGraphKinds.has(v.node.validates.kind));
  if (orphans.length > 0) {
    console.log(`\n✗ ${orphans.length} validator node(s) name a graph kind no instance declares:`);
    for (const o of orphans) console.log(`  ✗ ${o.file}: validates kind "${o.node.validates.kind}"`);
    return 1;
  }

  // BLOCK KINDS (bean riit, step 2): discovered from `folio-block-kind/v1`
  // nodes, while the per-kind Zod schemas are code. A discovered kind the code
  // does not type has no schema to validate its blocks; a typed kind nobody
  // declares is invisible to every list read off the nodes.
  const discovered = new Set<string>(BLOCK_KINDS);
  const typed = new Set(typedBlockKinds());
  const untyped = [...discovered].filter((k) => !typed.has(k));
  const undiscovered = [...typed].filter((k) => !discovered.has(k));
  console.log(`\n${discovered.size} block kind(s) discovered from block-kinds/ nodes`);
  if (untyped.length || undiscovered.length) {
    for (const k of untyped) console.log(`  ✗ block kind "${k}" is declared by a node but no BlockSchema member types it`);
    for (const k of undiscovered) console.log(`  ✗ block kind "${k}" is typed by BlockSchema but no block-kinds/ node declares it`);
    return 1;
  }

  // CONTRIBUTION NODES (bean riit, step 3b): every QA checker and pipeline
  // plugin a harness declares as a node must resolve to the table entry its
  // ref names. The platform root's dependency tree holds every instance, so
  // loading its contributions loads every node; a node naming code that is
  // not there throws, with the node's path.
  if (REPO_ROOT === undefined) {
    // Standalone: no checkout holds the contributing instances, so nothing is
    // examined — said, never read as a pass.
    console.log("\n· contribution nodes not examined: standalone, no checkout holds the instances that declare them");
  } else {
    try {
      const registry = loadContributionsSync(REPO_ROOT, new ContributionRegistry());
      console.log(
        `\n${registry.contributedPipelinePlugins().length} pipeline plugin(s) and ` +
          `${registry.contributedQaCheckers().length} contributed QA checker(s) resolve to code`,
      );
    } catch (e) {
      console.log(`\n✗ a contribution node does not resolve: ${(e as Error).message}`);
      return 1;
    }
  }

  if (r.unresolvable.length > 0) {
    console.log(`\n✗ ${r.unresolvable.length} declare a validator that does not resolve:`);
    for (const u of r.unresolvable) console.log(`  ✗ ${u.kind}: ${u.reason}`);
    return 1;
  }

  const msg =
    `${r.undeclared.length} kind(s) have said NOTHING about a validator — a node of those kinds ` +
    `cannot be checked, and must be reported as "could not determine" rather than as valid. ` +
    `Give it a validator, or say in \`validatorNotApplicable\` why one cannot apply: ${r.undeclared.join(", ")}`;
  if (r.undeclared.length > 0) {
    if (requireAll) {
      console.log(`\n✗ ${msg}`);
      return 1;
    }
    console.log(`\n⚠ ${msg}`);
  }
  if (familyFail) {
    console.log(`\n✗ a declared $schema family is unmapped, unresolvable, or has a node that fails it`);
    return 1;
  }
  console.log(
    `\n✓ every declared validator resolves to a runnable Zod schema, and every kind without one says why`,
  );
  return 0;
}

if (import.meta.main) process.exit(await main());
