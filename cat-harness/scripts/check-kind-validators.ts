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
 * @covers computed — it sweeps whichever kinds declare `nodeSchemas`, so a literal list would go
 *   stale silently
 */

import { BASE_GRAPH_KINDS } from "../schemas/cat-harness.js";
import { readdirSync, readFileSync, statSync } from "node:fs";

import { gitCorpus } from "../schemas/git-corpus.ts";
import { join, relative } from "node:path";

import { directoryEntriesForGraph, instanceRootsIn } from "../schemas/cat-harness.js";
import { resolveKindValidator, resolveNodeSchemas, stripAnnotations } from "../schemas/kind-validator.js";
import { resolveSubgraphSource } from "../schemas/subgraph-source.js";
import { graphReadPath } from "./graph-read.ts";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
const instanceRoot = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

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

export async function sweep(root: string): Promise<ValidatorSweep> {
  const out: ValidatorSweep = { resolved: [], notApplicable: [], undeclared: [], unresolvable: [], contradictory: [] };
  for (const kind of Object.keys(BASE_GRAPH_KINDS)) {
    const def = BASE_GRAPH_KINDS[kind];
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
  /**
   * Every declared directory of this kind keeps its content on a branch TIP
   * that this checkout has not mounted, so there was nothing here to read.
   *
   * **Could not determine — never a pass and never `EXAMINED NOTHING`.** The
   * two are different claims: `EXAMINED NOTHING` says the graph was read and
   * found to hold no node, and that is false of a graph this checkout cannot
   * reach. The gate that FAILS on an unmounted cutover is
   * `check:declared-dirs` (its `unmounted` finding, whose remedy is
   * `bun run state:mount`); duplicating the failure here would give one defect
   * two red gates and a reader no way to see which is the real one.
   *
   * Carries the reason `graphReadPath` refused with, so the remedy travels.
   */
  unreachable?: { id: string; reason: string }[];
  /**
   * The graph WAS read — in the checkout or at its mount — and holds no node,
   * and that is a legitimate state for it.
   *
   * Only for a kind whose content is kept at a branch TIP: one live copy that
   * a running process writes, where zero nodes means zero decisions have been
   * taken yet. A determined empty, not an unexamined corpus. Bean `najo`: the
   * merge queue's first entry is a steward's to write, and a gate that went
   * red until somebody wrote one would be answered by writing a FABRICATED
   * decision — which is exactly what bean `30jr` refused to do.
   *
   * A graph tracked in the checkout gets no such allowance: there, emptiness
   * is a corpus that should be there and is not, which is what
   * `EXAMINED NOTHING` is for.
   */
  emptyLiveStore?: { id: string; at: string }[];
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
  for (const [kind, def] of Object.entries(BASE_GRAPH_KINDS)) {
    if (!def.nodeSchemas) continue;
    const fams = await resolveNodeSchemas(kind, root);
    const byTag = new Map(fams.map((f) => [f.tag, f]));
    const s: FamilySweep = { kind, counts: {}, unmapped: [], unresolvable: [], invalid: [] };
    for (const f of fams) if (f.state === "unresolvable") s.unresolvable.push({ tag: f.tag, reason: f.reason });
    const repoRoot = join(root, "..");
    // WHERE TO READ, not where the declaration points. A graph kept at a branch
    // tip is read at its mount, and when nothing is mounted there is no
    // directory to read at all — which is a different answer from an empty one.
    // Bean `najo`; `graphReadPath` is the one implementation of the question.
    const dirs = new Set<string>();
    const liveStores = new Map<string, string>();
    let declared = 0;
    for (const inst of instanceRootsIn(repoRoot)) {
      for (const d of directoryEntriesForGraph(inst, kind)) {
        declared++;
        const atTip = (() => {
          try {
            const src = resolveSubgraphSource(d);
            return src.kind === "branch" && src.keyedBy === "tip";
          } catch {
            // A contradictory declaration is `check:declared-dirs`'s finding,
            // and not a reason for this sweep to stop reading.
            return false;
          }
        })();
        const where = graphReadPath(d.id, repoRoot);
        if (where.state === "refused") {
          (s.unreachable ??= []).push({ id: d.id, reason: where.reason });
          continue;
        }
        const at = where.state === "ok" ? where.at : d.absPath;
        dirs.add(at);
        if (atTip) liveStores.set(d.id, at);
      }
    }
    if (declared === 0) {
      s.noDirectory = true;
      out.push(s);
      continue;
    }
    if (dirs.size === 0) {
      // Every directory of this kind is cut over and unmounted here.
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
    // A live store that was READ and holds nothing: recorded here so the
    // reporter can say "determined empty" rather than "examined nothing".
    if (Object.values(s.counts).reduce((a, c) => a + c.nodes, 0) === 0 && liveStores.size > 0) {
      s.emptyLiveStore = [...liveStores].map(([id, at]) => ({ id, at: relative(repoRoot, at) || "." }));
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
    if (f.noDirectory) {
      console.log(`  · no instance declares a ${f.kind} directory — nothing to route (a nested kind is reached through its parent)`);
    } else if (f.unreachable && nodes === 0) {
      // COULD NOT DETERMINE. Never printed as a pass, and never as
      // `EXAMINED NOTHING`: nothing read this graph, so "no node was found" is
      // a claim this run is not entitled to. `check:declared-dirs` is the gate
      // that fails on it — one defect, one red gate. Bean `najo`.
      for (const u of f.unreachable) {
        console.log(`  ⚠ could not determine — ${f.kind} at \`${u.id}\` was not read: ${u.reason}`);
      }
    } else if (f.emptyLiveStore && nodes === 0) {
      // A DETERMINED empty: read, and holding nothing, which is a legitimate
      // state for one live copy a process writes. The alternative is a gate
      // whose only remedy is to fabricate a node (bean `30jr` refused that).
      for (const e of f.emptyLiveStore) {
        console.log(
          `  · ${f.kind} at \`${e.id}\` (${e.at}) was READ and holds no node — a determined empty, ` +
            `not an unexamined corpus: its content is one live copy at a branch tip that a running ` +
            `process writes, so zero nodes means zero have been written yet`,
        );
      }
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
