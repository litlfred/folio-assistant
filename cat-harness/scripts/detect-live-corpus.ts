#!/usr/bin/env bun
/**
 * detect-live-corpus.ts — does a generator's COMMITTED OUTPUT change when
 * gitignored content is present?
 *
 * ## The question everything before this could not answer
 *
 * `xd1g` converted twelve scanners from filesystem walks to git's corpus, and
 * `qrlc` three more. Every one of those was verified at the CORPUS level: the
 * files it stopped reading are gitignored, and it lost nothing. That is a real
 * check and it is not the one that matters.
 *
 * A sibling session put the objection precisely: counting walks counts a
 * SHAPE, not an EFFECT. Across `xd1g`'s lifetime exactly one scanner was ever
 * measured live — `kg-detangle`, 233 nodes read as 1443 — and a sweep of
 * shapes risks being *"unfalsifiable work: no test could show it fixing
 * anything."* They proposed this detector instead, and they were right that it
 * is the layer above.
 *
 * LIVE means the artefact a contributor commits depends on what is installed
 * on their machine. LATENT means the walk is contaminated and a later filter
 * happens to save it. Only the first is a defect somebody can see.
 *
 * ## How it decides, and why it needs no roster
 *
 * Twice per writer, with the tree restored between:
 *
 *   1. run it on the tree as committed, and record WHAT IT CHANGED
 *   2. plant gitignored content, run it again, record what it changed
 *
 * Different change-sets ⇒ LIVE. The comparison is `git status` plus the
 * content of each changed path, so nothing here needs to know where a writer
 * puts its artefact. That matters beyond convenience: a table of
 * writer→artefact would be one more list kept by hand beside the thing it
 * tracks, which is the class `qrlc` has now paid for three times (a dead
 * `SKILLS_CATEGORIES` key, stale `coverage.visualiser` refs, and this file's
 * own sibling census keeping a hardcoded helper roster).
 *
 * The writers are derived too: a `package.json` script `X` is a writer when
 * `X:check` also exists. 62 of them today, and a new one is covered the day
 * it is added.
 *
 * ## Where it plants, and why two places
 *
 * `_kg/` — gitignored at the repository ROOT. This is what `biz4` measured:
 * top-level discovery admitting a directory a clean checkout does not have.
 *
 * `cat-harness/schemas/block-qa-schema/dist/` — gitignored INSIDE a declared
 * graph directory. A scanner that reads only declared directories never sees
 * the first site and does see this one; it is the exact shape that took
 * `cat-harness/schemas` from 227 nodes to 1441.
 *
 * Both are existing ignored trees, so planting adds nothing tracked and
 * `git status` stays clean throughout.
 *
 * ## LATENT is never a proof, and the report says so
 *
 * A writer is latent *for the content planted here*. A different plant — a
 * different extension, a different directory — could still reach it. The
 * output states that rather than implying a clearance, because "measured
 * clean" and "not reached by this probe" are different facts and this can only
 * establish the second.
 *
 * Usage:
 *   bun run detect:live-corpus                  # every derived writer
 *   bun run detect:live-corpus -- --only detangle
 *   bun run detect:live-corpus -- --json
 *
 * @module scripts/detect-live-corpus
 * @covers cat-harness
 * @graphNode tool
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.ts";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(INSTANCE_ROOT);

/**
 * Where the probe files go, and what they look like.
 *
 * The extensions are the ones this repository's scanners actually filter on —
 * a probe in a format nothing reads would make every writer look latent.
 */
const PLANT_DIRS = ["_kg/__probe__", "cat-harness/schemas/block-qa-schema/dist/__probe__"] as const;
const PLANT_FILES: Record<string, string> = {
  "probe.ts": "export const probe = 1;\n",
  "probe.md": "---\ntitle: probe\n---\n\n# probe\n",
  "probe.html": "<!doctype html><title>probe</title>\n",
  "probe.json": '{"probe": true}\n',
  "probe.bpmn": '<?xml version="1.0"?><definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"/>\n',
};

function git(args: string[], cwd = REPO): { out: string; ok: boolean } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
  return { out: r.stdout ?? "", ok: r.error === undefined && r.status === 0 };
}

/** Paths the working tree currently differs from HEAD in, with their content. */
export function treeState(repo = REPO): Map<string, string> {
  const state = new Map<string, string>();
  const { out } = git(["status", "--porcelain", "-z"], repo);
  for (const rec of out.split("\0")) {
    if (rec.length < 4) continue;
    const path = rec.slice(3);
    if (path.length === 0) continue;
    let body = "";
    try {
      body = readFileSync(join(repo, path), "utf-8");
    } catch {
      body = "<unreadable-or-deleted>";
    }
    state.set(path, body);
  }
  return state;
}

/** Do two runs' change-sets differ, and where? */
export function differingPaths(a: ReadonlyMap<string, string>, b: ReadonlyMap<string, string>): string[] {
  const out = new Set<string>();
  for (const [p, v] of a) if (b.get(p) !== v) out.add(p);
  for (const [p, v] of b) if (a.get(p) !== v) out.add(p);
  return [...out].sort();
}

function plant(): void {
  for (const dir of PLANT_DIRS) {
    for (const [name, body] of Object.entries(PLANT_FILES)) {
      const abs = join(REPO, dir, name);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, body);
    }
  }
}

function unplant(): void {
  for (const dir of PLANT_DIRS) rmSync(join(REPO, dir), { recursive: true, force: true });
}

/**
 * Put the tree back exactly as committed.
 *
 * `checkout -- .` restores tracked files a writer changed; untracked output a
 * writer created is left, and reported, because deleting a file this tool did
 * not create would be the `deletion-requires-confirmation` breach in the
 * script most likely to make it.
 */
function restore(): string[] {
  git(["checkout", "--", "."]);
  const stray = [...treeState().keys()];
  return stray;
}

export interface Verdict {
  writer: string;
  live: boolean;
  /** Paths whose content differed between the clean run and the planted run. */
  differing: string[];
  /** The writer exited non-zero in at least one run, so the answer is not established. */
  undetermined?: string;
}

function runWriter(cmd: string): boolean {
  const r = spawnSync("bun", ["run", cmd], { cwd: REPO, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
  return r.error === undefined && r.status === 0;
}

export function probe(writer: string): Verdict {
  const okA = runWriter(writer);
  const clean = treeState();
  restore();

  plant();
  const okB = runWriter(writer);
  const planted = treeState();
  restore();
  unplant();

  // A writer that failed is NOT latent — it is unmeasured. Reporting a failed
  // run as "no difference" is how a probe manufactures a clearance out of an
  // error, which is the `dh4f` shape one level up.
  if (!okA || !okB) {
    return { writer, live: false, differing: [], undetermined: "the writer exited non-zero in at least one run" };
  }
  const differing = differingPaths(clean, planted);
  return { writer, live: differing.length > 0, differing };
}

/** `package.json` scripts that write an artefact: `X` such that `X:check` exists. */
export function derivedWriters(repo = REPO): string[] {
  const s = JSON.parse(readFileSync(join(repo, "package.json"), "utf-8")) as {
    scripts: Record<string, string>;
  };
  return Object.keys(s.scripts)
    .filter((k) => k.endsWith(":check") && s.scripts[k.slice(0, -":check".length)] !== undefined)
    .map((k) => k.slice(0, -":check".length))
    .sort();
}

if (import.meta.main) {
  const only = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]
    : undefined;

  // A dirty tree makes every answer meaningless: the probe cannot tell its own
  // writer's output from what was already there.
  if (treeState().size > 0) {
    console.error("The working tree is not clean. This probe runs writers and compares what they change,\nso it cannot tell their output from yours. Commit or stash first.");
    process.exit(2);
  }
  if (!existsSync(join(REPO, ".git"))) {
    console.error("Not a git work tree — the probe has nothing to compare against.");
    process.exit(2);
  }

  const writers = derivedWriters().filter((w) => only === undefined || w.includes(only));
  if (writers.length === 0) {
    console.error(only === undefined
      ? "No writer derived from package.json. That is not a clean run — nothing was probed."
      : `No derived writer matches --only ${only}.`);
    process.exit(2);
  }

  const verdicts: Verdict[] = [];
  for (const w of writers) {
    process.stderr.write(`  probing ${w}\n`);
    verdicts.push(probe(w));
  }
  unplant();

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(verdicts, null, 2));
    process.exit(0);
  }

  const live = verdicts.filter((v) => v.live);
  const undet = verdicts.filter((v) => v.undetermined !== undefined);
  console.log(
    `\nlive-corpus probe — ${verdicts.length} writer(s): ` +
      `${live.length} LIVE, ${verdicts.length - live.length - undet.length} latent, ${undet.length} undetermined`,
  );
  for (const v of live) {
    console.log(`  ✗ LIVE  ${v.writer}`);
    for (const p of v.differing.slice(0, 6)) console.log(`        ${p}`);
  }
  for (const v of undet) console.log(`  ? ${v.writer} — ${v.undetermined}`);
  console.log(
    `\n  LATENT IS NOT A CLEARANCE. It means this plant did not reach the writer —\n` +
      `  ${Object.keys(PLANT_FILES).join(", ")} under ${PLANT_DIRS.join(" and ")}.\n` +
      `  A different extension or directory could still reach it, so "not reached by\n` +
      `  this probe" is the finding, never "measured clean".`,
  );
  process.exit(0);
}
