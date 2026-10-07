/**
 * mount:update (owner, 2026-10-07; PR #2468) against a fixture repository
 * whose `main` moved one commit past the pin: the submodule-style update
 * workflow, with consent in place of committing a gitlink.
 *
 *   o/upd  main: C1 (the pin) → C2 (scripts added, removed, changed)
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { MountLockSchema } from "../../schemas/remote-mount.ts";
import { AWAITING_CONSENT, applyUpdate, diffScripts, planUpdate, question } from "../mount-update.ts";
import { mountRemote } from "../remote-mount.ts";

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

function write(root: string, files: Record<string, string | object>): void {
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), typeof body === "string" ? body : JSON.stringify(body, null, 2));
  }
}

const manifest = (scripts: Record<string, string>): string => JSON.stringify({ name: "core", private: true, checkoutScripts: scripts }, null, 2) + "\n";

let base: string;
let bare: string;
let c1: string;
let c2: string;
let srv: string;
const urlFor = (r: string): string => {
  if (r !== "o/upd") throw new Error(`no fixture for ${r}`);
  return `file://${bare}`;
};

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "mount-update-test-"));
  const work = join(base, "upd-work");
  mkdirSync(work, { recursive: true });
  git(work, "init", "-q", "-b", "main");
  write(work, {
    "core/core.json": {
      name: "core",
      livesAt: { repository: "o/upd", path: "core" },
      directories: [{ id: "core-scripts", path: "scripts/", graphTypologies: ["code"] }],
      assets: [{ id: "manifest", src: "package.json" }],
    },
    "core/scripts/run.ts": "export const v = 1;\n",
    "core/package.json": manifest({ "core:run": "bun run core/scripts/run.ts", "core:old": "bun run core/scripts/old.ts" }),
  });
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "C1");
  c1 = git(work, "rev-parse", "HEAD");
  write(work, {
    "core/scripts/run.ts": "export const v = 2;\n",
    "core/package.json": manifest({ "core:run": "bun run core/scripts/run.ts --fast", "core:new": "bun run core/scripts/new.ts" }),
  });
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "C2");
  c2 = git(work, "rev-parse", "HEAD");
  bare = join(base, "upd.git");
  git(base, "clone", "-q", "--bare", work, bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
  // `o/upd` under one prefix, as github.com would serve it, for the CLI
  srv = join(base, "srv");
  mkdirSync(join(srv, "o"), { recursive: true });
  symlinkSync(bare, join(srv, "o", "upd"));
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

let n = 0;
/** A downstream pinned at `ref`, tracking `main`, consented for that pin, and mounted. */
function downstream(ref: string): string {
  const root = join(base, `down-${++n}`);
  mkdirSync(root, { recursive: true });
  git(root, "init", "-q", "-b", "main");
  write(root, {
    "down.json": {
      name: "down",
      directories: [],
      remoteMounts: [{ harness: "core", repository: "o/upd", ref, track: "main", trust: { consent: { by: "owner", on: "2026-10-07", ref, evidence: "test" } } }],
    },
  });
  mountRemote({ instanceRoot: root, urlFor });
  return root;
}

const mountOf = (root: string) => (JSON.parse(readFileSync(join(root, "down.json"), "utf-8")) as { remoteMounts: Array<{ ref: string; track?: string; trust?: { consent?: { by: string; ref: string; evidence: string } } }> }).remoteMounts[0]!;

describe("mount:update", () => {
  test("up to date: the tracked tip is the pin", () => {
    const root = downstream(c2);
    const r = planUpdate(root, "down", { harness: "core", repository: "o/upd", ref: c2, track: "main" }, urlFor);
    expect(r).toMatchObject({ state: "up-to-date", behind: 0 });
  });

  test("update available: commits behind, files changed, and the checkoutScripts diff with old and new commands", () => {
    const root = downstream(c1);
    const r = planUpdate(root, "down", { harness: "core", repository: "o/upd", ref: c1, track: "main" }, urlFor);
    expect(r).toMatchObject({ state: "update-available", tip: c2, behind: 1, diverged: false });
    expect(r.filesChanged).toEqual(["core/package.json", "core/scripts/run.ts"]);
    expect(r.scripts!["core/package.json"]).toEqual({
      added: [{ name: "core:new", command: "bun run core/scripts/new.ts" }],
      removed: [{ name: "core:old", command: "bun run core/scripts/old.ts" }],
      changed: [{ name: "core:run", from: "bun run core/scripts/run.ts", to: "bun run core/scripts/run.ts --fast" }],
    });
    expect(question(r)).toBe(`Update core ${c1.slice(0, 7)} → ${c2.slice(0, 7)}?`);
  });

  test("awaiting consent: the CLI prints the question, exits with its own code, and writes nothing", () => {
    const root = downstream(c1);
    const decl = readFileSync(join(root, "down.json"), "utf-8");
    const lock = readFileSync(join(root, "down.mount-lock.json"), "utf-8");
    const r = spawnSync(process.execPath, [resolve(import.meta.dir, "../mount-update.ts"), "--root", root], {
      encoding: "utf-8",
      env: { ...process.env, CAT_MOUNT_URL_PREFIX: `file://${srv}` },
    });
    expect(r.status).toBe(AWAITING_CONSENT);
    expect(r.stdout).toContain(`Update core ${c1.slice(0, 7)} → ${c2.slice(0, 7)}?`);
    expect(r.stdout).toContain("core:new");
    expect(readFileSync(join(root, "down.json"), "utf-8")).toBe(decl);
    expect(readFileSync(join(root, "down.mount-lock.json"), "utf-8")).toBe(lock);
  });

  test("--help says agents never pass the consent flags", () => {
    const r = spawnSync(process.execPath, [resolve(import.meta.dir, "../mount-update.ts"), "--help"], { encoding: "utf-8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("AGENTS MUST NEVER PASS THESE FLAGS ON THEIR OWN INITIATIVE");
  });

  test("consented: re-pins, records the consent, re-mounts and re-locks", () => {
    const root = downstream(c1);
    const res = applyUpdate(root, "core", c2, { by: "owner", evidence: "issue comment", on: "2026-10-08" }, { urlFor });
    expect(res.state).toBe("applied");
    expect(mountOf(root)).toMatchObject({ ref: c2, track: "main", trust: { consent: { by: "owner", ref: c2, evidence: "issue comment" } } });
    const lock = MountLockSchema.parse(JSON.parse(readFileSync(join(root, "down.mount-lock.json"), "utf-8")));
    expect(lock.mounts[0]!.ref).toBe(c2);
    expect(lock.instances[0]!.sha).toBe(c2);
    expect(readFileSync(join(root, "core/scripts/run.ts"), "utf-8")).toBe("export const v = 2;\n");
    expect(readFileSync(join(root, "core/package.json"), "utf-8")).toContain("core:new");
  });

  test("drift: a locally edited mounted file refuses the update, lists the path, and changes nothing", () => {
    const root = downstream(c1);
    writeFileSync(join(root, "core/scripts/run.ts"), "export const v = 99;\n");
    const decl = readFileSync(join(root, "down.json"), "utf-8");
    const res = applyUpdate(root, "core", c2, { by: "owner", evidence: "x" }, { urlFor });
    expect(res.state).toBe("refused");
    expect(res.edited).toEqual(["core/scripts"]);
    expect(res.detail).toContain("upstream");
    expect(readFileSync(join(root, "down.json"), "utf-8")).toBe(decl);
    expect(readFileSync(join(root, "core/scripts/run.ts"), "utf-8")).toBe("export const v = 99;\n");
  });

  test("diffScripts: added, removed, changed", () => {
    expect(diffScripts({ a: "1", b: "2" }, { b: "3", c: "4" })).toEqual({
      added: [{ name: "c", command: "4" }],
      removed: [{ name: "a", command: "1" }],
      changed: [{ name: "b", from: "2", to: "3" }],
    });
  });
});
