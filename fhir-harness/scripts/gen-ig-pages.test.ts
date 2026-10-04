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
 * Since stage D (#1767) the chrome is the TEMPLATE's (`folio-ig-chrome/v2`)
 * and states no IG's status; each IG's status is its own `ig-identity.json`.
 * smart-trust carries one (read from its sushi-config); smart-base does not.
 *
 * Calibrated: making `statusFor` ignore the identity's package (returning
 * `IDENTITY.status` for any IG) still leaves smart-base bare, because it has no
 * identity file — so the identity-mismatch rule is pinned in
 * `ig-identity.test.ts` instead, and here deleting smart-trust's
 * `ig-identity.json` fails the first test.
 *
 * @module fhir-harness/scripts/gen-ig-pages.test
 */
import { describe, expect, it } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

describe("gen-ig-pages defaults: this layer names no publisher (fhir-harness/AGENTS.md)", () => {
  it("with no --publish-note or --sidecar-label, the pages carry neither WHO's note nor DAK headings", () => {
    // A scratch instance holding only a copy of a real index, so the run is
    // not vacuous. A DIRECT CHILD of the checkout, like every real instance,
    // because the chrome is found through `repoRootFor`, which is the parent
    // directory: anywhere else no banner is drawn and the publish-note
    // assertion below passes vacuously (measured: it did, twice). Removed in
    // `finally`, so no gate sees it.
    const dir = mkdtempSync(join(ROOT, "gen-ig-pages-scratch-"));
    try {
      cpSync(join(ROOT, "smart-trust", "fhir-artifact-index", "index.json"), join(dir, "fhir-artifact-index", "index.json"), { recursive: true });
      const run = Bun.spawnSync(["bun", "run", join(ROOT, "fhir-harness/scripts/gen-ig-pages.ts"), "--instance", dir, "--chrome-owner", "smart-base"], { cwd: ROOT });
      expect(run.exitCode).toBe(0);
      const index = readFileSync(join(dir, "docs", "index.md"), "utf8");
      // The banner is drawn (a chrome is given), so the publish note is really on the page.
      expect(index).toContain('<p id="publish-box">This page mirrors a published FHIR Implementation Guide.')
      expect(index).toContain("## IG API surface");
      expect(index).not.toContain("WHO Implementation Guide");
      expect(index).not.toMatch(/^## DAK/m);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("gen-ig-pages --compiled-data: an AST-built artefact page loads its resource", () => {
  // The committed smart-trust index with ONE artefact made a compiled copy, the
  // shape `ast-to-artifact-index` writes. Scratch instance as above.
  function scratch(): { dir: string; holder: () => string } {
    const dir = mkdtempSync(join(ROOT, "gen-ig-pages-scratch-"));
    const ix = JSON.parse(readFileSync(join(ROOT, "smart-trust", "fhir-artifact-index", "index.json"), "utf8"));
    const a = ix.artifacts.find((x: { key: string }) => x.key === "ActorDefinition/Holder");
    expect(a).toBeDefined();
    a.materialization = {
      state: "materialized",
      provenance: { upstream: a.published.html.url, local: "fsh-generated/resources/ActorDefinition-Holder.json" },
      localPath: "output-ast/resources/ActorDefinition/Holder--7ae5e8a1.json",
      gates: Object.fromEntries(
        ["size", "restrictions", "retention", "sourceLoss", "copyright"].map((g) => [g, { verdict: "unknown", basis: "test" }]),
      ),
      purpose: "compiled",
      inputs: { toolchain: "ig-publisher test", sourceRevision: "0".repeat(40), inputDigest: "0".repeat(64) },
      materializedAt: "2026-10-02T00:00:00Z",
    };
    mkdirSync(join(dir, "fhir-artifact-index"), { recursive: true });
    writeFileSync(join(dir, "fhir-artifact-index", "index.json"), JSON.stringify(ix));
    return { dir, holder: () => readFileSync(join(dir, "docs", "artifact", "ActorDefinition-Holder.md"), "utf8") };
  }
  const gen = (dir: string, ...extra: string[]) =>
    Bun.spawnSync(["bun", "run", join(ROOT, "fhir-harness/scripts/gen-ig-pages.ts"), "--instance", dir, ...extra], { cwd: ROOT });

  it("with --compiled-data: a pointer, a visible loading state, a no-script link, and the shared loader", () => {
    const { dir, holder } = scratch();
    try {
      expect(gen(dir, "--compiled-data", "../ast-data").exitCode).toBe(0);
      const md = holder();
      // `artifact/Name.html` → docs root `../` → the data beside the docs.
      expect(md).toContain('data-ast-src="../../ast-data/resources/ActorDefinition/Holder--7ae5e8a1.json"');
      expect(md).toContain('data-ast-pages="../assets/ast-pages.json"');
      // The base the index says the IG publishes from (the owner's fork since #1766).
      expect(md).toContain('data-ast-published="https://litlfred.github.io/smart-trust/"');
      expect(md).toContain('<p class="ast-state">');
      expect(md).toMatch(/<noscript>.*href="\.\.\/\.\.\/ast-data\/resources\/ActorDefinition\/Holder--7ae5e8a1\.json"/);
      expect(md).toContain('<script src="../assets/ast-resource.js" defer></script>');
      expect(existsSync(join(dir, "docs", "assets", "ast-resource.js"))).toBe(true);
      const list = JSON.parse(readFileSync(join(dir, "docs", "assets", "ast-pages.json"), "utf8")) as string[];
      expect(list).toContain("ActorDefinition-Holder.html");
      // Only the one compiled artefact gets the section; the rest are as before.
      expect(readFileSync(join(dir, "docs", "artifact", "ActorDefinition-Issuer.md"), "utf8")).not.toContain("data-ast-src");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("without --compiled-data: no section, no loader — the published-IG pages are unchanged", () => {
    const { dir, holder } = scratch();
    try {
      expect(gen(dir).exitCode).toBe(0);
      expect(holder()).not.toContain("data-ast-src");
      expect(existsSync(join(dir, "docs", "assets", "ast-resource.js"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
