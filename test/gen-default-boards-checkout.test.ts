/**
 * `gen-default-boards` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/gen-default-boards.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads every instantiated
 * harness in the checkout, or the root `todos/` graph, which only the checkout
 * holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { BoardSchema } from "../cat-harness/schemas/board.js";
import { isExemptFrom, readDeclaration } from "../cat-harness/schemas/cat-harness.js";
import { instanceConfigFilename } from "../cat-harness/schemas/harness-config.js";
import { boardsDir, harnessesOwedABoard } from "../cat-harness/scripts/gen-default-boards.js";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const ROOT = resolve(ORIGIN_DIR, "../..");
const REPO = resolve(ROOT, "..");
/**
 * The directories to look in — a FIXED list rather than a walk.
 *
 * `harnessesOwedABoard` takes its candidates as an argument precisely so a
 * test can hand it a known set: walking the checkout would make these
 * assertions change whenever a sibling session adds a directory, and an
 * assertion that drifts with the tree is not an assertion.
 */
const names = () => ["agent-skills", "bootstrap", "cat-harness", "detangle", "who-iris"];

describe("who owes a board", () => {
  test("the real checkout: the instantiated harnesses, minus the floor", () => {
    // who-iris joined on 2026-09-21, when the owner instantiated it — the
    // board is a CONSEQUENCE of that declaration, not a second decision. This
    // list is the real answer for this checkout and is meant to change when
    // the checkout does; it fails loudly rather than drifting quietly.
    const owed = harnessesOwedABoard(REPO, names());
    expect(owed).toEqual(["cat-harness", "folio-assistant", "who-iris"]);
  });

  test("bootstrap is excluded BY ITS DECLARATION, not by its name", () => {
    // Its own `renderExemption` says why: it produces nothing a human browses,
    // so it has nothing to put on a board. A checker naming one instance
    // states a rule true only for the instance somebody remembered (`hfkl`).
    const boot = readDeclaration(join(REPO, "bootstrap"))!;
    expect(isExemptFrom(boot, "visualiser")).toBe(true);
    expect(harnessesOwedABoard(REPO, names())).not.toContain("bootstrap");
    // ...and it IS instantiated, so exclusion cannot be coming from that.
    expect(existsSync(join(REPO, instanceConfigFilename("bootstrap")))).toBe(true);
  });
});

describe("what the board says", () => {

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
