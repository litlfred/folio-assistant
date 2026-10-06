#!/usr/bin/env bun
/**
 * state-seed — REFRESH a seeded state branch from the ref it says it was
 * seeded from, and verify that it landed.
 *
 * @module scripts/state-seed
 * @covers beans
 * @covers todos
 *
 * ```sh
 * bun run state:seed --id beans              # refresh the seed, verify, report
 * bun run state:seed --id beans --dry-run    # what it would push, pushing nothing
 * bun run state:seed --id beans --authoritative   # the CUTOVER half: the branch becomes the store
 * ```
 *
 * ## Why this exists — `state:drift`'s remedy had no implementation
 *
 * `state-drift.ts` (bean `9ofm` row C) ends every drifted run with *"Refresh
 * the seed before any cutover"*, and nothing in the repository refreshed one.
 * Both refreshes so far were hand-run git plumbing recorded in a bean body
 * (bean `2h76`, 2026-10-02 and 2026-10-03), and the second was needed because
 * the first had gone **173 commits and 14 files** stale with nothing saying so.
 * A remedy a gate names but no command performs is a remedy that gets
 * improvised differently every time, and a hand-spliced tree is unverifiable
 * after the fact: the cutover replaces the whole subtree in one commit, so
 * there is no diff left to read.
 *
 * What a cutover from a stale seed does is worse than failing. It **resurrects**
 * whatever the seed still holds and **loses** whatever landed on the source ref
 * since — silently, because the branch is perfectly well-formed either way.
 *
 * ## Keyed by the SPECIAL-BRANCH row, not by the declared directory
 *
 * `branch-store mount --id` and `push --id` are keyed by DIRECTORY id (the
 * owner's 2026-10-03 ruling: one generic pair for beans, todos and fsh-guts
 * alike), and this is deliberately keyed by the observed row id (the retired `special-branches.json` used the same ids)
 * instead — the same key `state:drift` uses. The reason is the state this
 * command exists for: before a cutover the directory's declaration still says
 * `source: { kind: "directory" }`, so `resolveTipLocation` refuses it, and a
 * refresh keyed off the declaration would be unavailable in exactly the
 * pre-cutover window it is for. The ids coincide for every state branch today
 * (`beans`, `todos`, `fsh-guts`), so this is a different KEY rather than a
 * different name.
 *
 * Which paths to copy is read from the branch's own `manifest.json`
 * (`graphs[].path`, or the older `subgraph`), and the source ref from its
 * `source.ref`. Both are read rather than assumed: a seed that records another
 * ref is refreshed from the ref it claims, and a seed that records none is a
 * refusal rather than a guess at `main`.
 *
 * ## It refuses the two states where a refresh would destroy work
 *
 * - `authoritative: true` — the branch IS the store. Copying `main` over it
 *   would overwrite every edit made since the cutover with a stale copy of a
 *   directory `main` no longer even tracks.
 * - `status: "retired"` — a superseded seed (`cat/cat-harness/state`, owner
 *   ruling D4 (b)). Refreshing it would make a branch nothing should read look
 *   current, which is how a cutover tool picks the wrong one.
 *
 * Both are `refused` (exit 5), never a silent no-op, because "nothing to do"
 * and "I declined to do this" are different answers to a caller.
 *
 * ## `--authoritative` is the cutover's branch half, and it is one-way
 *
 * The cutover is one commit on `main` (the declaration, the `git rm`, the
 * `.gitignore`) and one push to the branch (the current content, plus
 * `authoritative: true`). This performs the second half. Afterwards this
 * command refuses the branch, by the rule above — which is what makes the flag
 * one-way rather than a mode.
 *
 * ## Why it does not go through {@link BranchStore.write}
 *
 * `write()` is blob-keyed: it takes a list of file contents, and it REFUSES
 * `manifest.json` because that file describes the branch rather than the
 * subgraph. A refresh is the one write that must replace a whole SUBTREE (1442
 * files for `beans`) and rewrite the manifest. So it splices trees with the
 * same plumbing and the same discipline — `commit-tree -p tip`, push without
 * `-f`, the server's ref lock as the concurrency primitive — rather than
 * widening `write()` into two shapes.
 *
 * ## `--cutover` is the MAIN half, and it never pushes (bean `hp54`)
 *
 * After `--authoritative`, the cutover still needed a hand-run `git rm -r`,
 * a `.gitignore` line and a commit — measured 2026-10-06 cutting a folio's
 * `beans/` and `todos/` over. {@link cutoverMain} is that half. It REFUSES
 * unless:
 *
 * - the branch's manifest says `authoritative: true` (the branch is the store);
 * - the directory is declared on that branch (`source` / `storage`, read
 *   through `tipLocations`) — flipping the declaration and removing the files
 *   are one change (bean `9ofm`), so the declaration comes first;
 * - the checkout has no uncommitted change under the path;
 * - `HEAD:<path>` and the branch's `<path>` are the SAME tree id — byte-
 *   identical, every file, mode and name, so nothing is removed from `main`
 *   that the branch does not hold.
 *
 * It is a DRY RUN unless `--commit` is passed: it reports the files and bytes
 * it would remove. With `--commit` it stages `git rm -r <path>` and a
 * `/<path>/**` ignore line (the `/fsh-guts/**` precedent: a mount must never be
 * committed) as ONE commit naming the branch and the tree id. It never pushes —
 * the caller reviews and pushes. `deletion-requires-confirmation`: the dry run
 * is the report, `--commit` is the person saying go.
 *
 * ## Which repository — the cwd's, not the platform's (bean `hp54`)
 *
 * Every default here resolves through `defaultRepoRoot()`: the git toplevel of
 * the directory the command is run from. It used to be the platform checkout
 * unconditionally, so a folio linking the platform as a submodule refreshed
 * the PLATFORM's branch. `--repo-root <dir>` overrides it.
 *
 * Exit codes: 0 refreshed or already current (or cut over / would cut over)
 * · 1 pushed and still not verified · 4 could not determine · 5 refused.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { BranchStore, MANIFEST_FILE, MANIFEST_SCHEMA, tipLocations, type TreeEntry } from "../../cat-harness/scripts/branch-store.ts";
import { candidatesOf, defaultRepoRoot, observedRows, type SpecialBranch } from "../../cat-harness/scripts/state-drift.ts";

/** What the manifest says, as far as a refresh needs it. */
interface SeedManifest {
  $schema?: string;
  status?: string;
  authoritative?: boolean;
  subgraph?: string;
  source?: { ref?: string; sha?: string };
  graphs?: Array<{ path: string; tree?: string; files?: number }>;
  [k: string]: unknown;
}

export interface SeedOptions {
  repoRoot?: string;
  remote?: string;
  storeDir?: string;
  /** Mark the branch as the store (the cutover's branch half). */
  authoritative?: boolean;
  dryRun?: boolean;
  message?: string;
  log?: (l: string) => void;
}

export interface GraphRefresh {
  path: string;
  /** The subtree id on the source ref — what the branch should hold. */
  want: string;
  /** What the branch held before this run. */
  had: string | undefined;
  files: number;
}

export type SeedResult =
  | {
      state: "refreshed" | "current";
      branch: string;
      ref: string;
      sha: string;
      graphs: GraphRefresh[];
      commit?: string;
      /** Verified by RE-READING the pushed tip, not by trusting the push. */
      verified: boolean;
      reason: string;
    }
  | { state: "refused" | "unknown" | "failed"; branch: string; reason: string };

/**
 * The branch named by `id`: a declared directory id, a branch name, or a
 * branch's last segment (`beans` for `cat/cat-harness/beans`, the id the
 * retired table used). Rows come from what the remote OBSERVABLY holds and what
 * the declarations name (bean rva2); the old `special-branches.json` table is gone.
 */
export function rowFor(id: string, rows: SpecialBranch[] = observedRows() ?? []): SpecialBranch | undefined {
  return rows.find((r) => r.id === id) ?? rows.find((r) => r.name === id) ?? rows.find((r) => r.name.endsWith(`/${id}`));
}

/**
 * Refresh one seeded state branch.
 *
 * The source ref is fetched into the SAME private bare store as the branch, so
 * the two trees' object ids are directly comparable and the splice needs no
 * second repository — `state-drift.ts` compares them the same way, and a
 * refresh that computed equality differently from the gate that checks it
 * would be two answers to one question.
 */
export function refreshSeed(row: SpecialBranch, opts: SeedOptions = {}): SeedResult {
  const candidates = candidatesOf(row);
  if (!candidates) return { state: "refused", branch: row.name, reason: `${row.id} is a branch FAMILY (${row.name}), not a single branch; there is no seed to refresh` };
  const log = opts.log ?? ((l: string) => console.error(l));
  const open = (names: string[]): BranchStore =>
    BranchStore.open(names, { repoRoot: opts.repoRoot, remote: opts.remote, storeDir: opts.storeDir, log: () => {} });

  const store = open(candidates);
  const tip = store.fetchTip();
  if (tip.state !== "ok") {
    return { state: "unknown", branch: row.name, reason: `could not resolve ${row.name}: ${tip.state === "absent" ? "no such branch on the remote" : tip.reason}` };
  }
  const rootTree = store.must(["rev-parse", `${tip.tip}^{tree}`]).trim();

  // The manifest, through the plumbing: `readJson` asks "is this a valid state
  // store", which is a different question and would fold a branch that is not
  // a seed into `corrupt`.
  const entry = store.lookup(rootTree, MANIFEST_FILE);
  if (!entry || entry.type !== "blob") return { state: "refused", branch: tip.branch, reason: `${tip.branch} carries no ${MANIFEST_FILE} at its root, so it is not a seed of anything` };
  if (!store.ensureBlobs(rootTree, [entry.sha])) return { state: "unknown", branch: tip.branch, reason: `could not fetch ${MANIFEST_FILE} from ${tip.branch}` };
  let m: SeedManifest;
  try {
    m = JSON.parse(store.blobText(entry.sha)) as SeedManifest;
  } catch (e) {
    return { state: "unknown", branch: tip.branch, reason: `${MANIFEST_FILE} on ${tip.branch} does not parse: ${(e as Error).message}` };
  }
  if (m.$schema !== MANIFEST_SCHEMA) return { state: "refused", branch: tip.branch, reason: `root manifest is ${m.$schema ?? "untyped"}, not ${MANIFEST_SCHEMA}` };
  if (m.status === "retired") {
    return { state: "refused", branch: tip.branch, reason: `${tip.branch} is RETIRED (superseded); refreshing it would make a branch nothing should read look current` };
  }
  if (m.authoritative === true) {
    return {
      state: "refused",
      branch: tip.branch,
      reason:
        `${tip.branch} says it IS the store (\`authoritative: true\`). A refresh from ${m.source?.ref ?? "a source ref"} would overwrite ` +
        `every edit made since the cutover with a copy of a directory the source ref no longer tracks.`,
    };
  }
  const ref = m.source?.ref;
  if (!ref) return { state: "refused", branch: tip.branch, reason: `${MANIFEST_FILE} records no \`source.ref\`, so there is nothing to refresh FROM` };
  const paths = (m.graphs?.length ? m.graphs.map((g) => g.path) : m.subgraph ? [m.subgraph] : []).filter(Boolean);
  if (!paths.length) return { state: "refused", branch: tip.branch, reason: `${MANIFEST_FILE} names no graph path` };

  const src = open([ref]);
  const srcTip = src.fetchTip();
  if (srcTip.state !== "ok") {
    return { state: "unknown", branch: tip.branch, reason: `could not resolve ${ref}: ${srcTip.state === "absent" ? "no such branch on the remote" : srcTip.reason}` };
  }
  const srcTree = src.must(["rev-parse", `${srcTip.tip}^{tree}`]).trim();

  const graphs: GraphRefresh[] = [];
  let tree: string = rootTree;
  for (const path of paths) {
    const want = src.lookup(srcTree, path);
    if (!want) return { state: "refused", branch: tip.branch, reason: `${ref} has no ${path}; a seed of a path its source no longer carries cannot be refreshed — cut it over or retire the branch` };
    if (want.type !== "tree") return { state: "refused", branch: tip.branch, reason: `${path} on ${ref} is a ${want.type}, not a directory` };
    // Every blob under the subtree must be LOCAL before the push: the private
    // store is a partial clone (`--filter=blob:none`), and a push whose pack
    // needs an object it does not have fails after the commit is built.
    const left = src.hydrate(want.sha);
    if (left > 0) return { state: "unknown", branch: tip.branch, reason: `could not fetch ${left} object(s) under ${ref}:${path}; nothing pushed` };
    const files = src.must(["ls-tree", "-r", "--name-only", want.sha]).split("\n").filter(Boolean).length;
    const had = store.lookup(rootTree, path)?.sha;
    graphs.push({ path, want: want.sha, had, files });
    tree = store.setPath(tree, path.split("/").filter(Boolean), { mode: "040000", type: "tree", sha: want.sha, name: "" } as TreeEntry)!;
  }

  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const next: SeedManifest = {
    ...m,
    status: opts.authoritative ? "authoritative" : (m.status ?? "seed"),
    authoritative: opts.authoritative ? true : (m.authoritative ?? false),
    source: { ...m.source, ref, sha: srcTip.tip },
    refreshedAt: now,
    ...(opts.authoritative ? { authoritativeSince: now } : {}),
    graphs: graphs.map((g) => ({ path: g.path, tree: g.want, files: g.files })),
  };
  const blob = store.hashBlob(JSON.stringify(next, null, 2) + "\n");
  tree = store.setPath(tree, [MANIFEST_FILE], { mode: "100644", type: "blob", sha: blob, name: "" } as TreeEntry)!;

  const drifted = graphs.filter((g) => g.had !== g.want);
  // `current` is decided on the GRAPH SUBTREES, not on the spliced root tree.
  //
  // The manifest carries `refreshedAt` and `source.sha`, so the root tree
  // differs on every run even when not one file of the subgraph has moved —
  // which meant a second `state:seed` pushed a commit whose only content was
  // a new timestamp. Found by this module's own test asserting `current`, and
  // worth more than the commit it saves: the drift gate reads nothing but the
  // live trees, so those pushes buy no provenance anybody consults, while
  // `beans/README.md`'s count line is already this repository's most-cited
  // example (`y7b3`, 76 of 235 conflicted merges) of a generated line that
  // churned a branch for no reader.
  //
  // `--authoritative` is the exception and is NOT a refresh: it changes what
  // the branch IS, so it pushes even when every subtree already matches.
  if (drifted.length === 0 && !opts.authoritative) {
    return { state: "current", branch: tip.branch, ref, sha: srcTip.tip, graphs, verified: true, reason: `${tip.branch} already holds ${ref}@${srcTip.tip.slice(0, 12)}` };
  }
  if (opts.dryRun) {
    return {
      state: "refreshed",
      branch: tip.branch,
      ref,
      sha: srcTip.tip,
      graphs,
      verified: false,
      reason: `dry run: would push ${drifted.length} refreshed subtree(s) and the manifest; nothing was pushed`,
    };
  }

  const message =
    opts.message ??
    `state(${row.id}): refresh the seed from ${ref}@${srcTip.tip.slice(0, 12)}` +
      (opts.authoritative ? " and mark the branch AUTHORITATIVE (cutover)" : "");
  const commit = store.must(["commit-tree", "--no-gpg-sign", tree, "-p", tip.tip, "-m", message]).trim();
  // NO -f. A moved tip is a rejection, and the honest answer is to re-run over
  // what landed rather than to replace it: this command carries a whole
  // subtree, so a force push would discard a sibling's whole graph.
  const push = store.git(["-c", "pack.useSparse=false", "push", "-q", "origin", `${commit}:refs/heads/${tip.branch}`]);
  if (push.status !== 0) {
    return { state: "failed", branch: tip.branch, reason: `push to ${tip.branch} was rejected: ${push.stderr.split("\n").filter(Boolean).join(" | ")}` };
  }

  // VERIFY by re-reading the tip. A push that returned 0 is evidence that the
  // ref moved, not that it holds what was intended — and this command's whole
  // purpose is that a cutover is not taken on trust.
  const after = open(candidates);
  const back = after.fetchTip();
  let verified = false;
  if (back.state === "ok") {
    const t = after.must(["rev-parse", `${back.tip}^{tree}`]).trim();
    verified = graphs.every((g) => after.lookup(t, g.path)?.sha === g.want);
  }
  log(`state-seed: ${tip.branch} ← ${ref}@${srcTip.tip.slice(0, 12)} as ${commit.slice(0, 12)}${verified ? " (verified)" : ""}`);
  return {
    state: "refreshed",
    branch: tip.branch,
    ref,
    sha: srcTip.tip,
    graphs,
    commit,
    verified,
    reason: verified
      ? `${graphs.length} graph(s) now match ${ref}@${srcTip.tip.slice(0, 12)}, verified by re-reading the tip`
      : `pushed ${commit.slice(0, 12)}, but a re-read of ${tip.branch} does NOT match ${ref}@${srcTip.tip.slice(0, 12)} — do not cut over`,
  };
}

export interface CutoverOptions {
  repoRoot?: string;
  remote?: string;
  storeDir?: string;
  /** Make the commit. Without it, a dry run. Never pushes either way. */
  commit?: boolean;
}

export type CutoverResult =
  | {
      state: "would-cut-over" | "cut-over";
      branch: string;
      paths: Array<{ path: string; tree: string; files: number; bytes: number }>;
      /** The commit made, with `commit: true`. Not pushed. */
      commit?: string;
      reason: string;
    }
  | { state: "refused" | "unknown"; branch: string; reason: string };

/** The MAIN half of a cutover. See the module docblock, §"`--cutover`". */
export function cutoverMain(row: SpecialBranch, opts: CutoverOptions = {}): CutoverResult {
  const repoRoot = opts.repoRoot ?? defaultRepoRoot();
  const candidates = candidatesOf(row);
  if (!candidates) return { state: "refused", branch: row.name, reason: `${row.id} is a branch FAMILY, not a single branch` };
  const store = BranchStore.open(candidates, { repoRoot, remote: opts.remote, storeDir: opts.storeDir, log: () => {} });
  const tip = store.fetchTip();
  if (tip.state !== "ok") {
    return { state: "unknown", branch: row.name, reason: `could not resolve ${row.name}: ${tip.state === "absent" ? "no such branch on the remote" : tip.reason}` };
  }
  const rootTree = store.must(["rev-parse", `${tip.tip}^{tree}`]).trim();
  const entry = store.lookup(rootTree, MANIFEST_FILE);
  if (!entry || entry.type !== "blob" || !store.ensureBlobs(rootTree, [entry.sha])) {
    return { state: "refused", branch: tip.branch, reason: `${tip.branch} carries no readable ${MANIFEST_FILE}` };
  }
  let m: SeedManifest;
  try {
    m = JSON.parse(store.blobText(entry.sha)) as SeedManifest;
  } catch (e) {
    return { state: "unknown", branch: tip.branch, reason: `${MANIFEST_FILE} does not parse: ${(e as Error).message}` };
  }
  if (m.$schema !== MANIFEST_SCHEMA) return { state: "refused", branch: tip.branch, reason: `root manifest is ${m.$schema ?? "untyped"}, not ${MANIFEST_SCHEMA}` };
  if (m.authoritative !== true) {
    return {
      state: "refused",
      branch: tip.branch,
      reason: `${tip.branch} is not \`authoritative: true\` — main is still the store. Run \`state:seed --id ${row.id} --authoritative\` first.`,
    };
  }
  // `branch-store` reads a tip-keyed branch only if its manifest SAYS tip, so a
  // cutover onto one that does not would leave main empty and the mount
  // `corrupt` — measured end to end on a hand-made seed (bean hp54).
  if (m.keyedBy !== "tip") {
    return { state: "refused", branch: tip.branch, reason: `${tip.branch}'s manifest says keyedBy ${String(m.keyedBy)}, not tip, so state:mount would refuse it; fix the manifest before removing anything from main` };
  }
  const paths = (m.graphs?.length ? m.graphs.map((g) => g.path) : m.subgraph ? [m.subgraph] : []).filter(Boolean);
  if (!paths.length) return { state: "refused", branch: tip.branch, reason: `${MANIFEST_FILE} names no graph path` };

  const git = (args: string[]) => spawnSync("git", args, { cwd: repoRoot, encoding: "utf-8", maxBuffer: 256 * 1024 * 1024 });
  let declared: ReturnType<typeof tipLocations>;
  try {
    declared = tipLocations(repoRoot, "tip");
  } catch (e) {
    return { state: "unknown", branch: tip.branch, reason: `could not read the declarations under ${repoRoot}: ${(e as Error).message}` };
  }
  const out: Array<{ path: string; tree: string; files: number; bytes: number }> = [];
  for (const path of paths) {
    const clean = path.replace(/\/+$/, "");
    if (!declared.some((d) => d.path === clean && d.branch === tip.branch)) {
      return {
        state: "refused",
        branch: tip.branch,
        reason: `no declaration in ${repoRoot} keeps ${clean}/ on ${tip.branch} at its tip. Declare \`source: { kind: "branch", branch: "${tip.branch}", keyedBy: "tip" }\` first — the declaration and the removal are one change (bean 9ofm).`,
      };
    }
    const dirty = git(["status", "--porcelain", "--", clean]);
    if (dirty.status !== 0) return { state: "unknown", branch: tip.branch, reason: `git status failed in ${repoRoot}: ${dirty.stderr.trim()}` };
    if (dirty.stdout.trim()) return { state: "refused", branch: tip.branch, reason: `${clean}/ has uncommitted changes in ${repoRoot}; commit or push them to the branch first` };
    const local = git(["rev-parse", "--verify", "--quiet", `HEAD:${clean}`]);
    if (local.status !== 0 || !local.stdout.trim()) {
      return { state: "refused", branch: tip.branch, reason: `HEAD does not track ${clean}/ — already cut over, or never on main` };
    }
    const want = store.lookup(rootTree, clean);
    if (!want || want.sha !== local.stdout.trim()) {
      return {
        state: "refused",
        branch: tip.branch,
        reason:
          `${clean}/ on HEAD is tree ${local.stdout.trim().slice(0, 12)} and on ${tip.branch} is ${want ? `tree ${want.sha.slice(0, 12)}` : "absent"} — ` +
          `not byte-identical, so removing it from main could lose work. Refresh the branch (or push main's edits to it) first.`,
      };
    }
    const ls = git(["ls-tree", "-r", "-l", "HEAD", "--", clean]);
    const rows = ls.stdout.split("\n").filter(Boolean);
    const bytes = rows.reduce((n, l) => n + (Number(l.split(/\s+/)[3]) || 0), 0);
    out.push({ path: clean, tree: want.sha, files: rows.length, bytes });
  }

  const summary = out.map((p) => `${p.path}/ (${p.files} file(s), ${p.bytes} bytes, tree ${p.tree.slice(0, 12)})`).join(", ");
  if (opts.commit !== true) {
    return { state: "would-cut-over", branch: tip.branch, paths: out, reason: `dry run: would remove ${summary} from main and ignore the mount path. Re-run with --commit to stage it as one commit (nothing is pushed).` };
  }

  for (const p of out) {
    const rm = git(["rm", "-r", "-q", "--", p.path]);
    if (rm.status !== 0) return { state: "unknown", branch: tip.branch, reason: `git rm -r ${p.path} failed: ${rm.stderr.trim()}` };
  }
  const ignorePath = join(repoRoot, ".gitignore");
  const existing = existsSync(ignorePath) ? readFileSync(ignorePath, "utf-8") : "";
  const lines = out.map((p) => `/${p.path}/**`).filter((l) => !existing.split("\n").includes(l));
  if (lines.length) {
    appendFileSync(
      ignorePath,
      `${existing && !existing.endsWith("\n") ? "\n" : ""}# Kept on ${tip.branch}; mounted here by state:mount, never committed to main\n${lines.join("\n")}\n`,
    );
  }
  const add = git(["add", "--", ".gitignore"]);
  if (add.status !== 0) return { state: "unknown", branch: tip.branch, reason: `git add .gitignore failed: ${add.stderr.trim()}` };
  const message =
    `state(${row.id}): cut ${out.map((p) => `${p.path}/`).join(", ")} over to ${tip.branch} — the main half\n\n` +
    out.map((p) => `${p.path}/ is tree ${p.tree} on ${tip.branch}@${tip.tip.slice(0, 12)}, byte-identical to HEAD:${p.path}; ${p.files} file(s), ${p.bytes} bytes removed from main.`).join("\n") +
    `\n\nThe branch manifest says authoritative: true. Mount it with state:mount.`;
  const commit = git(["commit", "-q", "-m", message]);
  if (commit.status !== 0) return { state: "unknown", branch: tip.branch, reason: `git commit failed: ${commit.stderr.trim() || commit.stdout.trim()}` };
  const sha = git(["rev-parse", "HEAD"]).stdout.trim();
  return { state: "cut-over", branch: tip.branch, paths: out, commit: sha, reason: `committed ${sha.slice(0, 12)} removing ${summary}; NOT pushed — review it, then push` };
}

export function cutoverReport(r: CutoverResult): string {
  if (r.state === "refused" || r.state === "unknown") return `${r.state === "refused" ? "·" : "✗"} ${r.branch}: ${r.state} — ${r.reason}`;
  const L = [`${r.state === "cut-over" ? "✓" : "·"} ${r.branch}: ${r.state} — ${r.reason}`];
  for (const p of r.paths) L.push(`    - ${p.path}/: ${p.files} file(s), ${p.bytes} bytes, tree ${p.tree}`);
  return L.join("\n");
}

export function report(r: SeedResult): string {
  // Narrowed by naming the arm it KEEPS: `typescript7` declines to narrow this
  // union by excluding three of the other arm's literals.
  if (r.state !== "refreshed" && r.state !== "current") {
    return `${r.state === "refused" ? "·" : "✗"} ${r.branch}: ${r.state} — ${r.reason}`;
  }
  // A dry run has pushed nothing, so it is neither verified nor failed — the
  // third mark, for the same reason every other report here keeps three.
  const mark = r.state === "refreshed" && r.commit === undefined ? "·" : r.verified ? "✓" : "✗";
  const L = [`${mark} ${r.branch}: ${r.state} — ${r.reason}`];
  for (const g of r.graphs) {
    L.push(`    ${g.had === g.want ? "·" : "→"} ${g.path}: ${g.files} file(s), tree ${g.want.slice(0, 12)}${g.had && g.had !== g.want ? ` (was ${g.had.slice(0, 12)})` : ""}`);
  }
  return L.join("\n");
}

export function exitCode(r: SeedResult): number {
  switch (r.state) {
    case "current":
      return 0;
    case "refreshed":
      return r.verified || r.commit === undefined ? 0 : 1;
    case "refused":
      return 5;
    case "failed":
      return 1;
    case "unknown":
      return 4;
  }
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const named = (f: string): string | undefined => {
    const i = argv.indexOf(f);
    return i === -1 ? undefined : argv[i + 1];
  };
  const id = named("--id");
  if (!id) {
    console.error(
      "usage: bun run state:seed --id <directory id or branch> [--repo-root <dir>] [--from-manifest] [--authoritative] [--dry-run] [--json]\n" +
        "       bun run state:seed --id <id> --cutover [--commit] [--repo-root <dir>] [--json]",
    );
    process.exit(5);
  }
  // The repository the run is ABOUT: the cwd's git toplevel unless told
  // otherwise — never the platform's own checkout by default (bean hp54).
  const repoRoot = named("--repo-root") !== undefined ? resolve(named("--repo-root")!) : defaultRepoRoot();
  const rows = observedRows({ repoRoot }) ?? [];
  const row = rowFor(id, rows);
  if (!row) {
    console.error(`state-seed: no declared directory or remote branch in ${repoRoot} is named ${id}; the branches are ${rows.map((r) => r.name).join(", ")}`);
    process.exit(5);
  }
  if (argv.includes("--cutover")) {
    const c = cutoverMain(row, { repoRoot, commit: argv.includes("--commit") });
    if (argv.includes("--json")) console.log(JSON.stringify(c, null, 2));
    else console.log(cutoverReport(c));
    process.exit(c.state === "refused" ? 5 : c.state === "unknown" ? 4 : 0);
  }
  const r = refreshSeed(row, {
    repoRoot,
    authoritative: argv.includes("--authoritative"),
    dryRun: argv.includes("--dry-run"),
    message: named("--message"),
  });
  if (argv.includes("--json")) console.log(JSON.stringify(r, null, 2));
  else console.log(report(r));
  process.exit(exitCode(r));
}
