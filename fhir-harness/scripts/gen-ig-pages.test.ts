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
import { readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

import { IPA, IPS, IPS_IDENTITY, artifactIndex, scratchRepo } from "../test/support/ig-fixture";

const ROOT = resolve(import.meta.dir, "..", "..");
const SCRIPT = join(ROOT, "fhir-harness/scripts/gen-ig-pages.ts");

const repo = scratchRepo({
  ips: { index: artifactIndex(IPS, "ips"), identity: IPS_IDENTITY },
  ipa: { index: artifactIndex(IPA, "ipa") },
  plain: { index: artifactIndex(IPS, "plain"), identity: IPS_IDENTITY },
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
    expect(index).toContain("## API sidecars surface");
    expect(index).not.toContain("HL7");
    // The per-artefact page carries the label too, as a heading of its own.
    const artefact = readFileSync(join(repo, "plain", "docs", "artifact", "StructureDefinition-Composition-uv-ips.md"), "utf8");
    expect(artefact).toMatch(/^## API sidecars$/m);
    expect(artefact).not.toContain("HL7 sidecars");
  });
});
