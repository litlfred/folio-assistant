/**
 * `library-links` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/library-links.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the library entries of the
 * content instances, which only the checkout holds. Standing alone,
 * cat-harness has none of it, and `check:cat-harness-standalone` collects
 * every test in that layer. The rest of that file's tests stay there; every
 * path here is composed from ORIGIN_DIR, the directory they were written in,
 * so nothing they read changed.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../cat-harness/schemas/cat-harness.ts";
import { libraryResolver } from "../cat-harness/scripts/lib/library-links.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const INSTANCE = resolve(ORIGIN_DIR, "..", "..");
const REPO = resolve(INSTANCE, "..");
const r = libraryResolver(REPO, INSTANCE);
const entries = (
  JSON.parse(readFileSync(join(INSTANCE, siteDirFor(INSTANCE), "assets", "library", "index.json"), "utf-8")) as {
    entries: { id: string; instance: string; dir: string }[];
  }
).entries;

describe("a library reference resolves only where its target exists", () => {
  it("links every projected item to its viewer page and README", () => {
    // The premise: a resolver over no entries would pass the loop vacuously.
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      const l = r.links(e.id, e.instance);
      // The key the viewer's honourAnchor matches: `<instance>/<id>`.
      expect(l?.viewer, e.id).toBe(`cat-harness/library/${e.instance}/#${encodeURIComponent(`${e.instance}/${e.id}`)}`);
      if (existsSync(join(REPO, e.dir, "README.md"))) expect(l?.readme, e.id).toContain(`/${e.dir}/README.md`);
    }
  });
});
