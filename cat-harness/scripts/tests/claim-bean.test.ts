/**
 * A claim reaches the default branch, or says why it did not.
 *
 * Bean `35nj`. Every case is built against a REAL bare remote with a real
 * default branch, because the states that matter are the refusals and none of
 * them can be faked by stubbing git: a protected branch rejects at the receive
 * stage, and a non-fast-forward is a genuine ref race.
 *
 * **The refusals are the point, not the happy path.** This environment cannot
 * find out whether the default branch is protected — `GET /branches/main/
 * protection` answers 403 "Resource not accessible by integration", and
 * `git push --dry-run` does not run receive hooks — so the mechanism is built to
 * attempt and handle rejection rather than to assume. If `fell-back` regressed
 * into a silent no-op, a session would believe it had claimed something it had
 * not, which is worse than the duplicate `35nj` exists to prevent.
 *
 * @module scripts/tests/claim-bean
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { absoluteRemote, claimOnDefaultBranch, exitCodeFor } from "../claim-bean.js";

const ID = ["-c", "user.name=t", "-c", "user.email=t@t"];

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", [...ID, ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}\n${r.stderr}`);
  return r.stdout;
}

function bean(id: string, status = "todo"): string {
  return `---\n# folio-assistant-${id}\ntitle: Bean ${id}\nstatus: ${status}\ntype: task\ncreated_at: 2026-09-19T00:00:00Z\nupdated_at: 2026-09-19T00:00:00Z\n---\n\nBody.\n`;
}

/** A work checkout on `claude/feature`, whose `origin` is a bare repo with `main`. */
function repoWith(beans: Record<string, string>): { work: string; bare: string } {
  const base = mkdtempSync(join(tmpdir(), "claim-bean-t-"));
  const bare = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", bare);
  const work = join(base, "work");
  mkdirSync(work);
  git(work, "init", "-q", "-b", "main");
  writeFileSync(
    join(work, ".beans.yml"),
    "beans:\n    path: beans/defs\n    prefix: folio-assistant-\n    id_length: 4\n    default_status: todo\n    default_type: task\n",
  );
  mkdirSync(join(work, "beans", "defs"), { recursive: true });
  for (const [id, body] of Object.entries(beans)) {
    writeFileSync(join(work, "beans", "defs", `folio-assistant-${id}--b.md`), body);
  }
  git(work, "add", "-A");
  git(work, "commit", "-qm", "seed");
  git(work, "remote", "add", "origin", bare);
  git(work, "push", "-q", bare, "HEAD:refs/heads/main");
  git(work, "fetch", "-q", "origin", "main");
  git(work, "switch", "-qc", "claude/feature");
  return { work, bare };
}

/** Make the remote reject every push, the way a protected branch does. */
function protect(bare: string): void {
  const h = join(bare, "hooks", "pre-receive");
  writeFileSync(h, '#!/bin/sh\necho "remote: error: GH006: Protected branch update failed." >&2\nexit 1\n');
  chmodSync(h, 0o755);
}

const statusOnMain = (work: string, id: string): string =>
  /^status:\s*(\S+)/m.exec(git(work, "show", `origin/main:beans/defs/folio-assistant-${id}--b.md`))?.[1] ?? "";

describe("claiming on the default branch", () => {
  test("a free bean is claimed there, in a commit of its own, without touching the working tree", () => {
    const { work } = repoWith({ aaaa: bean("aaaa") });

    const o = claimOnDefaultBranch("aaaa", "claude/feature", { repo: work });
    expect(o.state).toBe("pushed");
    expect(exitCodeFor(o)).toBe(0);

    git(work, "fetch", "-q", "origin", "main");
    expect(statusOnMain(work, "aaaa")).toBe("in-progress");
    // The claim names its branch — a claim that does not say who made it cannot
    // be told from an abandoned one.
    expect(git(work, "show", "origin/main:beans/defs/folio-assistant-aaaa--b.md")).toContain(
      "Claimed by claude/feature",
    );
    // CLAIM ONLY. Bundled with work it could not be pushed until the work was
    // ready, which is the whole defect.
    const changed = git(work, "show", "--stat", "--format=", "origin/main").split("\n").filter((l) => l.includes("|"));
    expect(changed).toHaveLength(1);
    // A session mid-edit cannot afford a CHECKOUT, and none happens — the commit
    // is built in a temp worktree that is then removed.
    //
    // It does modify exactly ONE file in the caller's tree: the bean, mirroring
    // the claim. That is a later correctness fix, not a relaxation of this
    // assertion — without it the branch's stale `todo` reverts the claim at merge
    // time. Asserting the exact file rather than a clean tree keeps the original
    // guarantee: nothing ELSE is touched.
    expect(git(work, "status", "--porcelain").trim().split("\n")).toEqual([
      // `.trim()` above eats git's leading space in " M ".
      "M beans/defs/folio-assistant-aaaa--b.md",
    ]);
    expect(git(work, "worktree", "list").trim().split("\n")).toHaveLength(1);
  });

  test("the claim is mirrored into the caller's own tree, or the merge reverts it", () => {
    // Found by USING the tool: after a successful claim, `origin/main` said
    // `in-progress` and the working tree still said `todo`. Committing that
    // stale copy on the feature branch and merging would have reverted the
    // claim — the branch's older value wins as an ordinary content change, so
    // the tool would quietly undo its own work at merge time.
    const { work } = repoWith({ mmmm: bean("mmmm") });

    const o = claimOnDefaultBranch("mmmm", "claude/feature", { repo: work });
    expect(o.state).toBe("pushed");

    const local = readFileSync(join(work, "beans", "defs", "folio-assistant-mmmm--b.md"), "utf-8");
    expect(/^status:\s*in-progress\s*$/m.test(local)).toBe(true);
    // Deliberately NOT committed: what to commit and when is the session's
    // business, and a tool that commits to your branch behind your back is
    // worse than the problem it solves.
    expect(git(work, "status", "--porcelain").trim()).toBe(
      "M beans/defs/folio-assistant-mmmm--b.md",
    );
  });

  test("a bean another branch holds is REFUSED, by name, and nothing is written", () => {
    const { work } = repoWith({ bbbb: bean("bbbb") });
    claimOnDefaultBranch("bbbb", "claude/first", { repo: work });
    git(work, "fetch", "-q", "origin", "main");
    const before = git(work, "rev-list", "--count", "origin/main").trim();

    const o = claimOnDefaultBranch("bbbb", "claude/second", { repo: work });
    expect(o.state).toBe("already-claimed");
    expect(o.heldBy).toBe("claude/first");
    // Answered, not failed: "may I take this" got an answer.
    expect(exitCodeFor(o)).toBe(0);

    git(work, "fetch", "-q", "origin", "main");
    expect(git(work, "rev-list", "--count", "origin/main").trim()).toBe(before);
  });

  test("re-claiming from the same branch is idempotent — no second commit", () => {
    const { work } = repoWith({ cccc: bean("cccc") });
    claimOnDefaultBranch("cccc", "claude/feature", { repo: work });
    git(work, "fetch", "-q", "origin", "main");
    const after1 = git(work, "rev-list", "--count", "origin/main").trim();

    const o = claimOnDefaultBranch("cccc", "claude/feature", { repo: work });
    expect(o.state).toBe("pushed");
    git(work, "fetch", "-q", "origin", "main");
    expect(git(work, "rev-list", "--count", "origin/main").trim()).toBe(after1);
  });

  test("a REJECTED push falls back loudly — exit 3, branch untouched, worktree cleaned", () => {
    const { work, bare } = repoWith({ dddd: bean("dddd") });
    protect(bare);

    const o = claimOnDefaultBranch("dddd", "claude/feature", { repo: work });
    expect(o.state).toBe("fell-back");
    expect(exitCodeFor(o)).toBe(3);
    expect(o.reason ?? "").toContain("Protected branch");

    git(work, "fetch", "-q", "origin", "main");
    expect(statusOnMain(work, "dddd")).toBe("todo");
    // Cleaned up on the failure path too, or the next run cannot add a worktree.
    expect(git(work, "worktree", "list").trim().split("\n")).toHaveLength(1);
  });

  test("a COMPLETED or SCRAPPED bean is refused — finished work is not re-opened by accident", () => {
    // Found by running `--dry-run` against the real store: the tool offered to
    // claim a `completed` bean without comment. Reviving a scrapped one is worse
    // than reviving a finished one, because `scrapped` exists to record that
    // something was considered and REJECTED.
    const { work } = repoWith({ iiii: bean("iiii", "completed"), jjjj: bean("jjjj", "scrapped") });

    for (const [id, status] of [["iiii", "completed"], ["jjjj", "scrapped"]] as const) {
      const o = claimOnDefaultBranch(id, "claude/feature", { repo: work });
      expect(o.state).toBe("already-closed");
      expect(o.closedAs).toBe(status);
      // Answered, not broken — so exit 0, like `already-claimed`.
      expect(exitCodeFor(o)).toBe(0);
      git(work, "fetch", "-q", "origin", "main");
      expect(statusOnMain(work, id)).toBe(status);
    }
  });

  test("a bean that is NEW on this branch is a determined state, not 'could not tell'", () => {
    const { work } = repoWith({ eeee: bean("eeee") });
    // Created after the branch diverged, so `origin/main` has never seen it.
    writeFileSync(join(work, "beans", "defs", "folio-assistant-ffff--b.md"), bean("ffff"));
    git(work, "add", "-A");
    git(work, "commit", "-qm", "new bean");

    const o = claimOnDefaultBranch("ffff", "claude/feature", { repo: work });
    // Nobody else can see it, so there is nothing to race over — and reporting
    // `unknown` here was the measured wrong answer for `beans create` followed
    // immediately by a claim.
    expect(o.state).toBe("new-on-branch");
    expect(exitCodeFor(o)).toBe(0);
  });

  test("an unreadable remote is exit 2, and never reads as 'the bean is free'", () => {
    const { work } = repoWith({ gggg: bean("gggg") });
    git(work, "remote", "set-url", "origin", join(tmpdir(), "no-such-remote-at-all.git"));

    const o = claimOnDefaultBranch("gggg", "claude/feature", { repo: work });
    expect(o.state).toBe("unknown");
    expect(exitCodeFor(o)).toBe(2);
  });

  test("a bean absent from the store is unknown, not a silent success", () => {
    const { work } = repoWith({ hhhh: bean("hhhh") });
    const o = claimOnDefaultBranch("nope", "claude/feature", { repo: work });
    expect(o.state).toBe("unknown");
    expect(exitCodeFor(o)).toBe(2);
  });
});

describe("absoluteRemote", () => {
  // Measured twice: pushing by remote NAME and by the raw `get-url` value both
  // failed from the temp worktree with "'../remote.git' does not appear to be a
  // git repository", because a relative path resolves against the WORKTREE.
  test("a relative local path is resolved against the repo, not the worktree", () => {
    expect(absoluteRemote("/srv/folio", "../mirror.git")).toBe("/srv/mirror.git");
  });

  test("a URL with a scheme and an scp-form address are left alone", () => {
    for (const u of [
      "https://github.com/litlfred/folio-assistant.git",
      "ssh://git@github.com/litlfred/folio-assistant.git",
      "file:///srv/mirror.git",
      "git@github.com:litlfred/folio-assistant.git",
    ]) {
      expect(absoluteRemote("/srv/folio", u)).toBe(u);
    }
  });
});
