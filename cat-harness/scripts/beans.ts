#!/usr/bin/env bun
/**
 * Read the bean graph — the AGENT work plan, as knowledge-graph nodes.
 *
 * @module scripts/beans
 *
 * ## Why this module exists
 *
 * `todos/` had a reader, a published projection and a board over it before
 * `beans/` had any of the three. Measured 2026-09-20: 239 bean files carrying
 * `status`, `type`, `parent` and `priority`, read by nothing but check
 * scripts, each of which had **its own front-matter parser**. So the larger of
 * the two stores by two orders of magnitude was the invisible one, and the
 * parsing was duplicated rather than shared.
 *
 * That is the `dh4f` shape pointed at the work plan itself: a declared
 * directory whose contents no consumer reasons about. The fix is one reader,
 * here, that every consumer imports.
 *
 * ## Beans against todos — the 2×2, and why this reader is SHAPED differently
 *
 * | | memory | workflow management |
 * |---|---|---|
 * | human actor | `todos/` | *— nothing —* |
 * | agent actor | `memory/` | **beans** (here) |
 *
 * `scripts/todos.ts` validates each node against `schemas/todo.ts` and
 * **throws** on a file that declares itself a todo and fails to parse. This
 * reader deliberately does not, and the asymmetry is not laziness:
 *
 * **We own the todo format. We do not own the bean format.** Beans are
 * written by [hmans/beans](https://github.com/hmans/beans), a third-party CLI
 * that `AGENTS.md` names as the single todo mechanism for agent work. A zod
 * schema that throws on an unrecognised front-matter key would turn *"beans
 * shipped a new field"* into *"every gate in this repository is red"*, and the
 * failure would land on whoever next ran `beans create` rather than on anyone
 * who could fix it.
 *
 * So: known keys are lifted, unknown keys are ignored, and a file that is not
 * a bean is skipped rather than complained about. `beans check` owns the
 * complaint about a malformed bean; duplicating it here would put it somewhere
 * less useful.
 *
 * ## What `blocking:` means, and which end of it carries the expiry
 *
 * `beans update <id> --blocking <other>` marks `<id>` as blocking `<other>`.
 * So the field sits on the **blocker** and names the **blocked**. Reading it
 * the other way round inverts every finding computed from it, which is why
 * {@link blockedBy} exists rather than each caller inverting the map itself.
 *
 * The `bean-blocking` skill requires a real block to carry what it waits on,
 * since when, an **expiry** and a handoff — because a block with no expiry
 * cannot be told from abandoned work. That expiry is written in the bean's
 * BODY as prose, not in front matter, so {@link hasExpiry} matches the body
 * rather than reading a field that does not exist.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import {
  BEAN_GRAPH_FILE,
  DEFAULT_BEAN_GRAPH,
  DEFAULT_BEAN_GRAPH_ROOT,
  nodeOfKind,
  parseBeanGraph,
} from "../schemas/bean-graph.ts";

export const ROOT = resolve(import.meta.dir, "..");

/** The statuses that mean a bean is still work. */
export const OPEN_STATUSES = new Set(["todo", "in-progress"]);

/**
 * One bean, as this repository's consumers need it.
 *
 * Every field but `id` and `file` may be empty: a bean written by hand, or by
 * a version of the CLI that did not set it, is still a bean. A consumer that
 * needs one of them says so itself rather than having this reader refuse.
 */
export interface BeanNode {
  /** The bean id, e.g. `folio-assistant-km90`. */
  id: string;
  /**
   * Path relative to the `root` this was read with — what an edit link needs.
   *
   * Relative to the ARGUMENT, not to some root recomputed here. It was
   * `relative(repoRootFor(root), …)` until 2026-09-20, and `repoRootFor` is an
   * unconditional `join(root, "..")`, so a caller passing the repository root
   * — which both callers do — got every path prefixed with the repository's
   * own directory name. Every bean link and every edit link on the state
   * visualiser pointed one level too high, and the committed docs projection
   * carried the same prefix.
   *
   * Recomputing a root the caller already resolved is the bug, not the `..`.
   */
  file: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  /** The epic this belongs to, or `""`. */
  parent: string;
  /**
   * Bean ids THIS bean blocks, as ITS OWN `blocking:` declares them. See the
   * module note on direction. A DECLARATION, not the edge set: a consumer
   * wanting every edge reads {@link blockEdges}, never this field alone.
   */
  blocking: string[];
  createdAt: string;
  updatedAt: string;
  /** The prose below the front matter. Where a block's expiry is written. */
  body: string;
  /**
   * Bean ids this bean is blocked BY, as its own front matter declares them
   * (`blocked_by:`, which `beans update --blocked-by` writes). Optional so a
   * hand-built fixture need not carry it. Measured 2026-10-03, 60 beans
   * declare `blocked_by:` and 7 declare `blocking:`; both are normalised into
   * ONE edge set by {@link blockEdges} (bean `vhqq`), which {@link blockedBy},
   * {@link beanFindings}, the published index and the SQLite slice all read.
   */
  declaredBlockedBy?: string[];
  /** Front-matter `tags:`, or `[]`. Optional for the same reason. */
  tags?: string[];
}

/**
 * A scalar front-matter field, unquoted, or `""`.
 *
 * **The unescaping is not cosmetic.** A YAML single-quoted scalar writes a
 * literal apostrophe as `\'\'`, and most bean titles here are single-quoted
 * because they contain a colon. Stripping only the outer quotes published
 * *"the knowledge graph\'\'s own structure"* to the state visualiser — caught by
 * looking at the rendered page, which is the whole argument for rendering one.
 * A double-quoted scalar escapes with a backslash instead, so the two forms
 * are undone differently and the quote character decides which.
 *
 * This is not a YAML parser and does not pretend to be: block scalars, flow
 * mappings and multi-line values are out of scope, because the beans CLI
 * writes none of them. {@link sequence} carries the same limit and the same
 * reason.
 */
function field(fm: string, key: string): string {
  const m = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(fm);
  if (!m) return "";
  const raw = m[1]!.trim();
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).replace(/\\(["\\])/g, "$1");
  }
  return raw;
}

/**
 * A block-sequence front-matter field.
 *
 * Only the indented `- item` form, which is what the beans CLI writes. A flow
 * sequence (`blocking: [a, b]`) would need a YAML parser, and inventing a
 * second half-parser for a form the store does not contain is how the two
 * disagree later.
 */
function sequence(fm: string, key: string): string[] {
  const m = new RegExp(`^${key}:\\s*\\n((?:[ \\t]+-[ \\t]*\\S.*\\n?)+)`, "m").exec(fm);
  if (!m) return [];
  return m[1]!
    .split("\n")
    .map((l) => l.replace(/^[ \t]*-[ \t]*/, "").trim().replace(/^['"]|['"]$/g, ""))
    .filter((s) => s.length > 0);
}

/**
 * Where this instance keeps its bean definitions, READ from the graph rather
 * than composed.
 *
 * `beans/beans.json` declares its own nodes and a node's path resolves against
 * that file's directory, so writing `beans/defs` as a literal here would be a
 * second answer to a question the graph already answers — which
 * `check:declared-paths` is there to catch.
 *
 * Returns `null` when the graph declares no `bean-defs` node. An instance with
 * no declaration at all falls back to the schema's own default, which is what
 * an unmigrated folio has: absent is "no store", not "wrong".
 */
export function beanDefsDir(root: string): string | null {
  return resolveBeanDefs(root).dir;
}

/** Where the store is, and WHO SAID SO. */
export interface BeanDefsResolution {
  /** The directory, or `null` when the graph declares no `bean-defs` node. */
  dir: string | null;
  /**
   * True when a committed `beans/beans.json` named it; false when it came from
   * {@link DEFAULT_BEAN_GRAPH} because no graph file is present.
   */
  declared: boolean;
}

/**
 * {@link beanDefsDir}, plus the one fact it discards.
 *
 * A caller that only gets the path cannot tell **"this instance has no bean
 * store"** from **"this instance says its store is HERE and it is not"**. The
 * first is fine — an unmigrated folio has no `beans/` at all. The second is
 * `dh4f`, where a consumer scans nothing and reports a clean run over it, and
 * it is invisible without this flag because the fallback hands back a
 * perfectly plausible `beans/defs` for a repository that never mentioned one.
 *
 * Bean `t6s7`. `readBeanStore` is the caller that needs it; `beanDefsDir`
 * keeps its signature and delegates, so the other four readers are untouched.
 */
export function resolveBeanDefs(root: string): BeanDefsResolution {
  return resolveBeanDefsAt(join(root, DEFAULT_BEAN_GRAPH_ROOT));
}

/**
 * {@link resolveBeanDefs}, parameterised on WHERE THE GRAPH IS.
 *
 * Bean `9ofm` row D. `beans/beans.json` declares `defs` relative to its own
 * directory, so the nested declaration keeps answering "where is `defs` within
 * the graph" unchanged — what moves is the graph. Once `beans` is cut over to
 * its branch the graph root is a mount, which `graphReadPath` resolves and
 * this takes as given.
 *
 * Two questions, deliberately not merged into one resolver: the mount is keyed
 * on the `beans` entry in `folio-assistant.json`, and `beans/` is not an
 * instance root, so `beans/beans.json`'s nodes are invisible to it. A single
 * resolver would have to know both and would be wrong about one.
 */
export function resolveBeanDefsAt(graphRoot: string): BeanDefsResolution {
  const file = join(graphRoot, BEAN_GRAPH_FILE);
  const declared = existsSync(file);
  const graph = declared
    ? parseBeanGraph(JSON.parse(readFileSync(file, "utf-8")))
    : DEFAULT_BEAN_GRAPH;
  const node = nodeOfKind(graph, "bean-defs");
  if (!node) return { dir: null, declared };
  return { dir: join(declared ? dirname(file) : graphRoot, node.path), declared };
}

/** The ARCHIVE view's directory, and whether the graph declared it. */
export interface BeanArchiveResolution {
  /** The directory, or `null` when the graph declares no `archive` node. */
  dir: string | null;
  /** True when `beans/beans.json` names a node with id `archive`. */
  declared: boolean;
}

/**
 * Where the archive VIEW is — resolved by node **id**, not by kind.
 *
 * Bean `e8m3`. The owner ruled 2026-09-26 that archiving is a **view** rather
 * than a terminal state: an archived bean keeps its status and is still part of
 * the store. So the archive holds `bean-defs`, the same kind as the active
 * store — and that is exactly why {@link nodeOfKind} cannot be used here. With
 * two nodes of one kind it returns the first, which is `defs`, so asking by
 * kind would hand back the ACTIVE store under the name of the archive. Silent,
 * and wrong in the direction that reports the archive as clean.
 *
 * That the two share a kind is the point rather than an accident: a reader of
 * either is reading beans. What differs is whether the work is still in front
 * of anybody, and `check:bean-archive` is what holds that line.
 *
 * `declared: false` with `dir: null` is an instance that has no archive, which
 * is fine. A declared path that is absent is `dh4f` and is the caller's to
 * report as COULD NOT DETERMINE rather than as empty.
 */
export function resolveBeanArchive(root: string): BeanArchiveResolution {
  const graphRoot = join(root, DEFAULT_BEAN_GRAPH_ROOT);
  const file = join(graphRoot, BEAN_GRAPH_FILE);
  const declared = existsSync(file);
  const graph = declared
    ? parseBeanGraph(JSON.parse(readFileSync(file, "utf-8")))
    : DEFAULT_BEAN_GRAPH;
  const node = graph.directories.find((d) => d.id === "archive");
  if (!node) return { dir: null, declared: false };
  return { dir: join(declared ? dirname(file) : graphRoot, node.path), declared: true };
}

/**
 * Every bean in the ARCHIVE view, sorted by id. `null` when none is declared.
 *
 * Deliberately a separate reader rather than a flag on {@link readBeans}: eight
 * call sites read the active store and none of them should start counting
 * history because a parameter defaulted the other way.
 */
export function readArchivedBeans(root: string): BeanNode[] | null {
  const { dir } = resolveBeanArchive(root);
  if (dir === null || !existsSync(dir)) return null;
  return beansIn(dir, root);
}

/**
 * Every bean in the store, sorted by id.
 *
 * `null` — not `[]` — when there is no store. The two are different answers
 * and a caller that renders them the same reports a clean run over a
 * repository it never looked at. That distinction is the whole of the
 * `check-ci-health` third-state rule applied here.
 *
 * The sort is load-bearing downstream: the published projection is committed,
 * and an artefact reproducible only where it was generated is a snapshot
 * rather than a generated file.
 */
export function readBeans(root: string): BeanNode[] | null {
  const dir = beanDefsDir(root);
  if (dir === null || !existsSync(dir)) return null;
  return beansIn(dir, root);
}

/**
 * Parse every bean file directly in `dir`. Shared by the active store and the
 * archive view so the front-matter parsing has ONE implementation.
 *
 * Non-recursive on purpose. `beans/defs/archive/` is a sibling VIEW with its
 * own declaration and its own reader ({@link readArchivedBeans}), not a deeper
 * part of the active store — so recursing here would silently fold 631 terminal
 * beans into every open-bean count.
 */
function beansIn(dir: string, root: string): BeanNode[] {
  const out: BeanNode[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join(dir, name), "utf-8");
    const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    // A file with no front matter is not a bean. `beans check` owns that.
    if (!m) continue;
    const fm = m[1]!;
    out.push({
      id: (/^#\s*(\S+)/m.exec(fm) ?? [, name.replace(/\.md$/, "")])[1]!,
      file: relative(root, join(dir, name)),
      title: field(fm, "title"),
      status: field(fm, "status"),
      type: field(fm, "type"),
      priority: field(fm, "priority"),
      parent: field(fm, "parent"),
      blocking: sequence(fm, "blocking"),
      createdAt: field(fm, "created_at"),
      updatedAt: field(fm, "updated_at"),
      body: m[2]!,
      declaredBlockedBy: sequence(fm, "blocked_by"),
      tags: sequence(fm, "tags"),
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** `true` when a bean is still work rather than history. */
export function isOpen(b: BeanNode): boolean {
  return OPEN_STATUSES.has(b.status);
}

/** Which front-matter key declared an edge: the blocker's or the blocked's. */
export type BlockDeclaration = "blocking" | "blocked_by";

/**
 * Every block edge, ONE ROW PER DECLARATION, deduplicated and sorted.
 *
 * Two keys declare the same relation from opposite ends: `blocking:` sits on
 * the BLOCKER and names the blocked; `blocked_by:` sits on the BLOCKED and
 * names the blocker. Both normalise here to `blocker → blocked`. Measured
 * 2026-10-03 over 720 beans: 7 edges from `blocking:`, 77 from `blocked_by:`,
 * 1 declared both ways, so 83 distinct pairs — and until bean `vhqq` every
 * consumer but the SQLite slice read the 7.
 *
 * Kept per declaration (not per pair) because the beans slice stores
 * `declared_on` in `bean_block`'s primary key (bean `q8ar`). This is that
 * slice's normalisation, moved here so the slice and the published index
 * cannot disagree about what an edge is; {@link blockEdges} folds it to pairs.
 */
export function declaredBlockEdges(
  beans: BeanNode[],
): { blocker: string; blocked: string; declared_on: BlockDeclaration }[] {
  const seen = new Map<string, { blocker: string; blocked: string; declared_on: BlockDeclaration }>();
  const add = (blocker: string, blocked: string, declared_on: BlockDeclaration) =>
    seen.set(`${blocker}\u0000${blocked}\u0000${declared_on}`, { blocker, blocked, declared_on });
  for (const b of beans) {
    for (const t of b.blocking) add(b.id, t, "blocking");
    for (const f of b.declaredBlockedBy ?? []) add(f, b.id, "blocked_by");
  }
  return [...seen.keys()].sort().map((k) => seen.get(k)!);
}

/** One `blocker → blocked` pair, with every key that declared it. */
export interface BlockEdge {
  blocker: string;
  blocked: string;
  /** Sorted; two entries when the pair is declared from both ends — which is fine. */
  declaredOn: BlockDeclaration[];
}

/** A {@link BlockEdge} with an end that is not a bean in the store read. */
export interface DanglingBlockEdge extends BlockEdge {
  missing: Array<"blocker" | "blocked">;
}

/**
 * The block graph as ONE edge set: {@link declaredBlockEdges} folded to
 * distinct pairs, plus the edges with an end that is not a bean in `beans`.
 *
 * A dangling edge is REPORTED, never dropped: it stays in `edges` (the
 * declaration is a fact about the bean that wrote it) and is listed again in
 * `dangling` with the end that did not resolve. Measured 2026-10-03, both
 * dangling edges name a blocker that has moved to `beans/defs/archive/` — a
 * terminal bean still named as a blocker, which dropping would have hidden.
 */
export function blockEdges(beans: BeanNode[]): { edges: BlockEdge[]; dangling: DanglingBlockEdge[] } {
  const ids = new Set(beans.map((b) => b.id));
  const pairs = new Map<string, BlockEdge>();
  for (const e of declaredBlockEdges(beans)) {
    const k = `${e.blocker}\u0000${e.blocked}`;
    const at = pairs.get(k);
    if (at) {
      if (!at.declaredOn.includes(e.declared_on)) at.declaredOn.push(e.declared_on);
    } else {
      pairs.set(k, { blocker: e.blocker, blocked: e.blocked, declaredOn: [e.declared_on] });
    }
  }
  const edges = [...pairs.keys()].sort().map((k) => {
    const e = pairs.get(k)!;
    e.declaredOn.sort();
    return e;
  });
  const dangling = edges.flatMap((e): DanglingBlockEdge[] => {
    const missing: Array<"blocker" | "blocked"> = [];
    if (!ids.has(e.blocker)) missing.push("blocker");
    if (!ids.has(e.blocked)) missing.push("blocked");
    return missing.length ? [{ ...e, missing }] : [];
  });
  return { edges, dangling };
}

/**
 * Blocked bean id → the ids blocking it, over BOTH declarations.
 *
 * Built once here rather than at each call site, because inverting it wrongly
 * is silent: every finding still computes, and every one of them names the
 * wrong bean. It inverted `blocking:` only until bean `vhqq`, and so missed 76
 * of the 83 edges in the store.
 */
export function blockedBy(beans: BeanNode[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const e of blockEdges(beans).edges) {
    const at = out.get(e.blocked);
    if (at) at.push(e.blocker);
    else out.set(e.blocked, [e.blocker]);
  }
  return out;
}

/** Blocker bean id → the ids it blocks, over BOTH declarations. */
export function blocksOf(beans: BeanNode[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const e of blockEdges(beans).edges) {
    const at = out.get(e.blocker);
    if (at) at.push(e.blocked);
    else out.set(e.blocker, [e.blocked]);
  }
  return out;
}

/**
 * Whether a bean's body states an expiry for the block it holds.
 *
 * Prose, not a field: `bean-blocking` asks for `**expires**: <date>` in the
 * body, and the store writes it that way. Matching loosely — any of `expires`,
 * `expiry` or `expire` — because the skill's own examples are not consistent
 * and a detector that misses a stated expiry accuses somebody who complied.
 */
export function hasExpiry(b: BeanNode): boolean {
  return /\bexpir(?:es|y|e)\b/i.test(b.body);
}

/**
 * The stuck states a bean store can be in, computed from committed data only.
 *
 * ## Why these three and not the obvious fourth
 *
 * Bean `v49e` names the interesting states as *"the ones that look like
 * nothing"* — a step enabled but not taken, a block with no expiry, an
 * instance whose position has not moved. Two of those need
 * `beans/workflows/`, the declared `workflow-state` graph, which was **empty**
 * when this was written: a BPMN-position finding would have had no data on one
 * side of its join and would have reported "nowhere" for all 239 beans. They
 * are not here, and their absence is the honest answer rather than an
 * oversight.
 *
 * The obvious fourth — **a stale `in-progress` bean** — is missing for a
 * different and sharper reason, and it is about this file rather than about
 * beans. `emit(..., "data")` gates the projection on EXACT CONTENT, so
 * anything computed against the clock changes the file on every run and the
 * staleness gate fires forever. So the projection publishes each bean's
 * `updatedAt` and the CLIENT computes age at view time. That is the same rule
 * the todo index's own sort comment states: an artefact reproducible only
 * where it was generated is a snapshot, not a generated file. A build-time
 * `Date.now()` would have made this one exactly that.
 *
 * ## Each finding's basis, measured 2026-09-20 over 239 beans
 *
 * | finding | fired on |
 * |---|---|
 * | `blocked-without-expiry` | 4 of the 4 beans holding a block |
 * | `blocker-closed` | 1 — `04vl`, completed, still blocking an open bean |
 * | `blocking-unknown` | 0 |
 *
 * `blocked-without-expiry` firing on **all** of its subjects is the one
 * result worth arguing with, because this repository's own rule is that a
 * check firing on every one of its subjects is a check that is wrong. It is
 * kept, and the reason is that the rule is about a check with no discriminating
 * power over a LARGE population: 4 subjects out of 239 is a finding about four
 * specific beans, not a wall somebody switches off. If the count of blocks
 * grows and this still fires on all of them, that is the point to reconsider.
 *
 * The other two fire on 1 and 0 respectively, which is the shape
 * `check-bean-parents.ts` describes as locking in a property the corpus HAS
 * rather than demanding work to reach one.
 *
 * **That table measured `blocking:` only.** Since bean `vhqq` the findings run
 * over {@link blockEdges} — both declarations — so they cover 83 edges where
 * they covered 7, and `blocking-unknown` now fires on the 2 `blocked_by:`
 * edges whose blocker is in the archive rather than the active store. The
 * counts above are history; regenerate the index to read today's.
 */
export function beanFindings(beans: BeanNode[]): Array<{
  kind: "blocked-without-expiry" | "blocker-closed" | "blocking-unknown";
  bean: string;
  blocks: string;
  detail: string;
}> {
  const byId = new Map(beans.map((b) => [b.id, b]));
  const out: Array<{ kind: "blocked-without-expiry" | "blocker-closed" | "blocking-unknown"; bean: string; blocks: string; detail: string }> = [];
  // Over the ONE edge set, both declarations (bean `vhqq`). `bean` is always
  // the blocker and `blocks` the blocked, whichever end wrote the edge.
  for (const e of blockEdges(beans).edges) {
    const b = byId.get(e.blocker);
    const t = byId.get(e.blocked);
    const target = e.blocked;
    if (!b || !t) {
      // Reported, never dropped. The sentence names the bean that DECLARED
      // the edge, since that file is where the repair is made.
      const where = e.declaredOn.map((d) => (d === "blocking" ? `\`${e.blocker}\`'s blocking:` : `\`${e.blocked}\`'s blocked_by:`));
      out.push({
        kind: "blocking-unknown",
        bean: e.blocker,
        blocks: target,
        detail: !b
          ? `is named as blocking \`${target}\` (in ${where.join(" and ")}) but is not a bean in this store`
          : `blocks \`${target}\`, which is not a bean in this store`,
      });
      continue;
    }
    {
      // A CLOSED bean still holding a block on an OPEN one. The work finished
      // and nobody lifted the block, so the blocked bean reads as waiting on
      // something that already happened — indistinguishable, from the blocked
      // end, from waiting on something that never will.
      if (!isOpen(b) && isOpen(t)) {
        out.push({
          kind: "blocker-closed",
          bean: b.id,
          blocks: target,
          detail: `is ${b.status} but still blocks \`${target}\`, which is ${t.status}`,
        });
      }
      // `bean-blocking`: a real block carries what it waits on, since when, an
      // EXPIRY and a handoff — because a block with no expiry cannot be told
      // from abandoned work. Only live blocks are worth reporting; a closed
      // blocker is already the finding above.
      //
      // The expiry is looked for on the bean(s) that DECLARED the edge — the
      // blocker for `blocking:`, the blocked for `blocked_by:` — since that is
      // the file whose author asserted the block. For a `blocking:`-only edge
      // this is exactly the pre-`vhqq` check.
      const declarers = e.declaredOn.map((d) => (d === "blocking" ? b : t));
      if (isOpen(b) && !declarers.some(hasExpiry)) {
        out.push({
          kind: "blocked-without-expiry",
          bean: b.id,
          blocks: target,
          detail: e.declaredOn.includes("blocking")
            ? `blocks \`${target}\` and states no expiry, so the block cannot be told from abandoned work`
            : `blocks \`${target}\` (declared by its blocked_by:), and neither states an expiry, so the block cannot be told from abandoned work`,
        });
      }
    }
  }
  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.bean.localeCompare(b.bean) || a.blocks.localeCompare(b.blocks));
}
