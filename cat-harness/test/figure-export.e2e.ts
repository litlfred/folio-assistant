import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * Every figure can be downloaded as SVG, downloaded as PNG, or copied (#1270).
 *
 * Owner, 2026-09-24: "i want to be able downloade renderd png, src svg or copy
 * to clipboard any diagrmas, suich as the UML ones". The controls live on the
 * same toolbar as zoom, so this drives them the way a reader would: a routed
 * page on one https origin (the clipboard needs a secure context, and the
 * inlining fetch needs the same origin), with the SVG served as a file the
 * page inlines — exactly the UML overview's shape.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = siteDirFor(ROOT);
const CSS = readFileSync(join(ROOT, SITE, "assets/css/docs-ui.css"), "utf8");
const JS = readFileSync(join(ROOT, SITE, "assets/js/docs-ui.js"), "utf8");

const ORIGIN = "https://figures.example.test";
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <rect x="20" y="20" width="360" height="260" fill="#6a3d9a"/><text x="40" y="160" fill="#fff">Role</text></svg>`;

/** NO BACKTICKS inside the template — the page is one. */
const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>UML overview</title>
<style>body { margin: 0; background: #ffffff; } ${CSS}</style></head><body>
<div class="main"><div class="main-content"><h1>UML</h1>
<figure class="bpmn-figure"><img src="${ORIGIN}/uml/overview/cat-harness.svg" alt="The cat-harness overview."></figure>
</div></div>
<script>${JS}<\/script></body></html>`;

async function open(page: Page): Promise<void> {
  await page.route(`${ORIGIN}/**`, (route) => {
    const url = route.request().url();
    if (url.endsWith(".svg")) return route.fulfill({ contentType: "image/svg+xml", body: SVG });
    return route.fulfill({ contentType: "text/html", body: PAGE });
  });
  await page.goto(`${ORIGIN}/uml/overview/`);
  // The toolbar mounts once the <img> has been inlined as an <svg>.
  await expect(page.locator(".bpmn-figure svg")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Download this diagram as SVG" })).toBeVisible();
}

test.describe("figure export — SVG, PNG, clipboard (#1270)", () => {
  test("the three controls are named buttons on the figure's toolbar, reachable by keyboard", async ({ page }) => {
    await open(page);
    for (const name of [
      "Download this diagram as SVG",
      "Download this diagram as PNG",
      "Copy this diagram to the clipboard",
    ]) {
      const b = page.getByRole("button", { name });
      await expect(b).toBeVisible();
      await b.focus();
      await expect(b).toBeFocused();
    }
  });

  test("SVG downloads the drawing, named after its source file, at its own size", async ({ page }) => {
    await open(page);
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download this diagram as SVG" }).press("Enter"),
    ]);
    expect(dl.suggestedFilename()).toBe("cat-harness.svg");
    const text = readFileSync((await dl.path())!, "utf8");
    expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(text).toContain('width="400"');
    expect(text).toContain("<rect");
    expect(text).not.toContain("data-fa-src");
    await expect(page.getByRole("status")).toHaveText("SVG downloaded");
  });

  test("PNG downloads a real PNG at twice the drawing's size", async ({ page }) => {
    await open(page);
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download this diagram as PNG" }).click(),
    ]);
    expect(dl.suggestedFilename()).toBe("cat-harness.png");
    const bytes = readFileSync((await dl.path())!);
    // The PNG signature, then the IHDR width and height (big-endian at 16 and 20).
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(bytes.readUInt32BE(16)).toBe(800);
    expect(bytes.readUInt32BE(20)).toBe(600);
  });

  test("Copy puts an image on the clipboard where the browser allows it, and says which", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
    await open(page);
    await page.getByRole("button", { name: "Copy this diagram to the clipboard" }).click();
    const status = page.getByRole("status");
    await expect(status).toHaveText(/^Copied as (a PNG image|SVG text)/);
    const types = await page.evaluate(async () => (await navigator.clipboard.read()).flatMap((i) => i.types));
    if ((await status.textContent())!.startsWith("Copied as a PNG")) expect(types).toContain("image/png");
    else expect(types).toContain("text/plain");
  });

  test("with no image clipboard, Copy falls back to the SVG text and says so", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN });
    await page.addInitScript(() => {
      // A browser without ClipboardItem — the fallback path, forced.
      (window as unknown as { ClipboardItem?: unknown }).ClipboardItem = undefined;
    });
    await open(page);
    await page.getByRole("button", { name: "Copy this diagram to the clipboard" }).click();
    await expect(page.getByRole("status")).toHaveText(/^Copied as SVG text/);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("<svg");
    expect(text).toContain("<rect");
  });
});
