/**
 * Register core's graph kinds before any test reads a declaration.
 *
 * @module schemas/test-preload
 * @graphNode schema
 *
 * ## The failure this removes
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
