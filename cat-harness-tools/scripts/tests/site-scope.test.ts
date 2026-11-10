/**
 * A site's scope (owner, 2026-11-08, Q-SZ-2 "B"): an IG's site writes the
 * pages of the IG and the layer it lands on, and links every other layer's
 * pages on that layer's own site instead of copying them.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { inScope, scopeArg, siteScope } from "../lib/site-scope.ts";
import { relinkOutOfScope, siteScopeOf } from "../build-instance-site.ts";
import { writerArgv, type VisualiserWriter } from "../visualiser-writers.ts";

describe("site-scope — the --scope flag", () => {
  test("no flag is no scope: every instance is written", () => {
    expect(siteScope(["bun", "w.ts", "--site", "x"])).toBeUndefined();
    expect(inScope(undefined, "cat-harness")).toBe(true);
  });

  test("the flag names the instances, comma-separated", () => {
    const s = siteScope(["bun", "w.ts", "--scope", "smart-base, smart-immunizations"]);
    expect([...s!].sort()).toEqual(["smart-base", "smart-immunizations"]);
    expect(inScope(s, "smart-base")).toBe(true);
    expect(inScope(s, "cat-harness")).toBe(false);
  });

  test("a flag with no names is refused, never read as everything", () => {
    expect(() => siteScope(["--scope"])).toThrow();
    expect(() => siteScope(["--scope", "--site"])).toThrow();
    expect(() => siteScope(["--scope", ","])).toThrow();
  });

  test("the value is sorted and once each", () => {
    expect(scopeArg(["b", "a", "b"])).toBe("a,b");
  });
});

describe("siteScopeOf — an IG lands on a layer", () => {
  const dir = mkdtempSync(join(tmpdir(), "site-scope-"));
  const cfg = (site: unknown): string => {
    writeFileSync(join(dir, "index.config.json"), JSON.stringify({ site }));
    return dir;
  };

  test("the IG and its landing layer", () => {
    expect(siteScopeOf(cfg({ landing: "smart-base" }), "smart-immunizations")).toEqual(["smart-base", "smart-immunizations"]);
  });

  test("a checkout that lands on itself, on the hub, or names no landing has no scope", () => {
    expect(siteScopeOf(cfg({ landing: "smart-base" }), "smart-base")).toBeUndefined();
    expect(siteScopeOf(cfg({ landing: "hub" }), "x")).toBeUndefined();
    expect(siteScopeOf(cfg({}), "x")).toBeUndefined();
    rmSync(join(dir, "index.config.json"));
    expect(siteScopeOf(dir, "x")).toBeUndefined();
  });
});

describe("writerArgv — the scope reaches a writer that declares it", () => {
  const w: VisualiserWriter = { tool: "t", visualisers: [], invoke: ["bun", "run", "x/gen.ts"], siteFlag: "--site" };

  test("declared: passed", () => {
    expect(writerArgv("/r", { ...w, scopeFlag: "--scope" }, "/s", ["smart-immunizations", "smart-base"])).toEqual(["bun", "run", "x/gen.ts", "--site", "/s", "--scope", "smart-base,smart-immunizations"]);
  });

  test("not declared: not passed, and the writer writes everything as before", () => {
    expect(writerArgv("/r", w, "/s", ["smart-base"]).join(" ")).not.toContain("--scope");
  });
});

describe("relinkOutOfScope — another layer's page is linked on its own site", () => {
  test("a dead link under a visualiser route points at linkRoot; a live one and any other dead one are left alone", async () => {
    const site = mkdtempSync(join(tmpdir(), "relink-"));
    mkdirSync(join(site, "en/h/processes"), { recursive: true });
    writeFileSync(join(site, "en/h/processes/mine.html"), "x");
    const page = join(site, "en/h/processes/index.html");
    writeFileSync(
      page,
      `<a href="mine.html">mine</a> <a href="theirs.html#step">theirs</a> <a href="../../../other/missing.html">gone</a> <a href="https://e.org/">out</a>`,
    );
    const r = await relinkOutOfScope(site, "/repo/", "https://example.org/platform/", ["en/h/processes/"]);
    expect(r).toEqual({ links: 1, pages: 1 });
    const html = readFileSync(page, "utf-8");
    expect(html).toContain(`href="mine.html"`);
    expect(html).toContain(`href="https://example.org/platform/en/h/processes/theirs.html#step"`);
    expect(html).toContain(`href="../../../other/missing.html"`);
    rmSync(site, { recursive: true, force: true });
  });
});
