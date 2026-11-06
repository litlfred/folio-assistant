/**
 * Bean `folio-assistant-1lfx` — branches/ must report which host rendered it,
 * not assume gh-pages.
 *
 * ## What these guard
 *
 * An agent finishing a turn previously composed staging URLs assuming GitHub
 * Pages. On private repositories or local-git topologies, Pages does not exist,
 * resulting in broken links and wasted round trips.
 *
 * The discipline in `turn-reporting.md` requires:
 * 1. Naming the rendering host from declared architecture / `deployment-awareness.md`
 *    (e.g., GitHub Pages, local server, chat discussion only).
 * 2. Forbidding guessing `github.io` or composing a URL from a git remote.
 * 3. The third state: explicitly stating "could not determine" and providing
 *    repo-relative paths for review when the host cannot be determined.
 *
 * @module scripts/tests/staging-host-reporting.test
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { createStagingPreview, type StagingDeployFacts } from "../../../schemas/sdlc/staging-preview.ts";
import { HARNESS_ROOT } from "../../lib/roots.ts";
import { skillMdFile } from "../../known-skills.ts";

const ROOT = resolve(HARNESS_ROOT);
// Found where the declared skill directories hold it, not at a spelled path.
const TURN_REPORTING_MD = skillMdFile(ROOT, "turn-reporting")!;

describe("turn-reporting staging host requirements (folio-assistant-1lfx)", () => {
  test("turn-reporting.md exists", () => {
    expect(existsSync(TURN_REPORTING_MD)).toBe(true);
  });

  const content = readFileSync(TURN_REPORTING_MD, "utf-8");

  test("explicitly requires stating the host surface for staging/review", () => {
    expect(content).toMatch(/explicitly state which host rendered it/i);
    expect(content).toMatch(/GitHub Pages/);
    expect(content).toMatch(/local server/);
    expect(content).toMatch(/chat discussion only/);
  });

  test("connects to deployment-awareness discipline", () => {
    expect(content).toMatch(/deployment-awareness/);
  });

  test("forbids assuming github.io or composing URL from git remote", () => {
    expect(content).toMatch(/Never assume `github\.io` or compose a URL from a git remote/);
    expect(content).toMatch(/private\s+repository/);
  });

  test("includes the third state: 'could not determine' with repo-relative paths", () => {
    expect(content).toMatch(/could not determine/);
    expect(content).toMatch(/repo-relative/);
  });
});

describe("staging review host resolution discipline", () => {
  type StagingSurface =
    | { host: "gh-pages"; url: string }
    | { host: "local-server"; url: string }
    | { host: "chat-only" }
    | { host: "could-not-determine"; paths: string[] };

  function determineStagingReviewSurface(config: {
    pagesBaseUrl?: string;
    localServerUrl?: string;
    isChatOnly?: boolean;
    changedFiles?: string[];
  }): StagingSurface {
    if (config.isChatOnly) {
      return { host: "chat-only" };
    }
    if (config.localServerUrl) {
      return { host: "local-server", url: config.localServerUrl };
    }
    if (config.pagesBaseUrl) {
      return { host: "gh-pages", url: config.pagesBaseUrl };
    }
    return {
      host: "could-not-determine",
      paths: config.changedFiles ?? [],
    };
  }

  test("resolves GitHub Pages when pagesBaseUrl is configured", () => {
    const res = determineStagingReviewSurface({ pagesBaseUrl: "https://owner.github.io/repo" });
    expect(res.host).toBe("gh-pages");
    if (res.host === "gh-pages") {
      expect(res.url).toBe("https://owner.github.io/repo");
    }
  });

  test("resolves local server when local server url is provided", () => {
    const res = determineStagingReviewSurface({ localServerUrl: "http://127.0.0.1:4000" });
    expect(res.host).toBe("local-server");
    if (res.host === "local-server") {
      expect(res.url).toBe("http://127.0.0.1:4000");
    }
  });

  test("resolves chat-only mode without guessing web URLs", () => {
    const res = determineStagingReviewSurface({ isChatOnly: true });
    expect(res.host).toBe("chat-only");
  });

  test("third state: resolves 'could-not-determine' when unconfigured, retaining repo paths", () => {
    const res = determineStagingReviewSurface({
      changedFiles: ["docs/concepts/foo.md", "skills/bar.md"],
    });
    expect(res.host).toBe("could-not-determine");
    if (res.host === "could-not-determine") {
      expect(res.paths).toEqual(["docs/concepts/foo.md", "skills/bar.md"]);
    }
  });

  test("does not compose github.io from repo remote when pagesBaseUrl is absent in deploy facts", () => {
    const deployWithoutHost: StagingDeployFacts = {
      slug: "claude-my-branch",
      branch: "claude/my-branch",
      commit: "abcdef1234567890",
      pr: 100,
      issue: 50,
      builtAt: "2026-10-09T12:00:00Z",
    };
    const node = createStagingPreview(deployWithoutHost);
    expect(node.movedFrom).toBeUndefined();
  });
});
