#!/usr/bin/env bun
/**
 * Carry the open PRs' `STAGING/` previews across a full-replace `gh-pages` deploy.
 *
 * ## The defect this exists for — bean `plj1`
 *
 * `peaceiris/actions-gh-pages@v4` with `keep_files: false` and no
 * `destination_dir` does exactly this at push time (its own
 * `src/git-utils.ts`, `setRepo`):
 *
 * ```
 * git clone --depth=1 --single-branch --branch gh-pages <remote> workDir
 * git rm -r --ignore-unmatch '*'      # ← everything on the branch, STAGING included
 * cp -R publish_dir/* workDir/
 * ```
 *
 * `docs-site.yml` is the ONLY `gh-pages` publisher in this repository without
 * `keep_files: true` — measured against all six, 2026-09-19 — and it is the one
 * that fires on every push to `main` touching `docs/`, `skills/workflows/`,
 * `schemas/` or four scripts. So the most frequently run publisher was the only
 * one that wiped, and what it wiped was every open PR's review preview.
 *
 * Measured on the real `gh-pages` history, 2026-09-19 — every `docs(gh-pages)`
 * commit in the window deleted every preview its own parent carried:
 *
 * | deploy | previews on parent | previews after |
 * |---|---|---|
 * | `a9c58f8ec` | 1 | 0 |
 * | `498edc4d1` | 3 | 0 |
 * | `d98ad6c82` | 1 | 0 |
 *
 * It is silent: the staging push succeeds, the bot comments the URL on the PR,
 * the check run is green, and an unrelated merge to `main` removes the artefact
 * minutes later. A reviewer following the link gets a 404 with nothing anywhere
 * saying why — and `AGENTS.md`'s merge discipline turns on staging being the
 * place a human assesses a rendered artefact.
 *
 * ## Why not `keep_files: true`
 *
 * Because `keep_files` is not path-scoped and the action offers nothing that
 * is — its `action.yml` has `keep_files`, `force_orphan` and `exclude_assets`,
 * and `exclude_assets` filters the SOURCE directory, not the branch. So
 * `keep_files: true` would also stop the main site's own deleted pages from
 * ever disappearing: rename a doc and both the old and the new URL serve
 * forever, and nothing would ever report it.
 *
 * Restoring `STAGING/` into the publish directory keeps both halves: the main
 * site is still a full replace, so a removed page goes; the previews are part
 * of what is published, so they stay.
 *
 * ## "Could not determine" is a third state, and it is the important one
 *
 * An unreadable `gh-pages` must NEVER render as "there are no previews to
 * keep" — that reading deploys the wipe this module exists to stop. Four
 * outcomes, and only the first three are allowed to continue:
 *
 * - **`restored`** — the branch was read and carries previews; they are now in
 *   the publish directory.
 * - **`empty`** — the branch was read and carries none. A determined empty.
 * - **`no-branch`** — the branch positively does not exist (first deploy).
 *   `git ls-remote --exit-code` says so with exit 2, which is distinct from a
 *   failure.
 * - **`unknown`** — the branch could not be read. Exit **2**, which fails the
 *   deploy step on purpose, the same way `translation:index` fails it rather
 *   than publish a navbar whose translation set could not be determined.
 *
 * ## `--verify`, because a green run proves nothing here
 *
 * The action re-clones `gh-pages` itself at push time, so there is a window of
 * a few seconds between this restore and that clone in which a
 * `feature-staging` deploy can land a preview that the push then removes. That
 * window is seconds against the whole of every deploy before this change, but
 * it is not zero, and a loss inside it would be exactly as silent as the defect.
 *
 * So the restore records what it restored (`--state`), and `--verify` re-reads
 * the branch afterwards and exits non-zero naming any preview that did not
 * survive. A new preview pushed in the window is ADDED, never missing, so the
 * comparison has no false positives. `unknown` there is exit 2 again — a
 * verifier that has gone blind must not read as a pass.
 *
 * Usage:
 * ```sh
 * bun run scripts/restore-staging.ts --site ./_site --state ./.staging-state.json
 * bun run scripts/restore-staging.ts --verify --state ./.staging-state.json
 * ```
 *
 * @module scripts/restore-staging
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/** Where the previews live on the publish branch. */
export const STAGING_PREFIX = "STAGING";

export interface RestoreOptions {
  /** Git working directory the commands run in. */
  repo: string;
  /** Remote name or URL holding the publish branch. */
  remote: string;
  /** The publish branch. */
  branch: string;
  /** The directory on the branch holding the previews. */
  prefix: string;
  /** The publish directory the deploy will replace the branch with. */
  site: string;
}

export type RestoreOutcome =
  | { state: "restored"; previews: string[] }
  | { state: "empty"; previews: [] }
  | { state: "no-branch"; previews: [] }
  | { state: "unknown"; previews: []; reason: string };

export type VerifyOutcome =
  | { state: "ok"; expected: string[]; present: string[] }
  | { state: "lost"; expected: string[]; present: string[]; lost: string[] }
  | { state: "unknown"; expected: string[]; reason: string };

interface Ran {
  code: number;
  out: string;
  err: string;
  spawned: boolean;
}

function git(cwd: string, args: string[]): Ran {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error !== undefined || r.status === null) {
    return { code: -1, out: "", err: String(r.error ?? "git did not run"), spawned: false };
  }
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "", spawned: true };
}

/**
 * Does the publish branch exist?
 *
 * `--exit-code` is what separates the two answers that matter: **2** is
 * "asked, and there is no such ref", anything else non-zero is "could not
 * ask". Collapsing them is the whole bug in miniature.
 */
function branchState(o: RestoreOptions): "present" | "absent" | { reason: string } {
  const r = git(o.repo, ["ls-remote", "--exit-code", "--heads", o.remote, o.branch]);
  if (r.code === 0 && r.out.trim() !== "") return "present";
  if (r.code === 2) return "absent";
  return { reason: `git ls-remote ${o.remote} ${o.branch} exited ${r.code}: ${r.err.trim() || r.out.trim()}` };
}

/** The preview directory names under `prefix` at `rev`, or a reason it could not be read. */
function previewsAt(repo: string, rev: string, prefix: string): string[] | { reason: string } {
  const has = git(repo, ["ls-tree", "--name-only", rev, `${prefix}`]);
  if (has.code !== 0) return { reason: `git ls-tree ${rev} ${prefix} exited ${has.code}: ${has.err.trim()}` };
  if (has.out.trim() === "") return [];
  const kids = git(repo, ["ls-tree", "-d", "--name-only", `${rev}:${prefix}`]);
  if (kids.code !== 0) return { reason: `git ls-tree ${rev}:${prefix} exited ${kids.code}: ${kids.err.trim()}` };
  return kids.out.split("\n").map((s) => s.trim()).filter((s) => s !== "").sort();
}

/**
 * Fetch the publish branch and copy its `STAGING/` into the publish directory.
 *
 * Nothing is written to `site` unless the branch was READ and carries
 * previews. An `unknown` leaves the tree exactly as it found it, so a caller
 * that ignores the exit code still does not publish a half-restored site.
 */
export function restoreStaging(o: RestoreOptions): RestoreOutcome {
  const present = branchState(o);
  if (present === "absent") return { state: "no-branch", previews: [] };
  if (typeof present === "object") return { state: "unknown", previews: [], reason: present.reason };

  const fetched = git(o.repo, ["fetch", "--depth=1", "--no-tags", o.remote, o.branch]);
  if (fetched.code !== 0) {
    return {
      state: "unknown",
      previews: [],
      reason: `git fetch ${o.remote} ${o.branch} exited ${fetched.code}: ${fetched.err.trim()}`,
    };
  }

  const found = previewsAt(o.repo, "FETCH_HEAD", o.prefix);
  if (!Array.isArray(found)) return { state: "unknown", previews: [], reason: found.reason };
  if (found.length === 0) return { state: "empty", previews: [] };

  const into = resolve(o.site);
  mkdirSync(into, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "restore-staging-"));
  try {
    const tar = join(work, "staging.tar");
    const archived = git(o.repo, ["archive", "--format=tar", "-o", tar, "FETCH_HEAD", o.prefix]);
    if (archived.code !== 0) {
      return { state: "unknown", previews: [], reason: `git archive exited ${archived.code}: ${archived.err.trim()}` };
    }
    const untar = spawnSync("tar", ["-xf", tar, "-C", into], { encoding: "utf-8" });
    if (untar.error !== undefined || untar.status !== 0) {
      return {
        state: "unknown",
        previews: [],
        reason: `tar -xf exited ${untar.status ?? "?"}: ${String(untar.error ?? untar.stderr ?? "").trim()}`,
      };
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return { state: "restored", previews: found };
}

/**
 * Did the previews the restore carried actually survive the deploy?
 *
 * Compares against what the restore RECORDED, not against the deploy commit's
 * parent: a preview pushed after ours only adds to the branch, so this cannot
 * report one as lost, and it needs no assumption about which commit is HEAD.
 */
export function verifyStaging(o: RestoreOptions, expected: string[]): VerifyOutcome {
  const present = branchState(o);
  if (typeof present === "object") return { state: "unknown", expected, reason: present.reason };
  if (present === "absent") {
    if (expected.length === 0) return { state: "ok", expected, present: [] };
    return { state: "lost", expected, present: [], lost: [...expected] };
  }

  const fetched = git(o.repo, ["fetch", "--depth=1", "--no-tags", o.remote, o.branch]);
  if (fetched.code !== 0) {
    return { state: "unknown", expected, reason: `git fetch exited ${fetched.code}: ${fetched.err.trim()}` };
  }
  const now = previewsAt(o.repo, "FETCH_HEAD", o.prefix);
  if (!Array.isArray(now)) return { state: "unknown", expected, reason: now.reason };

  const lost = expected.filter((p) => !now.includes(p));
  if (lost.length > 0) return { state: "lost", expected, present: now, lost };
  return { state: "ok", expected, present: now };
}

/** `unknown` is 2 — could not determine — and is never a pass. A loss is 1. */
export function exitCodeFor(outcome: RestoreOutcome | VerifyOutcome): 0 | 1 | 2 {
  if (outcome.state === "unknown") return 2;
  if (outcome.state === "lost") return 1;
  return 0;
}

export function describe(outcome: RestoreOutcome | VerifyOutcome): string {
  switch (outcome.state) {
    case "restored":
      return `restored ${outcome.previews.length} preview(s) into the publish directory: ${outcome.previews.join(", ")}`;
    case "empty":
      return "the publish branch was read and carries no previews — a determined empty, nothing to restore";
    case "no-branch":
      return "the publish branch does not exist yet — nothing to restore";
    case "ok":
      return outcome.expected.length === 0
        ? "no previews were restored, so none could be lost"
        : `all ${outcome.expected.length} restored preview(s) survived the deploy: ${outcome.expected.join(", ")}`;
    case "lost":
      return (
        `${outcome.lost.length} preview(s) did NOT survive the deploy: ${outcome.lost.join(", ")}. ` +
        "The site itself deployed correctly; what was lost is a review preview that landed between this " +
        "job's restore and the publish action's own re-clone. Re-run Feature Staging on the affected PR(s)."
      );
    case "unknown":
      return `COULD NOT DETERMINE the state of the publish branch: ${outcome.reason}`;
  }
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

if (import.meta.main) {
  const opts: RestoreOptions = {
    repo: arg("repo", process.cwd()),
    remote: arg("remote", "origin"),
    branch: arg("branch", "gh-pages"),
    prefix: arg("prefix", STAGING_PREFIX),
    site: arg("site", "./_site"),
  };
  const statePath = arg("state", "");

  if (process.argv.includes("--verify")) {
    let expected: string[] = [];
    if (statePath !== "" && existsSync(statePath)) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(statePath, "utf-8"));
        if (parsed !== null && typeof parsed === "object" && Array.isArray((parsed as { previews?: unknown }).previews)) {
          expected = (parsed as { previews: string[] }).previews;
        }
      } catch {
        console.error("✗ the restore state file could not be read — COULD NOT DETERMINE what to verify");
        process.exit(2);
      }
    } else if (statePath !== "") {
      // No state file means the restore step did not run to completion. That is
      // not "nothing to check"; it is not knowing.
      console.error(`✗ no restore state at ${statePath} — COULD NOT DETERMINE what to verify`);
      process.exit(2);
    }
    const outcome = verifyStaging(opts, expected);
    const code = exitCodeFor(outcome);
    (code === 0 ? console.log : console.error)(`${code === 0 ? "✓" : "✗"} ${describe(outcome)}`);
    process.exit(code);
  }

  const outcome = restoreStaging(opts);
  const code = exitCodeFor(outcome);
  // Not written on `unknown`: an absent state file is what makes `--verify`
  // report "could not determine" rather than "nothing to check".
  if (statePath !== "" && outcome.state !== "unknown") {
    writeFileSync(statePath, `${JSON.stringify({ state: outcome.state, previews: outcome.previews }, null, 2)}\n`);
  }
  (code === 0 ? console.log : console.error)(`${code === 0 ? "✓" : "✗"} ${describe(outcome)}`);
  process.exit(code);
}
