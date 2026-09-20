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
import { repoRootFor } from "../schemas/cat-harness.js";

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
  /** Path relative to the repository root — what an edit link needs. */
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

/** A scalar front-matter field, unquoted, or `""`. */
function field(fm: string, key: string): string {
  const m = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(fm);
  return m ? m[1]!.trim().replace(/^['"]|['"]$/g, "") : "";
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
  const graphRoot = join(root, DEFAULT_BEAN_GRAPH_ROOT);
  const file = join(graphRoot, BEAN_GRAPH_FILE);
  const graph = existsSync(file)
    ? parseBeanGraph(JSON.parse(readFileSync(file, "utf-8")))
    : DEFAULT_BEAN_GRAPH;
  const node = nodeOfKind(graph, "bean-defs");
  if (!node) return null;
  return join(existsSync(file) ? dirname(file) : graphRoot, node.path);
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
  const repoRoot = repoRootFor(root);
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
      file: relative(repoRoot, join(dir, name)),
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
