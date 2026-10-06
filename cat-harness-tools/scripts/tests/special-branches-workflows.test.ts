/**
 * `special-branches` tests that read the aggregate repository's own root —
 * `.github/workflows/` and `.github/actions/` — moved here from
 * `cat-harness/scripts/tests/special-branches.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { resolve, join } from "path";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

/**
 * `special-branches.json` is the one declaration of the harness's special
 * branch names; the shell, Python and workflow files that run inside a folio
 * carry copies. This suite is what makes those copies CHECKED rather than
 * merely duplicated (bean folio-assistant-32f6).
 *
 * It also pins the resolution rule every copy implements — new name if it
 * exists, else legacy if it exists, else new — as a reference function, so
 * a future TypeScript reader (arc 3fva's `qa-store.ts`) has one to match.
 */

interface SpecialBranch {
  id: string;
  shape: "branch" | "family";
  name: string;
  legacy: string[];
  holds: string;
  writers: string[];
  repos: string;
}
interface Declaration {
  branches: SpecialBranch[];
  mirrors: { file: string; id: string }[];
}

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");
const DECL: Declaration = JSON.parse(
  readFileSync(resolve(ORIGIN_DIR, "..", "special-branches.json"), "utf-8"),
);

describe("special-branches — the declaration", () => {

  // Owner, 2026-10-02: `cat/<harness>/<name>` (note on fs43, "rename-script").
  // The harness segment is checked against the instance declarations, so a
  // branch cannot claim a harness that does not exist — the dh4f shape again.
  const HARNESS = /^cat\/([^/]+)\/[^/]/;
  const declaredHarness = (h: string) => existsSync(resolve(REPO, h, `${h}.json`));

  // Bean folio-assistant-9io2 moved the last interim `cat-<name>` row
  // (lake-cache) onto this scheme, so there is no deferred-rename escape
  // hatch any more: every row's `name` IS its `cat/<harness>/<name>`.
  test("every other special branch is cat/<declared harness>/<name>", () => {
    for (const b of DECL.branches.filter((x) => x.id !== "gh-pages")) {
      const m = HARNESS.exec(b.name);
      expect(m, `${b.id}: ${b.name}`).not.toBeNull();
      expect(declaredHarness(m![1]), `${b.id}: harness '${m![1]}' has no ${m![1]}/${m![1]}.json`).toBe(true);
      expect(Object.keys(b), `${b.id}: a pending rename is done by renaming, not by annotating`).not.toContain("pendingRename");
    }
  });
});

describe("special-branches — every copy agrees with the declaration", () => {
  const byId = (id: string) => {
    const b = DECL.branches.find((x) => x.id === id);
    if (!b) throw new Error(`no special branch with id ${id}`);
    return b;
  };
  // The copies under the repository's own `.github/`; every other mirror is
  // checked by the same loop in cat-harness/scripts/tests/special-branches.test.ts.
  for (const m of DECL.mirrors.filter((x) => x.file.startsWith(".github/"))) {
    test(`${m.file} carries the ${m.id} names`, () => {
      const b = byId(m.id);
      const text = readFileSync(resolve(REPO, m.file), "utf-8");
      const bare = (n: string) => n.replace(/\/$/, "");
      // A name can be a substring of another (`lake-cache` is inside both
      // `cat-lake-cache` and `cat/folio-assistant-sci/lake-cache`, and inside
      // `lake-cache.sh`), so `toContain` alone would pass a file that never
      // reads the name. Each name must occur as a whole TOKEN: not preceded
      // by a word character, `-` or `/`, and not followed by one or by `.`.
      const esc = (n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      for (const n of [b.name, ...b.legacy]) {
        expect(new RegExp(`(?<![\\w/-])${esc(bare(n))}(?![\\w.-])`).test(text), `${m.file}: ${bare(n)}`).toBe(true);
      }
    });
  }
});
