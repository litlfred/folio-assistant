/**
 * build-folio-site (owner, 2026-10-05): lightweight static shells at
 * <route>/<paper>/<chapter>/<section>/ that load KG content dynamically. Run
 * over a folio `init-folio` actually scaffolds, as build-document-site's tests are.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildFolioSite, sectionSlug, shellHtml, type SiteOutline } from "./build-folio-site.js";
import { initFolio } from "../../cat-harness/scripts/init-folio.js";

const REPO_ROOT = resolve(import.meta.dir, "../..");
let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});

function scaffold(): string {
  const d = mkdtempSync(join(tmpdir(), "folsite-"));
  roots.push(d);
  initFolio({ targetDir: d, slug: "handbook", title: "Handbook", authors: ["A"], contentType: "document", skipVcs: true, link: "submodule" } as Parameters<typeof initFolio>[0]);
  symlinkSync(REPO_ROOT, join(d, "folio-assistant"));
  return d;
}

describe("build-folio-site", () => {
  test("shells exist at <route>/<paper>/<chapter>/<section>/, and each is tiny", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    const r = await buildFolioSite(d, out);
    expect(r.errors).toEqual([]);
    const base = join(out, "cat-harness", "folio");
    const outline = JSON.parse(readFileSync(join(base, "handbook", "outline.json"), "utf-8")) as SiteOutline;
    expect(outline.$schema).toBe("folio-site-outline/v1");
    const ch = outline.chapters[0]!;
    const sec = ch.sections[0]!;
    for (const p of [[], ["handbook"], ["handbook", ch.slug], ["handbook", ch.slug, sec.slug]]) {
      const f = join(base, ...p, "index.html");
      expect(existsSync(f)).toBe(true);
      expect(statSync(f).size).toBeLessThan(2048);
    }
    expect(existsSync(join(base, "assets", "folio-site.js"))).toBe(true);
  });

  test("a block payload is the block's KG node plus its rendered html, and every label maps to its section page", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildFolioSite(d, out);
    const base = join(out, "cat-harness", "folio", "handbook");
    const outline = JSON.parse(readFileSync(join(base, "outline.json"), "utf-8")) as SiteOutline;
    const sec = outline.chapters[0]!.sections[0]!;
    const node = JSON.parse(readFileSync(join(base, sec.blocks[0]!), "utf-8")) as { html: string; label?: string };
    expect(node.html).toContain('<a id="prose:overview"></a>');
    expect(outline.labels["prose:overview"]).toBe(`${outline.chapters[0]!.slug}/${sec.slug}`);
  });

  test("the route is configurable, and a shell's links are relative to its own depth", async () => {
    const d = scaffold();
    const out = join(d, "_site");
    await buildFolioSite(d, out, { route: "docs/x" });
    expect(existsSync(join(out, "docs", "x", "handbook", "index.html"))).toBe(true);
    expect(shellHtml("T", 3, { paper: "p", path: "a/b" })).toContain('src="../../../assets/folio-site.js"');
    expect(shellHtml("T", 0, {})).toContain('data-root="./"');
  });

  test("section slugs drop the label prefix and never collide", () => {
    const taken = new Set<string>();
    expect(sectionSlug({ label: "sec:braid-group", title: "x" }, taken)).toBe("braid-group");
    expect(sectionSlug({ title: "Braid group" }, taken)).toBe("braid-group-2");
    expect(sectionSlug({ title: "$q$-Langlands" }, taken)).toBe("q-langlands");
  });
});
