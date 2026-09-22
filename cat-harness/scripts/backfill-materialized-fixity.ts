#!/usr/bin/env bun
/**
 * Record a fixity digest for every materialized FILE that has none.
 *
 * @module cat-harness/scripts/backfill-materialized-fixity
 *
 * ## Why this exists
 *
 * `check-materialized-fixity.ts` enforces that materialized content is not
 * edited in place, by hashing the bytes against the digest their record
 * carries. Measured 2026-09-22, the corpus held **229 materialized artefacts
 * and 6 verifiable digests** — so the gate was real and covered 2.6% of what
 * it is meant to protect. A green gate over that reads as "materialized
 * content is protected", which would have been false.
 *
 * The owner chose to close it: *"Backfill all 222 now."*
 *
 * ## WHAT A BACKFILLED DIGEST DOES AND DOES NOT PROVE
 *
 * This is the part that must not be lost, and it is why every record this
 * writes says so in its own `note`.
 *
 * A digest computed today hashes **what is on disk today**. It establishes a
 * baseline from this moment forward: from here, an edit in place is caught.
 * It does **not** prove the bytes are pristine. If an artefact was already
 * edited before this ran, the backfill blesses that edit and nothing here can
 * tell.
 *
 * Egress is blocked in this environment, so re-fetching upstream to compare
 * was not available. That is a limit of the run, not of the idea — a later
 * run with network access could verify against `materialization.of` and
 * upgrade the claim from *observed* to *confirmed*.
 *
 * Recording the caveat in the data rather than only in a commit message is
 * deliberate: a commit message is read once, by whoever reviews it, and the
 * record is read every time somebody asks what the digest means.
 *
 * ## It backfills FILES only
 *
 * Three of the records without a digest are directories — who-iris's items
 * point at `library/<id>` while their bitstreams point at
 * `uploads/<id>/<file>`. A file digest does not apply to a directory, and
 * those items are already covered by their parts, which the checker reports as
 * its own verdict rather than as a gap. One more has no `localPath` at all.
 * Neither is backfilled, and neither is a failure.
 *
 * Usage:
 *   bun run cat-harness/scripts/backfill-materialized-fixity.ts --dry-run
 *   bun run cat-harness/scripts/backfill-materialized-fixity.ts
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { collect, type MaterializedRecord } from "./check-materialized-fixity.js";

const REPO = resolve(import.meta.dir, "..", "..");

const NOTE =
  "Digest observed at backfill on 2026-09-22, not recorded at ingestion. " +
  "It is a baseline: from this point an edit in place is detectable. It does NOT " +
  "prove the bytes are pristine — anything altered before this run is blessed by it. " +
  "Egress was blocked, so upstream could not be re-fetched to confirm.";

/** A file that can be hashed, and currently carries no digest. */
export function backfillable(records: readonly MaterializedRecord[]): MaterializedRecord[] {
  return records.filter(
    (r) =>
      r.digest === undefined &&
      r.localPath !== undefined &&
      r.abs !== undefined &&
      existsSync(r.abs) &&
      statSync(r.abs).isFile(),
  );
}

/**
 * Write the digest into every materialization in `doc` whose `localPath`
 * matches, and report how many were changed.
 *
 * Matched on `localPath` rather than on object identity because the document
 * is re-parsed from disk here: the records handed in came from an earlier
 * parse, and mutating those would write nothing.
 */
export function applyTo(doc: unknown, digests: ReadonlyMap<string, string>): number {
  let changed = 0;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) {
      for (const x of v) walk(x);
      return;
    }
    if (typeof v !== "object" || v === null) return;
    const o = v as Record<string, unknown>;
    const m = o.materialization as Record<string, unknown> | undefined;
    if (m && m.state === "materialized" && typeof m.localPath === "string" && m.fixity === undefined) {
      const d = digests.get(m.localPath);
      if (d !== undefined) {
        m.fixity = { algorithm: "sha256", digest: d, note: NOTE };
        changed++;
      }
    }
    for (const child of Object.values(o)) walk(child);
  };
  walk(doc);
  return changed;
}

if (import.meta.main) {
  const dry = process.argv.includes("--dry-run");
  const records = collect(REPO);
  const todo = backfillable(records);

  console.log(`materialized records: ${records.length}`);
  console.log(`  already carrying a digest: ${records.filter((r) => r.digest !== undefined).length}`);
  console.log(`  backfillable files:        ${todo.length}`);
  const skipped = records.filter((r) => r.digest === undefined && !todo.includes(r));
  console.log(`  not backfillable:          ${skipped.length} (directories, or no localPath)`);

  // Digest each file ONCE, keyed by the path its record names.
  const digests = new Map<string, string>();
  for (const r of todo) {
    if (digests.has(r.localPath!)) continue;
    digests.set(r.localPath!, createHash("sha256").update(readFileSync(r.abs!)).digest("hex"));
  }

  const bySource = new Map<string, MaterializedRecord[]>();
  for (const r of todo) bySource.set(r.source, [...(bySource.get(r.source) ?? []), r]);

  let written = 0;
  for (const [source, rs] of bySource) {
    const abs = join(REPO, source);
    const doc = JSON.parse(readFileSync(abs, "utf-8"));
    const n = applyTo(doc, digests);
    console.log(`  ${dry ? "would write" : "wrote"} ${n} digest(s) → ${source} (${rs.length} record(s))`);
    if (!dry && n > 0) writeFileSync(abs, `${JSON.stringify(doc, null, 2)}\n`);
    written += n;
  }
  console.log(dry ? `\n--dry-run: ${written} digest(s) would be recorded.` : `\n${written} digest(s) recorded.`);
}
