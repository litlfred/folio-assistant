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
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { DECLARATION_FILENAME } from "../../schemas/cat-harness.js";
import { instanceConfigFilename } from "../../schemas/harness-config.js";

/** The name fixtures declare unless they need a specific one. */
export const FIXTURE_INSTANCE = "fixture";

/** `fixture.config.json` — what a fixture instance's config is called. */
export const FIXTURE_CONFIG = instanceConfigFilename(FIXTURE_INSTANCE);

/** Declare `dir` as an instance. Idempotent; safe to call before every write. */
export function declareInstance(dir: string, name: string = FIXTURE_INSTANCE): void {
  writeFileSync(join(dir, DECLARATION_FILENAME), JSON.stringify({ name }), "utf-8");
}

/** Where `dir`'s config goes, once `dir` is a declared instance. */
export function instanceConfigPathIn(dir: string, name: string = FIXTURE_INSTANCE): string {
  return join(dir, instanceConfigFilename(name));
}

/**
 * Declare `dir` and write its config in one call — the shape the fixtures
 * actually wanted. `body` is written verbatim, so a test asserting on an
 * UNPARSEABLE config can still pass `"{ not json"`.
 */
export function writeInstanceConfig(dir: string, body: string, name: string = FIXTURE_INSTANCE): string {
  declareInstance(dir, name);
  const p = instanceConfigPathIn(dir, name);
  writeFileSync(p, body, "utf-8");
  return p;
}
