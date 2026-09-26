#!/usr/bin/env bun
/**
 * The `qa` graph, read as families — **one panel each, and never one total.**
 *
 * The owner's ruling of 2026-09-21 on bean `py74` (issue #635), chosen from
 * four options:
 *
 * > Separate family panels, never one total.
 *
 * `<base>/qa/` said *"declared and nothing publishes a projection for it yet"*
 * over the largest generated graph in this repository. This module is the
 * reader that ends that, and the shape of what it returns IS the ruling.
 *
 * ## Why no total, stated as the measurement rather than as taste
 *
 * A first survey called it "six schemas, three incompatible verdict shapes".
 * Re-measured by reading `$schema` out of every JSON rather than from that
 * survey, there are **nine** families, and the two largest that both roll up
 * disagree three separate ways:
 *
 * | | `kg-qa/v1` (321 files) | `qa-witness/v1` (134 files) |
 * |---|---|---|
 * | container | `totals` | `counts` |
 * | not-applicable | `n/a` | `na` |
 * | extra bucket | — | **`warn`** |
 *
 * And the third-largest, `block-qa/v1` at 122 files, declares **no roll-up
 * field at all**. So a shared headline would have to drop `warn` or invent it
 * for the others, pick a spelling of not-applicable, and compute totals for
 * 122 files that never declared any — three decisions a reader would have no
 * way to discover from a number on a dashboard.
 *
 * ## The refusal is structural, not a habit
 *
 * {@link QaGraphIndex} has no cross-family verdict field, and a test asserts
 * its ABSENCE rather than trusting nobody to add one. That is the same
 * discipline `GraphKindDef.holds` uses — the type refuses the undecided case
 * at the keyboard rather than at review. `files` is a count of documents
 * scanned, which is not a verdict about any of them; {@link QaFamily.buckets}
 * is reported per family, in that family's own spelling, and is never summed.
 *
 * ## Classification reads the file, never the path
 *
 * Every document declares its own `$schema`, so this needs no inference —
 * which matters because the same directory holds several families: a page's
 * `qa-index.json` sits beside the `.block.json` witnesses it indexes. The
 * repository's own rule is that *extension is a coincidence; a declaration
 * inside the file is the contract*, and a path-based classifier here would
 * break the first time a family moved.
 *
 * ## Three states, and the middle one is the point
 *
 * | | |
 * |---|---|
 * | **classified** | the document declares a `$schema` this reader can name |
 * | **unclassified** | valid JSON, no `$schema` — *could not determine* |
 * | **unreadable** | it would not parse — a defect, and counted separately |
 *
 * Folding either into a family would report a clean sweep over documents
 * nothing looked at, which is the `dh4f` shape. Both are carried to the top
 * level so a reader sees them beside the families rather than instead of them.
 *
 * @module folio-assistant/content/pipeline/qa-graph-index
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** The published tag. */
export const QA_GRAPH_INDEX_SCHEMA = "folio-qa-graph/v1";

/**
 * Deliberately NOT `folio-qa-index/v1` — that tag is taken, by a different
 * thing. Those 11 documents are a per-PAGE badge index (`page` + `badges`),
 * one per page under `witnesses/`. This is a projection of the whole `qa`
 * GRAPH. Reusing the tag would make two unlike documents indistinguishable to
 * exactly the consumer this exists to serve.
 */
export const NOT_TO_BE_CONFUSED_WITH = "folio-qa-index/v1";

/** One family's panel, in that family's own vocabulary. */
export interface QaFamily {
  /** The `$schema` tag, verbatim — never normalised, never prettified. */
  schema: string;
  /** How many documents declare it. */
  files: number;
  /**
   * Which field this family's roll-up lives in, or `null` where it declares
   * none. Reported rather than hidden: `totals` and `counts` are the same
   * idea under two names, and a consumer that could not see which one it was
   * handed would have to guess.
   */
  rollUpField: "totals" | "counts" | null;
  /**
   * The summed buckets, **in this family's own spelling** — `n/a` in one
   * family and `na` in another stay two keys, because merging them is the
   * decision this module exists not to take. Absent where `rollUpField` is
   * `null`; an empty object would say the family rolled up to nothing.
   */
  buckets?: Record<string, number>;
}

/**
 * The `qa` graph, projected.
 *
 * **There is no cross-family verdict field here and there must not be one.**
 * See the module note; `qa-graph-index.test.ts` asserts the absence.
 */
export interface QaGraphIndex {
  $schema: typeof QA_GRAPH_INDEX_SCHEMA;
  /** Documents scanned. A count of files, not a verdict about any of them. */
  files: number;
  /** Families, largest first — the order a panel list reads in. */
  families: QaFamily[];
  /** Valid JSON with no `$schema`: could not determine, never "fine". */
  unclassified: number;
  /** Would not parse. A defect, counted apart from the state above it. */
  unreadable: number;
}

/** Every `.json` under `dir`, recursively. */
export function jsonFilesIn(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    let s;
    try {
      s = statSync(p);
    } catch {
      continue;
    }
    if (s.isDirectory()) out.push(...jsonFilesIn(p));
    else if (e.endsWith(".json")) out.push(p);
  }
  return out;
}

/**
 * Add one document's roll-up into a family's buckets.
 *
 * Exported so the bucket arithmetic is testable on its own: it is the only
 * place in this module where a number is added to another number, and the
 * ruling above is precisely a rule about which numbers may be.
 */
export function accumulate(
  into: Record<string, number>,
  rollUp: unknown,
): void {
  if (rollUp === null || typeof rollUp !== "object") return;
  for (const [k, v] of Object.entries(rollUp as Record<string, unknown>)) {
    // A non-numeric bucket is skipped rather than coerced. `Number(x) || 0`
    // would turn a string, a null and a genuine zero into the same 0, and the
    // published count would then be a claim nobody could reproduce.
    if (typeof v === "number" && Number.isFinite(v)) into[k] = (into[k] ?? 0) + v;
  }
}

/** Which field carries this document's roll-up, if any. */
export function rollUpFieldOf(doc: Record<string, unknown>): "totals" | "counts" | null {
  if (doc["totals"] !== undefined && doc["totals"] !== null) return "totals";
  if (doc["counts"] !== undefined && doc["counts"] !== null) return "counts";
  return null;
}

/** Read the `qa` graph under `dir` and project it. */
export function readQaGraph(dir: string): QaGraphIndex {
  const acc = new Map<string, { files: number; field: "totals" | "counts" | null; buckets: Record<string, number> }>();
  let unclassified = 0;
  let unreadable = 0;
  let files = 0;

  for (const p of jsonFilesIn(dir)) {
    files += 1;
    let doc: unknown;
    try {
      doc = JSON.parse(readFileSync(p, "utf8"));
    } catch {
      unreadable += 1;
      continue;
    }
    if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
      unclassified += 1;
      continue;
    }
    const rec = doc as Record<string, unknown>;
    const schema = rec["$schema"];
    if (typeof schema !== "string" || schema.length === 0) {
      unclassified += 1;
      continue;
    }
    const field = rollUpFieldOf(rec);
    const e = acc.get(schema) ?? { files: 0, field, buckets: {} };
    e.files += 1;
    // A family whose FIRST document declared no roll-up but whose later ones
    // do is reported as rolling up. The alternative — first-writer-wins —
    // would make the answer depend on readdir order, which is the kind of
    // result that reproduces on one machine and not the next.
    if (e.field === null && field !== null) e.field = field;
    if (field !== null) accumulate(e.buckets, rec[field]);
    acc.set(schema, e);
  }

  const families: QaFamily[] = [...acc.entries()]
    .map(([schema, e]) => ({
      schema,
      files: e.files,
      rollUpField: e.field,
      ...(e.field === null ? {} : { buckets: e.buckets }),
    }))
    // Largest first, then by tag so two families of equal size do not swap
    // places between runs and show up as a diff nobody made.
    .sort((a, b) => b.files - a.files || a.schema.localeCompare(b.schema));

  return { $schema: QA_GRAPH_INDEX_SCHEMA, files, families, unclassified, unreadable };
}
