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
 */
const ROOT_TYPES = new Set(["milestone", "epic"]);

/**
 * The types a parent may have.
 *
 * An epic's parent is a milestone, a feature's is an epic, and a task's is
 * either — so all three are acceptable rather than only `epic`. Nothing
 * wider: parenting a task to a task nests the roadmap somewhere nobody looks,
 * which is the original reason this constraint exists.
 *
 * ## `feature` was missing, and that was a CONTRADICTION rather than an omission
 *
 * `itka` finding 2. This set held `{milestone, epic}`, so a task parented to a
 * FEATURE was refused — while this file's own header quotes `beans prime`'s
 * hierarchy, `milestone -> epic -> feature -> task/bug`, to justify
 * `ROOT_TYPES`. It cited the sentence and then contradicted it.
 *
 * Two readings were possible and they are not equivalent: either `feature` is
 * a real tier and this set was missing it, or `feature` is a label and the
 * hierarchy sentence was wrong. **Which one is true changes where existing
 * beans belong**, so it was not settleable by editing a checker — the owner
 * ruled 2026-09-22 that `feature` IS a tier.
 *
 * MEASURED at that ruling, and the number is why this is forward-looking
 * rather than a repair: **45 beans are typed `feature`**, every one parented
 * to an epic, and **none has a child**. So no existing bean was being refused;
 * what was refused was the shape nobody could create. A store can use a type
 * heavily and still never exercise the rule the type implies.
 */
const PARENT_TYPES = new Set(["milestone", "epic", "feature"]);

/**
 * Where each type sits in `beans prime`'s hierarchy, lower being higher up.
 *
 * Used for DIRECTION, which `PARENT_TYPES` cannot express: that set says a
 * type is allowed to be somebody's parent, not that it is allowed to be THIS
 * bean's parent. Before `feature` joined it the two questions happened to
 * coincide; they do not any more.
 *
 * A type absent here is not ranked and is not direction-checked — the rule
 * declines to judge what the hierarchy does not mention, rather than guessing
 * a position for it.
 */
const RANK: Record<string, number> = { milestone: 0, epic: 1, feature: 2, task: 3, bug: 3 };

export interface BeanParentsReport {
  store: string | null;
  open: number;
  /** Defects NOT in the baseline. These fail. */
  problems: string[];
  /** Defects the baseline already records. Listed, never failed. */
  outstanding: string[];
  /** Baseline entries nothing matched — repaired, so the baseline can shrink. */
  stale: string[];
}

/**
 * Defects that predate the rule becoming reachable.
 *
 * `itka` / issue #941: the epic-under-epic rule was structurally unreachable,
 * so the corpus was never judged against it. Making it reachable surfaces
 * what was always there — and re-parenting somebody's epic is a judgement
 * about that epic's content, not a repair the checker's author may make.
 * OUTSTANDING IS THE OWNER'S; the check's job is to stop the count growing.
 *
 * Same shape as `bean-bodies-baseline.json`, deliberately: a recorded defect
 * is listed and never fails, anything outside fails, and an entry nothing
 * matches is reported STALE so the file can only shrink.
 */
export const BASELINE_FILE = "cat-harness/scripts/bean-parents-baseline.json";

/** A defect's identity, stable across a title edit: the bean and the rule. */
const key = (id: string, rule: string): string => `${rule}:${id}`;

function loadBaseline(root: string): Set<string> {
  const f = resolve(root, BASELINE_FILE);
  if (!existsSync(f)) return new Set();
  const raw: unknown = JSON.parse(readFileSync(f, "utf-8"));
  const entries = (raw as { outstanding?: unknown }).outstanding;
  return new Set(Array.isArray(entries) ? entries.filter((e): e is string => typeof e === "string") : []);
}

export function checkBeanParents(root: string): BeanParentsReport {
  const beans = readBeans(root);
  if (beans === null) return { store: null, open: 0, problems: [], outstanding: [], stale: [] };

  const byId = new Map(beans.map((b) => [b.id, b]));
  /* EVERY open bean, roots included — `itka`, issue #941.
   *
   * This filtered `ROOT_TYPES` out here, which made the epic-under-epic rule
   * below STRUCTURALLY UNREACHABLE: no `b` in the loop was ever an epic, so
   * the branch could not be taken, and the summary printed it as verified.
   * A rule nothing can reach, asserted as checked, is worse than no rule.
   *
   * The exclusion's intent is right and is documented on `ROOT_TYPES`: a root
   * is not REQUIRED to carry a parent. It was applied one scope too wide —
   * removing roots from every rule rather than from that one. It now lives on
   * the has-a-parent branch alone, so a root that DOES carry a parent is
   * judged on it like anything else.
   */
  const open = beans.filter((b) => OPEN_STATUSES.has(b.status));
  /** The non-roots, which is what "below the roadmap roots" counts. */
  const placed = open.filter((b) => !ROOT_TYPES.has(b.type ?? ""));
  const found: { key: string; message: string }[] = [];

  for (const b of open.sort((a, c) => a.id.localeCompare(c.id))) {
    const where = `${b.id} (${b.title.slice(0, 60)})`;
    if (!b.parent) {
      // A ROOT NEED NOT HAVE ONE. This is the whole of what the exclusion
      // was for, and now the whole of where it applies.
      if (ROOT_TYPES.has(b.type ?? "")) continue;
      found.push({
        key: key(b.id, "no-parent"),
        message: `${where}: open with no \`parent\` — it lands in the roadmap's Miscellaneous section`,
      });
      continue;
    }
    const p = byId.get(b.parent);
    if (!p) {
      found.push({
        key: key(b.id, "parent-missing"),
        message: `${where}: \`parent: ${b.parent}\` names no bean — the roadmap omits this child entirely`,
      });
    } else if (!PARENT_TYPES.has(p.type ?? "")) {
      found.push({
        key: key(b.id, "parent-type"),
        message: `${where}: \`parent: ${b.parent}\` is a ${p.type || "bean with no type"}, not a milestone, epic or feature`,
      });
    } else if (RANK[b.type ?? ""] !== undefined && RANK[p.type ?? ""] !== undefined && RANK[p.type ?? ""]! >= RANK[b.type ?? ""]! && !(b.type === "epic" && p.type === "epic")) {
      // ADDING `feature` TO `PARENT_TYPES` WIDENS MORE THAN IT LOOKS. On its
      // own it would also permit an epic hanging from a feature, and a feature
      // nesting inside a feature — an INVERTED hierarchy, silently, because
      // every such parent has an allowed type.
      //
      // So the direction is checked rather than only the type: a parent must
      // sit strictly HIGHER than its child. That subsumes epic-under-epic,
      // which keeps its own branch below purely so its baseline key and its
      // specific wording survive; without that, `d308`'s recorded entry would
      // stop matching and be reported stale by a change that repaired nothing.
      found.push({
        key: key(b.id, "parent-not-higher"),
        message:
          `${where}: a \`${b.type}\` hangs below a \`${p.type}\` in ` +
          "`milestone -> epic -> feature -> task/bug`, so `" +
          `${b.parent}\` cannot be its parent`,
      });
    } else if (b.type === "epic" && p.type === "epic") {
      // Epics nest under a GOAL, not under each other, and `beans prime`'s
      // hierarchy says so: milestone -> epic -> feature -> task/bug. Its own
      // case rather than a narrower PARENT_TYPES, because the two are not the
      // same rule — a task's parent may be an epic, and this one may not — and
      // because the message can then say WHY instead of "wrong type".
      found.push({
        key: key(b.id, "epic-under-epic"),
        message:
          `${where}: an epic's parent is a \`milestone\` (a goal), not another epic — ` +
          `\`${b.parent}\` is an epic`,
      });
    }
  }
  const baseline = loadBaseline(root);
  const matched = new Set(found.map((f) => f.key).filter((k) => baseline.has(k)));
  return {
    store: beanDefsDir(root),
    open: placed.length,
    problems: found.filter((f) => !baseline.has(f.key)).map((f) => f.message),
    outstanding: found.filter((f) => baseline.has(f.key)).map((f) => f.message),
    stale: [...baseline].filter((k) => !matched.has(k)).sort(),
  };
}

/**
 * Exported so the SUMMARY LINE can be tested, which is where this check's
 * worst failure lived: not a wrong verdict, a correct verdict reported as a
 * stronger claim than it was. An exit code cannot carry that, so nothing
 * caught it until somebody read two adjacent lines.
 */
export function formatReport(r: BeanParentsReport): string {
  if (r.store === null) return "Bean parents\n  · no bean store — nothing to check";
  const out = [`Bean parents (${r.open} open, below the roadmap roots)`];
  if (r.problems.length === 0) {
    /* THE CLAIM IS EARNED ONLY WHEN THE BASELINE IS EMPTY.
     *
     * Making the rule reachable (`itka`, #941) was necessary and not
     * sufficient: with `d308` recorded, this printed
     *
     *   ✓ ... and no epic hangs from another
     *   · outstanding (baselined): ... `folio-assistant-zzmr` is an epic
     *
     * — a universal asserted on one line and refuted on the next. That is the
     * defect this check was repaired FOR, surviving inside the repair, and it
     * is why "no NEW" is not pedantry: a reader who stops at the tick is
     * entitled to believe it.
     */
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
  /* LISTED, NEVER FAILED, and never silent either. A defect the baseline
   * records is still shown: hiding it would make "nobody has fixed this" and
   * "there is nothing here" the same output, which is the disease this whole
   * check exists to treat. */
  for (const o of r.outstanding) out.push(`  · outstanding (baselined): ${o}`);
  /* A BASELINE ENTRY NOTHING MATCHED means somebody repaired it, so the file
   * must shrink. Left in place it would licence the defect's return. */
  for (const k of r.stale) out.push(`  ✗ baseline entry \`${k}\` matches nothing — remove it from ${BASELINE_FILE}`);
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
  process.exit(report.problems.length || report.stale.length ? 1 : 0);
}
