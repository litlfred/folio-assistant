import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { blockLeftovers, pageRenderQaMarkdown, pagesOf, PAGE_RENDER_FILE, PAGE_RENDER_JS, scanSite } from "./ig-page-render-qa.ts";

/** A tiny built site: a page drawn by a script in the browser, a static page, a JSON view, a mappings view and a redirect stub. */
function site(): string {
  const d = mkdtempSync(join(tmpdir(), "page-scan-"));
  mkdirSync(join(d, "artifact"), { recursive: true });
  const page = (body: string) => `<!doctype html><html><head><meta charset="utf-8"></head><body><main>${body}</main></body></html>`;
  // Drawn in the browser, as the artefact pages are: raw markdown in one block, a link and code in another.
  writeFileSync(join(d, "artifact", "ActorDefinition-a.html"), page(`<div class="iga-body"><p class="iga-state">Loading…</p></div><script>
    setTimeout(function () { var b = document.querySelector(".iga-body"); b.innerHTML = "<p>**Persona**: a phone</p><ul><li><a href='x.html'>X</a>: fine</li></ul><p><code>**meant**</code> and !<a href='y.html'>Bo</a></p>"; }, 50);
  </script>`));
  writeFileSync(join(d, "index.html"), page("<h2>1. Plan</h2><p>Plain text, a <a href='artifact/ActorDefinition-a.html'>link</a> (and <a href='z.html'>another</a>).</p>"));
  writeFileSync(join(d, "artifact", "ActorDefinition-a.json.html"), page("<p>**json**</p>"));
  writeFileSync(join(d, "artifact", "StructureDefinition-s-mappings.html"), page("<td>* .role [classCode = x]</td>"));
  writeFileSync(join(d, "old.html"), `<meta http-equiv="refresh" content="0; url=index.html">`);
  return d;
}

describe("ig-page-render-qa", () => {
  test("pagesAReaderMeets", () => {
    expect(pagesOf(site())).toEqual(["artifact/ActorDefinition-a.html", "index.html"]);
  });

  test("blockRules", () => {
    expect(blockLeftovers("**Persona**: a phone")).toEqual(["bold"]);
    expect(blockLeftovers("1. Plan", "H2")).toEqual([]);
    expect(blockLeftovers("1. Plan", "P")).toEqual(["list marker"]);
    expect(blockLeftovers("[Reference]([Patient])")).toEqual([]);
    expect(blockLeftovers("![Bo]")).toEqual(["image"]);
  });

  test("scansDrawnPagesInABrowser", async () => {
    const q = await scanSite(site(), { timeoutMs: 5000 });
    expect(q.unavailable).toBeUndefined();
    expect(q.scanned).toBe(2);
    expect(q.unfinished).toEqual([]);
    expect(q.findings).toEqual([
      { page: "artifact/ActorDefinition-a.html", markup: ["bold"], excerpt: "**Persona**: a phone" },
      { page: "artifact/ActorDefinition-a.html", markup: ["image"], excerpt: "and ![Bo]" },
    ]);
  }, 60000);

  test("qaPanelLoadsResults", () => {
    const md = pageRenderQaMarkdown({ up: "../" }).join("\n");
    expect(md).toContain("### Page scan");
    expect(md).toContain(`data-src="../${PAGE_RENDER_FILE}"`);
    expect(md).toContain('<script src="../assets/fhir-qa/page-render.js" defer></script>');
    expect(() => new Function(PAGE_RENDER_JS)).not.toThrow();
    expect(PAGE_RENDER_JS).not.toContain("innerHTML");
  });
});
