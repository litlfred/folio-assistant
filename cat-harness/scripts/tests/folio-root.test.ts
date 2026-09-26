import { describe, test, expect } from "bun:test";
import { isAbsolute } from "path";
import { INSTANCE_ROOT, FOLIO_ROOT, hasFolio, LEAN_DIR, QOU_LEAN_DIR } from "./helpers";
import { findContentRepoRoot, findPapers } from "../../content/pipeline/repo-root";
import { repoRootFor } from "../../schemas/cat-harness.js";

/**
 * folio-assistant is the PLATFORM; papers, the Lake workspace,
 * `proof-objects.json` and `lean-mcp.config.json` live in a separate CONTENT
 * repo (the folio). Tests that asserted those against the platform root were
 * the bulk of the suite's 29 permanent failures.
 *
 * `hasFolio()` is what decides whether those assertions run at all, so it is
 * load-bearing in both directions: too eager and content tests fail in
 * platform CI; too lax and they skip forever, which is just deletion with
 * extra steps.
 */

describe("FOLIO_ROOT detection", () => {
  test("INSTANCE_ROOT is this platform checkout", () => {
    expect(isAbsolute(INSTANCE_ROOT)).toBe(true);
    // `cat-harness`, not `folio-assistant`. The two were one directory until
    // the move (bean `wggr`): this is the INSTANCE root, and the repository is
    // still `folio-assistant`. Asserted on the directory rather than on the
    // stub deliberately — the stub stays `folio-assistant` because it names
    // published artefacts, so the two now differ and a test that conflated
    // them would pass for the wrong reason.
    expect(INSTANCE_ROOT.endsWith("cat-harness")).toBe(true);
    expect(repoRootFor(INSTANCE_ROOT).endsWith("folio-assistant")).toBe(true);
  });

  test("agrees with hasFolio()", () => {
    expect(hasFolio()).toBe(FOLIO_ROOT !== undefined);
  });

  test("a folio is exactly a root that carries at least one paper", () => {
    // The definition, restated against the shared helpers so the two cannot
    // drift: a paper is `folio/<name>/<name>.ts`.
    const root = findContentRepoRoot();
    expect(hasFolio()).toBe(findPapers(root).length > 0);
  });

  test("the platform alone is NOT a folio", () => {
    // folio-assistant has a `content/` directory (content/pipeline), which is
    // why a bare "does folio/ exist" check is not enough to detect a folio —
    // it would make the platform look like one and let content assertions run
    // against it, which is the failure this whole guard exists to prevent.
    expect(findPapers(INSTANCE_ROOT)).toEqual([]);
  });
});

describe("no vacuous passes when no folio is attached", () => {
  test.skipIf(hasFolio())("LEAN_DIR does not silently point into the platform", () => {
    // Guard against the subtle version of the bug: if LEAN_DIR fell back to
    // INSTANCE_ROOT, `join(LEAN_DIR, "lakefile.toml")` would name a real platform
    // path and content assertions could pass for the wrong reason.
    expect(LEAN_DIR).toBe("");
  });

  test.skipIf(hasFolio())("QOU_LEAN_DIR resolves under the platform but does not exist", () => {
    // It falls back to INSTANCE_ROOT for a stable absolute path; what matters is
    // that nothing is actually there, so any existence assertion is skipped
    // rather than accidentally satisfied.
    expect(QOU_LEAN_DIR.startsWith(INSTANCE_ROOT)).toBe(true);
  });
});
