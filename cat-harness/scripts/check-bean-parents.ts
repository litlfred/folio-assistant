#!/usr/bin/env bun
/**
 * Every OPEN bean is placed under an epic or a milestone. This is what keeps the roadmap a plan.
 *
 * `beans roadmap` groups by `parent:` and drops everything else into a
 * "Miscellaneous" section. Measured 2026-09-19 before the restructure: one
 * epic, and **72 of 86 open beans** with no parent — a list in creation order
 * rather than a plan, which is exactly what `AGENTS.md` says the roadmap
 * exists not to be.
 *
 * The restructure fixed the instance. **This is the guard, not the fix**, and
 * it exists because nothing else notices: `beans create` does not ask for a
 * parent, a new bean is textually clean, and the roadmap grows a
 * Miscellaneous section again in silence. That is the `xom7` shape — a
 * defect indistinguishable from health from inside the repo — applied to the
 * work plan itself.
 *
 * It locks in a property the corpus HAS rather than demanding work to reach
 * one: the orphan count was zero when this was written, so adopting it costs
 * nothing today and prices the next unparented bean at the moment it lands.
 *
 * ## What it checks
 *
 * 1. Every bean whose `status` is `todo` or `in-progress` carries a `parent`.
 * 2. Every `parent` names a bean that EXISTS. A dangling parent is worse than
 *    none: the roadmap silently omits the child rather than listing it.
 * 3. Every `parent` names a bean whose `type` is `epic` or `milestone`.
 *    Parenting a task to a task nests the roadmap somewhere nobody looks.
 *
 * ## What it deliberately does NOT check
 *
 * **Closed beans.** A `completed` or `scrapped` bean predating the epic
 * structure is history, and back-filling 184 of them would be busywork that
 * changes no plan. Only open work has to be placeable.
 *
 * **A ROOT's own parent.** Milestones and epics are the roadmap's roots, so
 * neither is required to carry one — `ROOT_TYPES` below. A milestone sits
 * above an epic in this store's stated hierarchy and has nothing to hang
 * from; an epic's parent is a milestone when it has one, and it need not.
 *
 * ## Third state
 *
 * A repository with no bean store is **not** a failure — it has no work
 * plan to check, and is reported as `no bean store`. Exit 2 is "could not
 * check" and is never rendered as a pass, the same rule
 * `check-harness-dirs.ts` and `check-ci-health.ts` follow.
 *
 * Usage:
 *   bun run check:bean-parents
 *   bun run check:bean-parents -- --json
 *
 * Exit: 0 every open bean is placed (or no store), 1 a real orphan, 2 could not check.
 *
 * @module scripts/check-bean-parents
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import {
  BEAN_GRAPH_FILE,
  DEFAULT_BEAN_GRAPH,
  DEFAULT_BEAN_GRAPH_ROOT,
  nodeOfKind,
  parseBeanGraph,
} from "../schemas/bean-graph.ts";

const OPEN = new Set(["todo", "in-progress"]);

/**
 * The types that are ROOTS of the roadmap, so "open with no parent" is not a
 * defect for them.
 *
 * `beans prime` states this store's hierarchy as `milestone -> epic ->
 * feature -> task/bug`, so a milestone sits ABOVE an epic and has nothing to
 * hang from. Until 2026-09-20 only `epic` was here, because no milestone had
 * ever been created — the type was configured and unused. The first three
 * (the owner's goals, bean `wqht`) failed this check on the day they landed,
 * demanding a parent that by the hierarchy cannot exist.
 *
 * That is the same shape this file's own header warns about one level down:
 * a rule that forces a bean to declare something it never claimed, in order
 * to stay green.
 */
const ROOT_TYPES = new Set(["milestone", "epic"]);

/**
 * The types a parent may have.
 *
 * An epic's parent is a milestone, and a task's is an epic, so both are
 * acceptable rather than only `epic`. Nothing wider: parenting a task to a
 * task nests the roadmap somewhere nobody looks, which is the original
 * reason this constraint exists.
 */
const PARENT_TYPES = new Set(["milestone", "epic"]);

interface Bean {
  id: string;
  file: string;
  title: string;
  status: string;
  type: string;
  parent: string;
}

export interface BeanParentsReport {
  store: string | null;
  open: number;
  problems: string[];
}

function field(fm: string, key: string): string {
  const m = new RegExp(`^${key}:\\s*(.*)$`, "m").exec(fm);
  return m ? m[1]!.trim().replace(/^['"]|['"]$/g, "") : "";
}

/**
 * Where this instance keeps its bean definitions, READ from the graph rather
 * than composed.
 *
 * `beans/beans.json` declares its own nodes, and a node's path resolves
 * against that file's directory. Writing `beans/defs` here instead would be a
 * second answer to a question the graph already answers — and
 * `check:declared-paths` caught exactly that in the first draft of this file,
 * which is the gate working.
 */
export function beanDefsDir(root: string): string | null {
  const graphRoot = join(root, DEFAULT_BEAN_GRAPH_ROOT);
  const file = join(graphRoot, BEAN_GRAPH_FILE);
  // An instance with no declaration falls back to the schema's own default,
  // which is what an unmigrated folio has. Absent is "no store", not "wrong".
  const graph = existsSync(file)
    ? parseBeanGraph(JSON.parse(readFileSync(file, "utf-8")))
    : DEFAULT_BEAN_GRAPH;
  const node = nodeOfKind(graph, "bean-defs");
  if (!node) return null;
  return join(existsSync(file) ? dirname(file) : graphRoot, node.path);
}

export function readBeans(root: string): Bean[] | null {
  const dir = beanDefsDir(root);
  if (dir === null || !existsSync(dir)) return null;
  const out: Bean[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join(dir, name), "utf-8");
    const fm = /^---\n([\s\S]*?)\n---/.exec(text);
    // A bean with no front matter is not a bean. `beans check` owns that
    // complaint; this one would only duplicate it in a less useful place.
    if (!fm) continue;
    const body = fm[1]!;
    out.push({
      id: (/^#\s*(\S+)/m.exec(body) ?? [, name.replace(/\.md$/, "")])[1]!,
      file: name,
      title: field(body, "title"),
      status: field(body, "status"),
      type: field(body, "type"),
      parent: field(body, "parent"),
    });
  }
  return out;
}

export function checkBeanParents(root: string): BeanParentsReport {
  const beans = readBeans(root);
  if (beans === null) return { store: null, open: 0, problems: [] };

  const byId = new Map(beans.map((b) => [b.id, b]));
  const open = beans.filter((b) => OPEN.has(b.status) && !ROOT_TYPES.has(b.type ?? ""));
  const problems: string[] = [];

  for (const b of open.sort((a, c) => a.id.localeCompare(c.id))) {
    const where = `${b.id} (${b.title.slice(0, 60)})`;
    if (!b.parent) {
      problems.push(`${where}: open with no \`parent\` — it lands in the roadmap's Miscellaneous section`);
      continue;
    }
    const p = byId.get(b.parent);
    if (!p) {
      problems.push(`${where}: \`parent: ${b.parent}\` names no bean — the roadmap omits this child entirely`);
    } else if (!PARENT_TYPES.has(p.type ?? "")) {
      problems.push(
        `${where}: \`parent: ${b.parent}\` is a ${p.type || "bean with no type"}, not an epic or a milestone`,
      );
    }
  }
  return { store: beanDefsDir(root), open: open.length, problems };
}

function formatReport(r: BeanParentsReport): string {
  if (r.store === null) return "Bean parents\n  · no bean store — nothing to check";
  const out = [`Bean parents (${r.open} open, below the roadmap roots)`];
  if (r.problems.length === 0) {
    out.push("  ✓ every open bean is placed under an epic or a milestone");
  } else {
    for (const p of r.problems) out.push(`  ✗ ${p}`);
    out.push("");
    out.push("  Set `parent: <epic-id>` in the bean's front matter, or open an epic for it.");
    out.push("  `beans roadmap` shows the current structure.");
  }
  return out.join("\n");
}

if (import.meta.main) {
  let report: BeanParentsReport;
  try {
    report = checkBeanParents(resolve("."));
  } catch (e) {
    console.error(`Could not check bean parents: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.problems.length ? 1 : 0);
}
