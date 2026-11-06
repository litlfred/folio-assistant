/**
 * publish:check runs the writer in a scratch copy (owner, 2026-10-30), so
 * the copy must hold every authored file and resolve the workspace packages
 * to the layers IN THE COPY, never to the originals.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { scratchCopy } from "../publish-check";

const repo = mkdtempSync(join(tmpdir(), "publish-check-src-"));
mkdirSync(join(repo, "cat-harness", "docs"), { recursive: true });
writeFileSync(join(repo, "cat-harness", "docs", "a.svg"), "<svg/>");
writeFileSync(join(repo, "package.json"), "{}");
mkdirSync(join(repo, "node_modules", "@litlfred"), { recursive: true });
symlinkSync("../../cat-harness", join(repo, "node_modules", "@litlfred", "cat-harness"));
mkdirSync(join(repo, "node_modules", "zod"), { recursive: true });
writeFileSync(join(repo, "node_modules", "zod", "index.js"), "");
mkdirSync(join(repo, "layer", "node_modules", "dep"), { recursive: true });

const copy = scratchCopy(repo);
afterAll(() => {
  rmSync(copy, { recursive: true, force: true });
  rmSync(repo, { recursive: true, force: true });
});

describe("scratchCopy", () => {
  test("copies authored files", () => {
    expect(readFileSync(join(copy, "cat-harness", "docs", "a.svg"), "utf-8")).toBe("<svg/>");
    expect(existsSync(join(copy, "package.json"))).toBe(true);
  });

  test("a workspace package resolves to the layer in the copy", () => {
    const link = join(copy, "node_modules", "@litlfred", "cat-harness");
    expect(readlinkSync(link)).toBe("../../cat-harness");
    expect(realpathSync(link)).toBe(realpathSync(join(copy, "cat-harness")));
  });

  test("installed packages are linked to the original, not copied", () => {
    const zod = join(copy, "node_modules", "zod");
    expect(lstatSync(zod).isSymbolicLink()).toBe(true);
    expect(readlinkSync(zod)).toBe(join(repo, "node_modules", "zod"));
    expect(lstatSync(join(copy, "layer", "node_modules")).isSymbolicLink()).toBe(true);
  });

  test("writing in the copy leaves the original alone", () => {
    writeFileSync(join(copy, "cat-harness", "docs", "a.svg"), "<svg changed/>");
    expect(readFileSync(join(repo, "cat-harness", "docs", "a.svg"), "utf-8")).toBe("<svg/>");
  });
});
