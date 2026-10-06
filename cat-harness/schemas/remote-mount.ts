/**
 * REMOTE MOUNTS — a harness, and its dependency closure, read from another
 * repository at a pinned commit and laid down as declared directories.
 *
 * @module schemas/remote-mount
 * @graphNode schema
 *
 * Bean `0mpw`, under the KG-subscriptions epic `fnx4` and the separation arc
 * `7x5n`. The owner's rulings, 2026-10-06:
 *
 * - **no git submodules, ever**, and **no `.deps/`** — a dot directory collides
 *   with GitHub's conventions and with this repository's own dot-prefix guard;
 * - a remote mount is a **declared directory with a remote source**, pinned to
 *   a full 40-character SHA (`SubgraphSource` → `kind: "remote"`);
 * - the **defaults live in the harness's own declaration** — which of its
 *   directories a downstream mounts, and where — so a downstream names only
 *   the harness and its pin ({@link MountDefaultsSchema});
 * - a downstream **may override** those defaults, matched on **id** (the
 *   instance's name, then a directory's id), never on path
 *   ({@link MountOverrideSchema});
 * - mounts are resolved **transitively** across the dependency closure;
 * - code arrives through the mounted code directories, so imports resolve
 *   through mounted paths.
 *
 * ## Why the default path is the harness's HOME path
 *
 * A mounted instance lands, by default, at the path it has in its own
 * repository (`livesAt.path`), relative to the DOWNSTREAM instance's root —
 * where its lock sits, and for a folio repository the checkout root. Two things then hold with no further machinery:
 * `instanceRootsIn` — which scans a checkout one level deep — finds every
 * mounted sibling, so `needs` resolves exactly as it does in the monorepo; and
 * a relative import from one mounted instance into another
 * (`../../cat-harness/schemas/…`) finds the file it names, because the
 * instances keep their relative layout. Moving one instance by override is
 * allowed, and the lock records where it went, but it is the override that
 * takes responsibility for imports that climb out of it.
 *
 * ## What the lock is, and why it is not the declaration
 *
 * The declaration says WHAT is mounted (a harness and a pin). The lock
 * ({@link MountLockSchema}) says what the closure RESOLVED to at that pin —
 * every instance reached, the commit each was read at (a gitlink in the tree
 * pins a dependency in another repository), and each directory's tree digest.
 * The check compares the disk against the lock, and the lock's pins against the
 * declaration, so "mounted", "missing" and "could not determine" are three
 * answers and never one.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { z } from "zod";

import { RepoFullNameSchema } from "./repo-full-name.js";

/** An instance name — the same rule `cat-harness.ts` applies to `needs` and subscriptions. */
const InstanceNameSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "an instance name: lowercase, digits and dashes");

/** A full commit SHA. A branch moves under the reader; an abbreviated SHA is ambiguous. */
export const CommitShaSchema = z.string().regex(/^[0-9a-f]{40}$/, "a full 40-character commit SHA — pin, never follow a branch");

/**
 * A mount path in the downstream checkout: repository-relative, POSIX, no
 * dot-prefixed segment (the directory-conventions guard), no `..`, and never
 * the checkout root itself — a mount that landed at the root would mix
 * somebody else's read-only bytes with the downstream's own files.
 */
export const MountPathSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-][A-Za-z0-9._-]*(?:\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*\/?$/, "a repository-relative directory with no dot-prefixed segment")
  .refine((p) => !p.split("/").includes(".."), "a mount path may not climb with `..`");

/**
 * HARNESS SIDE — what a downstream mounts of THIS instance unless it says
 * otherwise. Declared once, by the harness, on its own `<name>.json`.
 *
 * Both fields optional, and each absence has a stated meaning rather than a
 * hidden one: `path` absent is the instance's home path (`livesAt.path`, else
 * its directory in its own repository); `directories` absent is every declared
 * directory whose content is in the checkout (`source` absent or `directory`)
 * — a branch-kept or remote-kept subgraph is somebody's state, not part of
 * the harness a downstream reads.
 */
export const MountDefaultsSchema = z
  .object({
    path: MountPathSchema.optional(),
    /** Directory ids, in this instance's own declaration. */
    directories: z
      .array(z.string().min(1))
      .refine((xs) => new Set(xs).size === xs.length, { message: "mountDefaults.directories: an id appears twice" })
      .optional(),
  })
  .strict();
export type MountDefaults = z.infer<typeof MountDefaultsSchema>;

/**
 * DOWNSTREAM SIDE — an override of ONE instance's defaults in the closure,
 * keyed (in {@link RemoteMountSchema}.overrides) by that instance's name.
 *
 * `directories` REPLACES the default list (an id the instance does not declare
 * is refused at plan time, not dropped). `skip: true` leaves the instance
 * unmounted — the downstream supplies it some other way, and the plan says so
 * rather than reporting it missing.
 *
 * `undeclared: true` ALSO lays down everything under the instance's root that
 * no declared directory claims — its root files (`platform.ts`, `AGENTS.md`,
 * a tool's config) and its undeclared subdirectories (`schemas/`, `scripts/`).
 * A declared directory left out of `directories` stays out. It exists for an
 * instance that predates `mountDefaults` and keeps its code beside its
 * declared graphs rather than in them — the smart-* forks (bean `hupw`): their
 * mounted `tools/` imports `../platform.js`, which no declared directory
 * holds, so a directory-only mount is a layer whose code cannot load. Opt-in,
 * so a harness that declares its code directories is mounted exactly as it
 * says. The lock records the rest as ONE digest
 * ({@link LockedInstanceSchema}.undeclared), checked like a directory's.
 */
export const MountOverrideSchema = z
  .object({
    path: MountPathSchema.optional(),
    directories: z
      .array(z.string().min(1))
      .refine((xs) => new Set(xs).size === xs.length, { message: "override directories: an id appears twice" })
      .optional(),
    undeclared: z.literal(true).optional(),
    skip: z.literal(true).optional(),
  })
  .strict();
export type MountOverride = z.infer<typeof MountOverrideSchema>;

/**
 * One remote mount a downstream declares: a harness, the repository it lives
 * in and the pin. Everything else — which directories, where, and which other
 * instances its closure brings — comes from the harness's own declaration at
 * that pin.
 */
export const RemoteMountSchema = z
  .object({
    /** The harness's instance name, as its own declaration states it. */
    harness: InstanceNameSchema,
    repository: RepoFullNameSchema,
    ref: CommitShaSchema,
    /** Per-instance overrides across the closure, keyed by instance name. */
    overrides: z.record(InstanceNameSchema, MountOverrideSchema).optional(),
    note: z.string().min(1).optional(),
  })
  .strict();
export type RemoteMount = z.infer<typeof RemoteMountSchema>;

export const RemoteMountsSchema = z
  .array(RemoteMountSchema)
  .refine((xs) => new Set(xs.map((x) => x.harness)).size === xs.length, { message: "remoteMounts: a harness appears twice" });

// ── The lock ─────────────────────────────────────────────────────────────────

export const MOUNT_LOCK_SCHEMA = "cat-harness-mount-lock/v1";

/** The lock's filename, beside the downstream's declaration: `<name>.mount-lock.json`. */
export function mountLockFilename(instance: string): string {
  return `${instance}.mount-lock.json`;
}

export const LockedDirectorySchema = z
  .object({
    id: z.string().min(1),
    /** Relative to the downstream instance's root, no trailing slash. */
    path: z.string().min(1),
    /** Where the bytes are in the upstream repository. */
    upstreamPath: z.string().min(1),
    /** SHA-256 over the sorted `<sha256>  <file>` listing — `treeDigest`. */
    treeDigest: z.string().regex(/^[0-9a-f]{64}$/),
    files: z.number().int().nonnegative(),
  })
  .strict();

export const LockedInstanceSchema = z
  .object({
    instance: InstanceNameSchema,
    repository: z.string().min(1),
    sha: CommitShaSchema,
    /** The instance's root in the upstream repository; `""` is that repository's root. */
    upstreamRoot: z.string(),
    /** Where its root landed downstream. */
    path: z.string().min(1),
    /** The `remoteMounts` entry that brought it in. */
    via: InstanceNameSchema,
    /** How the pin was found: the declared ref, the same tree, or a gitlink in a parent's tree. */
    pinnedBy: z.enum(["declared", "same-tree", "gitlink"]),
    declaration: z.object({ file: z.string().min(1), sha256: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    directories: z.array(LockedDirectorySchema),
    /**
     * With an `undeclared: true` override: what was laid down OUTSIDE every
     * declared directory and the declaration file — one tree digest over it,
     * and the declared paths (instance-relative, no trailing slash) the digest
     * leaves out, so the check walks exactly what the mount wrote.
     */
    undeclared: z
      .object({
        treeDigest: z.string().regex(/^[0-9a-f]{64}$/),
        files: z.number().int().nonnegative(),
        excludes: z.array(z.string().min(1)),
      })
      .strict()
      .optional(),
  })
  .strict();
export type LockedInstance = z.infer<typeof LockedInstanceSchema>;

export const MountLockSchema = z
  .object({
    $schema: z.literal(MOUNT_LOCK_SCHEMA),
    /** The `remoteMounts` it was written for, so a changed pin reads as stale. */
    mounts: z.array(z.object({ harness: InstanceNameSchema, repository: z.string().min(1), ref: CommitShaSchema }).strict()),
    instances: z.array(LockedInstanceSchema),
    /**
     * What the closure reached and did NOT mount, with why — so the check,
     * which reads the lock and never the network, cannot report clean over an
     * instance the mount never laid down. `local` and `skipped` are recorded
     * too: they are answers, and a reader should see them as such.
     */
    unmounted: z
      .array(
        z
          .object({
            instance: InstanceNameSchema,
            state: z.enum(["local", "skipped", "missing", "could-not-determine"]),
            detail: z.string(),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();
export type MountLock = z.infer<typeof MountLockSchema>;

// ── Reading the lock (the overlay's half) ────────────────────────────────────

/**
 * Every mounted instance the locks in `scope` record, as `name → absolute root`.
 *
 * `scope` is the DOWNSTREAM instance's root: the lock sits beside its
 * declaration, and every mount path in it is relative to that root. The
 * overlay asks this rather than guessing a directory: `resolveDependencyPath`
 * used to fall back to `.deps/<name>/`, which the owner ruled out
 * (2026-10-06). A mount at its default (home) path is ALSO found by
 * `instanceRootsIn`'s one-level scan; this is what finds one an override
 * moved deeper.
 *
 * A lock that cannot be parsed contributes nothing HERE — the overlay is not
 * where that is diagnosed — and `mount:remote:check` reports it as
 * could-not-determine, so it cannot pass unnoticed.
 */
export function mountedInstanceRoots(scope: string): Map<string, string> {
  const out = new Map<string, string>();
  const dir = resolve(scope);
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => n.endsWith(".mount-lock.json")).sort();
  } catch {
    return out;
  }
  for (const n of names) {
    const lock = readMountLock(join(dir, n));
    if (!lock.ok) continue;
    for (const inst of lock.lock.instances) {
      const abs = join(dir, inst.path);
      if (!out.has(inst.instance) && existsSync(abs)) out.set(inst.instance, abs);
    }
  }
  return out;
}

/**
 * The scope a MOUNTED instance's siblings are found in: the nearest ancestor
 * holding a lock that put `instanceRoot` where it is. `undefined` for an
 * instance no mount placed. Bounded, and reads only lock files.
 */
export function mountScopeFor(instanceRoot: string): string | undefined {
  const abs = resolve(instanceRoot);
  let dir = dirname(abs);
  for (let i = 0; i < 8; i++) {
    for (const root of mountedInstanceRoots(dir).values()) if (root === abs) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return undefined;
}

/** Parse a lock file: absent, unreadable and malformed are three different answers. */
export function readMountLock(file: string): { ok: true; lock: MountLock } | { ok: false; absent: boolean; why: string } {
  if (!existsSync(file)) return { ok: false, absent: true, why: `${file} does not exist` };
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    return { ok: false, absent: false, why: `${file} is not JSON: ${(e as Error).message}` };
  }
  const p = MountLockSchema.safeParse(raw);
  if (!p.success) return { ok: false, absent: false, why: `${file} is not a ${MOUNT_LOCK_SCHEMA} lock: ${p.error.issues[0]?.message ?? "invalid"}` };
  return { ok: true, lock: p.data };
}
