/**
 * Register core's graph kinds before any test reads a declaration.
 *
 * @module schemas/test-preload
 * @graphNode schema
 *
 * ## ITS ORIGINAL RATIONALE IS SUPERSEDED — measured 2026-09-22, bean `z9ax`
 *
 * Everything below describes the mechanism as it was before #840, and it is
 * kept because it is the evidence, not because it is still the situation.
 * #840 moved the registration trigger to the foot of `cat-harness.ts`, so a
 * reader cannot be called without the kind being registered: the import-order
 * dependency this preload exists to defeat no longer exists.
 *
 * CHECKED rather than assumed, the way the original bug was found — by
 * running the five order-dependent files IN ISOLATION with this preload
 * disabled, since a full run was green by luck the first time. All five pass:
 * `kg-node` 14, `bootstrap-initialization-convention` 7, `qa-results` 19,
 * `todos` 14, `topology-conflicts` 18, zero failures. The full suite with the
 * preload off is green too.
 *
 * It is RETAINED anyway, and that is a judgement rather than a measurement:
 * removing it is a separate behaviour change whose failure mode is a future
 * test that reads a declaration through a leaf without loading a reader —
 * exactly the latent shape that cost a round in the first place. Deleting it
 * is offered as a decision on issue #464's descendant rather than taken here.
 *
 * ## The failure this removed, and the evidence for the mechanism
 *
 * `folio` is registered by CORE as a load-time side effect
 * (`folio-graph-kind.ts`: *"a layer that cannot render must not own the
 * renderable kind"*), so whether `readDeclaration` accepts this instance's
 * declaration depends on whether anything has imported core yet. That is an
 * IMPORT-ORDER dependency, and a test runner chooses its own order.
 *
 * Measured 2026-09-20, the first time this repository declared a folio graph
 * (issue #464). The full suite passed locally — 3198 tests, 0 fail — and CI
 * failed 5 tests in `kg-node.test.ts` on the same commit. The local run was
 * green by LUCK: some earlier file happened to import core first. Running that
 * file alone reproduced CI exactly.
 *
 * Worse, it was not one file. Running each declaration-reading test file in
 * isolation found **five** with the same latent dependency — `kg-node`,
 * `bootstrap-initialization-convention`, `qa-results`, `todos` and
 * `topology-conflicts`. CI had only caught the one its ordering broke first, so
 * fixing that one would have left four to surface on the next shard.
 *
 * ## Why a preload rather than an import in each test file
 *
 * Five explicit imports would work today and leave the class open: the next
 * test file that reads a declaration passes or fails depending on where the
 * runner puts it, which is the local-green / CI-red split that cost this
 * session a full round.
 *
 * **And it does not hide a production module that forgets the import.** This
 * runs only under `bun test`. The gates — `check:declared-paths`,
 * `check:declared-assets`, `check:schema-nodes`, `sync-docs-harness` — are
 * separate `bun run` processes with no preload, and the server has its own
 * entry, so a production module missing the registration still fails there. The
 * preload makes the TEST environment match production, where the entry point
 * has loaded core; it does not excuse production from loading it.
 */
import "./folio-graph-kind.js";
import "./glossary-graph-kind.js";

/*
 * THE SUITE'S DEFAULT TIMEOUT — bean `61n5`.
 *
 * bun's default is 5 s, and this repository has a whole class of tests that
 * walk the entire instance: `buildExport()`, the declaration-filename scan, the
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
