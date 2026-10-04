#!/usr/bin/env bun
/**
 * split-baseline.ts — what the cat-harness / cat-harness-tools split must not
 * change, recorded before the first file moves (bean `pyds`, stage 0).
 *
 * ## Why a recorded baseline, not "the gates are green"
 *
 * Stage 1a (`70lx`) moves ≈1,340 files. Green gates after a move say each
 * gate agrees with the tree it ran on; they do not say the tree serves the
 * same tools or resolves the same skills as before. 70lx's falsifiers are
 * comparisons — *"`mcp:capture` tool list identical"*, *"`bun test` pass count
 * equal to the stage-0 baseline"* — and a comparison needs its left-hand side
 * written down before the right-hand side exists.
 *
 * ## What it records, and what it deliberately does not
 *
 * - **`mcpTools`** — every tool `mcp:capture` mounts, with its required and
 *   optional inputs. A tool that disappears, or whose contract changes, in a
 *   change that only moved files is a defect.
 * - **`knownSkills`** — the checkout-scope skill set. ejye's falsifier 1 is the
 *   same set; a move that changes it changed resolution, not location.
 * - **`bunTest`** — the pass count, taken from CI on `main` at `sha` and
 *   entered by hand with the run it came from. A local run is not used: local
 *   `bun test` under load times out tests CI passes, so its count measures the
 *   machine.
 * - **Generator output is NOT hashed here.** The generated files are committed,
 *   so the baseline for every generator is the tree at `sha` itself:
 *   `git diff <sha> -- <generated paths>` after a regen on the move branch is
 *   the comparison, and a second copy of it here would be free to drift.
 *
 * ```sh
 * bun run split:baseline           # write split-baseline.json (keeps bunTest)
 * bun run split:baseline --check   # exit 1 if tools or skills differ from it
 * ```
 *
 * `--check` exits 2 when the capture reports a problem or no baseline is
 * committed: could-not-determine is never rendered as "unchanged".
 *
 * @module cat-harness-tools/scripts/split-baseline
 * @covers code
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { captureTools } from "./capture-mcp-tools.ts";
import { knownSkills } from "../../cat-harness/scripts/known-skills.ts";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
export const BASELINE_FILE = join(import.meta.dir, "split-baseline.json");

export interface ToolContract {
  name: string;
  required: string[];
  optional: string[];
}

export interface SplitBaseline {
  /** The commit the baseline describes. */
  sha: string;
  mcpTools: ToolContract[];
  knownSkills: string[];
  /** From CI on `main` at `sha`; `null` until entered. */
  bunTest: { pass: number; fail: number; skip: number; source: string } | null;
}

export interface Measured {
  mcpTools: ToolContract[];
  knownSkills: string[];
  problems: string[];
}

export async function measure(root = REPO_ROOT): Promise<Measured> {
  const { tools, problems } = await captureTools();
  const mcpTools = tools
    .map((t) => ({ name: t.name, required: [...t.required].sort(), optional: [...t.optional].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // Pointed at the harness instance, knownSkills picks the CHECKOUT scope
  // itself (`corpusScopeFor`); pointed at the repository root it reads none.
  const skills = [...knownSkills(join(root, "cat-harness"))].sort();
  return { mcpTools, knownSkills: skills, problems };
}

/** Each difference as one line; empty when the two agree. */
export function diff(base: Pick<SplitBaseline, "mcpTools" | "knownSkills">, now: Pick<Measured, "mcpTools" | "knownSkills">): string[] {
  const out: string[] = [];
  const key = (t: ToolContract) => `${t.name} req=[${t.required.join(",")}] opt=[${t.optional.join(",")}]`;
  const before = new Map(base.mcpTools.map((t) => [t.name, key(t)]));
  const after = new Map(now.mcpTools.map((t) => [t.name, key(t)]));
  for (const [name, k] of before) {
    if (!after.has(name)) out.push(`tool gone: ${name}`);
    else if (after.get(name) !== k) out.push(`tool contract changed: ${k} → ${after.get(name)}`);
  }
  for (const name of after.keys()) if (!before.has(name)) out.push(`tool added: ${name}`);
  const had = new Set(base.knownSkills);
  const has = new Set(now.knownSkills);
  for (const s of had) if (!has.has(s)) out.push(`skill no longer resolves: ${s}`);
  for (const s of has) if (!had.has(s)) out.push(`skill newly resolves: ${s}`);
  return out;
}

async function main(): Promise<number> {
  const check = process.argv.includes("--check");
  const now = await measure();
  if (now.knownSkills.length === 0) now.problems.push("knownSkills read 0 skills — a baseline of nothing compares equal to anything");
  if (now.problems.length > 0) {
    console.error(`✗ could not determine: mcp:capture reported ${now.problems.length} problem(s):`);
    for (const p of now.problems) console.error(`  ${p}`);
    return 2;
  }
  const existing: SplitBaseline | undefined = existsSync(BASELINE_FILE)
    ? (JSON.parse(readFileSync(BASELINE_FILE, "utf-8")) as SplitBaseline)
    : undefined;

  if (check) {
    if (!existing) {
      console.error(`✗ could not determine: no baseline committed at ${BASELINE_FILE}`);
      return 2;
    }
    const d = diff(existing, now);
    if (d.length === 0) {
      console.log(`✓ ${now.mcpTools.length} tools and ${now.knownSkills.length} skills match the baseline at ${existing.sha.slice(0, 12)}.`);
      return 0;
    }
    console.error(`✗ ${d.length} difference(s) from the baseline at ${existing.sha.slice(0, 12)}:`);
    for (const line of d) console.error(`  ${line}`);
    return 1;
  }

  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
  const out: SplitBaseline = {
    sha,
    mcpTools: now.mcpTools,
    knownSkills: now.knownSkills,
    // Kept across rewrites only when it describes the same commit.
    bunTest: existing?.sha === sha ? existing.bunTest : null,
  };
  writeFileSync(BASELINE_FILE, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote ${BASELINE_FILE}: ${out.mcpTools.length} tools, ${out.knownSkills.length} skills at ${sha.slice(0, 12)}`);
  if (out.bunTest === null) console.log("  bunTest is null — enter it from CI on main at this sha.");
  return 0;
}

if (import.meta.main) process.exit(await main());
