/**
 * `merge:steward`'s reading of `git merge-tree`'s CONFLICT lines.
 *
 * The steward asks `merge-conflict-patterns` whether each conflicted path is
 * authored, and that answer decides whether a PR is handed back to a person. So
 * a line read as a filename does not merely mis-parse: it matches no declared
 * pattern, and the PR is blamed for a gap in this parser.
 *
 * Measured 2026-10-04 on #1790, where 8 of 11 reported "authored conflicts"
 * were `CONFLICT (modify/delete)` lines being classified as paths. The earlier
 * spot-check that missed it sampled four PRs whose conflicts were all
 * `(content)` and concluded the parser was sound — a filter over a source read
 * as a claim about the source.
 */
import { describe, expect, test } from "bun:test";

import { conflictPath } from "../merge-steward.ts";

describe("conflictPath", () => {
  test("the `Merge conflict in <path>` forms, whatever the kind in parentheses", () => {
    expect(conflictPath("CONFLICT (content): Merge conflict in cat-harness/docs/lsi/index.md")).toBe(
      "cat-harness/docs/lsi/index.md",
    );
    // A submodule conflict has the same shape and is NOT a content conflict —
    // both gitlinks showed up this way on #1790.
    expect(conflictPath("CONFLICT (submodule): Merge conflict in bootstrap-tools")).toBe("bootstrap-tools");
    expect(conflictPath("CONFLICT (add/add): Merge conflict in a/b.json")).toBe("a/b.json");
  });

  test("the modify/delete form, whose path is NOT after `in`", () => {
    // This is the one that was being read as a filename. Note the path comes
    // FIRST, and the line goes on to say "modified in <rev>" — so a parser
    // keying on " in " takes a revision, and one keying on the whole line takes
    // a sentence.
    expect(
      conflictPath(
        "CONFLICT (modify/delete): smart-l1/test/results/README.md deleted in 850186f and modified in refs/tmp/f1790.  Version refs/tmp/f1790 of smart-l1/test/results/README.md left in tree.",
      ),
    ).toBe("smart-l1/test/results/README.md");
  });

  test("an unknown form is `null`, never the raw line", () => {
    // The whole point. `null` makes the caller answer "unknown"; the raw line
    // would make it answer "authored conflict" about somebody's PR.
    expect(conflictPath("CONFLICT (something we have not seen): who knows")).toBeNull();
    expect(conflictPath("Auto-merging cat-harness/docs/lsi/index.md")).toBeNull();
    expect(conflictPath("")).toBeNull();
  });

  test("a path with spaces survives, since the form is terminated by end-of-line", () => {
    expect(conflictPath("CONFLICT (content): Merge conflict in docs/a file.md")).toBe("docs/a file.md");
  });
});
