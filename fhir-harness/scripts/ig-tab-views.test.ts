/**
 * An artefact's TAB VIEWS as thin pages (owner, 2026-10-14, answering whether
 * the IG Publisher's per-artefact tab views are rendered: "3. Render them
 * too"; and "I DO NOT WANT THE IG PUBLISHER HTML").
 *
 * Over a non-WHO IG (`ig-fixture.ts`) built the way an IG repository's own
 * site builds it (`gen-ig-pages --ig-site --publisher-data .`): a page per
 * view, at the Publisher's tab file name beside the artefact's page; each one
 * thin and free of the Publisher's chrome; every link and every file its
 * config names resolving in the site; the artefact's page linking its tabs;
 * and the narrative's links to the Publisher's tab file names pointed at
 * them.
 *
 * @module fhir-harness/scripts/ig-tab-views.test
 */
import { afterAll, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix, resolve } from "node:path";

import { thinPageConfigOf } from "../../cat-harness-tools/scripts/thin-page.ts";
import { FhirArtifactIndexSchema } from "../schemas/fhir-artifact-index.js";
import { IPS, artifactIndex, scratchRepo } from "../test/support/ig-fixture";
import { relinkArtifacts, stageIgSite } from "./build-ig-site";
import { PUBLISHER_CHROME, publisherChromePages, stateFromOutput } from "./ig-repo-site";
import { THIN_PAGE_CONFIG_ID, artifactTabFile, artifactTabs, thinArtifactView } from "./ig-thin-pages.ts";
import { artifactsFor } from "./stage-ig-sites";

const ROOT = resolve(import.meta.dir, "..", "..");
const SCRIPT = join(ROOT, "fhir-harness/scripts/gen-ig-pages.ts");
const BASE = "/x-ig";
const PROFILE = `${IPS.canonical}/StructureDefinition/Composition-uv-ips`;

/**
 * The index an IG site's compose reconstructs from `output/`: the profile, an
 * instance that claims it, and a ValueSet. Each published at the site's own
 * address, as `ig-index:build` writes it.
 */
function siteIndex(id: string): Record<string, unknown> {
  const ix = artifactIndex(IPS, id) as { artifacts: Record<string, unknown>[]; count: number };
  const at = (stem: string) => ({ json: { url: `${BASE}/${stem}.json` }, html: { url: `${BASE}/${stem}.html` } });
  const ref = (stem: string) => ({ state: "referenced", provenance: { upstream: `${BASE}/${stem}.html` } });
  const [profile] = ix.artifacts;
  profile!.published = at("StructureDefinition-Composition-uv-ips");
  profile!.materialization = ref("StructureDefinition-Composition-uv-ips");
  ix.artifacts.push(
    {
      key: "Composition/example",
      resourceType: "Composition",
      id: "example",
      published: at("Composition-example"),
      materialization: ref("Composition-example"),
      category: "Example: Composition",
      title: "An example",
      profiles: [PROFILE],
    },
    {
      key: "StructureDefinition/Lonely",
      resourceType: "StructureDefinition",
      id: "Lonely",
      published: at("StructureDefinition-Lonely"),
      materialization: ref("StructureDefinition-Lonely"),
      canonical: `${IPS.canonical}/StructureDefinition/Lonely`,
      name: "Lonely",
      category: "Structures: Resource Profiles",
      title: "A profile nothing claims",
    },
    {
      key: "ValueSet/sections",
      resourceType: "ValueSet",
      id: "sections",
      published: at("ValueSet-sections"),
      materialization: ref("ValueSet-sections"),
      canonical: `${IPS.canonical}/ValueSet/sections`,
      name: "Sections",
      category: "Terminology: Value Sets",
      title: "Sections",
    },
  );
  ix.count = ix.artifacts.length;
  return ix;
}

const repo = scratchRepo({ site: { index: siteIndex("site") } });
afterAll(() => rmSync(repo, { recursive: true, force: true }));
const inst = join(repo, "site");
const docs = join(inst, "docs");
const gen = Bun.spawnSync(["bun", "run", SCRIPT, "--instance", inst, "--label", "X IG", "--ig-site", "--publisher-data", "."], { cwd: ROOT });
if (gen.exitCode !== 0) throw new Error(`gen-ig-pages failed:\n${gen.stderr.toString()}${gen.stdout.toString()}`);
// What the rest of the site serves beside the artefact pages: the IG's own
// pages (`build-ig-site`) and the Publisher's JSON, copied as data
// (`ig-site:publisher-pages`).
for (const f of ["index.html", "artifacts.html", "toc.html"]) writeFileSync(join(docs, f), "<!doctype html><title>x</title>");
for (const stem of ["StructureDefinition-Composition-uv-ips", "StructureDefinition-Lonely", "Composition-example", "ValueSet-sections"]) writeFileSync(join(docs, `${stem}.json`), "{}");

const page = (file: string) => readFileSync(join(docs, "artifact", file), "utf8");
const IX = FhirArtifactIndexSchema.parse(siteIndex("unit"));
const [SD, EXAMPLE, , VS] = IX.artifacts as [(typeof IX.artifacts)[0], (typeof IX.artifacts)[0], (typeof IX.artifacts)[0], (typeof IX.artifacts)[0]];

describe("artifactTabs: which views an artefact gets, at the Publisher's file names", () => {
  it("a profile: its page, definitions, mappings, the JSON as .profile.json, and examples, claimed or not (owner, 2026-10-14: \"1a\")", () => {
    expect(artifactTabs(SD, { resource: true }).map((t) => t.file)).toEqual([
      "StructureDefinition-Composition-uv-ips.html",
      "StructureDefinition-Composition-uv-ips-definitions.html",
      "StructureDefinition-Composition-uv-ips-mappings.html",
      "StructureDefinition-Composition-uv-ips.profile.json.html",
      "StructureDefinition-Composition-uv-ips-examples.html",
    ]);
  });
  it("anything else: its page and the JSON view as .json", () => {
    expect(artifactTabs(VS, { resource: true }).map((t) => t.file)).toEqual(["ValueSet-sections.html", "ValueSet-sections.json.html"]);
    expect(artifactTabFile(EXAMPLE, "json")).toBe("Composition-example.json.html");
  });
  it("none without a resource this site serves: every view is drawn from it", () => {
    expect(artifactTabs(SD, { resource: false })).toEqual([]);
  });
});

describe("thinArtifactView: one shell, the view in its config", () => {
  const tabs = artifactTabs(SD, { resource: true });
  const html = thinArtifactView(IX, SD, "definitions", { label: "X IG", home: "../index.html", all: "../artifacts.html", resource: "../StructureDefinition-Composition-uv-ips.json", tabs, index: "index.jsonld" });
  it("names its own file as canonical and the node as its alternate", () => {
    expect(html).toContain('<link rel="canonical" href="StructureDefinition-Composition-uv-ips-definitions.html">');
    expect(html).toContain('<link rel="alternate" type="application/ld+json" href="StructureDefinition-Composition-uv-ips.jsonld">');
  });
  it("its config names the view and the resource; no reading order (that runs through the artefacts' own pages)", () => {
    const cfg = thinPageConfigOf(html, THIN_PAGE_CONFIG_ID)!;
    expect(cfg).toMatchObject({ view: "definitions", node: "StructureDefinition-Composition-uv-ips.jsonld", resource: "../StructureDefinition-Composition-uv-ips.json", astLoader: "../assets/ast-resource.js" });
    expect(cfg.prev).toBeUndefined();
    expect(cfg.next).toBeUndefined();
  });
  it("its tab bar links every view, the current one marked", () => {
    for (const t of tabs) expect(html).toContain(`href="${t.file}"`);
    expect(html).toContain('<a href="StructureDefinition-Composition-uv-ips-definitions.html" aria-current="page">');
  });
  it("is thin: the shared renderer, the rail linked, nothing of the resource in it", () => {
    expect(html).toContain('<script src="../assets/ig-artifact.js"></script>');
    expect(html).toContain('<meta name="folio-navbar" content="linked">');
    expect(html).not.toContain("A fixture profile.");
    expect(html.length).toBeLessThan(4000);
  });
});

describe("gen-ig-pages --ig-site --publisher-data: a thin page per view, beside the artefact's", () => {
  const files = readdirSync(join(docs, "artifact")).filter((f) => f.endsWith(".html")).sort();

  it("writes each view where the Publisher made one: definitions, mappings, JSON, and examples for every profile, claimed or not", () => {
    expect(files).toEqual([
      "Composition-example.html",
      "Composition-example.json.html",
      "StructureDefinition-Composition-uv-ips-definitions.html",
      "StructureDefinition-Composition-uv-ips-examples.html",
      "StructureDefinition-Composition-uv-ips-mappings.html",
      "StructureDefinition-Composition-uv-ips.html",
      "StructureDefinition-Composition-uv-ips.profile.json.html",
      "StructureDefinition-Lonely-definitions.html",
      "StructureDefinition-Lonely-examples.html",
      "StructureDefinition-Lonely-mappings.html",
      "StructureDefinition-Lonely.html",
      "StructureDefinition-Lonely.profile.json.html",
      "ValueSet-sections.html",
      "ValueSet-sections.json.html",
    ]);
    const views = files.map((f) => thinPageConfigOf(page(f), THIN_PAGE_CONFIG_ID)?.view ?? "content");
    expect(views.filter((v) => v === "content")).toHaveLength(4);
    expect(views.filter((v) => v === "json")).toHaveLength(4);
    expect(views.filter((v) => v === "examples")).toHaveLength(2);
  });

  it("every page is thin and wears none of the Publisher's chrome", () => {
    for (const f of files) {
      const html = page(f);
      expect(html.startsWith("<!doctype html>")).toBe(true);
      expect(html.length).toBeLessThan(4000);
      for (const re of PUBLISHER_CHROME) expect(re.test(html)).toBe(false);
    }
    expect(publisherChromePages(docs)).toEqual([]);
  });

  it("the artefact's own page links its tabs", () => {
    const html = page("StructureDefinition-Composition-uv-ips.html");
    for (const f of ["StructureDefinition-Composition-uv-ips-definitions.html", "StructureDefinition-Composition-uv-ips-mappings.html", "StructureDefinition-Composition-uv-ips.profile.json.html", "StructureDefinition-Composition-uv-ips-examples.html"]) {
      expect(html).toContain(`href="${f}"`);
    }
    expect(page("ValueSet-sections.html")).toContain('href="ValueSet-sections.json.html"');
  });

  it("every link, and every file a page's config names, resolves in the site", () => {
    const dead: string[] = [];
    for (const f of files) {
      const html = page(f);
      const cfg = thinPageConfigOf(html, THIN_PAGE_CONFIG_ID)!;
      const targets = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]!).filter((h) => !/^(data:|https?:|#)/.test(h));
      for (const k of ["node", "resource", "index", "pages", "astLoader", "footer", "toc", "home", "prev", "next", "definitions"]) if (typeof cfg[k] === "string") targets.push(cfg[k] as string);
      for (const t of targets) {
        const at = posix.normalize(`artifact/${t.split("#")[0]}`);
        if (!existsSync(join(docs, at))) dead.push(`${f} → ${t}`);
      }
    }
    expect(dead).toEqual([]);
  });

  it("each view draws from the Publisher's JSON the site carries, never its HTML", () => {
    const cfg = thinPageConfigOf(page("StructureDefinition-Composition-uv-ips-mappings.html"), THIN_PAGE_CONFIG_ID)!;
    // A mapping row links its element on the definitions view.
    expect(cfg).toMatchObject({ view: "mappings", resource: "../StructureDefinition-Composition-uv-ips.json", definitions: "StructureDefinition-Composition-uv-ips-definitions.html" });
    expect(thinPageConfigOf(page("StructureDefinition-Composition-uv-ips-examples.html"), THIN_PAGE_CONFIG_ID)).toMatchObject({ view: "examples", index: "index.jsonld" });
  });

  it("the narrative loader's list of this site's pages names every view, so a resource's narrative link to one stays", () => {
    const listed = JSON.parse(readFileSync(join(docs, "assets", "ast-pages.json"), "utf8")) as string[];
    expect(listed).toEqual(expect.arrayContaining(files));
    expect(existsSync(join(docs, "assets", "ast-resource.js"))).toBe(true);
  });
});

describe("the narrative's links to the Publisher's tab file names land on the thin views", () => {
  const a = artifactsFor(inst, "artifact/")!;

  it("artifactsFor names the views the generator wrote, beyond the artefacts' own pages", () => {
    expect(a.pages).toEqual([
      "Composition-example.json",
      "StructureDefinition-Composition-uv-ips-definitions",
      "StructureDefinition-Composition-uv-ips-examples",
      "StructureDefinition-Composition-uv-ips-mappings",
      "StructureDefinition-Composition-uv-ips.profile.json",
      "StructureDefinition-Lonely-definitions",
      "StructureDefinition-Lonely-examples",
      "StructureDefinition-Lonely-mappings",
      "StructureDefinition-Lonely.profile.json",
      "ValueSet-sections.json",
    ]);
  });

  it("relinkArtifacts points each at artifact/, anchors kept", () => {
    const names = new Set(["StructureDefinition-Composition-uv-ips", ...a.pages!]);
    const r = relinkArtifacts(
      '[d](StructureDefinition-Composition-uv-ips-definitions.html#Composition.section) <a href="StructureDefinition-Composition-uv-ips.profile.json.html">j</a> [m](StructureDefinition-Composition-uv-ips-mappings.html)',
      names,
      "artifact/",
    );
    expect(r.count).toBe(3);
    expect(r.text).toBe(
      '[d](artifact/StructureDefinition-Composition-uv-ips-definitions.html#Composition.section) <a href="artifact/StructureDefinition-Composition-uv-ips.profile.json.html">j</a> [m](artifact/StructureDefinition-Composition-uv-ips-mappings.html)',
    );
  });

  it("stageIgSite relinks them in the IG's own pages", () => {
    const d = mkdtempSync(join(tmpdir(), "fhir-harness-tabs-site-"));
    try {
      const src = join(d, "src");
      mkdirSync(join(src, "input", "pagecontent"), { recursive: true });
      writeFileSync(join(src, "sushi-config.yaml"), "id: x.ig\ntitle: X IG\npages:\n  index.md:\n    title: Home\n");
      writeFileSync(
        join(src, "input", "pagecontent", "index.md"),
        "# Home\n\nSee [the definitions](StructureDefinition-Composition-uv-ips-definitions.html), [the JSON](ValueSet-sections.json.html) and [the page](ValueSet-sections.html).\n",
      );
      const out = join(d, "site");
      stageIgSite(src, out, { menu: { groups: [] }, baseurl: BASE, artifacts: a });
      const md = readFileSync(join(out, "index.md"), "utf8");
      expect(md).toContain("(artifact/StructureDefinition-Composition-uv-ips-definitions.html)");
      expect(md).toContain("(artifact/ValueSet-sections.json.html)");
      expect(md).toContain("(artifact/ValueSet-sections.html)");
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});

describe("stateFromOutput: what each artefact's own JSON states, copied into the index", () => {
  it("copies meta.profile and a code concept from the Publisher's <Type>-<id>.json, and looks nothing up", () => {
    const d = mkdtempSync(join(tmpdir(), "fhir-harness-stated-"));
    try {
      const file = join(d, "index.json");
      writeFileSync(file, JSON.stringify({ artifacts: [{ resourceType: "Composition", id: "example" }, { resourceType: "ValueSet", id: "none" }, { resourceType: "Basic", id: "missing" }] }));
      writeFileSync(join(d, "Composition-example.json"), JSON.stringify({ resourceType: "Composition", meta: { profile: [PROFILE] }, code: { coding: [{ system: "http://loinc.org", code: "60591-5" }] } }));
      writeFileSync(join(d, "ValueSet-none.json"), JSON.stringify({ resourceType: "ValueSet" }));
      expect(stateFromOutput(file, d)).toBe(1);
      const ix = JSON.parse(readFileSync(file, "utf8")) as { artifacts: Record<string, unknown>[] };
      expect(ix.artifacts[0]).toMatchObject({ profiles: [PROFILE], code: { coding: [{ system: "http://loinc.org", code: "60591-5" }] } });
      expect(ix.artifacts[1]!.profiles).toBeUndefined();
      expect(ix.artifacts[2]!.profiles).toBeUndefined();
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});

describe("the shared renderer and the AST loader draw the views", () => {
  const renderer = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ig-artifact.js"), "utf8");
  const ast = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ast-resource.js"), "utf8");
  it("both parse as scripts", () => {
    expect(() => new Function(renderer)).not.toThrow();
    expect(() => new Function(ast)).not.toThrow();
  });
  it("one renderer: the views are branches of ig-artifact.js, chosen by the config's view", () => {
    expect(renderer).toContain("if (cfg.view)");
    for (const fn of ["drawDefinitions", "drawMappings", "drawExamples"]) expect(renderer).toContain(`function ${fn}(`);
    // The definitions come from the snapshot, the differential where there is none.
    expect(renderer).toMatch(/snap && snap\.length \? snap : diff/);
  });
  it("an examples view nothing claims says there are no examples", () => {
    expect(renderer).toContain("No examples: no artefact of this IG claims this profile");
  });
  it("the JSON view is the AST loader's JSON, alone", () => {
    expect(renderer).toContain('astHolder(src, "json")');
    expect(ast).toContain('getAttribute("data-ast-view") === "json"');
  });
  it("neither reads the Publisher's HTML", () => {
    expect(renderer).not.toMatch(/fetch\([^)]*\.html/);
    expect(ast).not.toMatch(/fetch\([^)]*\.html/);
  });
});
