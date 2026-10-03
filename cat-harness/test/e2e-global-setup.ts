/**
 * Generate, ONCE and before any worker starts, the artefacts the e2e specs
 * read from `_kg/`.
 *
 * @module test/e2e-global-setup
 *
 * Bean `dlqu`. These were three module-level `execFileSync` calls in
 * `kg-viewer.e2e.ts` and `a11y.e2e.ts`. With `workers: 1` a module loaded once
 * and they ran in sequence, so nothing could overlap. With several workers
 * every worker loads the spec module, and the fixture script ran
 * UNCONDITIONALLY from two of them: worker A rewriting
 * `_kg/folio-assistant-i18n-fixture/index.html` while worker B's page was
 * fetching it. A race of that kind does not fail every run, it fails one in
 * N, which is the shape a reviewer calls a flake and re-runs, so it is
 * removed rather than tolerated.
 *
 * The suite still generates what it needs when it is absent, so what is under
 * test is what the deploy emits, never a committed fixture that could agree
 * with the test and disagree with what ships. Only WHERE it happens moved.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artefactStubFor } from "../schemas/cat-harness.ts";

export default function globalSetup(): void {
  // The same resolution both specs use: the instance directory above `test/`.
  const stub = artefactStubFor(join(dirname(fileURLToPath(import.meta.url)), ".."));
  for (const [file, script] of [
    [`_kg/${stub}.jsonld`, "cat-harness/scripts/kg-export.ts"],
    [`_kg/${stub}/index.html`, "cat-harness/scripts/kg-viewer.ts"],
  ] as const) {
    if (!existsSync(file)) execFileSync("bun", ["run", script], { stdio: "inherit" });
  }
  // Unconditional, as it was: the fixture is cheap and must reflect the
  // generator in THIS tree, not one an earlier run left behind.
  execFileSync("bun", ["run", "cat-harness/scripts/tests/kg-viewer-fixture.ts"], { stdio: "inherit" });
}
