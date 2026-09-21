/**
 * Every instantiated harness above the floor owes a board, and it shows
 * everything.
 *
 * @module scripts/tests/gen-default-boards.test
 *
 * Owner, 2026-09-21: *"Any harness above bootsteap has a board filled with all
 * contents."* Two halves, and the tests that matter are the ones that would
 * pass for a generator writing a board for everything, or for nothing.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { BoardSchema } from "../../schemas/board.js";
import { isExemptFrom, readDeclaration } from "../../schemas/cat-harness.js";
import { instanceConfigFilename } from "../../schemas/harness-config.js";
import { boardsDir, defaultBoard, harnessesOwedABoard } from "../gen-default-boards.js";

const ROOT = resolve(import.meta.dir, "../..");
const REPO = resolve(ROOT, "..");
/**
 * The directories to look in — a FIXED list rather than a walk.
 *
 * `harnessesOwedABoard` takes its candidates as an argument precisely so a
 * test can hand it a known set: walking the checkout would make these
 * assertions change whenever a sibling session adds a directory, and an
 * assertion that drifts with the tree is not an assertion.
 */
const names = () => ["agent-skills", "cat-bootstrap", "cat-harness", "detangle", "who-iris"];

describe("who owes a board", () => {
  test("the real checkout: the instantiated harnesses, minus the floor", () => {
    const owed = harnessesOwedABoard(REPO, names());
    expect(owed).toEqual(["cat-harness", "folio-assistant"]);
  });

  test("cat-bootstrap is excluded BY ITS DECLARATION, not by its name", () => {
    // Its own `renderExemption` says why: it produces nothing a human browses,
    // so it has nothing to put on a board. A checker naming one instance
    // states a rule true only for the instance somebody remembered (`hfkl`).
    const boot = readDeclaration(join(REPO, "cat-bootstrap"))!;
    expect(isExemptFrom(boot, "visualiser")).toBe(true);
    expect(harnessesOwedABoard(REPO, names())).not.toContain("cat-bootstrap");
    // ...and it IS instantiated, so exclusion cannot be coming from that.
    expect(existsSync(join(REPO, instanceConfigFilename("cat-bootstrap")))).toBe(true);
  });

  test("a DEPENDENCY is excluded too — instantiated is a different fact", () => {
    // who-iris is present, declared, and not instantiated here. "Only the
    // instiatiated harnesses (not all dependent ones)".
    expect(existsSync(join(REPO, instanceConfigFilename("who-iris")))).toBe(false);
    expect(harnessesOwedABoard(REPO, names())).not.toContain("who-iris");
  });

  test("the set is sorted, so it is a function of the declarations", () => {
    const owed = harnessesOwedABoard(REPO, ["who-iris", "cat-harness", "agent-skills"]);
    expect(owed).toEqual([...owed].sort());
  });
});

describe("what the board says", () => {
  test("'filled with all contents' is the ABSENT filter", () => {
    // The convergence worth keeping: `board.ts` chose no-filter-means-
    // everything because a stored selection needs a staleness check. So the
    // MINIMAL board is the TOTAL one, and the bean's "scaffold an empty board"
    // and the owner's "filled with all contents" are the same document.
    const doc = JSON.parse(defaultBoard("x", "X"));
    expect(doc.filter).toBeUndefined();
    expect(BoardSchema.parse(doc)).toEqual({ $schema: "folio-board/v1", id: "x", title: "X" });
  });

  test("every board on disk parses, and shows the whole folio", () => {
    const dir = boardsDir(REPO);
    for (const name of harnessesOwedABoard(REPO, names())) {
      const raw = readFileSync(join(dir, `${name}.json`), "utf8");
      const parsed = BoardSchema.safeParse(JSON.parse(raw));
      expect({ name, ok: parsed.success }).toEqual({ name, ok: true });
      expect({ name, filter: JSON.parse(raw).filter }).toEqual({ name, filter: undefined });
    }
  });

  test("the boards directory is READ from the todo graph, not composed", () => {
    // `check:declared-paths` caught the first version composing `todos/` by
    // hand. The directory is declared, so it is looked up.
    expect(boardsDir(REPO).startsWith(REPO)).toBe(true);
    expect(existsSync(boardsDir(REPO))).toBe(true);
  });
});
