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
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { instanceRootsIn } from "../../schemas/cat-harness.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const SCRIPT = join("cat-harness", "scripts", "check-navbar-consistency.ts");
const CLIENT = join(REPO, "cat-harness", "docs", "assets", "js", "docs-ui.js");
const DECL = join(REPO, "cat-harness", "cat-harness.json");

/** Run the check, returning its exit status and combined output. */
function run(...args: string[]): { status: number; out: string } {
  const r = spawnSync("bun", ["run", SCRIPT, ...args], {
    cwd: REPO,
    encoding: "utf-8",
  });
  return { status: r.status ?? -1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/**
 * Plant a defect, run, restore — **restoring from a byte copy and not with
 * `git checkout --`**, which in the session that wrote this reverted seven
 * unrelated declarations in one stroke.
 */
function withEdit(file: string, edit: (s: string) => string, body: () => void): void {
  const backup = `${file}.navbar-test.bak`;
  copyFileSync(file, backup);
  try {
    const before = readFileSync(file, "utf-8");
    const after = edit(before);
    expect(after).not.toBe(before); // the plant must actually change something
    writeFileSync(file, after);
    body();
  } finally {
    copyFileSync(backup, file);
    spawnSync("rm", ["-f", backup]);
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
    withEdit(DECL, (s) => s.replace('"icon": "beans"', '"icon": "no-such-glyph"'), () => {
      const { status, out } = run("--check");
      expect(out).toContain("unregistered-tile-icon");
      expect(status).toBe(1);
    });
  });
});

describe("the fallback is measured, not graded", () => {
  test("tiles naming no glyph are reported per instance, with a denominator", () => {
    const { out, status } = run();
    expect(out).toMatch(/tile-without-icon/);
    expect(out).toMatch(/\d+ of \d+ declared tile\(s\) name no icon/);
    // ADVISORY: `glyphFor`'s fallback is deliberate, so this must not fail the
    // gate. What was missing was the COUNT — `ob3m` finding 11 had to be taken
    // by hand off a render.
    expect(status).toBe(0);
  });

  test("it fails under --strict, so the gate can opt in later", () => {
    expect(run("--strict").status).toBe(1);
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
      CLIENT,
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
      withEdit(CLIENT, (s) => s.replace(`var ${name} = {`, `var ${name}_MOVED = {`), () => {
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
  test("it reports the denominator and issues no verdict at a set size of 1", () => {
    const { out, status } = run();
    expect(out).toMatch(/declaring a themes graph\s+\d+ of \d+/);
    expect(out).toContain("who-iris");
    // `v8n5` Done-when #2 generalised: the CHECK iterates the declared set, so
    // instance #2 is covered the day it declares one. What it must NOT do is
    // assert which theme may style a surface — PR #1584 held exactly that for
    // the owner (who-iris owns `webpage` and `publication`, no `sticky`), and a
    // check answering a question the owner reserved is speculation.
    expect(out).toContain("issues no verdict");
    expect(status).toBe(0);
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
    const names = instanceRootsIn(REPO).map((p) => p.split("/").pop());
    expect(names).toContain("folio-assistant"); // the root declares
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
