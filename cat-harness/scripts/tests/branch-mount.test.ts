/**
 * `mountTip` / `pushMount` on REAL git repositories: a bare remote over
 * `file://`, and one checkout per simulated container. Same practice as
 * branch-store.test.ts — a rejected push and a lost race are things a remote
 * does, so a stub would only test the stub.
 *
 * Owner ruling 2026-10-03 (bean 2h76, for 9c7h): one generic mount/push pair,
 * keyed by directory id, for beans, todos and fsh-guts. These tests pin the
 * promises the ruling makes: a miss is never an empty mount, the push carries
 * `expect`, so a sibling's edit is a conflict and never an overwrite, and
 * nothing is clobbered.
 *
 * @module scripts/tests/branch-mount
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { MANIFEST_SCHEMA, markerPath, mountTip, pushMount, readMarker, type TipLocation } from "../branch-store.js";

const NOGPG = ["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@t"];
const BRANCH = "cat/cat-harness/fsh-guts";
const LOC: TipLocation = { id: "fsh-guts", path: "fsh-guts", branch: BRANCH };
/** Not valid UTF-8: a text round-trip would change these bytes. */
const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0xff, 0xfe, 0x80, 0x0a]);

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", [...NOGPG, ...args], { cwd, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} → ${r.status}\n${r.stderr}`);
  return r.stdout;
}

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

interface Fixture {
  url: string;
  bare: string;
  /** A fresh checkout (a "container"), with its own private store. */
  checkout: (name: string) => { root: string; opts: { repoRoot: string; store: object } };
  tip: () => string;
  /** The remote's file at the tip, as bytes; undefined when absent. */
  remoteFile: (path: string) => Buffer | undefined;
}

function fixture(): Fixture {
  const base = mkdtempSync(join(tmpdir(), "branch-mount-t-"));
  made.push(base);
  const bare = join(base, "remote.git");
  git(base, "init", "-q", "--bare", "-b", "main", bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
  const url = `file://${bare}`;
  // The seeded state branch: manifest, README, and fsh-guts/** mirroring the checkout.
  const seed = join(base, "seed");
  mkdirSync(seed);
  git(seed, "init", "-q", "-b", "seed");
  const files: Record<string, string | Buffer> = {
    "manifest.json": JSON.stringify({ $schema: MANIFEST_SCHEMA, status: "seed", authoritative: false, subgraph: "fsh-guts", keyedBy: "tip" }),
    "README.md": "# fsh-guts\n",
    "fsh-guts/retired/a.md": "---\ntitle: A\n---\n",
    "fsh-guts/retired/b.md": "---\ntitle: B\n---\n",
    "fsh-guts/uploads/doc.pdf": PDF,
    "fsh-guts/scripts/run.sh": "#!/bin/sh\necho hi\n",
  };
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(dirname(join(seed, p)), { recursive: true });
    writeFileSync(join(seed, p), t);
  }
  spawnSync("chmod", ["755", join(seed, "fsh-guts/scripts/run.sh")]);
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "seed");
  git(seed, "push", "-q", url, `HEAD:refs/heads/${BRANCH}`);
  return {
    url,
    bare,
    checkout: (name) => {
      const root = join(base, `co-${name}`);
      mkdirSync(root);
      git(root, "init", "-q", "-b", "main");
      git(root, "remote", "add", "origin", url);
      // After the cutover, main ignores nothing in the mount except local scratch.
      writeFileSync(join(root, ".gitignore"), "fsh-guts/logs/\n");
      return { root, opts: { repoRoot: root, store: { storeDir: join(base, `store-${name}.git`), sleep: () => {}, log: () => {} } } };
    },
    tip: () => git(bare, "rev-parse", `refs/heads/${BRANCH}`).trim(),
    remoteFile: (path) => {
      const r = spawnSync("git", ["--git-dir", bare, "cat-file", "blob", `refs/heads/${BRANCH}:${path}`]);
      return r.status === 0 ? r.stdout : undefined;
    },
  };
}

describe("mount", () => {
  test("puts the tip's files at the declared path, bytes and modes intact, with the marker outside the mount", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    const r = mountTip(LOC, opts);
    expect(r.state).toBe("mounted");
    expect(readFileSync(join(root, "fsh-guts/retired/a.md"), "utf-8")).toBe("---\ntitle: A\n---\n");
    expect(readFileSync(join(root, "fsh-guts/uploads/doc.pdf")).equals(PDF)).toBe(true);
    expect(statSync(join(root, "fsh-guts/scripts/run.sh")).mode & 0o111).not.toBe(0);
    // Only the directory's own files: the branch root's manifest and README stay on the branch.
    expect(existsSync(join(root, "fsh-guts/manifest.json"))).toBe(false);
    expect(existsSync(markerPath(root, "fsh-guts"))).toBe(true);
    expect(markerPath(root, "fsh-guts").startsWith(join(root, "fsh-guts"))).toBe(false);
    expect(readMarker(root, "fsh-guts")!.tip).toBe(f.tip());
  });

  test("a miss is a miss, never an empty mount", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    const r = mountTip({ ...LOC, branch: "cat/cat-harness/no-such" }, opts);
    expect(r.state).toBe("miss");
    expect(existsSync(join(root, "fsh-guts"))).toBe(false);
    expect(readMarker(root, "fsh-guts")).toBeUndefined();
  });

  test("refuses a directory the checkout still tracks: the cutover has not happened", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    mkdirSync(join(root, "fsh-guts"));
    writeFileSync(join(root, "fsh-guts/kept.md"), "on main\n");
    git(root, "add", "-A");
    git(root, "commit", "-q", "-m", "main still holds it");
    const r = mountTip(LOC, opts);
    expect(r.state).toBe("refused");
    expect(readFileSync(join(root, "fsh-guts/kept.md"), "utf-8")).toBe("on main\n");
  });

  test("refuses a non-empty directory that is not a mount", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    mkdirSync(join(root, "fsh-guts"));
    writeFileSync(join(root, "fsh-guts/stray.md"), "x\n");
    expect(mountTip(LOC, opts).state).toBe("refused");
    expect(readFileSync(join(root, "fsh-guts/stray.md"), "utf-8")).toBe("x\n");
  });

  test("refuses to re-mount over unpushed edits", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    mountTip(LOC, opts);
    writeFileSync(join(root, "fsh-guts/retired/a.md"), "edited\n");
    expect(mountTip(LOC, opts).state).toBe("refused");
    expect(readFileSync(join(root, "fsh-guts/retired/a.md"), "utf-8")).toBe("edited\n");
  });
});

describe("push", () => {
  test("splices an edit, an addition and a removal onto the tip, then has nothing left to send", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    mountTip(LOC, opts);
    const before = f.tip();
    writeFileSync(join(root, "fsh-guts/retired/a.md"), "---\ntitle: A2\n---\n");
    mkdirSync(join(root, "fsh-guts/samples"), { recursive: true });
    writeFileSync(join(root, "fsh-guts/samples/new.md"), "new\n");
    unlinkSync(join(root, "fsh-guts/retired/b.md"));
    const r = pushMount("fsh-guts", "test push", opts);
    expect(r.state).toBe("pushed");
    expect(f.tip()).not.toBe(before);
    expect(f.remoteFile("fsh-guts/retired/a.md")!.toString()).toBe("---\ntitle: A2\n---\n");
    expect(f.remoteFile("fsh-guts/samples/new.md")!.toString()).toBe("new\n");
    expect(f.remoteFile("fsh-guts/retired/b.md")).toBeUndefined();
    // Untouched paths are carried across: the binary and the branch's own manifest.
    expect(f.remoteFile("fsh-guts/uploads/doc.pdf")!.equals(PDF)).toBe(true);
    expect(f.remoteFile("manifest.json")).toBeDefined();
    expect(readMarker(root, "fsh-guts")!.tip).toBe(f.tip());
    expect(pushMount("fsh-guts", "again", opts).state).toBe("unchanged");
  });

  test("a sibling's edit to the SAME file since the mount is a conflict, and nothing is pushed", () => {
    const f = fixture();
    const a = f.checkout("a");
    const b = f.checkout("b");
    mountTip(LOC, a.opts);
    mountTip(LOC, b.opts);
    writeFileSync(join(b.root, "fsh-guts/retired/a.md"), "b's edit\n");
    expect(pushMount("fsh-guts", "b", b.opts).state).toBe("pushed");
    const afterB = f.tip();
    writeFileSync(join(a.root, "fsh-guts/retired/a.md"), "a's edit\n");
    const r = pushMount("fsh-guts", "a", a.opts);
    expect(r.state).toBe("conflict");
    expect(f.tip()).toBe(afterB);
    expect(f.remoteFile("fsh-guts/retired/a.md")!.toString()).toBe("b's edit\n");
  });

  test("siblings editing DIFFERENT files both land; neither overwrites the other", () => {
    const f = fixture();
    const a = f.checkout("a");
    const b = f.checkout("b");
    mountTip(LOC, a.opts);
    mountTip(LOC, b.opts);
    writeFileSync(join(a.root, "fsh-guts/retired/a.md"), "from a\n");
    writeFileSync(join(b.root, "fsh-guts/retired/b.md"), "from b\n");
    expect(pushMount("fsh-guts", "a", a.opts).state).toBe("pushed");
    expect(pushMount("fsh-guts", "b", b.opts).state).toBe("pushed");
    expect(f.remoteFile("fsh-guts/retired/a.md")!.toString()).toBe("from a\n");
    expect(f.remoteFile("fsh-guts/retired/b.md")!.toString()).toBe("from b\n");
  });

  test("a file the checkout ignores (local scratch such as logs) is never pushed", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    mountTip(LOC, opts);
    mkdirSync(join(root, "fsh-guts/logs"), { recursive: true });
    writeFileSync(join(root, "fsh-guts/logs/session.jsonl"), "{}\n");
    expect(pushMount("fsh-guts", "logs only", opts).state).toBe("unchanged");
    expect(f.remoteFile("fsh-guts/logs/session.jsonl")).toBeUndefined();
  });

  test("ignoring the whole mount on main does not make its files unpushable", () => {
    const f = fixture();
    const { root, opts } = f.checkout("a");
    writeFileSync(join(root, ".gitignore"), "fsh-guts/\nfsh-guts/logs/\n");
    mountTip(LOC, opts);
    writeFileSync(join(root, "fsh-guts/retired/a.md"), "edited under a root-ignore\n");
    expect(pushMount("fsh-guts", "edit", opts).state).toBe("pushed");
    expect(f.remoteFile("fsh-guts/retired/a.md")!.toString()).toBe("edited under a root-ignore\n");
  });

  test("an unmounted id is refused, not treated as empty", () => {
    const f = fixture();
    const { opts } = f.checkout("a");
    expect(pushMount("fsh-guts", "x", opts).state).toBe("refused");
  });
});
