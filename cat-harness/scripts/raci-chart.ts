#!/usr/bin/env bun
/**
 * RACI across the process corpus — the chart, and the rule that makes it
 * worth reading.
 *
 * Bean `folio-assistant-7o7i`. Owner, 2026-09-20: *"adopt RACI chart as
 * part of generic project management … use it as a way to work w/
 * stakeholders and determine involvement in project being initiated"*,
 * *"to help sketch project breakdown"*, and *"skills to make raci charts
 * across processes"*.
 *
 * ## What this adds, and what it deliberately does not
 *
 * A BPMN lane already says who performs an activity. **That is R**, and it
 * is not re-declared: one fact in two places with nothing asserting they
 * agree is the shape `85e8` removed `fallbackRole` for. So `responsible`
 * is read from `roleRef` and is not a value `folio:raci` accepts.
 *
 * What BPMN cannot say is *Accountable* (one per activity, the neck on the
 * block), *Consulted* (two-way, before the work) and *Informed* (one-way,
 * after it). Those three are the overlay — three edge kinds over roles and
 * activities that already exist, rather than a new party registry, which
 * would be a second answer to "who is the reviewer" free to disagree with
 * `roles.json`.
 *
 * ## Exactly one Accountable, enforced
 *
 * Owner's choice, and the defensible one: it is the rule most often broken
 * in practice, and a chart that permits two A's lies about who carries the
 * decision. Zero is also a violation once an activity declares **any**
 * RACI — a half-annotated activity is worse than an unannotated one,
 * because the chart looks complete.
 *
 * An activity with no RACI at all is `n/a`, not a failure. Annotation is
 * incremental by design; the gate is on what a diagram CLAIMS, never on
 * how much it has claimed so far.
 *
 * Usage:
 *   bun run raci                     # the chart, every process
 *   bun run raci -- --process <id>   # one process
 *   bun run check:raci               # the rule only, exit non-zero on a breach
 *
 * @module scripts/raci-chart
 */
import { resolve } from "node:path";

import { workflowFiles, kgRoots } from "./known-skills.js";
import { readRoleGraph } from "../schemas/role-graph.js";
import { isActivity, loadProcessModel, RACI_INVOLVEMENTS } from "../src/workflow/process-model.js";
import type { RaciInvolvement } from "../src/workflow/process-model.js";

const ROOT = resolve(import.meta.dir, "..");

/** One activity's row: who performs it, and who is A / C / I. */
export interface RaciRow {
  process: string;
  activity: string;
  activityName: string;
  /** From the LANE — R is not declared, it is where the work sits. */
  responsible?: string;
  accountable: string[];
  consulted: string[];
  informed: string[];
}

export interface RaciBreach {
  process: string;
  activity: string;
  detail: string;
}

/** Every declared role id, through the declaration rather than a literal path. */
export function declaredRoles(root: string): Set<string> {
  const out = new Set<string>();
  for (const kgRoot of kgRoots(root)) {
    for (const r of readRoleGraph(kgRoot)?.roles ?? []) out.add(r.id);
  }
  return out;
}

/** Build the chart. Activities with no RACI declaration are omitted. */
export async function raciRows(root: string = ROOT): Promise<RaciRow[]> {
  const rows: RaciRow[] = [];
  for (const file of workflowFiles(root).filter((f) => f.endsWith(".bpmn"))) {
    const model = await loadProcessModel(file);
    for (const n of [...model.nodes.values()].filter(isActivity)) {
      if (n.raci.length === 0) continue;
      const of = (k: RaciInvolvement): string[] =>
        n.raci.filter((r) => r.involvement === k).map((r) => r.role).sort();
      rows.push({
        process: model.id,
        activity: n.id,
        activityName: n.name,
        responsible: n.roleRef,
        accountable: of("accountable"),
        consulted: of("consulted"),
        informed: of("informed"),
      });
    }
  }
  return rows;
}

/**
 * The rule: exactly one A, every named role declared, and no role both
 * accountable and consulted on the same activity.
 *
 * That last one is not pedantry. A/C on one activity means somebody is
 * asked for input and also carries the decision, which is how "consulted"
 * becomes a formality — the chart's most common way of lying while
 * looking complete.
 */
export function raciBreaches(rows: readonly RaciRow[], roles: ReadonlySet<string>): RaciBreach[] {
  const out: RaciBreach[] = [];
  for (const r of rows) {
    if (r.accountable.length !== 1) {
      out.push({
        process: r.process,
        activity: r.activity,
        detail:
          r.accountable.length === 0
            ? "declares RACI but no `accountable` — a half-annotated activity is worse than an unannotated one, because the chart looks complete"
            : `declares ${r.accountable.length} accountable roles (${r.accountable.join(", ")}) — exactly one carries the decision`,
      });
    }
    for (const [kind, list] of [
      ["accountable", r.accountable],
      ["consulted", r.consulted],
      ["informed", r.informed],
    ] as const) {
      for (const role of list) {
        if (!roles.has(role)) {
          out.push({
            process: r.process,
            activity: r.activity,
            detail: `${kind} names "${role}", which is in no role registry`,
          });
        }
      }
    }
    for (const a of r.accountable) {
      if (r.consulted.includes(a)) {
        out.push({
          process: r.process,
          activity: r.activity,
          detail: `"${a}" is both accountable and consulted — asking yourself is not consultation`,
        });
      }
    }
  }
  return out;
}

function chart(rows: readonly RaciRow[]): string {
  const w = Math.max(24, ...rows.map((r) => r.activityName.length));
  const lines: string[] = [];
  let current = "";
  for (const r of [...rows].sort((a, b) => a.process.localeCompare(b.process))) {
    if (r.process !== current) {
      current = r.process;
      lines.push(`\n${current}`);
      lines.push(`  ${"activity".padEnd(w)}  R / A / C / I`);
    }
    const cell = [
      r.responsible ?? "—",
      r.accountable.join("+") || "—",
      r.consulted.join("+") || "—",
      r.informed.join("+") || "—",
    ].join("  /  ");
    lines.push(`  ${r.activityName.padEnd(w)}  ${cell}`);
  }
  return lines.join("\n");
}

if (import.meta.main) {
  const checkOnly = process.argv.includes("--check");
  const only = process.argv[process.argv.indexOf("--process") + 1];
  const all = await raciRows(ROOT);
  const rows = process.argv.includes("--process") ? all.filter((r) => r.process === only) : all;
  const roles = declaredRoles(ROOT);
  const diagrams = workflowFiles(ROOT).filter((f) => f.endsWith(".bpmn")).length;

  console.log(
    `RACI: ${rows.length} annotated activity(ies) across ${diagrams} diagram(s), ` +
      `against ${roles.size} declared role(s)`,
  );

  // Vacuity, stated rather than implied. With no diagrams the sweep
  // examined nothing, and "no breaches" would be a verdict about the
  // reader rather than the corpus.
  if (diagrams === 0) {
    console.error("\n✗ EXAMINED NO DIAGRAMS. This is not a pass: nothing was checked.");
    process.exit(1);
  }
  if (roles.size === 0) {
    console.error("\n✗ NO ROLE REGISTRY READABLE, so no RACI value could be resolved.");
    process.exit(1);
  }

  const breaches = raciBreaches(rows, roles);
  if (!checkOnly && rows.length > 0) console.log(chart(rows));
  if (!checkOnly && rows.length === 0) {
    // Not an error. Annotation is incremental, and a corpus that has not
    // started is a different state from one that is wrong.
    console.log("\n  No activity declares `folio:raci` yet. Nothing is wrong; nothing is claimed.");
  }

  if (breaches.length === 0) {
    console.log(
      `\n✓ every annotated activity has exactly one accountable role, and every ` +
        `role named is declared`,
    );
    process.exit(0);
  }
  console.error(`\n✗ ${breaches.length} breach(es):`);
  for (const b of breaches) console.error(`  · ${b.process} / ${b.activity}: ${b.detail}`);
  console.error(
    `\nAccountability is singular by construction — "who carries this decision" has ` +
      `one\nanswer or it has none. Fix the diagram, or drop the annotation until it ` +
      `can be\nmade truthfully. Involvement values: ${RACI_INVOLVEMENTS.join(", ")}.`,
  );
  process.exit(1);
}
