import { test, expect, type Page } from "@playwright/test";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { siteDirFor } from "../schemas/cat-harness.ts";

/**
 * Every SQLite slice in a real Chromium, through the ONE search page. Bean `q8ar`.
 *
 * The site is composed the way the deploy composes `_site/`: `docs/` as it is,
 * every slice built into `assets/slices/`, the deploy payloads built into
 * `payload/sha256/` beside the committed KG payloads. It is served by
 * `python3 -m http.server`, a plain static host with no COOP/COEP headers,
 * which is GitHub Pages' position. So what this proves is the Pages case: the
 * vendored WASM loads, `opfs-sahpool` mounts without SharedArrayBuffer, the
 * sha256 check passes, a phrase search finds a known row in each slice, the
 * row's payload is fetched on demand, a reload opens from OPFS with no
 * download, and the in-memory fallback works when there is no Worker.
 *
 * Nothing is written into the checkout. The composed root is a temp directory
 * of symlinks plus the built files.
 *
 * The slices are built by SPAWNING the builder under Bun rather than by
 * importing it: Playwright runs specs under Node, which cannot load
 * `bun:sqlite`, and spawning makes this the same command the deploy runs.
 */
const INSTANCE = join(import.meta.dirname, "..");
const REPO = join(INSTANCE, "..");
const DOCS = join(INSTANCE, siteDirFor(INSTANCE));
const DEFS = join(REPO, "beans", "defs");
const SHOT = process.env.Q8AR_SCREENSHOT;

/** Title and body of each bean, read directly: `scripts/beans.ts` is Bun-only. */
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

const PHRASE = /[A-Za-z]{5,}\s+[A-Za-z]{5,}/;

let site = "";
let server: ChildProcess | undefined;
const PORT = 8600 + Math.floor(Math.random() * 300);
const BASE = `http://127.0.0.1:${PORT}`;

test.beforeAll(async () => {
  site = mkdtempSync(join(tmpdir(), "q8ar-site-"));
  for (const e of readdirSync(DOCS)) if (e !== "assets" && e !== "payload") symlinkSync(join(DOCS, e), join(site, e));
  mkdirSync(join(site, "assets"));
  for (const e of readdirSync(join(DOCS, "assets"))) if (e !== "slices") symlinkSync(join(DOCS, "assets", e), join(site, "assets", e));
  // The committed KG payloads, which the `kg` slice points at, are COPIED in
  // as links one by one, so the deploy payloads can be written beside them.
  const payloads = join(site, "payload", "sha256");
  mkdirSync(payloads, { recursive: true });
  const committed = join(DOCS, "payload", "sha256");
  if (existsSync(committed)) for (const f of readdirSync(committed)) symlinkSync(join(committed, f), join(payloads, f));
  execFileSync("bun", [
    "run", join(INSTANCE, "scripts", "gen-slice-sqlite.ts"),
    "--out", join(site, "assets", "slices"),
    "--payload-out", payloads,
  ], { stdio: "inherit" });

  server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", site], { stdio: "ignore" });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${BASE}/slices/search.html`)).ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("python3 -m http.server did not come up");
});

test.afterAll(() => {
  server?.kill();
  if (site) rmSync(site, { recursive: true, force: true });
});

type Search = {
  mode: string;
  how: string;
  rows: { key: string; title: string; payload: string | null }[];
  info: { downloaded: boolean; ms: number; opfsError: string | null };
};
const search = (page: Page, text: string) =>
  page.evaluate((t) => (window as unknown as { __sliceSearch(t: string): Promise<Search> }).__sliceSearch(t), text);

async function open(page: Page, slice: string, mode: RegExp | string = /.+/) {
  await page.goto(`${BASE}/slices/search.html?slice=${slice}`);
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", mode, { timeout: 60_000 });
  return page.locator("html").getAttribute("data-slice-ready");
}

/** Type a query, open the result whose title is `title`, and return its body locator. */
async function openResult(page: Page, query: string, title: string) {
  await page.fill("#q", query);
  const item = page.locator("#out li", { has: page.getByRole("button", { name: title, exact: true }) }).first();
  await expect(item).toBeVisible();
  await item.locator("button").click();
  return item.locator("pre");
}

// ── beans ────────────────────────────────────────────────────────────────

// A unique id only: `folio-assistant-t3n8` is declared by two files, a store
// defect the builder reports.
const ids = beans.map((b) => b.id);
const knownBean = beans.find((b) => ids.indexOf(b.id) === ids.lastIndexOf(b.id) && PHRASE.test(b.title) && b.body.trim().length > 0)!;
const beanPhrase = knownBean.title.match(PHRASE)![0];

test("beans: mounts in OPFS, a phrase search finds a known bean, its body is fetched on demand, and a reload does not download", async ({ page }) => {
  const ready = await open(page, "beans");
  expect(ready, (await page.locator("#state").textContent()) ?? "").toBe("opfs-sahpool");
  const r = await search(page, `"${beanPhrase}"`);
  expect(r.how).toBe("fts5");
  expect(r.rows.map((x) => x.key)).toContain(knownBean.id);
  expect(r.info.downloaded).toBe(true);
  console.log(`[q8ar] beans first open: ${r.info.ms} ms; "${beanPhrase}" → ${r.rows.length} row(s)`);

  const pre = await openResult(page, `"${beanPhrase}"`, knownBean.title);
  await expect(pre).toContainText(knownBean.body.trim().split("\n")[0]!.trim().slice(0, 40));

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", "opfs-sahpool", { timeout: 60_000 });
  const again = await search(page, "bean");
  expect(again.info.downloaded).toBe(false);
  expect(again.rows.length).toBeGreaterThan(0);
  console.log(`[q8ar] beans reload: no download, ready in ${again.info.ms} ms`);
});

test("beans: the old bean-search address sends the browser to the slice page", async ({ page }) => {
  await page.goto(`${BASE}/beans/search.html`);
  await expect(page).toHaveURL(/\/slices\/search\.html\?slice=beans$/);
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", /.+/, { timeout: 60_000 });
});

test("beans: with no Worker the slice opens in memory and still answers", async ({ page }) => {
  await page.addInitScript(() => { delete (window as unknown as { Worker?: unknown }).Worker; });
  await open(page, "beans", "memory");
  const r = await search(page, `"${beanPhrase}"`);
  expect(r.rows.map((x) => x.key)).toContain(knownBean.id);
  await expect(page.locator("#state")).toContainText("in memory");
});

// ── todos ────────────────────────────────────────────────────────────────

const todoIndex = JSON.parse(readFileSync(join(DOCS, "assets", "todos", "index.json"), "utf-8")) as {
  items: { id: string; summary: string; comment: string }[];
};
const knownTodo = todoIndex.items.find((t) => /[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(t.summary))!;

test("todos: a phrase from a todo's summary finds it, and its source file is fetched as the body", async ({ page }) => {
  expect(await open(page, "todos")).toBe("opfs-sahpool");
  const phrase = knownTodo.summary.match(/[A-Za-z]{4,}\s+[A-Za-z]{4,}/)![0];
  const r = await search(page, `"${phrase}"`);
  expect(r.how).toBe("fts5");
  expect(r.rows.map((x) => x.key)).toContain(knownTodo.id);
  console.log(`[q8ar] todos first open: ${r.info.ms} ms; "${phrase}" → ${r.rows.length} row(s)`);
  const pre = await openResult(page, `"${phrase}"`, knownTodo.summary);
  // The body is the todo's SOURCE file; its comment's first words are in it.
  await expect(pre).toContainText(knownTodo.comment.trim().split(/\s+/).slice(0, 4).join(" "));
});

// ── library ──────────────────────────────────────────────────────────────

const libraryIndex = JSON.parse(readFileSync(join(DOCS, "assets", "library", "index.json"), "utf-8")) as { entries: { id: string; title: string }[] };
const knownBlock = (() => {
  for (const e of [...libraryIndex.entries].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const p = join(DOCS, "assets", "library", "entries", `${e.id}.json`);
    if (!existsSync(p)) continue;
    const entry = JSON.parse(readFileSync(p, "utf-8")) as { blocks: { id: string; title: string; content: string | null }[] };
    // THREE words on one line, so the phrase is rare enough to rank its block
    // inside the page's 50-row limit.
    const three = /[A-Za-z]{5,} [A-Za-z]{5,} [A-Za-z]{5,}/;
    const b = entry.blocks.find((x) => x.title && x.content && three.test(x.content));
    if (b) return { entry: e, block: b, phrase: b.content!.match(three)![0] };
  }
  throw new Error("no library block with text to search for");
})();

test("library: a phrase from a block's text finds the block, and its text comes from the PUBLISHED entry payload", async ({ page }) => {
  expect(await open(page, "library")).toBe("opfs-sahpool");
  const r = await search(page, `"${knownBlock.phrase}"`);
  expect(r.how).toBe("fts5");
  expect(r.rows.map((x) => x.key)).toContain(knownBlock.block.id);
  console.log(`[q8ar] library first open: ${r.info.ms} ms; "${knownBlock.phrase}" → ${r.rows.length} row(s)`);
  const pre = await openResult(page, `"${knownBlock.phrase}"`, knownBlock.block.title);
  await expect(pre).toContainText(knownBlock.block.content!.slice(0, 40));
  if (SHOT) await page.screenshot({ path: SHOT, fullPage: false });
});

// ── kg (the whole repository) ────────────────────────────────────────────

test("kg: the whole-repo slice finds a skill node, and its instruction body is the committed payload", async ({ page }) => {
  expect(await open(page, "kg")).toBe("opfs-sahpool");
  const r = await search(page, `"todo manager"`);
  expect(r.how).toBe("fts5");
  const hit = r.rows.find((x) => x.key === "skill/todo-manager");
  expect(hit, JSON.stringify(r.rows.slice(0, 5))).toBeDefined();
  expect(hit!.payload).toMatch(/^[0-9a-f]{64}$/);
  console.log(`[q8ar] kg first open: ${r.info.ms} ms; "todo manager" → ${r.rows.length} row(s)`);
  const body = await page.evaluate(async (hex) => (await fetch(`../payload/sha256/${hex}`)).text(), hit!.payload!);
  expect(body).toContain("beans");
});

test("with no slice named, the page lists every built slice and opens none", async ({ page }) => {
  await page.goto(`${BASE}/slices/search.html`);
  await expect(page.locator("html")).toHaveAttribute("data-slice-ready", "none");
  await expect(page.locator("#slices a")).toHaveText(["beans", "kg", "library", "todos"]);
});
