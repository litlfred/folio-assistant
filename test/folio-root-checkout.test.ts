/**
 * `folio-root` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/folio-root.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the root instance's declaration
 * (`folio-assistant.json`), which only the checkout holds. Standing alone,
 * cat-harness has none of it, and `check:cat-harness-standalone` collects
 * every test in that layer. The rest of that file's tests stay there; every
 * path here is composed from ORIGIN_DIR, the directory they were written in,
 * so nothing they read changed.
 */
import { describe, test, expect } from "bun:test";
import { isAbsolute } from "path";
import { INSTANCE_ROOT } from "../cat-harness/scripts/tests/helpers";
import { readDeclaration, repoRootFor } from "../cat-harness/schemas/cat-harness.js";

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
    // The repository by its DECLARED name, not its folder (bean `t5dm`): a
    // worktree or a clone under another name is the same repository.
    expect(readDeclaration(repoRootFor(INSTANCE_ROOT))?.name).toBe("folio-assistant");
  });
});
