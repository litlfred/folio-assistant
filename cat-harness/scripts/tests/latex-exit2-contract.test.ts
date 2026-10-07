/**
 * Verification of the exit-2 contract for the LaTeX tooling family (folio-assistant-jh2j Finding 1).
 *
 * Each of these scripts must exit with code 2 (could-not-determine) when executed
 * in the platform context where no folio content / manifests exist, or when required
 * input arguments / files are absent:
 * 1. cat-harness/content/pipeline/validate-tex.ts (0 snippets found)
 * 2. cat-harness/content/pipeline/audit-tex-source.ts (0 .md content files found)
 * 3. cat-harness/scripts/headless-render-qc.ts (no paper.json found)
 * 4. cat-harness/scripts/latexmk-compile.sh (missing argument or missing file)
 * 5. cat-harness/content/pipeline/generate-main-tex.ts (no paper manifest found in platform)
 */

import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "../../..");

describe("LaTeX family exit-2 contract (Finding 1 on jh2j)", () => {
  test("validate-tex exits 2 on could-not-determine (no snippets in platform)", () => {
    const res = Bun.spawnSync(["bun", "run", "cat-harness/content/pipeline/validate-tex.ts"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(res.exitCode).toBe(2);
  });

  test("audit-tex-source exits 2 on could-not-determine (no content files in platform)", () => {
    const res = Bun.spawnSync(["bun", "run", "cat-harness/content/pipeline/audit-tex-source.ts"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(res.exitCode).toBe(2);
  });

  test("headless-render-qc exits 2 on could-not-determine (no paper.json in platform)", () => {
    const res = Bun.spawnSync(["bun", "run", "cat-harness/scripts/headless-render-qc.ts"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(res.exitCode).toBe(2);
  });

  test("latexmk-compile.sh exits 2 on usage / missing file", () => {
    const noArgs = Bun.spawnSync(["cat-harness/scripts/latexmk-compile.sh"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(noArgs.exitCode).toBe(2);

    const missingFile = Bun.spawnSync(["cat-harness/scripts/latexmk-compile.sh", "nonexistent-file.tex"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(missingFile.exitCode).toBe(2);
  });

  test("generate-main-tex exits 2 on could-not-determine (no paper manifest in platform)", () => {
    const res = Bun.spawnSync(["bun", "run", "cat-harness/content/pipeline/generate-main-tex.ts"], {
      cwd: ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(res.exitCode).toBe(2);
  });
});
