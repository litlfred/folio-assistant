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
import { existsSync, readFileSync } from "node:fs";
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

/**
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
 *
 * TWO SESSIONS FIXED THIS INDEPENDENTLY on 2026-09-20, from opposite ends —
 * one from `beans prime`'s stated hierarchy, one from `wqht`'s own claim that
 * the check "already allows epics under milestones", which it did not. The
 * corroboration is worth keeping: the same defect found twice by different
 * routes is evidence the hierarchy was genuinely unrepresentable here, not
 * that one session misread the check.
 *
 * ## The exclusion is scoped to ONE rule, and was not until 2026-09-22
 *
 * Bean `itka`. This set was applied to the whole loop:
 *
 * ```ts
 * const open = beans.filter((b) => OPEN_STATUSES.has(b.status) && !ROOT_TYPES.has(b.type ?? ""));
 * ```
 *
 * so **no epic ever entered the loop**, and the epic-under-epic branch below
 * could not be taken — measured: 0 epics among the 179 beans it ran over.
 * Meanwhile the summary line asserted *"and no epic hangs from another"*. A
 * rule that cannot fire, stated as verified, is worse than no rule: it is the
 * `xom7` shape applied to a checker, and it was found by tripping it — an epic
 * was parented to an epic and the check printed the tick over it.
 *
 * The intent was right and the SCOPE was wrong. A root is not required to
 * carry a parent; that is the only rule it is excused from. The rules about
 * the parent a bean actually declares — exists, right type, not an epic under
 * an epic — apply to roots like everything else.
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

/**
 * Epic-under-epic pairs that PREDATE the rule becoming reachable.
 *
 * The rule was dead code until 2026-09-22 (see `ROOT_TYPES`), so the corpus
 * was never held to it. Making it fire surfaced exactly **one** outstanding
 * pair, and re-homing a bean changes where somebody else's work sits in the
 * roadmap — `bean-coordination` is explicit that an outstanding defect is
 * repaired by the bean's OWNER, not by whoever ran the check.
 *
 * So the backlog is listed and a NEW pair fails, which is the shape
 * `check-bean-bodies.ts` already uses. The file may only SHRINK: an entry that
 * stops matching is reported **stale**, so a repair is noticed rather than
 * leaving a permanent excuse behind.
 */
export const BASELINE_FILE = "cat-harness/scripts/bean-parents-baseline.json";

function loadBaseline(root: string): Set<string> {
  const f = resolve(root, BASELINE_FILE);
  if (!existsSync(f)) return new Set();
  const raw = JSON.parse(readFileSync(f, "utf-8")) as { known?: string[] };
  return new Set(raw.known ?? []);
}

/** Keyed by the PAIR, so re-parenting either end stops matching. */
function nestKey(childId: string, parentId: string): string {
  return `${childId} -> ${parentId}`;
}

export interface BeanParentsReport {
  store: string | null;
  open: number;
  problems: string[];
  /** Epic-under-epic pairs the baseline already records. Listed, never failed. */
  outstanding: string[];
  /** Baseline entries nothing matched — repaired, and the baseline can shrink. */
  stale: string[];
}

export function checkBeanParents(root: string): BeanParentsReport {
  const beans = readBeans(root);
  if (beans === null) return { store: null, open: 0, problems: [], outstanding: [], stale: [] };

  const byId = new Map(beans.map((b) => [b.id, b]));

  // EVERY open bean, roots included. The root exclusion belongs to the
  // has-a-parent rule alone (below), not to the rules about the parent a bean
  // actually declares — see `ROOT_TYPES`.
  const open = beans.filter((b) => OPEN_STATUSES.has(b.status));
  const placeable = open.filter((b) => !ROOT_TYPES.has(b.type ?? ""));
  const problems: string[] = [];
  const baseline = loadBaseline(root);
  const matched = new Set<string>();
  const outstanding: string[] = [];

  for (const b of open.sort((a, c) => a.id.localeCompare(c.id))) {
    const where = `${b.id} (${b.title.slice(0, 60)})`;
    if (!b.parent) {
      // A root is not REQUIRED to carry a parent. Everything else is.
      if (ROOT_TYPES.has(b.type ?? "")) continue;
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
    } else if (b.type === "epic" && p.type === "epic") {
      // Epics nest under a GOAL, not under each other, and `beans prime`'s
      // hierarchy says so: milestone -> epic -> feature -> task/bug. Its own
      // case rather than a narrower PARENT_TYPES, because the two are not the
      // same rule — a task's parent may be an epic, and this one may not — and
      // because the message can then say WHY instead of "wrong type".
      const key = nestKey(b.id, b.parent);
      if (baseline.has(key)) {
        matched.add(key);
        outstanding.push(`${key} — ${b.title.slice(0, 60)}`);
      } else {
        problems.push(
          `${where}: an epic's parent is a \`milestone\` (a goal), not another epic — ` +
            `\`${b.parent}\` is an epic`,
        );
      }
    }
  }
  const stale = [...baseline].filter((k) => !matched.has(k)).sort();
  return { store: beanDefsDir(root), open: placeable.length, problems, outstanding: outstanding.sort(), stale };
}

function formatReport(r: BeanParentsReport): string {
  if (r.store === null) return "Bean parents\n  · no bean store — nothing to check";
  const out = [
    `Bean parents (${r.open} open, below the roadmap roots` +
      `${r.outstanding.length ? `, ${r.outstanding.length} nesting(s) baselined` : ""})`,
  ];
  if (r.problems.length === 0) {
    // NEVER the unqualified tick while the baseline holds an entry. Asserting
    // "no epic hangs from another" over a known pair is the defect this check
    // was repaired for (bean `itka`) — reproducing it one line down, in the
    // summary, would be the whole lesson missed.
    out.push(
      r.outstanding.length
        ? "  ✓ every open bean is placed under an epic or a milestone, and no NEW epic hangs from another"
        : "  ✓ every open bean is placed under an epic or a milestone, and no epic hangs from another",
    );
  } else {
    for (const p of r.problems) out.push(`  ✗ ${p}`);
    out.push("");
    out.push("  Set `parent: <epic-id>` in the bean's front matter, or open an epic for it.");
    out.push("  An epic's parent, if it has one, is the `milestone` bean for the goal it serves");
    out.push("  — skills/folio-core/todo-manager.md §\"A GOAL is a `milestone` bean\".");
    out.push("  `beans roadmap` shows the current structure.");
  }
  // Listed whether or not anything failed: a backlog that only prints on a red
  // run is invisible on exactly the days somebody would act on it.
  for (const o of r.outstanding) {
    out.push(`  · outstanding epic-under-epic (the bean OWNER's to re-home): ${o}`);
  }
  for (const k of r.stale) {
    out.push(`  · baseline entry no longer matches — repaired; remove it from ${BASELINE_FILE}: ${k}`);
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
  // A stale baseline entry fails: the file may only shrink, and an excuse left
  // behind after its defect was repaired is a permanent blind spot.
  process.exit(report.problems.length || report.stale.length ? 1 : 0);
}
