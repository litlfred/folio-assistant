#!/usr/bin/env bun
/**
 * check-asset-roles.ts — every required asset role has decided its layer, and
 * no instance restates on an asset what the ROLE already answers.
 *
 * Two findings, and they are two halves of one rule: `ASSET_ROLES` is the
 * single place a role says what it is for, which layer it belongs to and how
 * it reaches its reader. This gate keeps that place SINGLE.
 *
 * ## Why the stray-key half is not caught by the schema
 *
 * `KgAssetSchema` is a non-strict `z.object`, so an unknown key is dropped
 * without a word. That is deliberate — it is how a downstream instance carries
 * a key this layer has not learned about yet — and it has a recorded cost: a
 * `purpose` was written into `cat-harness/harness.json`, silently stripped,
 * and the declaration read as if it carried one while no consumer ever saw it.
 * Worse than absent, because absent is visible.
 *
 * So the raw declaration is what gets asked. After parsing, the evidence is
 * gone.
 *
 * ## Why the layer half is a gate rather than a required field
 *
 * It is not — `AssetRoleDef.layer` IS required, and `tsc` refuses a role that
 * does not say. What this half catches is the other direction: a role in
 * `REQUIRED_ASSET_ROLES` that `ASSET_ROLES` does not govern at all. The two
 * lists are separate on purpose (one says what every instance must declare,
 * the other says what a role means), and nothing but this makes them agree.
 *
 * @module scripts/check-asset-roles
 */

import {
  ASSET_ROLES,
  REQUIRED_ASSET_ROLES,
  ROLE_OWNED_ASSET_KEYS,
  assetRoleLayer,
  instanceRootsIn,
  processMayWriteAsset,
  strayAssetRoleKeys,
} from "../schemas/cat-harness.js";

export interface AssetRoleReport {
  /** Roles every instance must declare that `ASSET_ROLES` does not govern. */
  ungoverned: string[];
  /** Governed roles a running process would be permitted to write. */
  writable: string[];
  /** Asset declarations restating a role-owned key. */
  stray: Array<{ root: string; asset: string; key: string }>;
  /** How many instance declarations were read. */
  instances: number;
}

export function formatReport(r: AssetRoleReport): string {
  const out: string[] = ["Asset roles — one place says what a role is, and only one", ""];
  // Counts printed even at zero findings: a gate that says nothing when it
  // passes cannot be told from a gate that examined nothing.
  out.push(
    `  ${Object.keys(ASSET_ROLES).length} governed role(s); ` +
      `${REQUIRED_ASSET_ROLES.length} required of every instance; ` +
      `${r.instances} declaration(s) read; ` +
      `${ROLE_OWNED_ASSET_KEYS.length} key(s) an asset may not restate.`,
  );
  out.push(
    `  ${r.ungoverned.length} required role(s) ungoverned; ` +
      `${r.writable.length} writable by a running process; ` +
      `${r.stray.length} stray key(s) on an asset.`,
  );
  for (const role of r.ungoverned) {
    out.push(
      `      ✗ \`${role}\` — required of every instance and \`ASSET_ROLES\` does not say ` +
        "what it is for, which layer it holds, or how it is delivered",
    );
  }
  for (const role of r.writable) {
    out.push(
      `      ✗ \`${role}\` — declares \`layer: "${assetRoleLayer(role)}"\`, so a running step ` +
        "may rewrite it. Both required roles are read at session start and authored by a human.",
    );
  }
  for (const s of r.stray) {
    out.push(
      `      ✗ ${s.root}: asset \`${s.asset}\` carries \`${s.key}\` — the ROLE answers that, ` +
        "and the schema strips this key without a word, so it reads as declared and is not",
    );
  }
  if (r.instances === 0) {
    out.push("NOTHING WAS EXAMINED — no instance declaration was read. That is not a pass.");
  }
  return out.join("\n");
}

export function collect(repoRoot: string): AssetRoleReport {
  const roots = instanceRootsIn(repoRoot);
  return {
    ungoverned: REQUIRED_ASSET_ROLES.filter((r) => assetRoleLayer(r) === undefined),
    // `=== true` and not truthiness: `undefined` is the third state and an
    // ungoverned role is reported above, not a second time as writable.
    writable: Object.keys(ASSET_ROLES).filter((r) => processMayWriteAsset(r) === true),
    stray: roots.flatMap((r) => strayAssetRoleKeys(r)),
    instances: roots.length,
  };
}

export function isClean(r: AssetRoleReport): boolean {
  return (
    r.instances > 0 && r.ungoverned.length === 0 && r.writable.length === 0 && r.stray.length === 0
  );
}

if (import.meta.main) {
  const report = collect(process.cwd());
  const text = formatReport(report);
  (isClean(report) ? console.log : console.error)(text);
  process.exit(isClean(report) ? 0 : 1);
}
