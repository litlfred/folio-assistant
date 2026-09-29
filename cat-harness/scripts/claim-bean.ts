#!/usr/bin/env bun
/**
 * Claim a bean by pushing its `in-progress` status to the DEFAULT BRANCH.
 *
 * ## The defect this exists for — bean `35nj`
 *
 * A claim is a commit to `beans/defs/<id>.md` on your **feature branch**. A
 * sibling session reads `origin/main`, where the bean still says `todo`. So a
 * claim becomes visible to anybody else only once your PR exists — and
 * `AGENTS.md`'s "open the PR at the first commit" rule is the only reason it is
 * visible then rather than at the end.
 *
 * Measured 2026-09-19: two sessions set `plj1` `in-progress` **61 seconds
 * apart** — 09:28:18Z and 09:29:19Z — and opened two PRs for it at ~09:36 and
 * 09:37. Same diagnosis, same design choice, two implementations; one was
 * withdrawn. Both sessions followed "claim before you work" exactly as written
 * and it prevented nothing, because neither claim existed anywhere either
 * session could read.
 *
 * The owner chose this mechanism over a PR-list check, from options carrying
 * their costs: it is the only one that actually closes the window, and the cost
 * is that a session writes to the default branch for claims, which this
 * repository otherwise routes through pull requests.
 *
 * ## Why a separate commit, and why a temp worktree
 *
 * The claim must land ALONE. A claim bundled with work cannot be pushed until
 * the work is ready, which is the whole defect. And it must not disturb the
 * caller's working tree: a session mid-edit cannot afford a checkout, so this
 * builds the commit in a detached `git worktree` on `origin/<default>` and
 * removes it afterwards, whatever happens.
 *
 * ## "Could not push" is a THIRD STATE and is never silent
 *
 * The default branch may be protected — and this environment cannot find out:
 * `GET /branches/main/protection` answers **403 "Resource not accessible by
 * integration"**, and `git push --dry-run` does not run the receive hooks that
 * enforce protection, so neither tells you in advance. So the push is ATTEMPTED
 * and its rejection is handled:
 *
 * - **`pushed`** — the claim is on the default branch and every session sees it.
 * - **`already-claimed`** — somebody else holds it. Nothing is written; the
 *   holder is named. This is a success for the caller's purposes: the question
 *   "may I take this" was answered.
 * - **`fell-back`** — the push was rejected (protection, permissions). The claim
 *   is NOT on the default branch; the caller is told to claim on its branch and
 *   open a PR early, and told exactly why. Exit 3, so a script can branch on it.
 * - **`unknown`** — the default branch could not even be read. Exit 2. Never
 *   rendered as "the bean is free", because that reading is what produces the
 *   duplicate this module exists to prevent.
 *
 * A non-fast-forward is NOT a failure: another claim landed while this one was
 * being built, which is the expected race. It re-reads the branch and retries,
 * because the second attempt may discover the bean is now claimed by that other
 * session — which is the correct answer, not a conflict to force past.
 *
 * Usage:
 * ```sh
 * bun run cat-harness/scripts/claim-bean.ts <bean-id>            # claim on the default branch
 * bun run cat-harness/scripts/claim-bean.ts <bean-id> --dry-run  # say what would happen
 * ```
 *
 * @module scripts/claim-bean
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findBean, noteBean, updateBean } from "./beans-fallback.js";

/**
 * Where the platform's own code lives — NOT where the beans are.
 *
 * Kept only so the module can name itself in errors. The bean store defaults to
 * `process.cwd()`, because `AGENTS.md` is explicit that "folio-assistant is the
 * platform, not the content": this script ships in the platform and is run
 * inside a FOLIO, whose `beans/` is the store being claimed against. Defaulting
 * to the platform root looked right and was measured wrong immediately — run
 * from a folio it reported `no bean matching "<id>" in this store` for a bean
 * sitting in front of it.
 */
const PLATFORM_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** How many times a non-fast-forward is re-tried before giving up. */
export const MAX_ATTEMPTS = 3;

export type ClaimState = "pushed" | "already-claimed" | "held-unknown" | "already-closed" | "new-on-branch" | "fell-back" | "unknown";

export interface ClaimOutcome {
  state: ClaimState;
  /** Branch recorded in the existing claim, when `already-claimed`. */
  heldBy?: string;
  /** The status found on the default branch, when `already-closed`. */
  closedAs?: string;
  /** Why, for `fell-back` and `unknown`. Always present for those. */
  reason?: string;
  /** Attempts spent. 2+ means a real race happened. */
  attempts: number;
}

interface Ran {
  code: number;
  out: string;
  err: string;
}

function git(cwd: string, args: string[]): Ran {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 });
  if (r.error !== undefined || r.status === null) {
    return { code: -1, out: "", err: String(r.error ?? "git did not run") };
  }
  return { code: r.status, out: r.stdout ?? "", err: r.stderr ?? "" };
}

/**
 * The default branch's name, asked rather than assumed.
 *
 * `origin/HEAD` is the authoritative answer; `main` and `master` are fallbacks
 * for a clone whose remote HEAD was never fetched. Hardcoding `main` is how a
 * tool breaks silently in a repository that never adopted it.
 */
export function defaultBranch(repo: string): string | undefined {
  const sym = git(repo, ["symbolic-ref", "-q", "--short", "refs/remotes/origin/HEAD"]);
  if (sym.code === 0 && sym.out.trim() !== "") return sym.out.trim().replace(/^origin\//, "");
  for (const cand of ["main", "master"]) {
    if (git(repo, ["rev-parse", "-q", "--verify", `refs/remotes/origin/${cand}`]).code === 0) return cand;
  }
  return undefined;
}

/**
 * A remote URL a push from a TEMP WORKTREE can actually reach.
 *
 * `git remote get-url` returns the configured value verbatim, so a relative
 * local path comes back relative — and it resolves against the *worktree's*
 * directory, which is a temp dir. Measured twice: pushing by the remote NAME
 * failed, and pushing by the raw `get-url` value failed identically with
 * "'../remote.git' does not appear to be a git repository".
 *
 * A URL with a scheme (`https://`, `ssh://`, `file://`) or in scp form
 * (`git@host:owner/repo`) is already absolute and is returned untouched — which
 * is every real remote, so this only ever matters for a local mirror. It is
 * worth the six lines anyway: the failure it prevents looks like a permissions
 * problem and would be diagnosed as one.
 */
export function absoluteRemote(repo: string, configured: string): string {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(configured)) return configured;
  if (/^[^/]+@[^/]+:/.test(configured)) return configured;
  return resolve(repo, configured);
}

/** `status:` and any `Claimed by <branch>` note, as the DEFAULT BRANCH has them. */
function statusOnBranch(
  repo: string,
  branch: string,
  beanPath: string,
): { status?: string; heldBy?: string } | { absent: true } | { reason: string } {
  const show = git(repo, ["show", `origin/${branch}:${beanPath}`]);
  if (show.code !== 0) {
    // A bean that exists here and NOT on the default branch is a determined
    // state, not a failure to read one: it is new on this branch. Git says so
    // explicitly, and conflating it with "could not read" was measured — the
    // common case of `beans create` followed immediately by a claim reported
    // COULD NOT DETERMINE, which is the one reading this tool must never give
    // when it actually knows the answer.
    if (/exists on disk, but not in|does not exist in|path .* does not exist/i.test(`${show.err}${show.out}`)) {
      return { absent: true };
    }
    return { reason: `git show origin/${branch}:${beanPath} exited ${show.code}: ${show.err.trim()}` };
  }
  const status = /^status:\s*(\S+)\s*$/m.exec(show.out)?.[1];
  const heldBy = /Claimed by (\S+)/.exec(show.out)?.[1];
  return { status, heldBy };
}

/**
 * Claim `id` on the default branch, or report why not.
 *
 * `branch` is recorded in the claim note so a sibling can see WHO holds it —
 * a claim that does not say who made it cannot be told from an abandoned one.
 */
export function claimOnDefaultBranch(id: string, branch: string, opts: { repo?: string; dryRun?: boolean } = {}): ClaimOutcome {
  const repo = opts.repo ?? process.cwd();

  const local = findBean(repo, id);
  if (local === undefined) {
    return { state: "unknown", reason: `no bean matching "${id}" in this store`, attempts: 0 };
  }
  const beanPath = local.path.startsWith(repo) ? local.path.slice(repo.length + 1) : local.path;

  const def = defaultBranch(repo);
  if (def === undefined) {
    return { state: "unknown", reason: "could not determine the default branch (no origin/HEAD, no origin/main or origin/master)", attempts: 0 };
  }

  let attempts = 0;
  let lastReason = "";
  while (attempts < MAX_ATTEMPTS) {
    attempts += 1;

    const fetched = git(repo, ["fetch", "--quiet", "origin", def]);
    if (fetched.code !== 0) {
      return { state: "unknown", reason: `git fetch origin ${def} exited ${fetched.code}: ${fetched.err.trim()}`, attempts };
    }

    const onBranch = statusOnBranch(repo, def, beanPath);
    if ("reason" in onBranch) return { state: "unknown", reason: onBranch.reason, attempts };
    // Nobody else can see this bean yet, so there is nothing to race over and
    // nothing a pushed claim would tell them. Pushing the bean itself would be
    // pushing WORK to the default branch, which is not what a claim is.
    if ("absent" in onBranch) return { state: "new-on-branch", attempts };

    // Finished or deliberately rejected work is not claimable by accident.
    //
    // Found by running `--dry-run` against the real store: the tool offered to
    // claim a `completed` bean without comment. Re-opening finished work is bad;
    // re-entering a `scrapped` one is worse, because a scrapped bean exists
    // precisely to record that something was considered and rejected so the next
    // agent does not walk back into it (`AGENTS.md`, and never deleting a bean
    // is the same reasoning). Re-opening either is a real decision, so it must
    // be deliberate rather than a side effect of asking to claim.
    if (onBranch.status === "completed" || onBranch.status === "scrapped") {
      return { state: "already-closed", closedAs: onBranch.status, attempts };
    }

    // Somebody else holds it. Not an error — the question was answered.
    if (onBranch.status === "in-progress" && onBranch.heldBy !== undefined && onBranch.heldBy !== branch) {
      return { state: "already-claimed", heldBy: onBranch.heldBy, attempts };
    }
    // Ours already: idempotent, nothing to push.
    if (onBranch.status === "in-progress" && onBranch.heldBy === branch) {
      return { state: "pushed", attempts };
    }
    // In progress, and NOBODY RECORDED A HOLDER. This arm used to fall in with
    // the one above — `heldBy === branch || heldBy === undefined` — on the
    // reading that both are "ours, idempotent". They are not the same thing.
    //
    // `heldBy === branch` is a determined answer: we hold it. `heldBy ===
    // undefined` is *could not determine who holds it*, and the merged version
    // rendered it as `✓ claimed … every session can see it now` while pushing
    // nothing and warning nobody — could-not-determine wearing the costume of a
    // determined answer, which is the failure this file already refuses twelve
    // lines above for `absent`.
    //
    // It is not a rare arm. Measured on `origin/main` 2026-09-25: of the 100
    // non-epic beans marked `in-progress`, **97 record no holder**, because
    // `todo-manager.md` and `session-intent.md` still tell an agent to claim
    // with `beans update <id> --status in-progress`, which writes no note. So
    // the check that exists to stop claim-stomping answered "go ahead" for 97 %
    // of the store it was guarding.
    //
    // Reported rather than guessed either way: this cannot tell a live sibling
    // from a claim abandoned five days ago, and inventing a staleness threshold
    // would need a basis nothing here has.
    if (onBranch.status === "in-progress") {
      return { state: "held-unknown", attempts };
    }

    if (opts.dryRun === true) {
      return { state: "pushed", reason: `would claim ${id} on ${def} (currently ${onBranch.status ?? "unknown"})`, attempts };
    }

    const work = mkdtempSync(join(tmpdir(), "claim-bean-"));
    try {
      const added = git(repo, ["worktree", "add", "--quiet", "--detach", work, `origin/${def}`]);
      if (added.code !== 0) {
        return { state: "unknown", reason: `git worktree add exited ${added.code}: ${added.err.trim()}`, attempts };
      }
      // The store's own writers, so what lands is byte-identical to what the
      // CLI would write and reads back cleanly.
      updateBean(work, id, { status: "in-progress" });
      noteBean(work, id, `Claimed by ${branch} — pushed to ${def} so sibling sessions see it before this branch has a PR (bean 35nj).`);

      const staged = git(work, ["add", "--", beanPath]);
      if (staged.code !== 0) {
        return { state: "unknown", reason: `git add exited ${staged.code}: ${staged.err.trim()}`, attempts };
      }
      const committed = git(work, [
        "-c", "user.name=claim-bean",
        "-c", "user.email=noreply@anthropic.com",
        "commit", "--quiet", "-m",
        `beans(${id}): claim in-progress from ${branch}\n\nClaim only, no work. Pushed to ${def} so a sibling session sees it\nimmediately rather than when this branch opens a PR. Bean 35nj.`,
      ]);
      if (committed.code !== 0) {
        return { state: "unknown", reason: `git commit exited ${committed.code}: ${committed.err.trim()}`, attempts };
      }

      // Push to the RESOLVED URL, not to the remote NAME.
      //
      // A worktree inherits the repository's config, so `origin` is in scope —
      // but a remote configured with a RELATIVE path (`../remote.git`, common
      // for a local mirror or a submodule-style checkout) resolves against the
      // worktree's own directory, which is a temp dir somewhere else entirely.
      // Measured: the push died with "'../remote.git' does not appear to be a
      // git repository" while the same remote worked from the main checkout.
      // For an absolute URL this is identical; for a relative one it is the
      // difference between working and not.
      const configured = git(repo, ["remote", "get-url", "origin"]).out.trim();
      if (configured === "") {
        return { state: "unknown", reason: "no `origin` remote to push the claim to", attempts };
      }
      const target = absoluteRemote(repo, configured);
      const pushed = git(work, ["push", target, `HEAD:refs/heads/${def}`]);
      if (pushed.code === 0) {
        // MIRROR IT LOCALLY, and this is a correctness fix rather than a
        // convenience.
        //
        // The claim lands on the default branch; the caller's own checkout is
        // untouched and still says `todo`. Measured by using the tool: after a
        // successful claim of `t373`, `origin/main` said `in-progress` and the
        // working tree said `todo`. Committing that stale copy on the feature
        // branch and merging it would have **reverted the claim** — the branch's
        // older value wins as an ordinary content change, so the tool would have
        // quietly undone its own work at merge time.
        //
        // Writing the same status locally makes the two agree, so the merge is a
        // no-op for this field instead of a regression. It is deliberately NOT
        // committed here: what to commit and when is the session's business, and
        // a tool that commits to your branch behind your back is worse than the
        // problem.
        try {
          updateBean(repo, id, { status: "in-progress" });
        } catch {
          // The push already succeeded, which is the durable half. A local
          // write failing is worth reporting, not worth undoing a landed claim.
          return { state: "pushed", attempts, reason: "claimed on the default branch, but the local copy could not be updated — `git fetch` and check before committing this bean" };
        }
        return { state: "pushed", attempts };
      }

      const why = `${pushed.err.trim()}\n${pushed.out.trim()}`.trim();
      lastReason = `git push ${target} HEAD:${def} exited ${pushed.code}: ${why}`;
      // A non-fast-forward means somebody else's commit landed first. Retry —
      // the next read may find the bean claimed by them, which is the answer.
      if (/non-fast-forward|fetch first|rejected.*\(fetch first\)|stale info/i.test(why)) continue;
      // Anything else (protection, 403, no write access) will not improve.
      return { state: "fell-back", reason: lastReason, attempts };
    } finally {
      git(repo, ["worktree", "remove", "--force", work]);
      rmSync(work, { recursive: true, force: true });
    }
  }
  return { state: "fell-back", reason: `${MAX_ATTEMPTS} attempts all lost the race. Last: ${lastReason}`, attempts };
}

export function describe(o: ClaimOutcome, id: string): string {
  switch (o.state) {
    case "pushed":
      return o.reason ?? `claimed ${id} on the default branch — every session can see it now${o.attempts > 1 ? ` (after ${o.attempts} attempts; a sibling claim landed mid-flight)` : ""}`;
    case "held-unknown":
      return (
        `${id} is already in-progress on the default branch, and NOBODY RECORDED A HOLDER — so this cannot tell
` +
        `  a sibling working it right now from a claim somebody abandoned. NOT claimed, and nothing was written.
` +
        `  Read the bean and the open PR list before you take it. If it is genuinely free, claim it on your branch
` +
        `  (\`beans update ${id} --status in-progress\`) and open the PR at your FIRST commit.`
      );
    case "already-closed":
      return (
        `${id} is ${o.closedAs} on the default branch — NOT claimed, deliberately.\n` +
        `  ${o.closedAs === "scrapped"
          ? "A scrapped bean records that something was considered and REJECTED, which is what stops the next session re-entering the same dead end. Read its reasons before reviving it."
          : "It is finished work. Re-opening it is a decision, not a claim."}\n` +
        `  If you do mean to revive it, set the status yourself and say why in the bean.`
      );
    case "new-on-branch":
      return (
        `${id} is not on the default branch yet — it is new on this branch, so no sibling session can see it ` +
        `and there is nothing to race over. Claim it locally (\`beans update ${id} --status in-progress\`); ` +
        `it becomes visible when this branch's PR opens, which is why AGENTS.md says open the PR at the FIRST commit.`
      );
    case "already-claimed":
      return `${id} is ALREADY CLAIMED by ${o.heldBy}. Nothing written. Pick another item, or talk to that session before touching this one.`;
    case "fell-back":
      return (
        `could NOT push the claim to the default branch, so ${id} is NOT claimed anywhere a sibling can see.\n` +
        `  reason: ${o.reason}\n` +
        `  do this instead: claim it on your branch (\`beans update ${id} --status in-progress\`) and open the PR at your FIRST commit,\n` +
        `  which is what makes a branch-local claim visible at all. See skills/folio-core/bean-coordination.md.`
      );
    case "unknown":
      return `COULD NOT DETERMINE whether ${id} is claimable: ${o.reason}. This is not "the bean is free" — do not start work on that reading.`;
  }
}

/** `unknown` is 2, a failed push is 3, a live claim by somebody else is 0. */
export function exitCodeFor(o: ClaimOutcome): 0 | 2 | 3 | 4 {
  if (o.state === "unknown") return 2;
  if (o.state === "fell-back") return 3;
  // Its own code, and neither of its neighbours.
  //
  // Not 0, which `already-claimed` uses: that one is a DETERMINED refusal and
  // tells the caller to go pick another item. This one cannot tell them even
  // that, so a script treating 0 as "carry on" must not get it.
  //
  // Not 2 either: the default branch was read perfectly well. What could not be
  // determined is who holds the bean, not whether the remote could be reached,
  // and collapsing the two would make a readable remote look unreadable.
  if (o.state === "held-unknown") return 4;
  return 0;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const repoAt = argv.indexOf("--repo");
  const repo = repoAt >= 0 ? argv[repoAt + 1] : undefined;
  if (repoAt >= 0 && (repo === undefined || repo.startsWith("-"))) {
    console.error("--repo needs a path");
    process.exit(64);
  }
  // `repoAt + 1` is only the value slot when `--repo` is actually present;
  // guarding on `repoAt >= 0` matters because -1 + 1 is 0, which silently ate
  // the id itself — measured, the CLI printed its own usage on a valid call.
  const id = argv.filter((a, i) => !a.startsWith("-") && !(repoAt >= 0 && i === repoAt + 1))[0];
  if (id === undefined) {
    console.error(
      `usage: bun run ${PLATFORM_ROOT}/scripts/claim-bean.ts <bean-id> [--repo <folio>] [--dry-run]\n` +
        "       the store defaults to the CURRENT DIRECTORY, because beans live in the folio, not the platform",
    );
    process.exit(64);
  }
  const root = repo ?? process.cwd();
  const branch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]).out.trim() || "(detached)";
  const outcome = claimOnDefaultBranch(id, branch, { repo: root, dryRun: argv.includes("--dry-run") });
  const code = exitCodeFor(outcome);
  (code === 0 ? console.log : console.error)(`${code === 0 ? "✓" : "✗"} ${describe(outcome, id)}`);
  process.exit(code);
}
