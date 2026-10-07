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
import { run as replayLocks } from "../mount-from-lock.ts";
import { gitCorpus } from "../../schemas/git-corpus.ts";

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
    "ns.jsonld": '{"@context":{}}\n',
    "README.md": "# boot\n",
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
/** A person's consent for one pin (H8, bean `ieum`): without it a real mount is refused. */
const consentFor = (ref: string) => ({ trust: { consent: { by: "test", on: "2026-10-07", ref, evidence: "remote-mount.test.ts" } } });
/** A fresh downstream checkout declaring `remoteMounts`. */
function downstream(mount: object, extra: object = {}): string {
  const root = join(base, `down-${++n}`);
  mkdirSync(root, { recursive: true });
  git(root, "init", "-q", "-b", "main");
  write(root, { "down.json": decl("down", { remoteMounts: [{ harness: "core", repository: "o/up", ref: up.sha, ...consentFor(up.sha), ...mount }], ...extra }) });
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
    write(root, { "down.json": decl("down", { remoteMounts: [{ harness: "g", repository: "o/ghost", ref: ghost.sha, ...consentFor(ghost.sha) }] }) });
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
    write(root, { "down.json": decl("down", { remoteMounts: [{ harness: "trust", repository: "o/odd", ref: odd.sha, ...consentFor(odd.sha) }] }) });
    const r = mountRemote({ instanceRoot: root, urlFor: local });
    expect(summarise(r.plan.outcomes).state).toBe("mounted");
    expect(readFileSync(join(root, "trust/x/a.txt"), "utf-8")).toBe("a\n");
    expect(r.plan.instances[0]).toMatchObject({ upstreamRoot: "shared", path: "trust" });
  });
});

describe("mount trust (H8, bean `ieum`)", () => {
  test("16. unsigned and unconsented is refused, and nothing is written", () => {
    const root = downstream({ trust: undefined });
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(r.plan.outcomes.every((o) => o.state === "missing")).toBe(true);
    expect(r.plan.outcomes[0]!.detail).toContain("unsigned and unconsented");
    expect(existsSync(join(root, "core"))).toBe(false);
  });

  test("17. a staging mount needs neither signature nor consent", () => {
    const root = downstream({ trust: undefined });
    const r = mountRemote({ instanceRoot: root, urlFor, purpose: "staging" });
    expect(summarise(r.plan.outcomes).state).toBe("mounted");
  });

  test("18. consent for another pin is refused: a moved pin asks again", () => {
    const root = downstream(consentFor("2".repeat(40)));
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(r.plan.outcomes[0]!.detail).toContain("a moved pin asks again");
  });
});

describe("whole-instance mounts and replaying the lock (bean `nn8e`, #2462)", () => {
  test("19. `whole` mounts every tracked file at the instance root, locked as one `*` directory", () => {
    const root = downstream({ overrides: { boot: { whole: true } } });
    const r = mountRemote({ instanceRoot: root, urlFor });
    expect(Object.fromEntries(r.plan.outcomes.map((o) => [o.instance, o.state])).boot).toBe("mounted");
    // the root files a declared-directories mount leaves behind
    expect(readFileSync(join(root, "boot/ns.jsonld"), "utf-8")).toContain("@context");
    expect(existsSync(join(root, "boot/README.md"))).toBe(true);
    expect(existsSync(join(root, "boot/schemas/floor.ts"))).toBe(true);
    // never the fetch's own repository
    expect(existsSync(join(root, "boot/.git"))).toBe(false);
    const lock = MountLockSchema.parse(JSON.parse(readFileSync(join(root, "down.mount-lock.json"), "utf-8")));
    expect(lock.instances.find((i) => i.instance === "boot")!.directories).toMatchObject([{ id: "*", path: "boot", upstreamPath: "." }]);
    expect(checkRemote({ instanceRoot: root }).state).toBe("mounted");
  });

  test("20. a committed lock replays on a fresh clone with no declaration reader, and verifies digests", () => {
    const src = downstream({ overrides: { boot: { whole: true } } });
    mountRemote({ instanceRoot: src, urlFor });
    // A fresh checkout holding only the lock: what CI and session start see.
    const fresh = join(base, `fresh-${++n}`);
    mkdirSync(fresh, { recursive: true });
    git(fresh, "init", "-q", "-b", "main");
    writeFileSync(join(fresh, "down.mount-lock.json"), readFileSync(join(src, "down.mount-lock.json")));
    writeFileSync(join(fresh, "down.json"), readFileSync(join(src, "down.json")));
    // serve o/<name> under one prefix, as github.com would
    const srv = join(base, `srv-${n}`, "o");
    mkdirSync(srv, { recursive: true });
    spawnSync("ln", ["-s", up.bare, join(srv, "up")]);
    spawnSync("ln", ["-s", boot.bare, join(srv, "boot")]);
    const prev = process.env.CAT_MOUNT_URL_PREFIX;
    process.env.CAT_MOUNT_URL_PREFIX = `file://${dirname(srv)}`;
    try {
      const first = replayLocks(fresh, false);
      expect(Object.fromEntries(first.outcomes.map((o) => [o.instance, o.state]))).toEqual({ base: "mounted", boot: "mounted", core: "mounted" });
      expect(readFileSync(join(fresh, "boot/ns.jsonld"), "utf-8")).toContain("@context");
      expect(existsSync(join(fresh, "core/scripts/run.ts"))).toBe(true);
      // idempotent, and the offline check agrees
      expect(replayLocks(fresh, false).outcomes.every((o) => o.state === "current")).toBe(true);
      expect(replayLocks(fresh, true).outcomes.every((o) => o.state === "current")).toBe(true);
      // the mounter that writes locks reads the replayed tree as its own
      expect(checkRemote({ instanceRoot: fresh }).state).toBe("mounted");
      // a repo-wide scan sees mounted files as it saw a submodule's: ignored by git, still corpus
      const corpus = gitCorpus(fresh)!.map((f) => f.slice(fresh.length + 1));
      expect(corpus).toContain("boot/ns.jsonld");
      expect(corpus).toContain("core/scripts/run.ts");
      expect(corpus).toContain("core/core.json");
      expect(corpus.filter((f) => f === "boot/boot.json")).toHaveLength(1);
      expect(gitCorpus(fresh, ["*.jsonld"])!.map((f) => f.slice(fresh.length + 1))).toEqual(["boot/ns.jsonld"]);
      // an edit is reported, and a replay leaves it untouched
      writeFileSync(join(fresh, "boot/README.md"), "edited\n");
      const again = replayLocks(fresh, false).outcomes.find((o) => o.instance === "boot")!;
      expect(again.state).toBe("missing");
      expect(readFileSync(join(fresh, "boot/README.md"), "utf-8")).toBe("edited\n");
    } finally {
      if (prev === undefined) delete process.env.CAT_MOUNT_URL_PREFIX;
      else process.env.CAT_MOUNT_URL_PREFIX = prev;
    }
  });

  test("21. a lock whose digest the fetched bytes do not match is could-not-determine, and nothing is kept", () => {
    const src = downstream({ overrides: { boot: { whole: true } } });
    mountRemote({ instanceRoot: src, urlFor });
    const fresh = join(base, `fresh-${++n}`);
    mkdirSync(fresh, { recursive: true });
    git(fresh, "init", "-q", "-b", "main");
    const lock = JSON.parse(readFileSync(join(src, "down.mount-lock.json"), "utf-8"));
    lock.instances = lock.instances.filter((i: { instance: string }) => i.instance === "boot");
    lock.instances[0].repository = `file://${boot.bare}`;
    lock.instances[0].directories[0].treeDigest = "0".repeat(64);
    writeFileSync(join(fresh, "down.mount-lock.json"), JSON.stringify(lock));
    const r = replayLocks(fresh, false);
    expect(r.outcomes[0]!.state).toBe("could-not-determine");
    expect(existsSync(join(fresh, "boot"))).toBe(false);
  });
});
