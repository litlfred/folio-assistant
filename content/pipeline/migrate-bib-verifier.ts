#!/usr/bin/env bun
/**
 * migrate-bib-verifier.ts — Convert legacy free-text `verified_by` strings
 * in `content/bib-qa-verifications.json` to the discriminated `Verifier`
 * union defined in `folio-assistant/schemas/bib-verification.ts`.
 *
 * The legacy shape was:
 *
 *     "verified_by": "Claude (claude-opus-4-7)"
 *     "verified_by": "Claude (claude-sonnet-4-6)"
 *
 * The new shape is:
 *
 *     "verified_by": { "kind": "agent", "model": "claude-opus-4-7" }
 *
 * The script is idempotent — entries that already carry the structured
 * shape are left alone.  A `--dry-run` flag previews the conversion
 * without writing.
 *
 * Usage:
 *   bun run content/pipeline/migrate-bib-verifier.ts          # apply
 *   bun run content/pipeline/migrate-bib-verifier.ts --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const REPO_ROOT = resolve(import.meta.dir, "../..");
const TARGET = join(REPO_ROOT, "content/bib-qa-verifications.json");

/** Parse legacy "Claude (model-name)" pattern → `{ kind: "agent", model }`. */
function parseLegacyVerifier(s: string): { kind: "agent"; model: string } | null {
  // Common pattern: "Claude (claude-opus-4-7)"
  const m = s.match(/^Claude\s+\(([^)]+)\)\s*$/);
  if (m) return { kind: "agent", model: m[1].trim() };
  // Bare model name fallback.
  if (/^claude-[a-z0-9-]+$/.test(s.trim())) {
    return { kind: "agent", model: s.trim() };
  }
  return null;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (!existsSync(TARGET)) {
    console.error(`ERROR: ${TARGET} not found`);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(TARGET, "utf-8"));
  const entries: any[] = raw.entries ?? [];

  let migrated = 0;
  let alreadyStructured = 0;
  let unparseable: string[] = [];

  for (const e of entries) {
    const v = e.verified_by;
    if (v == null) continue;
    if (typeof v === "object" && v.kind) {
      alreadyStructured++;
      continue;
    }
    if (typeof v === "string") {
      const parsed = parseLegacyVerifier(v);
      if (!parsed) {
        unparseable.push(`${e.id}: ${JSON.stringify(v)}`);
        continue;
      }
      e.verified_by = parsed;
      migrated++;
    }
  }

  // Update the schema comment to drop the obsolete caveat (the discriminated
  // union now encodes what the caveat was warning about) but keep a brief
  // migration note.
  if (raw._verified_by_caveat) {
    delete raw._verified_by_caveat;
  }
  raw._schema =
    "Per-paper verification status for QOU bibliography. Consumed by " +
    "content/pipeline/bib-qa.ts (tags has_local_pdf, verification_status). " +
    "Hand-edited; one entry per reference id in references.ts that has been " +
    "examined. Absence = pending. Status values: verified-clean, partial, " +
    "fixed, uncited, paper-mismatch, unfetchable, pending-placement. " +
    "Verified_by is a Verifier discriminated union: " +
    "{ kind: 'agent', model } or { kind: 'human', name, agent_assistance? }. " +
    "See folio-assistant/schemas/bib-verification.ts for the typed contract.";

  console.log(`Migrated:           ${migrated}`);
  console.log(`Already structured: ${alreadyStructured}`);
  console.log(`Unparseable:        ${unparseable.length}`);
  for (const u of unparseable) console.log(`  ${u}`);

  if (dryRun) {
    console.log("\n(dry run — no writes)");
    process.exit(0);
  }

  writeFileSync(TARGET, JSON.stringify(raw, null, 2) + "\n");
  console.log(`\nWrote: ${TARGET}`);
}
