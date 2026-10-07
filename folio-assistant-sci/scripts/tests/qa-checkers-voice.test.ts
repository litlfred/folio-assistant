/**
 * `qa-checkers-voice` tests whose subject is folio-assistant-sci's
 * contribution — the `milnorlink` entry in this instance's library — moved
 * here from `cat-harness/scripts/tests/qa-checkers-voice.test.ts` (bean
 * `ho66`). The code under test is cat-harness's, imported DOWN; what it is
 * held against is this instance's, so standing alone cat-harness has nothing
 * for these to read. The rest of that file's tests stay there.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync } from "fs";
import { join } from "path";
import { libraryEntry } from "../../../cat-harness/scripts/tests/library-dirs.ts";
import { checkEditorializing } from "../../../cat-harness/content/pipeline/qa-checkers-voice.ts";
import { SCI_ROOT } from "./sci-consumer";

// ── b7yo: the two false positives that survived the profile axis ────
//
// Both were found by running the real sweep over `content/docs/`
// (a document-profile corpus) after PR #256 made the profile gate fire.
// Neither is a scoping problem, so no gate change clears them — the
// criteria themselves over-match.

describe("checkEditorializing — proof economy is not an opinion (bean 2t41)", () => {

  test("the exemplar scores exactly ONE finding — not zero", () => {
    // The gate this change was verified against, and the direction that would
    // have meant over-correcting. A criterion that never fires on its own
    // exemplar has stopped measuring anything; the survivor is p194's
    // "Unfortunately", which is a real finding.
    // READ from the declaration. `milnorlink` went to `folio-assistant-sci/` in
    // bean `frs5` — it is not an IRIS item — and `readdirSync` on the old path
    // throws, which is at least loud; a checker counting zero hits over a
    // directory that is not there would have been worse, because the
    // assertion is a count.
    // Asked of THIS instance: the default root is cat-harness, whose corpus
    // reached sci only through the checkout around it.
    const entry = libraryEntry("milnorlink", SCI_ROOT);
    expect(entry, "milnorlink is not in any declared library").toBeDefined();
    const dir = join(entry!, "sections");
    let hits = 0;
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".md")) continue;
      hits += checkEditorializing(join(dir, f)).hits.length;
    }
    expect(hits).toBe(1);
  });
});
