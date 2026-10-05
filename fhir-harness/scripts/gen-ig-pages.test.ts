/**
 * `gen-ig-pages.ts` is generic: what it may and may not take from a chrome
 * ingested from ANOTHER IG.
 *
 * The chrome is the TEMPLATE's (`folio-ig-chrome/v2`) and states no IG's
 * status; each IG's status is its own `ig-identity.json`. Here two IGs share
 * one chrome: IPS carries an identity, IPA does not. The runs write real
 * pages into a scratch repository, so these tests assert what a reader would
 * be served, not what a function returns.
 *
 * The subject is a non-WHO IG on purpose (#1963): this layer refuses to know
 * about WHO (`ig-build-pipeline.md`). The same assertions about the COMMITTED
 * WHO pages live in `smart-base/scripts/ig-pages-committed.test.ts`.
 *
 * Calibrated: making `statusFor` ignore the identity's package (returning
 * `IDENTITY.status` for any IG) still leaves IPA bare, because it has no
 * identity file — so the identity-mismatch rule is pinned in
 * `ig-identity.test.ts` instead, and here dropping IPS's identity fails the
 * first test.
 *
 * @module fhir-harness/scripts/gen-ig-pages.test
 */
import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

import { IPA, IPS, IPS_IDENTITY, artifactIndex, scratchRepo } from "../test/support/ig-fixture";

const ROOT = resolve(import.meta.dir, "..", "..");
const SCRIPT = join(ROOT, "fhir-harness/scripts/gen-ig-pages.ts");

/**
 * IPS's index with a second profile, and the FIRST made a compiled copy — the
 * shape `ast-to-artifact-index` writes. The second stays referenced, so a page
 * that must NOT get the resource section exists beside one that must.
 */
function compiledIndex(id: string): Record<string, unknown> {
  const ix = artifactIndex(IPS, id) as { artifacts: Record<string, unknown>[]; count: number };
  const [composition] = ix.artifacts;
  const page = `${IPS.published}/StructureDefinition-Patient-uv-ips`;
  ix.artifacts.push({
    ...composition,
    key: "StructureDefinition/Patient-uv-ips",
    id: "Patient-uv-ips",
    published: { json: { url: `${page}.json` }, html: { url: `${page}.html` } },
    materialization: { state: "referenced", provenance: { upstream: `${page}.html` } },
    canonical: `${IPS.canonical}/StructureDefinition/Patient-uv-ips`,
    name: "PatientUvIps",
    title: "Patient (IPS)",
  });
  ix.count = ix.artifacts.length;
  composition.materialization = {
    state: "materialized",
    provenance: {
      upstream: `${IPS.published}/StructureDefinition-Composition-uv-ips.html`,
      local: "fsh-generated/resources/StructureDefinition-Composition-uv-ips.json",
    },
    localPath: "output-ast/resources/StructureDefinition/Composition-uv-ips--7ae5e8a1.json",
    gates: Object.fromEntries(
      ["size", "restrictions", "retention", "sourceLoss", "copyright"].map((g) => [g, { verdict: "unknown", basis: "test" }]),
    ),
    purpose: "compiled",
    inputs: { toolchain: "ig-publisher test", sourceRevision: "0".repeat(40), inputDigest: "0".repeat(64) },
    materializedAt: "2026-10-02T00:00:00Z",
  };
  return ix;
}

const repo = scratchRepo({
  ips: { index: artifactIndex(IPS, "ips"), identity: IPS_IDENTITY },
  ipa: { index: artifactIndex(IPA, "ipa") },
  plain: { index: artifactIndex(IPS, "plain"), identity: IPS_IDENTITY },
  compiled: { index: compiledIndex("compiled") },
  uncompiled: { index: compiledIndex("uncompiled") },
});
afterAll(() => rmSync(repo, { recursive: true, force: true }));

function generate(instance: string, ...args: string[]): void {
  const run = Bun.spawnSync(["bun", "run", SCRIPT, "--instance", join(repo, instance), ...args], { cwd: ROOT });
  if (run.exitCode !== 0) throw new Error(`gen-ig-pages failed for ${instance}:\n${run.stderr.toString()}`);
}

// IPS: the IG's own identity, no --summary. IPA: no identity, --summary.
// Both name a WHO-free publish note and sidecar label, as a WHO caller names its own.
generate("ips", "--label", "International Patient Summary", "--chrome-owner", "chrome-owner",
  "--publish-note", "This page mirrors a published HL7 Implementation Guide.", "--sidecar-label", "HL7 sidecars");
generate("ipa", "--label", "International Patient Access", "--chrome-owner", "chrome-owner",
  "--publish-note", "This page mirrors a published HL7 Implementation Guide.", "--sidecar-label", "HL7 sidecars", "--summary");
// `plain`: no --publish-note, no --sidecar-label — the layer's own defaults.
generate("plain", "--label", "Plain", "--chrome-owner", "chrome-owner");

const page = (instance: string): string => readFileSync(join(repo, instance, "docs", "index.md"), "utf8");

/** The banner markup only — the stylesheet above it legitimately names `.ig-status-*`. */
function banner(src: string): string {
  const start = src.indexOf('<div class="st-ig">');
  const end = src.indexOf("</div>\n\n", start);
  expect(start).toBeGreaterThan(-1);
  return src.slice(start, end);
}

describe("gen-ig-pages: the banner's identity is the index's", () => {
  it("an IG with its own identity file keeps its status watermark", () => {
    const b = banner(page("ips"));
    expect(b).toContain(`>${IPS.packageId}</a>`);
    expect(b).toContain('class="ig-status-active"');
  });

  it("an IG with none names itself and asserts no status borrowed from another IG", () => {
    const b = banner(page("ipa"));
    expect(b).toContain(`>${IPA.packageId}</a>`);
    expect(b).toContain(IPA.canonical);
    expect(b).not.toContain(IPS.packageId);
    expect(b).not.toMatch(/class="ig-status-/);
  });
});

describe("gen-ig-pages --summary: the landing page", () => {
  it("with --summary the index opens with the instance's own harness section, then the artefact index", () => {
    const src = page("ipa");
    expect(src).toMatch(/^---\ntitle: "International Patient Access"\n/);
    const include = src.indexOf('{% include harness_details.html instance="ipa" %}');
    const index = src.indexOf("## Artefact index");
    expect(include).toBeGreaterThan(-1);
    expect(index).toBeGreaterThan(include);
  });

  it("generated without --summary: no include, artefact-index title", () => {
    const src = page("ips");
    expect(src).not.toContain("harness_details.html");
    expect(src).toMatch(/^---\ntitle: "International Patient Summary — artefact index"\n/);
  });
});

describe("gen-ig-pages: the publish note and the sidecar label are the caller's", () => {
  it("a caller's note and label are what the pages carry", () => {
    const index = page("ips");
    expect(index).toContain('<p id="publish-box">This page mirrors a published HL7 Implementation Guide.');
    expect(index).toContain("## HL7 sidecars surface");
  });

  it("with no --publish-note or --sidecar-label, the pages carry the layer's neutral defaults only", () => {
    const index = page("plain");
    // The banner is drawn (a chrome is given), so the publish note is really on the page.
    expect(index).toContain('<p id="publish-box">This page mirrors a published FHIR Implementation Guide.');
    expect(index).toContain("## IG API surface");
    expect(index).not.toContain("HL7");
    // The per-artefact page carries the label too, as a heading of its own.
    const artefact = readFileSync(join(repo, "plain", "docs", "artifact", "StructureDefinition-Composition-uv-ips.md"), "utf8");
    expect(artefact).toMatch(/^## IG API$/m);
    expect(artefact).not.toContain("HL7 sidecars");
  });
});

describe("gen-ig-pages --compiled-data: an AST-built artefact page loads its resource", () => {
  // The two runs differ only in the flag.
  generate("compiled", "--compiled-data", "../ast-data");
  generate("uncompiled");
  const artefact = (instance: string, name: string): string =>
    readFileSync(join(repo, instance, "docs", "artifact", `${name}.md`), "utf8");

  it("with --compiled-data: a pointer, a visible loading state, a no-script link, and the shared loader", () => {
    const md = artefact("compiled", "StructureDefinition-Composition-uv-ips");
    // `artifact/Name.html` → docs root `../` → the data beside the docs.
    expect(md).toContain('data-ast-src="../../ast-data/resources/StructureDefinition/Composition-uv-ips--7ae5e8a1.json"');
    expect(md).toContain('data-ast-pages="../assets/ast-pages.json"');
    // The base the IG publishes from, read off the artefact's own published page.
    expect(md).toContain(`data-ast-published="${IPS.published}/"`);
    expect(md).toContain('<p class="ast-state">');
    expect(md).toMatch(/<noscript>.*href="\.\.\/\.\.\/ast-data\/resources\/StructureDefinition\/Composition-uv-ips--7ae5e8a1\.json"/);
    expect(md).toContain('<script src="../assets/ast-resource.js" defer></script>');
    expect(existsSync(join(repo, "compiled", "docs", "assets", "ast-resource.js"))).toBe(true);
    const list = JSON.parse(readFileSync(join(repo, "compiled", "docs", "assets", "ast-pages.json"), "utf8")) as string[];
    expect(list).toContain("StructureDefinition-Composition-uv-ips.html");
    // Only the one compiled artefact gets the section; the rest are as before.
    expect(artefact("compiled", "StructureDefinition-Patient-uv-ips")).not.toContain("data-ast-src");
  });

  it("without --compiled-data: no section, no loader — the published-IG pages are unchanged", () => {
    expect(artefact("uncompiled", "StructureDefinition-Composition-uv-ips")).not.toContain("data-ast-src");
    expect(existsSync(join(repo, "uncompiled", "docs", "assets", "ast-resource.js"))).toBe(false);
  });
});
