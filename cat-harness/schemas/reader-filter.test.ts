/**
 * A reader's filter narrows their view and commits nothing.
 *
 * @module schemas/reader-filter.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  NO_READER_FILTER,
  propertyValues,
  readerFilterProblem,
  readerShows,
  visibleOn,
} from "./reader-filter.js";
import { BoardSchema, boardContent } from "./board.js";
import { BoardPositionsSchema, place, renderPositions } from "./board-positions.js";

type Node = { page: string; node: string; kind?: string; properties?: Record<string, string> };

const NODES: Node[] = [
  { page: "one", node: "a", kind: "todo", properties: { status: "open", priority: "high" } },
  { page: "one", node: "b", kind: "todo", properties: { status: "done", priority: "high" } },
  { page: "two", node: "c", kind: "bean", properties: { status: "open", priority: "low" } },
  { page: "two", node: "d", kind: "todo", properties: { status: "open", priority: "low" } },
  // No kind and no properties: the node that must not pass a filter by default.
  { page: "two", node: "e" },
];

const WHOLE = BoardSchema.parse({ $schema: "folio-board/v1", id: "all", title: "All" });
const PAGE_ONE = BoardSchema.parse({
  $schema: "folio-board/v1",
  id: "one",
  title: "Page one",
  filter: { pages: ["one"] },
});

describe("an absent filter filters nothing", () => {
  test("every node the board shows stays shown", () => {
    expect(visibleOn(NODES, NO_READER_FILTER)).toEqual(NODES);
    expect(readerFilterProblem(NO_READER_FILTER)).toBeUndefined();
  });
});

describe("OR within an axis, AND across — the declared filter's logic, deliberately", () => {
  test("two kinds is a union", () => {
    // A reader who has learned what the board's filter means has learned what
    // theirs means. Two logics on one surface is a thing nobody can predict.
    expect(visibleOn(NODES, { kinds: ["todo", "bean"] }).map((n) => n.node)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  test("two properties is an intersection", () => {
    expect(
      visibleOn(NODES, { properties: { status: ["open"], priority: ["high"] } }).map((n) => n.node),
    ).toEqual(["a"]);
  });

  test("values within one property are a union", () => {
    expect(
      visibleOn(NODES, { properties: { priority: ["high", "low"] } }).map((n) => n.node),
    ).toEqual(["a", "b", "c", "d"]);
  });

  test("kind and properties are an intersection too", () => {
    expect(
      visibleOn(NODES, { kinds: ["todo"], properties: { status: ["open"] } }).map((n) => n.node),
    ).toEqual(["a", "d"]);
  });
});

describe("a node that cannot answer has not answered YES", () => {
  test("no kind is excluded by a kind filter", () => {
    // The same total answer `boardShows` gives, and for the same reason.
    expect(readerShows({ kinds: ["todo"] }, { })).toBe(false);
  });

  test("a missing property is excluded by a filter on it", () => {
    expect(readerShows({ properties: { status: ["open"] } }, { kind: "todo" })).toBe(false);
  });

  test("but it survives a filter that does not ask", () => {
    expect(readerShows(NO_READER_FILTER, {})).toBe(true);
  });
});

describe("an EMPTY axis is refused rather than read as `match nothing`", () => {
  test("a kind filter with nothing selected is a problem, named", () => {
    // It reads as "match nothing" to a naive implementation and "no filter" to
    // a careless one, and neither is what a reader who just cleared every
    // checkbox meant.
    expect(readerFilterProblem({ kinds: [] })).toContain("nothing selected");
  });

  test("so is a property filter with nothing selected, and it names WHICH", () => {
    const problem = readerFilterProblem({ properties: { status: [] } });
    expect(problem).toContain("status");
    expect(problem).toContain("nothing selected");
  });

  test("a populated axis is not a problem", () => {
    expect(readerFilterProblem({ kinds: ["todo"], properties: { status: ["open"] } })).toBeUndefined();
  });
});

describe("the reader's filter can only NARROW", () => {
  test("its result is always a subset of what the board shows", () => {
    // Asserted over every filter this fixture can express, rather than
    // trusting the composition in `visibleOn` to stay written that way.
    const shown = boardContent(PAGE_ONE, NODES);
    const filters = [
      NO_READER_FILTER,
      { kinds: ["todo"] },
      { kinds: ["bean"] },
      { properties: { status: ["open"] } },
      { properties: { priority: ["low"] } },
      { kinds: ["todo"], properties: { status: ["done"] } },
    ];
    for (const f of filters) {
      const visible = visibleOn(shown, f);
      for (const n of visible) {
        expect(shown, `${JSON.stringify(f)} produced a node the board does not show`).toContain(n);
      }
      expect(visible.length).toBeLessThanOrEqual(shown.length);
    }
  });

  test("a reader cannot see past the board's declared scope", () => {
    // The board is scoped to page one; a reader filtering for `bean` — which
    // only exists on page two — sees nothing rather than reaching page two.
    const shown = boardContent(PAGE_ONE, NODES);
    expect(visibleOn(shown, { kinds: ["bean"] })).toEqual([]);
    // And the same filter on the WHOLE-folio board does find it, so the
    // emptiness above is the board's scope rather than a broken filter.
    expect(visibleOn(boardContent(WHOLE, NODES), { kinds: ["bean"] }).map((n) => n.node)).toEqual([
      "c",
    ]);
  });

  test("document order is preserved, because the linear floor renders it", () => {
    const visible = visibleOn(NODES, { properties: { status: ["open"] } });
    expect(visible.map((n) => n.node)).toEqual(["a", "c", "d"]);
  });
});

describe("it commits NOTHING — the separation, asserted rather than named", () => {
  test("filtering leaves the board's own declaration byte-identical", () => {
    // Conflating the two filters would make a reader's temporary view edit the
    // board everyone else opens. This is that property, checked.
    const before = JSON.stringify(PAGE_ONE);
    visibleOn(boardContent(PAGE_ONE, NODES), { kinds: ["todo"], properties: { status: ["done"] } });
    expect(JSON.stringify(PAGE_ONE)).toBe(before);
  });

  test("and leaves the layout document byte-identical", () => {
    // The other document a "filter" could plausibly write to. A filtered-out
    // note keeps its position; it is not unplaced.
    let doc = BoardPositionsSchema.parse({ $schema: "folio-board-positions/v1", boards: {} });
    doc = place(doc, "one", "a", { x: 1, y: 2 });
    doc = place(doc, "one", "b", { x: 3, y: 4 });
    const before = renderPositions(doc);
    visibleOn(NODES, { kinds: ["bean"] });
    expect(renderPositions(doc)).toBe(before);
  });

  test("the module holds no file name and no schema tag, which is the design", () => {
    // `window-stack.ts`'s rule: state, not a document. A `$schema` here would
    // be the first step towards somebody persisting it.
    const src = readFileSync(new URL("./reader-filter.ts", import.meta.url), "utf-8");
    expect(src).not.toContain("$schema:");
    expect(src).not.toMatch(/\.json"/);
  });
});

describe("propertyValues populates a control from the corpus", () => {
  test("every value present, sorted, deduplicated", () => {
    // Sorted because an option list that reorders between renders is one a
    // reader cannot build a habit on.
    expect(propertyValues(NODES, "status")).toEqual(["done", "open"]);
    expect(propertyValues(NODES, "priority")).toEqual(["high", "low"]);
  });

  test("a property nothing carries gives an empty list, not a throw", () => {
    expect(propertyValues(NODES, "nonexistent")).toEqual([]);
  });
});
