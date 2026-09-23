#!/usr/bin/env bun
/**
 * A BEAN COMPLETED ON A BRANCH, AND STILL OPEN ON `main`.
 *
 * Bean `4d22`. The sequence that loses a completion: a PR merges; the agent
 * marks the bean `completed` and pushes it to the SAME branch; the agent
 * re-branches from the merged main. The completion commit is now on the remote
 * branch only, no PR carries it, and `main` still reads `todo` — so the next
 * session is offered finished work. It happened twice in one session.
 *
 * The owner chose, 2026-09-23: **a rule and a check.** The rule is in
 * `bean-coordination` §"Complete the bean in the PR that lands it". This is the
 * check, and it REPORTS rather than fails:
 *
 * - A bean completed on a branch whose PR is OPEN is the rule being followed,
 *   not a defect — this session does it on every PR. A gate that failed on it
 *   would fail every correct PR.
 * - The distinguishing shape is measurable without the forge: an orphaned
 *   completion sits on a branch whose ONLY commits beyond `main` touch
 *   `beans/`. That branch is flagged `likely orphan`; any other is listed as
 *   `in a PR's work` for the reader to glance at.
 *
 * It reads the REMOTE refs already fetched (`git fetch origin
 * 'refs/heads/claude/*:refs/remotes/origin/claude/*'`) and says how many it
 * read — **zero branches read is "could not determine", never clean**. The
 * session-start sweep and `goal-review` are where it is meant to run; CI's
 * shallow checkout has no sibling refs, which is why this is not a gate there.
 *
 * Exit: 0 reported (including findings), 2 could not determine.
 */
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";

import { beanDefsDir } from "./beans.ts";

const REPO = join(import.meta.dir, "..", "..");
/**
 * The bean store and the graph that holds it, as the DECLARATION names them —
 * `beans/beans.json` via `beanDefsDir`, the one resolver every bean script
 * shares — repo-relative, because they are read at git refs, not on disk.
 */
const DEFS_ABS = beanDefsDir(REPO);
if (DEFS_ABS === null) {
  console.error("Bean orphans — the bean graph declares no `bean-defs` node, so there is no store to read.");
  process.exit(2);
}
const DEFS = relative(REPO, DEFS_ABS);
const BEAN_GRAPH = relative(REPO, dirname(DEFS_ABS));

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

/** A bean at one ref: its status and when it was last changed. */
export interface BeanAt { status: string; updatedAt: string }

/**
 * `file → { status, updatedAt }` for every bean at `ref`.
 *
 * KEYED ON THE FILE, not the id: two different beans can share an id suffix
 * (`t3n8` is two beans on `main` today), and an id-keyed map let one stand in
 * for the other — the first run reported a finished bean as an orphan of an
 * unrelated one.
 */
export function beansAt(ref: string, run: (a: string[]) => string = git): Map<string, BeanAt> {
  const out = new Map<string, BeanAt>();
  let names: string[];
  try {
    names = run(["ls-tree", "--name-only", `${ref}:${DEFS}`]).split("\n").filter((n) => n.endsWith(".md"));
  } catch {
    return out;
  }
  for (const n of names) {
    let text: string;
    try {
      text = run(["show", `${ref}:${DEFS}/${n}`]);
    } catch {
      continue;
    }
    const s = text.match(/^status:\s*(\S+)/m);
    const u = text.match(/^updated_at:\s*(\S+)/m);
    if (s) out.set(n, { status: s[1], updatedAt: u ? u[1] : "" });
  }
  return out;
}

export interface Orphan { bean: string; branch: string; onMain: string; likelyOrphan: boolean }

/**
 * Beans `completed` at `branch`, open at `main`, and completed AFTER main's
 * copy was last changed.
 *
 * THE DATE IS THE POINT. A long-idle branch that closed a bean `main` later
 * REOPENED on purpose (`5a3l`, reopened by its own branch) is not an orphan —
 * the branch is simply behind. Only a completion newer than everything `main`
 * knows about the bean is one `main` never received.
 */
export function orphansOn(
  main: Map<string, BeanAt>,
  branch: Map<string, BeanAt>,
  branchName: string,
  beansOnlyTail: boolean,
): Orphan[] {
  const out: Orphan[] = [];
  for (const [file, b] of branch) {
    const m = main.get(file);
    if (b.status !== "completed" || m === undefined) continue;
    if (m.status !== "todo" && m.status !== "in-progress") continue;
    if (m.updatedAt && b.updatedAt && b.updatedAt <= m.updatedAt) continue;
    const id = file.match(/^(folio-assistant-[a-z0-9]+)--/)?.[1] ?? file;
    out.push({ bean: id, branch: branchName, onMain: m.status, likelyOrphan: beansOnlyTail });
  }
  return out;
}

if (import.meta.main) {
  const branches = git(["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin/claude/"])
    .split("\n").filter(Boolean);
  if (branches.length === 0) {
    console.error("Bean orphans — no remote `claude/*` branch has been fetched, so nothing was read.");
    console.error("  Fetch them first: git fetch origin 'refs/heads/claude/*:refs/remotes/origin/claude/*'");
    process.exit(2);
  }
  // Only branches with commits main lacks can carry an orphan.
  const ahead = branches.filter((b) => {
    try { return git(["rev-list", "--count", `origin/main..${b}`]).trim() !== "0"; } catch { return false; }
  });
  // Only branches whose bean files DIFFER from main are worth reading in full.
  const touching = ahead.filter((b) => {
    try { return git(["diff", "--name-only", `origin/main...${b}`, "--", DEFS]).trim() !== ""; } catch { return false; }
  });
  const main = beansAt("origin/main");
  const found: Orphan[] = [];
  for (const b of touching) {
    const files = git(["diff", "--name-only", `origin/main...${b}`]).split("\n").filter(Boolean);
    const beansOnly = files.length > 0 && files.every((f) => f.startsWith(`${BEAN_GRAPH}/`));
    found.push(...orphansOn(main, beansAt(b), b.replace(/^origin\//, ""), beansOnly));
  }
  console.log(`Bean orphans — ${branches.length} remote branch(es) read, ${ahead.length} ahead of main, ` +
    `${touching.length} changing beans`);
  if (found.length === 0) {
    console.log("  ✓ no bean is completed on a branch while open on main");
    process.exit(0);
  }
  const likely = found.filter((f) => f.likelyOrphan);
  const inWork = found.filter((f) => !f.likelyOrphan);
  for (const f of likely) {
    console.log(`  ✗ ${f.bean}: completed on ${f.branch}, ${f.onMain} on main — LIKELY ORPHAN (the branch carries only bean changes)`);
  }
  for (const f of inWork) {
    console.log(`  · ${f.bean}: completed on ${f.branch}, ${f.onMain} on main — in a PR's work; fine while that PR is open`);
  }
  console.log("\nA likely orphan is recovered by merging that branch's bean commit into a PR, or by re-completing the bean " +
    "with its evidence — see bean-coordination §\"Complete the bean in the PR that lands it\".");
  process.exit(0);
}
