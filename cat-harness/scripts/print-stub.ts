#!/usr/bin/env bun
/**
 * Print this instance's artefact stub, for a workflow to capture.
 *
 * @module scripts/print-stub
 *
 * ## Why this is a file and not an inline `bun -e`
 *
 * It WAS an inline eval, three times over — once in `docs-site.yml` and twice
 * in `feature-staging.yml`, each spelling out the same
 * `artefactStub(readDeclaration(...))` composition inside a YAML string.
 *
 * All three broke the moment this repository first declared a folio graph
 * (issue #464), with `unknown graph kind "folio"`. The kind is registered by
 * CORE as a load-time side effect, and an inline eval imports exactly the one
 * module it names — so there is nowhere for the registration to happen and no
 * obvious place to add it. A YAML string is also the one place a missing import
 * is invisible: no typechecker reads it, no linter, and the failure arrives as
 * a red workflow rather than at the keyboard.
 *
 * As a script it gets the import, it gets checked by `tsc` and `eslint` like
 * everything else, and the composition is written once instead of three times.
 *
 * Prints the stub and nothing else, so `STUB=$(bun run …)` captures it cleanly.
 */
import { artefactStub, readDeclaration } from "../schemas/cat-harness.js";

const root = process.argv[2] ?? "./cat-harness";
const decl = readDeclaration(root);
if (!decl) {
  console.error(`print-stub: no declaration at ${root}`);
  process.exit(1);
}
console.log(artefactStub(decl));
