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
  type BeanNodeKind,
  parseBeanGraph,
} from "../schemas/bean-graph.ts";
// Bean `9ofm` row D. No cycle: `graph-read` reads the declaration, git and the
// mount marker, and knows nothing about beans.
import { graphReadPath } from "./graph-read.ts";

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
  /** Bean ids THIS bean blocks. See the module note on direction. */
  blocking: string[];
  createdAt: string;
  updatedAt: string;
  /** The prose below the front matter. Where a block's expiry is written. */
  body: string;
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
 *
 * **THROWS** when the graph is kept on a branch this checkout cannot reach
 * (bean `9ofm` row D). `null` already means "no store" to every one of the ten
 * call sites, so returning it for "could not read the store" would make each
 * of them report a clean run over nothing — `dh4f`, ten times, on the first
 * session after a cutover where the mount did not happen. A crash carrying the
 * remedy beats that. It cannot fire before the cutover: while `main` still
 * tracks the files, the graph resolves to the checkout.
 *
 * A caller that must not throw asks {@link resolveBeanDefs} and reads
 * `unreachable` itself — `readBeanStore` is the one that does.
 */
export function beanDefsDir(root: string): string | null {
  const r = resolveBeanDefs(root);
  if (r.unreachable) throw new Error(`cannot resolve the bean store: ${r.unreachable}`);
  return r.dir;
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
  /**
   * Why the graph could not be reached, when it is kept on a branch and this
   * checkout has no mount of it. Bean `9ofm` row D.
   *
   * `dir` is `null` here, and that `null` means something a caller must NOT
   * read as "no store": it is the THIRD state bean `t6s7` opened this type up
   * for, one further out. `declared` stays `true`, because the declaration is
   * correct — it is the checkout that is missing the content.
   */
  unreachable?: string;
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
  // WHERE THE GRAPH IS, then where `defs` is within it (bean `9ofm` row D).
  // Resolved HERE rather than in each reader, so every consumer of
  // `beanDefsDir`, `readBeans` and `readBeanStore` relocates at once when the
  // graph moves to its branch — and so there is one implementation of the
  // question rather than one per funnel.
  const where = graphReadPath("beans", root);
  if (where.state === "refused") {
    // Not a path that merely happens not to exist: that reads as "no store"
    // one level up, which is the whole defect.
    return { dir: null, declared: true, unreachable: where.reason };
  }
  // `undeclared` keeps the convention: an unmigrated folio with no `beans`
  // entry at all has no store, which is fine rather than wrong.
  const graphRoot = where.state === "ok" ? where.at : join(root, DEFAULT_BEAN_GRAPH_ROOT);
  return resolveBeanDefsAt(graphRoot);
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

/**
 * Any node of the bean graph, by KIND, with the graph's own relocation applied.
 *
 * Bean `9ofm` row D. The bean graph's nodes are all *inside* `beans/`, so they
 * move when it is cut over to its branch. The `defs` reader had this already;
 * this is the same answer for the rest, so a caller does not compose
 * `join(repoRoot, "beans", <node>)` and quietly keep reading the checkout.
 *
 * **`merge-queue` is the exception, and it is not reachable from here.** Bean
 * `najo` cut `beans/queue/` over to `cat/cat-harness/merge-queue` ahead of
 * `beans/`, so its node moves with ITS OWN declaration rather than with the
 * bean graph — and resolving it through this function would hand back
 * `<beans graph root>/queue`, which after that cutover is a path nothing
 * mounts: `declared-but-absent` printed over a graph that is really on a
 * branch, with the wrong remedy attached. {@link BeanNodeKind} does not admit
 * it, so this is a type error rather than a comment to remember, and
 * `merge-queue-store.ts` resolves it by kind through `graphReadPath`. This
 * docblock named it among the kinds this function serves until 2026-10-04.
 *
 * Returns the same three answers {@link resolveBeanDefs} does: a directory,
 * `null` for "the graph declares no node of this kind", and `unreachable` for
 * "the graph is on a branch this checkout cannot reach". Never a path that
 * merely happens not to exist.
 *
 * By kind rather than by id, matching {@link nodeOfKind}; a kind held by two
 * nodes resolves to the first, which is why the archive has
 * {@link resolveBeanArchive} of its own.
 */
export function resolveBeanGraphNode(root: string, kind: BeanNodeKind): BeanDefsResolution {
  const where = graphReadPath("beans", root);
  if (where.state === "refused") return { dir: null, declared: true, unreachable: where.reason };
  const graphRoot = where.state === "ok" ? where.at : join(root, DEFAULT_BEAN_GRAPH_ROOT);
  const file = join(graphRoot, BEAN_GRAPH_FILE);
  const declared = existsSync(file);
  const graph = declared ? parseBeanGraph(JSON.parse(readFileSync(file, "utf-8"))) : DEFAULT_BEAN_GRAPH;
  const node = nodeOfKind(graph, kind);
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
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/** `true` when a bean is still work rather than history. */
export function isOpen(b: BeanNode): boolean {
  return OPEN_STATUSES.has(b.status);
}

/**
 * The inverse of `blocking:` — blocked bean id → the ids blocking it.
 *
 * Built once here rather than at each call site, because inverting it wrongly
 * is silent: every finding still computes, and every one of them names the
 * wrong bean.
 */
export function blockedBy(beans: BeanNode[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const b of beans) {
    for (const target of b.blocking) {
      const at = out.get(target);
      if (at) at.push(b.id);
      else out.set(target, [b.id]);
    }
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
 */
export function beanFindings(beans: BeanNode[]): Array<{
  kind: "blocked-without-expiry" | "blocker-closed" | "blocking-unknown";
  bean: string;
  blocks: string;
  detail: string;
}> {
  const byId = new Map(beans.map((b) => [b.id, b]));
  const out: Array<{ kind: "blocked-without-expiry" | "blocker-closed" | "blocking-unknown"; bean: string; blocks: string; detail: string }> = [];
  for (const b of beans) {
    for (const target of b.blocking) {
      const t = byId.get(target);
      if (!t) {
        out.push({
          kind: "blocking-unknown",
          bean: b.id,
          blocks: target,
          detail: `blocks \`${target}\`, which is not a bean in this store`,
        });
        continue;
      }
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
      if (isOpen(b) && !hasExpiry(b)) {
        out.push({
          kind: "blocked-without-expiry",
          bean: b.id,
          blocks: target,
          detail: `blocks \`${target}\` and states no expiry, so the block cannot be told from abandoned work`,
        });
      }
    }
  }
  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.bean.localeCompare(b.bean) || a.blocks.localeCompare(b.blocks));
}
