/**
 * The upload URL is composed from the declaration, and every failure is named.
 *
 * The regression under test is a real 404: the owner was sent to
 * `/upload/main/uploads` on 2026-09-20 and that path does not exist — the queue
 * is at `cat-harness/uploads`. Verified against GitHub the same day:
 * `/tree/main/uploads` returns 404, `/tree/main/cat-harness/uploads` returns
 * 200.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { queueRepoRelative, uploadUrl } from "../upload-url.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");

describe("the queue path is REPOSITORY-relative, not instance-relative", () => {
  test("it carries the instance segment", () => {
    // The whole bug. `harness.json` declares `path: "uploads/"` with no scope,
    // and absent scope means instance — so the declared path is missing the
    // `cat-harness/` a forge URL needs.
    const rel = queueRepoRelative(ROOT);
    expect(rel).toBeDefined();
    expect(rel).toContain("/");
    expect(rel!.endsWith("uploads")).toBe(true);
  });

  test("it is NOT the bare declared path", () => {
    // The assertion that would have caught the 404. If this ever equals
    // `uploads`, the instance segment has been dropped again.
    expect(queueRepoRelative(ROOT)).not.toBe("uploads");
  });

  test("it resolves to a directory that exists", () => {
    expect(existsSync(resolve(repoRootFor(ROOT), queueRepoRelative(ROOT)!))).toBe(true);
  });

  test("it uses POSIX separators, because it becomes a URL", () => {
    expect(queueRepoRelative(ROOT)).not.toContain("\\");
  });
});

describe("the URL", () => {
  test("resolves for this instance", () => {
    const t = uploadUrl(ROOT);
    expect(t.ok).toBe(true);
  });

  test("is the /upload/<branch>/<repo-relative path> form", () => {
    const t = uploadUrl(ROOT, "main");
    if (!t.ok) throw new Error(t.reason);
    expect(t.url).toContain("/upload/main/");
    expect(t.url.endsWith(t.repoRelative)).toBe(true);
  });

  test("honours a branch other than main", () => {
    const t = uploadUrl(ROOT, "some-branch");
    if (!t.ok) throw new Error(t.reason);
    expect(t.url).toContain("/upload/some-branch/");
  });

  test("carries no `.git` suffix from the remote", () => {
    const t = uploadUrl(ROOT, "main");
    if (!t.ok) throw new Error(t.reason);
    expect(t.url).not.toContain(".git/upload/");
  });
});

describe("a failure is NAMED, never a guessed URL", () => {
  test("no declaration reports the reason and a remedy", () => {
    // An agent that guesses a URL sends somebody somewhere that does not exist,
    // and they cannot tell a wrong link from an empty directory.
    const t = uploadUrl("/tmp");
    expect(t.ok).toBe(false);
    if (t.ok) return;
    expect(t.reason.length).toBeGreaterThan(0);
    expect(t.remedy.length).toBeGreaterThan(0);
  });

  test("the failure path returns no url field at all", () => {
    // Structurally impossible to read a url off a failure, rather than a
    // convention that it will be empty.
    const t = uploadUrl("/tmp");
    expect("url" in t).toBe(false);
  });
});
