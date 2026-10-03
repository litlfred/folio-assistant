/**
 * state-push round trips through a REAL remote: mount, edit on disk, splice.
 * The thing under test is that a push from the worktree would have LOST a
 * sibling's write and this does not, so both writers have to be real.
 *
 * @module scripts/tests/state-push
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { BranchStore } from "../branch-store.js";
import { MOUNT_DIR, mountState } from "../state-mount.js";
import { pendingChanges, pushState, report } from "../state-push.js";

const NOGPG = ["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@t"];
const BRANCH = "cat/cat-harness/state";
const MANIFEST = JSON.stringify({ $schema: "state-manifest/v1", status: "seed", authoritative: false, keyedBy: "tip" });

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", [...NOGPG, ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}\n${r.stderr}`);
  return r.stdout;
}

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

function fixture() {
  const base = mkdtempSync(join(tmpdir(), "state-push-t-"));
  made.push(base);
  const bare = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
  const url = `file://${bare}`;
  const work = join(base, "work");
  mkdirSync(work);
  git(work, "init", "-q", "-b", "main");
  writeFileSync(join(work, "README.md"), "root\n");
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "root");
  git(work, "remote", "add", "origin", url);

  const seed = join(base, "seed");
  mkdirSync(seed);
  git(seed, "init", "-q", "-b", "seed");
  for (const [p, t] of Object.entries({
    "manifest.json": MANIFEST,
    "beans/defs/a.md": "A\n",
    "beans/defs/keep.md": "keep\n",
  })) {
    mkdirSync(dirname(join(seed, p)), { recursive: true });
    writeFileSync(join(seed, p), t);
  }
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "seed");
  git(seed, "push", "-q", url, `HEAD:refs/heads/${BRANCH}`);

  const mounted = mountState({ repoRoot: work, force: true, branch: BRANCH });
  if (mounted.state !== "mounted") throw new Error(`mount failed: ${mounted.reason}`);
  return {
    base,
    bare,
    url,
    work,
    mount: join(work, MOUNT_DIR),
    push: (extra = {}) => pushState({ repoRoot: work, branch: BRANCH, ...extra }),
    sibling: (name: string) => BranchStore.open(BRANCH, { repoRoot: work, storeDir: join(base, `sib-${name}.git`), sleep: () => {}, log: () => {} }),
    show: (p: string) => git(bare, "show", `refs/heads/${BRANCH}:${p}`),
  };
}

describe("what the mount holds becomes a splice", () => {
  test("nothing to push is not an error", () => {
    const f = fixture();
    const r = f.push();
    expect(r.state).toBe("nothing");
  });

  test("an update, a create and a delete all carry the right `expect`", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/a.md"), "A edited\n");
    writeFileSync(join(f.mount, "beans/defs/new.md"), "N\n");
    unlinkSync(join(f.mount, "beans/defs/keep.md"));
    const changes = pendingChanges(f.mount);
    const byPath = Object.fromEntries(changes.map((c) => [c.path, c]));
    expect(byPath["beans/defs/a.md"]!.expect).toBeTruthy();          // read before edit
    expect(byPath["beans/defs/new.md"]!.expect).toBeNull();          // must not exist
    expect(byPath["beans/defs/keep.md"]!.content).toBeNull();        // delete
    // The manifest is the steward's, never an editor's.
    writeFileSync(join(f.mount, "manifest.json"), "{}");
    expect(pendingChanges(f.mount).some((c) => c.path === "manifest.json")).toBe(false);
  });

  test("a push lands on the remote and leaves the mount clean at the new commit", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/a.md"), "A edited\n");
    const r = f.push();
    expect(r.state).toBe("pushed");
    expect(f.show("beans/defs/a.md")).toBe("A edited\n");
    expect(git(f.mount, "status", "--porcelain").trim()).toBe("");
    if (r.state === "pushed" && r.write.commit) expect(git(f.mount, "rev-parse", "HEAD").trim()).toBe(r.write.commit);
  });

  test("--dry-run sends nothing", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/a.md"), "A edited\n");
    const before = git(f.bare, "rev-parse", `refs/heads/${BRANCH}`).trim();
    const r = f.push({ dryRun: true });
    expect(r.state).toBe("would-push");
    expect(git(f.bare, "rev-parse", `refs/heads/${BRANCH}`).trim()).toBe(before);
    expect(f.show("beans/defs/a.md")).toBe("A\n");
  });
});

describe("the lost update a `git push` from the worktree would have caused", () => {
  test("a sibling's write to ANOTHER file survives — the splice does not revert it", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/a.md"), "mine\n");
    // The sibling lands first, on a path this mount never saw.
    expect(f.sibling("s1").write([{ path: "beans/defs/sib.md", content: "sibling\n" }], "sibling").state).toBe("pushed");

    const r = f.push();
    expect(r.state).toBe("pushed");
    expect(f.show("beans/defs/a.md")).toBe("mine\n");
    expect(f.show("beans/defs/sib.md")).toBe("sibling\n"); // would be GONE after a worktree push
    expect(f.show("beans/defs/keep.md")).toBe("keep\n");
  });

  test("a sibling's write to the SAME file is a conflict, nothing is pushed, and the edit is kept", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/a.md"), "mine\n");
    f.sibling("s2").write([{ path: "beans/defs/a.md", content: "theirs\n" }], "theirs");
    const before = git(f.bare, "rev-parse", `refs/heads/${BRANCH}`).trim();

    const r = f.push();
    expect(r.state).toBe("conflict");
    expect(git(f.bare, "rev-parse", `refs/heads/${BRANCH}`).trim()).toBe(before);
    expect(f.show("beans/defs/a.md")).toBe("theirs\n");
    // The only copy of my edit is the mount, and it is still there.
    expect(readFileSync(join(f.mount, "beans/defs/a.md"), "utf-8")).toBe("mine\n");
    expect(report(r)).toContain("still in");
  });
});

describe("refusals", () => {
  test("no mount is reported, not crashed", () => {
    const f = fixture();
    rmSync(f.mount, { recursive: true, force: true });
    expect(f.push().state).toBe("no-mount");
    expect(existsSync(f.mount)).toBe(false);
  });

  test("without a declaration and without --branch the branch is unknown", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/a.md"), "x\n");
    const r = pushState({ repoRoot: f.work }); // no --branch, and nothing is declared tip-keyed
    expect(r.state).toBe("failed");
    if (r.state === "failed") expect(r.reason).toContain("pass --branch");
  });
});

describe("non-text state survives the round trip", () => {
  // A `utf-8` read corrupted all three of these until 2026-10-03. Bean `9c7h`
  // moves `fsh-guts` — archived PDFs — onto a tip branch, so this is the live case.
  test("a binary file arrives byte-identical", () => {
    const f = fixture();
    // Bytes that are not valid UTF-8: a lone 0x80 continuation, a NUL, and 0xFF.
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x80, 0xff, 0xfe, 0x0d, 0x0a, 0x1a]);
    writeFileSync(join(f.mount, "beans/defs/blob.bin"), bytes);
    const r = f.push();
    expect(r.state).toBe("pushed");
    const out = spawnSync("git", [...NOGPG, "show", `refs/heads/${BRANCH}:beans/defs/blob.bin`], { cwd: f.bare, maxBuffer: 1 << 20 });
    expect(Buffer.compare(out.stdout, bytes)).toBe(0);
  });

  test("an executable keeps its bit — mode 100755 on the branch", () => {
    const f = fixture();
    const p = join(f.mount, "beans/defs/run.sh");
    writeFileSync(p, "#!/bin/sh\necho hi\n");
    chmodSync(p, 0o755);
    expect(f.push().state).toBe("pushed");
    const entry = git(f.bare, "ls-tree", `refs/heads/${BRANCH}`, "beans/defs/run.sh");
    expect(entry.split(" ")[0]).toBe("100755");
  });

  test("a symlink stays a symlink — mode 120000, content is its target", () => {
    const f = fixture();
    symlinkSync("a.md", join(f.mount, "beans/defs/link.md"));
    expect(f.push().state).toBe("pushed");
    const entry = git(f.bare, "ls-tree", `refs/heads/${BRANCH}`, "beans/defs/link.md");
    expect(entry.split(" ")[0]).toBe("120000");
    expect(git(f.bare, "show", `refs/heads/${BRANCH}:beans/defs/link.md`)).toBe("a.md");
  });

  test("a plain file is still 100644", () => {
    const f = fixture();
    writeFileSync(join(f.mount, "beans/defs/plain.md"), "plain\n");
    expect(f.push().state).toBe("pushed");
    expect(git(f.bare, "ls-tree", `refs/heads/${BRANCH}`, "beans/defs/plain.md").split(" ")[0]).toBe("100644");
  });
});
