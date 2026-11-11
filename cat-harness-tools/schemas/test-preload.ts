/**
 * Register core's graph typologies before any test reads a declaration.
 *
 * @module schemas/test-preload
 * @graphNode schema
 *
 * `folio` is registered by CORE as a load-time side effect
 * (`folio-graph-typology.ts`: *"a layer that cannot render must not own the
 * renderable kind"*), so whether `readDeclaration` accepts a layer's
 * declaration could depend on whether anything had imported core yet — an
 * IMPORT-ORDER dependency, and a test runner chooses its own order.
 *
 * The registration trigger now sits at the foot of `cat-harness.ts`, so a
 * reader cannot be called without the kind being registered and the suite
 * passes without this preload. It is kept as a guard: a future test that
 * reads a declaration through a leaf without loading a reader would otherwise
 * pass or fail depending on where the runner puts it.
 *
 * **It does not hide a production module that forgets the import.** This
 * runs only under `bun test`. The gates — `check:declared-paths`,
 * `check:declared-assets`, `check:schema-nodes`, `sync-docs-harness` — are
 * separate `bun run` processes with no preload, and the server has its own
 * entry, so a production module missing the registration still fails there.
 */
import "./kg/folio-graph-typology.js";

/*
 * THE SUITE'S DEFAULT TIMEOUT — bean `61n5`.
 *
 * bun's default is 5 s, and this repository has a whole class of tests that
 * walk the entire layer: `buildExport()`, the declaration-filename scan, the
 * sweep's profile gate. Timed from one full run on 2026-09-24 (junit reporter),
 * about twenty of them take 1.9–3.2 s ALONE. Under a full `bun test` the
 * slowest measured 4.44 s, and in 1 of 4 full runs it took 5.56 s and failed.
 * The assertion never failed; the timer did. That is what "fails under gates,
 * never alone, never in CI" was.
 *
 * 20 s is more than four times the worst time measured under load. A real hang
 * still fails in seconds, not minutes. Set here, not in `bunfig.toml`, because
 * bun 1.3.11 ignores a `[test] timeout` key there: measured, not assumed, with
 * a 6 s test that still failed at 5 s. A test that needs more still says so
 * with its own third argument, as the Lean and locale-export tests already do.
 */
import { setDefaultTimeout } from "bun:test";

setDefaultTimeout(20_000);
