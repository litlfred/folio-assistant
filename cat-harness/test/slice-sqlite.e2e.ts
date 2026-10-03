import { test, expect } from "@playwright/test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * The beans SQLite slice in a real Chromium. Bean `q8ar`.
 *
 * The site is composed the way the deploy composes `_site/`: `docs/` as it is,
 * the slice built into `assets/slices/`, and the bean bodies built into
 * `payload/sha256/`. It is served by `python3 -m http.server`, a plain static
 * host with no COOP/COEP headers, which is GitHub Pages' position. So what
 * this proves is the Pages case: the vendored WASM loads, `opfs-sahpool`
 * mounts without SharedArrayBuffer, the sha256 check passes, a reload opens
 * from OPFS with no download, and the in-memory fallback works when there is
 * no Worker.
 *
 * Nothing is written into the checkout. The composed root is a temp
 * directory of symlinks.
 *
 * The slice is built by SPAWNING the builder under Bun rather than by
 * importing it. Playwright runs specs under Node, which cannot load
 * `bun:sqlite`; spawning also makes this the same command the deploy runs.
 */
const INSTANCE = join(import.meta.dirname, "..");
const REPO = join(INSTANCE, "..");
const DOCS = join(INSTANCE, siteDirFor(INSTANCE));
const DEFS = join(REPO, "beans", "defs");

/**
 * Title and body of each bean, read here directly. `scripts/beans.ts` uses
 * `import.meta.dir`, which is Bun-only, so it cannot be imported under Node.
 * This reader needs only enough to pick a known bean; the builder's unit test
 * checks the full parse.
 */
const beans = readdirSync(DEFS)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => {
    const text = readFileSync(join(DEFS, f), "utf-8");
    const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    if (!m) return undefined;
    const id = /^#\s*(\S+)/m.exec(m[1]!)?.[1] ?? "";
    const raw = /^title:\s*(.*)$/m.exec(m[1]!)?.[1]?.trim() ?? "";
    const title = raw.startsWith("'") ? raw.slice(1, -1).replace(/''/g, "'") : raw.startsWith('"') ? raw.slice(1, -1) : raw;
    return { id, title, body: m[2]! };
  })
  .filter((b): b is { id: string; title: string; body: string } => b !== undefined);
const SHOT = process.env.Q8AR_SCREENSHOT;

let site = "";
let server: ChildProcess | undefined;
const PORT = 8600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;

test.beforeAll(async () => {
  site = mkdtempSync(join(tmpdir(), "q8ar-site-"));
  for (const e of readdirSync(DOCS)) if (e !== "assets" && e !== "payload") symlinkSync(join(DOCS, e), join(site, e));
  mkdirSync(join(site, "assets"));
  for (const e of readdirSync(join(DOCS, "assets"))) if (e !== "slices") symlinkSync(join(DOCS, "assets", e), join(site, "assets", e));
  execFileSync("bun", [
    "run", join(INSTANCE, "scripts", "gen-slice-sqlite.ts"),
    "--out", join(site, "assets", "slices"),
    "--payload-out", join(site, "payload", "sha256"),
  ], { stdio: "inherit" });

  server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", site], { stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/beans/search.html`)).ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("python3 -m http.server did not come up");
});

test.afterAll(() => {
  server?.kill();
  if (site) rmSync(site, { recursive: true, force: true });
});

/** A bean whose title holds a two-word phrase, so the phrase query is exercised. */
// A unique id only: `folio-assistant-t3n8` is declared by two files, a store
// defect the builder reports.
const ids = beans.map((b) => b.id);
const known = beans.find(
  (b) => ids.indexOf(b.id) === ids.lastIndexOf(b.id) && /[A-Za-z]{5,}\s+[A-Za-z]{5,}/.test(b.title) && b.body.trim().length > 0,
)!;
const phrase = known.title.match(/[A-Za-z]{5,}\s+[A-Za-z]{5,}/)![0];

type Search = { mode: string; how: string; rows: { id: string; title: string }[]; info: { downloaded: boolean; ms: number; opfsError: string | null } };

test("the slice mounts in OPFS, a phrase search finds a known bean, and its body is fetched on demand", async ({ page }) => {
  await page.goto(`${BASE}/beans/search.html`);
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", /.+/, { timeout: 60_000 });
  const ready = await page.locator("html").getAttribute("data-slice-ready");
  expect(ready, await page.locator("#state").textContent() ?? "").toBe("opfs-sahpool");

  const r = await page.evaluate((p) => (window as unknown as { __beanSearch(t: string): Promise<Search> }).__beanSearch(`"${p}"`), phrase);
  expect(r.how).toBe("fts5");
  expect(r.rows.length).toBeGreaterThan(0);
  expect(r.rows.map((x) => x.id)).toContain(known.id);
  expect(r.info.downloaded).toBe(true);
  console.log(`[q8ar] first open: mode=${r.mode} ready in ${r.info.ms} ms; "${phrase}" → ${r.rows.length} row(s)`);

  // The UI path: type, see results, open one, get its body from the payload.
  await page.fill("#q", `"${phrase}"`);
  const item = page.locator("#out li", { hasText: known.title }).first();
  await expect(item).toBeVisible();
  await item.locator("button").click();
  const firstLine = known.body.trim().split("\n")[0]!.trim();
  await expect(item.locator("pre")).toContainText(firstLine.slice(0, 40));
  if (SHOT) await page.screenshot({ path: SHOT, fullPage: false });

  // A reload opens the SAME build from OPFS, with no download.
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", "opfs-sahpool", { timeout: 60_000 });
  const again = await page.evaluate(() => (window as unknown as { __beanSearch(t: string): Promise<Search> }).__beanSearch("bean"));
  expect(again.info.downloaded).toBe(false);
  expect(again.rows.length).toBeGreaterThan(0);
  console.log(`[q8ar] reload: no download, ready in ${again.info.ms} ms`);
});

test("with no Worker the slice opens in memory and still answers", async ({ page }) => {
  await page.addInitScript(() => { delete (window as unknown as { Worker?: unknown }).Worker; });
  await page.goto(`${BASE}/beans/search.html`);
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", "memory", { timeout: 60_000 });
  const r = await page.evaluate((p) => (window as unknown as { __beanSearch(t: string): Promise<Search> }).__beanSearch(`"${p}"`), phrase);
  expect(r.rows.map((x) => x.id)).toContain(known.id);
  await expect(page.locator("#state")).toContainText("in memory");
});
