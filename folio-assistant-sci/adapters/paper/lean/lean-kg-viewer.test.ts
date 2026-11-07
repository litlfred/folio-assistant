import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Static guards for the published viewer (lean-kg-viewer/). The viewer runs in a
// browser and has no exports, so these read its source: third-party scripts stay
// pinned with Subresource Integrity, and HTML from the data reaches the page only
// through the sanitiser.
const dir = join(import.meta.dir, "lean-kg-viewer");
const html = readFileSync(join(dir, "index.html"), "utf-8");
const js = readFileSync(join(dir, "viewer.js"), "utf-8");

describe("lean-kg-viewer", () => {
  const external = [...html.matchAll(/<script\b[^>]*\bsrc="(https?:[^"]+)"[^>]*>/g)];

  test("every third-party script is version-pinned and carries SRI + crossorigin", () => {
    expect(external.length).toBeGreaterThan(0);
    for (const [tag, src] of external) {
      expect(src).toMatch(/@\d+\.\d+\.\d+\//);
      expect(tag).toMatch(/\bintegrity="sha(384|512)-[A-Za-z0-9+/]+={0,2}"/);
      expect(tag).toMatch(/\bcrossorigin="anonymous"/);
    }
  });

  test("DOMPurify is loaded", () => {
    expect(external.some(([, src]) => /\/dompurify@[^/]+\/dist\/purify(\.min)?\.js$/.test(src!))).toBe(true);
  });

  test("innerHTML is assigned only from DOMPurify's output", () => {
    const sets = [...js.matchAll(/\.innerHTML\s*=([^;]*);/g)];
    expect(sets.length).toBe(1);
    expect(sets[0]![1]!.trim()).toMatch(/^purify\.sanitize\(/);
    expect(js).not.toMatch(/\b(outerHTML\s*=|insertAdjacentHTML|document\.write)\b/);
  });

  test("without DOMPurify the viewer falls back to text, not raw HTML", () => {
    expect(js).toMatch(/else node\.textContent = htmlText\(html\)/);
    expect(js).toMatch(/if \(window\.marked && window\.DOMPurify\)/);
  });
});
