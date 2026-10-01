/**
 * `gen-ig-pages.ts` is generic: what it may and may not take from a chrome
 * ingested from ANOTHER IG.
 *
 * smart-base's `chrome.json` was ingested from smart-trust's template chain and
 * names `smart.who.int.trust` 1.8.0, `draft` (bean `bamf`). The tokens and rules
 * are the TEMPLATE's and hold for both IGs; the identity and the status are
 * smart-trust's. These tests read the COMMITTED pages — the ones `--check`
 * keeps current — so they assert what a reader is served, not what a function
 * returns.
 *
 * Calibrated: making `statusFor` return `chrome.status` unconditionally puts
 * `class="ig-status-draft"` on smart-base's banner and fails the second test.
 *
 * @module fhir-harness/scripts/gen-ig-pages.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");
const page = (instance: string): string => readFileSync(join(ROOT, instance, "docs", "index.md"), "utf8");

/** The banner markup only — the stylesheet above it legitimately names `.ig-status-draft`. */
function banner(src: string): string {
  const start = src.indexOf('<div class="st-ig">');
  const end = src.indexOf("</div>\n\n", start);
  expect(start).toBeGreaterThan(-1);
  return src.slice(start, end);
}

describe("gen-ig-pages: the banner's identity is the index's", () => {
  it("smart-trust, whose chrome IS its own, keeps its draft watermark", () => {
    const b = banner(page("smart-trust"));
    expect(b).toContain(">smart.who.int.trust</a>");
    expect(b).toContain('class="ig-status-draft"');
  });

  it("smart-base names itself and asserts no status borrowed from smart-trust", () => {
    const b = banner(page("smart-base"));
    expect(b).toContain(">smart.who.int.base</a>");
    expect(b).toContain("http://smart.who.int/base");
    expect(b).not.toContain("smart.who.int.trust");
    expect(b).not.toMatch(/class="ig-status-/);
  });
});

describe("gen-ig-pages --summary: the landing page", () => {
  it("smart-base's index opens with its own harness section, then the artefact index", () => {
    const src = page("smart-base");
    expect(src).toMatch(/^---\ntitle: "WHO SMART Base"\n/);
    const include = src.indexOf('{% include harness_details.html instance="smart-base" %}');
    const index = src.indexOf("## Artefact index");
    expect(include).toBeGreaterThan(-1);
    expect(index).toBeGreaterThan(include);
  });

  it("smart-trust, generated without --summary, is unchanged: no include, artefact-index title", () => {
    const src = page("smart-trust");
    expect(src).not.toContain("harness_details.html");
    expect(src).toMatch(/^---\ntitle: "WHO SMART Trust — artefact index"\n/);
  });
});
