#!/usr/bin/env bun
/**
 * ONE-SHOT, IDEMPOTENT: move the judgement half of every `kg-qa/v1` sidecar
 * — `pair_attestations` and `voice_reviews` — into the attestation store
 * (`schemas/qa-attestations.ts`), and strip it from the sidecar.
 *
 * Bean `2gst` (arc `3fva`, family F1). Owner rulings: D2 (a), attestations
 * stay on main; the 26 `baseline` pair attestations count as judgements. So
 * EVERY entry moves, whoever wrote it.
 *
 * ## The order, and why each step waits for the one before
 *
 * 1. Read the sidecar. No attestation arrays → nothing to do (this is what
 *    makes a second run a no-op).
 * 2. Compose the store file from the sidecar's OWN objects — same keys, same
 *    order, same values — so the attestation content is byte-preserved.
 * 3. If a store file is already there: identical content → already moved,
 *    go to 5; different content → REFUSE, report, touch neither file. Two
 *    disagreeing judgements are a person's to reconcile, not this script's.
 * 4. Write the store file, read it BACK, and compare entry by entry.
 * 5. Only then strip the two arrays from the sidecar. A sidecar is never
 *    stripped on the strength of a write that was not verified.
 *
 * Nothing is deleted: the sidecar keeps every derived field; the store file is
 * new. `--dry-run` reports the plan and writes nothing.
 *
 *   bun run cat-harness/scripts/migrate-kg-attestations.ts [--dry-run] [--json]
 *
 * @module scripts/migrate-kg-attestations
 * @covers attestations
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

// `readDeclaration` throws on the `folio` kind unless core has registered it —
// the same side-effect import `qa-store.ts` carries, same reason.
import "../schemas/folio-graph-kind.js";
import {
  ATTESTATIONS_SUFFIX,
  attestationPathFor,
  kgAttestationTrees,
  KG_QA_SIDECAR_SUFFIX as KG_SIDECAR_SUFFIX,
  QA_ATTESTATIONS_SCHEMA,
  serialiseAttestations,
  type KgAttestations,
  type KgAttestationTree as TreePair,
} from "../schemas/qa-attestations.js";

/** The arrays that are judgements, in the order the sidecar carried them. */
export const JUDGEMENT_FIELDS = ["pair_attestations", "voice_reviews"] as const;

export type MigrationOutcome =
  | { state: "moved" | "already-moved"; sidecar: string; store: string; pairs: number; reviews: number }
  | { state: "conflict" | "unreadable"; sidecar: string; store: string; reason: string };

function walk(dir: string, suffix: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, suffix, acc);
    else if (e.name.endsWith(suffix)) acc.push(p);
  }
  return acc.sort();
}

/** The store file a sidecar's judgements compose, or `undefined` when it carries none. */
export function composeAttestations(sidecar: Record<string, unknown>): KgAttestations | undefined {
  const present = JUDGEMENT_FIELDS.filter((f) => Array.isArray(sidecar[f]) && (sidecar[f] as unknown[]).length > 0);
  if (present.length === 0) return undefined;
  const file: Record<string, unknown> = {
    $schema: QA_ATTESTATIONS_SCHEMA,
    family: "kg-qa",
    subject: sidecar["subject"],
  };
  for (const f of present) file[f] = sidecar[f];
  return file as KgAttestations;
}

/** Entry-level identity: the compact JSON of each judgement, per field. */
export function entryFingerprints(file: Record<string, unknown>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const f of JUDGEMENT_FIELDS) {
    const list = file[f];
    out[f] = Array.isArray(list) ? list.map((e) => JSON.stringify(e)) : [];
  }
  return out;
}

const sameEntries = (a: Record<string, unknown>, b: Record<string, unknown>): boolean =>
  JSON.stringify(entryFingerprints(a)) === JSON.stringify(entryFingerprints(b)) &&
  JSON.stringify(a["subject"]) === JSON.stringify(b["subject"]);

/** Migrate one tree. Pure apart from the files it is pointed at. */
export function migrateTree(pair: TreePair, opts: { dryRun?: boolean } = {}): MigrationOutcome[] {
  const outcomes: MigrationOutcome[] = [];
  for (const sidecar of walk(pair.kgTree, KG_SIDECAR_SUFFIX)) {
    const store = attestationPathFor(sidecar, pair.kgTree, pair.attHome, "kg-qa", KG_SIDECAR_SUFFIX);
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(readFileSync(sidecar, "utf-8")) as Record<string, unknown>;
    } catch (e) {
      // Not skipped quietly: an unreadable sidecar may be holding judgements.
      outcomes.push({ state: "unreadable", sidecar, store, reason: e instanceof Error ? e.message : String(e) });
      continue;
    }
    const composed = composeAttestations(json);
    if (composed === undefined) continue;
    const counts = { pairs: composed.pair_attestations?.length ?? 0, reviews: composed.voice_reviews?.length ?? 0 };

    let state: "moved" | "already-moved" = "moved";
    if (existsSync(store)) {
      let prior: Record<string, unknown>;
      try {
        prior = JSON.parse(readFileSync(store, "utf-8")) as Record<string, unknown>;
      } catch (e) {
        outcomes.push({ state: "conflict", sidecar, store, reason: `the store file is unreadable: ${e instanceof Error ? e.message : String(e)}` });
        continue;
      }
      if (!sameEntries(prior, composed as unknown as Record<string, unknown>)) {
        outcomes.push({ state: "conflict", sidecar, store, reason: "the store already holds DIFFERENT judgements for this subject; reconcile by hand" });
        continue;
      }
      state = "already-moved";
    } else if (!opts.dryRun) {
      mkdirSync(dirname(store), { recursive: true });
      writeFileSync(store, serialiseAttestations(composed));
      const back = JSON.parse(readFileSync(store, "utf-8")) as Record<string, unknown>;
      if (!sameEntries(back, composed as unknown as Record<string, unknown>)) {
        throw new Error(`${store}: read-back does not match what was written — stopping before any sidecar is stripped`);
      }
    }

    if (!opts.dryRun) {
      for (const f of JUDGEMENT_FIELDS) delete json[f];
      writeFileSync(sidecar, `${JSON.stringify(json, null, 2)}\n`);
    }
    outcomes.push({ state, sidecar, store, ...counts });
  }
  return outcomes;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const asJson = argv.includes("--json");
  const host = resolve(import.meta.dir, "..");
  const repo = resolve(host, "..");
  const all: MigrationOutcome[] = [];
  for (const pair of kgAttestationTrees(repo, host)) all.push(...migrateTree(pair, { dryRun }));
  const rel = (p: string) => relative(repo, p);
  if (asJson) {
    console.log(JSON.stringify(all.map((o) => ({ ...o, sidecar: rel(o.sidecar), store: rel(o.store) })), null, 2));
  } else {
    const by = (s: MigrationOutcome["state"]) => all.filter((o) => o.state === s);
    const n = (rows: MigrationOutcome[], k: "pairs" | "reviews") => rows.reduce((t, o) => t + ("pairs" in o ? o[k] : 0), 0);
    const ok = [...by("moved"), ...by("already-moved")];
    console.log(
      `${dryRun ? "[dry run] " : ""}kg-qa attestations: ${by("moved").length} moved, ${by("already-moved").length} already moved ` +
        `(${n(ok, "pairs")} pair attestation(s), ${n(ok, "reviews")} voice review(s)) → *${ATTESTATIONS_SUFFIX}`,
    );
    for (const o of [...by("conflict"), ...by("unreadable")]) {
      console.error(`  ✗ ${o.state}: ${rel(o.sidecar)} → ${rel(o.store)}: ${"reason" in o ? o.reason : ""}`);
    }
  }
  process.exit(all.some((o) => o.state === "conflict" || o.state === "unreadable") ? 1 : 0);
}
