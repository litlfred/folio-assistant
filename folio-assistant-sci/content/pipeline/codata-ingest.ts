/**
 * CODATA → a library dataset whose VALUES are addressable, with provenance.
 *
 * Owner, 2026-09-30 (bean `uyp8`): *"CODATA would need to be properly ingested
 * as a dataset into library ... and variables be like
 * {{ qou.library.codata-2022.mass-electron }} or so"*.
 *
 * ## What it writes, under `<library>/<entry>/`
 *
 * - `tabular.jsonld` — the ingest pipeline's existing TABULAR rung
 *   (`folio-tabular-records/v1`): format, source identity (file, sha256, where
 *   it was obtained, when) and the one sheet's headers. Nothing new for the
 *   L1 walk to learn: a constants table IS tabular data.
 * - `values.json` — the values themselves, keyed by quantity slug:
 *   `{ "<slug>": { quantity, value, uncertainty, unit, exact } }`. The tabular
 *   rung records no cells by design; this is what makes the dataset
 *   ADDRESSABLE, as `{{ <instance>.library.<entry>.<slug> }}` (bean `kott`) —
 *   an object with a `value` resolves to that value, and `.uncertainty` /
 *   `.unit` are addressable explicitly.
 * - `licence.json` — whatever is KNOWN, in `check-source-licence`'s shape.
 *
 * ## Slugs are mechanical, and that IS the stored mapping
 *
 * NIST's quantity name, lower-cased, every run of other characters replaced by
 * `-`: `electron mass energy equivalent in MeV` →
 * `electron-mass-energy-equivalent-in-mev`. A hand-picked alias
 * (`mass-electron`) would be a second vocabulary to keep in sync with the
 * table. Each record also keeps NIST's exact `quantity` string, so the mapping
 * is stored, never re-derived, and a slug collision is refused rather than
 * letting one quantity shadow another.
 *
 * ## Values stay exact
 *
 * NIST writes `9.109 383 7139 e-31`. The spaces are digit grouping and are
 * removed; the value is kept as a DECIMAL STRING (`9.1093837139e-31`), never
 * parsed to a float, so formatting later (`| precision: N`) works on every
 * published digit. `(exact)` becomes `uncertainty: null, exact: true`. A value
 * NIST truncates with `...` keeps the marker in `truncated: true`.
 *
 * Usage:
 *   bun run folio-assistant-sci/content/pipeline/codata-ingest.ts \
 *     --source <allascii.txt> --out <library>/codata-2022 --edition 2022 \
 *     --obtained-from <url or description> [--check]
 *
 * @module folio-assistant-sci/content/pipeline/codata-ingest
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export interface CodataRecord {
  quantity: string;
  /** Exact decimal string, grouping spaces removed. */
  value: string;
  /** Exact decimal string, or null when the value is exact. */
  uncertainty: string | null;
  unit: string | null;
  exact: boolean;
  /** NIST wrote `...`: the value continues past what is shown. */
  truncated?: boolean;
}

/** NIST quantity name → the address segment. */
export function slugOf(quantity: string): string {
  return quantity
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const compact = (s: string) => s.replace(/\s+/g, "");

/**
 * Parse NIST's fixed-width `allascii` table. Columns are separated by runs of
 * 2+ spaces (single spaces are digit grouping inside a number), so a row
 * splits into quantity / value / uncertainty / unit without column offsets that
 * change between editions.
 */
export function parseCodataAscii(text: string): Map<string, CodataRecord> {
  const out = new Map<string, CodataRecord>();
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim() || /^-{5,}/.test(line) || /^\s*Quantity\s{2,}Value/i.test(line)) continue;
    const cols = line.split(/\s{2,}/);
    if (cols.length < 3) continue; // header prose, not a row
    const [quantity, valueRaw, uncRaw, ...unitParts] = cols as [string, string, string, ...string[]];
    // A number column: digits, grouping spaces, sign, point, exponent, `...`.
    if (!/^[-+]?[\d.]/.test(valueRaw)) continue;
    const truncated = valueRaw.includes("...");
    const value = compact(valueRaw.replace("...", ""));
    const exact = /^\(exact\)$/.test(uncRaw.trim());
    const uncertainty = exact ? null : compact(uncRaw);
    const unit = unitParts.join(" ").trim() || null;
    const slug = slugOf(quantity);
    const prior = out.get(slug);
    if (prior) throw new Error(`slug "${slug}" names both "${prior.quantity}" and "${quantity}"`);
    out.set(slug, { quantity, value, uncertainty, unit, exact, ...(truncated ? { truncated } : {}) });
  }
  return out;
}

export interface IngestOptions {
  /** The library entry's directory name, e.g. `codata-2022`. */
  entryId: string;
  sourceText: string;
  /** The file name the source had, for `tabular.jsonld` `source.file`. */
  sourceName: string;
  edition: string;
  /** The authoritative publisher's URL. */
  primaryUrl: string;
  /** How this copy was actually obtained, when not from `primaryUrl` itself. */
  obtainedFrom: string;
  retrievedAt: string;
}

export interface IngestResult {
  files: Record<string, string>;
  count: number;
}

const json = (o: unknown) => JSON.stringify(o, null, 2) + "\n";

/** The entry's files, as text, ready to write or compare. */
export function buildCodataEntry(o: IngestOptions): IngestResult {
  const rows = parseCodataAscii(o.sourceText);
  if (rows.size === 0) throw new Error("no CODATA rows parsed: nothing to ingest");
  const sha256 = createHash("sha256").update(o.sourceText).digest("hex");
  const values = Object.fromEntries([...rows.entries()].sort(([a], [b]) => a.localeCompare(b)));
  const headers = ["Quantity", "Value", "Uncertainty", "Unit"];
  // `folio-tabular-records/v1`, the tabular rung's schema, with the technical
  // metadata `check-l1-complete` requires. `mimetype_source: "unrecognised"`:
  // a text table has no magic bytes, and saying so is the determined answer.
  // `mtime` is the retrieval date, not a filesystem time that would change on
  // every checkout. The narrative starts `not-authored`: describing a dataset
  // is somebody's account, not something to generate.
  const tabular = {
    $schema: "folio-tabular-records/v1",
    "@id": `library/${o.entryId}/tabular`,
    format: "fixed-width",
    source: {
      file: o.sourceName,
      sha256,
      bytes: Buffer.byteLength(o.sourceText, "utf-8"),
      mtime: `${o.retrievedAt}T00:00:00Z`,
      mimetype_sniffed: null,
      mimetype_source: "unrecognised",
      edition: `CODATA ${o.edition}`,
      publisher: "NIST",
      primaryUrl: o.primaryUrl,
      obtainedFrom: o.obtainedFrom,
      retrievedAt: o.retrievedAt,
    },
    sheets: [
      {
        name: `CODATA ${o.edition} recommended values`,
        headers,
        rows: rows.size,
        columns: headers.length,
        shape_source: "counted",
        delimiter: null,
        delimiter_source: "undetermined",
      },
    ],
    n_sheets: 1,
    header_vocabulary: headers,
    narrative: { text: null, state: "not-authored" },
  };
  return { files: { "tabular.jsonld": json(tabular), "values.json": json(values) }, count: rows.size };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (k: string) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const source = opt("--source");
  const out = opt("--out");
  const edition = opt("--edition");
  const obtainedFrom = opt("--obtained-from");
  if (!source || !out || !edition || !obtainedFrom) {
    console.error("usage: codata-ingest.ts --source <allascii.txt> --out <library>/codata-<edition> --edition <year> --obtained-from <where this copy came from> [--retrieved-at YYYY-MM-DD] [--check]");
    process.exit(2);
  }
  const text = readFileSync(source, "utf-8");
  const prior = existsSync(join(out, "tabular.jsonld"))
    ? (JSON.parse(readFileSync(join(out, "tabular.jsonld"), "utf-8")) as { source?: { retrievedAt?: string } })
    : undefined;
  const r = buildCodataEntry({
    entryId: basename(out),
    sourceText: text,
    sourceName: basename(source),
    edition,
    primaryUrl: "https://physics.nist.gov/cuu/Constants/Table/allascii.txt",
    obtainedFrom,
    // --check compares against the date already recorded, so a re-check on a
    // later day is not reported as stale.
    retrievedAt: opt("--retrieved-at") ?? prior?.source?.retrievedAt ?? new Date().toISOString().slice(0, 10),
  });
  if (args.includes("--check")) {
    const stale = Object.entries(r.files).filter(([f, t]) => !existsSync(join(out, f)) || readFileSync(join(out, f), "utf-8") !== t);
    if (stale.length) {
      console.error(`✗ stale: ${stale.map(([f]) => f).join(", ")} in ${out}`);
      process.exit(1);
    }
    console.log(`✓ ${out}: ${r.count} CODATA ${edition} values current`);
    process.exit(0);
  }
  mkdirSync(out, { recursive: true });
  for (const [f, t] of Object.entries(r.files)) writeFileSync(join(out, f), t);
  console.log(`wrote ${r.count} CODATA ${edition} values to ${out}`);
}
