/**
 * The COMMITTED WHO IG pages and data that fhir-harness's generic scripts
 * produce: what a reader of `/smart-base/` and `/smart-trust/` is served.
 *
 * These assertions lived in fhir-harness's own tests until #1963. They are
 * facts about WHO instances, and fhir-harness refuses to know about WHO
 * (`fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md`), so they moved
 * here unchanged. The generic behaviour behind them is still tested in
 * fhir-harness, over a non-WHO IG.
 *
 * smart-base's chrome was ingested from smart-trust's template chain (bean
 * `bamf`). Since stage D (#1767) the chrome is the TEMPLATE's and states no
 * IG's status; each IG's status is its own `ig-identity.json`. smart-trust
 * carries one (read from its sushi-config); smart-base does not. Deleting
 * smart-trust's `ig-identity.json` fails the first test of each group.
 *
 * Coupled to bean `lbz8` (#2082): it plans to move the generated IG pages off
 * `main` to the `cat/fhir-harness/ig-docs` branch. When it lands, the
 * `page("smart-base")` / `page("smart-trust")` reads below find no committed
 * `docs/index.md` and these groups must read the pages from that branch (or
 * generate them into a scratch tree) instead.
 *
 * @module smart-base/scripts/ig-pages-committed.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { IgIdentitySchema, readIgIdentity } from "../../fhir-harness/schemas/ig-identity";
import { igSiteData } from "../../fhir-harness/scripts/ig-site-data";

const ROOT = resolve(import.meta.dir, "..", "..");
const page = (instance: string): string => readFileSync(join(ROOT, instance, "docs", "index.md"), "utf8");

/** The banner markup only — the stylesheet above it legitimately names `.ig-status-draft`. */
function banner(src: string): string {
  const start = src.indexOf('<div class="st-ig">');
  const end = src.indexOf("</div>\n\n", start);
  expect(start).toBeGreaterThan(-1);
  return src.slice(start, end);
}

describe("the committed pages: the banner's identity is the index's", () => {
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

describe("the committed pages: the landing page", () => {
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

describe("the committed identities", () => {
  it("smart-trust's validates and names its own package", () => {
    const id = readIgIdentity(join(ROOT, "smart-trust", "fhir-artifact-index"));
    expect(id).toBeDefined();
    expect(IgIdentitySchema.safeParse(id).success).toBe(true);
    expect(id!.id).toBe("smart.who.int.trust");
  });
  it("smart-base has none, so it states no status (the third state)", () => {
    expect(readIgIdentity(join(ROOT, "smart-base", "fhir-artifact-index"))).toBeUndefined();
  });
});

describe("site.data.fhir from smart-base's committed artifact index", () => {
  const r = igSiteData(join(ROOT, "smart-base"));

  it("writes what the index carries, from the index", () => {
    expect(r.data.packageId).toBe("smart.who.int.base");
    expect(r.data.canonical).toBe("http://smart.who.int/base");
    expect(r.data.ig.version).toBe("0.3.0");
    expect(r.data.ig.fhirVersion).toEqual(["4.0.1"]);
    expect(r.provenance["ig.version"]).toBe("fhir-artifact-index/index.json");
  });

  it("lists what it could not source instead of writing empty strings", () => {
    expect(r.undetermined).toEqual(expect.arrayContaining(["ig.id", "ig.name", "ig.publisher"]));
    expect(JSON.stringify(r.data)).not.toContain('""');
  });

  it("states no status: smart-base has no ig-identity.json, and the template's chrome states none", () => {
    expect(r.data.ig.status).toBeUndefined();
    expect(r.refused).toEqual([]);
  });
});

describe("site.data.fhir from smart-trust's index, which carries its own ig-identity.json", () => {
  const r = igSiteData(join(ROOT, "smart-trust"));

  it("status comes from the IG's own identity file", () => {
    expect(r.data.ig.status).toBe("draft");
    expect(r.provenance["ig.status"]).toBe("fhir-artifact-index/ig-identity.json");
  });
});
