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

import { DEFAULT_DIRECTORIES, findDeclarationFile, instanceConfigFilename } from "../../schemas/cat-harness.js";

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
  const found = findDeclarationFile(dir);
  if (found !== undefined) {
    const existing = (JSON.parse(readFileSync(join(dir, found), "utf-8")) as { name?: unknown }).name;
    if (typeof existing === "string" && existing.length > 0) return existing;
  }
  const chosen = name ?? basename(dir);
  writeFileSync(
    join(dir, instanceConfigFilename(chosen)),
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
 * actually wanted.
 *
 * ## It MERGES, because the declaration and the config are one file now
 *
 * It used to `declareInstance` and then write `body` to a second path. Since
 * `harness.json` was excised (2026-09-21) both are `<name>.config.json`, so
 * the second write CLOBBERED the declaration it had just made — the fixture
 * ended up with a config and no `directories`, and dozens of tests failed
 * somewhere far from the cause. The same collision hit `init-folio.ts` for the
 * same reason and was fixed the same way.
 *
 * Merging is not a workaround for the collision; it is what one file per
 * instance MEANS. `body` wins on any key it sets, so a test pinning a
 * `contentType` still pins it.
 *
 * An UNPARSEABLE `body` is written verbatim and the declaration is discarded,
 * because several tests pass `"{ not json"` on purpose to exercise the
 * unreadable path. There is nothing to merge into a string that is not JSON,
 * and quietly keeping the declaration would make that fixture readable — which
 * is the opposite of what it was written to test.
 */
export function writeInstanceConfig(dir: string, body: string, name?: string): string {
  const declared = declareInstance(dir, name);
  const p = instanceConfigPathIn(dir, declared);
  let merged: string;
  try {
    const decl = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
    const cfg = JSON.parse(body) as Record<string, unknown>;
    // ONLY the two keys `declareInstance` contributes are carried over —
    // never the whole previous file. Merging everything made a REWRITE
    // impossible: `harness-config.test.ts` restores a fixture by writing its
    // original body back, and a full merge kept the `dependencies` the test
    // had just added, so a later assertion saw three dependencies where the
    // fixture declares two. Keeping the declaration is what the merge is for;
    // keeping the previous CONFIG is a different thing that nobody asked for.
    merged = JSON.stringify({ name: decl.name, directories: decl.directories, ...cfg });
  } catch {
    merged = body;
  }
  writeFileSync(p, merged, "utf-8");
  return p;
}


/**
 * Write a declaration into `dir`, naming the file after the declared name.
 *
 * The helper exists because `<name>.config.json` made the filename a FUNCTION
 * of the content. Under `harness.json` a fixture could write any body to one
 * fixed path; now a body declaring `{"name": "mine"}` must land at
 * `mine.config.json` or discovery will not see it — and a test whose fixture
 * is invisible passes for the wrong reason.
 *
 * `body` may be an object or a JSON string. `name` is required only when the
 * body is deliberately unparseable, which several tests write on purpose to
 * exercise the unreadable-is-not-absent path: there is no name to read, so the
 * caller supplies the stem.
 */
export function writeDeclaration(dir: string, body: unknown, name?: string): string {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  // THE BODY'S NAME WINS, and `name` is only the fallback. The filename stem
  // must equal the declared name or discovery will not see the file — so a
  // body saying `{"name":"x"}` lands at `x.config.json` even when the caller
  // passed a stem, and the caller's stem is for bodies that HAVE no name:
  // deliberately malformed ones, and `{}`.
  let stem: string | undefined;
  {
    try {
      const parsed = JSON.parse(text) as { name?: unknown };
      if (typeof parsed.name === "string" && parsed.name.length > 0) stem = parsed.name;
    } catch {
      // fall through — a nameless unparseable body has no filename this helper
      // could read, so the caller's stem is used, and the throw below fires
      // when there is not one either.
    }
  }
  stem = stem ?? name;
  if (stem === undefined) {
    throw new Error(
      "writeDeclaration: the body declares no `name` and none was supplied, so there is " +
        "no filename for it. Pass `name` explicitly when writing a deliberately broken declaration.",
    );
  }
  const path = join(dir, instanceConfigFilename(stem));
  writeFileSync(path, text, "utf-8");
  return path;
}


/**
 * Write one fixture file, MERGING when it is the instance's declaration.
 *
 * A fixture that hands a helper `{ "<name>.config.json": "{…}" }` used to be
 * writing a file the declaration did not occupy — `harness.json` was a
 * separate path. It is the same path now, so a plain write clobbers the
 * declaration and the fixture silently loses its `directories`. Merging is
 * what one file per instance means; the body wins on every key it sets.
 *
 * Any other path is written verbatim, which is what a fixture map is for.
 */
export function writeFixtureFile(root: string, rel: string, body: string): void {
  const abs = join(root, rel);
  const decl = findDeclarationFile(root);
  if (decl !== undefined && rel === decl) {
    try {
      const existing = JSON.parse(readFileSync(abs, "utf-8")) as Record<string, unknown>;
      const incoming = JSON.parse(body) as Record<string, unknown>;
      // Same rule as `writeInstanceConfig`: carry the DECLARATION across and
      // let the body be the config in full, so a fixture can rewrite rather
      // than only accumulate.
      writeFileSync(
        abs,
        JSON.stringify({ name: existing.name, directories: existing.directories, ...incoming }),
        "utf-8",
      );
      return;
    } catch {
      // Unparseable on either side: write it through, because several fixtures
      // pass a malformed body on purpose.
    }
  }
  writeFileSync(abs, body, "utf-8");
}
