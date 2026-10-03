#!/usr/bin/env bun
/**
 * How far is this repository from the separation point — "an MVP of the active
 * feature set, just shy of seeding the repos"?
 *
 * @module scripts/mvp-status
 * @graphNode none — a read-only report over git, the bean store and the forge
 * @covers none — a merge-steward report: it inventories, it judges no declared graph
 *
 * ## Why a tool and not a paragraph
 *
 * The owner asked, 2026-10-03, for *"a status bar we can regularly refresh with
 * stats on how far we are from MVP = just shy of seeding repos"*. The reason
 * that cannot be a written answer is that every number in it moved within one
 * session: the authored-conflict count changed with each merge, three epics
 * were created inside a nine-hour window, and the seeding gate halved when one
 * PR landed. A paragraph would be wrong by the time it was read, and a count
 * quoted from prose is a claim rather than evidence.
 *
 * ## It COMPOSES the existing measurements — it does not take new ones
 *
 * Every gate below delegates:
 *
 * - `pathClass` from `merge-pipeline-paths.ts` decides generated vs authored,
 *   so this cannot disagree with `merge:train`, `merge:overlap` or
 *   `beans:rollover` about what "authored" means;
 * - `check:head-has-run` answers whether a head carries the runs it owes,
 *   including the three causes of an absent run — invoked as a subprocess and
 *   read by EXIT CODE, because its own contract already distinguishes
 *   could-not-ask (2) from missing-a-required-run (1);
 * - `beans:rollover --json` answers the bean-rollover gate, read from its
 *   structured summary rather than from its printed table — the first version
 *   of that gate scraped the table and matched a per-PR line instead of the
 *   summary, reporting `clear` off a plausible wrong number.
 *
 * A second reconciliation of any of these would be a second answer free to
 * disagree with the first, which `github-state-inspection` says outright and
 * this repository has paid for repeatedly.
 *
 * ## Four states per gate, and the fourth is never a pass
 *
 * | state | meaning |
 * |---|---|
 * | `clear` | the gate's value has reached its target |
 * | `blocked` | it has not, and the blocker is named |
 * | `reported` | measured on purpose but NOT graded — a rate, not a threshold |
 * | `could-not-determine` | the question could not be answered. **Never counted clear** |
 *
 * `reported` exists because two of the most informative numbers here are rates
 * rather than thresholds. "Beans created in the window" has no target: a high
 * value means scope is still arriving, which is a fact about the plan and not a
 * defect to drive to zero. Grading it would invite someone to stop writing
 * beans, which is the opposite of what it is for. The repository already draws
 * this line — `audit:coverage` reports its counts and deliberately does not
 * grade the share (bean `3yi4`).
 *
 * ## Every threshold carries its BASIS, structurally
 *
 * Each gate declares `basis`: where its target comes from. The health checks
 * made this a requirement of the shape rather than a convention, so that a
 * check cannot ship a bare number. A target with no basis is somebody's
 * preference wearing a measurement's clothes.
 *
 * ## It is NOT a committed sidecar, on purpose
 *
 * The usual rule here is that a printed verdict cannot tell "never measured"
 * from "measured clean", so results are committed. This one is the documented
 * exception: every value is a function of the OPEN PRs and the current head, so
 * a committed copy would change on every commit and every merge — bean `do70`,
 * a recorded value that moves on every commit, which makes every diff noisy and
 * every merge conflict. The audit-coverage argument does not apply either,
 * because there is no "never audited" state to protect: a gate that cannot be
 * answered reports `could-not-determine` in the run itself.
 *
 * So: printed for a person, `--json` for a dashboard that renders it.
 *
 * Usage:
 *   bun run mvp:status                  # the table
 *   bun run mvp:status -- --json        # the same, as JSON on stdout
 *   bun run mvp:status -- --window 9    # the "active" window in hours (default 9)
 *   bun run mvp:status -- --no-fetch    # skip the fetch (faster, may be stale)
 *   bun run mvp:status -- --skip gate-evidence   # omit a slow gate
 *
 * Exit 0 every gate clear · 1 at least one blocked · 2 at least one
 * could-not-determine (which outranks blocked: a sweep blind on one gate has
 * not cleared the others).
 */
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import { readdirSync, readFileSync } from "node:fs";

import { git } from "./merge-pipeline-git.ts";
import { pathClass } from "./merge-pipeline-paths.ts";
import { repoRootFor } from "../schemas/cat-harness.ts";
import { beanDefsDir } from "./beans.ts";

const ROOT = repoRootFor(join(import.meta.dir, ".."));
const REPO = "litlfred/folio-assistant";

export type GateState = "clear" | "blocked" | "reported" | "could-not-determine";

export interface Gate {
  id: string;
  /** The question, as a person would ask it. */
  question: string;
  state: GateState;
  /** The measured value, rendered for a reader. */
  value: string;
  /** What the value must reach to be `clear`; absent for a `reported` gate. */
  target?: string;
  /** WHERE the target comes from. A target without this is a preference. */
  basis: string;
  /** Named blockers, when the gate is blocked — never a bare count. */
  detail?: string[];
}

interface Pr {
  number: number;
  ref: string;
  sha: string;
  draft: boolean;
  labels: string[];
  pushedAt: string;
}

/** The open PRs, or undefined when the forge could not be asked. */
function openPrs(): Pr[] | undefined {
  const r = spawnSync("gh", ["api", `repos/${REPO}/pulls?state=open&per_page=100`], {
    encoding: "utf-8",
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) return undefined;
  try {
    const d = JSON.parse(r.stdout) as Array<{
      number: number;
      draft: boolean;
      head: { ref: string; sha: string };
      labels: Array<{ name: string }>;
      updated_at: string;
    }>;
    return d.map((p) => ({
      number: p.number,
      ref: p.head.ref,
      sha: p.head.sha,
      draft: p.draft,
      labels: p.labels.map((l) => l.name),
      pushedAt: p.updated_at,
    }));
  } catch {
    return undefined;
  }
}

/**
 * The conflicting paths of `sha` against the base, split by class.
 *
 * `git merge-tree --write-tree` exit codes are the whole contract: 0 clean,
 * 1 CONFLICT, and **>=2 an ERROR which is not clean** — an unfetched sha or an
 * orphan branch errors, and the error text contains no "CONFLICT", so reading
 * it as clean is the trap this repository has hit three separate ways.
 */
function conflicts(base: string, sha: string): { authored: string[]; generated: number } | undefined {
  const r = git(ROOT, ["merge-tree", "--write-tree", "--name-only", "--no-messages", base, sha]);
  if (r.code === 0) return { authored: [], generated: 0 };
  if (r.code !== 1) return undefined;
  const lines = r.out.split("\n").filter(Boolean).slice(1);
  const authored: string[] = [];
  let generated = 0;
  for (const p of new Set(lines)) {
    if (pathClass(p).class === "authored") authored.push(p);
    else generated++;
  }
  return { authored, generated };
}

/**
 * The bean store, through its declaration rather than a spelled `beans/defs`
 * (bean `gz47`). `undefined` when no bean-defs node is declared: every reader
 * below then reports could-not-determine rather than an empty store.
 */
function defsDir(): string | undefined {
  return beanDefsDir(ROOT) ?? undefined;
}

/** Bean files on `rev`, by id. */
function beansOn(rev: string): Set<string> | undefined {
  const dir = defsDir();
  if (dir === undefined) return undefined;
  const r = git(ROOT, ["ls-tree", "--name-only", rev, `${relative(ROOT, dir)}/`]);
  if (!r.ok) return undefined;
  const ids = new Set<string>();
  for (const line of r.out.split("\n")) {
    const m = /folio-assistant-([a-z0-9]{4})--/.exec(line);
    if (m) ids.add(m[1]!);
  }
  return ids;
}

/** GATE: is the plan itself on `main`, or only on branches? */
function gatePlanOnMain(base: string, prs: readonly Pr[]): Gate {
  const basis =
    "an MVP of the active feature set cannot be stated from `main` while the beans that define it exist only on branches; measured by comparing bean ids per head against the base";
  const onMain = beansOn(base);
  if (!onMain) {
    return { id: "plan-on-main", question: "Is the work plan itself on main?", state: "could-not-determine", value: "git would not list the base's beans", basis };
  }
  const offMain = new Map<string, number[]>();
  let undetermined = 0;
  for (const p of prs) {
    const here = beansOn(p.sha);
    if (!here) { undetermined++; continue; }
    for (const id of here) {
      if (!onMain.has(id)) {
        const seen = offMain.get(id) ?? [];
        seen.push(p.number);
        offMain.set(id, seen);
      }
    }
  }
  if (undetermined > 0 && offMain.size === 0) {
    return { id: "plan-on-main", question: "Is the work plan itself on main?", state: "could-not-determine", value: `${undetermined} head(s) could not be listed`, basis };
  }
  const detail = [...offMain.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12)
    .map(([id, ns]) => `${id} — only on ${ns.map((n) => `#${n}`).join(", ")}`);
  if (undetermined > 0) detail.push(`${undetermined} head(s) COULD NOT BE LISTED — not counted either way`);
  return {
    id: "plan-on-main",
    question: "Is the work plan itself on main?",
    state: offMain.size === 0 && undetermined === 0 ? "clear" : offMain.size === 0 ? "could-not-determine" : "blocked",
    value: `${offMain.size} bean(s) exist only on open PR branches`,
    target: "0",
    basis,
    ...(detail.length ? { detail } : {}),
  };
}

/** GATE: how much genuine merge negotiation is left, as opposed to regeneration? */
function gateAuthoredConflicts(base: string, prs: readonly Pr[]): Gate {
  const basis =
    "a conflict in a generated file is resolved by re-running its generator, so only an AUTHORED conflict needs a person; classified by `pathClass`, the same function merge:train and merge:overlap use";
  const byPath = new Map<string, number[]>();
  let generated = 0;
  const undetermined: number[] = [];
  for (const p of prs) {
    const c = conflicts(base, p.sha);
    if (!c) { undetermined.push(p.number); continue; }
    generated += c.generated;
    for (const a of c.authored) {
      const seen = byPath.get(a) ?? [];
      seen.push(p.number);
      byPath.set(a, seen);
    }
  }
  const contended = [...byPath.entries()].filter(([, ns]) => ns.length > 1);
  const total = [...byPath.values()].reduce((n, ns) => n + ns.length, 0);
  const detail = contended
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
    .map(([p, ns]) => `${p} — contended by ${ns.map((n) => `#${n}`).join(", ")}`);
  if (undetermined.length) detail.push(`COULD NOT DETERMINE for ${undetermined.map((n) => `#${n}`).join(", ")} — merge-tree errored, which is not clean`);
  return {
    id: "authored-conflicts",
    question: "How many conflicts actually need a person?",
    state: undetermined.length ? "could-not-determine" : total === 0 ? "clear" : "blocked",
    value: `${total} authored conflict(s) across ${byPath.size} path(s); ${generated} generated`,
    target: "0 authored",
    basis,
    ...(detail.length ? { detail } : {}),
  };
}

/** GATE: does every open PR's head carry the gate runs it owes? */
function gateEvidence(prs: readonly Pr[]): Gate {
  const basis =
    "a head can carry a complete-looking green check set whose runs are all workflow_dispatch while the pull_request runs completed action_required and executed nothing (bean `0qjq`); `check:head-has-run` reconciles runs against the workflows the tree declares and exits 2 rather than guessing";
  const blocked: string[] = [];
  const undetermined: string[] = [];
  for (const p of prs) {
    const r = spawnSync("bun", ["run", "check:head-has-run", "--", p.sha], { cwd: ROOT, encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 });
    if (r.status === 0) continue;
    if (r.status === 1) blocked.push(`#${p.number} — missing a run it owes`);
    else undetermined.push(`#${p.number} — could not ask (exit ${r.status})`);
  }
  return {
    id: "gate-evidence",
    question: "Does every open PR's head carry the gate runs it owes?",
    state: undetermined.length ? "could-not-determine" : blocked.length === 0 ? "clear" : "blocked",
    value: `${prs.length - blocked.length - undetermined.length} of ${prs.length} head(s) carry their owed runs`,
    target: "every open PR",
    basis,
    ...(blocked.length || undetermined.length ? { detail: [...blocked.slice(0, 10), ...undetermined.slice(0, 6)] } : {}),
  };
}

/** GATE: the seeding gate itself — does any open PR still touch the tools instance? */
function gateSeeding(base: string, prs: readonly Pr[]): Gate {
  const basis =
    "seeding `cat-harness-tools` copies a tree, so a PR still editing that tree would be seeded from a base it does not match; measured on AUTHORED paths only, because a generated README region is regenerated after the move anyway";
  const touching: string[] = [];
  const undetermined: string[] = [];
  for (const p of prs) {
    const fork = git(ROOT, ["merge-base", base, p.sha]);
    if (!fork.ok) { undetermined.push(`#${p.number} — no merge base`); continue; }
    const names = git(ROOT, ["diff", "--name-only", `${fork.out.trim()}..${p.sha}`, "--", "cat-harness-tools/"]);
    if (!names.ok) { undetermined.push(`#${p.number} — git would not list its paths`); continue; }
    const authored = names.out.split("\n").map((s) => s.trim()).filter(Boolean).filter((f) => pathClass(f).class === "authored");
    if (authored.length) touching.push(`#${p.number} — ${authored.length} authored path(s): ${authored.slice(0, 3).join(", ")}`);
  }
  return {
    id: "seeding-gate",
    question: "Does any open PR still touch cat-harness-tools?",
    state: undetermined.length ? "could-not-determine" : touching.length === 0 ? "clear" : "blocked",
    value: `${touching.length} PR(s) with authored touches`,
    target: "0",
    basis,
    ...(touching.length || undetermined.length ? { detail: [...touching, ...undetermined] } : {}),
  };
}

/** GATE: does any bean edit still need a person before `beans/` can move? */
function gateBeanRollover(): Gate {
  const basis =
    "issue #1850 step 2: a bean path the base has not touched since the fork can be copied onto the beans branch without the PR landing, so only an `adjudicate` or `could-not-determine` needs a person; delegated to `beans:rollover --json` and read from its structured summary";
  // `--json`, NOT the printed table. The first version of this gate scraped
  // the table with /port\s+(\d+)/ and matched the first PER-PR line
  // ("port 1 · adjudicate 0") instead of the summary, so it reported
  // `clear` off a plausible wrong number while the real totals were 164 and 2.
  // A structured summary cannot be misread that way, and scraping a report
  // whose author also publishes JSON is choosing the fragile reader.
  const r = spawnSync("bun", ["run", "beans:rollover", "--", "--json"], { cwd: ROOT, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status === null) {
    return { id: "bean-rollover", question: "Does any bean edit still need a person?", state: "could-not-determine", value: "beans:rollover did not run", basis };
  }
  // bun prints its own banner line before the script's stdout; take the JSON object.
  const start = r.stdout?.indexOf("{") ?? -1;
  let summary: { port?: number; adjudicate?: number; could_not_determine?: number } | undefined;
  if (start >= 0) {
    try {
      summary = (JSON.parse(r.stdout!.slice(start)) as { summary?: typeof summary }).summary;
    } catch {
      summary = undefined;
    }
  }
  if (!summary || summary.adjudicate === undefined || summary.could_not_determine === undefined) {
    return { id: "bean-rollover", question: "Does any bean edit still need a person?", state: "could-not-determine", value: "beans:rollover's JSON summary could not be read", basis };
  }
  const needsAPerson = summary.adjudicate + summary.could_not_determine;
  return {
    id: "bean-rollover",
    question: "Does any bean edit still need a person?",
    state: summary.could_not_determine > 0 ? "could-not-determine" : needsAPerson === 0 ? "clear" : "blocked",
    value: `${summary.adjudicate} adjudicate · ${summary.could_not_determine} could-not-determine · ${summary.port ?? "?"} portable`,
    target: "0 adjudicate and 0 could-not-determine",
    basis,
  };
}

/** REPORTED, not graded: is scope still arriving? */
function reportScopeGrowth(windowHours: number): Gate {
  const basis =
    "REPORTED, never graded. A high value means scope is still arriving, which is a fact about the plan rather than a defect — grading it would invite somebody to stop writing beans. `audit:coverage` draws the same line for its share (bean `3yi4`)";
  const since = Date.now() - windowHours * 3600_000;
  let created = 0;
  let total = 0;
  try {
    const dir = defsDir();
    if (dir === undefined) throw new Error("no bean-defs node is declared");
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      total++;
      const head = readFileSync(join(dir, f), "utf-8").slice(0, 600);
      const m = /^created_at:\s*(\S+)/m.exec(head);
      if (m && Date.parse(m[1]!) >= since) created++;
    }
  } catch {
    return { id: "scope-growth", question: `How many beans were created in the last ${windowHours}h?`, state: "could-not-determine", value: "the bean store could not be read", basis };
  }
  return {
    id: "scope-growth",
    question: `How many beans were created in the last ${windowHours}h?`,
    state: "reported",
    value: `${created} of ${total} live bean file(s)`,
    basis,
  };
}

/** REPORTED, not graded: how many in-progress beans have somebody behind them? */
function reportHolders(): Gate {
  const basis =
    "REPORTED. `bun run beans:claim` writes a `Claimed by` note; `beans update --status in-progress` does not, so an unheld in-progress bean is invisible to the already-claimed check. Counted with the predicate `claim-bean.ts` itself uses";
  let inProgress = 0;
  let held = 0;
  try {
    const dir = defsDir();
    if (dir === undefined) throw new Error("no bean-defs node is declared");
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const body = readFileSync(join(dir, f), "utf-8");
      if (!/^status:\s*in-progress\s*$/m.test(body)) continue;
      inProgress++;
      if (/Claimed by (\S+)/.test(body)) held++;
    }
  } catch {
    return { id: "holders", question: "How many in-progress beans have a holder?", state: "could-not-determine", value: "the bean store could not be read", basis };
  }
  return {
    id: "holders",
    question: "How many in-progress beans have a holder?",
    state: "reported",
    value: `${held} of ${inProgress} carry a \`Claimed by\` note`,
    basis,
  };
}

const ICON: Record<GateState, string> = {
  clear: "✓",
  blocked: "✗",
  reported: "·",
  "could-not-determine": "?",
};

function main(): number {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const noFetch = argv.includes("--no-fetch");
  const wi = argv.indexOf("--window");
  const windowHours = wi >= 0 ? Number(argv[wi + 1]) || 9 : 9;
  const skip = new Set(argv.flatMap((a, i) => (argv[i - 1] === "--skip" ? [a] : [])));

  if (!noFetch) git(ROOT, ["fetch", "-q", "origin", "main"]);
  const baseSha = git(ROOT, ["rev-parse", "--verify", "-q", "origin/main^{commit}"]);
  if (!baseSha.ok) {
    console.error("mvp:status: no origin/main — COULD NOT DETERMINE, not a clean run.");
    return 2;
  }
  const base = baseSha.out.trim();

  const prs = openPrs();
  if (!prs) {
    console.error("mvp:status: the open PRs could not be listed — COULD NOT DETERMINE, not a clean run.");
    return 2;
  }
  // Every head must be present locally before merge-tree, or it errors and the
  // error reads as clean. Fetching each PR head is the only way to be sure.
  if (!noFetch) {
    for (const p of prs) {
      if (!git(ROOT, ["cat-file", "-e", `${p.sha}^{commit}`]).ok) {
        git(ROOT, ["fetch", "-q", "origin", `refs/pull/${p.number}/head`]);
      }
    }
  }

  const gates: Gate[] = [];
  const add = (id: string, f: () => Gate) => { if (!skip.has(id)) gates.push(f()); };
  add("plan-on-main", () => gatePlanOnMain(base, prs));
  add("authored-conflicts", () => gateAuthoredConflicts(base, prs));
  add("seeding-gate", () => gateSeeding(base, prs));
  add("bean-rollover", () => gateBeanRollover());
  add("gate-evidence", () => gateEvidence(prs));
  add("scope-growth", () => reportScopeGrowth(windowHours));
  add("holders", () => reportHolders());

  const graded = gates.filter((g) => g.state !== "reported");
  const blocked = graded.filter((g) => g.state === "blocked");
  const undet = graded.filter((g) => g.state === "could-not-determine");
  const clear = graded.filter((g) => g.state === "clear");

  if (json) {
    console.log(JSON.stringify({
      $schema: "mvp-status/v1",
      generated_at: new Date().toISOString(),
      base,
      open_prs: prs.length,
      window_hours: windowHours,
      summary: { graded: graded.length, clear: clear.length, blocked: blocked.length, could_not_determine: undet.length },
      gates,
    }, null, 2));
  } else {
    console.log(`MVP status — the separation point, against origin/main at ${base.slice(0, 11)}`);
    console.log(`${prs.length} open PR(s) · window ${windowHours}h · ${new Date().toISOString()}\n`);
    for (const g of gates) {
      console.log(`  ${ICON[g.state]} ${g.id.padEnd(19)} ${g.value}`);
      if (g.target) console.log(`      target: ${g.target}`);
      console.log(`      basis:  ${g.basis}`);
      for (const d of g.detail ?? []) console.log(`        · ${d}`);
      console.log("");
    }
    console.log(`  ${clear.length} of ${graded.length} graded gate(s) clear · ${blocked.length} blocked · ${undet.length} could-not-determine`);
    if (undet.length) console.log(`  A gate that could not be answered is NOT clear, and it outranks a blocker:\n  a sweep blind on one gate has not cleared the others.`);
  }

  if (undet.length) return 2;
  return blocked.length ? 1 : 0;
}

process.exit(main());
