/**
 * stage-local: the parts that decide what is built and where it goes. The
 * build and the push are the workflow's own scripts, tested where they live.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { builtSomething, inPlatform, ownerRepoOf, readStagingInputs, slugOf } from "../stage-local.ts";

describe("stage-local", () => {
  test("reads the staging workflow's inputs from the folio's own file, with the workflow's defaults", () => {
    const yaml = `jobs:
  staging:
    uses: litlfred/folio-assistant/.github/workflows/folio-staging.yml@main
    with:
      build_command: 'bun run folio-assistant/a.ts --out _site && bun run folio-assistant/b.ts --out _site'
      site_dir: _site
      folio_dir: folio
      platform_dir: folio-assistant
`;
    expect(readStagingInputs(yaml)).toEqual({
      build_command: "bun run folio-assistant/a.ts --out _site && bun run folio-assistant/b.ts --out _site",
      site_dir: "_site",
      folio_dir: "folio",
      platform_dir: "folio-assistant",
      publish_branch: "gh-pages",
    });
    expect(readStagingInputs("with:\n  site_dir: _site\n")).toBeUndefined();
    expect(readStagingInputs("with:\n  build_command: 'it''s'\n")?.build_command).toBe("it's");
  });

  test("the slug follows the workflow's rule and refuses one that names no single path segment", () => {
    expect(slugOf("claude/exciting-ptolemy-se2d2a")).toBe("claude-exciting-ptolemy-se2d2a");
    expect(slugOf("feat//a b")).toBe("feat-a-b");
    expect(slugOf("..")).toBeUndefined();
    expect(slugOf("/")).toBeUndefined();
    expect(slugOf("")).toBeUndefined();
  });

  test("a build that wrote only data files is no site (bean oisv)", () => {
    const d = mkdtempSync(join(tmpdir(), "stage-local-"));
    expect(builtSomething(join(d, "missing"))).toBe(false);
    writeFileSync(join(d, "changeset.json"), "{}");
    mkdirSync(join(d, "visual"));
    expect(builtSomething(d)).toBe(false);
    writeFileSync(join(d, "index.html"), "<p>");
    expect(builtSomething(d)).toBe(true);
  });

  test("owner/repo from a GitHub remote, including a proxied one", () => {
    expect(ownerRepoOf("https://github.com/litlfred/smart-ra.git")).toBe("litlfred/smart-ra");
    expect(ownerRepoOf("git@github.com:litlfred/smart-ra")).toBe("litlfred/smart-ra");
    expect(ownerRepoOf("https://github.com/o/my.site.git")).toBe("o/my.site");
    expect(ownerRepoOf("http://local_proxy@127.0.0.1:1234/git/litlfred/smart-ra")).toBeUndefined();
  });

  test("a content layer's tool is found in whichever platform instance carries it, never named", () => {
    const p = mkdtempSync(join(tmpdir(), "stage-local-platform-"));
    mkdirSync(join(p, "a-harness", "scripts"), { recursive: true });
    mkdirSync(join(p, "b-content", "schemas"), { recursive: true });
    writeFileSync(join(p, "b-content", "schemas", "changeset.ts"), "");
    expect(inPlatform(p, "schemas/changeset.ts")).toBe(join(p, "b-content", "schemas", "changeset.ts"));
    expect(inPlatform(p, "scripts/nothing.ts")).toBeUndefined();
    expect(inPlatform(join(p, "missing"), "x")).toBeUndefined();
  });
});
