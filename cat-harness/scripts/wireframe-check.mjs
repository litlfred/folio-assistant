#!/usr/bin/env node
// Mechanical checks for mid-fidelity wireframe candidates (methodology `wiregen`,
// process `wireframe-design-review`, step "Mechanical checks, both viewports").
//
//   bun run wireframe:check <candidate.html>... [--out DIR]   (issue #1023)
//
// Each candidate is rendered at a WEB and a MOBILE viewport. Per candidate and
// viewport it records a `script` entry per criterion (pass/fail, never a score):
//   renders       - the page loads and has visible content
//   no-overflow   - no horizontal scroll (the mobile failure that matters most)
//   no-placeholder- no lorem ipsum, no TODO/FIXME/XXX marker: mid-fidelity means real content
// and writes a screenshot for the human and agent reviewers. Exit 1 on any fail.
// Playwright is this repository's own dependency; Chromium from PLAYWRIGHT_BROWSERS_PATH.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const VIEWPORTS = { web: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } };
// Filler prose is matched case-insensitively. Author markers (TODO, FIXME, XXX)
// only in capitals: "todo" is real content in this repository (a bean status,
// the todos/ graph), and a wireframe of those pages must be able to say it.
const PLACEHOLDER_PROSE = /lorem ipsum|dolor sit amet|placeholder text/i;
const PLACEHOLDER_MARKER = /\bTODO\b|\bFIXME\b|\bXXX+\b/;
const placeholderIn = (text) => text.match(PLACEHOLDER_PROSE) ?? text.match(PLACEHOLDER_MARKER);

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = resolve(outIdx >= 0 ? args[outIdx + 1] : ".build/wireframes");
const files = args.filter((a, i) => !a.startsWith("--") && (outIdx < 0 || i !== outIdx + 1));
if (!files.length) {
  console.error("usage: wireframe_check.mjs <candidate.html>... [--out DIR]");
  process.exit(2);
}

const { chromium } = await import("playwright");
const exe = ["/opt/pw-browsers/chromium", process.env.CHROMIUM].find((p) => p && existsSync(p));
const browser = await chromium.launch({ args: ["--no-sandbox"], ...(exe ? { executablePath: exe } : {}) });
mkdirSync(out, { recursive: true });

const report = { tool: "wireframe-check", viewports: VIEWPORTS, candidates: [] };
let failed = 0;
for (const f of files) {
  const cand = { file: f, entries: [] };
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage({ viewport: size });
    const entry = (criterion, ok, note) => {
      cand.entries.push({ kind: "script", viewport: vp, criterion, result: ok ? "pass" : "fail", notes: note });
      if (!ok) failed++;
    };
    try {
      await page.goto("file://" + resolve(f), { waitUntil: "load", timeout: 30000 });
      const m = await page.evaluate(() => ({
        text: document.body.innerText,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
      }));
      entry("renders", m.text.trim().length > 0, `${m.text.trim().length} characters of visible text`);
      entry("no-overflow", m.scrollW <= m.clientW, `scrollWidth ${m.scrollW}, viewport ${m.clientW}`);
      const hit = placeholderIn(m.text);
      entry("no-placeholder", !hit, hit ? `found "${hit[0]}"` : "none found");
      const shot = resolve(out, `${basename(f, ".html")}.${vp}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      cand[`${vp}Screenshot`] = shot;
    } catch (e) {
      entry("renders", false, String(e).slice(0, 200));
    }
    await page.close();
  }
  report.candidates.push(cand);
}
await browser.close();
writeFileSync(resolve(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
for (const c of report.candidates)
  console.log(`${c.file}: ` + c.entries.map((e) => `${e.viewport}/${e.criterion}=${e.result}`).join(" "));
process.exit(failed ? 1 : 0);
