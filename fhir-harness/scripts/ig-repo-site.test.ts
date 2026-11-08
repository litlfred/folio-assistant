/**
 * An IG repository's own site with no instance declaration: the closure's top,
 * the AST it is built from (restore gate, served data, the IG API sidecars a
 * layer above leaves), and what is never staged as the IG's source.
 * Driven by synthetic trees, so it names no real IG.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

import { parseBuild, STAMP_FILE } from "./site-build-stamp.ts";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  AST_DATA,
  acceptStaleFromEnv,
  astGate,
  builtPage,
  IG_API_DESCRIPTOR,
  IG_API_SITE,
  IG_API_WORK,
  IG_SITE_SCRIPTS,
  igSiteStamp,
  INDEX_WORK,
  isPreviewBase,
  platformCommit,
  listedInstances,
  notSource,
  PLANTUML_VERSION,
  plantumlJarFor,
  PUBLISHER_CHROME,
  publisherChromePages,
  publisherPages,
  readIgApi,
  serveAstData,
  SIDECARS_SERVED,
  stampIgTocNav,
  topMounts,
  VALIDITY_FILE,
} from "./ig-repo-site.ts";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "ig-repo-site-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("topMounts", () => {
  test("topMountsNothingNeeds", () => {
    const needs: Record<string, string[]> = { base: ["fhir", "core"], fhir: ["core"], core: ["tools"], tools: [] };
    expect(topMounts(["base", "fhir", "core", "tools"], (n) => needs[n] ?? [])).toEqual(["base"]);
  });
  test("independentTopsBoth", () => {
    expect(topMounts(["a", "b"], () => [])).toEqual(["a", "b"]);
  });
});

describe("listedInstances", () => {
  test("listedInstancesInOrder", () => {
    const r = join(dir, "listed");
    mkdirSync(r, { recursive: true });
    expect(listedInstances(r)).toEqual([]);
    writeFileSync(join(r, "index.config.json"), JSON.stringify({ instances: [{ name: "b" }, { name: "a" }, {}] }));
    expect(listedInstances(r)).toEqual(["b", "a"]);
  });
});

describe("notSource", () => {
  test("notSourceMountsAndProducts", () => {
    const r = join(dir, "src");
    mkdirSync(r, { recursive: true });
    writeFileSync(join(r, "index.lock.json"), JSON.stringify({ instances: [{ path: "base" }, { path: "layer/sub" }, { path: "." }] }));
    const s = notSource(r);
    for (const p of ["base", "layer", ".git", "output", "output-ast", "temp", "input-cache"]) expect(s.has(p)).toBe(true);
    expect(s.has("input")).toBe(false);
    expect(s.has(".")).toBe(false);
  });
});

/** A minimal AST as `ig-cache.sh restore` lays it down: a manifest and its resource files. */
function fakeAst(root: string, resources: { resourceType: string; id: string }[]): string {
  const ast = join(root, "output-ast");
  const listed = resources.map((r) => ({ ...r, key: `${r.resourceType}/${r.id}`, file: `resources/${r.resourceType}/${r.id}--0000.json` }));
  for (const r of listed) {
    mkdirSync(join(ast, "resources", r.resourceType), { recursive: true });
    writeFileSync(join(ast, r.file), JSON.stringify({ resourceType: r.resourceType, id: r.id }));
  }
  writeFileSync(join(ast, "manifest.json"), JSON.stringify({ $schema: "ig-ast/v1", resources: listed }));
  return ast;
}

describe("the AST gate (ig-build-pipeline rule 2)", () => {
  test("validAstGoesOn", () => {
    expect(astGate("valid", { acceptStale: false, preview: false }).ok).toBe(true);
  });
  test("staleRefusedNoFallback", () => {
    for (const v of ["stale-inputs", "cannot-tell", "stale-toolchain"]) {
      const g = astGate(v, { acceptStale: false, preview: true });
      expect(g.ok).toBe(false);
      expect(g.said).toContain("does not fall back");
    }
  });
  test("staleAcceptedPreviewOnly", () => {
    expect(astGate("stale-inputs", { acceptStale: true, preview: true }).ok).toBe(true);
    const root = astGate("stale-inputs", { acceptStale: true, preview: false });
    expect(root.ok).toBe(false);
    expect(root.said).toContain("for a preview only");
    expect(root.said).toContain("ig-ast-build.sh");
  });
  test("previewAcceptsStaleByDefault", () => {
    expect(acceptStaleFromEnv(undefined)).toBe(true);
    expect(acceptStaleFromEnv("1")).toBe(true);
    expect(acceptStaleFromEnv("0")).toBe(false);
    const refused = astGate("stale-inputs", { acceptStale: acceptStaleFromEnv("0"), preview: true });
    expect(refused.ok).toBe(false);
    expect(refused.said).toContain("=0");
  });
  test("previewIsStagingBase", () => {
    expect(isPreviewBase("/smart-x/STAGING/claude-a")).toBe(true);
    expect(isPreviewBase("/smart-x")).toBe(false);
    expect(isPreviewBase(undefined)).toBe(false);
  });
});

describe("the IG API sidecars a layer above leaves in the work directory", () => {
  test("noSidecarsNothingBound", () => {
    const w = join(dir, "work-none");
    mkdirSync(join(w, IG_API_WORK, "sidecars"), { recursive: true });
    expect(readIgApi(undefined)).toBeUndefined();
    expect(readIgApi(join(dir, "absent"))).toBeUndefined();
    expect(readIgApi(w)).toBeUndefined();
  });
  test("sidecarsAndLabelFromDescriptor", () => {
    const w = join(dir, "work-api");
    mkdirSync(join(w, IG_API_WORK, "sidecars"), { recursive: true });
    writeFileSync(join(w, IG_API_WORK, "sidecars", "ValueSet-x.schema.json"), "{}");
    expect(readIgApi(w)).toEqual({ sidecars: join(w, IG_API_WORK, "sidecars"), files: 1 });
    writeFileSync(join(w, IG_API_WORK, IG_API_DESCRIPTOR), JSON.stringify({ label: " My API " }));
    expect(readIgApi(w)?.label).toBe("My API");
  });
  test("refusesEmptyLabel", () => {
    const w = join(dir, "work-bad");
    mkdirSync(join(w, IG_API_WORK, "sidecars"), { recursive: true });
    writeFileSync(join(w, IG_API_WORK, "sidecars", "a.jsonld"), "{}");
    writeFileSync(join(w, IG_API_WORK, IG_API_DESCRIPTOR), JSON.stringify({ label: "" }));
    expect(() => readIgApi(w)).toThrow(/label/);
  });
});

describe("publisher pages: the AST's data, never the Publisher's HTML", () => {
  test("servesAstDataAndIndex", () => {
    const root = join(dir, "serve");
    const ast = fakeAst(root, [{ resourceType: "ValueSet", id: "x" }, { resourceType: "CodeSystem", id: "y" }]);
    const site = join(root, "_site");
    mkdirSync(site, { recursive: true });
    writeFileSync(join(site, "CodeSystem-y.json"), "site");
    const index = join(root, "index.json");
    writeFileSync(index, "{}");
    const sidecars = join(root, "sidecars");
    mkdirSync(sidecars);
    writeFileSync(join(sidecars, "ValueSet-x.schema.json"), "{}");
    const r = serveAstData({ site, ast, index, igApi: { sidecars, files: 1 } });
    expect(r).toEqual({ resources: 2, named: 1, kept: 1, sidecars: 1, siteFiles: 0, siteKept: [], siteFilled: [], index: true });
    expect(existsSync(join(site, AST_DATA, "resources", "ValueSet", "x--0000.json"))).toBe(true);
    expect(JSON.parse(readFileSync(join(site, "ValueSet-x.json"), "utf-8")).id).toBe("x");
    expect(readFileSync(join(site, "CodeSystem-y.json"), "utf-8")).toBe("site");
    expect(existsSync(join(site, "fhir-artifact-index", "index.json"))).toBe(true);
    expect(existsSync(join(site, SIDECARS_SERVED, "ValueSet-x.schema.json"))).toBe(true);
  });
  test("noAstRefusedNamingStep", () => {
    const site = join(dir, "site-noast");
    mkdirSync(site, { recursive: true });
    expect(() => publisherPages({ site, ast: join(dir, "absent"), log: () => {} })).toThrow(new RegExp(`no AST[\\s\\S]*${IG_SITE_SCRIPTS.ast}`));
  });
  test("readsWorkDirIndexAndSidecars", () => {
    const root = join(dir, "serve-work");
    const ast = fakeAst(root, [{ resourceType: "ValueSet", id: "x" }]);
    const work = join(root, "work");
    mkdirSync(join(work, INDEX_WORK), { recursive: true });
    writeFileSync(join(work, INDEX_WORK, "index.json"), "{}");
    mkdirSync(join(work, IG_API_WORK, "sidecars"), { recursive: true });
    writeFileSync(join(work, IG_API_WORK, "sidecars", "ValueSet-x.jsonld"), "{}");
    const site = join(root, "_site");
    mkdirSync(site, { recursive: true });
    const said: string[] = [];
    expect(publisherPages({ site, ast, work, log: (s) => said.push(s) })).toEqual({ resources: 1, named: 1, kept: 0, sidecars: 1, siteFiles: 0, siteKept: [], siteFilled: [], index: true });
    expect(said.join("\n")).toContain("The Publisher's HTML is not taken");
  });
});

test("layerSiteFilesServedNotOver", () => {
  const root = join(dir, "serve-site");
  const ast = fakeAst(root, [{ resourceType: "ValueSet", id: "x" }]);
  const work = join(root, "work");
  const api = join(work, IG_API_WORK);
  mkdirSync(join(api, "sidecars"), { recursive: true });
  writeFileSync(join(api, "sidecars", "ValueSet-x.openapi.json"), "{}");
  mkdirSync(join(api, IG_API_SITE, "openapi"), { recursive: true });
  writeFileSync(join(api, IG_API_SITE, "openapi", "index.html"), "<p>hub</p>");
  writeFileSync(join(api, IG_API_SITE, "ValueSet-x.openapi.json"), "{}");
  writeFileSync(join(api, IG_API_SITE, "index.html"), "<p>overlay</p>");
  const igApi = readIgApi(work);
  expect(igApi?.site).toBe(join(api, IG_API_SITE));
  const site = join(root, "_site");
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, "index.html"), "<p>site</p>");
  const r = serveAstData({ site, ast, igApi: igApi! });
  expect(r.siteFiles).toBe(2);
  expect(r.siteKept).toEqual(["index.html"]);
  expect(readFileSync(join(site, "openapi", "index.html"), "utf-8")).toBe("<p>hub</p>");
  expect(existsSync(join(site, "ValueSet-x.openapi.json"))).toBe(true);
  expect(readFileSync(join(site, "index.html"), "utf-8")).toBe("<p>site</p>");
});

test("placeholderPageReplaced", () => {
  const root = join(dir, "serve-fill");
  const ast = fakeAst(root, [{ resourceType: "ValueSet", id: "x" }]);
  const work = join(root, "work");
  const api = join(work, IG_API_WORK);
  mkdirSync(join(api, "sidecars"), { recursive: true });
  writeFileSync(join(api, "sidecars", "ValueSet-x.jsonld"), "{}");
  mkdirSync(join(api, IG_API_SITE), { recursive: true });
  writeFileSync(join(api, IG_API_SITE, "hub.html"), "<p>thin hub</p>");
  writeFileSync(join(api, IG_API_SITE, "other.html"), "<p>overlay</p>");
  writeFileSync(join(api, IG_API_DESCRIPTOR), JSON.stringify({ placeholder: "<!-- HUB_HERE -->" }));
  const site = join(root, "_site");
  mkdirSync(site, { recursive: true });
  writeFileSync(join(site, "hub.html"), "<h1>Hub</h1><!-- HUB_HERE -->");
  writeFileSync(join(site, "other.html"), "<p>the IG's own</p>");
  const r = serveAstData({ site, ast, igApi: readIgApi(work)! });
  expect(r.siteFilled).toEqual(["hub.html"]);
  expect(r.siteKept).toEqual(["other.html"]);
  expect(readFileSync(join(site, "hub.html"), "utf-8")).toBe("<p>thin hub</p>");
  expect(readFileSync(join(site, "other.html"), "utf-8")).toBe("<p>the IG's own</p>");
});

test("refusesShortPlaceholder", () => {
  const w = join(dir, "work-ph");
  mkdirSync(join(w, IG_API_WORK, "sidecars"), { recursive: true });
  writeFileSync(join(w, IG_API_WORK, "sidecars", "a.jsonld"), "{}");
  writeFileSync(join(w, IG_API_WORK, IG_API_DESCRIPTOR), JSON.stringify({ placeholder: "<p>" }));
  expect(() => readIgApi(w)).toThrow(/placeholder/);
});

describe("the PlantUML jar", () => {
  test("plantumlJarPrecedence", () => {
    const home = join(dir, "home");
    const given = join(dir, "given.jar");
    writeFileSync(given, "jar");
    expect(plantumlJarFor(given, {}, home)).toBe(given);
    expect(plantumlJarFor(join(dir, "nope.jar"), { PLANTUML_JAR: given }, home)).toBe(given);
    expect(plantumlJarFor(undefined, {}, home)).toBeUndefined();
    const cached = join(home, ".cache", "plantuml", `plantuml-${PLANTUML_VERSION}.jar`);
    mkdirSync(join(cached, ".."), { recursive: true });
    writeFileSync(cached, "jar");
    expect(plantumlJarFor(undefined, {}, home)).toBe(cached);
  });
});

describe("the guard: no published page wears the IG Publisher's chrome (owner, 2026-10-14)", () => {
  // The Publisher's own page head and footer, as it writes them.
  const PUBLISHER_PAGE =
    '<html><head><link href="fhir.css" rel="stylesheet"/><link href="assets/css/bootstrap-fhir.css" rel="stylesheet"/></head>' +
    '<body><p>x</p><p>Generated <span title="Wed, Oct 14, 2026">2026-10-14</span></p></body></html>';
  test("publisherChromeMarkers", () => {
    for (const html of ['<link href="fhir.css" rel="stylesheet"/>', '<link rel="stylesheet" href="../assets/css/fhir.css">', '<link href="assets/css/bootstrap-fhir.css" rel="stylesheet"/>', 'Generated <span title="Wed">2026</span>']) {
      expect(PUBLISHER_CHROME.some((re) => re.test(html))).toBe(true);
    }
    expect(PUBLISHER_CHROME.some((re) => re.test('<link rel="stylesheet" href="/x/assets/ig-artifact.css"><p>Generated by hand</p>'))).toBe(false);
  });
  test("namesPagesWithChrome", () => {
    const site = join(dir, "guarded");
    mkdirSync(join(site, "deep"), { recursive: true });
    writeFileSync(join(site, "index.html"), "<p>site</p>");
    writeFileSync(join(site, "deep", "StructureDefinition-x.html"), PUBLISHER_PAGE);
    writeFileSync(join(site, "fhir.css"), "body{}");
    expect(publisherChromePages(site)).toEqual(["deep/StructureDefinition-x.html"]);
  });
  test("refusesSiteWithChrome", () => {
    const site = join(dir, "refused");
    mkdirSync(site, { recursive: true });
    writeFileSync(join(site, "artifacts.html"), PUBLISHER_PAGE);
    const ast = fakeAst(join(dir, "refused-ig"), [{ resourceType: "ValueSet", id: "x" }]);
    expect(() => publisherPages({ site, ast, log: () => {} })).toThrow(/IG Publisher's chrome[\s\S]*artifacts\.html/);
  });
});

test("builtPageByPermalink", () => {
  expect(builtPage("index.md")).toBe("index.html");
  expect(builtPage("sub/x.markdown")).toBe("sub/x.html");
  expect(builtPage("y.html")).toBe("y.html");
  expect(builtPage("_includes/ig/x/a.md")).toBeUndefined();
  expect(builtPage("assets/a.png")).toBeUndefined();
});

test("checkoutScriptsDeclared", () => {
  const pkg = JSON.parse(readFileSync(join(import.meta.dir, "..", "package.json"), "utf-8")) as { checkoutScripts: Record<string, string> };
  expect(pkg.checkoutScripts[IG_SITE_SCRIPTS.ast]).toBe("bun run fhir-harness/scripts/ig-repo-site.ts ast");
  expect(pkg.checkoutScripts[IG_SITE_SCRIPTS.compose]).toBe("bun run fhir-harness/scripts/ig-repo-site.ts compose");
  expect(pkg.checkoutScripts[IG_SITE_SCRIPTS.publisherPages]).toBe("bun run fhir-harness/scripts/ig-repo-site.ts publisher-pages");
});

describe("the site's folio-build.json", () => {
  const ig = () => {
    const r = mkdtempSync(join(tmpdir(), "ig-stamp-"));
    const git = (...a: string[]) => spawnSync("git", ["-C", r, ...a], { encoding: "utf-8" });
    git("init", "-q", "-b", "main");
    git("remote", "add", "origin", "https://github.com/example/my-ig.git");
    writeFileSync(join(r, "sushi-config.yaml"), "id: example.ig\n");
    git("add", "-A");
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "c");
    return r;
  };

  test("platformIsPinnedToolset", () => {
    const r = ig();
    expect(platformCommit(r)).toBeUndefined();
    writeFileSync(join(r, "index.lock.json"), JSON.stringify({ mounts: [{ harness: "base", ref: "b1" }, { harness: "cat-harness-tools", ref: "t1" }] }));
    expect(platformCommit(r)).toBe("t1");
    writeFileSync(join(r, "index.lock.json"), JSON.stringify({ mounts: [{ harness: "base", ref: "b1" }] }));
    expect(platformCommit(r)).toBe("b1");
  });

  test("stampNamesRepoAndCommit", () => {
    const r = ig();
    writeFileSync(join(r, "index.lock.json"), JSON.stringify({ mounts: [{ harness: "cat-harness-tools", ref: "t1" }] }));
    const head = spawnSync("git", ["-C", r, "rev-parse", "HEAD"], { encoding: "utf-8" }).stdout.trim();
    const s = igSiteStamp(r, {}, new Date("2026-10-14T00:00:00Z"));
    expect(s).toEqual({ $schema: "folio-site-build/v1", instance: "my-ig", platform: { commit: "t1" }, source: { repo: "example/my-ig", ref: "main", commit: head }, builtAt: "2026-10-14T00:00:00.000Z" });
  });

  test("publisherPagesWritesStamp", () => {
    const r = ig();
    writeFileSync(join(r, "index.lock.json"), JSON.stringify({ mounts: [{ harness: "cat-harness-tools", ref: "t1" }] }));
    const site = join(r, "_site");
    mkdirSync(site);
    writeFileSync(join(site, "index.html"), "<p>site</p>");
    publisherPages({ site, ast: fakeAst(r, [{ resourceType: "ValueSet", id: "x" }]), ig: r, log: () => {} });
    expect(existsSync(join(site, STAMP_FILE))).toBe(true);
    const b = parseBuild(readFileSync(join(site, STAMP_FILE), "utf-8"));
    expect(typeof b === "string" ? b : b.platform.commit).toBe("t1");
  });

  test("stampNamesAstSource", () => {
    const r = ig();
    writeFileSync(join(r, "index.lock.json"), JSON.stringify({ mounts: [{ harness: "cat-harness-tools", ref: "t1" }] }));
    const site = join(r, "_site");
    const work = join(r, "work");
    mkdirSync(site);
    mkdirSync(work);
    writeFileSync(join(site, "index.html"), "<p>site</p>");
    writeFileSync(join(work, VALIDITY_FILE), JSON.stringify({ verdict: "stale-inputs", recorded: { sourceRevision: "91b2b5a" } }));
    const said: string[] = [];
    publisherPages({ site, ast: fakeAst(r, [{ resourceType: "ValueSet", id: "x" }]), ig: r, work, log: (s) => said.push(s) });
    const b = parseBuild(readFileSync(join(site, STAMP_FILE), "utf-8"));
    expect(typeof b === "string" ? b : b.ast).toEqual({ commit: "91b2b5a", verdict: "stale-inputs", kind: "full" });
    expect(said.some((s) => s.includes("stale-inputs") && s.includes("91b2b5a"))).toBe(true);
  });
});

test("siteTitledOnce", async () => {
  const { thinIgLayout, harnessLayout } = await import("./build-ig-site");
  const { Liquid } = await import("liquidjs");
  const engine = new Liquid();
  for (const layout of [thinIgLayout("/"), harnessLayout("", "")]) {
    const title = /<title>.*<\/title>/.exec(layout)![0];
    expect(await engine.parseAndRender(title, { page: { title: "My IG" }, site: { title: "My IG" } })).toBe("<title>My IG</title>");
    expect(await engine.parseAndRender(title, { page: { title: "Home" }, site: { title: "My IG" } })).toMatch(/^<title>Home (—|\|) My IG<\/title>$/);
  }
});

test("composedPageCarriesFolio", async () => {
  const { thinIgLayout } = await import("./build-ig-site");
  const { hasMount } = await import("../../cat-harness-tools/scripts/folio-mount.ts");
  const { Liquid } = await import("liquidjs");
  const layout = thinIgLayout("/some-ig/");
  expect(hasMount(layout)).toBe(true);
  // Linked from the HOST's root, not the IG's, which is where docs-ui.js is published.
  const engine = new Liquid();
  engine.registerFilter("relative_url", (u: string) => `/folio-assistant${u}`);
  const head = /<head>[\s\S]*<\/head>/.exec(layout)![0];
  const html = await engine.parseAndRender(head, { page: { title: "x" }, site: { title: "y" } });
  expect(html).toContain('<script src="/folio-assistant/assets/js/docs-ui.js" defer');
  expect(html).toContain('href="/folio-assistant/assets/css/docs-ui.css"');
});

describe("the IG's TOC on its thin pages (owner, 2026-11-02: artifacts.html had no TOC in the rail)", () => {
  const nav = `<script type="application/json" data-fa-visualiser-nav>[{"label":"Home","href":"/ig/index.html"}]</script>`;
  const label = `<meta name="fa-visualiser-label" content="My IG">`;
  const thin = (id: string): string => `<!doctype html><html><head><title>x</title></head><body><main></main><script type="application/json" id="${id}">{}</script></body></html>`;
  test("thinPagesGetTocNav", () => {
    const site = mkdtempSync(join(dir, "toc-"));
    mkdirSync(join(site, "artifact"));
    mkdirSync(join(site, "docs"));
    writeFileSync(join(site, "index.html"), `<html><head>${label}\n${nav}</head><body><h1>Home</h1></body></html>`);
    writeFileSync(join(site, "artifacts.html"), thin("ig-index-page"));
    writeFileSync(join(site, "toc.html"), thin("ig-index-page"));
    writeFileSync(join(site, "api.html"), thin("ig-api-hub"));
    writeFileSync(join(site, "artifact", "Patient-x.html"), thin("ig-artifact-page"));
    const other = `<html><head></head><body><h2 id="a">A</h2><h2 id="b">B</h2></body></html>`;
    writeFileSync(join(site, "docs", "other.html"), other);
    expect(stampIgTocNav(site).pages).toBe(4);
    for (const f of ["artifacts.html", "toc.html", "api.html", "artifact/Patient-x.html"]) {
      const html = readFileSync(join(site, f), "utf-8");
      expect(html).toContain(nav);
      expect(html).toContain(label);
      expect(html.indexOf(nav)).toBeLessThan(html.indexOf("</head>"));
    }
    expect(readFileSync(join(site, "docs", "other.html"), "utf-8")).toBe(other);
    // Run twice, nothing doubles.
    expect(stampIgTocNav(site).pages).toBe(0);
  });
  test("noTocNothingStamped", () => {
    const site = mkdtempSync(join(dir, "toc-none-"));
    writeFileSync(join(site, "artifacts.html"), thin("ig-index-page"));
    expect(stampIgTocNav(site).pages).toBe(0);
  });
});
