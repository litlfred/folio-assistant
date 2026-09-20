#!/usr/bin/env bun
/**
 * Every OPEN bean belongs to an epic. This is what keeps the roadmap a plan.
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
 * 3. Every `parent` names a bean whose `type` is `epic`. Parenting a task to a
 *    task nests the roadmap somewhere nobody looks.
 *
 * ## What it deliberately does NOT check
 *
 * **Closed beans.** A `completed` or `scrapped` bean predating the epic
 * structure is history, and back-filling 184 of them would be busywork that
 * changes no plan. Only open work has to be placeable.
 *
 * **An epic's own parent.** Epics are roots here. If nested epics are ever
 * wanted, this is the line to relax.
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
import { resolve } from "node:path";

// ONE reader, imported. Until 2026-09-20 this file carried its own
// front-matter parser and its own `beanDefsDir`, and so did every other
// consumer of the store — which is how two of them can disagree about what a
// bean is while both look correct in review. `scripts/beans.ts` is now the
// single answer; this check keeps only the RULE.
import { OPEN_STATUSES, beanDefsDir, readBeans } from "./beans.ts";

// Re-exported because it was exported from here before the reader existed, and
// a consumer outside this repository would break on the move.
export { beanDefsDir };

export interface BeanParentsReport {
  store: string | null;
  open: number;
  problems: string[];
}

export function checkBeanParents(root: string): BeanParentsReport {
  const beans = readBeans(root);
  if (beans === null) return { store: null, open: 0, problems: [] };

  const byId = new Map(beans.map((b) => [b.id, b]));
  const open = beans.filter((b) => OPEN_STATUSES.has(b.status) && b.type !== "epic");
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
    } else if (p.type !== "epic") {
      problems.push(`${where}: \`parent: ${b.parent}\` is a ${p.type || "bean with no type"}, not an epic`);
    }
  }
  return { store: beanDefsDir(root), open: open.length, problems };
}

function formatReport(r: BeanParentsReport): string {
  if (r.store === null) return "Bean parents\n  · no bean store — nothing to check";
  const out = [`Bean parents (${r.open} open, non-epic)`];
  if (r.problems.length === 0) {
    out.push("  ✓ every open bean belongs to an epic");
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
