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
 * 20 s was more than four times the worst time measured under load (now 30 s,
 * below). A real hang still fails in seconds, not minutes. Set here, not in `bunfig.toml`, because
 * bun 1.3.11 ignores a `[test] timeout` key there: measured, not assumed, with
 * a 6 s test that still failed at 5 s. A test that needs more still says so
 * with its own third argument, as the Lean and locale-export tests already do.
 */
import { plugin } from "bun";
import { setDefaultTimeout } from "bun:test";

/**
 * The suite's default, in milliseconds. Raised from 20 s to 30 s by the owner
 * (card Q-TMO-1 A, 2026-11-12) as the corpus the whole-layer tests walk grew.
 */
export const SUITE_TIMEOUT_MS = 30_000;

/*
 * EVERY FILE, not the first one. Measured 2026-11-12 on bun 1.4.4: a
 * `setDefaultTimeout` called here governs only the FIRST test file the run
 * loads; every later file is back at bun's 5 s. Three files of one 5.5 s test
 * each, this preload calling `setDefaultTimeout(30000)`: the first passed, the
 * other two "timed out after 5000ms", with and without `--shard`, and a
 * `beforeAll` here is too late (a test's timeout is fixed when it registers).
 * So the 20 s above had silently stopped applying, and whole-layer tests failed
 * at 5 s in CI (attribution's real-corpus scan, 6.1 s, run 43180658945),
 * flipping NEW and fixed on PRs that touch neither, one failure email each.
 *
 * The one hook that runs before each file's tests register is the loader, so
 * a test file's source is loaded with the call in front of it, on its first
 * line so no line number moves. A file that sets its own default, or a test
 * that passes its own third argument, still overrides it: both run after.
 * `--timeout` on the command line would do the same, but every workflow that
 * runs `bun test` would have to pass it, and bun 1.4.4 ignores a
 * `[test] timeout` key in bunfig.toml.
 */
setDefaultTimeout(SUITE_TIMEOUT_MS);
plugin({
  name: "suite-default-timeout",
  setup(build) {
    build.onLoad({ filter: /\.test\.[cm]?[jt]sx?$/ }, async ({ path }) => {
      const text = await Bun.file(path).text();
      const loader = /\.[cm]?jsx?$/.test(path) ? (path.endsWith("x") ? "jsx" : "js") : path.endsWith("x") ? "tsx" : "ts";
      return {
        contents: `import { setDefaultTimeout as __suiteDefaultTimeout } from "bun:test"; __suiteDefaultTimeout(${SUITE_TIMEOUT_MS}); ${text}`,
        loader,
      };
    });
  },
});
