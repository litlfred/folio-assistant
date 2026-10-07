/**
 * `library-withheld` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/library-withheld.test.ts` (bean `7zz1`, owner
 * ruling 2026-10-06 "Top-level instance"): each reads who-iris's withheld
 * list, which only the checkout holds. Standing alone, cat-harness has none of
 * it, and `check:cat-harness-standalone` collects every test in that layer.
 * The rest of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { withheldPaths } from "../cat-harness/scripts/lib/withheld.ts";
import { siteDirFor } from "../cat-harness/schemas/cat-harness.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");

const INSTANCE = resolve(ORIGIN_DIR, "..", "..");
const REPO = resolve(INSTANCE, "..");
/** READ, never spelled: `site-dir-single-answer` is a gate. */
const SITE_LIBRARY = join(INSTANCE, siteDirFor(INSTANCE), "assets", "library");

describe("the committed viewer data honours who-iris's list", () => {
  const lib = join(REPO, "who-iris", "library");
  const slugs = existsSync(lib) ? withheldPaths(lib).filter((p) => !p.includes(".")) : [];

  test("the list names at least one entry — else this half proves nothing", () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  for (const slug of slugs) {
    test(`${slug}: flagged, no prose excerpt, no avatar`, () => {
      const index = JSON.parse(readFileSync(join(SITE_LIBRARY, "index.json"), "utf-8")) as {
        entries: { id: string; withheld?: string; avatar?: unknown }[];
      };
      const e = index.entries.find((x) => x.id === slug);
      expect(e?.withheld).toBeTruthy();
      expect(e?.avatar).toBeUndefined();

      const data = JSON.parse(readFileSync(join(SITE_LIBRARY, "entries", `${slug}.json`), "utf-8")) as {
        blocks: { kind: string; content: string | null }[];
      };
      expect(data.blocks.filter((b) => b.kind === "prose" && b.content !== null)).toEqual([]);
      expect(existsSync(join(SITE_LIBRARY, "avatars", "who-iris", `${slug}.png`))).toBe(false);
    });
  }
});
