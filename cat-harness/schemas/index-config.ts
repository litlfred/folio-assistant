/**
 * `index.config.json` — the instantiation root's INDEX (`folio-index-config/v1`).
 *
 * @module schemas/index-config
 * @graphNode schema
 *
 * The owner's decision, 2026-10-07: *"migration to index.config.json importing
 * <harness>.config.json information as needed"*, then the same day *"go ahead
 * and start the migration NOW to index.config.json"*. Proposal:
 * `cat-harness/docs/proposals/index-config.md`.
 *
 * ## The question it answers, and who answered it before
 *
 * A checkout that instantiates several harnesses has ONE `<base>/index.html`.
 * Until this file, "which harnesses are instantiated" was inferred from every
 * root `*.config.json` (five scripts re-implemented that scan, one without the
 * legacy exclusion), "which one lands at `/`" was a `site.landing` flag spread
 * across those files, and "where does each come from" was a third place again:
 * `remoteMounts` on the root DECLARATION. Three facts about one checkout's
 * instantiation, in N+1 files, with no file that could be read as the answer.
 *
 * The index is that file. When it exists at the root it is AUTHORITATIVE:
 *
 * | question | answered by |
 * |---|---|
 * | which harnesses are instantiated | `instances[].name` |
 * | where each one comes from | `instances[].source` — `local.at`, or `remote` (a `remoteMounts` entry without its `harness`) |
 * | each one's configuration | the imported `<name>.config.json` (when it exists), overlaid by the entry's inline fields |
 * | which one is `/` | `site.landing` — an instance name, or `"hub"` |
 *
 * Without it every reader falls back to today's behaviour unchanged, which is
 * what a folio that has not migrated must get.
 *
 * ## `index` is reserved
 *
 * The file ends in `.config.json`, so a scan reading "each root `*.config.json`
 * is a harness" would read a harness called `index`. `rootConfigStems` in
 * `instance-roots.ts` is the one scan and excludes it, and {@link IndexInstanceSchema}
 * refuses an instance of that name.
 *
 * ## The mount lock stays separate, and keeps its name
 *
 * `<root-instance>.mount-lock.json` is GENERATED from the declared mounts and
 * read by filename in a dozen places (`mount-from-lock.ts`, which runs first in
 * ~32 workflows, `mountedInstanceRoots`, `git-corpus.ts`, workflow `paths:`
 * filters, `.gitignore`). Moving the DECLARATION does not move the lock: the
 * lock records what a declaration resolved to, wherever the declaration lives.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { z } from "zod";

import { readDeclaration } from "./cat-harness";
import {
  CONFIG_SUFFIX,
  INDEX_CONFIG_FILENAME,
  RESERVED_INSTANCE_NAMES,
  findDeclarationFile,
  instanceRootsIn,
  rootConfigStems,
} from "./instance-roots";
import { RemoteMountSchema, RemoteMountsSchema, type RemoteMount } from "./remote-mount";

export { INDEX_CONFIG_FILENAME };

export const INDEX_CONFIG_SCHEMA = "folio-index-config/v1";

/** The landing value that asks for the neutral hub rather than one harness. */
export const HUB_LANDING = "hub";

/** An instance name — the rule `cat-harness.ts` and `remote-mount.ts` apply — minus the reserved names. */
const IndexInstanceNameSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "an instance name: lowercase, digits and dashes")
  .refine((n) => !RESERVED_INSTANCE_NAMES.includes(n), {
    message: `reserved: \`${RESERVED_INSTANCE_NAMES.join("`, `")}\` names a file the platform owns (\`${INDEX_CONFIG_FILENAME}\`), never a harness`,
  });

/**
 * Where a LOCAL instance's root is, relative to the index: `.` for the
 * instance declared at the root itself. No dot-prefixed segment, no `..`.
 */
const LocalAtSchema = z
  .string()
  .regex(/^(?:\.|[A-Za-z0-9_-][A-Za-z0-9._-]*(?:\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*\/?)$/, "`.` or a repository-relative directory with no dot-prefixed segment")
  .refine((p) => !p.split("/").includes(".."), "may not climb with `..`");

/**
 * A REMOTE source: a `remoteMounts` entry minus its `harness`, which is the
 * instance's `name`. REUSED, not restated — `ref` (the 40-character pin),
 * `overrides` (where `whole` and `path` live, per instance of the closure),
 * `note` and `trust` are {@link RemoteMountSchema}'s own fields, so a field a
 * later PR adds there (`track`, #2468) arrives here with no edit.
 */
export const RemoteSourceSchema = RemoteMountSchema.omit({ harness: true });
export type RemoteSource = z.infer<typeof RemoteSourceSchema>;

export const InstanceSourceSchema = z.union([
  z.object({ local: z.object({ at: LocalAtSchema }).strict() }).strict(),
  z.object({ remote: RemoteSourceSchema }).strict(),
]);
export type InstanceSource = z.infer<typeof InstanceSourceSchema>;

/**
 * One instantiated harness.
 *
 * - `source` absent is LOCAL at `<name>/`;
 * - `import` absent imports `<name>.config.json` when it exists — a harness
 *   need not have one;
 * - every OTHER key is an inline `HarnessConfig` field, overriding the
 *   imported one (`effectiveInstanceConfig` in `harness-config.ts` merges and
 *   validates). Passthrough rather than a nested object because that is the
 *   shape the owner asked for, and because `HarnessConfig` files already carry
 *   fields the schema does not list.
 */
export const IndexInstanceSchema = z
  .object({
    name: IndexInstanceNameSchema,
    import: z.string().refine((f) => f.endsWith(CONFIG_SUFFIX) && !f.includes("/") && f !== INDEX_CONFIG_FILENAME, `a root \`<name>${CONFIG_SUFFIX}\` other than ${INDEX_CONFIG_FILENAME}`).optional(),
    source: InstanceSourceSchema.optional(),
    _comment: z.string().optional(),
  })
  .passthrough();
export type IndexInstance = z.infer<typeof IndexInstanceSchema>;

export const IndexSiteSchema = z
  .object({
    /** An instance name, or {@link HUB_LANDING}. Must name an instance this file lists. */
    landing: z.string().min(1).optional(),
  })
  .strict();

export const IndexConfigSchema = z
  .object({
    $schema: z.literal(INDEX_CONFIG_SCHEMA),
    _comment: z.string().optional(),
    instances: z
      .array(IndexInstanceSchema)
      .refine((xs) => new Set(xs.map((x) => x.name)).size === xs.length, { message: "instances: a name appears twice" })
      .refine((xs) => !xs.some((x) => x.name === HUB_LANDING), { message: `instances: \`${HUB_LANDING}\` is the landing keyword, not an instance name` }),
    site: IndexSiteSchema.optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    const l = c.site?.landing;
    if (l !== undefined && l !== HUB_LANDING && !c.instances.some((i) => i.name === l)) {
      ctx.addIssue({
        code: "custom",
        path: ["site", "landing"],
        message: `site.landing names \`${l}\`, which is not an instance this file lists (${c.instances.map((i) => i.name).join(", ") || "none"})`,
      });
    }
  });
export type IndexConfig = z.infer<typeof IndexConfigSchema>;

/** The inline `HarnessConfig` overrides an entry carries — every key but the index's own. */
export function inlineOverrides(entry: IndexInstance): Record<string, unknown> {
  const { name: _n, import: _i, source: _s, _comment: _c, ...rest } = entry as Record<string, unknown>;
  return rest;
}

/** The file an entry imports: its `import`, else `<name>.config.json`. Existence is the caller's question. */
export function importedConfigFilename(entry: IndexInstance): string {
  return entry.import ?? `${entry.name}${CONFIG_SUFFIX}`;
}

export type IndexConfigRead =
  | { state: "absent"; file: string }
  | { state: "ok"; file: string; config: IndexConfig }
  | { state: "unreadable"; file: string; why: string };

/**
 * Read `root/index.config.json`. ABSENT, UNREADABLE and OK are three answers:
 * an index that will not parse is never "no index", because the fallback it
 * would select is exactly what the file was written to override.
 */
export function readIndexConfig(root: string): IndexConfigRead {
  const file = join(root, INDEX_CONFIG_FILENAME);
  if (!existsSync(file)) return { state: "absent", file };
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    return { state: "unreadable", file, why: `not JSON: ${(e as Error).message}` };
  }
  const p = IndexConfigSchema.safeParse(raw);
  if (!p.success) {
    const i = p.error.issues[0];
    return { state: "unreadable", file, why: `not a ${INDEX_CONFIG_SCHEMA} index: ${i ? `${i.path.join(".") || "(root)"}: ${i.message}` : "invalid"}` };
  }
  return { state: "ok", file, config: p.data };
}

/** {@link readIndexConfig}, throwing on UNREADABLE — for callers with no third state to report. */
export function requireIndexConfig(root: string): IndexConfig | undefined {
  const r = readIndexConfig(root);
  if (r.state === "unreadable") throw new Error(`${r.file} is ${r.why}`);
  return r.state === "ok" ? r.config : undefined;
}

// ── Declared mounts: ONE read path, ONE write path ──────────────────────────

/** A remote instance entry as the `RemoteMount` the mount tooling consumes. */
export function remoteMountOf(entry: IndexInstance): RemoteMount | undefined {
  const src = entry.source;
  if (src === undefined || !("remote" in src)) return undefined;
  return { harness: entry.name, ...src.remote } as RemoteMount;
}

export interface DeclaredMounts {
  /** Where they were read from: the index, the declaration's `remoteMounts` (no index), or nowhere. */
  from: "index" | "declaration" | "none";
  /** The file read; absent for `none`. */
  file?: string;
  mounts: RemoteMount[];
}

/**
 * The remote mounts declared for the instance at `instanceRoot`.
 *
 * - `index.config.json` at `instanceRoot` present: its `source.remote`
 *   entries, and the declaration's `remoteMounts` MUST be empty — both
 *   carrying mounts THROWS, naming both files, because picking one would make
 *   the other a silent dead letter (a pin someone edited and nothing read).
 * - absent: the declaration's `remoteMounts`, exactly as before. A folio that
 *   has not migrated keeps working.
 *
 * Throws on an UNREADABLE index, never falls back past it.
 */
export function readDeclaredMounts(instanceRoot: string): DeclaredMounts {
  const idx = readIndexConfig(instanceRoot);
  if (idx.state === "unreadable") throw new Error(`${idx.file} is ${idx.why}`);
  const declFile = findDeclarationFile(instanceRoot);
  const declMounts = readDeclaration(instanceRoot)?.remoteMounts ?? [];
  if (idx.state === "absent") {
    return declMounts.length > 0 ? { from: "declaration", file: join(instanceRoot, declFile!), mounts: declMounts } : { from: "none", mounts: [] };
  }
  const mounts = idx.config.instances.map(remoteMountOf).filter((m): m is RemoteMount => m !== undefined);
  if (declMounts.length > 0) {
    const both = declMounts.map((m) => m.harness).filter((h) => mounts.some((x) => x.harness === h));
    throw new Error(
      `remote mounts are declared in BOTH ${idx.file} and ${join(instanceRoot, declFile!)} \`remoteMounts\`` +
        (both.length ? ` (both declare ${both.join(", ")})` : ` (declaration: ${declMounts.map((m) => m.harness).join(", ")})`) +
        `. ${INDEX_CONFIG_FILENAME} is authoritative once it exists; move the declaration's entries with \`bun run cat index-config:migrate --write\`.`,
    );
  }
  return { from: "index", file: idx.file, mounts };
}

/**
 * Replace the remote mounts declared for the instance at `instanceRoot` —
 * THE write path. Every tool that writes mounts calls this; none writes
 * `remoteMounts` on a declaration any more.
 *
 * Writes `index.config.json`, seeding it with {@link buildIndexConfig} first
 * when the checkout has none (so the index it creates lists what the checkout
 * already instantiates, rather than instantiating only the mounts). Refuses
 * while the declaration still carries `remoteMounts`: that is the both-places
 * state {@link readDeclaredMounts} throws on, and writing would create it.
 *
 * A mount that is dropped loses its `source`; its entry stays when it still
 * says something (an import that exists, inline config), else it goes.
 */
export function writeDeclaredMounts(instanceRoot: string, mounts: readonly RemoteMount[]): { file: string; config: IndexConfig } {
  const parsed = RemoteMountsSchema.parse(mounts);
  const declMounts = readDeclaration(instanceRoot)?.remoteMounts ?? [];
  if (declMounts.length > 0) {
    throw new Error(
      `${join(instanceRoot, findDeclarationFile(instanceRoot)!)} still declares \`remoteMounts\` (${declMounts.map((m) => m.harness).join(", ")}); ` +
        "run `bun run cat index-config:migrate --write` first so the mounts have one home",
    );
  }
  const idx = readIndexConfig(instanceRoot);
  if (idx.state === "unreadable") throw new Error(`${idx.file} is ${idx.why}`);
  const config: IndexConfig = idx.state === "ok" ? structuredClone(idx.config) : buildIndexConfig(instanceRoot).config;

  const wanted = new Map(parsed.map((m) => [m.harness, m]));
  const out: IndexInstance[] = [];
  for (const entry of config.instances) {
    const m = wanted.get(entry.name);
    if (m !== undefined) {
      const { harness: _h, ...remote } = m;
      out.push({ ...entry, source: { remote } });
      wanted.delete(entry.name);
      continue;
    }
    if (entry.source !== undefined && "remote" in entry.source) {
      const { source: _s, ...rest } = entry;
      const saysSomething =
        rest.import !== undefined || Object.keys(inlineOverrides(rest as IndexInstance)).length > 0 || existsSync(join(instanceRoot, importedConfigFilename(rest as IndexInstance)));
      if (saysSomething) out.push(rest as IndexInstance);
      continue;
    }
    out.push(entry);
  }
  for (const m of wanted.values()) {
    const { harness, ...remote } = m;
    out.push({ name: harness, source: { remote } });
  }
  const next = IndexConfigSchema.parse({ ...config, instances: out });
  const file = join(instanceRoot, INDEX_CONFIG_FILENAME);
  writeFileSync(file, formatIndexConfig(next));
  return { file, config: next };
}

/** The canonical text of an index: two-space JSON, `$schema` first, a trailing newline. */
export function formatIndexConfig(config: IndexConfig): string {
  const { $schema, _comment, instances, site } = config;
  const ordered = {
    $schema,
    ...(_comment !== undefined ? { _comment } : {}),
    instances: instances.map((e) => {
      const { name, _comment: c, import: imp, source, ...rest } = e as IndexInstance & Record<string, unknown>;
      return { name, ...(c !== undefined ? { _comment: c } : {}), ...(imp !== undefined ? { import: imp } : {}), ...(source !== undefined ? { source } : {}), ...rest };
    }),
    ...(site !== undefined ? { site } : {}),
  };
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

// ── Building an index from what a checkout holds today (the migration) ──────

export type MigrationFinding =
  | { kind: "unmatched-config"; file: string; detail: string }
  | { kind: "landing-undetermined"; detail: string }
  | { kind: "unreadable-config"; file: string; detail: string };

export interface IndexMigration {
  config: IndexConfig;
  findings: MigrationFinding[];
  /** The declaration file whose `remoteMounts` moved into the index, when any did. */
  movedFrom?: string;
  /** The remote mounts moved, by harness. */
  moved: string[];
}

/**
 * The index a checkout's CURRENT files imply — and, when an index already
 * exists, that index with whatever the declaration has gained since merged in.
 *
 * Reads only `root`: its declaration (when it has one), the instances
 * declared one level down, and its root `*.config.json`. Nothing of
 * folio-assistant's own root, so it runs on a standalone checkout of a
 * separated harness as well as on this monorepo.
 *
 * A root config is IMPORTED only when its stem names an instance this
 * checkout declares (the root, or one level down) or mounts. Anything else is
 * a FINDING and is not imported — `smart-trust` and `smart-immunizations`
 * inherited a `smart-base.config.json` from the fork they were cut from, and
 * importing it would instantiate a harness the repository does not hold.
 *
 * A remote mount already in the index with the SAME source is dropped from
 * the declaration (a re-run); with a DIFFERENT one it THROWS, naming both.
 */
export function buildIndexConfig(root: string): IndexMigration {
  const findings: MigrationFinding[] = [];
  const idx = readIndexConfig(root);
  if (idx.state === "unreadable") throw new Error(`${idx.file} is ${idx.why}`);

  const declFile = findDeclarationFile(root);
  const decl = readDeclaration(root);
  const declMounts = decl?.remoteMounts ?? [];

  // Instances DECLARED in this checkout: the root's own, then one level down.
  const local = new Map<string, string>();
  for (const r of instanceRootsIn(root)) {
    try {
      const n = readDeclaration(r)?.name;
      if (n !== undefined && !local.has(n)) local.set(n, relative(root, r) || ".");
    } catch {
      // An unreadable declaration is `check:declaration-filename`'s finding;
      // here it means that directory cannot vouch for a config.
    }
  }

  const config: IndexConfig = idx.state === "ok" ? structuredClone(idx.config) : { $schema: INDEX_CONFIG_SCHEMA, instances: [] };
  const byName = new Map(config.instances.map((e) => [e.name, e]));

  // Remote mounts first: they decide which entries are remote.
  const moved: string[] = [];
  for (const m of declMounts) {
    const { harness, ...remote } = m;
    const have = byName.get(harness);
    const haveRemote = have?.source !== undefined && "remote" in have.source ? have.source.remote : undefined;
    if (haveRemote !== undefined) {
      if (JSON.stringify(sortKeys(haveRemote)) !== JSON.stringify(sortKeys(remote))) {
        throw new Error(
          `\`${harness}\` is declared remote in BOTH ${idx.file} and ${join(root, declFile!)} \`remoteMounts\`, with different sources — ` +
            "reconcile by hand; the migration will not pick one",
        );
      }
    } else if (have !== undefined) {
      have.source = { remote };
    } else {
      const e: IndexInstance = { name: harness, source: { remote } };
      config.instances.push(e);
      byName.set(harness, e);
    }
    moved.push(harness);
  }

  // The root's own instance is instantiated here whether or not it has a config.
  if (decl?.name !== undefined && !byName.has(decl.name)) {
    const e: IndexInstance = { name: decl.name, source: { local: { at: "." } } };
    config.instances.push(e);
    byName.set(decl.name, e);
  }

  for (const stem of rootConfigStems(root)) {
    if (byName.has(stem)) continue;
    const at = local.get(stem);
    if (at === undefined) {
      findings.push({
        kind: "unmatched-config",
        file: join(root, `${stem}${CONFIG_SUFFIX}`),
        detail: `\`${stem}${CONFIG_SUFFIX}\` names no instance this checkout declares${decl ? ` (its own is \`${decl.name}\`)` : ""} or mounts — NOT imported. If it was inherited from a fork, remove it; if the harness is wanted, declare or mount it and re-run.`,
      });
      continue;
    }
    const e: IndexInstance = at === stem ? { name: stem } : { name: stem, source: { local: { at } } };
    config.instances.push(e);
    byName.set(stem, e);
  }

  // Landing: kept when the index already says; else the one flagged config.
  if (config.site?.landing === undefined && config.instances.length > 1) {
    const flagged: string[] = [];
    for (const e of config.instances) {
      const f = join(root, importedConfigFilename(e));
      if (!existsSync(f)) continue;
      try {
        const site = (JSON.parse(readFileSync(f, "utf-8")) as { site?: { landing?: unknown } } | null)?.site;
        if (site?.landing === true) flagged.push(e.name);
      } catch (err) {
        findings.push({ kind: "unreadable-config", file: f, detail: (err as Error).message });
      }
    }
    if (flagged.length === 1) config.site = { ...(config.site ?? {}), landing: flagged[0]! };
    else if (flagged.length >= 2) config.site = { ...(config.site ?? {}), landing: HUB_LANDING };
    else findings.push({ kind: "landing-undetermined", detail: `${config.instances.length} instances and no config flags \`site.landing\` — set \`site.landing\` in ${INDEX_CONFIG_FILENAME} by hand` });
  }

  // A NEW index reads root first, then the local instances, then the mounts —
  // the order a reader expects. An existing index keeps the order it has.
  if (idx.state === "absent") {
    const rank = (e: IndexInstance): number => (e.name === decl?.name ? 0 : e.source !== undefined && "remote" in e.source ? 2 : 1);
    config.instances = config.instances.map((e, i) => ({ e, i })).sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i).map((x) => x.e);
  }

  return {
    config: IndexConfigSchema.parse(config),
    findings,
    moved,
    ...(moved.length > 0 && declFile !== undefined ? { movedFrom: join(root, declFile) } : {}),
  };
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v !== null && typeof v === "object") {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  }
  return v;
}
