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
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { IgIdentitySchema, igSiteData, readIgIdentity } from "../platform/index.js";

const ROOT = resolve(import.meta.dir, "..", "..");

/** The banner markup only — the stylesheet above it legitimately names `.ig-status-draft`. */
function banner(src: string): string {
  const start = src.indexOf('<div class="st-ig">');
  const end = src.indexOf("</div>\n\n", start);
  expect(start).toBeGreaterThan(-1);
  return src.slice(start, end);
}

describe("the committed pages: the banner's identity is the index's", () => {
  // smart-trust's docs build into its IG site (`igSite`, bean `mftp`), whose
  // index the IG writes. Since thin became the default (fhir-harness
  // `gen-ig-pages`, owner 2026-10-12: "make thin default") an ARTEFACT page is
  // a thin `.html` shell that draws itself from its JSON-LD node and carries no
  // banner; the banner is on the full pages that remain — the JSON view and
  // tab pages, and the IG API view pages — so it is read there.
  it("smart-trust, whose chrome IS its own, keeps its draft watermark", () => {
    const b = banner(readFileSync(join(ROOT, "smart-trust", "docs", "artifact", "ActorDefinition-Holder.json.md"), "utf8"));
    expect(b).toContain(">smart.who.int.trust</a>");
    expect(b).toContain('class="ig-status-draft"');
  });

  // smart-base's docs build into its IG site too (bean `mftp`, "no drift").
  // Its index holds no package, so it has no JSON view pages; its full pages
  // are the IG API views, and the DAK schema's carries the banner.
  it("smart-base names itself and asserts no status borrowed from smart-trust", () => {
    const b = banner(readFileSync(join(ROOT, "smart-base", "docs", "artifact", "StructureDefinition-DAK.schema.json.md"), "utf8"));
    expect(b).toContain(">smart.who.int.base</a>");
    expect(b).toContain("http://smart.who.int/base");
    expect(b).not.toContain("smart.who.int.trust");
    expect(b).not.toMatch(/class="ig-status-/);
  });
});

describe("the committed pages: the landing page", () => {
  // Since bean `mftp` neither IG commits a landing page: its IG site's own
  // home page is the root, and the harness is reached through the navbar.
  // Thin (the default since 2026-10-12), neither commits the artefact index's
  // front matter either: `artifacts.html` is a finished thin page that
  // `build-ig-site` draws from the index NODE and that carries `rendered-by`
  // itself, so what each commits for the index is that node, naming its own
  // IG; the visualiser is declared in the instance's `visualisers` (owner
  // 2026-10-09).
  const indexNode = (instance: string) =>
    JSON.parse(readFileSync(join(ROOT, instance, "docs", "artifact", "index.jsonld"), "utf8")) as Record<string, unknown>;

  it("smart-base commits no landing page, and its artefact index is the thin page's node", () => {
    expect(existsSync(join(ROOT, "smart-base", "docs", "index.md"))).toBe(false);
    expect(existsSync(join(ROOT, "smart-base", "docs", "artifacts.md"))).toBe(false);
    const n = indexNode("smart-base");
    expect(n["$schema"]).toBe("folio-ig-artifact-index-jsonld/v1");
    expect(n["dcterms:identifier"]).toBe("smart.who.int.base");
    expect(n["dcterms:title"]).toBe("WHO SMART Base");
  });

  it("smart-trust commits no landing page, and its artefact index is the thin page's node", () => {
    expect(existsSync(join(ROOT, "smart-trust", "docs", "index.md"))).toBe(false);
    expect(existsSync(join(ROOT, "smart-trust", "docs", "artifacts.md"))).toBe(false);
    const n = indexNode("smart-trust");
    expect(n["$schema"]).toBe("folio-ig-artifact-index-jsonld/v1");
    expect(n["dcterms:identifier"]).toBe("smart.who.int.trust");
    expect(n["dcterms:title"]).toBe("WHO SMART Trust");
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
