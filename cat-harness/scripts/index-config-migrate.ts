#!/usr/bin/env bun
/**
 * Convert a checkout to `index.config.json` (`folio-index-config/v1`).
 *
 * @module scripts/index-config-migrate
 * @graphNode none — a one-shot converter over a checkout's root files; the schema is `schemas/index-config.ts`
 *
 *   bun run cat index-config:migrate                 # print the index it would write, and its findings
 *   bun run cat index-config:migrate --write         # write it, move `remoteMounts` off the declaration,
 *                                                    # write the .gitignore block, rename the lock to index.lock.json
 *   bun run cat index-config:migrate --check         # exit 1 when --write would change anything
 *   bun run cat index-config:migrate --root <dir>    # any checkout — a separated harness's standalone clone too
 *   bun run cat index-config:migrate --write --prefer-declaration
 *                                                    # a remoteMounts entry that DIFFERS from the index's wins
 *                                                    # (a re-pin merged from main); without it, a difference throws
 *
 * The owner, 2026-10-07: *"go ahead and start the migration NOW to
 * index.config.json"*, and the converter is KEPT rather than run once,
 * because every separated repository (`smart-base`, `smart-trust`,
 * `smart-immunizations`, `who-iris`, `fhir-harness`, `folio-assistant-sci`,
 * `bootstrap`, `bootstrap-tools`) needs the same conversion, and this
 * repository's own `remoteMounts` keep gaining entries until the cutovers
 * stop. It reads only `--root`'s own files, so nothing of folio-assistant's
 * root is assumed.
 *
 * IDEMPOTENT: a re-run over an index that already exists merges what the
 * declaration has gained since (a cutover appending to `remoteMounts`), drops
 * an entry the index already holds identically, and THROWS on one it holds
 * differently — `buildIndexConfig` in the schema module says why.
 *
 * Findings — a root `<name>.config.json` naming no instance the checkout
 * declares or mounts (the `smart-base.config.json` a fork inherited), or a
 * landing nobody flagged — are printed and NOT imported. They do not fail the
 * run: the index is still correct without them, and the decision about the
 * stray file is a person's.
 *
 * Exit codes: 0 written / up to date / planned · 1 stale under `--check` · 2 could not convert.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { INDEX_LOCK_FILENAME, findDeclarationFile, lockFilesIn } from "../schemas/instance-roots.js";
import { INDEX_CONFIG_FILENAME, buildIndexConfig, formatIndexConfig, lockedMountPaths, withIgnoreBlock, type IndexMigration } from "../schemas/index-config.js";

export interface MigrateResult {
  migration: IndexMigration;
  /** The index text the conversion produces. */
  indexText: string;
  /** The declaration's text with `remoteMounts` removed, when it carried any. */
  declaration?: { file: string; text: string };
  /** `.gitignore` with the generated index-mounts block, when that changes it. */
  gitignore?: { file: string; text: string };
  /** The legacy `<name>.mount-lock.json` to rename to `index.lock.json`, when there is one. */
  lockRename?: { from: string; to: string };
  /** Whether writing would change a file. */
  changes: boolean;
}

/** Plan the conversion of `root`; writes nothing. */
export function planMigration(root: string, opts: { preferDeclaration?: boolean } = {}): MigrateResult {
  const migration = buildIndexConfig(root, opts);
  const indexText = formatIndexConfig(migration.config);
  const indexFile = join(root, INDEX_CONFIG_FILENAME);
  let changes = !existsSync(indexFile) || readFileSync(indexFile, "utf-8") !== indexText;

  let declaration: MigrateResult["declaration"];
  const declName = findDeclarationFile(root);
  if (declName !== undefined && migration.moved.length > 0) {
    const file = join(root, declName);
    const raw = JSON.parse(readFileSync(file, "utf-8")) as Record<string, unknown>;
    delete raw.remoteMounts;
    declaration = { file, text: `${JSON.stringify(raw, null, 2)}\n` };
    changes = true;
  }
  // The generated ignore block: one `/<path>/` per remote instance.
  let gitignore: MigrateResult["gitignore"];
  const giFile = join(root, ".gitignore");
  const giText = existsSync(giFile) ? readFileSync(giFile, "utf-8") : "";
  const giNext = withIgnoreBlock(giText, migration.config, giFile, lockedMountPaths(root));
  if (giNext !== giText) {
    gitignore = { file: giFile, text: giNext };
    changes = true;
  }

  // The lock moves to `index.lock.json`. Two legacy locks cannot be renamed
  // onto one name without choosing, so that is refused rather than merged.
  let lockRename: MigrateResult["lockRename"];
  const locks = lockFilesIn(root);
  if (locks.conflict !== undefined) throw new Error(locks.conflict);
  const legacy = locks.files.filter((f) => f !== INDEX_LOCK_FILENAME);
  if (legacy.length > 1) throw new Error(`${root} holds ${legacy.length} legacy locks (${legacy.join(", ")}); rename one to ${INDEX_LOCK_FILENAME} by hand`);
  if (legacy.length === 1) {
    lockRename = { from: join(root, legacy[0]!), to: join(root, INDEX_LOCK_FILENAME) };
    changes = true;
  }
  return { migration, indexText, ...(declaration ? { declaration } : {}), ...(gitignore ? { gitignore } : {}), ...(lockRename ? { lockRename } : {}), changes };
}

/** Write what {@link planMigration} planned. The index first, so a failure leaves the mounts declared somewhere. */
export function applyMigration(root: string, plan: MigrateResult): void {
  writeFileSync(join(root, INDEX_CONFIG_FILENAME), plan.indexText);
  if (plan.gitignore) writeFileSync(plan.gitignore.file, plan.gitignore.text);
  if (plan.declaration) writeFileSync(plan.declaration.file, plan.declaration.text);
  // A rename, so the lock's history follows it (`git` sees the move at commit).
  if (plan.lockRename) renameSync(plan.lockRename.from, plan.lockRename.to);
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

if (import.meta.main) {
  const root = resolve(arg("--root") ?? process.cwd());
  const write = process.argv.includes("--write");
  const check = process.argv.includes("--check");
  let plan: MigrateResult;
  try {
    plan = planMigration(root, { preferDeclaration: process.argv.includes("--prefer-declaration") });
  } catch (e) {
    console.error(`index-config:migrate: could not convert ${root}: ${(e as Error).message}`);
    process.exit(2);
  }
  const { migration } = plan;
  console.log(`index-config:migrate — ${root}`);
  console.log(`  instances: ${migration.config.instances.map((i) => `${i.name}${i.source && "remote" in i.source ? " (remote)" : ""}`).join(", ")}`);
  console.log(`  landing:   ${migration.config.site?.landing ?? "(none — the sole instance, or undetermined)"}`);
  if (migration.moved.length) console.log(`  moved from ${migration.movedFrom}: remoteMounts ${migration.moved.join(", ")}`);
  if (plan.lockRename) console.log(`  lock:      ${plan.lockRename.from} → ${plan.lockRename.to}`);
  if (plan.gitignore) console.log(`  .gitignore: the generated index-mounts block is written`);
  for (const f of migration.findings) console.log(`  ⚠ ${f.kind}: ${"file" in f ? `${f.file} — ` : ""}${f.detail}`);

  if (check) {
    if (plan.changes) {
      console.error(`✗ ${INDEX_CONFIG_FILENAME}, its .gitignore block or the lock's name is stale, or the declaration still carries remoteMounts — run \`bun run cat index-config:migrate --write\``);
      process.exit(1);
    }
    console.log(`✓ ${INDEX_CONFIG_FILENAME} is current`);
    process.exit(0);
  }
  if (!write) {
    console.log(`\n${plan.indexText}`);
    console.log(plan.changes ? "(dry run — pass --write to write it)" : "(up to date)");
    process.exit(0);
  }
  if (plan.changes) applyMigration(root, plan);
  console.log(plan.changes ? `✓ wrote ${join(root, INDEX_CONFIG_FILENAME)}${plan.declaration ? ` and removed remoteMounts from ${plan.declaration.file}` : ""}` : "✓ up to date");
}
