/**
 * QA on init (bean `tw61`, the owner's "setup proper QA on init"): a folio
 * scaffolded by init-folio is swept by the command its own AGENTS.md
 * documents, the verdicts land at the INSTANCE root, and the preview's QA
 * summary reads them, including for a folio kept in a subfolder, as the
 * ojcx run's `handbook/` is.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { initFolio } from "../init-folio";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("a new folio is QA'd from its first commit", () => {
  test("AGENTS.md documents the sweep and where its verdicts go", () => {
    const root = mkdtempSync(join(tmpdir(), "init-qa-doc-"));
    dirs.push(root);
    initFolio({ targetDir: root, contentType: "document", slug: "qa-doc", title: "QA Doc", authors: ["A"], link: "sibling", assistantPath: "folio-assistant", skipVcs: true });
    const agents = readFileSync(join(root, "AGENTS.md"), "utf-8");
    expect(agents).toContain("bun run folio-assistant/cat-harness/content/pipeline/qa-sweep.ts folio");
    expect(agents).toContain("test/results/block-qa/");
    // The old sibling layout is no longer taught.
    expect(agents).not.toContain("<chapter>/<root>.qa.json");
  });

  test("swept from the repository root, as CI does, a subfolder folio's verdicts land at ITS root and the summary finds them", () => {
    const repo = mkdtempSync(join(tmpdir(), "init-qa-repo-"));
    dirs.push(repo);
    const folio = join(repo, "handbook");
    initFolio({ targetDir: folio, contentType: "document", slug: "qa-sub", title: "QA Sub", authors: ["A"], link: "sibling", assistantPath: "../platform", skipVcs: true });
    symlinkSync(REPO_ROOT, join(repo, "platform"));

    const sweep = spawnSync("bun", ["run", join(REPO_ROOT, "cat-harness/content/pipeline/qa-sweep.ts"), "handbook/folio"], { cwd: repo, encoding: "utf-8" });
    expect(sweep.status).toBe(0);
    expect(existsSync(join(folio, "test/results/block-qa/folio/qa-sub/introduction/overview.qa.json"))).toBe(true);
    // Not at the repository root, and not inside the content graph.
    expect(existsSync(join(repo, "test"))).toBe(false);
    expect(existsSync(join(folio, "folio/test"))).toBe(false);

    const out = join(repo, "block-qa.json");
    const pub = spawnSync("bun", ["run", join(REPO_ROOT, "cat-harness/scripts/publish-block-qa.ts"), "--folio", "handbook/folio", "--out", out], { cwd: repo, encoding: "utf-8" });
    expect(pub.status).toBe(0);
    const summary = JSON.parse(readFileSync(out, "utf-8")) as { counts: Record<string, number> };
    // The regression: with the repository root as the anchor, every block read unaudited.
    expect(summary.counts.unaudited).toBe(0);
    expect(summary.counts.passing + summary.counts.failing).toBeGreaterThan(0);
  }, 60_000);
});
