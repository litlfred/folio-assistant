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
 * ## The rule is ALSO a kg-audit criterion, and that is not two implementations
 *
 * Bean `3kbd`. Until 2026-09-20 a breach was only ever PRINTED, and
 * `kg-audit`'s own rationale says why that is not enough: a printed verdict
 * is gone when the job ends, which makes *"unsound since the diagram was
 * drawn"* and *"broken in the commit under review"* indistinguishable. The
 * three rules below are now committed sidecar criteria too —
 * `raci-role-resolves`, `raci-single-accountable` and
 * `raci-accountable-not-consulted`.
 *
 * **`raciBreaches` stays the only implementation.** It tags each breach with
 * its kind and `kg-audit` partitions on the tag; nothing re-derives the rule.
 * A second copy would be a second answer to "is this chart sound", free to
 * disagree with the first — the drift `85e8` and the retired `roles:` field
 * both cost.
 *
 * **Why `check:raci` survives anyway.** Severity is a repo-wide policy:
 * `kg:audit --check` fails on `critical`, and only `raci-role-resolves` is
 * critical (it is a DANGLING REF — `role-ref-resolves` on another edge). The
 * other two are `major`, which by that policy does not gate. But the owner
 * asked for exactly one Accountable *enforced*, so dropping this gate would
 * silently downgrade the one rule that was explicitly requested. It is kept
 * as a DELIBERATE, documented exception to the severity policy rather than
 * as a duplicate of it — one rule, two consumers, different gating.
 *
 * Usage:
 *   bun run raci                     # the chart, every process
 *   bun run raci -- --process <id>   # one process
 *   bun run check:raci               # the rule only, exit non-zero on a breach
 *   bun run kg:audit                 # the same rule, written to sidecars
 *
 * @module scripts/raci-chart
 */
import { resolve } from "node:path";

import { workflowFiles, kgRoots } from "./known-skills.js";
import { readRoleGraph } from "../schemas/role-graph.js";
import {
  INVOLVEMENT_VOCABULARIES,
  isActivity,
  loadProcessModel,
  RACI_INVOLVEMENTS,
  type InvolvementVocabulary,
} from "../src/workflow/process-model.js";
import type { ProcessNode, RaciInvolvement } from "../src/workflow/process-model.js";

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
  /**
   * RASCI's fifth letter: roles that do work on the activity without owning
   * the deliverable. Always empty in a `raci` process — a `supportive` there
   * is an `involvement-unknown` breach, not a quietly-accepted extra column.
   */
  supportive: string[];
  /** Declared involvements the process's vocabulary does not admit. */
  unknown: { role: string; involvement: string }[];
  /** Which vocabulary the row was judged against, so a finding can name it. */
  vocabulary: InvolvementVocabulary;
}

/**
 * Which rule a breach broke.
 *
 * Tagged rather than flat so `kg-audit` can partition one implementation into
 * three criteria with three severities. The registry grades every DANGLING
 * reference `critical` and every structural gap `major`, and RACI has both:
 * `role-undeclared` is `role-ref-resolves` on a different edge, while the
 * other two are gaps between roles that all exist.
 */
export type RaciBreachKind =
  | "accountable-count"
  | "role-undeclared"
  | "accountable-also-consulted"
  /**
   * A declared `involvement` the process's vocabulary does not admit — a
   * typo, or `supportive` in a four-letter process.
   *
   * The comment at the filter in `process-model.ts` said THIS script reported
   * these. It never did: the filter runs during parsing, so the rejects were
   * gone before any row was built. Added 2026-09-23 with the fifth letter,
   * because a vocabulary is only a choice if choosing the other one is
   * refused.
   */
  | "involvement-unknown";

export interface RaciBreach {
  process: string;
  activity: string;
  kind: RaciBreachKind;
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

/**
 * One process's rows. Activities with no RACI declaration are omitted.
 *
 * Split out from `raciRows` so `kg-audit` can build them from the model it
 * has ALREADY loaded. Re-reading the diagram there would be a second parse of
 * the same file free to disagree with the first — and the sidecar records a
 * content hash of that file, so the two answers would be filed under one hash.
 */
export function raciRowsOf(model: {
  id: string;
  nodes: Map<string, ProcessNode>;
  involvementVocabulary?: InvolvementVocabulary;
}): RaciRow[] {
  const rows: RaciRow[] = [];
  for (const n of [...model.nodes.values()].filter(isActivity)) {
    // `n.raci.length === 0` ALONE was the skip, and it is the silent drop in
    // its purest form: an activity whose every involvement is a typo has an
    // empty `raci`, so it was passed over as unannotated. It is not
    // unannotated — it is annotated wrongly, which is the case most worth
    // reporting.
    if (n.raci.length === 0 && n.raciUnknown.length === 0) continue;
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
      supportive: of("supportive"),
      unknown: n.raciUnknown,
      vocabulary: model.involvementVocabulary ?? "raci",
    });
  }
  return rows;
}

/** Build the chart across every diagram the declaration names. */
export async function raciRows(root: string = ROOT): Promise<RaciRow[]> {
  const rows: RaciRow[] = [];
  for (const file of workflowFiles(root).filter((f) => f.endsWith(".bpmn"))) {
    rows.push(...raciRowsOf(await loadProcessModel(file)));
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
        kind: "accountable-count",
        detail:
          r.accountable.length === 0
            ? "declares RACI but no `accountable` — a half-annotated activity is worse than an unannotated one, because the chart looks complete"
            : `declares ${r.accountable.length} accountable roles (${r.accountable.join(", ")}) — exactly one carries the decision`,
      });
    }
    for (const u of r.unknown) {
      out.push({
        process: r.process,
        activity: r.activity,
        kind: "involvement-unknown",
        detail:
          `"${u.role}" is declared involvement="${u.involvement}", which the \`${r.vocabulary}\` ` +
          `vocabulary does not admit (${INVOLVEMENT_VOCABULARIES[r.vocabulary].join(", ")}). ` +
          `It was NOT coerced to a neighbouring letter and NOT silently dropped. ` +
          (u.involvement === "supportive"
            ? "`supportive` is RASCI's fifth letter — declare `<folio:involvement vocabulary=\"rasci\"/>` on the process to use it."
            : "Fix the spelling, or drop the annotation until it can be made truthfully."),
      });
    }
    for (const [kind, list] of [
      ["accountable", r.accountable],
      ["consulted", r.consulted],
      ["informed", r.informed],
      ["supportive", r.supportive],
    ] as const) {
      for (const role of list) {
        if (!roles.has(role)) {
          out.push({
            process: r.process,
            activity: r.activity,
            kind: "role-undeclared",
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
          kind: "accountable-also-consulted",
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
