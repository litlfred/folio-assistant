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
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { z } from "zod";

import { INDEX_LOCK_FILENAME, LEGACY_MOUNT_LOCK_SUFFIX, lockFilesIn } from "./instance-roots.js";
import { MountTrustSchema } from "./mount-trust.js";
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
    /**
     * Asset ids, in this instance's own `assets`: the single files a mount
     * carries besides its directories, each locked by sha256 (owner,
     * 2026-10-07, "Option A, by reference": a mounted instance's `package.json`
     * travels this way, so `bun run cat` can read its `checkoutScripts`).
     * Absent is every asset the instance declares at `instance` scope. A
     * `repository`-scoped asset belongs to the upstream repository, not the
     * instance, and is never mounted.
     */
    assets: z
      .array(z.string().min(1))
      .refine((xs) => new Set(xs).size === xs.length, { message: "mountDefaults.assets: an id appears twice" })
      .optional(),
    /**
     * Mount the WHOLE instance root — every tracked file at the pin, root
     * files included — instead of its declared directories. For an instance a
     * downstream reads as a checkout rather than as graphs: `bootstrap` (whose
     * `ns.jsonld` and README sit at its root) and `bootstrap-tools` (whose
     * `package.json` and `tsconfig.json` do), the two git submodules a remote
     * mount replaces (bean `nn8e`, #2462). Locked as one directory, id `*`.
     */
    whole: z.literal(true).optional(),
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
 */
export const MountOverrideSchema = z
  .object({
    path: MountPathSchema.optional(),
    directories: z
      .array(z.string().min(1))
      .refine((xs) => new Set(xs).size === xs.length, { message: "override directories: an id appears twice" })
      .optional(),
    /** REPLACES the default asset list, as `directories` does; an undeclared id is refused. */
    assets: z
      .array(z.string().min(1))
      .refine((xs) => new Set(xs).size === xs.length, { message: "override assets: an id appears twice" })
      .optional(),
    skip: z.literal(true).optional(),
    /** Overrides the harness's `mountDefaults.whole` either way; `directories` is then ignored. */
    whole: z.boolean().optional(),
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
    /**
     * The upstream branch this mount FOLLOWS for updates: the analogue of
     * `branch =` in `.gitmodules`. It never moves the pin: `ref` stays the one
     * commit mounted, and `bun run cat mount:update` reports how far `track`'s
     * tip is ahead and re-pins only on a person's recorded consent (owner,
     * 2026-10-07; skill `kg-core/pinned-remote-dependency`). Absent: nothing to
     * update from.
     */
    track: z
      .string()
      .regex(/^[A-Za-z0-9._/-]+$/, "a branch name")
      .refine((b) => !b.startsWith("-") && !b.split("/").some((s) => s === "" || s === "." || s === ".." || s.endsWith(".lock")), "a branch name")
      .optional(),
    /** Per-instance overrides across the closure, keyed by instance name. */
    overrides: z.record(InstanceNameSchema, MountOverrideSchema).optional(),
    note: z.string().min(1).optional(),
    /**
     * What makes this mount trusted: a person's consent for THIS pin, or a
     * signature in a declared trust network (`schemas/mount-trust.ts`, bean
     * `ieum`, rule H8). Absent means unsigned and unconsented, and a non-staging
     * mount is then refused rather than fetched.
     */
    trust: MountTrustSchema.optional(),
  })
  .strict();
export type RemoteMount = z.infer<typeof RemoteMountSchema>;

export const RemoteMountsSchema = z
  .array(RemoteMountSchema)
  .refine((xs) => new Set(xs.map((x) => x.harness)).size === xs.length, { message: "remoteMounts: a harness appears twice" });

// ── The lock ─────────────────────────────────────────────────────────────────

export const MOUNT_LOCK_SCHEMA = "cat-harness-mount-lock/v1";

/**
 * Why a planned mount was not laid down, when it was refused rather than
 * failed. The mount report and the `remote-mounts` health check read this
 * one value, so the two cannot disagree about why.
 *
 * - `not-identical`: the target existed with no lock, and adopting it was
 *   refused because its bytes are not the pin's (owner, 2026-10-07, "adopt if
 *   identical"). The differing and extra paths travel with it.
 * - `trust`: rule H8 (`schemas/mount-trust.ts`), neither signed nor consented.
 * - `tracked`: the target holds files this checkout tracks.
 * - `absent-at-pin`: a declared directory or asset is not in the pinned tree.
 */
export const MOUNT_REFUSALS = ["not-identical", "trust", "tracked", "absent-at-pin"] as const;
export type MountRefusal = (typeof MOUNT_REFUSALS)[number];

/**
 * The directory id a WHOLE-instance mount is locked under: one entry whose
 * `path` is the instance's mount path and whose `upstreamPath` is its root in
 * the upstream repository (`.` for that repository's root).
 */
export const WHOLE_INSTANCE_ID = "*";

/**
 * The lock's filename, beside the downstream's index: `index.lock.json` — the
 * generated companion to `index.config.json` (owner, 2026-10-07). It was
 * `<name>.mount-lock.json` until then; {@link legacyMountLockFilename} is that
 * name, READ during the transition and never written.
 *
 * The parameter stays so every existing call site reads as it did, and so a
 * caller still says WHOSE lock it means; the name no longer depends on it.
 */
export function mountLockFilename(_instance?: string): string {
  return INDEX_LOCK_FILENAME;
}

/** The retired per-instance lock name, `<name>.mount-lock.json`. */
export function legacyMountLockFilename(instance: string): string {
  return `${instance}${LEGACY_MOUNT_LOCK_SUFFIX}`;
}

/**
 * The lock a reader should open in `dir`: `index.lock.json`, else the
 * downstream's legacy `<name>.mount-lock.json`. Both present THROWS, naming
 * both — never a silent pick (see `lockFilesIn` in `instance-roots.ts`).
 * Returns the path to read even when it does not exist (the new name), so
 * "absent" is still `readMountLock`'s answer to give.
 */
export function mountLockPathFor(dir: string, instance: string): string {
  const { files, conflict } = lockFilesIn(dir);
  if (conflict !== undefined) throw new Error(conflict);
  if (files.includes(INDEX_LOCK_FILENAME)) return join(dir, INDEX_LOCK_FILENAME);
  const legacy = legacyMountLockFilename(instance);
  return files.includes(legacy) ? join(dir, legacy) : join(dir, INDEX_LOCK_FILENAME);
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

/**
 * One declared ASSET a mount carried: a single file, locked by its sha256.
 * The script table reads a mounted instance's `package.json` only through
 * one of these whose bytes still hash to it (`schemas/script-table.ts`).
 */
export const LockedAssetSchema = z
  .object({
    id: z.string().min(1),
    /** Relative to the downstream instance's root. */
    path: z.string().min(1),
    /** Where the file is in the upstream repository. */
    upstreamPath: z.string().min(1),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();
export type LockedAsset = z.infer<typeof LockedAssetSchema>;

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
    /** Absent in a lock written before assets were mounted, which reads as the empty list. */
    assets: z.array(LockedAssetSchema).default([]),
    /** The bytes were already on disk, identical to the pin, and the mount adopted them rather than writing them. */
    adopted: z.literal(true).optional(),
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
            /** Why a planned mount was not laid down; see {@link MOUNT_REFUSALS}. */
            refusal: z.enum(MOUNT_REFUSALS).optional(),
            /** For `not-identical`: paths whose bytes differ from the pin, or that the pin has and the disk lacks. */
            differing: z.array(z.string()).optional(),
            /** For `not-identical`: files under a declared directory that the pin does not have. */
            extra: z.array(z.string()).optional(),
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
  // `index.lock.json`, else the legacy `*.mount-lock.json`. Both present is
  // `mount:lock:check`'s finding to report; the overlay reads neither rather
  // than guess which one is true.
  const names = lockFilesIn(dir).files;
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

// ── A mounted instance's package.json (owner, 2026-10-07: "Option A, by reference") ──

/** The manifest a layer's checkout scripts live in, relative to its root. */
export const PACKAGE_MANIFEST = "package.json";

/**
 * What a mounted instance's `package.json` may be trusted for.
 *
 * - `verified`: the lock lists it as an asset and its bytes hash to the lock,
 *   so its `checkoutScripts` are that layer's scripts.
 * - `none`: the lock lists no such asset AND none is on disk. That is a
 *   determined absence: a mounted instance with no scripts is an answer.
 * - `unresolvable`: anything else. A `package.json` is on disk that no lock
 *   vouches for, or a locked one is gone or edited, or the lock itself cannot
 *   be read. Its scripts are neither read nor reported absent; a caller says
 *   it could not resolve them.
 */
export type MountedManifest =
  | { state: "verified"; instance: string; root: string; manifest: string }
  | { state: "none"; instance: string; root: string }
  | { state: "unresolvable"; instance?: string; root?: string; manifest: string; why: string };

/**
 * The lock's `treeDigest` of a directory: sha256 over the sorted
 * `<sha256>  <file>` listing, symbolic links skipped. Restated from
 * `scripts/kg-parts.ts` (as `scripts/mount-from-lock.ts` restates it) because
 * a schema module does not import a script; `remote-mount.test.ts` holds the
 * three to one answer.
 */
export function wholeDigest(dir: string): string {
  const files: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) files.push(relative(dir, p).split("\\").join("/"));
    }
  };
  walk(dir);
  files.sort();
  const listing = files.map((f) => `${createHash("sha256").update(readFileSync(join(dir, f))).digest("hex")}  ${f}\n`).join("");
  return createHash("sha256").update(listing).digest("hex");
}

/**
 * Every instance the locks in `scope` mounted, with what its `package.json`
 * may be trusted for. `scope` is a downstream instance's root, where its lock
 * sits. Reads lock files and hashes one file per instance; never the network.
 */
export function mountedManifests(scope: string): MountedManifest[] {
  const out: MountedManifest[] = [];
  const dir = resolve(scope);
  // `index.lock.json`, else the legacy `*.mount-lock.json`. Both present is
  // not a pick: neither is read, and the scope is unresolvable.
  const { files: names, conflict } = lockFilesIn(dir);
  if (conflict !== undefined) return [{ state: "unresolvable", manifest: dir, why: conflict }];
  for (const n of names) {
    const r = readMountLock(join(dir, n));
    if (!r.ok) {
      // Which instances it mounted is exactly what cannot be read, so the
      // lock itself is the unresolvable subject.
      out.push({ state: "unresolvable", manifest: join(dir, n), why: r.why });
      continue;
    }
    for (const inst of r.lock.instances) {
      const root = join(dir, inst.path);
      const want = `${inst.path.replace(/\/+$/, "")}/${PACKAGE_MANIFEST}`;
      const asset = inst.assets.find((a) => a.path.replace(/\/+$/, "") === want);
      const file = join(root, PACKAGE_MANIFEST);
      // A WHOLE-instance mount already carries the manifest inside its one
      // `*` directory, and that directory's digest vouches for every byte of
      // it. The asset path is for a mount of declared directories, which
      // would otherwise not carry the file at all.
      const whole = inst.directories.find((d) => d.id === WHOLE_INSTANCE_ID && d.path.replace(/\/+$/, "") === inst.path.replace(/\/+$/, ""));
      if (!asset && whole && existsSync(file)) {
        let digest: string;
        try {
          digest = wholeDigest(root);
        } catch (e) {
          out.push({ state: "unresolvable", instance: inst.instance, root, manifest: file, why: `${inst.path}/ could not be hashed: ${(e as Error).message}` });
          continue;
        }
        out.push(
          digest === whole.treeDigest
            ? { state: "verified", instance: inst.instance, root, manifest: file }
            : { state: "unresolvable", instance: inst.instance, root, manifest: file, why: `${inst.path}/ (a whole-instance mount) no longer hashes to the lock in ${n}: edited since it was mounted` },
        );
        continue;
      }
      if (!asset) {
        out.push(
          existsSync(file)
            ? { state: "unresolvable", instance: inst.instance, root, manifest: file, why: `${n} does not list ${want} as an asset, so nothing vouches for its bytes` }
            : { state: "none", instance: inst.instance, root },
        );
        continue;
      }
      if (!existsSync(file)) {
        out.push({ state: "unresolvable", instance: inst.instance, root, manifest: file, why: `${want} is locked as an asset in ${n} but is not on disk` });
        continue;
      }
      let sha: string;
      try {
        sha = createHash("sha256").update(readFileSync(file)).digest("hex");
      } catch (e) {
        out.push({ state: "unresolvable", instance: inst.instance, root, manifest: file, why: `${want} could not be read: ${(e as Error).message}` });
        continue;
      }
      out.push(
        sha === asset.sha256
          ? { state: "verified", instance: inst.instance, root, manifest: file }
          : { state: "unresolvable", instance: inst.instance, root, manifest: file, why: `${want} does not hash to the lock in ${n}: edited since it was mounted` },
      );
    }
  }
  return out;
}
