/**
 * The standalone fixture is a COPY of real nodes, and must stay one.
 *
 * `test/fixtures/standalone-checkout/` holds core's and sci's node graphs that
 * cat-harness's own tests read, so they pass with cat-harness standing alone
 * (owner, 2026-10-05: fixture the tests rather than grow the standalone
 * baseline; `test-fixture-preload.ts` says when it is scanned). A fixture that
 * drifts from what it copies would let a test pass on a vocabulary nobody
 * declares, so every file is held byte-equal to its source.
 *
 * Standing alone the sources are absent, and that half is reported as not
 * examined rather than passed.
 *
 * @module cat-harness/schemas/standalone-fixture.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const FIXTURE = resolve(import.meta.dir, "..", "test", "fixtures", "standalone-checkout");
const CHECKOUT = resolve(import.meta.dir, "..", "..");

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

const copies = filesUnder(FIXTURE).filter((f) => {
  // The fixture's own declarations are written for it (a `_comment` and only
  // the directories it carries); everything else is a copy.
  const rel = relative(FIXTURE, f).split("/");
  return !(rel.length === 2 && rel[1] === `${rel[0]}.json`);
});
/** The instances the fixture copies from: one directory per instance, as in a checkout. */
const FIXTURE_INSTANCES = readdirSync(FIXTURE).filter((e) => statSync(join(FIXTURE, e)).isDirectory());
const sourcesPresent = FIXTURE_INSTANCES.every((i) => existsSync(join(CHECKOUT, i)));

describe("the standalone fixture copies the real nodes", () => {
  test("it carries the paper vocabulary and core's kinds", () => {
    const rels = copies.map((f) => relative(FIXTURE, f));
    expect(rels).toContain("folio-assistant-sci/content-adapters/paper.json");
    expect(rels.filter((r) => r.includes("/block-kinds/") && r.endsWith(".json")).length).toBe(16);
    expect(rels).toContain("folio-assistant-core/typologies/review-verdicts.json");
    expect(rels).toContain("fhir-harness/typologies/ig-metadata-index.json");
  });

  test.skipIf(!sourcesPresent)("every copy is byte-equal to the file it copies", () => {
    const drifted = copies.filter((f) => {
      const src = join(CHECKOUT, relative(FIXTURE, f));
      return !existsSync(src) || readFileSync(src, "utf-8") !== readFileSync(f, "utf-8");
    });
    // Remedy: copy the real file over the fixture's, or delete the fixture's
    // when its source is gone. A copy is never edited by hand.
    expect(drifted.map((f) => relative(FIXTURE, f))).toEqual([]);
  });

  test.skipIf(!sourcesPresent)("every block-kinds, content-adapters and kinds node the copied instances declare is copied", () => {
    const missing: string[] = [];
    for (const inst of FIXTURE_INSTANCES) {
      for (const dir of ["block-kinds", "content-adapters", "typologies"]) {
        const real = join(CHECKOUT, inst, dir);
        if (!existsSync(real)) continue;
        for (const f of readdirSync(real).filter((x) => x.endsWith(".json"))) {
          if (!existsSync(join(FIXTURE, inst, dir, f))) missing.push(`${inst}/${dir}/${f}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test("the monorepo never scans the fixture", () => {
    // The preload sets the variable only when the checkout holds no
    // vocabulary; here it does, so a test passing here passed on real nodes.
    if (sourcesPresent) expect(process.env.FOLIO_FIXTURE_CHECKOUT).toBeUndefined();
  });
});
