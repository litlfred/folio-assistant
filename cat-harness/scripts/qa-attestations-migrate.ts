#!/usr/bin/env bun
/**
 * Move every non-script QA verdict out of the derived block and translation
 * reports into the attestation store — one shot, idempotent, additive.
 *
 * Bean `8wj1` (arc `3fva`, family F4, defect C11), owner ruling D2 (a): the
 * attestations stay on main under `test/attestations/`; the derived script
 * verdicts move to the `qa-reports` branch. Layout and states:
 * `content/pipeline/qa-attestations.ts`.
 *
 * ## What it does, and what it never does
 *
 * - It READS every derived report — `test/results/block-qa/**`,
 *   `test/results/translation-qa/**`, and any legacy sibling beside its
 *   subject — and copies each entry whose `reviewer.kind` is not `script` into
 *   the subject's store file, verbatim (the store's `criteria` has the derived
 *   shape, so nothing is rewritten).
 * - It is IDEMPOTENT: an entry the store already holds (same serialisation) is
 *   not added again, so a second run writes nothing.
 * - It is ADDITIVE: it never removes an entry from the store and never edits
 *   or deletes a derived report. Removing the moved files from main is bean
 *   `5hox`, on the owner's go, and not this command's business.
 * - It creates the store marker, so after one run "this instance has no store"
 *   is no longer an answer a writer can get.
 *
 * Usage:
 *   bun run qa:attestations:migrate                 # migrate this instance (cat-harness)
 *   bun run qa:attestations:migrate --root <dir>    # another instance root
 *   bun run qa:attestations:migrate --check         # measure; exit 1 if anything is unmigrated
 *   bun run qa:attestations:migrate --json          # the counts as JSON
 *
 * `--check` is the MEASURING command for the bean: it counts every non-script
 * entry in the derived reports, by family, and how many the store holds.
 *
 * Exit: 0 done / nothing missing; 1 `--check` found unmigrated entries;
 * 3 a derived report or a store file could not be read (nothing is guessed).
 *
 * @module scripts/qa-attestations-migrate
 * @covers qa
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { findDeclarationFile } from "../schemas/cat-harness.ts";
import {
  ATTESTATION_FAMILIES,
  attestationKeyForDerived,
  type AttestationKey,
  type CriteriaMap,
  ensureStore,
  entryIdentity,
  isAsciiEscaped,
  readAttestations,
  splitCriteria,
  storeState,
  writeAttestations,
} from "../content/pipeline/qa-attestations.ts";

export interface MigrationReport {
  root: string;
  store: "present" | "absent" | "unknown";
  derivedFiles: number;
  filesWithAttestations: number;
  entries: number;
  byFamily: Record<string, number>;
  alreadyHeld: number;
  added: number;
  storeFilesWritten: number;
  unreadable: string[];
  missing: string[];
}

const SKIP_DIRS = new Set(["node_modules", "_site", "vendor"]);

/** Every derived block/translation report under an instance, results tree first, then legacy siblings. */
export function derivedReports(instanceRoot: string): string[] {
  const out: string[] = [];
  const walk = (dir: string, legacy: boolean): void => {
    let names: string[];
    try {
      names = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const name of names) {
      const abs = join(dir, name);
      let isDir = false;
      try {
        isDir = statSync(abs).isDirectory();
      } catch {
        continue;
      }
      if (isDir) {
        if (!legacy) {
          walk(abs, false);
          continue;
        }
        if (name.startsWith(".") || SKIP_DIRS.has(name)) continue;
        // The results tree is walked separately; `test/attestations` is the store itself.
        if (relative(instanceRoot, abs) === "test") continue;
        // A nested instance keeps its own store.
        if (findDeclarationFile(abs) !== undefined) continue;
        walk(abs, true);
        continue;
      }
      if (!name.endsWith(".qa.json") && !name.endsWith(".translation-qa.json")) continue;
      if (legacy && name.endsWith(".qa.json") && !existsSync(abs.replace(/\.qa\.json$/, ".ts"))) continue;
      out.push(abs);
    }
  };
  for (const family of ATTESTATION_FAMILIES) walk(join(instanceRoot, "test", "results", family), false);
  walk(instanceRoot, true);
  return out;
}

export function migrate(instanceRoot: string, opts: { check?: boolean } = {}): MigrationReport {
  const store = storeState(instanceRoot);
  const report: MigrationReport = {
    root: instanceRoot,
    store: store.state,
    derivedFiles: 0,
    filesWithAttestations: 0,
    entries: 0,
    byFamily: {},
    alreadyHeld: 0,
    added: 0,
    storeFilesWritten: 0,
    unreadable: [],
    missing: [],
  };
  if (store.state === "unknown") {
    report.unreadable.push(store.reason);
    return report;
  }
  // Grouped by store file: a block's results-tree report and its legacy sibling share one.
  const pending = new Map<string, { key: AttestationKey; att: CriteriaMap; asciiEscape: boolean }>();
  for (const derived of derivedReports(instanceRoot)) {
    const key = attestationKeyForDerived(instanceRoot, derived);
    if (!key) continue;
    report.derivedFiles++;
    let doc: { criteria?: CriteriaMap };
    let text: string;
    try {
      text = readFileSync(derived, "utf-8");
      doc = JSON.parse(text) as { criteria?: CriteriaMap };
    } catch (err) {
      report.unreadable.push(`${relative(instanceRoot, derived)}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    // A bare entry object where an array belongs is wrapped by `loadQaReport`; do the same so it is not skipped.
    const criteria: CriteriaMap = {};
    for (const [id, v] of Object.entries(doc?.criteria ?? {})) {
      if (Array.isArray(v)) criteria[id] = v;
      else if (v && typeof v === "object") criteria[id] = [v];
    }
    const { attestations } = splitCriteria(criteria);
    const n = Object.values(attestations).reduce((a, l) => a + l.length, 0);
    if (n === 0) continue;
    report.filesWithAttestations++;
    report.entries += n;
    report.byFamily[key.family] = (report.byFamily[key.family] ?? 0) + n;
    const id = `${key.family}:${key.subject}@${key.locale ?? ""}`;
    // The store file keeps the escaping of the report its entries came from, so their bytes survive.
    const slot = pending.get(id) ?? { key, att: {}, asciiEscape: isAsciiEscaped(text) };
    for (const [cid, list] of Object.entries(attestations)) {
      const into = (slot.att[cid] ??= []);
      const seen = new Set(into.map(entryIdentity));
      for (const e of list) if (!seen.has(entryIdentity(e))) into.push(e);
    }
    pending.set(id, slot);
  }

  for (const { key, att, asciiEscape } of pending.values()) {
    const read = readAttestations(instanceRoot, key);
    if (read.state === "corrupt" || read.state === "unknown") {
      report.unreadable.push(`${relative(instanceRoot, read.path)}: ${read.reason}`);
      continue;
    }
    const held: CriteriaMap = read.state === "hit" ? structuredClone(read.criteria) : {};
    let added = 0;
    for (const [cid, list] of Object.entries(att)) {
      const into = (held[cid] ??= []);
      const seen = new Set(into.map(entryIdentity));
      for (const e of list) {
        if (seen.has(entryIdentity(e))) {
          report.alreadyHeld++;
          continue;
        }
        added++;
        report.missing.push(`${relative(instanceRoot, read.path)} ${cid}`);
        into.push(e);
      }
    }
    if (added === 0 || opts.check) continue;
    report.added += added;
    if (writeAttestations(instanceRoot, key, held, { asciiEscape })) report.storeFilesWritten++;
  }
  if (!opts.check) {
    ensureStore(instanceRoot);
    report.missing = [];
  }
  return report;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf("--root");
  const root = resolve(i >= 0 && argv[i + 1] ? argv[i + 1]! : join(import.meta.dir, ".."));
  const check = argv.includes("--check");
  const r = migrate(root, { check });
  if (argv.includes("--json")) {
    console.log(JSON.stringify(r, null, 2));
  } else {
    console.log(
      `qa-attestations-migrate${check ? " --check" : ""} — ${relative(process.cwd(), root) || "."}\n` +
        `  store before: ${r.store}\n` +
        `  derived reports scanned: ${r.derivedFiles}\n` +
        `  non-script entries: ${r.entries} in ${r.filesWithAttestations} file(s) ` +
        `(${Object.entries(r.byFamily).map(([f, n]) => `${f} ${n}`).join(", ") || "none"})\n` +
        `  already in the store: ${r.alreadyHeld}\n` +
        (check ? `  missing from the store: ${r.missing.length}` : `  added: ${r.added}, store files written: ${r.storeFilesWritten}`),
    );
    for (const m of r.missing) console.log(`    ✗ ${m}`);
    for (const u of r.unreadable) console.error(`  ! could not read ${u}`);
  }
  if (r.unreadable.length > 0) process.exit(3);
  if (check && (r.missing.length > 0 || r.store !== "present")) process.exit(1);
}
