/**
 * Mount-path collisions and `mount:relocate` (bean `t4xb`, owner 2026-10-07;
 * PR #2468), and the `check:mount-tracked` gate, over a fixture repository
 * served from a local bare clone.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { readDeclaredMounts, writeDeclaredMounts } from "../../schemas/index-config.ts";
import { MountLockSchema, type RemoteMount } from "../../schemas/remote-mount.ts";
import { checkMountTracked } from "../check-mount-tracked.ts";
import { relocate } from "../mount-relocate.ts";
import { mountHealth } from "../mount-update.ts";
import { checkRemote, mountRemote, pathCollisions, reservedRootNames } from "../remote-mount.ts";

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

let base: string;
let bare: string;
let sha: string;
const urlFor = (r: string): string => {
  if (r !== "o/rel") throw new Error(`no fixture for ${r}`);
  return `file://${bare}`;
};

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "mount-relocate-test-"));
  const work = join(base, "rel-work");
  mkdirSync(work, { recursive: true });
  git(work, "init", "-q", "-b", "main");
  write(work, {
    "core/core.json": { name: "core", livesAt: { repository: "o/rel", path: "core" }, directories: [{ id: "core-scripts", path: "scripts/", graphTypologies: ["code"] }] },
    "core/scripts/run.ts": "export const v = 1;\n",
  });
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "C1");
  sha = git(work, "rev-parse", "HEAD");
  bare = join(base, "rel.git");
  git(base, "clone", "-q", "--bare", work, bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

let n = 0;
const mountOf = (extra: Partial<RemoteMount> = {}): RemoteMount => ({ harness: "core", repository: "o/rel", ref: sha, trust: { consent: { by: "owner", on: "2026-10-07", ref: sha, evidence: "test" } }, ...extra });
/** A downstream with `core` declared in index.config.json; `directories` are the downstream's own. */
function downstream(o: { directories?: object[]; mount?: Partial<RemoteMount> } = {}): string {
  const root = join(base, `down-${++n}`);
  mkdirSync(root, { recursive: true });
  git(root, "init", "-q", "-b", "main");
  write(root, { "down.json": { name: "down", directories: o.directories ?? [] } });
  writeDeclaredMounts(root, [mountOf(o.mount)]);
  return root;
}
const outcome = (root: string) => mountRemote({ instanceRoot: root, urlFor }).plan.outcomes.find((x) => x.instance === "core")!;

describe("mount-path collisions are refused before anything lands (t4xb)", () => {
  test("a populated directory no lock accounts for: refused (not identical), with the relocate command", () => {
    const root = downstream();
    write(root, { "core/notes.md": "mine\n" });
    const o = outcome(root);
    expect(o).toMatchObject({ state: "missing", refusal: "not-identical" });
    expect(o.detail).toContain("bun run cat mount:relocate core --to");
    expect(readFileSync(join(root, "core/notes.md"), "utf-8")).toBe("mine\n");
  });

  test("a directory the downstream declares: path-collision naming both claimants", () => {
    const root = downstream({ directories: [{ id: "core-notes", path: "core/", graphTypologies: ["code"] }] });
    const o = outcome(root);
    expect(o).toMatchObject({ state: "missing", refusal: "path-collision" });
    expect(o.detail).toContain("`core-notes`");
    expect(o.detail).toContain("mount `core`");
    expect(o.detail).toContain("mount:relocate");
    expect(existsSync(join(root, "core"))).toBe(false);
  });

  test("another mount's path: both claimants named", () => {
    const root = downstream();
    const c = pathCollisions(root, [
      { instance: "core", path: "shared" },
      { instance: "base", path: "shared/base" },
    ]);
    expect(c.get("core")![0]).toContain("mount `base`");
    expect(c.get("base")![0]).toContain("mount `core`");
  });

  test("a reserved root name, read from the declared list", () => {
    expect(reservedRootNames()).toContain("index");
    const root = downstream({ mount: { overrides: { core: { path: "build/core" } } } });
    const o = outcome(root);
    expect(o).toMatchObject({ refusal: "path-collision" });
    expect(o.detail).toContain("reserved root name");
  });

  test("the health check reports the collision with the relocate command", () => {
    const root = downstream({ directories: [{ id: "core-notes", path: "core/", graphTypologies: ["code"] }] });
    mountRemote({ instanceRoot: root, urlFor });
    const row = mountHealth(root, { network: false }).find((r) => r.state === "path-collision")!;
    expect(row.instance).toBe("core");
    expect(row.detail).toContain("mount:relocate");
  });
});

describe("mount:relocate (t4xb)", () => {
  test("unmounted: only the declaration changes, then it mounts at the new path", () => {
    const root = downstream({ directories: [{ id: "core-notes", path: "core/", graphTypologies: ["code"] }] });
    expect(outcome(root)).toMatchObject({ refusal: "path-collision" });
    const r = relocate(root, "core", "vendor/core", { urlFor });
    expect(r.state).toBe("relocated");
    expect(readDeclaredMounts(root).mounts[0]!.overrides?.core?.path).toBe("vendor/core");
    expect(readFileSync(join(root, "vendor/core/scripts/run.ts"), "utf-8")).toContain("v = 1");
    expect(checkRemote({ instanceRoot: root }).state).toBe("mounted");
  });

  test("mounted and clean: moved on disk, lock entry rewritten, still verified", () => {
    const root = downstream();
    expect(outcome(root).state).toBe("mounted");
    const r = relocate(root, "core", "vendor/core", { urlFor });
    expect(r.state).toBe("relocated");
    expect(existsSync(join(root, "core"))).toBe(false);
    expect(existsSync(join(root, "vendor/core/scripts/run.ts"))).toBe(true);
    const lock = MountLockSchema.parse(JSON.parse(readFileSync(join(root, "index.lock.json"), "utf-8")));
    expect(lock.instances[0]).toMatchObject({ path: "vendor/core" });
    expect(lock.instances[0]!.directories[0]!.path).toBe("vendor/core/scripts");
    expect(checkRemote({ instanceRoot: root }).state).toBe("mounted");
  });

  test("drifted: refused, nothing moved, nothing rewritten", () => {
    const root = downstream();
    mountRemote({ instanceRoot: root, urlFor });
    writeFileSync(join(root, "core/scripts/run.ts"), "export const v = 99;\n");
    const before = readFileSync(join(root, "index.config.json"), "utf-8");
    const r = relocate(root, "core", "vendor/core", { urlFor });
    expect(r.state).toBe("refused");
    expect(r.detail).toContain("upstream");
    expect(readFileSync(join(root, "core/scripts/run.ts"), "utf-8")).toBe("export const v = 99;\n");
    expect(existsSync(join(root, "vendor"))).toBe(false);
    expect(readFileSync(join(root, "index.config.json"), "utf-8")).toBe(before);
  });

  test("--plan: says what would change and writes nothing", () => {
    const root = downstream();
    mountRemote({ instanceRoot: root, urlFor });
    const cfg = readFileSync(join(root, "index.config.json"), "utf-8");
    const lock = readFileSync(join(root, "index.lock.json"), "utf-8");
    const r = relocate(root, "core", "vendor/core", { plan: true, urlFor });
    expect(r.state).toBe("planned");
    expect(r.steps.join("\n")).toContain("move `core/` → `vendor/core/`");
    expect(readFileSync(join(root, "index.config.json"), "utf-8")).toBe(cfg);
    expect(readFileSync(join(root, "index.lock.json"), "utf-8")).toBe(lock);
    expect(existsSync(join(root, "core/scripts/run.ts"))).toBe(true);
  });

  test("a target that collides is refused like a mount would be", () => {
    const root = downstream();
    expect(relocate(root, "core", "index/core", { plan: true }).state).toBe("refused");
  });
});

describe("check:mount-tracked (#2468)", () => {
  test("a clean mount passes", () => {
    const root = downstream();
    mountRemote({ instanceRoot: root, urlFor });
    expect(checkMountTracked(root)).toMatchObject({ state: "clean" });
  });

  test("a tracked file under a mount fails, and the health check reports it", () => {
    const root = downstream();
    mountRemote({ instanceRoot: root, urlFor });
    git(root, "add", "-f", "core/scripts/run.ts");
    const v = checkMountTracked(root);
    expect(v.state).toBe("tracked");
    expect(v.findings[0]).toMatchObject({ instance: "core", files: ["core/scripts/run.ts"] });
    expect(mountHealth(root, { network: false }).some((r) => r.state === "tracked-under-mount")).toBe(true);
  });
});
