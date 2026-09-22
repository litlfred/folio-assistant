#!/usr/bin/env bun
/**
 * Repair the generated artefacts a merge left wrong — by ASKING each gate.
 *
 * @module scripts/regen-after-merge
 * @graphNode none — a maintenance command over the gate set
 *
 * ## The failure this exists for
 *
 * Bean `lxpq`, measured on `main` at `3341108a`, 2026-09-22. Two branches
 * changed one committed generated file in NON-OVERLAPPING places:
 *
 *   main (`tis1`)  added `tile.voices.count` — a projection declares its count
 *   #827 (`26tu`)  added a sixth voice, `agent-skill-authoring`
 *
 * One touched the header, the other the array. Git merged them with **no
 * conflict** and produced a projection declaring `count: 5` while listing 6
 * voices — an artefact **neither side would ever emit**.
 *
 * **A conflict is a question; a clean merge is an assertion that the result is
 * correct.** That is why this is not bean `520m` and why
 * `qa:resolve-conflicts` cannot help: that command only ever inspects UNMERGED
 * paths, and here there were none.
 *
 * The general shape, which is not specific to voices:
 *
 * > A committed generated artefact can merge into a state no generator would
 * > produce, whenever two branches touch different parts of it. The only
 * > reliable check is to RE-RUN THE GENERATOR, never to read the diff — the
 * > merged file looks plausible from either side, which is exactly what let
 * > this one through.
 *
 * ## Why it asks the gates rather than regenerating everything
 *
 * "Regenerate everything declared" was the obvious repair and is the wrong
 * one twice over.
 *
 * **It would need a list, and the list is the defect.** `gates.ts` already
 * settled where the authority lives — *"the workflow is the authority, and
 * `package.json` is not"* — having measured that of the repository's `:check`
 * scripts, **21 appeared in no workflow at all**. A second list here, derived
 * from `package.json`, would run generators CI does not gate and would be a
 * guess that reads as coverage. So the gate set is loaded from the workflow,
 * through `loadGates`, and a `:check` CI does not run is not this command's
 * business.
 *
 * **And a blanket regeneration cannot tell repair from damage.** Running every
 * writer rewrites artefacts that were already correct, so the diff afterwards
 * says nothing about what the merge broke. Asking each check FIRST means the
 * output is exactly the set of artefacts the merge left wrong, which is the
 * question a person actually has after a merge.
 *
 * ## The three states, and the fourth that matters most
 *
 * | state | what happened |
 * |---|---|
 * | `current` | the check passed; nothing was run |
 * | `regenerated` | the check failed, its writer ran, the check now passes |
 * | **`unrepaired`** | the check failed, its writer ran, **and it still fails** |
 * | `no-writer` | the check failed and has no writer counterpart |
 *
 * **`unrepaired` is the one this command exists to surface honestly.** A check
 * can fail for reasons that are not staleness — a real defect — and a tool
 * that ran a generator and then reported success would be claiming a repair it
 * did not make. Both it and `no-writer` exit non-zero and name the check.
 *
 * Usage:
 *   bun run regen                # ask every fast gate; repair what is stale
 *   bun run regen --all          # ...including the browser workflows' gates
 *   bun run regen --dry-run      # report what is stale, change nothing
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { loadGates, type Gate } from "./gates.ts";
import { repoRootFor } from "../schemas/cat-harness.ts";
import "../schemas/folio-graph-kind.js";

const ROOT = join(import.meta.dir, "..");
const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

/** The npm script a gate command runs, when it runs exactly one. */
export function scriptOf(command: string): string | undefined {
  const m = /^bun run ([A-Za-z0-9:_-]+)\s*$/.exec(command.trim());
  return m?.[1];
}

/**
 * The writer for a `:check` script, when the pair exists.
 *
 * The convention this repository already follows everywhere: `X` writes and
 * `X:check` verifies. Read from `package.json` rather than assumed, because a
 * check whose writer was renamed must come back as `no-writer` — a reported
 * gap — and not as a command that silently runs nothing.
 */
export function writerFor(scripts: Record<string, string>, check: string): string | undefined {
  if (!check.endsWith(":check")) return undefined;
  const base = check.slice(0, -":check".length);
  return scripts[base] === undefined ? undefined : base;
}

export type Outcome = "current" | "regenerated" | "unrepaired" | "no-writer";

export interface Result {
  check: string;
  writer?: string;
  outcome: Outcome;
}

/** Every repairable gate in the set, in workflow order, deduplicated. */
export function repairableGates(gates: readonly Gate[], scripts: Record<string, string>): {
  check: string;
  writer: string | undefined;
}[] {
  const seen = new Set<string>();
  const out: { check: string; writer: string | undefined }[] = [];
  for (const g of gates) {
    const script = scriptOf(g.command);
    if (script === undefined || !script.endsWith(":check")) continue;
    if (seen.has(script)) continue;
    seen.add(script);
    out.push({ check: script, writer: writerFor(scripts, script) });
  }
  return out;
}

function run(root: string, script: string): boolean {
  const r = spawnSync("bun", ["run", script], { cwd: root, encoding: "utf-8" });
  return r.status === 0;
}

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const scripts = (JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")) as {
    scripts?: Record<string, string>;
  }).scripts ?? {};

  const gates = loadGates(repoRoot, { all });
  const repairable = repairableGates(gates, scripts);
  console.log(
    `regen-after-merge — ${repairable.length} verify/write pair(s) in the ` +
      `${all ? "whole" : "fast"} gate set (of ${gates.length} gate(s))`,
  );

  const results: Result[] = [];
  for (const { check, writer } of repairable) {
    if (run(repoRoot, check)) {
      results.push({ check, writer, outcome: "current" });
      continue;
    }
    if (writer === undefined) {
      results.push({ check, outcome: "no-writer" });
      console.error(`  ✗ ${check} fails and has NO writer counterpart — not staleness`);
      continue;
    }
    if (dryRun) {
      results.push({ check, writer, outcome: "regenerated" });
      console.log(`  · ${check} is stale — would run \`bun run ${writer}\``);
      continue;
    }
    run(repoRoot, writer);
    // Ask AGAIN. A writer that ran is not a repair that worked, and reporting
    // it as one would be the false-clean this whole command is about.
    const fixed = run(repoRoot, check);
    results.push({ check, writer, outcome: fixed ? "regenerated" : "unrepaired" });
    console.log(
      fixed
        ? `  ✓ ${check} was stale — regenerated with \`bun run ${writer}\``
        : `  ✗ ${check} STILL fails after \`bun run ${writer}\` — a real defect, not staleness`,
    );
  }

  const by = (o: Outcome): Result[] => results.filter((r) => r.outcome === o);
  console.log(
    `\n${by("current").length} current, ${by("regenerated").length} ` +
      `${dryRun ? "stale" : "regenerated"}, ${by("unrepaired").length} unrepaired, ` +
      `${by("no-writer").length} without a writer`,
  );
  if (dryRun) {
    console.log("--dry-run: nothing was changed.");
    process.exit(0);
  }
  const bad = by("unrepaired").length + by("no-writer").length;
  if (bad > 0) {
    console.error(
      `\n${bad} check(s) are NOT explained by staleness. Read them: a generator ` +
        "cannot fix a defect in what it is generating from.",
    );
    process.exit(1);
  }
  if (by("regenerated").length > 0) {
    console.log("\nReview `git diff`, then commit the regenerated artefacts with your merge.");
  }
}
