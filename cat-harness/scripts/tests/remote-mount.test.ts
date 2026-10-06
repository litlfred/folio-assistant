/**
 * Remote mounts (bean `0mpw`) against FIXTURE REPOSITORIES — local bare git
 * repositories served over `file://`, so the real fetch path (shallow,
 * blobless, one commit, sparse checkout) runs with no network.
 *
 * The fixture is the shape the who-iris cutover needs, shrunk:
 *
 *   o/up    core   needs base   — mountDefaults narrows to `core-scripts`
 *           base   needs boot   — one directory is branch-kept, so not mounted
 *           boot   a GITLINK    → o/boot at its own pin (the submodule case)
 *   o/boot  boot   (at the repository root)
 *
 * The falsifier from the opening brief is test 2: a module in the mounted
 * `core` imports `../../base/schemas/util.ts` and must resolve.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { declarationChain } from "../../schemas/harness-config.ts";
import { instanceRootsIn } from "../../schemas/instance-roots.ts";
import { RemoteSourceSchema, resolveSubgraphSource } from "../../schemas/subgraph-source.ts";
import { MountLockSchema, mountedInstanceRoots } from "../../schemas/remote-mount.ts";
import { checkRemote, exitCode, mountRemote, planRemote, remoteFanOut, summarise } from "../remote-mount.ts";

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

/** Commit `files` (plus any gitlinks) into a fresh repository and serve it bare. Returns the bare path and the commit. */
function bareRepo(base: string, name: string, files: Record<string, string | object>, gitlinks: Record<string, string> = {}): { bare: string; sha: string } {
  const work = join(base, `${name}-work`);
  mkdirSync(work, { recursive: true });
  git(work, "init", "-q", "-b", "main");
  write(work, files);
  git(work, "add", "-A");
  for (const [path, sha] of Object.entries(gitlinks)) git(work, "update-index", "--add", "--cacheinfo", `160000,${sha},${path}`);
  git(work, "commit", "-q", "-m", "fixture");
  const sha = git(work, "rev-parse", "HEAD");
  const bare = join(base, `${name}.git`);
  git(base, "clone", "-q", "--bare", work, bare);
  git(bare, "config", "uploadpack.allowFilter", "true");
  git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
  return { bare, sha };
}

let base: string;
let up: { bare: string; sha: string };
let boot: { bare: string; sha: string };
let urlFor: (r: string) => string;

const decl = (name: string, extra: object = {}): object => ({ name, directories: [], ...extra });

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "remote-mount-test-"));
  boot = bareRepo(base, "boot", {
    "boot.json": decl("boot", { directories: [{ id: "boot-schemas", path: "schemas/", graphTypologies: ["code"] }] }),
    "schemas/floor.ts": "export const floor = 1;\n",
  });
  up = bareRepo(
    base,
    "up",
    {
      ".gitmodules": '[submodule "boot"]\n\tpath = boot\n\turl = https://github.com/o/boot\n',
      "core/core.json": decl("core", {
        needs: ["base"],
        livesAt: { repository: "o/up", path: "core" },
        mountDefaults: { directories: ["core-scripts"] },
        directories: [
          { id: "core-scripts", path: "scripts/", graphTypologies: ["code"] },
          { id: "core-docs", path: "docs/", graphTypologies: ["code"] },
        ],
      }),
      "core/scripts/run.ts": 'import { answer } from "../../base/schemas/util.ts";\nexport const doubled = answer * 2;\n',
      "core/docs/readme.md": "# core\n",
      "base/base.json": decl("base", {
        needs: ["boot"],
        livesAt: { repository: "o/up", path: "base" },
        directories: [
          { id: "base-schemas", path: "schemas/", graphTypologies: ["code"] },
          { id: "base-state", path: "state/", graphTypologies: ["code"], source: { kind: "branch", branch: "cat/base/state", keyedBy: "tip" } },
        ],
      }),
      "base/schemas/util.ts": "export const answer = 42;\n",
      "base/state/x.md": "state\n",
    },
    { boot: boot.sha },
  );
  const map: Record<string, string> = { "o/up": `file://${up.bare}`, "o/boot": `file://${boot.bare}` };
  urlFor = (r) => {
    const u = map[r];
    if (!u) throw new Error(`no fixture for ${r}`);
    return u;
  };
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

let n = 0;
/** A fresh downstream checkout declaring `remoteMounts`. */
function downstream(mount: object, extra: object = {}): string {
  const root = join(base, `down-${++n}`);
  mkdirSync(root, { recursive: true });
  git(root, "init", "-q", "-b", "main");
  write(root, { "down.json": decl("down", { remoteMounts: [{ harness: "core", repository: "o/up", ref: up.sha, ...mount }], ...extra }) });
  return root;
}

describe("the remote source member", () => {
  test("a pin is a full 40-character SHA, never a branch or an abbreviation", () => {
    expect(RemoteSourceSchema.safeParse({ kind: "remote", repository: "o/r", ref: "a".repeat(40) }).success).toBe(true);
    expect(RemoteSourceSchema.safeParse({ kind: "remote", repository: "o/r", ref: "main" }).success).toBe(false);
    expect(RemoteSourceSchema.safeParse({ kind: "remote", repository: "o/r", ref: "a".repeat(12) }).success).toBe(false);
  });

  test("resolves with the upstream path defaulting to the entry's own", () => {
    const r = resolveSubgraphSource({ id: "x", path: "skills/", source: { kind: "remote", repository: "o/r", ref: "b".repeat(40) } });
    expect(r).toMatchObject({ kind: "remote", repository: "o/r", upstreamPath: "skills/", declaredIn: "declaration" });
  });
});

describe("mount:remote over fixture repositories", () => {
  test("1. the closure is mounted transitively: same tree, then a gitlink pin", () => {
    const root = downstream({});
    const r = mountRemote({ instanceRoot: root, urlFor });
    const by = Object.fromEntries(r.plan.outcomes.map((o) => [o.instance, o.state]));
    expect(by).toEqual({ core: "mounted", base: "mounted", boot: "mounted" });
    // core: only what its mountDefaults names
    expect(existsSync(join(root, "core/core.json"))).toBe(true);
    expect(existsSync(join(root, "core/scripts/run.ts"))).toBe(true);
    expect(existsSync(join(root, "core/docs"))).toBe(false);
    // base: every in-checkout directory, and NOT the branch-kept one
    expect(existsSync(join(root, "base/schemas/util.ts"))).toBe(true);
    expect(existsSync(join(root, "base/state"))).toBe(false);
    // boot: read from ITS repository at the gitlink's pin, at its root
    expect(readFileSync(join(root, "boot/schemas/floor.ts"), "utf-8")).toContain("floor");

    const lock = MountLockSchema.parse(JSON.parse(readFileSync(join(root, "down.mount-lock.json"), "utf-8")));
    const bootLock = lock.instances.find((i) => i.instance === "boot")!;
    expect(bootLock).toMatchObject({ repository: "o/boot", sha: boot.sha, pinnedBy: "gitlink", upstreamRoot: "" });
    expect(lock.instances.find((i) => i.instance === "base")!.pinnedBy).toBe("same-tree");

    const c = checkRemote({ instanceRoot: root });
    expect(c.state).toBe("mounted");
    expect(exitCode(c.state)).toBe(0);
  });

  test("2. code arrives through mounted paths: a cross-instance relative import resolves", async () => {
    const root = downstream({});
    mountRemote({ instanceRoot: root, urlFor });
    const mod = (await import(join(root, "core/scripts/run.ts"))) as { doubled: number };
    expect(mod.doubled).toBe(84);
  });

  test("3. the overlay reads a mounted dependency like a local one", () => {
    const root = downstream({}, { needs: ["core"] });
    mountRemote({ instanceRoot: root, urlFor });
    expect(instanceRootsIn(root).map((p) => p.slice(root.length))).toEqual(["", "/base", "/boot", "/core"]);
    expect(declarationChain(root).map((c) => c.name)).toEqual(["boot", "base", "core", "(root)"]);
  });

  test("4. edited mounted bytes are reported, and a re-mount leaves them untouched", () => {
    const root = downstream({});
    mountRemote({ instanceRoot: root, urlFor });
    writeFileSync(join(root, "base/schemas/util.ts"), "export const answer = 41;\n");
    const c = checkRemote({ instanceRoot: root });
    expect(c.state).toBe("missing");
    expect(c.outcomes.find((o) => o.instance === "base")!.detail).toContain("modified");
    const again = mountRemote({ instanceRoot: root, urlFor });
    expect(again.plan.outcomes.find((o) => o.instance === "base")!.detail).toContain("left untouched");
    expect(readFileSync(join(root, "base/schemas/util.ts"), "utf-8")).toContain("41");
  });

  test("5. a downstream overrides by id — path and directories — and the overlay still finds it", () => {
    const root = downstream({ overrides: { core: { path: "vendor/core", directories: ["core-docs"] } } });
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(summarise(r.plan.outcomes).state).toBe("mounted");
    expect(existsSync(join(root, "vendor/core/docs/readme.md"))).toBe(true);
    expect(existsSync(join(root, "vendor/core/scripts"))).toBe(false);
    expect(mountedInstanceRoots(root).get("core")).toBe(join(root, "vendor/core"));
  });

  test("5b. a dependency an override moved deeper is still resolved by the overlay, through the lock", () => {
    const root = downstream({ overrides: { core: { path: "vendor/core" } } }, { needs: ["core"] });
    mountRemote({ instanceRoot: root, urlFor });
    expect(declarationChain(root).map((c) => c.name)).toEqual(["boot", "base", "core", "(root)"]);
  });

  test("6. an override that names an undeclared directory is refused, not dropped", () => {
    const root = downstream({ overrides: { core: { directories: ["nope"] } } });
    const p = planRemote({ instanceRoot: root, urlFor });
    expect(p.outcomes.find((o) => o.instance === "core")).toMatchObject({ state: "could-not-determine" });
  });

  test("7. `skip` is an answer, recorded in the lock, and not a failure", () => {
    const root = downstream({ overrides: { boot: { skip: true } } });
    mountRemote({ instanceRoot: root, urlFor });
    const c = checkRemote({ instanceRoot: root });
    expect(c.state).toBe("mounted");
    expect(c.outcomes.find((o) => o.instance === "boot")!.state).toBe("skipped");
  });

  test("8. a pin the remote does not have is could-not-determine, never an empty layer", () => {
    const root = downstream({ ref: "0".repeat(40) });
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(summarise(r.plan.outcomes).state).toBe("could-not-determine");
    expect(checkRemote({ instanceRoot: root }).state).toBe("could-not-determine");
    expect(exitCode("could-not-determine")).toBe(2);
  });

  test("9. a path the mount did not put there is refused", () => {
    const root = downstream({});
    write(root, { "core/mine.txt": "local work\n" });
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(r.plan.outcomes.find((o) => o.instance === "core")).toMatchObject({ state: "missing" });
    expect(readFileSync(join(root, "core/mine.txt"), "utf-8")).toBe("local work\n");
    expect(checkRemote({ instanceRoot: root }).state).toBe("missing");
  });

  test("10. a lock for other pins reads stale; an unreadable lock reads could-not-determine", () => {
    const root = downstream({});
    mountRemote({ instanceRoot: root, urlFor });
    const file = join(root, "down.json");
    const d = JSON.parse(readFileSync(file, "utf-8"));
    d.remoteMounts[0].ref = "1".repeat(40);
    writeFileSync(file, JSON.stringify(d));
    expect(checkRemote({ instanceRoot: root }).state).toBe("missing");
    writeFileSync(join(root, "down.mount-lock.json"), "{ not json");
    expect(checkRemote({ instanceRoot: root }).state).toBe("could-not-determine");
  });

  test("11. no lock where mounts are declared is missing; nothing declared is not-enabled", () => {
    const root = downstream({});
    expect(checkRemote({ instanceRoot: root }).state).toBe("missing");
    const bare = join(base, "plain");
    mkdirSync(bare);
    write(bare, { "plain.json": decl("plain") });
    expect(checkRemote({ instanceRoot: bare }).state).toBe("not-enabled");
  });

  test("12. a need neither in the tree nor pinned as a gitlink is missing, and the check says so", () => {
    const root = downstream({});
    const ghost = bareRepo(base, "ghost", { "g/g.json": decl("g", { needs: ["nobody"], directories: [{ id: "g-x", path: "x/", graphTypologies: ["code"] }] }), "g/x/a.txt": "a\n" });
    const local = (r: string): string => (r === "o/ghost" ? `file://${ghost.bare}` : urlFor(r));
    write(root, { "down.json": decl("down", { remoteMounts: [{ harness: "g", repository: "o/ghost", ref: ghost.sha }] }) });
    mountRemote({ instanceRoot: root, urlFor: local });
    const c = checkRemote({ instanceRoot: root });
    expect(c.state).toBe("missing");
    expect(c.outcomes.find((o) => o.instance === "nobody")!.state).toBe("missing");
  });

  test("13. the mount is kept out of commits", () => {
    const root = downstream({});
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(r.excluded.sort()).toEqual(["base", "boot", "core"]);
    expect(git(root, "status", "--porcelain")).not.toContain("core/");
  });

  test("14. the session-start fan-out mounts every declaring instance, then checks clean", () => {
    const root = downstream({});
    expect(remoteFanOut(root, { check: true }).state).toBe("missing");
    expect(remoteFanOut(root, { urlFor }).state).toBe("mounted");
    expect(remoteFanOut(root, { check: true }).state).toBe("mounted");
  });

  test("15. a declaration whose directory is NOT its name is found, and lands at livesAt.path", () => {
    // The smart-* forks: `smart-base/smart-trust.json` declares `smart-trust`.
    const odd = bareRepo(base, "odd", {
      "shared/trust.json": decl("trust", { livesAt: { repository: "o/odd", path: "trust" }, directories: [{ id: "trust-x", path: "x/", graphTypologies: ["code"] }] }),
      "shared/x/a.txt": "a\n",
    });
    const local = (r: string): string => (r === "o/odd" ? `file://${odd.bare}` : urlFor(r));
    const root = downstream({});
    write(root, { "down.json": decl("down", { remoteMounts: [{ harness: "trust", repository: "o/odd", ref: odd.sha }] }) });
    const r = mountRemote({ instanceRoot: root, urlFor: local });
    expect(summarise(r.plan.outcomes).state).toBe("mounted");
    expect(readFileSync(join(root, "trust/x/a.txt"), "utf-8")).toBe("a\n");
    expect(r.plan.instances[0]).toMatchObject({ upstreamRoot: "shared", path: "trust" });
  });

  test("16. `undeclared: true` also lays down what no declared directory holds, locks it, and catches an edit there", () => {
    // The smart-* forks (bean hupw): the mounted `tools/` imports `../platform.ts`,
    // a root file no declared directory holds; `docs/` is declared and left out.
    const ig = bareRepo(base, "ig", {
      "nest/ig.json": decl("ig", {
        livesAt: { repository: "o/ig", path: "ig" },
        directories: [
          { id: "ig-tools", path: "tools/", graphTypologies: ["code"] },
          { id: "ig-docs", path: "docs/", graphTypologies: ["code"] },
        ],
      }),
      "nest/platform.ts": "export const p = 1;\n",
      "nest/schemas/s.ts": "export const s = 2;\n",
      "nest/tools/index.ts": 'import { p } from "../platform.ts";\nexport const t = p;\n',
      "nest/docs/page.md": "# generated\n",
      "outside.txt": "not the instance's\n",
    });
    const local = (r: string): string => (r === "o/ig" ? `file://${ig.bare}` : urlFor(r));
    const root = downstream({});
    write(root, {
      "down.json": decl("down", {
        remoteMounts: [{ harness: "ig", repository: "o/ig", ref: ig.sha, overrides: { ig: { path: "ig", undeclared: true, directories: ["ig-tools"] } } }],
      }),
    });
    const r = mountRemote({ instanceRoot: root, urlFor: local });
    expect(summarise(r.plan.outcomes).state).toBe("mounted");
    expect(readFileSync(join(root, "ig/platform.ts"), "utf-8")).toBe("export const p = 1;\n");
    expect(existsSync(join(root, "ig/schemas/s.ts"))).toBe(true);
    expect(existsSync(join(root, "ig/tools/index.ts"))).toBe(true);
    expect(existsSync(join(root, "ig/docs"))).toBe(false); // declared, not listed: left out
    expect(existsSync(join(root, "outside.txt"))).toBe(false); // outside the instance
    const lock = MountLockSchema.parse(JSON.parse(readFileSync(join(root, "down.mount-lock.json"), "utf-8")));
    expect(lock.instances[0]!.undeclared).toMatchObject({ files: 2, excludes: ["docs", "tools"] });
    // A generator writing the left-out declared directory is not an edit of the mount ...
    write(root, { "ig/docs/page.md": "# built here\n" });
    expect(checkRemote({ instanceRoot: root }).state).toBe("mounted");
    // ... an edit to a pinned root file is.
    write(root, { "ig/platform.ts": "export const p = 2;\n" });
    const c = checkRemote({ instanceRoot: root });
    expect(c.state).toBe("missing");
    expect(c.outcomes.find((o) => o.instance === "ig")!.detail).toContain("outside its declared directories");
  });
});
