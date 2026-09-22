/**
 * Where the declared libraries are, for tests that assert about the REAL
 * corpus rather than a fixture.
 *
 * ## Why this exists
 *
 * Bean `frs5` moved the four library entries out of `cat-harness/library/`
 * into `who-iris/library/` and `folio-assistant-sci/library/`, and twenty-three
 * tests broke — every one of them because it had composed the path instead of
 * reading the declaration. They were not wrong to assert about the real
 * corpus; that is the point of those tests, and a fixture cannot make the
 * claim they make. They were wrong to believe they knew where it was.
 *
 * Composing it once here is not the same as composing it twenty-three times:
 * this reads `harness.json` and follows the next move on its own.
 *
 * @module scripts/tests/library-dirs
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { directoriesForGraph } from "../../schemas/cat-harness.js";

/** The instance root these helpers resolve against: `cat-harness`. */
export const INSTANCE = resolve(import.meta.dir, "../..");

/** Every declared library directory, absolute. Empty when none is declared. */
export function libraryDirs(root: string = INSTANCE): string[] {
  return directoriesForGraph(root, "library").filter((d) => existsSync(d));
}

/**
 * Every ingested document, as `{ slug, dir }` across every declared library.
 *
 * A slug alone stopped locating a document when `library` gained a second
 * home, so this returns the directory with it rather than leaving each caller
 * to rebuild one.
 */
export function libraryEntries(root: string = INSTANCE): Array<{ slug: string; dir: string }> {
  const out: Array<{ slug: string; dir: string }> = [];
  for (const lib of libraryDirs(root)) {
    for (const slug of readdirSync(lib).sort()) {
      const dir = join(lib, slug);
      try {
        if (statSync(dir).isDirectory()) out.push({ slug, dir });
      } catch {
        // A directory entry that vanished between readdir and stat is not this
        // helper's business; the tests using it assert about what IS there.
      }
    }
  }
  return out;
}

/**
 * One named document's directory, or `undefined`.
 *
 * Returns `undefined` rather than throwing so a caller can state its own
 * reason — "this test would be vacuous without it" reads better at the
 * assertion than a stack trace from in here.
 */
export function libraryEntry(slug: string, root: string = INSTANCE): string | undefined {
  return libraryEntries(root).find((e) => e.slug === slug)?.dir;
}
