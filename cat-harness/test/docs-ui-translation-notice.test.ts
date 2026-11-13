/**
 * The unreviewed-translation notice `docs-ui.js` draws on a folio page
 * (owner, 2026-11-13: "need VERY prominent disclaimer when any translated
 * text on page has not been human translated/adjudicated").
 *
 * The page is a fixture written here: the `fa-translation-meta` block
 * `head_custom.html` publishes, a content column, and the layer's own
 * `docs-ui.css` and `docs-ui.js` inlined. Each case loads it in Chromium.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";

const CHROME = join(import.meta.dir, "..", "site-chrome", "assets");
const CSS = readFileSync(join(CHROME, "css", "docs-ui.css"), "utf8");
const JS = readFileSync(join(CHROME, "js", "docs-ui.js"), "utf8");

function fixture(meta: Record<string, unknown>): string {
  return `<!doctype html><html lang="${meta.lang ?? "en"}"><head><meta charset="utf-8">` +
    `<script type="application/json" id="fa-translation-meta">${JSON.stringify(meta)}</script>` +
    `<style>${CSS}</style></head><body><main class="main-content" id="main-content"><h1>Titre</h1><p>Texte.</p></main>` +
    `<script>${JS.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}

let browser: Browser;
beforeAll(async () => { browser = await chromium.launch(); });
afterAll(async () => { await browser?.close(); });

/** The notice's text, its place in the content, and where its source link points; undefined when there is none. */
async function notice(meta: Record<string, unknown>, path = "/fr/page.html") {
  const page = await browser.newPage();
  await page.route("**/*", (r) => r.request().url().endsWith(path)
    ? r.fulfill({ contentType: "text/html; charset=utf-8", body: fixture(meta) })
    : r.fulfill({ status: 404, body: "" }));
  await page.goto(`http://folio.test${path}`);
  await page.waitForTimeout(200);
  const n = page.locator(".fa-translation-warning--prominent");
  const out = (await n.count()) === 0 ? undefined : {
    text: await n.innerText(),
    first: await page.evaluate(() => document.querySelector(".main-content")?.firstElementChild?.classList.contains("fa-translation-warning") ?? false),
    href: await n.locator(".fa-translation-warning__source").first().getAttribute("href"),
    width: await n.evaluate((e) => (e as HTMLElement).offsetWidth / (e.parentElement as HTMLElement).clientWidth),
  };
  await page.close();
  return out;
}

const SUPPORTED = ["ar", "zh", "en", "fr", "ru", "es"];

describe("the unreviewed-translation notice", () => {
  test("an unverified French page shows it first, full width, in French and English, linking to the source", async () => {
    const n = await notice({ lang: "fr", translationStatus: "unverified", translationSource: "page.md", supportedLocales: SUPPORTED, availableLocales: ["en", "fr"] });
    expect(n).toBeDefined();
    expect(n!.text).toContain("Traduction automatique");
    expect(n!.text).toContain("Machine translation");
    expect(n!.first).toBe(true);
    expect(n!.width).toBeGreaterThan(0.95);
    expect(n!.href).toBe("/page.html");
  });

  test("a translated page with no status fails closed and shows it", async () => {
    const n = await notice({ lang: "fr", translationStatus: "", translationSource: "page.md", supportedLocales: SUPPORTED, availableLocales: ["en", "fr"] });
    expect(n?.text).toContain("Traduction automatique");
  });

  test("a stale translation shows it", async () => {
    const n = await notice({ lang: "fr", translationStatus: "stale", translationSource: "page.md", supportedLocales: SUPPORTED, availableLocales: ["en", "fr"] });
    expect(n?.text).toContain("Machine translation");
  });

  test("a locale with no notice text of its own falls back to English", async () => {
    const n = await notice({ lang: "de", translationStatus: "unverified", translationSource: "page.md", supportedLocales: SUPPORTED, availableLocales: ["en", "de"] }, "/de/page.html");
    expect(n?.text).toContain("Machine translation");
    expect(n?.text).not.toContain("Traduction automatique");
  });

  test("a verified translation, and a source-language page, show none", async () => {
    expect(await notice({ lang: "fr", translationStatus: "verified", translationSource: "page.md", supportedLocales: SUPPORTED, availableLocales: ["en", "fr"] })).toBeUndefined();
    expect(await notice({ lang: "en", translationStatus: "", translationSource: "", supportedLocales: SUPPORTED, availableLocales: ["en", "fr"] }, "/page.html")).toBeUndefined();
  });
});
