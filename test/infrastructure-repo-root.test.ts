/**
 * `infrastructure` tests that read the aggregate repository's own root — the
 * `.gitignore`, the CI workflows and cat-harness-tools' MCP Dockerfile — moved
 * here from `cat-harness/scripts/tests/infrastructure.test.ts` (bean `ho66`),
 * as `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has
 * no such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 *
 * Moved again, from `cat-harness-tools/scripts/tests/` to the checkout's own
 * test home `test/` (bean `7zz1`, owner ruling 2026-10-06 "Top-level
 * instance"): what it reads belongs to the whole checkout, which the root
 * instance declares, not to any one layer — so cat-harness-tools stays green
 * standing alone too.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { INSTANCE_ROOT, REPO_ROOT } from "../cat-harness/scripts/tests/helpers";
import { repoRootFor } from "../cat-harness/schemas/cat-harness.js";
import { folioTemplates } from "../cat-harness/scripts/init-folio";

/**
 * The workflows that run in the paper-assistant container: the platform's
 * own `publish.yml`, and the Lean templates `folio_init` writes into a paper
 * folio (`lean-build.yml`, `blueprint.yml`), which left `.github/workflows/`
 * under bean `52dz` and are read from the templates directory instead.
 */
function containerisedWorkflows(): string[] {
  const lean = folioTemplates("paper")
    .filter((t) => ["lean-build.yml", "blueprint.yml"].some((n) => t.target.endsWith(`/${n}`)))
    .map((t) => t.source);
  expect(lean.length).toBe(2);
  return [join(REPO_ROOT, ".github/workflows/publish.yml"), ...lean];
}

// ── Unified Docker image ───────────────────────────────────────

// The MCP server and its Dockerfile moved to `cat-harness-tools` (bean `w2gr`,
// step 3a); this reads the file there rather than importing anything from it.
const MCP_DOCKERFILE = join(REPO_ROOT, "cat-harness-tools/adapters/mcp-server/Dockerfile");

describe("Unified paper-assistant image", () => {
  test("Dockerfile exists", () => {
    expect(existsSync(MCP_DOCKERFILE)).toBe(true);
  });

  test("Dockerfile includes TeX Live", () => {
    const df = readFileSync(MCP_DOCKERFILE, "utf-8");
    expect(df).toContain("texlive-full");
  });

  test("Dockerfile includes gh CLI", () => {
    const df = readFileSync(MCP_DOCKERFILE, "utf-8");
    expect(df).toMatch(/apt-get\s+install\b[^\n]*\bgh\b/);
    expect(df).toMatch(/\bgh\s+--version\b/);
  });

  test("Dockerfile includes Python requests", () => {
    const df = readFileSync(MCP_DOCKERFILE, "utf-8");
    expect(df).toContain("requests");
  });

  test("no CI workflow regressed to a pre-unification image", () => {
    // The point of this test is preventing a slide back to the old
    // `texlive/texlive` / `latex-ci` images. That applies to every workflow.
    for (const wf of containerisedWorkflows()) {
      const content = readFileSync(wf, "utf-8");
      expect(content).not.toContain("texlive/texlive");
      expect(content).not.toContain("latex-ci");
    }
  });

  test("no containerised workflow hardcodes a folio's image", () => {
    // The platform builds exactly ONE image: `paper-assistant`. A builder
    // image belonging to a folio (its TeX set and its licence are the
    // folio's) must not be named here — publish.yml takes it as a required
    // `builder_image` input instead, so the pipeline stays folio-agnostic.
    //
    // Guard against the specific regression: `publish.yml` used to pin
    // `ghcr.io/litlfred/qou-paper-builder:latest` in four container jobs,
    // and the platform carried that image's Dockerfile — labelled with qou's
    // CC-BY-4.0 licence inside an MIT repo.
    for (const wf of containerisedWorkflows()) {
      const content = readFileSync(wf, "utf-8");
      if (!/^\s*container:/m.test(content)) continue;
      const images = [...content.matchAll(/^\s*image:\s*(\S+)/gm)].map((m) => m[1]);
      for (const img of images) {
        // Either the platform's own image, or an expression the caller fills.
        expect(img.includes("paper-assistant") || img.includes("${{")).toBe(true);
      }
    }
  });

  test("publish.yml is callable by folios and takes builder_image", () => {
    // It is invoked via `uses: .../publish.yml@main`, which requires a
    // `workflow_call` trigger — absent until now, so every such call failed
    // to start.
    const content = readFileSync(join(repoRootFor(INSTANCE_ROOT), ".github/workflows/publish.yml"), "utf-8");
    expect(content).toContain("workflow_call:");
    expect(content).toContain("builder_image:");
  });

  test("deprecated workflows have no automatic triggers", () => {
    for (const wf of ["docker-ci-image.yml", "build-latex-image.yml"]) {
      const content = readFileSync(join(REPO_ROOT, `.github/workflows/${wf}`), "utf-8");
      expect(content).toContain("DEPRECATED");
      expect(content).not.toMatch(/^\s+- cron:/m);
      expect(content).not.toMatch(/push:\s*\n\s+branches:/m);
    }
  });
});
