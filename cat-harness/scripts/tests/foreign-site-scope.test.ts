/**
 * A folio's site describes the FOLIO, not the platform (#2263).
 *
 * Owner, 2026-10-06, on https://litlfred.github.io/smart-trust/: *"the beans
 * and todos badges seems to be countts from folio-assistant and not
 * litlfred/smart-trust as expected. links to beans and todos dont work. why
 * not? fix process and skills."*
 *
 * Nothing caught it because every check ran on the PLATFORM's own site, where
 * the platform's tiles are right by construction. These tests run the two
 * foreign-site passes — the IG site's chrome shell (`compose-docs --shell`)
 * and the injected rail (`rail-standalone-pages --foreign-site`) — over a
 * FOLIO, and assert the two halves of the rule:
 *
 *   (a) the tiles describe the folio's instance: no other instance's count,
 *       and no other instance's state graph linked;
 *   (b) no href is left root-relative unless it is the folio's own path,
 *       resolved inside the folio's baseurl.
 *
 * And the same rule for a FIGURE that is not a tile (the #2263 follow-up):
 *
 *   (c) the platform's translation sweep and index are not shipped as the
 *       folio's, and the sweep badge is told what to SAY instead
 *       ("Swept 49/689" on every page of an IG folio's site was the platform's);
 *   (d) the fsh-guts icon is not this site's trashcan unless the folio links
 *       its own, so its count is not fetched from a site that has none
 *       (it showed "?").
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

import { siteDirFor } from "../../schemas/cat-harness.js";
import { compose } from "../compose-docs.ts";
import {
  HOST_DATA_PROJECTIONS,
  foreignScopeFor,
  isHostProjection,
  foreignFooterContent,
  rootRelativeLeft,
  scopeHarnessData,
  scopeSiteConfig,
  scopeNavbarRow,
  scopeTiles,
  siteHref,
  type ForeignScope,
} from "../lib/foreign-site-scope.ts";
import { railStandalonePages } from "../mount-instance-docs.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const BASE = "https://litlfred.github.io/folio-assistant";
const CAT_HARNESS = join(REPO, "cat-harness");
/** The platform's own harness data, at its declared site directory (`siteDirFor`), never a literal. */
const PLATFORM_DATA = join(CAT_HARNESS, siteDirFor(CAT_HARNESS), "_data", "harness.json");

/** A scope over a made-up declaration set, so the rule matrix is stated rather than inherited. */
function fakeScope(over: Partial<ForeignScope> = {}): ForeignScope {
  const kinds: Record<string, string[]> = {
    beans: ["beans"],
    todos: ["todos"],
    skills: ["skills"],
    qa: ["qa"],
    mystery: ["no-such-kind"],
    "folio-docs": ["docs"],
  };
  const holds: Record<string, string> = { beans: "state", todos: "state", qa: "state", skills: "content", docs: "content" };
  return {
    instance: "folio",
    platformBase: BASE,
    ownKinds: new Set(["docs", "qa"]),
    kindsOf: (id) => kinds[id],
    holdsOf: (k) => holds[k],
    ...over,
  };
}

const tile = (id: string, href: string, count?: number) => ({
  id,
  directory: id,
  title: id,
  qualifier: "C@T Harness",
  href,
  ...(count === undefined ? {} : { count, unit: "things" }),
});

describe("the rule, one row per case", () => {
  const s = fakeScope();
  const out = Object.fromEntries(
    scopeTiles(
      [
        tile("beans", "/beans/", 916),
        tile("todos", "/todos/", 3),
        tile("skills", "/skills/", 40),
        tile("qa", "/lsi/", 1002),
        tile("mystery", "/mystery/", 7),
        tile("folio-docs", "/folio/docs/", 12),
      ],
      s,
    ).map((t) => [t.id, t]),
  );

  test("another instance's STATE graph is not borrowed: no link, no count", () => {
    for (const id of ["beans", "todos"]) {
      expect(out[id]!.href).toBeUndefined();
      expect(out[id]!.count).toBeUndefined();
    }
  });

  test("declaring a kind of the same NAME does not make the platform's graph the folio's (smart-trust declares `qa`)", () => {
    expect(out.qa!.href).toBeUndefined();
    expect(out.qa!.count).toBeUndefined();
  });

  test("a kind that cannot be classified is treated as state — the conservative direction", () => {
    expect(out.mystery!.href).toBeUndefined();
  });

  test("a platform CONTENT graph is re-based onto the platform, labelled, and carries no count", () => {
    expect(out.skills!.href).toBe(`${BASE}/skills/`);
    expect(out.skills!.count).toBeUndefined();
    expect(out.skills!.showQualifier).toBe(true);
  });

  test("the folio's OWN graph resolves inside its own root and keeps its count", () => {
    expect(out["folio-docs"]!.href).toBe("/docs/");
    expect(out["folio-docs"]!.count).toBe(12);
  });

  test("an inert icon SAYS why, and the words tell 'declares none' from 'not published here'", () => {
    const row = scopeNavbarRow({ icons: ["todos", "qa", "skills"], hrefs: { todos: "/todos/", qa: "/qa/", skills: "/skills/" } }, s) as {
      hrefs: Record<string, string>;
      notes: Record<string, string>;
    };
    expect(row.hrefs).toEqual({ skills: `${BASE}/skills/` });
    expect(row.notes.todos).toBe("folio declares no todos graph");
    expect(row.notes.qa).toBe("folio's qa graph is not published on this site");
  });

  test("siteHref: own root, platform, and what it leaves alone", () => {
    expect(siteHref("/folio/", s)).toBe("/");
    expect(siteHref("/folio/a.html", s)).toBe("/a.html");
    expect(siteHref("/folios/a.html", s)).toBe(`${BASE}/folios/a.html`);
    expect(siteHref("https://x.org/a", s)).toBe("https://x.org/a");
    expect(siteHref("#top", s)).toBe("#top");
  });

  test("a count projection is told apart from chrome", () => {
    expect(isHostProjection("assets/beans/count.json", '{"tile":{"beans":{"count":1,"unit":"beans"}}}')).toBe(true);
    expect(isHostProjection("assets/harness/tiles.json", "---\nlayout: null\n---\n{{ site.data.harness.tiles | jsonify }}")).toBe(false);
    expect(isHostProjection("assets/img/x.json", '{"a":1}')).toBe(false);
  });

  test("(c) the host's translation sweep and index are projections, by name, on either separator", () => {
    expect(isHostProjection("_data/translation-qa.json", '{"sweptAt":"x","totalPages":689}')).toBe(true);
    expect(isHostProjection("_data/translations.json", '{"$schema":"folio-translation-index/v1"}')).toBe(true);
    expect(isHostProjection("_data\\translations.json", "{}")).toBe(true);
    expect(isHostProjection("_data/instance-themes.json", '{"instances":[]}')).toBe(false);
  });

  test("(d) a borrowed icon says WHOSE it is; an own one does not", () => {
    const row = scopeNavbarRow(
      { icons: ["fsh-guts", "skills"], hrefs: { "fsh-guts": "/fsh-guts/", skills: "/folio/skills/" } },
      fakeScope({ kindsOf: (id) => (id === "fsh-guts" ? ["fsh-guts"] : ["skills"]), holdsOf: () => "context" }),
    ) as { hrefs: Record<string, string>; whose?: Record<string, string> };
    expect(row.hrefs["fsh-guts"]).toBe(`${BASE}/fsh-guts/`);
    expect(row.whose?.["fsh-guts"]).toBe("the platform's: folio declares no fsh-guts graph");
    expect(row.hrefs.skills).toBe("/skills/");
    expect(row.whose?.skills).toBeUndefined();
  });

  test("(c, d) foreignSite.absent says what the chrome shows instead of a number", () => {
    const fish = (href?: string, note?: string) =>
      (scopeHarnessData(
        { navbar: { icons: ["fsh-guts"], hrefs: href ? { "fsh-guts": href } : {}, ...(note ? { notes: { "fsh-guts": note } } : {}) } },
        fakeScope({ kindsOf: () => ["fsh-guts"], holdsOf: () => "context" }),
      ).foreignSite as { absent: Record<string, string> }).absent;
    // The platform's trashcan, re-based: not this site's, so no count is fetched here.
    expect(fish("/fsh-guts/")).toEqual({
      translationQa: "folio publishes no translation QA sweep on this site",
      fshGuts: "folio declares no fsh-guts graph",
    });
    // The folio's OWN trashcan: its count is this site's to fetch.
    expect(fish("/folio/fsh-guts/").fshGuts).toBeUndefined();
  });
});

describe("smart-trust, against the platform's real harness data", () => {
  const data = JSON.parse(readFileSync(PLATFORM_DATA, "utf-8")) as Record<string, unknown>;
  const scope = foreignScopeFor(REPO, { instance: "smart-trust", platformBase: BASE, title: "WHO SMART Trust" });
  const out = scopeHarnessData(data, scope) as {
    title: string;
    tiles: { id: string; href?: string; count?: number }[];
    navbar: { hrefs: Record<string, string>; notes: Record<string, string> };
    railScopes: { name: string; href: string }[];
  };

  test("(a) no tile carries the platform's count, and its beans and todos are not linked", () => {
    expect(out.tiles.filter((t) => t.count !== undefined)).toEqual([]);
    for (const id of ["beans", "todos"]) expect(out.tiles.find((t) => t.id === id)?.href).toBeUndefined();
    expect(out.navbar.hrefs.beans).toBeUndefined();
    expect(out.navbar.hrefs.todos).toBeUndefined();
    expect(out.navbar.notes.beans).toBe("smart-trust declares no beans graph");
  });

  test("(d) the platform's fsh-guts is a labelled link, and the chrome is told it is not this site's", () => {
    const o = out as unknown as {
      navbar: { hrefs: Record<string, string>; whose?: Record<string, string> };
      foreignSite: { absent: Record<string, string> };
    };
    expect(o.navbar.hrefs["fsh-guts"]).toBe(`${BASE}/fsh-guts/`);
    expect(o.navbar.whose?.["fsh-guts"]).toBe("the platform's: smart-trust declares no fsh-guts graph");
    expect(o.foreignSite.absent.fshGuts).toBe("smart-trust declares no fsh-guts graph");
    expect(o.foreignSite.absent.translationQa).toBe("smart-trust publishes no translation QA sweep on this site");
  });

  test("(a) the header and the rail scope are smart-trust's", () => {
    expect(out.title).toBe("WHO SMART Trust");
    expect(out.railScopes.map((r) => [r.name, r.href])).toEqual([["smart-trust", "/"]]);
  });

  test("(b) every root-relative path left is one of smart-trust's own, from under /smart-trust/", () => {
    const own = new Set(
      rootRelativeLeft(data)
        .map((p) => p.split("=")[1]!)
        .filter((p) => p.startsWith("/smart-trust/"))
        .map((p) => `/${p.slice("/smart-trust/".length)}`),
    );
    for (const left of rootRelativeLeft(out)) expect(own.has(left.split("=")[1]!)).toBe(true);
  });
});

describe("the IG site's shell (compose-docs --shell), end to end", () => {
  const out = mkdtempSync(join(tmpdir(), "foreign-shell-"));
  const r = compose(out, REPO, { shell: true, foreign: { instance: "smart-trust", platformBase: BASE } });

  test("the platform's count projections are not shipped as the folio's", () => {
    expect(existsSync(join(out, "assets", "beans", "count.json"))).toBe(false);
    expect(existsSync(join(out, "assets", "todos", "count.json"))).toBe(false);
    expect(r.scoped?.hostProjections).toContain("assets/beans/count.json");
    // Chrome stays: the todo page's own script is code, not the platform's todos.
    expect(existsSync(join(out, "assets", "todos", "todo-page.js"))).toBe(true);
  });

  test("(c) the platform's translation sweep and index are not shipped as the folio's", () => {
    for (const rel of Object.keys(HOST_DATA_PROJECTIONS)) {
      expect(existsSync(join(out, rel))).toBe(false);
      expect(r.scoped?.hostProjections).toContain(rel);
    }
  });

  test("(c) every data file the shell still carries is chrome — a new projection must be named", () => {
    // What each remaining `_data/` file is, and why it is not a figure about
    // the host's pages on the folio's site. A file not listed here fails this
    // test: it is either a projection (a HOST_DATA_PROJECTIONS row) or chrome
    // (a row here), and somebody has to say which.
    const CHROME: Record<string, string> = {
      "harness.json": "scoped to the folio by scopeHarnessData, not copied",
      "instance-themes.json": "which theme a URL prefix wears: configuration, read by prefix",
      "node-kinds.json": "the node-kind vocabulary: context, not a count",
      "stickies.json": "read only by the platform's landing page (index.md), which a shell does not carry",
    };
    const left = readdirSync(join(out, "_data")).filter((f) => f.endsWith(".json"));
    expect(left.filter((f) => !(f in CHROME))).toEqual([]);
  });

  test("its harness data is scoped: no count, no unresolved root-relative href", () => {
    const d = JSON.parse(readFileSync(join(out, "_data", "harness.json"), "utf-8")) as { tiles: { count?: number }[] };
    expect(d.tiles.filter((t) => t.count !== undefined)).toEqual([]);
    const known = new Set(["/artifacts.html"]); // smart-trust's own, under its baseurl
    for (const left of rootRelativeLeft(d)) expect(known.has(left.split("=")[1]!)).toBe(true);
  });
});

describe("the footer line: a folio's site does not print the platform's (#1901 follow-up)", () => {
  /** The platform's own `footer_content`, read from its config rather than restated. */
  const platformConfig = parseYaml(readFileSync(join(CAT_HARNESS, siteDirFor(CAT_HARNESS), "_config.yml"), "utf-8")) as Record<string, unknown>;
  const platformFooter = platformConfig.footer_content as string;

  test("scopeSiteConfig names the folio, links the platform absolutely, and states no licence", () => {
    const c = scopeSiteConfig({ title: "Platform", footer_content: "Platform — code under Some Licence" }, { instance: "scratch-folio", title: "Scratch <Folio>", platformBase: BASE });
    expect(c.footer_content).toBe(`Scratch &lt;Folio&gt; — built with <a href="${BASE}/">Platform</a>.`);
    expect(String(c.footer_content)).not.toMatch(/licen[cs]e/i);
    // No title: the instance name. No instance either: no name is invented.
    expect(foreignFooterContent({ instance: "scratch-folio", platformBase: BASE }, "P")).toStartWith("scratch-folio — built with");
    expect(foreignFooterContent({ platformBase: BASE }, "P")).toBe(`This site is built with <a href="${BASE}/">P</a>.`);
    // Nothing to replace: the same object back.
    const none = { title: "Platform" };
    expect(scopeSiteConfig(none, { platformBase: BASE })).toBe(none);
  });

  test("the shell for a scratch folio carries the neutral line, not the platform's footer text", () => {
    expect(platformFooter).toBeTruthy(); // else this test proves nothing
    const out = mkdtempSync(join(tmpdir(), "foreign-footer-"));
    try {
      compose(out, REPO, { shell: true, foreign: { instance: "scratch-folio", title: "Scratch Folio", platformBase: BASE } });
      const c = parseYaml(readFileSync(join(out, "_config.yml"), "utf-8")) as Record<string, unknown>;
      expect(c.footer_content).not.toBe(platformFooter);
      expect(String(c.footer_content)).toBe(foreignFooterContent({ instance: "scratch-folio", title: "Scratch Folio", platformBase: BASE }, String(platformConfig.title)));
      expect(String(c.footer_content)).not.toMatch(/licen[cs]e/i);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });

  test("the platform's own build keeps its footer text, byte for byte", () => {
    const out = mkdtempSync(join(tmpdir(), "own-footer-"));
    try {
      compose(out, REPO, {});
      expect(readFileSync(join(out, "_config.yml"), "utf-8")).toBe(readFileSync(join(CAT_HARNESS, siteDirFor(CAT_HARNESS), "_config.yml"), "utf-8"));
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});

describe("the injected rail (rail-standalone-pages --foreign-site) over a fixture folio page", () => {
  test("its icon row names no platform work plan and no root-relative destination", () => {
    const root = mkdtempSync(join(tmpdir(), "foreign-rail-"));
    mkdirSync(join(root, "doc"), { recursive: true });
    writeFileSync(join(root, "doc", "index.html"), "<!doctype html>\n<html><head><title>t</title></head><body><h1>Doc</h1></body></html>\n");
    const r = railStandalonePages(root, "cat-harness", "cat-harness", [], { platformBase: BASE, homeLabel: "smart-trust", instance: "smart-trust" });
    expect(r.injected).toBe(1);
    const html = readFileSync(join(root, "doc", "index.html"), "utf-8");
    const m = /<script type="application\/json" id="fa-navbar-row"[^>]*>([\s\S]*?)<\/script>/.exec(html);
    expect(m).not.toBeNull();
    const row = JSON.parse(m![1]!) as { hrefs: Record<string, string>; notes: Record<string, string> };
    expect(row.hrefs.beans).toBeUndefined();
    expect(row.hrefs.todos).toBeUndefined();
    expect(row.notes.todos).toBe("smart-trust declares no todos graph");
    expect(rootRelativeLeft(row)).toEqual([]);
  });
});

describe("the chrome reads foreignSite.absent (head_custom.html, rendered)", () => {
  /** head_custom.html rendered with liquidjs, includes stubbed: only the two islands are read. */
  async function render(data: Record<string, unknown>): Promise<{ sweep: Record<string, unknown>; fishSrc: boolean }> {
    const { Liquid } = await import("liquidjs");
    const liquid = new Liquid({
      jekyllInclude: true,
      dynamicPartials: false,
      fs: {
        readFileSync: () => "",
        existsSync: () => true,
        exists: async () => true,
        readFile: async () => "",
        resolve: (_r: string, f: string) => f,
        contains: () => true,
        dirname: () => "",
        sep: "/",
      } as never,
    });
    liquid.registerFilter("relative_url", (p: string) => `/ig-folio${p}`);
    liquid.registerFilter("absolute_url", (p: string) => `https://example.org/ig-folio${p}`);
    liquid.registerFilter("jsonify", (v: unknown) => JSON.stringify(v ?? null));
    const src = readFileSync(join(CAT_HARNESS, siteDirFor(CAT_HARNESS), "_includes", "head_custom.html"), "utf-8");
    const html = await liquid.parseAndRender(src, { site: { baseurl: "/ig-folio", data }, page: { path: "p.md" } });
    const meta = /id="fa-translation-meta">([\s\S]*?)<\/script>/.exec(html);
    expect(meta).not.toBeNull();
    return {
      sweep: (JSON.parse(meta![1]!) as { sweep: Record<string, unknown> }).sweep,
      fishSrc: /<meta name="fa-fsh-guts-src"/.test(html.replace(/<!--[\s\S]*?-->/g, "")),
    };
  }
  const absent = { translationQa: "ig-folio publishes no translation QA sweep on this site", fshGuts: "ig-folio declares no fsh-guts graph" };

  test("(c, d) on a folio's site with no sweep of its own: the words, and no fsh-guts fetch", async () => {
    const r = await render({ harness: { foreignSite: { instance: "ig-folio", absent } } });
    expect(r.sweep.absent).toBe(absent.translationQa);
    expect(r.sweep.run).toBe(false);
    expect(r.fishSrc).toBe(false);
  });

  test("(c) a folio that publishes its OWN sweep shows its own figure, not the note", async () => {
    const r = await render({
      harness: { foreignSite: { instance: "ig-folio", absent } },
      "translation-qa": { sweptAt: "t", totalPages: 12, pagesWithTranslations: 3, complete: true },
    });
    expect(r.sweep.absent).toBeNull();
    expect(r.sweep.totalPages).toBe(12);
  });

  test("on the platform's own site nothing changes: no note, and the fsh-guts document is fetched", async () => {
    const r = await render({ harness: {}, "translation-qa": { sweptAt: "t", totalPages: 689, pagesWithTranslations: 49, complete: true } });
    expect(r.sweep.absent).toBeNull();
    expect(r.sweep.pagesWithTranslations).toBe(49);
    expect(r.fishSrc).toBe(true);
  });
});
