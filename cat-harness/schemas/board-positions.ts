/**
 * Where a note sits on a board — a layer ON TOP of the notes, never inside them.
 *
 * ## The ruling this encodes, and the word that decides the design
 *
 * The owner, 2026-09-20, choosing between four options with the merge hazard
 * stated, then clarifying twice:
 *
 * > Committed, one positions file per board.
 *
 * > **it lives on top of notes, not data within notes.**
 *
 * > it can be one file...
 *
 * > **notes exist lower down than folio. make sure arrows correct.**
 *
 * The second is the one that constrains the code. A note gains no `x`, no `y`,
 * no `board`, no `order`. This layer names notes BY ID and the relation points
 * one way:
 *
 *     folio  ──▶  board  ──▶  position  ──▶  note        allowed
 *     note   ──▶  position / board / folio                REFUSED
 *
 * Four things follow, and each is a property the per-note alternative could
 * not have had:
 *
 * 1. **A note is complete with no board.** `readTodoFiles`, the todo index,
 *    the sticky board and the QA sidecars are untouched, and a folio that
 *    never opens a board has nothing extra in its work plan. The layer is
 *    ADDITIVE and REMOVABLE: delete this file and every note is what it was.
 * 2. **One note may sit on several boards**, at different places, without the
 *    note arbitrating between them.
 * 3. **The layers stay clean.** A note is `content` or `state` depending on
 *    its graph; this is unambiguously `state`, written by a running process.
 *    A coordinate on a note would make a `content` node carry `state`, which
 *    `content-context-and-state-graphs` refuses.
 * 4. **An orphan is swept from the LAYER**, which is the easy direction: one
 *    file, one pass, and nothing edited out of a note a person owns.
 *
 * It is the same one-way shape `uses[]` already enforces between the editorial
 * relation and the derived dependency graph, and for the same reason: mixing
 * the two destroys the signal each carries.
 *
 * ## ONE file, with the board as a key
 *
 * Not one file per board. The board is a key inside this document, so a new
 * board adds lines rather than a file, and the merge property below holds the
 * same whether there is one board or twenty.
 *
 * ## Mergeability is the whole reason for the shape
 *
 * Positions are the most concurrently-edited state a folio has — two sessions
 * moving two notes is the ordinary case, not the exceptional one. The fix is
 * the one `gen-docs-pages.ts` proved on 2026-09-20 and recorded:
 *
 * > Minified, this file is ONE LINE of ~12 KB. Git merges text by line, so a
 * > single line means any change on both sides of a merge is a whole-file
 * > conflict — two branches adding two different todos cannot both win. That
 * > is not hypothetical: it conflicted on three consecutive merges of one
 * > branch on 2026-09-20, every time.
 *
 * So: **indented, one position per line, sorted by board then note id.** Two
 * sessions moving DIFFERENT notes merge untouched.
 *
 * **It is a partial fix and the limit is known.** Two notes that sort ADJACENT
 * still conflict, because the inserted lines overlap. This removes the
 * guaranteed conflict, not every conflict, and saying so is the point — a
 * mergeability claim nobody bounded is one somebody will over-trust.
 *
 * **The ordering must be deterministic or the property is worthless**: a
 * writer that emitted positions in map order would reshuffle on every save and
 * conflict anyway. {@link sortPositions} is that guarantee, and it is tested
 * rather than assumed.
 *
 * @graphNode schema
 * @module schemas/board-positions
 */
import { z } from "zod";

/** The document's own declaration of what it is, inside the file. */
export const BOARD_POSITIONS_SCHEMA_TAG = "folio-board-positions/v1";

/**
 * Where one note sits, in BOARD UNITS rather than pixels.
 *
 * Pixels would bake in the viewport that happened to be open when somebody
 * dragged a note, so the same board would read differently on a phone and be
 * unreproducible from the file. Board units are the board's own coordinate
 * space; the renderer maps them to the viewport it has.
 *
 * There is deliberately no `z` and no `width`. A note's size is its content's
 * business — the sticky sizes to what it holds, which is the property
 * `theme-artefacts` records — and stacking order is a rendering decision the
 * board makes from the list, not a value a person edits into a file.
 */
export const BoardPositionSchema = z.object({
  /** The note this places. An id, never an embedded copy — see the module docs. */
  note: z.string().min(1),
  /** Horizontal position in board units. */
  x: z.number().finite(),
  /** Vertical position in board units. */
  y: z.number().finite(),
});
export type BoardPosition = z.infer<typeof BoardPositionSchema>;

/**
 * Every board's positions, in one document.
 *
 * `boards` is a map keyed by board id rather than an array, because a board is
 * looked up by name and an array would make "two entries for one board" a
 * state the schema permits and every consumer has to handle.
 */
export const BoardPositionsSchema = z.object({
  $schema: z.literal(BOARD_POSITIONS_SCHEMA_TAG),
  boards: z.record(z.string().min(1), z.array(BoardPositionSchema)),
});
export type BoardPositions = z.infer<typeof BoardPositionsSchema>;

/** The file's name inside the graph directory it is declared in. */
export const BOARD_POSITIONS_FILE = "board-positions.json";

/**
 * The canonical order: by board id, then by note id, both ascending.
 *
 * **This is the mergeability guarantee, not a tidiness pass.** See the module
 * docs: an indented file merges cleanly only while its line order is a
 * function of its contents rather than of the writer's iteration order.
 *
 * `localeCompare` is deliberately NOT used — it is locale-dependent, so two
 * machines could sort the same ids differently and each rewrite the other's
 * file. Plain `<` on the code units is the same everywhere.
 */
export function sortPositions(doc: BoardPositions): BoardPositions {
  const boards: Record<string, BoardPosition[]> = {};
  for (const id of Object.keys(doc.boards).sort()) {
    boards[id] = [...doc.boards[id]!].sort((a, b) => (a.note < b.note ? -1 : a.note > b.note ? 1 : 0));
  }
  return { $schema: doc.$schema, boards };
}

/**
 * Serialise, sorted and indented, with a trailing newline.
 *
 * One function so the writer and the staleness check cannot disagree about
 * what "current" means — the same reason `themeCssVars` is one function.
 */
export function renderPositions(doc: BoardPositions): string {
  return JSON.stringify(sortPositions(doc), null, 2) + "\n";
}

/** An empty document, which is a real state: a folio with no board yet. */
export function emptyPositions(): BoardPositions {
  return { $schema: BOARD_POSITIONS_SCHEMA_TAG, boards: {} };
}

/**
 * Positions whose note is not in `liveNotes` — the orphans.
 *
 * REPORTED rather than removed, because `deletion-requires-confirmation`
 * applies to this file like any other durable artefact: a note id that does
 * not resolve may mean the note was deleted, or that this board was written
 * against a folio whose notes have not been fetched yet. Those are opposite
 * facts and only a caller with more context can tell them apart.
 *
 * The direction matters and is the easy one: an orphan lives in the LAYER, so
 * clearing it is one edit to one file rather than a sweep across notes a
 * person owns.
 */
export function orphanPositions(
  doc: BoardPositions,
  liveNotes: ReadonlySet<string>,
): Array<{ board: string; note: string }> {
  const out: Array<{ board: string; note: string }> = [];
  for (const board of Object.keys(doc.boards).sort()) {
    for (const p of doc.boards[board]!) {
      if (!liveNotes.has(p.note)) out.push({ board, note: p.note });
    }
  }
  return out;
}

/**
 * Place a note, replacing any position it already had on that board.
 *
 * Returns a NEW document rather than mutating, so a caller cannot half-apply a
 * move and write the result. Replacing rather than appending is what keeps
 * "two entries for one note on one board" unrepresentable through this path —
 * the schema permits it, and nothing that goes through here creates it.
 */
export function place(doc: BoardPositions, board: string, pos: BoardPosition): BoardPositions {
  const existing = doc.boards[board] ?? [];
  const next = existing.filter((p) => p.note !== pos.note).concat(pos);
  return sortPositions({ ...doc, boards: { ...doc.boards, [board]: next } });
}

/**
 * Remove a note's position from a board, if it had one.
 *
 * A note with no position is a REAL state — `note-anchor.ts` already declares
 * "attached to nothing", and the owner's ask says a note may be attached to
 * nothing. So this is not a delete of content; it is the note returning to the
 * state it is in before anybody places it.
 */
export function unplace(doc: BoardPositions, board: string, note: string): BoardPositions {
  const existing = doc.boards[board];
  if (existing === undefined) return doc;
  return sortPositions({ ...doc, boards: { ...doc.boards, [board]: existing.filter((p) => p.note !== note) } });
}
