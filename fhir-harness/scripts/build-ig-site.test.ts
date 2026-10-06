/**
 * One IG → one just-the-docs Jekyll source with `site.data.fhir` (bean
 * `bamf`). Driven by a synthetic IG, so it names no real one.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { ARTIFACTS_TEMPLATE_PATH, artifactVariables, colourScheme, composeIgSite, contrast, dedupeIds, igTocNav, igTopBar, includeTargets, pageNav, relinkArtifacts, relinkOffSite, rubyLiquidStrings, relinkPublisherOutputs, sourceHeadings, RELEASES_TEMPLATE_PATH, releaseVariables, sizeLabel, stageIgSite, tocPage, type StageResult } from "./build-ig-site";
import { copyDocsInto, igSiteDocs, webpagePalette } from "./stage-ig-sites";
import type { IgReleases } from "../schemas/ig-releases.ts";
import { artifactPageName } from "../schemas/fhir-artifact-index.js";

let dir: string;
let out: string;
let r: StageResult;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "ig-site-"));
  const src = join(dir, "src");
  for (const d of ["input/pagecontent", "input/includes", "input/images", "input/images-source"]) mkdirSync(join(src, d), { recursive: true });
  writeFileSync(
    join(src, "sushi-config.yaml"),
    [
      "id: example.ig",
      "canonical: http://example.org/ig",
      "name: ExampleIG",
      "title: Example IG",
      "status: draft",
      "version: 0.1.0",
      "fhirVersion: 4.0.1",
      "publisher:",
      "  name: Example Org",
      "pages:",
      "  index.md:",
      "    title: Home",
      "    overview.md:",
      "      title: Overview",
      "  changes.md:",
      "    title: Change Log",
      "",
    ].join("\n"),
  );
  const pc = join(src, "input", "pagecontent");
  writeFileSync(join(pc, "index.md"), "Package {{ site.data.fhir.packageId }}.\n{% include overview.md %}\n");
  writeFileSync(join(pc, "overview.md"), "{% include flow.svg %}\n{% include notes.md %}\n");
  writeFileSync(join(pc, "changes.md"), "Nothing yet.\n");
  writeFileSync(join(pc, "orphan.md"), "Not in sushi-config.\n");
  writeFileSync(join(src, "input", "includes", "notes.md"), "a note\n");
  writeFileSync(join(src, "input", "images", "logo.png"), "png");
  writeFileSync(join(src, "input", "images", "good.jsonld"), '{"@id": "x"}');
  writeFileSync(join(src, "input", "images", "broken.jsonld"), '{"a: 1}');
  writeFileSync(join(src, "input", "images-source", "flow.plantuml"), "@startuml\nA -> B\n@enduml\n");
  out = join(dir, "site");
  r = stageIgSite(src, out, { baseurl: "/site/example" });
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("staging one IG as one just-the-docs site", () => {
  test("site.data.fhir is written from sushi-config, only what is sourced", () => {
    const fhir = JSON.parse(readFileSync(join(out, "_data", "fhir.json"), "utf-8"));
    expect(fhir.packageId).toBe("example.ig");
    expect(fhir.ig.version).toBe("0.1.0");
    expect(fhir.ig.publisher).toBe("Example Org");
    expect(JSON.stringify(fhir)).not.toContain('""');
  });

  test("navigation comes from sushi-config pages: titles, parents, order", () => {
    const nav = pageNav({ "index.md": { title: "Home", "overview.md": { title: "Overview" } }, "changes.md": { title: "Change Log" } });
    expect(nav.get("index")).toEqual({ title: "Home", navOrder: 1 });
    expect(nav.get("overview")).toEqual({ title: "Overview", parent: "Home", navOrder: 2 });
    expect(nav.get("changes")).toEqual({ title: "Change Log", navOrder: 3 });
    expect(readFileSync(join(out, "overview.md"), "utf-8")).toStartWith('---\ntitle: "Overview"\nparent: "Home"\nnav_order: 2\n---\n');
  });

  test("a page sushi-config does not list is kept, titled by file name, and reported", () => {
    expect(r.unlisted).toEqual(["orphan.md"]);
    expect(readFileSync(join(out, "orphan.md"), "utf-8")).toContain('title: "orphan"');
  });

  test("pages, includes and images land where Jekyll resolves them", () => {
    expect(r.pages).toEqual(["changes.md", "index.md", "orphan.md", "overview.md"]);
    for (const f of ["notes.md", "overview.md", "index.md"]) expect(readFileSync(join(out, "_includes", f), "utf-8").length).toBeGreaterThan(0);
    expect(readFileSync(join(out, "logo.png"), "utf-8")).toBe("png");
  });

  test("a data file that does not parse is not published, and is reported", () => {
    expect(existsSync(join(out, "good.jsonld"))).toBe(true);
    expect(existsSync(join(out, "broken.jsonld"))).toBe(false);
    expect(r.unparseable).toHaveLength(1);
    expect(r.unparseable[0]).toStartWith("broken.jsonld (");
  });

  test("a diagram the Publisher renders, with no renderer given, is a VISIBLE marker and reported", () => {
    expect(r.notRendered).toEqual(["flow.svg"]);
    expect(r.rendered).toEqual([]);
    expect(readFileSync(join(out, "_includes", "flow.svg"), "utf-8")).toContain("⟦not rendered: flow.svg⟧");
  });

  test("the config is one just-the-docs site at the given baseurl", () => {
    const cfg = readFileSync(join(out, "_config.yml"), "utf-8");
    expect(cfg).toContain('title: "Example IG"');
    expect(cfg).toContain('baseurl: "/site/example"');
    expect(cfg).toContain("theme: just-the-docs");
  });

  test("include targets are read from the page, including lang-fragment", () => {
    expect(includeTargets("{% include a.svg %} x {%- include b.md -%} y {% lang-fragment table.xhtml %}")).toEqual(["a.svg", "b.md", "table.xhtml"]);
  });

  test("a repeated id keeps its first copy and the rest are renamed, each reported", () => {
    const r = dedupeIds(`<h3 id="x">a</h3><h3 id="x">b</h3><a id='x'></a><p id="y"></p>`);
    expect(r.html).toBe(`<h3 id="x">a</h3><h3 id="x--2">b</h3><a id='x--3'></a><p id="y"></p>`);
    expect(r.renamed).toEqual(["x -> x--2", "x -> x--3"]);
  });

  test("with no palette there is no scheme, and the report says so", () => {
    expect(r.scheme).toBeUndefined();
    expect(readFileSync(join(out, "_config.yml"), "utf-8")).not.toContain("color_scheme");
  });
});

// A synthetic palette: a dark accent, so the sidebar must take the light role.
const PALETTE = { surface: "#f7f7f7", ink: "#111111", edge: "#dddddd", accent: "#123456" };

describe("the instance's palette as a just-the-docs colour scheme", () => {
  test("WCAG contrast is computed as the spec defines it", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#fff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("navy", "#ffffff")).toBeUndefined();
  });

  test("each role lands on the scheme variable just-the-docs reads", () => {
    const s = colourScheme(PALETTE).scss;
    expect(s).toContain("$feedback-color: darken($sidebar-color, 3%);");
    expect(s).toContain("$body-background-color: #f7f7f7;");
    expect(s).toContain("$body-text-color: #111111;");
    expect(s).toContain("$link-color: #123456;");
    expect(s).toContain("$border-color: #dddddd;");
    expect(s).toContain("$sidebar-color: #123456;");
  });

  test("sidebar text is the palette role with more contrast on accent, never a literal", () => {
    const dark = colourScheme(PALETTE);
    expect(dark.sidebarText).toBe("surface");
    expect(dark.scss).toContain("$nav-child-link-color: #f7f7f7;");
    const light = colourScheme({ ...PALETTE, accent: "#eeeeaa" });
    expect(light.sidebarText).toBe("ink");
  });

  test("a pairing below AA, or one that cannot be computed, is a finding", () => {
    expect(colourScheme(PALETTE).findings).toEqual([]);
    const low = colourScheme({ ...PALETTE, accent: "#999999" }).findings;
    expect(low.some((f) => f.startsWith("accent on surface (links)"))).toBe(true);
    const named = colourScheme({ ...PALETTE, accent: "navy" }).findings;
    expect(named.some((f) => f.includes("not computable"))).toBe(true);
  });

  test("a staged site with a palette selects the scheme and ships its files", () => {
    const o = join(dir, "themed");
    const t = stageIgSite(join(dir, "src"), o, { palette: PALETTE });
    expect(t.scheme?.sidebarText).toBe("surface");
    expect(readFileSync(join(o, "_config.yml"), "utf-8")).toContain("color_scheme: ig");
    expect(readFileSync(join(o, "_sass", "color_schemes", "ig.scss"), "utf-8")).toContain("$sidebar-color: #123456;");
    expect(readFileSync(join(o, "_sass", "custom", "custom.scss"), "utf-8")).toContain("$nav-child-link-color");
  });
});

describe("pages the Publisher generates, written from data the build holds (bean jut3)", () => {
  test("toc lists every page in the tree, nested, and links only pages that exist", () => {
    const t = tocPage({ "index.md": { title: "Home", "overview.md": { title: "Overview" } }, "artifacts.html": { title: "Artifacts" } }, (s) => s !== "artifacts");
    expect(t).toContain("- [Home](index.html)\n  - [Overview](overview.html)");
    // Not held and not generated: text, never a link to a page that is not there.
    expect(t).toContain("- Artifacts (generated by the IG Publisher; not part of this build)");
    expect(t).not.toContain("](artifacts.html)");
  });

  test("a staged site always gets a toc, reported as generated rather than as a source page", () => {
    expect(r.generated).toContain("toc.md");
    expect(r.pages).not.toContain("toc.md");
    expect(readFileSync(join(out, "toc.md"), "utf-8")).toContain("[Change Log](changes.html)");
  });

  test("the lifted variables keep generate_smart_liquid's families and keys, minus the smart__ prefix", () => {
    const list = [
      { resourceType: "ValueSet", id: "a-b", title: "A [b]", category: "Terminology", canonical: "http://x/ValueSet/a-b", version: "1.0", published: { json: { url: "https://p/ValueSet-a-b.json" }, xml: { url: "https://p/ValueSet-a-b.xml" } } },
      { resourceType: "Endpoint", id: "e", category: undefined },
    ];
    const { vars, notSourced } = artifactVariables(list, "../artifact/");
    // smart__ValueSet__a_b__url__page  ->  site.data.fhir.artifacts.ValueSet__a_b.url.page
    const v = vars.artifacts["ValueSet__a_b"]!;
    expect(v.url.page).toBe(`../artifact/${artifactPageName(list[0]!)}.html`);
    expect(v.url.canonical).toBe("http://x/ValueSet/a-b");
    expect(v.url.json).toBe("https://p/ValueSet-a-b.json");
    expect(v.text.display).toBe("A [b]");
    expect(v.text.label).toBe("A \\[b\\]");
    expect(vars.artifacts_listed).toBe(1);
    expect(v.link.html).toBe('<a href="../artifact/ValueSet-a-b.html">A [b]</a>');
    expect(v.elements).toEqual({ title: "A [b]", version: "1.0" });
    // Uncategorised = not on the Publisher's artifacts.html: variables written, not grouped.
    expect(vars.artifact_categories).toEqual([{ name: "Terminology", keys: ["ValueSet__a_b"] }]);
    expect(vars.artifacts["Endpoint__e"]).toBeDefined();
    // What no source holds is REPORTED, never written empty.
    expect(notSourced).toContain("status");
    expect(Object.values(vars.artifacts).every((a) => !("status" in a.elements))).toBe(true);
  });

  const ruby = spawnSync("ruby", ["-e", 'require "liquid"'], { encoding: "utf-8" }).status === 0;
  test.skipIf(!ruby)("the artifacts TEMPLATE renders the variables through real Liquid", () => {
    const { vars } = artifactVariables([{ resourceType: "ValueSet", id: "v", title: "V [x]", category: "T" }], "../artifact/");
    const script = 'require "liquid"; require "json"; d = JSON.parse(STDIN.read.force_encoding("UTF-8")); print Liquid::Template.parse(d["t"], error_mode: :strict).render("site" => { "data" => { "fhir" => d["v"] } })';
    const r = spawnSync("ruby", ["-e", script], { input: JSON.stringify({ t: readFileSync(ARTIFACTS_TEMPLATE_PATH, "utf-8"), v: vars }), encoding: "utf-8" });
    expect(r.stderr).toBe("");
    expect(r.stdout).toContain("This IG has 1 artefact(s).");
    expect(r.stdout).toContain("## T");
    expect(r.stdout).toContain("- [V \\[x\\]](../artifact/ValueSet-v.html) — `ValueSet/v`");
  });

  test("the artifacts template is a file that opens with the comment describing it", () => {
    // `liquid-templates`: never an inline template in a .ts, and the leading
    // comment is the file's description; computation stays in the generator.
    const t = readFileSync(ARTIFACTS_TEMPLATE_PATH, "utf-8");
    expect(t.startsWith("{%- comment -%}")).toBe(true);
    expect(t).not.toMatch(/\|\s*(plus|minus|size|replace)\b/);
  });

  test("without an index there is no artifacts page, and the menu still reports it missing", () => {
    expect(existsSync(join(out, "artifacts.md"))).toBe(false);
    expect(r.generated).not.toContain("artifacts.md");
  });
});

describe("post-processing fills: content a step writes after the Publisher, at a marker the source holds", () => {
  test("the marker is replaced, the data reaches the page's front matter, and an unused fill is reported", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-fill-"));
    try {
      const src = join(d, "src");
      mkdirSync(join(src, "input", "pagecontent"), { recursive: true });
      writeFileSync(join(src, "sushi-config.yaml"), "id: x\ncanonical: http://x\nname: X\nversion: 0.1.0\nfhirVersion: 4.0.1\npages:\n  hub.md:\n    title: Hub\n");
      writeFileSync(join(src, "input", "pagecontent", "hub.md"), "# Hub\n\nIntro.\n\n<!-- MARK -->\n");
      const res = stageIgSite(src, join(d, "site"), {
        fills: [
          { marker: "<!-- MARK -->", body: "filled {{ page.k.v }}", data: { k: { v: "y" } } },
          { marker: "<!-- NOWHERE -->", body: "z", data: {} },
        ],
      });
      const page = readFileSync(join(d, "site", "hub.md"), "utf-8");
      expect(page).toContain('k: {"v":"y"}\n---\n');
      expect(page).toContain("Intro.\n\nfilled {{ page.k.v }}");
      expect(page).not.toContain("<!-- MARK -->");
      expect(res.fills).toEqual({ filled: ["hub.md (<!-- MARK -->)"], unused: ["<!-- NOWHERE -->"] });
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});

describe("the releases page: pointers to release binaries, never the bytes (bean b8ip)", () => {
  const releases: IgReleases = {
    $schema: "ig-releases/v1",
    repository: "o/r",
    readAt: "2026-10-02",
    releases: [
      {
        tag: "v1.0.0",
        url: "https://github.com/o/r/releases/tag/v1.0.0",
        publishedAt: "2026-03-23T17:39:19Z",
        prerelease: false,
        assets: [
          { name: "package.tgz", url: "https://github.com/o/r/releases/download/v1.0.0/package.tgz", bytes: 915317, digest: `sha256:${"a".repeat(64)}` },
          { name: "package.db", url: "https://github.com/o/r/releases/download/v1.0.0/package.db", bytes: 13864960 },
        ],
      },
    ],
  };

  test("sizes are labelled as a reader reads them", () => {
    expect(sizeLabel(915317)).toBe("915 KB");
    expect(sizeLabel(13864960)).toBe("13.9 MB");
    expect(sizeLabel(10)).toBe("1 KB");
  });

  test("every value the template shows is computed here", () => {
    const v = releaseVariables(releases);
    expect(v.releases[0]).toMatchObject({ tag: "v1.0.0", name: "v1.0.0", published: "2026-03-23", prerelease: false });
    expect(v.releases[0].assets.map((a) => [a.name, a.size, a.digest])).toEqual([
      ["package.tgz", "915 KB", `sha256:${"a".repeat(64)}`],
      ["package.db", "13.9 MB", null],
    ]);
  });

  test("given releases, the page and its data are written and reported as generated; absent, neither is", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-rel-"));
    try {
      const src = join(d, "src");
      mkdirSync(join(src, "input", "pagecontent"), { recursive: true });
      writeFileSync(join(src, "sushi-config.yaml"), "id: x\ncanonical: http://x\nname: X\nversion: 0.1.0\nfhirVersion: 4.0.1\npages:\n  index.md:\n    title: Home\n");
      writeFileSync(join(src, "input", "pagecontent", "index.md"), "# Home\n");
      const res = stageIgSite(src, join(d, "with"), { releases });
      expect(res.generated).toContain("releases.md");
      expect(readFileSync(join(d, "with", "releases.md"), "utf-8")).toContain(readFileSync(RELEASES_TEMPLATE_PATH, "utf-8"));
      expect(JSON.parse(readFileSync(join(d, "with", "_data", "ig_releases.json"), "utf-8"))).toEqual(releaseVariables(releases));
      const none = stageIgSite(src, join(d, "without"), {});
      expect(none.generated).not.toContain("releases.md");
      expect(existsSync(join(d, "without", "_data", "ig_releases.json"))).toBe(false);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  });
});

// Bean `mftp`: the IG's prose links an artefact at the Publisher's flat path;
// this site keeps artefact pages under `pagesHref`.
describe("relinkArtifacts", () => {
  const names = new Set(["ValueSet-Domains", "CodeSystem-Actors"]);
  test("rewrites a markdown link and an href to an artefact page, and nothing else", () => {
    const src = "[d](ValueSet-Domains.html) [a](CodeSystem-Actors.html#x) <a href=\"ValueSet-Domains.html\">v</a> [c](concepts.html) [e](https://x.org/ValueSet-Domains.html) [s](sub/ValueSet-Domains.html)";
    const r = relinkArtifacts(src, names, "artifact/");
    expect(r.count).toBe(3);
    expect(r.text).toBe("[d](artifact/ValueSet-Domains.html) [a](artifact/CodeSystem-Actors.html#x) <a href=\"artifact/ValueSet-Domains.html\">v</a> [c](concepts.html) [e](https://x.org/ValueSet-Domains.html) [s](sub/ValueSet-Domains.html)");
  });
  test("is a no-op when the source links no artefact", () => {
    expect(relinkArtifacts("[c](concepts.html)", names, "../artifact/")).toEqual({ text: "[c](concepts.html)", count: 0 });
  });
});

describe("copyDocsInto (an igSite instance's pages built into its IG site)", () => {
  test("copies every file but the README, and refuses to overwrite one the IG site wrote", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-docs-"));
    const docs = join(d, "docs");
    const site = join(d, "site");
    mkdirSync(join(docs, "artifact"), { recursive: true });
    mkdirSync(site, { recursive: true });
    writeFileSync(join(docs, "README.md"), "repo docs");
    writeFileSync(join(docs, "artifact", "A.md"), "a");
    writeFileSync(join(docs, "artifacts.md"), "mine");
    writeFileSync(join(site, "artifacts.md"), "the IG site's");
    const c = copyDocsInto(docs, site);
    expect(c).toEqual({ copied: 1, merged: [], collisions: ["artifacts.md"] });
    expect(readFileSync(join(site, "artifact", "A.md"), "utf-8")).toBe("a");
    expect(readFileSync(join(site, "artifacts.md"), "utf-8")).toBe("the IG site's");
    expect(existsSync(join(site, "README.md"))).toBe(false);
    rmSync(d, { recursive: true, force: true });
  });
});

describe("copyDocsInto: a front-matter-only page declares something ABOUT a generated page", () => {
  test("its keys land on the generated page's front matter, the page's own keys winning", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-docs-"));
    mkdirSync(join(d, "docs"), { recursive: true });
    mkdirSync(join(d, "site"), { recursive: true });
    writeFileSync(join(d, "docs", "artifacts.md"), "---\ntitle: mine\nrenders:\n  - x/fhir-artifact-index\nrendered-by: ig-pages\n---\n");
    writeFileSync(join(d, "site", "artifacts.md"), "---\ntitle: Artifact Index\nparent: Indices\n---\nbody\n");
    writeFileSync(join(d, "docs", "orphan.md"), "---\nrenders:\n  - y\n---\n");
    const c = copyDocsInto(join(d, "docs"), join(d, "site"));
    expect(c.merged).toEqual(["artifacts.md"]);
    expect(c.collisions).toEqual(["orphan.md (front matter only, and no generated page to lay it on)"]);
    expect(readFileSync(join(d, "site", "artifacts.md"), "utf-8")).toBe("---\ntitle: Artifact Index\nparent: Indices\nrenders:\n  - x/fhir-artifact-index\nrendered-by: ig-pages\n---\nbody\n");
    rmSync(d, { recursive: true, force: true });
  });
});

describe("igSiteDocs", () => {
  test("only an instance that DECLARES igSite builds its IG site at its root", () => {
    expect(igSiteDocs(join(import.meta.dir, "..", "..", "smart-trust"))).toBe(join(import.meta.dir, "..", "..", "smart-trust", "docs/"));
    // Every smart-* IG with a menu does, the same way (owner: "no drift issues").
    expect(igSiteDocs(join(import.meta.dir, "..", "..", "smart-base"))).toBe(join(import.meta.dir, "..", "..", "smart-base", "docs/"));
    // An instance that holds no IG does not.
    expect(igSiteDocs(join(import.meta.dir, "..", "..", "who-iris"))).toBeUndefined();
  });
});

describe("webpagePalette inherits along needs (bean `mftp`)", () => {
  test("smart-trust declares no theme and wears smart-base's, found through smart-ig", () => {
    const root = join(import.meta.dir, "..", "..");
    const t = webpagePalette(root, "smart-trust");
    expect(t.palette).toBeDefined();
    expect(t.note).toContain("inherited from smart-base");
    expect(webpagePalette(root, "smart-base").note).not.toContain("inherited");
  });
});

// Bean `mftp`, owner 2026-10-05: the folio-assistant navbar, not just-the-docs'
// sidebar, and the IG's own top bar preserved.
describe("every IG site: the IG's top bar, and its TOC declared for the navbar", () => {
  const menu = { groups: [{ label: "Home", items: [{ label: "Summary", href: "overview.html" }] }, { label: "Indices", items: [{ label: "Artifact Index", href: "artifacts.html" }, { label: "Spec", href: "https://example.org/x" }] }] };
  test("the TOC is a visualiser declaration the navbar reads, rows under each group, hrefs under the baseurl", () => {
    const decl = igTocNav(menu, "/b/smart-trust", [{ label: "Table of Contents", href: "toc.html" }]);
    expect(decl.startsWith('<script type="application/json" data-fa-visualiser-nav>')).toBe(true);
    const rows = JSON.parse(decl.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
    expect(rows).toEqual([
      { label: "Home", items: [{ label: "Summary", href: "/b/smart-trust/overview.html" }] },
      { label: "Indices", items: [{ label: "Artifact Index", href: "/b/smart-trust/artifacts.html" }, { label: "Spec", href: "https://example.org/x" }] },
      { label: "Table of Contents", href: "/b/smart-trust/toc.html" },
    ]);
  });
  test("the top bar is one dropdown per group, and never reads as the folio navbar", () => {
    const bar = igTopBar(menu, "/b/smart-trust", "WHO SMART Trust");
    expect(bar).toContain('<summary>Home</summary>');
    expect(bar).toContain('href="/b/smart-trust/overview.html"');
    expect(bar).not.toContain("fa-nav");
    expect(bar).not.toContain('id="site-nav"');
  });
  test("a harness-chrome site has a layout with no sidebar of its own", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-chrome-"));
    const src = join(d, "src");
    mkdirSync(join(src, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(src, "sushi-config.yaml"), "id: x.ig\ntitle: X IG\n");
    writeFileSync(join(src, "input", "pagecontent", "index.md"), "# Hi\n");
    stageIgSite(src, join(d, "out"), { menu, baseurl: "/b/x" });
    const layout = readFileSync(join(d, "out", "_layouts", "default.html"), "utf-8");
    expect(layout).toContain("data-fa-visualiser-nav");
    expect(layout).toContain('class="ig-topbar"');
    expect(layout).not.toContain("site-nav");
    expect(layout).toContain('<meta name="fa-visualiser-label" content="X IG">');
    rmSync(d, { recursive: true, force: true });
  });
});

describe("edit links to the IG's own source (bean `mftp`)", () => {
  test("a pagecontent page carries its edit URL, a generated page none", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-edit-"));
    const src = join(d, "src");
    mkdirSync(join(src, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(src, "sushi-config.yaml"), "id: x.ig\ntitle: X IG\n");
    writeFileSync(join(src, "input", "pagecontent", "concepts.md"), "# C\n");
    stageIgSite(src, join(d, "out"), { menu: { groups: [{ label: "Home", items: [{ label: "C", href: "concepts.html" }] }] }, editBase: "https://github.com/o/r/edit/main" });
    expect(readFileSync(join(d, "out", "concepts.md"), "utf-8")).toContain('ig_edit_url: "https://github.com/o/r/edit/main/input/pagecontent/concepts.md"');
    expect(readFileSync(join(d, "out", "toc.md"), "utf-8")).not.toContain("ig_edit_url");
    expect(readFileSync(join(d, "out", "_layouts", "default.html"), "utf-8")).toContain("Edit this page on GitHub");
    const layout = readFileSync(join(d, "out", "_layouts", "default.html"), "utf-8");
    // Per-section: a source-line link and a pre-filled feedback issue.
    expect(layout).toContain('id="ig-source-lines"');
    expect(layout).toContain("/issues/new?title=");
    expect(readFileSync(join(d, "out", "concepts.md"), "utf-8")).toContain('ig_source_blob: "https://github.com/o/r/blob/main/input/pagecontent/concepts.md"');
    rmSync(d, { recursive: true, force: true });
  });
});

describe("sourceHeadings: each section's line in the IG's source (bean `mftp`)", () => {
  test("ATX headings with their 1-based line, text as a reader sees it, fences skipped", () => {
    const md = ["# Title {#t}", "", "text", "```", "# not a heading", "```", "### A [link](x.html) and **bold**", "## Last ##"].join("\n");
    expect(sourceHeadings(md)).toEqual([
      { t: "Title", l: 1 },
      { t: "A link and bold", l: 7 },
      { t: "Last", l: 8 },
    ]);
  });
});

// Bean `mftp`, owner 2026-10-05: "Build in main site" — the IG's pages wear the
// host site's chrome, with the IG's includes and data namespaced per IG.
describe("composeIgSite: a staged IG moved into a host Jekyll source", () => {
  test("pages nest under the IG, includes and data are namespaced, chrome is injected", () => {
    const d = mkdtempSync(join(tmpdir(), "ig-compose-"));
    const src = join(d, "src");
    mkdirSync(join(src, "input", "pagecontent"), { recursive: true });
    mkdirSync(join(src, "input", "includes"), { recursive: true });
    writeFileSync(join(src, "sushi-config.yaml"), "id: x.ig\ntitle: X IG\n");
    writeFileSync(join(src, "input", "pagecontent", "index.md"), "# Home\n\n{{ site.data.fhir.packageId }}\n");
    writeFileSync(join(src, "input", "pagecontent", "concepts.md"), "# C\n\n{% include note.md %}\n");
    writeFileSync(join(src, "input", "includes", "note.md"), "a note");
    const staged = join(d, "site");
    stageIgSite(src, staged, { menu: { groups: [{ label: "Home", items: [{ label: "Summary", href: "index.html" }] }, { label: "Business", items: [{ label: "Concepts", href: "concepts.html" }] }] }, baseurl: "/b/x" });
    const host = join(d, "host");
    mkdirSync(host, { recursive: true });
    const c = composeIgSite(staged, host, "x");
    expect(c.collisions).toEqual([]);
    const index = readFileSync(join(host, "x", "index.md"), "utf-8");
    expect(index).toMatch(/^---\ntitle: "X IG"\nhas_children: true\n/);
    expect(index).toContain('site.data.ig["x"].fhir.packageId');
    expect(index).toContain("{% include ig/x/_top.html %}");
    expect(index).toContain("{% include ig/_bottom.html %}");
    const concepts = readFileSync(join(host, "x", "concepts.md"), "utf-8");
    expect(concepts).toContain('parent: "Business"');
    expect(concepts).toContain('grand_parent: "X IG"');
    expect(concepts).toContain("layout: default");
    expect(concepts).toContain("{% include ig/x/note.md %}");
    const group = readFileSync(join(host, "x", "menu-business.md"), "utf-8");
    expect(group).toContain('parent: "X IG"');
    expect(existsSync(join(host, "_includes", "ig", "x", "note.md"))).toBe(true);
    expect(existsSync(join(host, "_data", "ig", "x", "fhir.json"))).toBe(true);
    expect(readFileSync(join(host, "_includes", "ig", "x", "_top.html"), "utf-8")).toContain('class="ig-topbar"');
    expect(existsSync(join(host, "x", "_config.yml"))).toBe(false);
    expect(existsSync(join(host, "x", "_layouts"))).toBe(false);
    // A second compose of the same IG is two answers for one URL.
    expect(composeIgSite(staged, host, "x").collisions.length).toBeGreaterThan(0);
    // `atRoot` (#2235 F1): the IG IS the site — the same pages at the root.
    const root = join(d, "root");
    mkdirSync(root, { recursive: true });
    expect(composeIgSite(staged, root, "x", { atRoot: true }).collisions).toEqual([]);
    expect(existsSync(join(root, "index.md"))).toBe(true);
    expect(existsSync(join(root, "concepts.md"))).toBe(true);
    expect(existsSync(join(root, "x"))).toBe(false);
    expect(existsSync(join(root, "_includes", "ig", "x", "_top.html"))).toBe(true);
    rmSync(d, { recursive: true, force: true });
  });
});

describe("relinkPublisherOutputs — the Publisher's downloads live on the published IG", () => {
  test("points a bare .zip/.tgz link at the canonical site", () => {
    const r = relinkPublisherOutputs("* [IG Package](package.tgz)\n* [JSON](definitions.json.zip)", "http://example.org/ig/");
    expect(r.text).toBe("* [IG Package](http://example.org/ig/package.tgz)\n* [JSON](http://example.org/ig/definitions.json.zip)");
    expect(r.count).toBe(2);
  });
  test("leaves pages, paths and absolute URLs alone", () => {
    const t = "[a](index.html) [b](files/x.zip) [c](https://x.org/y.zip) <a href=\"z.tgz\">";
    const r = relinkPublisherOutputs(t, "http://c");
    expect(r.text).toBe("[a](index.html) [b](files/x.zip) [c](https://x.org/y.zip) <a href=\"http://c/z.tgz\">");
    expect(r.count).toBe(1);
  });
});

describe("relinkArtifacts — a case-only mismatch", () => {
  test("resolves to the one artefact page it can mean", () => {
    const r = relinkArtifacts("[model](StructureDefinition-hcert.html)", new Set(["StructureDefinition-HCert"]), "artifact/");
    expect(r.text).toBe("[model](artifact/StructureDefinition-HCert.html)");
  });
  test("is left alone when two pages differ only in case", () => {
    const r = relinkArtifacts("[x](A-b.html)", new Set(["A-B", "a-B"]), "artifact/");
    expect(r.text).toBe("[x](A-b.html)");
    expect(r.count).toBe(0);
  });
});

describe("relinkOffSite — what this build cannot serve goes where it is served", () => {
  const src = mkdtempSync(join(tmpdir(), "offsite-"));
  mkdirSync(join(src, ".github", "skills"), { recursive: true });
  writeFileSync(join(src, ".github", "skills", "s.yaml"), "x");
  mkdirSync(join(src, "input", "bpmn"), { recursive: true });
  writeFileSync(join(src, "input", "bpmn", "D.bpmn"), "x");
  const o = { canonical: "http://example.org/ig", sourceBlob: "https://github.com/o/r/blob/main", srcRoot: src, isServed: (t: string) => t === "index.html" };
  test("a Publisher-only page goes to the published IG", () => {
    expect(relinkOffSite('<a href="qa.html">QA</a>', o).text).toBe('<a href="http://example.org/ig/qa.html">QA</a>');
  });
  test("a repository file goes to GitHub, found at its path or under input/", () => {
    const r = relinkOffSite("[s](.github/skills/s.yaml) [d](bpmn/D.bpmn)", o);
    expect(r.text).toBe("[s](https://github.com/o/r/blob/main/.github/skills/s.yaml) [d](https://github.com/o/r/blob/main/input/bpmn/D.bpmn)");
    expect(r.count).toBe(2);
  });
  test("a page nothing serves is left as written and REPORTED", () => {
    const r = relinkOffSite("[v](video_tutorial.html) [i](index.html)", o);
    expect(r.text).toBe("[v](video_tutorial.html) [i](index.html)");
    expect(r.dead).toEqual(["video_tutorial.html"]);
  });
});

describe("rubyLiquidStrings — a Publisher Liquid string Jekyll can read", () => {
  test("an escaped-quote assign becomes single-quoted with plain quotes", () => {
    const src = '{% assign x__link__html = "<a href=\\"V.html\\">V</a>" %}';
    const r = rubyLiquidStrings(src);
    expect(r.text).toBe(`{% assign x__link__html = '<a href="V.html">V</a>' %}`);
    expect(r.count).toBe(1);
  });
  test("a plain string, and one holding an apostrophe, are left as written", () => {
    const plain = '{% assign a = "plain" %}';
    const apos = '{% assign b = "it\'s <a href=\\"x\\">" %}';
    expect(rubyLiquidStrings(plain + apos).text).toBe(plain + apos);
  });
});
