#!/usr/bin/env bun
/**
 * Every `--check` CI runs that is NOT a `package.json` script.
 *
 * ## Why this exists
 *
 * A contributor — and an agent — verifies by sweeping `package.json`'s
 * `check:*` and `*:check` entries. That sweep is complete about the scripts
 * and says nothing about the workflows, and the workflows invoke generators
 * DIRECTLY:
 *
 *     run: bun run cat-harness/scripts/gen-skill-docs.ts --check
 *
 * Measured 2026-09-20: **seven** such invocations across
 * `code-quality-gates.yml` and `docs-site.yml`, none reachable from
 * `package.json`. A 65-script local sweep came back clean and CI failed on
 * `gen-skill-docs --check` — a generated skill page left stale by an edit to
 * its source, which is the one class of defect a generator check exists for.
 *
 * The gap is not that the check was missing. It is that the check was
 * UNREACHABLE by the only complete enumeration anybody had.
 *
 * ## It DISCOVERS rather than lists
 *
 * The invocations are read out of the workflow YAML, so a new one is covered
 * the day it is added. A hardcoded list here would be the
 * `check-declared-assets` defect a third time — that file's own comment
 * records a hardcoded list of instances going stale twice, and being "fixed"
 * once by correcting the list.
 *
 * Usage:  bun run cat-harness/scripts/check-ci-invocations.ts [--list]
 * Exit:   0 all pass · 1 one failed · 2 nothing found, which is not a pass.
 *
 * @module scripts/check-ci-invocations
 * @covers none — .github/workflows/ is not a declared graph kind
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "../..");
const WORKFLOWS = join(REPO, ".github", "workflows");

/** `bun run <script>.ts --check [flags]`, as a workflow spells it. */
const INVOCATION = /bun run ([\w/.-]+\.ts)((?:\s+--[\w-]+)*\s+--check(?:\s+--[\w-]+)*)/g;

export interface CiInvocation {
  script: string;
  args: string[];
  workflow: string;
}

/** Read them out of the YAML. Deduplicated on script + args, not on file. */
export function ciInvocations(dir = WORKFLOWS): CiInvocation[] {
  if (!existsSync(dir)) return [];
  const seen = new Map<string, CiInvocation>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))) {
    const text = readFileSync(join(dir, f), "utf-8");
    for (const m of text.matchAll(INVOCATION)) {
      const script = m[1]!;
      // A workflow may run it from a subdirectory; only what exists from the
      // repository root is runnable here, and anything else is reported
      // rather than silently dropped.
      const args = m[2]!.trim().split(/\s+/);
      seen.set(`${script} ${args.join(" ")}`, { script, args, workflow: f });
    }
  }
  return [...seen.values()].sort((a, b) => a.script.localeCompare(b.script));
}

if (import.meta.main) {
  const found = ciInvocations();
  if (found.length === 0) {
    console.error("no `--check` invocation found in .github/workflows/.");
    console.error("  Nothing was checked. That is `could not determine`, not a pass.");
    process.exit(2);
  }
  if (process.argv.includes("--list")) {
    for (const i of found) console.log(`${i.script} ${i.args.join(" ")}   (${i.workflow})`);
    process.exit(0);
  }

  let failed = 0;
  let skipped = 0;
  for (const i of found) {
    if (!existsSync(join(REPO, i.script))) {
      // REPORTED, and deliberately not a failure.
      //
      // A folio-side script is absent here BY DESIGN: `AGENTS.md` says so in
      // as many words — *"`qa-sweep` and `witness-refresh` fail by design in
      // this repo ... the platform carries no folio."* Failing on it would
      // make this gate red forever in the one repository it lives in, and a
      // gate that always fails is a gate somebody switches off.
      //
      // It is still PRINTED, because "this checkout cannot run it" and "it
      // passed" are different facts, and the count below keeps them apart.
      console.log(`·   ${i.script} — named by ${i.workflow}, not in this checkout (folio-side)`);
      skipped += 1;
      continue;
    }
    const r = Bun.spawnSync(["bun", "run", i.script, ...i.args], { cwd: REPO });
    const ok = r.exitCode === 0;
    if (!ok) failed += 1;
    console.log(`${ok ? "✓" : "✗"}   ${i.script} ${i.args.join(" ")}`);
    if (!ok) {
      const out = new TextDecoder().decode(r.stdout).trim().split("\n").slice(-6);
      for (const l of out) console.log(`      ${l}`);
    }
  }
  console.log(
    `\n${found.length} CI invocation(s): ${found.length - failed - skipped} passed, ` +
      `${failed} failed, ${skipped} not in this checkout.`,
  );
  // Only a real failure is a failure; see the `·` branch above.
  process.exit(failed > 0 ? 1 : 0);
}
