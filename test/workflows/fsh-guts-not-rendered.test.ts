/**
 * No publish workflow's Jekyll `source:` contains the `fsh-guts` trashcan.
 *
 * Bean `folio-assistant-t0i3`: the trashcan exists so that content can be
 * KEPT without being PUBLISHED, and "it is not rendered" is checked rather
 * than reasoned. This is the half of that check that reads this repository's
 * own `.github/workflows/`; it moved here from cat-harness's
 * `scripts/tests/fsh-guts-not-rendered.test.ts` (owner's ruling 2026-10-09,
 * litlfred/folio-assistant#2521, ruling 1(c)), which keeps the half about
 * the declared site directory and the trashcan's own nodes.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { fshGutsDirectory } from "../../cat-harness/schemas/fsh-guts.ts";

/** The index checkout's root — where `.github/workflows/` lives. */
const INDEX = resolve(import.meta.dir, "..", "..");
/** The declared trashcan, resolved rather than spelled (bean 9c7h). */
const GUTS = relative(INDEX, fshGutsDirectory(INDEX));

/** Every `source:` a publish workflow hands to the Jekyll build. */
function jekyllSourceRoots(): { file: string; source: string }[] {
  const out: { file: string; source: string }[] = [];
  const dir = join(INDEX, ".github/workflows");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".yml") || n.endsWith(".yaml"))) {
    readFileSync(join(dir, f), "utf8")
      .split("\n")
      .forEach((line) => {
        const m = /^\s*source:\s*(\S+)\s*$/.exec(line);
        if (m) out.push({ file: f, source: m[1]!.replace(/^\.\//, "").replace(/\/$/, "") });
      });
  }
  return out;
}

describe("fsh-guts stays out of the render pipeline", () => {
  test("at least one workflow declares a Jekyll source, so the check has teeth", () => {
    // If the regex stops matching because the workflows changed shape, every
    // assertion below would pass over an empty list.
    expect(jekyllSourceRoots().length).toBeGreaterThan(0);
  });

  test("no Jekyll source root contains it", () => {
    const offenders = jekyllSourceRoots()
      // A workflow's `source:` is REPOSITORY-relative — `cat-harness/docs`.
      // Resolved against the instance it named nothing, so this filter was
      // vacuous and the assertion passed without teeth.
      .filter(({ source }) => existsSync(join(INDEX, source, GUTS)))
      .map(({ file, source }) => `${file}: source '${source}' contains ${GUTS}/`);
    expect(offenders).toEqual([]);
  });
});
