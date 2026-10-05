/**
 * Which pages publish under `/docs/cat-harness/`, and that every generator
 * agrees with Jekyll about it.
 *
 * Owner, 2026-10-05 (issue #2188, PR #2189, bean `kc7k`): ONLY cat-harness's
 * own docs-folder pages move — `concepts/architecture.md` to
 * `/docs/cat-harness/concepts/architecture.html`, its locale copies with it —
 * with no redirects. Every harness landing page, the viewers under `/cat-harness/`, the
 * kind directories and the root exports keep their URLs. The move is a set of
 * `permalink` defaults in `_config.yml`; this holds that list to the route
 * `docs-route.ts` reads from the declaration, and checks the coverage both
 * ways — nothing authored left behind, no landing page or kind directory
 * swept along.
 *
 * @module scripts/tests/docs-route
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { parse as parseYaml } from "yaml";

import { siteDirFor } from "../../schemas/cat-harness.js";
import { builtDocsRoute, docsRouteFor } from "../docs-route.ts";
import {
  pagePermalink,
  permalinkDefaults,
  permalinkDefaultsIn,
  publishedHref,
  publishedPagePath,
  scopeApplies,
} from "../lib/jekyll-permalink.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const INSTANCE = join(REPO, "cat-harness");
const SITE = join(INSTANCE, siteDirFor(INSTANCE));
const ROUTE = builtDocsRoute("cat-harness", REPO);
const DEFAULTS = permalinkDefaultsIn(SITE);
const config = parseYaml(readFileSync(join(SITE, "_config.yml"), "utf-8")) as {
  baseurl: string;
  available_locales?: unknown;
};
const LOCALES = ["ar", "es", "fr", "ru", "zh"];

const url = (rel: string): string => {
  const text = readFileSync(join(SITE, rel), "utf-8");
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const fm = m ? ((parseYaml(m[1]!) as Record<string, unknown>) ?? {}) : {};
  return pagePermalink(rel, fm, DEFAULTS);
};

describe("the route", () => {
  test("is the docs kind and the built instance's declared name", () => {
    expect(ROUTE).toBe("docs/cat-harness");
    expect(docsRouteFor("who-iris")).toBe("docs/who-iris");
  });

  test("baseurl is the SITE's — the move is per page, not per tree", () => {
    expect(config.baseurl).toBe("/folio-assistant");
  });

  test("every permalink default publishes under the route", () => {
    expect(DEFAULTS.length).toBeGreaterThan(0);
    for (const d of DEFAULTS) {
      expect(d.permalink.startsWith(`/${ROUTE}/`), `${d.path} → ${d.permalink}`).toBe(true);
    }
  });
});

describe("what moves and what stays — read off the real tree", () => {
  // The chapters the docs graph groups its pages into (bean `xka5`), and the
  // one top-level page beside the landing page. Each is authored in this
  // folder; each publishes under the route.
  const MOVED_DIRS = ["start", "concepts", "guides", "process", "fhir", "research-and-analysis", "quality"];

  test("every authored chapter's pages move, locale copies with them", () => {
    for (const d of MOVED_DIRS) {
      for (const f of readdirSync(join(SITE, d)).filter((x) => x.endsWith(".md") && x !== "README.md")) {
        expect(url(`${d}/${f}`)).toBe(`/${ROUTE}/${d}/${f.replace(/\.md$/, ".html")}`);
      }
    }
    expect(url("concepts/architecture.md")).toBe(`/${ROUTE}/concepts/architecture.html`);
    expect(url("concepts/fr/architecture.md")).toBe(`/${ROUTE}/concepts/fr/architecture.html`);
    expect(url("concepts/architecture/theming.md")).toBe(`/${ROUTE}/concepts/architecture/theming.html`);
    expect(url("platform.md")).toBe(`/${ROUTE}/platform.html`);
  });

  test("no top-level page is left behind but the landing page", () => {
    const pages = readdirSync(SITE).filter((f) => f.endsWith(".md") && /^---/.test(readFileSync(join(SITE, f), "utf-8")));
    for (const f of pages) {
      if (f === "index.md") expect(url(f)).toBe("/");
      else expect(url(f).startsWith(`/${ROUTE}/`), f).toBe(true);
    }
  });

  test("the landing pages stay — the site's and each locale's", () => {
    expect(url("index.md")).toBe("/");
    for (const l of LOCALES) expect(url(`${l}/index.md`)).toBe(`/${l}/index.html`);
  });

  test("kind directories and viewers stay where they are", () => {
    for (const rel of [
      "processes/index.md",
      "glossary/index.md",
      "proposals/index.md",
      "requirements/index.md",
      "methodologies/index.md",
      "bootstrap/initialization.md",
      "fr/glossary/index.md",
    ]) {
      expect(url(rel).startsWith(`/${ROUTE}/`), rel).toBe(false);
    }
  });
});

describe("the permalink rule", () => {
  const D = permalinkDefaults({
    defaults: [
      { scope: { path: "*.md" }, values: { permalink: "/d/:path/:basename:output_ext" } },
      { scope: { path: "g" }, values: { permalink: "/d/:path/:basename:output_ext" } },
      { scope: { path: "fr/*.md" }, values: { permalink: "/d/:path/:basename:output_ext" } },
      { scope: { path: "fr/index.md" }, values: { permalink: "/fr/" } },
      { scope: { path: "" }, values: { layout: "page" } },
    ],
  });

  test("a scope with no permalink is not a permalink rule", () => {
    expect(D).toHaveLength(4);
  });

  test("the page's own permalink wins over every default", () => {
    expect(pagePermalink("index.md", { permalink: "/" }, D)).toBe("/");
  });

  test("the LONGER scope path wins, as Jekyll's has_precedence? decides", () => {
    expect(pagePermalink("fr/index.md", {}, D)).toBe("/fr/");
    expect(pagePermalink("fr/a.md", {}, D)).toBe("/d/fr/a.html");
  });

  test("a glob covers files at its own depth only; a prefix covers the subtree", () => {
    expect(scopeApplies("*.md", "a.md")).toBe(true);
    expect(scopeApplies("*.md", "x/a.md")).toBe(false);
    expect(scopeApplies("g", "g/h/a.md")).toBe(true);
    expect(scopeApplies("g", "gg/a.md")).toBe(false);
    expect(pagePermalink("x/a.md", {}, D)).toBe("/x/a.html");
  });

  test("a scope by another type, and an unknown placeholder, are refused rather than mismodelled", () => {
    expect(() => permalinkDefaults({ defaults: [{ scope: { path: "", type: "posts" }, values: { permalink: "/x" } }] })).toThrow();
    expect(() => pagePermalink("a.md", {}, [{ path: "", permalink: "/:year/:basename" }])).toThrow();
  });
});

describe("the helpers generators use", () => {
  test("publishedPagePath reads the site's own config and front matter", () => {
    expect(publishedPagePath(SITE, "concepts/content-types")).toBe(`${ROUTE}/concepts/content-types.html`);
    expect(publishedPagePath(SITE, "index")).toBe("");
    expect(publishedPagePath(SITE, "processes/index")).toBe("processes/index.html");
  });

  test("publishedHref rewrites a page authored at its source location, and nothing else", () => {
    expect(publishedHref(SITE, "/concepts/content-types.html#x")).toBe(`/${ROUTE}/concepts/content-types.html#x`);
    expect(publishedHref(SITE, "/guides/index.html")).toBe(`/${ROUTE}/guides/index.html`);
    expect(publishedHref(SITE, "/guides/")).toBe(`/${ROUTE}/guides/index.html`);
    expect(publishedHref(SITE, "/processes/")).toBe("/processes/");
    expect(publishedHref(SITE, "/cat-harness/catalogue/")).toBe("/cat-harness/catalogue/");
    expect(publishedHref(SITE, "https://example.org/a.html")).toBe("https://example.org/a.html");
  });
});
