/**
 * The docs tree's place under the site — one answer, checked where it is
 * written twice.
 *
 * Owner, 2026-10-05 (issue #2188, bean `kc7k`): cat-harness's documentation
 * publishes under `<base-url>/docs/cat-harness/`, a clean break with no
 * redirects. The route is read from the declaration by `docs-route.ts`; the one
 * place it must ALSO be a literal is `_config.yml`'s `baseurl`, because Jekyll
 * reads nothing else. This holds the two together, and pins the three scripts
 * that make the move safe: the hoist that keeps every root-addressed `@id`
 * dereferenceable, and the landing that gives the root a page of its own.
 *
 * @module scripts/tests/docs-route
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.js";
import { builtDocsRoute, DOCS_KIND, docsRelativeSitePath, docsRouteFor, upFromDocs } from "../docs-route.ts";
import { hoist, isSelfAddressed, rootAddressOf, SITE_ROOT_IRI } from "../hoist-addressed-documents.ts";
import { documentationRoutes, landingHtml } from "../root-landing.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const INSTANCE = join(REPO, "cat-harness");

describe("the route", () => {
  test("is the docs kind and the built instance's declared name", () => {
    expect(builtDocsRoute("cat-harness", REPO)).toBe("docs/cat-harness");
    expect(docsRouteFor("who-iris")).toBe("docs/who-iris");
  });

  test("climbing out of it takes one `..` per segment", () => {
    expect(upFromDocs("docs/cat-harness")).toBe("../..");
  });

  test("an authored site path climbs out only when it names a mount at the site root", () => {
    const mounts = ["who-iris", "docs/who-iris"];
    expect(docsRelativeSitePath("/who-iris/", "docs/cat-harness", mounts)).toBe("/../../who-iris/");
    expect(docsRelativeSitePath("/docs/who-iris/x.html", "docs/cat-harness", mounts)).toBe("/../../docs/who-iris/x.html");
    // Inside the docs tree, a prefix that is not a whole segment, and anything not site-absolute: unchanged.
    expect(docsRelativeSitePath("/architecture.html", "docs/cat-harness", mounts)).toBe("/architecture.html");
    expect(docsRelativeSitePath("/who-iris-notes/", "docs/cat-harness", mounts)).toBe("/who-iris-notes/");
    expect(docsRelativeSitePath("https://x.org/who-iris/", "docs/cat-harness", mounts)).toBe("https://x.org/who-iris/");
    expect(docsRelativeSitePath("//x.org/who-iris/", "docs/cat-harness", mounts)).toBe("//x.org/who-iris/");
  });

  test("_config.yml's baseurl is site_root plus the route — the literal agrees with the declaration", () => {
    const cfg = readFileSync(join(INSTANCE, siteDirFor(INSTANCE), "_config.yml"), "utf-8");
    const root = /^site_root:\s*"?([^"\n]*)"?/m.exec(cfg)?.[1];
    const base = /^baseurl:\s*"?([^"\n]*)"?/m.exec(cfg)?.[1];
    expect(root, "_config.yml declares no site_root").toBeDefined();
    expect(base).toBe(`${root}/${builtDocsRoute("cat-harness", REPO)}`);
  });

  test("the site-root IRI namespace is the site root, not the docs tree — identifiers did not move", () => {
    const cfg = readFileSync(join(INSTANCE, siteDirFor(INSTANCE), "_config.yml"), "utf-8");
    const url = /^url:\s*"?([^"\n]+)"?/m.exec(cfg)?.[1];
    const root = /^site_root:\s*"?([^"\n]*)"?/m.exec(cfg)?.[1];
    expect(SITE_ROOT_IRI).toBe(`${url}${root}/`);
  });
});

describe("which documents are root-addressed", () => {
  const R = "https://example.org/site/";
  test("an absolute @id under the root, fragment dropped", () => {
    expect(rootAddressOf({ "@id": `${R}todos/a.jsonld#x` }, R)).toBe("todos/a.jsonld");
  });
  test("a relative @id against the @base its context declares", () => {
    expect(rootAddressOf({ "@context": ["ctx", { "@base": R }], "@id": "site/p.jsonld" }, R)).toBe("site/p.jsonld");
  });
  test("a relative @id with no @base is addressed by wherever it sits — not hoisted", () => {
    expect(rootAddressOf({ "@id": "site/p.jsonld" }, R)).toBeUndefined();
  });
  test("another host is not ours", () => {
    expect(rootAddressOf({ "@id": "https://elsewhere.org/x.jsonld" }, R)).toBeUndefined();
  });
  test("a file IS its address: itself, its `.json` alias, or its directory's index", () => {
    expect(isSelfAddressed("todos/a.jsonld", "todos/a.jsonld")).toBe(true);
    expect(isSelfAddressed("todos/a.json", "todos/a.jsonld")).toBe(true);
    expect(isSelfAddressed("subgraph/x/index.jsonld", "subgraph/x/")).toBe(true);
    expect(isSelfAddressed("subgraph/x/index.hydrated.jsonld", "subgraph/x/")).toBe(true);
    expect(isSelfAddressed("todos/a.jsonld", "todos/b.jsonld")).toBe(false);
    expect(isSelfAddressed("todos.jsonld", "folio-assistant/folio-assistant.jsonld")).toBe(false);
  });
});

describe("the hoist", () => {
  const R = "https://example.org/site/";
  function site(): string {
    const s = mkdtempSync(join(tmpdir(), "hoist-"));
    const d = join(s, DOCS_KIND, "x");
    mkdirSync(join(d, "site", "p", "nodes"), { recursive: true });
    mkdirSync(join(d, "todos", "a"), { recursive: true });
    writeFileSync(join(d, "site", "p.jsonld"), JSON.stringify({ "@context": [{ "@base": R }], "@id": "site/p.jsonld" }));
    writeFileSync(join(d, "site", "p", "nodes", "n.jsonld"), JSON.stringify({ "@context": [{ "@base": R }], "@id": "site/p/nodes/n.jsonld" }));
    writeFileSync(join(d, "todos", "a.jsonld"), JSON.stringify({ "@id": `${R}todos/a.jsonld` }));
    writeFileSync(join(d, "todos", "a.json"), JSON.stringify({ "@id": `${R}todos/a.jsonld` }));
    writeFileSync(join(d, "todos", "a", "index.html"), "<p>the todo's PAGE stays with the docs</p>");
    writeFileSync(join(d, "todos.jsonld"), JSON.stringify({ "@id": `${R}elsewhere.jsonld#todos` }));
    return s;
  }

  test("moves exactly the root-addressed documents, and leaves pages and other data with the docs", () => {
    const s = site();
    const r = hoist(s, "docs/x", R);
    expect(r.collisions).toEqual([]);
    expect(r.hoisted.sort()).toEqual(["site/p.jsonld", "site/p/nodes/n.jsonld", "todos/a.json", "todos/a.jsonld"]);
    expect(existsSync(join(s, "site", "p", "nodes", "n.jsonld"))).toBe(true);
    expect(existsSync(join(s, DOCS_KIND, "x", "todos", "a", "index.html"))).toBe(true);
    expect(existsSync(join(s, DOCS_KIND, "x", "todos.jsonld"))).toBe(true);
    // The emptied directories are pruned, the page's is not.
    expect(existsSync(join(s, DOCS_KIND, "x", "site"))).toBe(false);
  });

  test("refuses a root address something else already holds — never overwrites", () => {
    const s = site();
    mkdirSync(join(s, "todos"), { recursive: true });
    writeFileSync(join(s, "todos", "a.jsonld"), "{}");
    const r = hoist(s, "docs/x", R);
    expect(r.collisions).toEqual(["todos/a.jsonld"]);
    expect(readFileSync(join(s, "todos", "a.jsonld"), "utf-8")).toBe("{}");
  });
});

describe("the root landing", () => {
  test("lists every built docs route with a front door, the built one first, and is not a redirect", () => {
    const s = mkdtempSync(join(tmpdir(), "landing-"));
    for (const n of ["who-iris", "cat-harness", "empty"]) mkdirSync(join(s, DOCS_KIND, n), { recursive: true });
    writeFileSync(join(s, DOCS_KIND, "who-iris", "index.html"), "");
    writeFileSync(join(s, DOCS_KIND, "cat-harness", "index.html"), "");
    const routes = documentationRoutes(s, "docs/cat-harness");
    expect(routes).toEqual(["docs/cat-harness", "docs/who-iris"]);
    const html = landingHtml("t", routes, true);
    expect(html).toContain('href="docs/cat-harness/"');
    expect(html).toContain('<html lang="en">');
    expect(html).not.toMatch(/http-equiv="refresh"|location\.(href|replace)/);
  });
});
