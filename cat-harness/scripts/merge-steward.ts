#!/usr/bin/env bun
/**
 * The merge queue's ORDER, as a command — the entry point `merge-queue.ts`
 * was written for and never got.
 *
 * `merge-queue.ts` derives each candidate's facts, evaluates
 * `processes/sdlc/decisions/merge-priority.dmn` and orders the result. Its own
 * docblock calls it "a library the merge steward and the tile call". Measured
 * 2026-10-04: **nothing called it.** It is wired to no `package.json` script,
 * so the ordering a declared decision table exists to give could not be asked
 * for, and a steward ordered the queue by hand instead — clean-and-green in PR
 * number order, which is not any of the table's four inputs.
 *
 * That is the defect this file closes, and it is worth naming as a class: a
 * decision table with no caller is indistinguishable, from outside, from a
 * decision nobody takes. The table was not wrong; it was unreachable.
 *
 * This command READS and prints. It merges nothing and writes no queue entry,
 * because `merge-queue.ts` is explicit that what the steward acts on is
 * recorded by the steward and the facts stay GitHub's.
 *
 * Usage:
 *   bun run merge:steward              # the ordered queue, as a table
 *   bun run merge:steward --json       # the same, machine-readable
 *   bun run merge:steward --base <ref> # order against a ref other than origin/main
 *
 * @module cat-harness/scripts/merge-steward
 * @covers none — a steward's reader over GitHub and the bean store; it judges no declared graph
 */
import { spawnSync } from "node:child_process";

import { readBeanStore } from "./bean-store-read.ts";
import { classify } from "./merge-conflict-patterns.ts";
import {
  deriveFacts,
  loadPriorityTable,
  orderQueue,
  placeAll,
  type LivePr,
} from "./merge-queue.ts";

const REPO = "litlfred/folio-assistant";

/** The two workflows whose runs GATE a merge here. Feature Staging is preview-only. */
const GATING = ["code-quality-gates.yml", "jsonld-gen-check.yml"] as const;

function run(cmd: string, args: string[]): { out: string; status: number } {
  const r = spawnSync(cmd, args, { encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  return { out: r.stdout ?? "", status: r.status ?? 1 };
}

function gh(path: string): unknown | null {
  const { out, status } = run("gh", ["api", path]);
  if (status !== 0) return null;
  try {
    return JSON.parse(out);
  } catch {
    return null;
  }
}

/**
 * Does this PR merge cleanly enough for the queue to consider it?
 *
 * Three states, never two. `git merge-tree --write-tree` exits 0 clean, 1 on
 * CONFLICT and >=2 on ERROR — and an error is NOT clean, which is the reading
 * that bean `0s6w` was filed for. A conflict whose every path classifies to a
 * declared pattern is not a refusal: `merge:main` resolves those mechanically,
 * so only an AUTHORED or undeclared conflict refuses.
 */
function refusalFor(base: string, pr: number): "clean" | "declared" | "refused" | "unknown" {
  const fetched = run("git", ["fetch", "origin", `refs/pull/${pr}/head:refs/tmp/steward${pr}`, "-q", "--force"]);
  if (fetched.status !== 0) return "unknown";
  const mt = run("git", ["merge-tree", "--write-tree", base, `refs/tmp/steward${pr}`]);
  if (mt.status === 0) return "clean";
  if (mt.status !== 1) return "unknown";
  const conflicted = mt.out
    .split("\n")
    .filter((l) => l.startsWith("CONFLICT"))
    .map((l) => l.replace(/^CONFLICT \([^)]*\): Merge conflict in /, "").trim())
    .filter(Boolean);
  if (conflicted.length === 0) return "unknown";
  return conflicted.some((p) => classify(p).strategy === "refuse") ? "refused" : "declared";
}

/**
 * The PR's own CI on its head, by the five values `LivePr.ownCi` names.
 *
 * A bot-actor push leaves the `pull_request` runs at `action_required` with
 * ZERO jobs executed (bean `0qjq`), and `merge:main` dispatches the gating
 * workflows for exactly that reason — so a dispatched success IS the evidence
 * here, and a run that never executed is not a failure. `missing-required`
 * therefore means a gating workflow has no completed run at all, and `red`
 * means one completed and failed.
 */
function ciFor(headSha: string): { ownCi: NonNullable<LivePr["ownCi"]>; missing: string[] } {
  const runs = gh(`repos/${REPO}/actions/runs?head_sha=${headSha}&per_page=100`) as
    | { workflow_runs?: { path?: string; status?: string; conclusion?: string }[] }
    | null;
  if (runs?.workflow_runs === undefined) return { ownCi: "unknown", missing: [] };
  const all = runs.workflow_runs;
  if (all.length === 0) return { ownCi: "none", missing: [...GATING] };
  const missing: string[] = [];
  let red = false;
  for (const wf of GATING) {
    const mine = all.filter((r) => (r.path ?? "").endsWith(wf) && r.status === "completed");
    if (mine.some((r) => r.conclusion === "failure")) red = true;
    else if (!mine.some((r) => r.conclusion === "success")) missing.push(wf);
  }
  if (red) return { ownCi: "red", missing };
  return { ownCi: missing.length > 0 ? "missing-required" : "green", missing };
}

/** Bean ids a PR body names, in this repo's `folio-assistant-xxxx` form. */
function beansNamed(body: string): string[] {
  return [...new Set((body.match(/folio-assistant-[0-9a-z]{4}/g) ?? []))];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const baseAt = argv.indexOf("--base");
  const base = baseAt >= 0 ? (argv[baseAt + 1] ?? "origin/main") : "origin/main";

  run("git", ["fetch", "origin", "main", "-q"]);
  const baseSha = run("git", ["rev-parse", base]).out.trim();
  if (!baseSha) {
    console.error(`merge:steward — COULD NOT ASK: \`${base}\` does not resolve here.`);
    process.exit(2);
  }

  const open = gh(`repos/${REPO}/pulls?state=open&per_page=100`) as
    | { number: number; draft: boolean; title: string; body: string | null; head: { sha: string }; labels: { name: string }[] }[]
    | null;
  if (open === null) {
    console.error("merge:steward — COULD NOT ASK: the pulls endpoint did not answer. This is not an empty queue.");
    process.exit(2);
  }

  const candidates = open.filter((p) => !p.draft);
  const prs: LivePr[] = [];
  const refusedSet = new Set<number>();
  const conflictState = new Map<number, string>();
  const missingByPr = new Map<number, string[]>();

  for (const p of candidates) {
    const files = gh(`repos/${REPO}/pulls/${p.number}/files?per_page=100`) as
      | { filename: string; additions: number; deletions: number }[]
      | null;
    const r = refusalFor(baseSha, p.number);
    conflictState.set(p.number, r);
    if (r === "refused" || r === "unknown") refusedSet.add(p.number);
    const { ownCi, missing } = ciFor(p.head.sha);
    missingByPr.set(p.number, missing);
    prs.push({
      pr: p.number,
      files: (files ?? []).map((f) => f.filename),
      additions: (files ?? []).reduce((a, f) => a + f.additions, 0),
      deletions: (files ?? []).reduce((a, f) => a + f.deletions, 0),
      beans: beansNamed(`${p.title}\n${p.body ?? ""}`),
      labels: p.labels.map((l) => l.name),
      ownCi,
      headShaMatchesCi: ownCi === "green",
    });
  }

  const store = readBeanStore(process.cwd());
  const parents = new Map<string, string>();
  if (store.state === "read") for (const b of store.beans) if (b.parent) parents.set(b.id, b.parent);

  const facts = deriveFacts(prs, {
    parentOf: (id) => parents.get(id),
    refused: refusedSet,
    mvpLabels: ["mvp", "milestone:status", "ready-to-merge"],
  });
  const ordered = orderQueue(placeAll(await loadPriorityTable(), facts));

  if (json) {
    console.log(
      JSON.stringify(
        {
          base,
          baseSha,
          beanStore: store.state,
          queue: ordered.map((p) => ({
            ...p,
            conflict: conflictState.get(p.pr),
            ownCi: prs.find((q) => q.pr === p.pr)?.ownCi,
            missingGating: missingByPr.get(p.pr) ?? [],
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`merge:steward — ${ordered.length} candidate(s) against ${base} (${baseSha.slice(0, 11)})`);
  if (store.state !== "read") {
    console.log(`  ! the bean store reads \`${store.state}\`, so input (a) seedsStaging could not be computed from ancestry`);
  }
  console.log("");
  console.log("  #     route      class        rank  train  conflict   CI               rule");
  for (const p of ordered) {
    const ci = prs.find((q) => q.pr === p.pr)?.ownCi ?? "unknown";
    const miss = missingByPr.get(p.pr) ?? [];
    const ciText = ci === "missing-required" ? `missing-required(${miss.length})` : ci;
    console.log(
      `  ${String(p.pr).padEnd(6)}${String(p.route).padEnd(11)}${String(p.class).padEnd(13)}${String(p.rank).padEnd(6)}${String(p.train ?? "-").padEnd(7)}${String(conflictState.get(p.pr)).padEnd(11)}${ciText.padEnd(17)}${p.rule}`,
    );
  }
  console.log("");
  console.log("`conflict`: clean | declared (merge:main resolves it) | refused (authored) | unknown.");
  console.log("`CI`: green needs a COMPLETED success for each gating workflow on this exact head.");
  console.log("A run held at `action_required` executed no jobs and is neither a pass nor a failure —");
  console.log("bean `0qjq`; merge:main dispatches the gating workflows for that reason.");
  console.log("Nothing here merges anything. The order is the table's answer, not this file's.");
}

await main();
