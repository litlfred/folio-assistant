/**
 * Every library entry has its own IRI — a materialized path whose page is a
 * thin shell that loads the entry from published data.
 *
 * Owner, 2026-10-02 (#1881): *"each link/page needs to be materialized on the
 * CDN (gh-pagees), just load the content from the KG json(ld) assets already
 * published"*; *"no query strings... each asset gets its own IRI"*; and 404
 * routing ruled out as *"a hack"*.
 *
 * These pin the parts that are not a browser's to judge: the path parser and
 * the legacy-fragment reader (the SAME source string the published script
 * carries), the shell template, the committed shells, and the referenced
 * `smart-trust` entry the owner's own example URL names. The browser half is
 * `cat-harness/test/library-entry-iri.e2e.ts`.
 *
 * @module scripts/tests/library-entry-iri
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, posix, relative, resolve, sep } from "node:path";

import { ADDRESS_JS } from "../lib/library-address.ts";
import { entryPageHtml, entryView, instanceRootRoutes, isEntryShellFor, isSubjectShell, libraryConfigOf, VIEWER_JS, viewerHtml } from "../gen-library-viz.ts";
import { ReferencedSourceSchema } from "../../schemas/referenced-source.ts";
import { LibraryIndexSchema } from "../../schemas/site-indexes.ts";
import { checkEntry } from "../check-l1-complete.ts";
import { readDeclaration, siteDirFor } from "../../schemas/cat-harness.ts";
import { DOCS_SITE, libraryAssetIri, libraryAssetSitePath } from "../../schemas/library-iri.ts";
import { builtDocsRoute } from "../docs-route.ts";

const HARNESS = resolve(import.meta.dir, "../..");
const REPO = resolve(HARNESS, "..");
const SITE = join(HARNESS, siteDirFor(HARNESS));
const LIB = join(SITE, readDeclaration(HARNESS)!.name!, "library");
/** Where the docs tree publishes under the site — `docs/cat-harness` (issue #2188). */
const ROUTE = builtDocsRoute(basename(HARNESS), REPO);

/**
 * Where `href`, written into a page that the deploy publishes under the docs
 * route, actually LANDS — as a site path, and as the source file that serves
 * it. Since 2026-10-05 the pages are under `/<route>/` while a document whose
 * `@id` names a root address is hoisted back to that address
 * (`hoist-addressed-documents.ts`), so a link is resolved on the SITE, never
 * against the checkout, which would find the file in the wrong place.
 */
function deployed(pageDir: string, href: string): { at: string; atRoot: boolean; source: string } {
  const page = posix.join("/", ROUTE, relative(SITE, pageDir).split(sep).join("/"), "/");
  const at = posix.resolve(page, href);
  const atRoot = !at.startsWith(`/${ROUTE}/`);
  return { at, atRoot, source: join(SITE, atRoot ? at.slice(1) : at.slice(ROUTE.length + 2)) };
}

/** The shipped source, evaluated — what is tested is what the page runs. */
const { entryFromPath, legacyKey } = new Function(`${ADDRESS_JS}\nreturn { entryFromPath, legacyKey };`)() as {
  entryFromPath: (p: string, root: string) => { instance: string; id: string } | null;
  legacyKey: (h: string) => string;
};

describe("reading an entry from its own path", () => {
  const root = "/folio-assistant/cat-harness/library/";
  test("an entry IRI, with or without its trailing slash or index.html", () => {
    for (const tail of ["smart-base/smart-trust/", "smart-base/smart-trust", "smart-base/smart-trust/index.html"]) {
      expect(entryFromPath(root + tail, root)).toEqual({ instance: "smart-base", id: "smart-trust" });
    }
  });
  test("a library page is not an entry, and neither is the whole view", () => {
    expect(entryFromPath(`${root}smart-base/`, root)).toBeNull();
    expect(entryFromPath(root, root)).toBeNull();
    expect(entryFromPath(`${root}index.html`, root)).toBeNull();
  });
  test("anything deeper, outside the root, or undecodable is refused rather than guessed", () => {
    expect(entryFromPath(`${root}a/b/c/`, root)).toBeNull();
    expect(entryFromPath("/elsewhere/smart-base/smart-trust/", root)).toBeNull();
    expect(entryFromPath(`${root}smart-base/%E0%A4%A/`, root)).toBeNull();
  });
  test("the script uses it, and carries no query-string addressing", () => {
    expect(VIEWER_JS).toContain(ADDRESS_JS);
    expect(VIEWER_JS).toContain("entryFromPath(location.pathname, LIB_ROOT)");
    expect(VIEWER_JS).not.toMatch(/location\.search|[?](entry|id|key)=/);
  });
});

describe("a legacy #key is read once, to be normalised to the path", () => {
  test("decodes the fragment form every old link carries", () => {
    expect(legacyKey("#smart-base%2Fsmart-trust")).toBe("smart-base/smart-trust");
    expect(legacyKey("#smart-base/smart-trust")).toBe("smart-base/smart-trust");
  });
  test("an empty or non-key fragment is not a key", () => {
    expect(legacyKey("")).toBe("");
    expect(legacyKey("#")).toBe("");
    expect(legacyKey("#badges")).toBe("");
  });
  test("normalisation is a replaceState to the entry's path, never a new fragment", () => {
    expect(VIEWER_JS).toContain("history.replaceState(null, \"\", to)");
    expect(VIEWER_JS).not.toMatch(/"#" \+ encodeURIComponent/);
  });
});

describe("a row's TITLE opens the entry's own page (owner, 2026-10-02)", () => {
  // The shipped script, run against stubs: the projection fetch never
  // resolves, so only the module-level definitions run and COLS is returned.
  const pageUrl = "https://example.test/folio-assistant/cat-harness/library/smart-base/";
  const run = new Function(
    "document",
    "location",
    "fetch",
    "window",
    "history",
    `${VIEWER_JS}\nreturn { COLS: COLS };`,
  ) as (...a: unknown[]) => { COLS: { k: string; f: (e: unknown) => string }[] };
  const { COLS } = run(
    {
      getElementById: () => ({ textContent: JSON.stringify({ data: "../../../assets/library/index.json", scope: "smart-base", libRoot: "../" }) }),
      addEventListener: () => {},
      querySelector: () => null,
    },
    { href: pageUrl, pathname: new URL(pageUrl).pathname, hash: "" },
    () => new Promise(() => {}),
    { addEventListener: () => {} },
    { replaceState: () => {} },
  );
  const title = COLS.find((c) => c.k === "title")!;
  test("a referenced entry with no README: the title links its path IRI", () => {
    const html = title.f({ instance: "smart-base", id: "smart-trust", title: "WHO SMART Trust", links: [] });
    expect(html).toContain('href="/folio-assistant/cat-harness/library/smart-base/smart-trust/">WHO SMART Trust</a>');
    expect(html).not.toContain("github.com");
  });
  test("the SLUG links the entry's `view`, composed against the site root", () => {
    const slug = COLS.find((c) => c.k === "id")!;
    const html = slug.f({ instance: "smart-base", id: "smart-trust", title: "T", view: "/smart-trust/" });
    expect(html).toContain('<a class="lib-view" href="/folio-assistant/smart-trust/">');
  });
  test("an entry WITH a README keeps it, as a secondary link only", () => {
    const html = title.f({ instance: "smart-base", id: "x", title: "X", readme: "https://github.com/o/r/blob/main/x/README.md" });
    expect(html).toMatch(/^<a class="lib-title" href="\/folio-assistant\/cat-harness\/library\/smart-base\/x\/">X<\/a>/);
    expect(html).toContain('<a class="src" href="https://github.com/o/r/blob/main/x/README.md">README</a>');
  });
});

describe("the shell template", () => {
  const shell = entryPageHtml("../../../assets/library/index.json", "smart-base", "", "../../", {
    id: "smart-trust",
    jsonld: "../../../assets/library/jsonld/smart-base/smart-trust/manifest.jsonld",
  });
  test("holds identity only — config, canonical, alternate — and loads the shared assets", () => {
    expect(libraryConfigOf(shell)).toEqual({
      data: "../../../assets/library/index.json",
      scope: "smart-base",
      libRoot: "../../",
      entry: "smart-trust",
    });
    expect(shell).toContain('<link rel="canonical" href="./">');
    expect(shell).toContain('<link rel="alternate" type="application/ld+json" href="../../../assets/library/jsonld/smart-base/smart-trust/manifest.jsonld">');
    expect(shell).toContain('<script src="../../../assets/library/viewer.js"></script>');
    expect(shell).toContain('<link rel="stylesheet" href="../../../assets/library/viewer.css">');
    expect(shell).not.toContain("<style>");
  });
  test("is a thin page (#1941): rail LINKED (bean lnoy), both sources named, the mount after the script", () => {
    const mounted = entryPageHtml("../../../assets/library/index.json", "smart-base", "<script data-fa-folio-mount></script>", "../../", {
      id: "smart-trust",
      jsonld: "../../../assets/library/jsonld/smart-base/smart-trust/manifest.jsonld",
    });
    expect(mounted).toContain('<meta name="folio-navbar" content="linked">');
    expect(mounted).toContain('<a href="../../../assets/library/index.json">the library projection</a> and this entry from');
    expect(mounted).toMatch(/<script src="[^"]*viewer\.js"><\/script>\n<script data-fa-folio-mount><\/script>\n<\/body>/);
  });
  test("an entry with no published JSON-LD gets no `alternate`, and its noscript names only the projection", () => {
    const bare = entryPageHtml("../../../assets/library/index.json", "smart-base", "", "../../", { id: "x" });
    expect(bare).not.toContain('rel="alternate"');
    expect(bare).toContain("the library projection</a>; it needs JavaScript");
    expect(libraryConfigOf(bare)).toEqual({ data: "../../../assets/library/index.json", scope: "smart-base", libRoot: "../../", entry: "x" });
  });
  test("is a few KB", () => {
    expect(shell.length).toBeLessThan(4096);
  });
  test("the instance page is the same template, with no entry", () => {
    const page = viewerHtml("../../assets/library/index.json", "smart-base");
    expect(libraryConfigOf(page)).toEqual({ data: "../../assets/library/index.json", scope: "smart-base", libRoot: "../" });
    expect(isSubjectShell(page, "smart-base")).toBe(true);
    expect(isEntryShellFor("smart-base")(page, "smart-trust")).toBe(false);
    expect(isEntryShellFor("smart-base")(shell, "smart-trust")).toBe(true);
    expect(isSubjectShell(shell, "smart-base")).toBe(false);
  });
});

describe("the committed tree: one materialized shell per entry", () => {
  const index = LibraryIndexSchema.parse(JSON.parse(readFileSync(join(SITE, "assets", "library", "index.json"), "utf-8")));
  test("every entry in the projection has a shell at <library>/<instance>/<id>/, and nothing else does", () => {
    const want = index.entries.map((e) => `${e.instance}/${e.id}`).sort();
    const have: string[] = [];
    for (const inst of readdirSync(LIB)) {
      const d = join(LIB, inst);
      if (!statSync(d).isDirectory()) continue;
      for (const id of readdirSync(d)) {
        const f = join(d, id, "index.html");
        if (existsSync(f) && isEntryShellFor(inst)(readFileSync(f, "utf-8"), id)) have.push(`${inst}/${id}`);
      }
    }
    expect(have.sort()).toEqual(want);
  });
  test("each shell's alternate JSON-LD is published", () => {
    for (const e of index.entries) {
      const f = join(LIB, e.instance, e.id, "index.html");
      const alt = /<link rel="alternate" type="application\/ld\+json" href="([^"]+)">/.exec(readFileSync(f, "utf-8"))?.[1];
      expect(alt, `${e.instance}/${e.id} names no JSON-LD`).toBeDefined();
      expect(existsSync(deployed(join(LIB, e.instance, e.id), alt!).source), `${e.instance}/${e.id}: ${alt}`).toBe(true);
    }
  });
});

describe("asset and rendering: two resources, two IRIs (owner, 2026-10-02)", () => {
  // "each asset should have one IRI, but the view page is a rendering of that
  // asset, a different page. fix IRIs" — and "asset doesnt know about its
  // renderings".
  const index = LibraryIndexSchema.parse(JSON.parse(readFileSync(join(SITE, "assets", "library", "index.json"), "utf-8")));
  test("the site root the IRIs are minted under is the one the site is served at", () => {
    const cfg = readFileSync(join(SITE, "_config.yml"), "utf-8");
    const url = /^url:\s*"?([^"\n]+)"?/m.exec(cfg)?.[1];
    // `site_root`, not `baseurl`: since 2026-10-05 the docs PAGES are under
    // `baseurl` = site_root + `/docs/cat-harness` (issue #2188), while every
    // asset IRI stays at the site root, where `hoist-addressed-documents.ts`
    // publishes the file it names.
    const siteRoot = /^site_root:\s*"?([^"\n]*)"?/m.exec(cfg)?.[1];
    expect(DOCS_SITE).toBe(`${url}${siteRoot}/`);
  });
  test("every entry's @id IS the address of its published JSON-LD, and that file is published", () => {
    for (const e of index.entries) {
      const m = JSON.parse(readFileSync(join(REPO, e.dir, "manifest.jsonld"), "utf-8")) as { "@id": string };
      expect(m["@id"], e.dir).toBe(libraryAssetIri(e.instance, e.id));
      const published = join(SITE, libraryAssetSitePath(e.instance, e.id));
      expect(existsSync(published), published).toBe(true);
      expect((JSON.parse(readFileSync(published, "utf-8")) as { "@id": string })["@id"]).toBe(m["@id"]);
    }
  });
  test("the rendering points TO the asset: its alternate resolves to the asset's file", () => {
    for (const e of index.entries) {
      const shellDir = join(LIB, e.instance, e.id);
      const alt = /<link rel="alternate" type="application\/ld\+json" href="([^"]+)">/.exec(
        readFileSync(join(shellDir, "index.html"), "utf-8"),
      )?.[1];
      // At the SITE ROOT, where the asset's IRI names it — not beside the shell.
      const d = deployed(shellDir, alt!);
      expect(d.atRoot, `${e.instance}/${e.id}: ${d.at}`).toBe(true);
      expect(d.at).toBe(`/${libraryAssetSitePath(e.instance, e.id)}`);
      expect(d.source).toBe(join(SITE, libraryAssetSitePath(e.instance, e.id)));
    }
  });
  test("every entry's `view` is GENERATED into the projection: another instance's declared root, else its own page", () => {
    const byKey = new Map(index.entries.map((e) => [`${e.instance}/${e.id}`, e]));
    // A referenced entry the smart-trust instance renders, at its declared root.
    expect(byKey.get("smart-base/smart-trust")?.view).toBe("/smart-trust/");
    // An ingested PDF: rendered by the library viewer, at its own entry page.
    expect(byKey.get("smart-base/who-rhr-1806-eng")?.view).toBe("/cat-harness/library/smart-base/who-rhr-1806-eng/");
    for (const e of index.entries) {
      expect(e.view, `${e.instance}/${e.id}`).toBeDefined();
      // Every view is a page that exists on the site, or an instance root route.
      if (e.view!.startsWith("/cat-harness/library/")) expect(existsSync(join(SITE, e.view!, "index.html"))).toBe(true);
    }
  });
  test("entryView takes a link only when it is a DECLARED root, never any page", () => {
    const roots = new Map([["smart-trust", "/smart-trust/"]]);
    expect(entryView({ links: [{ href: "/smart-trust/" }] }, roots, "x/y/z")).toBe("/smart-trust/");
    expect(entryView({ links: [{ href: "/somewhere-else/" }] }, roots, "x/y/z")).toBe("/x/y/z/");
    expect(entryView({}, roots, "x/y/z")).toBe("/x/y/z/");
    expect(instanceRootRoutes(REPO).get("smart-trust")).toBe("/smart-trust/");
  });
  test("the asset never references a rendering of itself", () => {
    for (const e of index.entries) {
      const text = readFileSync(join(SITE, libraryAssetSitePath(e.instance, e.id)), "utf-8");
      expect(text, e.id).not.toMatch(/subjectOf|foaf:page|"page"|\/library\/[^"]*\/index\.html|cat-harness\/library\//);
    }
  });
});

describe("smart-trust, referenced in smart-base's library (owner, 2026-10-02)", () => {
  const dir = join(REPO, "smart-base", "library", "smart-trust");
  const rec = ReferencedSourceSchema.parse(JSON.parse(readFileSync(join(dir, "referenced.json"), "utf-8")));
  const ig = JSON.parse(readFileSync(join(REPO, "smart-trust", "fhir-artifact-index", "index.json"), "utf-8")) as {
    packageId: string;
    version: string;
    canonicalBase: string;
  };
  test("is a valid referenced record of a PUBLICATION, matching the index it was read from", () => {
    expect(rec.materialization.state).toBe("referenced");
    expect(rec.source).toMatchObject({ kind: "published", canonical: ig.canonicalBase, package_id: ig.packageId, version: ig.version });
    expect(rec.identity.version).toBe(ig.version);
  });
  test("holds nothing of the IG and passes the L1 gate", () => {
    for (const d of ["sections", "blocks", "images"]) expect(existsSync(join(dir, d))).toBe(false);
    expect(checkEntry(dir).requirements.filter((q) => q.state === "unmet")).toEqual([]);
  });
  test("links the published IG and this site's artefact index — the instance's declared root", () => {
    expect(rec.links).toContainEqual({ label: "published IG", url: "http://smart.who.int/trust" });
    // The site path is the smart-trust instance's ROOT route, which is what its
    // declaration's `instanceRoot` docs directory publishes at.
    const decl = readDeclaration(join(REPO, "smart-trust"))!;
    expect(decl.directories?.some((d) => (d as { instanceRoot?: boolean }).instanceRoot && d.graphTypologies?.includes("docs"))).toBe(true);
    expect(rec.links).toContainEqual({ label: "artefact index", site_path: `${decl.name}/` });
  });
  test("appears in smart-base's library projection, with its links", () => {
    const index = LibraryIndexSchema.parse(JSON.parse(readFileSync(join(SITE, "assets", "library", "index.json"), "utf-8")));
    const e = index.entries.find((x) => x.instance === "smart-base" && x.id === "smart-trust");
    expect(e?.rung).toBe("referenced");
    expect(e?.title).toBe("WHO SMART Trust");
    expect(e?.links).toEqual([
      { label: "published IG", href: "http://smart.who.int/trust" },
      { label: "artefact index", href: "/smart-trust/" },
    ]);
  });
});
