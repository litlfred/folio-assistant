/**
 * `check:navbar-consistency` — the owner's navbar QA check, and the two
 * namespaces it must not conflate.
 *
 * Owner, 2026-09-30: *"i want QA check that each harness LHS navbar header and
 * menus are themed appropriately and has consitent layout/icon/navgation"*.
 *
 * ## What these tests hold, and why each one cost something
 *
 * **The two namespaces are separate.** An instance's `icon` is an id into its
 * own `images` list; a `directories[].tile.icon` is a name in the client's
 * glyph registry. The first draft of the checking script treated `icon: "mark"`
 * as a registry name and would have reported `cat-harness`'s navbar mark as
 * falling back to the generic net — it resolves perfectly, to
 * `/assets/img/icons/cat-mark.svg`. A test per family, so a future merge cannot
 * re-collapse them.
 *
 * **Refusal is not a pass.** Rename either registry literal and the script must
 * exit **2**, not report the glyph families clean. Bean `dh4f`:
 * could-not-determine is never rendered as green, and a registry read as empty
 * would satisfy every family below.
 *
 * **The enumerator is `instanceRootsIn`, not a glob.** A per-directory `<dir>/<dir>.json` glob gets
 * this wrong in BOTH directions — it misses the repository root, which
 * declares, and it counts `beans/beans.json`, `interaction/` and `todos/`,
 * which are graph declarations under a different schema. That is a 19 where the
 * answer is 17, and a denominator that is wrong by two is a denominator a
 * reader cannot use.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import { instanceRootsIn, siteDirFor } from "../../../cat-harness/schemas/cat-harness.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const SCRIPT = join("cat-harness-tools", "scripts", "check-navbar-consistency.ts");
// Resolved, not spelled out — `check:site-root` rejects a literal output site
// root in any source file, and a test is a source file. `siteDirFor` answers
// relative to the instance, so the instance root is joined in front of it.
const CLIENT_INSTANCE = join(REPO, "cat-harness");
const CLIENT = join(CLIENT_INSTANCE, siteDirFor(CLIENT_INSTANCE), "assets", "js", "docs-ui.js");
// The row's registry, `ROW_GLYPHS`, lives beside it (beans `lhvt`, `9rq1`).
const ROW_CLIENT = join(dirname(CLIENT), "navbar-row.js");
const DECL = join(REPO, "cat-harness", "cat-harness.json");
// The ROOT instance holds the `beans` tile since placement PR0 (bean `ejye`).
const ROOT_DECL = join(REPO, "folio-assistant.json");

/** Run the check, returning its exit status and combined output. */
function run(...args: string[]): { status: number; out: string } {
  const r = spawnSync("bun", ["run", join(REPO, SCRIPT), ...args], {
    cwd: CWD,
    encoding: "utf-8",
  });
  return { status: r.status ?? -1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/**
 * The root the script runs against. The repository itself, except inside
 * {@link withEdit}, where it is a planted copy.
 */
let CWD = REPO;

/**
 * Plant a defect in a COPY of the tree, run against the copy, discard it.
 *
 * It edited the real declaration and restored it from a byte copy until bean
 * `dlqu`. That was safe only while test files ran one at a time: under
 * `bun test --parallel` every other worker reads `cat-harness/cat-harness.json`
 * and `folio-assistant.json` too, and one that read them inside the window
 * saw `"icon": "no-such-image"` — measured, three MCP tool-group tests and two
 * implementing-path tests failed that way, a different set per run, which is
 * the shape a reviewer calls a flake. The defect is planted where no other
 * reader can see it instead.
 *
 * The copy is cheap because almost all of it is symlinks. The directories that
 * must be REAL are the root, every instance root (`instanceRootsIn` takes
 * `isDirectory()`, which is false for a symlink, so a symlinked instance would
 * silently vanish from the scan) and every directory on the way to an edited
 * file; the edited file itself is a copy. Everything else links back.
 */
function withEdit(file: string, edit: (s: string) => string, body: () => void): void {
  const target = relative(REPO, file);
  const realDirs = new Set<string>([""]);
  for (const r of instanceRootsIn(REPO)) realDirs.add(relative(REPO, r));
  for (let d = dirname(target); d !== "." && d !== ""; d = dirname(d)) realDirs.add(d);

  const tmp = mkdtempSync(join(tmpdir(), "navbar-plant-"));
  const build = (rel: string): void => {
    mkdirSync(join(tmp, rel), { recursive: true });
    for (const name of readdirSync(join(REPO, rel))) {
      const child = rel === "" ? name : join(rel, name);
      if (realDirs.has(child)) build(child);
      else if (child === target) {
        const before = readFileSync(file, "utf-8");
        const after = edit(before);
        expect(after).not.toBe(before); // the plant must actually change something
        writeFileSync(join(tmp, child), after);
      } else symlinkSync(join(REPO, child), join(tmp, child));
    }
  };
  try {
    build("");
    CWD = tmp;
    body();
  } finally {
    CWD = REPO;
    rmSync(tmp, { recursive: true, force: true });
  }
}

describe("the repository is clean under the blocking families", () => {
  test("`--check` passes as committed", () => {
    const { status, out } = run("--check");
    expect(out).toContain("instances read");
    expect(status).toBe(0);
  });

  test("every count in the report carries its denominator", () => {
    const { out } = run();
    // "1 of 17", never a bare "1". A count without a denominator is the failure
    // `audit-coverage` was built to end, and this report is read the same way.
    expect(out).toMatch(/\.\.\.with a resolving icon\s+\d+ of \d+/);
  });
});

describe("the two namespaces stay separate", () => {
  test("an unloadable declaration REFUSES and is not re-judged here", () => {
    // This test is why the script has no `dangling-instance-icon` family.
    // Planting one gets the SCHEMA's error — `readDeclaration` already rejects
    // an `icon` naming no declared image, and names every valid id while doing
    // it. So the check must refuse (2), not duplicate that verdict as a finding
    // (1), and not crash with a stack trace either.
    withEdit(DECL, (s) => s.replace('"icon": "mark"', '"icon": "no-such-image"'), () => {
      const { status, out } = run("--check");
      expect(status).toBe(2);
      expect(out).toContain("cannot read the declaration");
      expect(out).not.toContain("dangling-instance-icon");
      // The instances it DID read must not be reported as a clean sweep.
      expect(out).not.toContain("✓ no finding");
    });
  });

  test("a resolving instance icon is NOT reported as a glyph miss", () => {
    // `mark` is an `images` id, not a `TILE_GLYPHS` name. Conflating the two
    // was the first draft's defect; this is the test that would have caught it.
    const { out } = run();
    expect(out).not.toContain("unregistered-tile-icon");
    expect(out).not.toMatch(/dangling-instance-icon/);
  });

  test("an unregistered TILE icon fails (a name absent from the registry)", () => {
    withEdit(ROOT_DECL, (s) => s.replace('"icon": "beans"', '"icon": "no-such-glyph"'), () => {
      const { status, out } = run("--check");
      expect(out).toContain("unregistered-tile-icon");
      expect(status).toBe(1);
    });
  });
});

describe("the fallback is measured, not graded", () => {
  // PLANTED, not read off the corpus: since `ob3m` finding 11 every declared
  // tile names a glyph, so a test that waited for the real corpus to have a
  // miss would pass by finding nothing to report.
  // The tools tile is `{ "icon": "tools" }` since bean `ob3m` finding 6 took
  // its redundant `title` out (the kind's display name is the one name), so
  // the plant empties the tile rather than dropping one of two fields.
  const unnamed = (src: string): string => src.replace(/("tile": \{)\s*"icon": "tools"\s*\}/, "$1}");

  test("tiles naming no glyph are reported per instance, with a denominator", () => {
    withEdit(DECL, unnamed, () => {
      const { out, status } = run();
      expect(out).toMatch(/tile-without-icon: cat-harness/);
      expect(out).toMatch(/\d+ of \d+ declared tile\(s\) name no icon/);
      // ADVISORY: `glyphFor`'s fallback is deliberate, so this must not fail
      // the gate. What was missing was the COUNT — `ob3m` finding 11 had to be
      // taken by hand off a render.
      expect(status).toBe(0);
    });
  });

  test("it fails under --strict, so the gate can opt in later", () => {
    withEdit(DECL, unnamed, () => expect(run("--strict").status).toBe(1));
  });

  test("the real corpus has no declared tile on the fallback", () => {
    expect(run().out).not.toContain("tile-without-icon");
  });

  test("the declared-tile denominator is NOT the rendered one", () => {
    // `ob3m` finding 11 says 18 of 20, counted on a render whose panel also
    // holds page-derived tiles. This check sees only `directories[].tile`, so
    // its denominator is smaller and the two must never be quoted as one
    // number. If this ever reads 20, somebody has widened the scan and the
    // report's own caveat needs rewriting with it.
    const { out } = run();
    const m = out.match(/declared tiles\s+(\d+)/);
    expect(m).not.toBeNull();
    expect(Number(m?.[1])).toBeLessThan(20);
  });
});

describe("one artefact, one glyph, across both registries", () => {
  test("a row/tile disagreement fails", () => {
    withEdit(
      ROW_CLIENT,
      (s) => s.replace("beans: BEANS_GLYPH, processes:", "beans: NET_GLYPH, processes:"),
      () => {
        const { status, out } = run("--check");
        expect(out).toContain("registry-disagreement");
        expect(status).toBe(1);
      },
    );
  });
});

describe("could-not-determine is never green", () => {
  for (const name of ["TILE_GLYPHS", "ROW_GLYPHS"]) {
    test(`a renamed ${name} REFUSES (exit 2), it does not pass`, () => {
      withEdit(name === "ROW_GLYPHS" ? ROW_CLIENT : CLIENT, (s) => s.replace(`var ${name} = {`, `var ${name}_MOVED = {`), () => {
        const { status, out } = run("--check");
        expect(status).toBe(2);
        expect(out).toContain("could not locate");
        // The distinction that matters: not merely non-zero, but a DIFFERENT
        // non-zero from a finding, so a reader can tell "blind" from "failed".
        expect(status).not.toBe(1);
      });
    });
  }
});

describe("the themes set is iterated, not hardcoded", () => {
  test("it reports the denominator and NAMES the whole set", () => {
    const { out, status } = run();
    expect(out).toMatch(/declaring a themes graph\s+\d+ of \d+/);
    // Both, now. This asserted only `who-iris` and the string "issues no
    // verdict" until 2026-09-30, when `smart-trust` declared a themes graph
    // and made the set 2 — so the check stopped printing that NOTE and the
    // test went red on the real corpus. Bean `7h3u`.
    //
    // The test was RIGHT to fail. Its name said "at a set size of 1", and the
    // premise expired; asserting a branch that no longer fires would have been
    // a test passing over a state the repository has left.
    //
    // `smart-base`, not `smart-trust`, since stage D of the smart-* separation
    // (#1767): the WHO SMART theme is the template's, so it moved with the
    // template to smart-base. The set is still 2.
    expect(out).toContain("who-iris");
    expect(out).toContain("smart-base");
    expect(status).toBe(0);
  });

  test("the size-1 NOTE is gone, and its PROMISE is NOT yet kept", () => {
    // The NOTE said: "At a set size of 1 there is nothing to COMPARE, so this
    // reports the denominator and issues no verdict. The set is iterated
    // rather than hardcoded, so instance #2 is COVERED THE DAY IT DECLARES
    // ONE."
    //
    // That day arrived. The NOTE correctly stopped printing — and nothing took
    // its place: past the `themed.length <= 1` branch the script carries a
    // comment and no comparison, so `v8n5` Done-when #2 ("a surface must not
    // fall back to the platform default for an instance that declares its own
    // theme") is still unimplemented.
    //
    // A NOTE disappearing is not coverage arriving. This test pins the gap so
    // it cannot be mistaken for closed by the absence of the excuse — bean
    // `1xhc`'s shape. It is deliberately NOT a failing test: implementing the
    // comparison means deciding which theme may style a surface, and PR #1584
    // held exactly that for the owner.
    const { out } = run();
    expect(out).not.toContain("issues no verdict");
    expect(out).not.toContain("covered the day it declares one");
  });

  test("the themes denominator is read from `graphKinds`, not a guessed key", () => {
    // Reading it as `graphs` measured `0 of 20` over a corpus where the answer
    // is 1. If this ever reads 0, the key has been guessed again.
    const { out } = run();
    const m = out.match(/declaring a themes graph\s+(\d+) of/);
    expect(m).not.toBeNull();
    expect(Number(m?.[1])).toBeGreaterThan(0);
  });
});

describe("the denominator comes from the declared enumerator", () => {
  test("`instanceRootsIn` includes the repository root and excludes graph declarations", () => {
    const roots = instanceRootsIn(REPO).map((p) => resolve(p));
    // The root declares. Compared as a PATH: its basename is whatever the
    // operator named the checkout, and an agent worktree is never called
    // `folio-assistant` (bean `8zsb`).
    expect(roots).toContain(REPO);
    const names = roots.filter((p) => p !== REPO).map((p) => p.split("/").pop());
    for (const notAnInstance of ["beans", "interaction", "todos"]) {
      expect(names).not.toContain(notAnInstance);
    }
  });

  test("the report's denominator equals what the enumerator returns", () => {
    const n = instanceRootsIn(REPO).length;
    const { out } = run();
    expect(out).toMatch(new RegExp(`instances read\\s+${n}\\b`));
  });
});
