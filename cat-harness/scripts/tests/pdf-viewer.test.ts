import { describe, expect, test } from "bun:test";

import { MARKER, VIEWER_PATH, embed, isVendoredViewer, openShim, patchViewerHtml } from "../pdf-viewer.ts";

/**
 * The inline PDF viewer's two halves. Bean `folio-assistant-5ea6`.
 *
 * Runs the SHIPPED bytes: the shim is evaluated against a stub of the two
 * pdf.js globals it touches, and the embed's client against a stub frame, so
 * the allowlist and the root derivation are tested as they run, not as a copy
 * of the rule. The browser half — that pdf.js itself opens the document,
 * searches, jumps and prints — was checked in Chromium when this landed; the
 * notes are on the bean.
 */

const WHO_IRIS = /^(.*?)(?:docs\/)?who-iris\//;
const CDN = "https://cdn.jsdelivr.net/gh/acme/";

/** Evaluate the shim with `src` and return what it asked pdf.js to open, or the refusal. */
async function runShim(src: string | null, opts: { sameOriginParent?: boolean } = {}) {
  const listeners: Record<string, ((e: unknown) => void)[]> = {};
  const parentListeners: Record<string, ((e: unknown) => void)[]> = {};
  const opened: string[] = [];
  const refused: string[] = [];
  const set: Record<string, unknown> = {};
  const win: Record<string, unknown> = {};
  const container = { prepend: (p: { textContent: string }) => refused.push(p.textContent) };
  const doc = {
    addEventListener: (t: string, f: (e: unknown) => void) => (listeners[t] ??= []).push(f),
    getElementById: () => container,
    createElement: () => ({ setAttribute() {}, style: {}, textContent: "" }),
    body: container,
  };
  const parent = opts.sameOriginParent
    ? { document: { addEventListener: (t: string, f: (e: unknown) => void) => (parentListeners[t] ??= []).push(f) } }
    : win;
  const location = { search: src === null ? "" : `?src=${encodeURIComponent(src)}`, href: "https://site.example/assets/vendor/pdfjs/web/viewer.html", origin: "https://site.example" };
  win.PDFViewerApplicationOptions = { set: (k: string, v: unknown) => (set[k] = v) };
  win.PDFViewerApplication = { initializedPromise: Promise.resolve(), open: (o: { url: string }) => opened.push(o.url) };
  new Function("window", "document", "location", "parent", openShim([CDN]))(win, doc, location, parent);
  const fire = opts.sameOriginParent ? parentListeners : listeners;
  for (const f of fire["webviewerloaded"] ?? []) f({ detail: { source: win } });
  await Promise.resolve();
  await Promise.resolve();
  return { opened, refused, set };
}

describe("openShim", () => {
  test("opens an allowlisted CDN document and clears the sample", async () => {
    const r = await runShim(`${CDN}repo@main/x.pdf`);
    expect(r.opened).toEqual([`${CDN}repo@main/x.pdf`]);
    expect(r.set.defaultUrl).toBe("");
  });

  test("opens a same-origin document without an allowlist entry", async () => {
    expect((await runShim("/docs/a.pdf")).opened).toEqual(["https://site.example/docs/a.pdf"]);
  });

  test("refuses any other origin, on screen, and opens nothing", async () => {
    const r = await runShim("https://evil.example/x.pdf");
    expect(r.opened).toEqual([]);
    expect(r.refused[0]).toContain("Refused: https://evil.example/x.pdf");
  });

  test("a prefix is a prefix, not a substring: the owner's name inside a path is not the owner", async () => {
    expect((await runShim("https://evil.example/cdn.jsdelivr.net/gh/acme/x.pdf")).opened).toEqual([]);
  });

  test("listens on the parent document too — where pdf.js dispatches when framed same-origin", async () => {
    expect((await runShim(`${CDN}r/x.pdf`, { sameOriginParent: true })).opened).toEqual([`${CDN}r/x.pdf`]);
  });

  test("no ?src= opens nothing and refuses nothing", async () => {
    const r = await runShim(null);
    expect(r.opened).toEqual([]);
    expect(r.refused).toEqual([]);
  });
});

describe("embed", () => {
  /** Run the embed's inlined client at a pathname; return the frame's src once it scrolls into view. */
  function frameSrcAt(pathname: string, html: string): { src?: string; srcdoc?: string } {
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]!;
    const attrs = Object.fromEntries([...html.matchAll(/data-(src|hash)="([^"]*)"/g)].map((m) => [m[1], m[2]!.replace(/&amp;/g, "&")]));
    const frame: { src?: string; srcdoc?: string; getAttribute: (k: string) => string } = {
      getAttribute: (k) => attrs[k.replace("data-", "")]!,
    };
    let cb: ((es: { isIntersecting: boolean }[]) => void) | undefined;
    class IO {
      constructor(f: typeof cb) {
        cb = f;
      }
      observe() {}
      disconnect() {}
    }
    const win = { IntersectionObserver: IO };
    const document = { currentScript: { parentNode: { querySelector: () => frame } } };
    new Function("window", "document", "location", "IntersectionObserver", script)(win, document, { pathname }, IO);
    expect(frame.src).toBeUndefined(); // lazy: nothing until it is in view
    cb?.([{ isIntersecting: true }]);
    return frame;
  }

  const html = embed({ src: `${CDN}r@main/a b.pdf`, title: "A <title>", route: WHO_IRIS, page: 3 });

  test("carries the marker, the title and both plain links", () => {
    expect(html).toContain(MARKER);
    expect(html).toContain('title="A &lt;title&gt; (PDF viewer)"');
    expect(html).toContain(`href="${CDN}r@main/a b.pdf" download`);
  });

  for (const [path, root] of [
    ["/who-iris/item-x.html", "/"],
    ["/folio-assistant/who-iris/item-x.html", "/folio-assistant/"],
    ["/STAGING/my-branch/who-iris/item-x.html", "/STAGING/my-branch/"],
  ] as const) {
    test(`at ${path} the frame opens ${root}${VIEWER_PATH}, on page 3`, () => {
      expect(frameSrcAt(path, html).src).toBe(`${root}${VIEWER_PATH}?src=${encodeURIComponent(`${CDN}r@main/a b.pdf`)}#page=3`);
    });
  }

  test("a page off the route says so in the frame instead of loading a 404", () => {
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1]!;
    const frame: { src?: string; srcdoc?: string; getAttribute: () => string } = { getAttribute: () => "" };
    const document = { currentScript: { parentNode: { querySelector: () => frame } } };
    new Function("window", "document", "location", script)({}, document, { pathname: "/elsewhere/x.html" });
    expect(frame.src).toBeUndefined();
    expect(frame.srcdoc).toContain("could not find this site's root");
  });
});

describe("install helpers", () => {
  test("the shim is loaded before pdf.js's own modules", () => {
    const out = patchViewerHtml(`<head><script src="../build/pdf.mjs" type="module"></script></head>`);
    expect(out.indexOf("folio-open.js")).toBeLessThan(out.indexOf("pdf.mjs"));
  });

  test("a release whose viewer.html moved the anchor is refused, not shipped half-wired", () => {
    expect(() => patchViewerHtml("<head></head>")).toThrow(/re-measure/);
  });

  test("only the installed viewer is vendored", () => {
    expect(isVendoredViewer("assets/vendor/pdfjs/web/viewer.html")).toBe(true);
    expect(isVendoredViewer("who-iris/item-x.html")).toBe(false);
    expect(isVendoredViewer("assets/vendor/pdfjs-other/x.html")).toBe(false);
  });
});
