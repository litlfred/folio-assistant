#!/usr/bin/env bun
/**
 * A bean's STATUS must agree with its own subtree — and the stale-claim sweep.
 *
 * ```sh
 * bun run check:bean-rollup            # the gate
 * bun run check:bean-rollup -- --sweep # + the claim-age report (never fails)
 * bun run check:bean-rollup -- --json
 * ```
 *
 * Bean `kpcl`, issue #956. `in-progress` is the status every sibling session
 * reads before deciding whether a bean is free, and on 2026-09-22 it carried
 * almost no information: **99 in-progress, 77 untouched for a day or more**.
 *
 * ## The obvious sweep is wrong, and the measurement says so
 *
 * The reading that suggests itself — *76 abandoned claims, release them* —
 * assumes its own answer. Partitioning those 77 by what the claim actually
 * ASSERTS (measured 2026-09-22T18:45Z, `beans list --json` plus 325 PRs from
 * the REST API, 25 of them open):
 *
 * | bucket | n | what `in-progress` means there |
 * |---|---|---|
 * | container (≥1 child) with an open child | **16** | the claim is **TRUE** |
 * | container with no open child | 9 | reviewable — but see below |
 * | leaf named by an OPEN PR | 10 | live work, mid-flight |
 * | leaf named by no open PR | **42** | the candidate set |
 *
 * **35 of the 77 are not stale claims at all.** Nobody edits a milestone when
 * one of its children moves, so a container's `updated_at` measures EDITING
 * and the sweep read it as LIVENESS. The headline number was an instrument
 * that did not tell the truth about the instrument that did not tell the
 * truth.
 *
 * And the nine were a second false reading in the same pass: every one of them
 * has **zero children**, so "no open child" was vacuous — they are leaves that
 * happen to be typed `feature`. {@link rollupFindings} therefore requires
 * `children.length > 0` before it judges a container at all.
 *
 * ## What the GATE checks, and why it owns no clock
 *
 * `beans.ts` §`beanFindings` declines a stale-`in-progress` finding for a
 * reason that binds here too: anything computed against the clock changes on
 * every run. There it would rewrite a committed projection forever; here it
 * would turn CI red at an arbitrary hour with nobody having changed anything —
 * a gate firing for reasons unrelated to the change, which is `1xhc`'s own
 * complaint pointed backwards.
 *
 * So the gate is the half that is **pure graph**: a bean's status against its
 * children's. Two directions, both self-refuting without reference to a date:
 *
 * | rule | the contradiction |
 * |---|---|
 * | `open-container-closed-subtree` | open, has children, **none** open — it asserts live work its own subtree denies |
 * | `closed-container-open-subtree` | closed, and **some** child is open — the roadmap reads the area as finished |
 * | `open-leaf-complete-checklist` | open, no children, **every** box ticked — its own BODY says there is nothing left |
 *
 * The third was added 2026-09-24, by a bean the first two could not see.
 * `iumj` sat `in-progress` in the candidate set of the very sweep below —
 * untouched, no open PR — and was neither abandoned nor blocked: it was
 * **finished and never closed**, its work landed in #1043 and its guard green.
 * The container rules judge a bean against its SUBTREE, and a leaf has none, so
 * the instrument written to make `in-progress` mean something was blind to the
 * commonest way it lies.
 *
 * Measured on the store the day this shipped: **0** and **1**; the third
 * fires on **3** of 243 open beans, which is a finding about three specific
 * beans rather than a wall somebody switches off — the ratio `beans.ts` names
 * when it keeps `blocked-without-expiry` at 4 of 239. One of the three was
 * closed on re-derived evidence and two are baselined, both belonging to other
 * streams. The original `1` was `5a3l` (DEPLOYMENT), `completed` with **12**
 * open children — baselined,
 * because whether those twelve are unfinished work or should be re-parented is
 * a judgement about `5a3l`, and that belongs to its owner.
 *
 * A rule that fires on nothing is not a rule with no value: `check-bean-parents`
 * calls that shape *locking in a property the corpus HAS rather than demanding
 * work to reach one*, and the first direction is exactly that.
 *
 * ## What `--sweep` reports, and what it refuses to conclude
 *
 * The sweep carries the clock, so it **never sets the exit code**. It also
 * does not pretend to know a leaf's liveness from the store: a leaf claim is
 * held by a session, a branch or a PR, and none of those is committed here.
 * Without `--github` the leaf buckets are reported as one **unjudged** group,
 * on `check-ci-health`'s rule that *could-not-check is never green* — inverted
 * to its equally load-bearing form: could-not-check is never GUILTY either.
 *
 * `--github` (needs `GH_TOKEN`) asks the API for open PRs and splits the
 * leaves by whether one names the bean. That is a fact GitHub holds ABOUT this
 * repository rather than one the repository holds, so it is asked every run
 * and cached nowhere.
 *
 * ## What it does NOT claim
 *
 * A leaf with no open PR is a **candidate**, never a verdict. The falsifier
 * for the whole sweep is that such a bean is real work on an unpushed branch,
 * in which case the answer is `bean-blocking`'s four-field record rather than
 * a release — and `check:bean-blocks` (#951) owns that form. Nothing here
 * changes a status, and nothing here deletes a bean: unwanted work is
 * `scrapped`, with its reasons.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { beanDefsDir, isOpen, readBeans, type BeanNode } from "./beans.ts";

/** Where the accepted-for-now contradictions are recorded. */
export const BASELINE_FILE = "cat-harness/scripts/bean-rollup-baseline.json";

/** Ages the sweep buckets by, in days. Reported, never failed on. */
const STALE_DAYS = 1;

export interface RollupFinding {
  /** `<rule>:<bean-id>` — stable across a title edit, because a title is prose. */
  key: string;
  kind: "open-container-closed-subtree" | "closed-container-open-subtree" | "open-leaf-complete-checklist";
  bean: string;
  message: string;
}

export interface SweepBucket {
  /** `container-live`, `container-childless`, `leaf-open-pr`, `leaf-no-open-pr`, `leaf-unjudged`. */
  name: string;
  /** What `in-progress` asserts for the beans in here, in one line. */
  reading: string;
  beans: string[];
}

export interface BeanRollupReport {
  /** The store directory, or `null` when this instance declares none. */
  store: string | null;
  /** Open beans considered. */
  open: number;
  problems: string[];
  outstanding: string[];
  /** Baseline keys nothing matched — a repair that left its licence behind. */
  stale: string[];
  /** Present only with `--sweep`. Never contributes to the exit code. */
  sweep: {
    inProgress: number;
    untouchedDays: number;
    untouched: number;
    /** False when the leaf split could not be made — reported, not guessed. */
    githubConsulted: boolean;
    buckets: SweepBucket[];
  } | null;
}

/**
 * Every `- [ ]` / `- [x]` item in a bean's body, as the tick characters.
 *
 * Deliberately not a markdown parse: the store writes one shape, and a reader
 * that accepted more would disagree with `check:bean-bodies`, which finds the
 * same items the same way. Two readers of one structure with different keys is
 * the `nytj` family.
 */
export function checklist(body: string): string[] {
  return [...body.matchAll(/^\s*-\s\[( |x|X)\]/gm)].map((m) => m[1]!);
}

/** Bean id → the ids naming it as `parent`. Built once; inverting it wrongly is silent. */
export function childrenOf(beans: BeanNode[]): Map<string, BeanNode[]> {
  const out = new Map<string, BeanNode[]>();
  for (const b of beans) {
    if (!b.parent) continue;
    const at = out.get(b.parent);
    if (at) at.push(b);
    else out.set(b.parent, [b]);
  }
  return out;
}

/**
 * The clock-free half: a status its own subtree refutes.
 *
 * **`children.length > 0` is the load-bearing guard**, not a micro-optimisation.
 * Without it "no open child" is true of every leaf in the store, and the first
 * pass of this sweep duly reported nine `feature` beans with no children at all
 * as containers whose work was done.
 */
export function rollupFindings(beans: BeanNode[]): RollupFinding[] {
  const kids = childrenOf(beans);
  const out: RollupFinding[] = [];
  for (const b of beans) {
    const children = kids.get(b.id) ?? [];
    /* THE LEAF RULE — a status its own BODY refutes, where the two above are
     * about a status its SUBTREE refutes. Same shape, one level down, and
     * clock-free for the same reason.
     *
     * Leaves only, and the filter is load-bearing rather than tidy: `5a3l` has
     * every box in its own checklist ticked AND twelve open children, so on a
     * container "all ticked" means nothing — its subtree is what says whether
     * the work is done, which is what the two rules above already ask. Without
     * this filter the rule reports the one bean the gate already handles
     * correctly, in the opposite direction.
     *
     * Measured 2026-09-23 over 243 open beans: 4 with every box ticked, of
     * which 1 is `5a3l` and excluded here, leaving 3. A finding about three
     * specific beans rather than a wall somebody switches off — the ratio
     * `beans.ts` names when it keeps `blocked-without-expiry` at 4 of 239.
     *
     * It does NOT say "close this bean". Closing is the owner's act on
     * evidence, never a gate's demand, and `ready-to-close` exists for the
     * case the evidence cannot be re-derived. It says the bean's own body and
     * its status disagree, which is a fact rather than an instruction — and
     * adding the box that is actually still open is as good an answer as
     * closing it. */
    if (children.length === 0) {
      const ticks = checklist(b.body);
      if (isOpen(b) && ticks.length > 0 && ticks.every((t) => t.toLowerCase() === "x")) {
        out.push({
          key: `open-leaf-complete-checklist:${b.id}`,
          kind: "open-leaf-complete-checklist",
          bean: b.id,
          message:
            `${b.id} (${b.title.slice(0, 60)}): \`${b.status}\` with all ` +
            `${ticks.length} checklist item(s) ticked and no children — its own body says ` +
            `there is nothing left. Close it on evidence, or add the box that is still open`,
        });
      }
      continue;
    }
    const open = children.filter(isOpen);
    if (isOpen(b) && open.length === 0) {
      out.push({
        key: `open-container-closed-subtree:${b.id}`,
        kind: "open-container-closed-subtree",
        bean: b.id,
        message:
          `${b.id} (${b.title.slice(0, 60)}): \`${b.status}\` over ${children.length} ` +
          `child(ren), none of them open — it asserts live work its own subtree denies`,
      });
    }
    if (!isOpen(b) && open.length > 0) {
      out.push({
        key: `closed-container-open-subtree:${b.id}`,
        kind: "closed-container-open-subtree",
        bean: b.id,
        message:
          `${b.id} (${b.title.slice(0, 60)}): \`${b.status}\` with ${open.length} open ` +
          `child(ren) — the roadmap reads this area as finished while the work is not`,
      });
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

function loadBaseline(root: string): Set<string> {
  const file = join(root, BASELINE_FILE);
  if (!existsSync(file)) return new Set();
  const entries = (JSON.parse(readFileSync(file, "utf-8")) as { outstanding?: unknown }).outstanding;
  return new Set(Array.isArray(entries) ? entries.filter((e): e is string => typeof e === "string") : []);
}

/** Days since a bean's `updated_at`, or `null` when it states none. */
export function ageDays(b: BeanNode, now: Date): number | null {
  if (!b.updatedAt) return null;
  const t = Date.parse(b.updatedAt);
  return Number.isNaN(t) ? null : (now.getTime() - t) / 86_400_000;
}

/**
 * The clock-carrying half. `openPrBeans` is `null` when GitHub was not asked —
 * which is reported as **unjudged**, never as a verdict either way.
 */
export function sweep(
  beans: BeanNode[],
  now: Date,
  openPrBeans: Set<string> | null,
): NonNullable<BeanRollupReport["sweep"]> {
  const kids = childrenOf(beans);
  const claims = beans.filter((b) => b.status === "in-progress");
  const untouched = claims.filter((b) => (ageDays(b, now) ?? 0) >= STALE_DAYS);
  const named = (b: BeanNode) => `${b.id.replace(/^folio-assistant-/, "")} (${(ageDays(b, now) ?? 0).toFixed(1)}d)`;

  const container: BeanNode[] = [];
  const childless: BeanNode[] = [];
  const leaves: BeanNode[] = [];
  for (const b of untouched) {
    const children = kids.get(b.id) ?? [];
    if (children.length === 0) leaves.push(b);
    else if (children.some(isOpen)) container.push(b);
    else childless.push(b);
  }

  const buckets: SweepBucket[] = [
    {
      name: "container-live",
      reading: "the claim is TRUE — an open child is carrying it; `updated_at` measures editing, not liveness",
      beans: container.map(named),
    },
    {
      name: "container-subtree-closed",
      reading: "every child is closed — the gate above fails on this, it is not a sweep matter",
      beans: childless.map(named),
    },
  ];
  if (openPrBeans === null) {
    buckets.push({
      name: "leaf-unjudged",
      reading:
        "no session, branch or PR is visible from the store, so liveness is UNJUDGED — " +
        "pass --github to split these; unjudged is not stale",
      beans: leaves.map(named),
    });
  } else {
    buckets.push(
      {
        name: "leaf-open-pr",
        reading: "an open PR names this bean — live work, mid-flight",
        beans: leaves.filter((b) => openPrBeans.has(b.id)).map(named),
      },
      {
        name: "leaf-no-open-pr",
        reading:
          "no open PR names it — a CANDIDATE for release, re-claim or a `## Blocked on` record, never a verdict",
        beans: leaves.filter((b) => !openPrBeans.has(b.id)).map(named),
      },
    );
  }
  return {
    inProgress: claims.length,
    untouchedDays: STALE_DAYS,
    untouched: untouched.length,
    githubConsulted: openPrBeans !== null,
    buckets,
  };
}

/**
 * Bean ids named by the title, body or branch of an open PR.
 *
 * Word-bounded on the short id, which is how every PR body here writes one.
 * Returns `null` on any failure — a network error is *unjudged*, and rendering
 * it as "no PR names this bean" would convict 42 beans of the API being down.
 */
export async function openPrBeanIds(beans: BeanNode[], token: string | undefined): Promise<Set<string> | null> {
  if (!token) return null;
  try {
    const res = await fetch(
      "https://api.github.com/repos/litlfred/folio-assistant/pulls?state=open&per_page=100",
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) return null;
    const prs = (await res.json()) as Array<{ title: string; body: string | null; head: { ref: string } }>;
    const text = prs.map((p) => `${p.title}\n${p.body ?? ""}\n${p.head.ref}`).join("\n");
    const out = new Set<string>();
    for (const b of beans) {
      const short = b.id.replace(/^folio-assistant-/, "");
      if (new RegExp(`\\b${short}\\b`).test(text)) out.add(b.id);
    }
    return out;
  } catch {
    return null;
  }
}

export async function checkBeanRollup(
  root: string,
  opts: { sweep?: boolean; github?: boolean; now?: Date } = {},
): Promise<BeanRollupReport> {
  const beans = readBeans(root);
  if (beans === null) return { store: null, open: 0, problems: [], outstanding: [], stale: [], sweep: null };
  const found = rollupFindings(beans);
  const baseline = loadBaseline(root);
  const matched = new Set(found.map((f) => f.key).filter((k) => baseline.has(k)));
  return {
    store: beanDefsDir(root),
    open: beans.filter(isOpen).length,
    problems: found.filter((f) => !baseline.has(f.key)).map((f) => f.message),
    outstanding: found.filter((f) => baseline.has(f.key)).map((f) => f.message),
    stale: [...baseline].filter((k) => !matched.has(k)).sort(),
    sweep: opts.sweep
      ? sweep(beans, opts.now ?? new Date(), opts.github ? await openPrBeanIds(beans, process.env.GH_TOKEN) : null)
      : null,
  };
}

function formatReport(r: BeanRollupReport): string {
  if (r.store === null) return "Bean rollup\n  · no bean store — nothing to check";
  const out = [`Bean rollup (${r.open} open)`];
  if (r.problems.length === 0) {
    out.push("  ✓ no bean's status is refuted by its own children");
  } else {
    for (const p of r.problems) out.push(`  ✗ ${p}`);
    out.push("");
    /* THE REMEDY DEPENDS ON THE RULE, and one footer for three rules told a
     * reader with a ticked-out leaf to "re-parent the children" it does not
     * have. A remediation line that does not fit the finding is read as noise,
     * and then so is the finding. */
    if (r.problems.some((p) => p.includes("checklist item(s) ticked"))) {
      out.push("  A ticked-out bean: close it ON EVIDENCE — re-derived, not taken from its own");
      out.push("  notes — or add the box that is actually still open. `ready-to-close` is for the");
      out.push("  case the evidence cannot be re-derived; it is not a parking space.");
    }
    if (r.problems.some((p) => p.includes("child(ren)"))) {
      out.push("  A container: close it, or re-open / re-parent the children that disagree with it.");
    }
    out.push("  Never delete a bean — unwanted work is `scrapped`, with its reasons.");
  }
  // Listed, never failed, and never silent: hiding a baselined defect makes
  // "nobody has fixed this" and "there is nothing here" the same output.
  for (const o of r.outstanding) out.push(`  · outstanding (baselined): ${o}`);
  for (const k of r.stale) out.push(`  ✗ baseline entry \`${k}\` matches nothing — remove it from ${BASELINE_FILE}`);
  if (r.sweep) {
    const s = r.sweep;
    out.push("");
    out.push(
      `  Claim sweep — ${s.inProgress} in-progress, ${s.untouched} untouched for ≥ ${s.untouchedDays}d ` +
        `(reported, never failed on: this half carries a clock)`,
    );
    if (!s.githubConsulted) out.push("  · GitHub not consulted — leaf liveness is UNJUDGED, which is not stale");
    for (const b of s.buckets) {
      out.push(`    ${b.name}: ${b.beans.length} — ${b.reading}`);
      if (b.beans.length) out.push(`      ${b.beans.join(", ")}`);
    }
  }
  return out.join("\n");
}

if (import.meta.main) {
  let report: BeanRollupReport;
  try {
    report = await checkBeanRollup(resolve("."), {
      sweep: process.argv.includes("--sweep"),
      github: process.argv.includes("--github"),
    });
  } catch (e) {
    console.error(`Could not check bean rollup: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  // The sweep is deliberately absent from this expression.
  process.exit(report.problems.length || report.stale.length ? 1 : 0);
}
