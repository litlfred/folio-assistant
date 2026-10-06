/**
 * Point node discovery at the standalone fixture when the checkout holds no
 * vocabulary — the first test preload, ahead of `test-preload.ts`.
 *
 * @module schemas/test-fixture-preload
 * @graphNode none — a test preload; it sets one environment variable and defines no schema
 *
 * ## Why
 *
 * cat-harness's code types the paper vocabulary, whose nodes live with their
 * owners — document kinds in folio-assistant-core, math kinds and the `paper`
 * adapter in folio-assistant-sci (owner, 2026-10-04 and 2026-10-05). In the
 * monorepo every test sees them. Standing alone, as
 * `check:cat-harness-standalone` runs it, none is there, and 205 tests of
 * cat-harness's own code had nothing to read. The owner chose, 2026-10-05,
 * to fixture the tests rather than grow the standalone baseline.
 *
 * So: when no instance in this checkout declares a `block-kinds` graph,
 * `FOLIO_FIXTURE_CHECKOUT` names `test/fixtures/standalone-checkout/`, which
 * `declared-nodes.ts` then scans beside the real checkout. In the monorepo it
 * is never set, so no test there can pass on the fixture instead of the real
 * nodes; `standalone-fixture.test.ts` holds the copies equal to the real ones.
 *
 * ## Why a separate preload
 *
 * Imports are hoisted, and `test-preload.ts` imports the graph-typology registry,
 * which scans declared `typologies/` graphs at load. The variable must be set
 * before that, so this file imports only the two leaves it needs and runs
 * first (`bunfig.toml`).
 */
import { resolve } from "node:path";

import { ownDeclaredDirectories } from "./declared-nodes";
import { instanceRootsIn } from "./instance-roots";

/** The checkout this preload's harness sits in. */
const CHECKOUT = resolve(import.meta.dir, "..", "..");

const holdsVocabulary = instanceRootsIn(CHECKOUT).some((r) => ownDeclaredDirectories(r, "block-kinds", CHECKOUT).length > 0);
if (!holdsVocabulary && process.env.FOLIO_FIXTURE_CHECKOUT === undefined) {
  process.env.FOLIO_FIXTURE_CHECKOUT = resolve(import.meta.dir, "..", "test", "fixtures", "standalone-checkout");
}
