/**
 * The positions layer sits on top of notes, and its order is a function of its
 * contents.
 *
 * Bean `6lb8`, on the owner's ruling. Two properties carry the whole design
 * and both are easy to lose silently:
 *
 * - **the arrow runs one way** — a note knows nothing about a board;
 * - **the order is deterministic** — the mergeability the ruling rests on is
 *   worthless the moment a writer emits in iteration order.
 *
 * @module schemas/board-positions.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  BOARD_POSITIONS_SCHEMA_TAG,
  BoardPositionsSchema,
  emptyPositions,
  orphanPositions,
  place,
  renderPositions,
  sortPositions,
  unplace,
  type BoardPositions,
} from "./board-positions.js";

const ROOT = resolve(import.meta.dir, "..");

const doc = (): BoardPositions => ({
  $schema: BOARD_POSITIONS_SCHEMA_TAG,
  boards: {
    landing: [
      { note: "zebra", x: 3, y: 4 },
      { note: "apple", x: 1, y: 2 },
    ],
  },
});

describe("the order is a function of the contents, not of the writer", () => {
  test("boards and notes both sort ascending", () => {
    const d = sortPositions({
      $schema: BOARD_POSITIONS_SCHEMA_TAG,
      boards: { zulu: [{ note: "b", x: 0, y: 0 }], alpha: [{ note: "c", x: 0, y: 0 }, { note: "a", x: 0, y: 0 }] },
    });
    expect(Object.keys(d.boards)).toEqual(["alpha", "zulu"]);
    expect(d.boards["alpha"]!.map((p) => p.note)).toEqual(["a", "c"]);
  });

  test("sorting is IDEMPOTENT — a save of unchanged state is a no-op diff", () => {
    // The property the ruling rests on. A writer that reshuffled would make
    // every save a conflict with every other save, which is the defect the
    // one-line-per-position layout exists to avoid.
    const once = renderPositions(doc());
    expect(renderPositions(sortPositions(doc()))).toBe(once);
  });

  test("insertion order does not reach the output", () => {
    const a: BoardPositions = {
      $schema: BOARD_POSITIONS_SCHEMA_TAG,
      boards: { b: [{ note: "y", x: 1, y: 1 }], a: [{ note: "x", x: 0, y: 0 }] },
    };
    const b: BoardPositions = {
      $schema: BOARD_POSITIONS_SCHEMA_TAG,
      boards: { a: [{ note: "x", x: 0, y: 0 }], b: [{ note: "y", x: 1, y: 1 }] },
    };
    expect(renderPositions(a)).toBe(renderPositions(b));
  });

  test("the sort is not locale-dependent", () => {
    // `localeCompare` would let two machines order the same ids differently
    // and each rewrite the other's file. Asserted on a pair that a locale
    // collation really does reorder.
    const d = sortPositions({
      $schema: BOARD_POSITIONS_SCHEMA_TAG,
      boards: { x: [{ note: "a-b", x: 0, y: 0 }, { note: "ab", x: 0, y: 0 }] },
    });
    expect(d.boards["x"]!.map((p) => p.note)).toEqual(["a-b", "ab"]);
  });
});

describe("one position per note per board, through this path", () => {
  test("placing twice replaces rather than appends", () => {
    let d = place(emptyPositions(), "landing", { note: "n", x: 1, y: 1 });
    d = place(d, "landing", { note: "n", x: 9, y: 9 });
    expect(d.boards["landing"]).toEqual([{ note: "n", x: 9, y: 9 }]);
  });

  test("a note may sit on SEVERAL boards at different places", () => {
    // The property per-note coordinates could not have had without a second
    // vocabulary.
    let d = place(emptyPositions(), "landing", { note: "n", x: 1, y: 1 });
    d = place(d, "review", { note: "n", x: 5, y: 5 });
    expect(d.boards["landing"]).toEqual([{ note: "n", x: 1, y: 1 }]);
    expect(d.boards["review"]).toEqual([{ note: "n", x: 5, y: 5 }]);
  });

  test("unplacing returns the note to having no position, which is a real state", () => {
    const d = unplace(place(emptyPositions(), "landing", { note: "n", x: 1, y: 1 }), "landing", "n");
    expect(d.boards["landing"]).toEqual([]);
  });

  test("unplacing from a board that does not exist is a no-op, not a throw", () => {
    expect(unplace(emptyPositions(), "nope", "n")).toEqual(emptyPositions());
  });
});

describe("orphans are reported, never removed", () => {
  test("a position whose note is gone is listed", () => {
    expect(orphanPositions(doc(), new Set(["apple"]))).toEqual([{ board: "landing", note: "zebra" }]);
  });

  test("and nothing is reported when every note resolves", () => {
    // The other direction: every assertion above passes for a function that
    // reports everything.
    expect(orphanPositions(doc(), new Set(["apple", "zebra"]))).toEqual([]);
  });

  test("the document is not mutated by asking", () => {
    const before = renderPositions(doc());
    orphanPositions(doc(), new Set());
    expect(renderPositions(doc())).toBe(before);
  });
});

describe("the arrow runs ONE way — a note knows nothing about a board", () => {
  test("no note schema carries a position or a board", () => {
    // The structural half of the owner's ruling, asserted against the SOURCE
    // rather than against a value, because the failure it guards is somebody
    // later adding `x`/`y` to a note "for convenience". That would make a
    // content node carry state and give one note two answers on two boards.
    for (const f of ["todo.ts", "carried-note.ts", "landing-sticky.ts", "note-anchor.ts"]) {
      const src = readFileSync(join(ROOT, "schemas", f), "utf-8");
      const fields = [...src.matchAll(/^\s{2}(\w+)[?]?:\s/gm)].map((m) => m[1]!);
      expect({ f, offending: fields.filter((n) => ["x", "y", "board", "position"].includes(n)) }).toEqual({
        f,
        offending: [],
      });
    }
  });

  test("this module imports no note module", () => {
    // The dependency direction, checked at the import level. `board-positions`
    // may not reach DOWN into a note's schema: it names notes by id, and an
    // id needs no type from the layer below.
    const src = readFileSync(join(ROOT, "schemas", "board-positions.ts"), "utf-8");
    const imports = [...src.matchAll(/^import .*? from "([^"]+)";$/gm)].map((m) => m[1]!);
    expect(imports).toEqual(["zod"]);
  });
});

describe("the document declares what it is", () => {
  test("a file without the tag does not validate", () => {
    // Declaration over location, as every other store here does it: a `.json`
    // in the directory is not a positions file unless it says so.
    expect(BoardPositionsSchema.safeParse({ boards: {} }).success).toBe(false);
    expect(BoardPositionsSchema.safeParse(emptyPositions()).success).toBe(true);
  });

  test("an empty document is VALID — a folio with no board yet", () => {
    expect(Object.keys(emptyPositions().boards)).toEqual([]);
  });

  test("a non-finite coordinate is refused", () => {
    // `NaN` and `Infinity` survive `z.number()` and serialise to `null`, which
    // reads back as a position that is not a position.
    const bad = { $schema: BOARD_POSITIONS_SCHEMA_TAG, boards: { a: [{ note: "n", x: NaN, y: 0 }] } };
    expect(BoardPositionsSchema.safeParse(bad).success).toBe(false);
  });

  test("it renders indented, one position per line", () => {
    // The mergeability layout, asserted rather than assumed: minified, any
    // change on both sides of a merge is a whole-file conflict.
    const out = renderPositions(doc());
    expect(out.split("\n").filter((l) => l.includes('"note"')).length).toBe(2);
    expect(out.endsWith("\n")).toBe(true);
  });
});
