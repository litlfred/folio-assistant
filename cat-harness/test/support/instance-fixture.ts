/**
 * Make a temp directory a real INSTANCE, so its config is resolvable.
 *
 * ## Why fixtures had to change at all
 *
 * The config filename is `<instance>.config.json` as of 2026-09-20, derived
 * from the `name` in the instance's own `harness.json`. A bare temp directory
 * has no declaration, so it has no name, so it has no config filename — and
 * `resolveHarnessConfigPath` correctly answers `undefined` rather than
 * guessing a global one back into existence.
 *
 * Twenty fixtures wrote a config into a directory that declared nothing.
 * Adding the declaration is the honest fix rather than the expedient one: a
 * directory pretending to be a configured instance ought to say that it is
 * one, which is this repository's own declaration-over-location rule applied
 * to its test material.
 *
 * @module test/support/instance-fixture
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { DECLARATION_FILENAME, DEFAULT_DIRECTORIES } from "../../schemas/cat-harness.js";
import { instanceConfigFilename } from "../../schemas/harness-config.js";

/**
 * The fallback name, used only where a fixture has no directory of its own.
 *
 * Every helper below defaults to `basename(dir)` instead, and that is not a
 * convenience — it is the fix for the defect that made this file necessary
 * twice. A shared constant gives every instance in a dependency-tree fixture
 * the SAME name, so `<name>.config.json` collides and the outward walk finds
 * a sibling's config rather than its own. Naming each after its directory
 * makes them distinct for free, and makes the fixture read the way the real
 * thing does: `dep-a/` declares `dep-a`.
 */
export const FIXTURE_INSTANCE = "fixture";

/** `fixture.config.json` — the fallback name's config. */
export const FIXTURE_CONFIG = instanceConfigFilename(FIXTURE_INSTANCE);

/** `<basename>.config.json` for a directory — what these helpers actually write. */
export function configNameFor(dir: string): string {
  return instanceConfigFilename(basename(dir));
}

/**
 * Declare `dir` as an instance, and return the name it ends up with.
 *
 * NON-DESTRUCTIVE. A fixture that already wrote its own `harness.json` —
 * several do, to pin a specific name the assertions then check — keeps it.
 * Overwriting would have silently renamed the instance under the test that
 * was about its name, which is the kind of helper that makes a suite lie.
 */
export function declareInstance(dir: string, name?: string): string {
  const decl = join(dir, DECLARATION_FILENAME);
  if (existsSync(decl)) {
    try {
      const existing = (JSON.parse(readFileSync(decl, "utf-8")) as { name?: unknown }).name;
      if (typeof existing === "string" && existing.length > 0) return existing;
    } catch {
      // unparseable: fall through and write one, so the fixture is usable
    }
  }
  const chosen = name ?? basename(dir);
  writeFileSync(
    decl,
    JSON.stringify({ name: chosen, directories: conventionalDirectories(dir) }),
    "utf-8",
  );
  return chosen;
}

/**
 * The conventional set, filtered to what is actually THERE.
 *
 * Giving a fixture a NAME must not silently withdraw its directories, and
 * `{ "name": "x" }` alone does exactly that: `directories` defaults to `[]`,
 * and `ownDirectories` applies `DEFAULT_DIRECTORIES` only to a root with **no
 * declaration at all**. So the minimal honest declaration — the one that adds
 * a name and changes nothing else — emptied `resolveSkillDirs` for every
 * fixture that had a `skills/`, and the tests that noticed were the ones
 * asserting an overlay rather than the ones asserting a config path.
 *
 * Existence-filtered for the reason `resolveDirectories` gives on the same
 * list: a declared-but-absent directory is the `dh4f` defect, where every
 * consumer scans nothing and reports a clean run over it.
 *
 * REDUNDANT as of bean `rday`, and kept anyway. `ownDirectories` now seeds the
 * conventional set unconditionally, so a declaration no longer withdraws it and
 * this function compensates for nothing. It stays because it costs a walk of
 * eight paths and keeps a fixture's declaration explicit about what that
 * fixture owns — and because removing it belonged in neither of the two
 * commits whose measurements are about something else.
 *
 * This is a fixture convenience, and it is NOT what `folio_init` does — a
 * real instance declares what it owns, deliberately, once.
 */
function conventionalDirectories(dir: string): unknown[] {
  return DEFAULT_DIRECTORIES.filter((d) => existsSync(join(dir, d.path))).map((d) => ({ ...d }));
}

/** Where `dir`'s config goes, once `dir` is a declared instance. */
export function instanceConfigPathIn(dir: string, name: string = basename(dir)): string {
  return join(dir, instanceConfigFilename(name));
}

/**
 * Declare `dir` and write its config in one call — the shape the fixtures
 * actually wanted. `body` is written verbatim, so a test asserting on an
 * UNPARSEABLE config can still pass `"{ not json"`.
 */
export function writeInstanceConfig(dir: string, body: string, name?: string): string {
  const declared = declareInstance(dir, name);
  const p = instanceConfigPathIn(dir, declared);
  writeFileSync(p, body, "utf-8");
  return p;
}
