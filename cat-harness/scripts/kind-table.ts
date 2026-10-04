#!/usr/bin/env bun
/**
 * The kinds the graph-kind TABLE names, and every name a row may carry.
 *
 * @module scripts/kind-table
 * @graphNode none — a reader over one authored table
 *
 * ## Why this is a module and not two functions in a test
 *
 * It was both functions in `tests/graph-kind-docs.test.ts`, which was the right
 * home while only that test asked. `kind:register` asks the same question — a new
 * kind owes a table ROW, and the row is **authored**, so the command reports it
 * rather than writing it — and a second copy of a parser over a hand-written
 * table is two answers that drift the first time a column moves. Bean `uoij`.
 *
 * Moved rather than duplicated: the test imports these, so there is still one
 * reader of the table, and its own assertions did not change.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { BASE_GRAPH_KINDS, GRAPH_KIND_ALIASES, defaultGraphKinds } from "../schemas/cat-harness.js";

/** The instance root this reader is relative to. */
export const KIND_TABLE_ROOT = join(import.meta.dir, "..");
export const KIND_TABLE_DOC = "skills/kg/kg-core/directory-conventions.md";
/** The table's header row, verbatim. Renaming a column is a deliberate edit. */
export const KIND_TABLE_HEADER = "| kind | declared by | contents | renderable |";

/**
 * The kinds the table names, read from its FIRST COLUMN only.
 *
 * Located by the header row rather than by position or by a pattern over the
 * prose: the file holds two pipe-tables and this is the one whose columns say
 * what they are. Absent, or present more than once, **THROWS** — a table a
 * caller cannot find is not an empty table, and a silent pass over nothing is
 * the failure mode this exists to prevent (#266 drifted through three green
 * merges that way).
 */
export function documentedKinds(root: string = KIND_TABLE_ROOT): string[] {
  const lines = readFileSync(join(root, KIND_TABLE_DOC), "utf8").split("\n");
  const at = lines.reduce<number[]>((acc, l, i) => (l.trim() === KIND_TABLE_HEADER ? [...acc, i] : acc), []);
  if (at.length !== 1) {
    throw new Error(
      `${KIND_TABLE_DOC}: expected exactly one graph-kind table header, found ${at.length}. ` +
        `Looked for the line: ${KIND_TABLE_HEADER}`,
    );
  }
  const out: string[] = [];
  // Skip the header and the |---|---| delimiter beneath it.
  for (let i = at[0]! + 2; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trimStart().startsWith("|")) break;
    const first = line.split("|")[1] ?? "";
    // A cell reads `` `tools` `` or `` **`folio-assist-core`** ``; the kind is the
    // backticked token, and bold marks WHO DECLARES it in the next column.
    const kind = first.replace(/[`*]/g, "").trim();
    if (kind) out.push(kind);
  }
  return out;
}

/** Every name a table row may legitimately carry. */
export function validKinds(): Set<string> {
  return new Set([
    ...defaultGraphKinds.names(),
    ...Object.keys(BASE_GRAPH_KINDS),
    // A deprecated alias still reads, so documenting one is not an error.
    ...Object.keys(GRAPH_KIND_ALIASES),
  ]);
}
