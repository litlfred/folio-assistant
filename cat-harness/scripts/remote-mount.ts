#!/usr/bin/env bun
/**
 * remote-mount — lay a harness and its dependency closure down from another
 * repository at a pinned commit, lock what arrived, and check it.
 *
 * @module scripts/remote-mount
 * @graphNode none — a session-start step and a gate over declared `remoteMounts`
 * @covers none — it MAKES dependency layers readable and judges none of their
 * content; the gates that judge a layer run over it once it is mounted, and a
 * mount that claimed their coverage would let them be removed unnoticed (the
 * reasoning `state-mount.ts` records for the branch mounts).
 *
 * Bean `0mpw`. Schema and the owner's rulings: `schemas/remote-mount.ts`.
 *
 *   bun run mount:remote              # plan, fetch, mount, write the lock
 *   bun run mount:remote --plan       # resolve the closure and print it; write nothing
 *   bun run mount:remote:check        # disk against lock against declaration — no network
 *
 * `state:mount` runs the mount after the branch mounts, so the session-start
 * hook needs no second entry point.
 *
 * ## The closure, transitively
 *
 * A downstream names a harness, its repository and a 40-character pin. The
 * harness's declaration is read FROM THAT TREE; each name in its `needs` is
 * looked for in the same tree (an instance whose `<name>.json` agrees with its
 * own `name`), and failing that as a GITLINK at that tree — a submodule entry
 * is itself a pin, so `cat-harness`'s `needs: ["bootstrap"]` at a pinned
 * folio-assistant commit names `litlfred/bootstrap` at the gitlink's SHA, with
 * no submodule in the downstream. A need found in neither is `missing`, never
 * dropped. A need the downstream already holds as a local instance is
 * `local` — supplied, not mounted over.
 *
 * ## Three states, never two (bean `1xhc`)
 *
 * Every instance comes back `mounted`, `missing` or `could-not-determine`. A
 * fetch that failed is the third, not an empty layer; a lock that cannot be
 * read is the third, not "nothing mounted". The process exits 0 only when
 * every instance is mounted or local (or nothing is declared), 1 when any is
 * missing, 2 when any could not be determined.
 *
 * ## It never discards work
 *
 * A mounted directory whose bytes no longer hash to the lock is left exactly
 * as it is and reported, never re-fetched over: somebody edited it, and those
 * edits are theirs to move upstream or drop. A path that holds anything this
 * mount did not put there — a tracked file, an unlocked directory — is refused.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { z } from "zod";

import { checkoutRootFor, instanceRootsIn, readDeclaration } from "../schemas/cat-harness.js";
import {
  MOUNT_LOCK_SCHEMA,
  MountDefaultsSchema,
  MountPathSchema,
  mountLockFilename,
  readMountLock,
  type LockedInstance,
  type MountLock,
  type RemoteMount,
} from "../schemas/remote-mount.js";
import { contentIsOffCheckout, type SubgraphSource } from "../schemas/subgraph-source.js";
import { treeDigest, treeEntries } from "./kg-subscribe.ts";
import { RemoteTree, type UrlFor } from "./remote-tree.ts";

// ── Reading an upstream declaration STRUCTURALLY ─────────────────────────────

/**
 * The fields of an upstream declaration the planner reads — and only those.
 * Structural on purpose: the upstream is at ITS pin, and its schema may be
 * newer or older than the one in this checkout. Holding it to this
 * checkout's full schema would refuse a harness for a field the mount never
 * reads.
 */
const UpstreamDeclarationSchema = z
  .object({
    name: z.string().min(1),
    needs: z.array(z.string().min(1)).optional(),
    livesAt: z.object({ path: z.string().min(1) }).passthrough().optional(),
    mountDefaults: MountDefaultsSchema.optional(),
    directories: z
      .array(z.object({ id: z.string().min(1), path: z.string().min(1), source: z.unknown().optional(), storage: z.unknown().optional() }).passthrough())
      .default([]),
  })
  .passthrough();
type UpstreamDeclaration = z.infer<typeof UpstreamDeclarationSchema>;

// ── The plan ─────────────────────────────────────────────────────────────────

export interface PlannedDirectory {
  id: string;
  /** Checkout-relative, no trailing slash. */
  path: string;
  /** Upstream-relative, no trailing slash. */
  upstreamPath: string;
}

export interface PlannedInstance {
  instance: string;
  repository: string;
  sha: string;
  upstreamRoot: string;
  path: string;
  via: string;
  pinnedBy: LockedInstance["pinnedBy"];
  declarationFile: string;
  directories: PlannedDirectory[];
  /**
   * Set by an `undeclared: true` override: also lay down what lies outside
   * every declared directory. `excludes` is every declared directory's path
   * (instance-relative, no trailing slash), mounted or not.
   */
  undeclared?: { excludes: string[] };
}

export type InstanceOutcome =
  | { instance: string; state: "mounted"; path: string; detail: string }
  /** The downstream holds this instance itself; nothing was mounted over it. */
  | { instance: string; state: "local"; path: string; detail: string }
  /** An override said `skip`. */
  | { instance: string; state: "skipped"; detail: string }
  | { instance: string; state: "missing"; path?: string; detail: string }
  | { instance: string; state: "could-not-determine"; path?: string; detail: string };

export interface Plan {
  /** Absolute root of the declaring (downstream) instance. */
  instanceRoot: string;
  downstream: string;
  mounts: RemoteMount[];
  instances: PlannedInstance[];
  outcomes: InstanceOutcome[];
}

export interface RemoteMountOptions {
  /** The downstream instance root; defaults to the checkout's root instance. */
  instanceRoot?: string;
  /** How `owner/repo` becomes a fetch URL — tests serve local bare repositories. */
  urlFor?: UrlFor;
}

const strip = (p: string): string => p.replace(/\/+$/, "");
const joinRel = (...ps: string[]): string => ps.map(strip).filter(Boolean).join("/");

/** `.gitmodules` → `path → url`. */
function gitmodules(text: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  if (!text) return out;
  let path: string | undefined;
  let url: string | undefined;
  const flush = (): void => {
    if (path && url) out.set(strip(path), url);
    path = url = undefined;
  };
  for (const line of text.split("\n")) {
    if (/^\s*\[submodule /.test(line)) flush();
    const m = /^\s*(path|url)\s*=\s*(.+?)\s*$/.exec(line);
    if (m) {
      if (m[1] === "path") path = m[2];
      else url = m[2];
    }
  }
  flush();
  return out;
}

/** A github URL → `owner/repo`; anything else is kept as the URL it is. */
function repositoryOf(url: string): string {
  const m = /^(?:https?:\/\/|git@)github\.com[/:]([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(url);
  return m ? m[1]! : url;
}

/**
 * Find instance `name` in a tree: the root's own `<name>.json`, else a
 * top-level directory's — each accepted only when the file's `name` agrees,
 * the rule `findDeclarationFile` applies on disk.
 */
function findInstance(tree: RemoteTree, name: string): { root: string; file: string; text: string; decl: UpstreamDeclaration } | { error: string } | undefined {
  const candidates = [`${name}.json`, ...tree.list("").filter((e) => e.kind === "tree").map((e) => `${e.path}/${name}.json`)];
  for (const file of candidates) {
    const text = tree.readText(file);
    if (text === undefined) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      continue;
    }
    if ((raw as { name?: unknown })?.name !== name) continue;
    const p = UpstreamDeclarationSchema.safeParse(raw);
    if (!p.success) return { error: `${file} at ${tree.sha.slice(0, 12)} declares \`${name}\` but its mount fields do not parse: ${p.error.issues[0]?.message}` };
    return { root: dirname(file) === "." ? "" : dirname(file), file, text, decl: p.data };
  }
  return undefined;
}

/** The downstream's own declaration and its `remoteMounts`, or why not. */
function downstreamOf(opts: RemoteMountOptions): { instanceRoot: string; name: string; mounts: RemoteMount[] } {
  const instanceRoot = resolve(opts.instanceRoot ?? checkoutRootFor(process.cwd()));
  const decl = readDeclaration(instanceRoot);
  if (!decl) throw new Error(`${instanceRoot} holds no instance declaration`);
  return { instanceRoot, name: decl.name, mounts: decl.remoteMounts ?? [] };
}

/**
 * Resolve every declared mount's closure. Fetches trees (blobless) and reads
 * declarations; writes nothing. The trees stay open in `trees` for
 * {@link mountRemote} to check out from; {@link planRemote} closes them.
 */
function resolveClosure(opts: RemoteMountOptions, trees: Map<string, RemoteTree>): Plan {
  const ds = downstreamOf(opts);
  const plan: Plan = { instanceRoot: ds.instanceRoot, downstream: ds.name, mounts: ds.mounts, instances: [], outcomes: [] };
  if (ds.mounts.length === 0) return plan;

  // Instances the downstream checkout ALREADY holds and did not get from a
  // previous mount: those are local, and a mount never lands on them.
  const prior = readMountLock(join(ds.instanceRoot, mountLockFilename(ds.name)));
  const previouslyMounted = new Set(prior.ok ? prior.lock.instances.map((i) => i.instance) : []);
  const local = new Map<string, string>();
  for (const root of instanceRootsIn(ds.instanceRoot)) {
    try {
      const n = readDeclaration(root)?.name;
      if (n && !previouslyMounted.has(n)) local.set(n, root);
    } catch {
      // unreadable: check:declaration-filename's finding, not this one's
    }
  }

  const open = (repository: string, sha: string): RemoteTree => {
    const key = `${repository}@${sha}`;
    let t = trees.get(key);
    if (!t) {
      t = RemoteTree.open(repository, sha, { urlFor: opts.urlFor, prefix: "remote-mount-" });
      trees.set(key, t);
    }
    return t;
  };

  const seen = new Map<string, { repository: string; sha: string }>();
  for (const m of ds.mounts) {
    const queue: Array<{ name: string; repository: string; sha: string; pinnedBy: LockedInstance["pinnedBy"] }> = [
      { name: m.harness, repository: m.repository, sha: m.ref, pinnedBy: "declared" },
    ];
    while (queue.length) {
      const q = queue.shift()!;
      const was = seen.get(q.name);
      if (was) {
        if (was.repository !== q.repository || was.sha !== q.sha) {
          plan.outcomes.push({
            instance: q.name,
            state: "could-not-determine",
            detail: `reached at two pins — ${was.repository}@${was.sha.slice(0, 12)} and ${q.repository}@${q.sha.slice(0, 12)}; one instance cannot be mounted twice, so pin one with an override`,
          });
        }
        continue;
      }
      seen.set(q.name, { repository: q.repository, sha: q.sha });
      if (local.has(q.name) && q.name !== m.harness) {
        plan.outcomes.push({ instance: q.name, state: "local", path: local.get(q.name)!, detail: "held by this checkout; not mounted over" });
        continue;
      }
      const override = m.overrides?.[q.name];
      if (override?.skip) {
        plan.outcomes.push({ instance: q.name, state: "skipped", detail: "the downstream's override says `skip`" });
        continue;
      }
      let tree: RemoteTree;
      try {
        tree = open(q.repository, q.sha);
      } catch (e) {
        plan.outcomes.push({ instance: q.name, state: "could-not-determine", detail: `could not fetch ${q.repository}@${q.sha}: ${(e as Error).message}` });
        continue;
      }
      let found: ReturnType<typeof findInstance>;
      try {
        found = findInstance(tree, q.name);
      } catch (e) {
        plan.outcomes.push({ instance: q.name, state: "could-not-determine", detail: `could not read ${q.repository}@${q.sha.slice(0, 12)}: ${(e as Error).message}` });
        continue;
      }
      if (found === undefined) {
        plan.outcomes.push({ instance: q.name, state: "missing", detail: `no declaration of \`${q.name}\` in ${q.repository}@${q.sha.slice(0, 12)}` });
        continue;
      }
      if ("error" in found) {
        plan.outcomes.push({ instance: q.name, state: "could-not-determine", detail: found.error });
        continue;
      }
      const { decl } = found;
      const path = strip(override?.path ?? decl.mountDefaults?.path ?? decl.livesAt?.path ?? (found.root || q.name));
      if (!MountPathSchema.safeParse(path).success || path === "") {
        plan.outcomes.push({ instance: q.name, state: "could-not-determine", detail: `mount path \`${path}\` is not a repository-relative directory` });
        continue;
      }
      const byId = new Map(decl.directories.map((d) => [d.id, d]));
      const ids =
        override?.directories ??
        decl.mountDefaults?.directories ??
        decl.directories.filter((d) => !contentIsOffCheckout({ source: d.source as SubgraphSource | undefined, storage: d.storage })).map((d) => d.id);
      const unknown = ids.filter((id) => !byId.has(id));
      if (unknown.length) {
        plan.outcomes.push({
          instance: q.name,
          state: "could-not-determine",
          detail: `\`${unknown.join("`, `")}\` named for mounting but not declared by \`${q.name}\` at ${q.sha.slice(0, 12)}`,
        });
        continue;
      }
      const directories: PlannedDirectory[] = [];
      for (const id of ids) {
        const d = byId.get(id)!;
        if (strip(d.path).split("/").includes("..")) continue; // a path that climbs out is not this instance's to give
        directories.push({ id, path: joinRel(path, d.path), upstreamPath: joinRel(found.root, d.path) });
      }
      plan.instances.push({
        instance: q.name,
        repository: q.repository,
        sha: q.sha,
        upstreamRoot: found.root,
        path,
        via: m.harness,
        pinnedBy: q.pinnedBy,
        declarationFile: found.file,
        directories,
        ...(override?.undeclared
          ? { undeclared: { excludes: [...new Set(decl.directories.map((d) => strip(d.path)).filter((x) => x && !x.split("/").includes("..")))].sort() } }
          : {}),
      });

      // TRANSITIVELY: each need in the same tree, else as a gitlink there.
      const modules = gitmodules(tree.readText(".gitmodules"));
      for (const need of decl.needs ?? []) {
        if (seen.has(need)) continue;
        let inTree: ReturnType<typeof findInstance>;
        try {
          inTree = findInstance(tree, need);
        } catch {
          inTree = undefined;
        }
        if (inTree !== undefined) {
          queue.push({ name: need, repository: q.repository, sha: q.sha, pinnedBy: "same-tree" });
          continue;
        }
        const link = tree.list("").find((e) => e.kind === "commit" && e.path === need);
        const url = link ? modules.get(link.path) : undefined;
        if (link && url) {
          queue.push({ name: need, repository: repositoryOf(url), sha: link.oid, pinnedBy: "gitlink" });
          continue;
        }
        if (local.has(need)) {
          seen.set(need, { repository: "(local)", sha: "" });
          plan.outcomes.push({ instance: need, state: "local", path: local.get(need)!, detail: "held by this checkout; not mounted over" });
          continue;
        }
        seen.set(need, { repository: q.repository, sha: q.sha });
        plan.outcomes.push({
          instance: need,
          state: "missing",
          detail: `\`${q.name}\` needs \`${need}\`, which ${q.repository}@${q.sha.slice(0, 12)} neither holds nor pins as a gitlink`,
        });
      }
    }
  }
  return plan;
}

/** Resolve the closure and close every fetched tree. Writes nothing. */
export function planRemote(opts: RemoteMountOptions = {}): Plan {
  const trees = new Map<string, RemoteTree>();
  try {
    return resolveClosure(opts, trees);
  } finally {
    for (const t of trees.values()) t.close();
  }
}

// ── Mounting ─────────────────────────────────────────────────────────────────

function sha256Text(s: string | Buffer): string {
  return createHash("sha256").update(s).digest("hex");
}

function digestOf(abs: string): { treeDigest: string; files: number } {
  const { files } = treeEntries(abs);
  return { treeDigest: treeDigest(abs, files), files: files.length };
}

function gitIn(cwd: string, args: string[]): { status: number; stdout: string } {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8" });
  return { status: r.status ?? 128, stdout: r.stdout ?? "" };
}

/** Is any file under `rel` tracked by the checkout? A mount never lands on tracked bytes. */
function tracked(base: string, rel: string): boolean {
  const r = gitIn(base, ["ls-files", "--", rel]);
  return r.status === 0 && r.stdout.trim() !== "";
}

/**
 * Keep the mount out of commits. When the checkout's own rules already
 * ignore the path nothing is written; otherwise the path goes to this
 * worktree's `info/exclude` — local, never committed — and the report says
 * so, so a folio that wants the rule visible can commit it to `.gitignore`.
 */
function ensureIgnored(base: string, rel: string): "ignored" | "excluded" | "not-a-checkout" {
  if (gitIn(base, ["rev-parse", "--git-dir"]).status !== 0) return "not-a-checkout";
  if (gitIn(base, ["check-ignore", "-q", "--no-index", `${rel}/`]).status === 0) return "ignored";
  // `info/exclude` patterns are relative to the top of the worktree, and the
  // downstream instance may sit below it.
  const prefix = gitIn(base, ["rev-parse", "--show-prefix"]).stdout.trim();
  const file = resolve(base, gitIn(base, ["rev-parse", "--git-path", "info/exclude"]).stdout.trim());
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `# remote mount (bean 0mpw) — bun run mount:remote\n/${prefix}${rel}/\n`);
  return "excluded";
}

/**
 * The files of an `undeclared` mount, relative to the instance root: every
 * file there except under a declared directory and except the declaration
 * itself (`<instance>.json`, locked on its own).
 */
function undeclaredFiles(instanceAbs: string, excludes: readonly string[], declarationFile: string): string[] {
  return treeEntries(instanceAbs).files.filter((f) => f !== declarationFile && !excludes.some((x) => f === x || f.startsWith(`${x}/`)));
}

function undeclaredDigestOf(instanceAbs: string, excludes: readonly string[], declarationFile: string): { treeDigest: string; files: number } {
  const files = undeclaredFiles(instanceAbs, excludes, declarationFile);
  return { treeDigest: treeDigest(instanceAbs, files), files: files.length };
}

/** Directories of a previously locked instance whose bytes no longer match the lock. */
function modifiedSince(base: string, locked: LockedInstance): string[] {
  const out = locked.directories
    .filter((d) => existsSync(join(base, d.path)) && digestOf(join(base, d.path)).treeDigest !== d.treeDigest)
    .map((d) => d.path);
  const u = locked.undeclared;
  if (u && existsSync(join(base, locked.path)) && undeclaredDigestOf(join(base, locked.path), u.excludes, locked.declaration.file).treeDigest !== u.treeDigest) {
    out.push(`${locked.path}/ (outside its declared directories)`);
  }
  return out;
}

export interface MountReport {
  plan: Plan;
  lockFile: string;
  /** Paths written to `info/exclude` rather than already ignored. */
  excluded: string[];
}

/** Plan, fetch, lay each planned instance down, write the lock. */
export function mountRemote(opts: RemoteMountOptions = {}): MountReport {
  const trees = new Map<string, RemoteTree>();
  try {
    const plan = resolveClosure(opts, trees);
    const lockFile = join(plan.instanceRoot, mountLockFilename(plan.downstream));
    const excluded: string[] = [];
    if (plan.mounts.length === 0) return { plan, lockFile, excluded };

    const prior = readMountLock(lockFile);
    const priorBy = new Map((prior.ok ? prior.lock.instances : []).map((i) => [i.instance, i]));
    const locked: LockedInstance[] = [];
    const untouched = new Set<string>();

    for (const p of plan.instances) {
      const target = join(plan.instanceRoot, p.path);
      const before = priorBy.get(p.instance);
      try {
        if (before) {
          const changed = modifiedSince(plan.instanceRoot, before);
          if (changed.length) {
            plan.outcomes.push({
              instance: p.instance,
              state: "missing",
              path: p.path,
              detail: `left untouched: ${changed.join(", ")} no longer hash to the lock — edits there are somebody's work; move them upstream or delete the directory, then re-mount`,
            });
            locked.push(before);
            untouched.add(p.instance);
            continue;
          }
        } else if (existsSync(target)) {
          plan.outcomes.push({ instance: p.instance, state: "missing", path: p.path, detail: `\`${p.path}/\` already exists and no lock says this mount put it there — refused` });
          continue;
        }
        if (tracked(plan.instanceRoot, p.path)) {
          plan.outcomes.push({ instance: p.instance, state: "missing", path: p.path, detail: `\`${p.path}/\` holds tracked files — a mount never lands on tracked bytes` });
          continue;
        }
        const tree = trees.get(`${p.repository}@${p.sha}`)!;
        const work = tree.checkout([
          p.declarationFile,
          ...p.directories.map((d) => `${d.upstreamPath}/`),
          ...(p.undeclared ? [p.upstreamRoot ? `${p.upstreamRoot}/` : "*"] : []),
        ]);

        // Replace what THIS mount put there before — only that.
        if (before) {
          for (const d of before.directories) rmSync(join(plan.instanceRoot, d.path), { recursive: true, force: true });
          rmSync(join(plan.instanceRoot, before.path, `${before.instance}.json`), { force: true });
          if (before.undeclared) {
            const at = join(plan.instanceRoot, before.path);
            for (const f of undeclaredFiles(at, before.undeclared.excludes, before.declaration.file)) rmSync(join(at, f), { force: true });
          }
        }
        mkdirSync(target, { recursive: true });
        const declText = readFileSync(join(work, p.declarationFile));
        writeFileSync(join(target, `${p.instance}.json`), declText);
        const dirs: LockedInstance["directories"] = [];
        const absent: string[] = [];
        for (const d of p.directories) {
          const src = join(work, d.upstreamPath);
          if (!existsSync(src)) {
            absent.push(d.id);
            continue;
          }
          const dst = join(plan.instanceRoot, d.path);
          mkdirSync(dirname(dst), { recursive: true });
          cpSync(src, dst, { recursive: true, verbatimSymlinks: true, force: true });
        }
        // Everything outside the declared directories, when the override asks for it.
        let undeclared: LockedInstance["undeclared"];
        if (p.undeclared) {
          const srcRoot = join(work, p.upstreamRoot);
          const upstreamDecl = p.declarationFile.split("/").pop()!;
          for (const f of undeclaredFiles(srcRoot, p.undeclared.excludes, upstreamDecl)) {
            if (f === `${p.instance}.json`) continue;
            const dst = join(target, f);
            mkdirSync(dirname(dst), { recursive: true });
            cpSync(join(srcRoot, f), dst, { verbatimSymlinks: true, force: true });
          }
          undeclared = { ...undeclaredDigestOf(target, p.undeclared.excludes, `${p.instance}.json`), excludes: p.undeclared.excludes };
        }
        // Digest AFTER every copy, so a nested directory's digest covers what is on disk.
        for (const d of p.directories) {
          if (absent.includes(d.id)) continue;
          dirs.push({ id: d.id, path: d.path, upstreamPath: d.upstreamPath, ...digestOf(join(plan.instanceRoot, d.path)) });
        }
        if (ensureIgnored(plan.instanceRoot, p.path) === "excluded") excluded.push(p.path);
        locked.push({
          instance: p.instance,
          repository: p.repository,
          sha: p.sha,
          upstreamRoot: p.upstreamRoot,
          path: p.path,
          via: p.via,
          pinnedBy: p.pinnedBy,
          declaration: { file: `${p.instance}.json`, sha256: sha256Text(declText) },
          directories: dirs,
          ...(undeclared ? { undeclared } : {}),
        });
        const files = dirs.reduce((n, d) => n + d.files, 0) + (undeclared?.files ?? 0);
        plan.outcomes.push({
          instance: p.instance,
          state: absent.length ? "missing" : "mounted",
          path: p.path,
          detail: absent.length
            ? `declared but absent at ${p.sha.slice(0, 12)}: ${absent.join(", ")} — the rest is mounted`
            : `${dirs.length} director${dirs.length === 1 ? "y" : "ies"}${undeclared ? ` and ${undeclared.files} file(s) outside them` : ""}, ${files} file(s) from ${p.repository}@${p.sha.slice(0, 12)}`,
        });
      } catch (e) {
        plan.outcomes.push({ instance: p.instance, state: "could-not-determine", path: p.path, detail: `mounting threw: ${(e as Error).message}` });
      }
    }

    const lock: MountLock = {
      $schema: MOUNT_LOCK_SCHEMA,
      mounts: plan.mounts.map((m) => ({ harness: m.harness, repository: m.repository, ref: m.ref })),
      instances: locked.sort((a, b) => a.instance.localeCompare(b.instance)),
      // Every non-mounted answer EXCEPT an untouched prior mount, which stays
      // in `instances` and is re-judged from disk by the check.
      unmounted: plan.outcomes
        .filter((o) => o.state !== "mounted" && !untouched.has(o.instance))
        .map((o) => ({ instance: o.instance, state: o.state as "local" | "skipped" | "missing" | "could-not-determine", detail: o.detail }))
        .sort((a, b) => a.instance.localeCompare(b.instance)),
    };
    writeFileSync(lockFile, JSON.stringify(lock, null, 2) + "\n");
    return { plan, lockFile, excluded };
  } finally {
    for (const t of trees.values()) t.close();
  }
}

// ── Checking (no network) ────────────────────────────────────────────────────

export interface CheckResult {
  state: "not-enabled" | "mounted" | "missing" | "could-not-determine";
  reason: string;
  outcomes: InstanceOutcome[];
}

/**
 * Disk against lock against declaration, with no fetch. The declaration's pins
 * must be the lock's; every locked directory must be on disk and hash to its
 * digest; every locked declaration must be byte-identical.
 */
export function checkRemote(opts: { instanceRoot?: string } = {}): CheckResult {
  let ds: ReturnType<typeof downstreamOf>;
  try {
    ds = downstreamOf(opts);
  } catch (e) {
    return { state: "could-not-determine", reason: `could not read the declaration: ${(e as Error).message}`, outcomes: [] };
  }
  if (ds.mounts.length === 0) return { state: "not-enabled", reason: "no `remoteMounts` declared; nothing to check", outcomes: [] };
  const lockFile = join(ds.instanceRoot, mountLockFilename(ds.name));
  const r = readMountLock(lockFile);
  if (!r.ok) {
    return r.absent
      ? { state: "missing", reason: `\`remoteMounts\` declared and no lock at ${mountLockFilename(ds.name)} — run \`bun run mount:remote\``, outcomes: [] }
      : { state: "could-not-determine", reason: r.why, outcomes: [] };
  }
  const want = JSON.stringify(ds.mounts.map((m) => [m.harness, m.repository, m.ref]).sort());
  const have = JSON.stringify(r.lock.mounts.map((m) => [m.harness, m.repository, m.ref]).sort());
  if (want !== have) {
    return { state: "missing", reason: "the lock was written for different pins than the declaration names — run `bun run mount:remote`", outcomes: [] };
  }
  // What the mount reached and did not lay down is carried in the lock, so
  // "the lock lists nothing wrong" is never mistaken for "nothing was wrong".
  const outcomes: InstanceOutcome[] = r.lock.unmounted.map((u) => ({ instance: u.instance, state: u.state, detail: u.detail }) as InstanceOutcome);
  for (const inst of r.lock.instances) {
    try {
      const decl = join(ds.instanceRoot, inst.path, inst.declaration.file);
      if (!existsSync(decl)) {
        outcomes.push({ instance: inst.instance, state: "missing", path: inst.path, detail: `${inst.path}/${inst.declaration.file} is not on disk` });
        continue;
      }
      if (sha256Text(readFileSync(decl)) !== inst.declaration.sha256) {
        outcomes.push({ instance: inst.instance, state: "missing", path: inst.path, detail: `${inst.path}/${inst.declaration.file} does not hash to the lock` });
        continue;
      }
      const bad: string[] = [];
      for (const d of inst.directories) {
        const abs = join(ds.instanceRoot, d.path);
        if (!existsSync(abs)) bad.push(`${d.path}/ absent`);
        else if (digestOf(abs).treeDigest !== d.treeDigest) bad.push(`${d.path}/ modified`);
      }
      if (inst.undeclared) {
        const at = join(ds.instanceRoot, inst.path);
        if (undeclaredDigestOf(at, inst.undeclared.excludes, inst.declaration.file).treeDigest !== inst.undeclared.treeDigest) {
          bad.push(`${inst.path}/ outside its declared directories modified`);
        }
      }
      outcomes.push(
        bad.length
          ? { instance: inst.instance, state: "missing", path: inst.path, detail: `the pinned bytes are not on disk: ${bad.join("; ")}` }
          : { instance: inst.instance, state: "mounted", path: inst.path, detail: `${inst.repository}@${inst.sha.slice(0, 12)}, ${inst.directories.length} director${inst.directories.length === 1 ? "y" : "ies"} verified` },
      );
    } catch (e) {
      outcomes.push({ instance: inst.instance, state: "could-not-determine", path: inst.path, detail: `could not read: ${(e as Error).message}` });
    }
  }
  return { ...summarise(outcomes), outcomes };
}

/** The aggregate: could-not-determine outranks missing, which outranks mounted. */
export function summarise(outcomes: InstanceOutcome[]): { state: CheckResult["state"]; reason: string } {
  const by = (s: InstanceOutcome["state"]): InstanceOutcome[] => outcomes.filter((o) => o.state === s);
  const cnd = by("could-not-determine");
  const missing = by("missing");
  if (cnd.length) return { state: "could-not-determine", reason: `${cnd.length} instance(s) could not be determined: ${cnd.map((o) => o.instance).join(", ")} — never a pass` };
  if (missing.length) return { state: "missing", reason: `${missing.length} instance(s) missing: ${missing.map((o) => o.instance).join(", ")}` };
  return { state: "mounted", reason: `${by("mounted").length} instance(s) mounted${by("local").length ? `, ${by("local").length} held locally` : ""}` };
}

export function exitCode(state: CheckResult["state"]): number {
  return state === "could-not-determine" ? 2 : state === "missing" ? 1 : 0;
}

export function reportOutcomes(title: string, state: CheckResult["state"], reason: string, outcomes: InstanceOutcome[]): string {
  const L = [`## ${title}`, ""];
  if (state === "not-enabled") return [...L, `Not enabled — ${reason}.`].join("\n");
  L.push(state === "mounted" ? `✅ ${reason}.` : `🛑 **${state.toUpperCase()}** — ${reason}. A layer that is not mounted is absent from every overlay; do not read its absence as "nothing there".`, "");
  if (outcomes.length) {
    L.push("| instance | state | path | detail |", "|---|---|---|---|");
    for (const o of outcomes) L.push(`| \`${o.instance}\` | ${o.state} | ${"path" in o && o.path ? `\`${o.path}\`` : "—"} | ${o.detail} |`);
  }
  return L.join("\n");
}

// ── Every declaring instance in a checkout (the session-start fan-out) ───────

/** The instances in `checkout` that declare `remoteMounts`. An unreadable declaration is reported, not skipped. */
export function declaringInstances(checkout: string): { roots: string[]; unreadable: Array<{ root: string; why: string }> } {
  const roots: string[] = [];
  const unreadable: Array<{ root: string; why: string }> = [];
  for (const root of instanceRootsIn(checkout)) {
    try {
      if ((readDeclaration(root)?.remoteMounts ?? []).length > 0) roots.push(root);
    } catch (e) {
      unreadable.push({ root, why: (e as Error).message.split("\n")[0]! });
    }
  }
  return { roots, unreadable };
}

/**
 * Mount (or, with `check`, verify) every declaring instance in `checkout` —
 * what `state:mount` and the session-start hook call. An instance whose
 * declaration cannot be read is could-not-determine for the whole fan-out:
 * it may be the one that declares mounts.
 */
export function remoteFanOut(checkout: string, opts: { check?: boolean; urlFor?: UrlFor } = {}): { state: CheckResult["state"]; text: string } {
  const { roots, unreadable } = declaringInstances(checkout);
  const parts: string[] = [];
  const states: CheckResult["state"][] = [];
  for (const u of unreadable) {
    states.push("could-not-determine");
    parts.push(`## Remote mounts\n\n🛑 **could-not-determine** — ${u.root}'s declaration is unreadable (${u.why}); it may declare mounts.`);
  }
  for (const root of roots) {
    if (opts.check) {
      const r = checkRemote({ instanceRoot: root });
      states.push(r.state);
      parts.push(reportOutcomes(`Remote mounts — ${root}`, r.state, r.reason, r.outcomes));
    } else {
      const r = mountRemote({ instanceRoot: root, urlFor: opts.urlFor });
      const sum = summarise(r.plan.outcomes);
      states.push(sum.state);
      parts.push(reportOutcomes(`Remote mounts — ${root}`, sum.state, sum.reason, r.plan.outcomes));
      if (r.excluded.length) parts.push(`Added to this worktree's info/exclude (not committed): ${r.excluded.map((p) => `\`${p}/\``).join(", ")}.`);
    }
  }
  if (states.length === 0) return { state: "not-enabled", text: "## Remote mounts\n\nNot enabled — no instance in this checkout declares `remoteMounts`." };
  const state = states.includes("could-not-determine") ? "could-not-determine" : states.includes("missing") ? "missing" : "mounted";
  return { state, text: parts.join("\n\n") };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf("--instance");
  if (at === -1) {
    const r = remoteFanOut(checkoutRootFor(process.cwd()), { check: argv.includes("--check") });
    console.log(r.text);
    process.exit(exitCode(r.state));
  }
  const instanceRoot = resolve(argv[at + 1]!);
  if (argv.includes("--check")) {
    const r = checkRemote({ instanceRoot });
    console.log(argv.includes("--json") ? JSON.stringify(r, null, 2) : reportOutcomes("Remote mounts — check", r.state, r.reason, r.outcomes));
    process.exit(exitCode(r.state));
  }
  if (argv.includes("--plan")) {
    const p = planRemote({ instanceRoot });
    console.log(JSON.stringify({ instances: p.instances, outcomes: p.outcomes }, null, 2));
    process.exit(exitCode(p.mounts.length ? summarise(p.outcomes).state : "not-enabled"));
  }
  const r = mountRemote({ instanceRoot });
  const state = r.plan.mounts.length ? summarise(r.plan.outcomes).state : "not-enabled";
  console.log(reportOutcomes("Remote mounts", state, state === "not-enabled" ? "no `remoteMounts` declared" : summarise(r.plan.outcomes).reason, r.plan.outcomes));
  if (r.excluded.length) console.log(`\nAdded to this worktree's info/exclude (not committed): ${r.excluded.map((p) => `\`${p}/\``).join(", ")}.`);
  process.exit(exitCode(state));
}
