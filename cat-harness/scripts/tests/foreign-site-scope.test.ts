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
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { compose } from "../compose-docs.ts";
import {
  foreignScopeFor,
  isHostProjection,
  rootRelativeLeft,
  scopeHarnessData,
  scopeNavbarRow,
  scopeTiles,
  siteHref,
  type ForeignScope,
} from "../lib/foreign-site-scope.ts";
import { railStandalonePages } from "../mount-instance-docs.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const BASE = "https://litlfred.github.io/folio-assistant";
const PLATFORM_DATA = join(REPO, "cat-harness", "docs", "_data", "harness.json");

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

  test("its harness data is scoped: no count, no unresolved root-relative href", () => {
    const d = JSON.parse(readFileSync(join(out, "_data", "harness.json"), "utf-8")) as { tiles: { count?: number }[] };
    expect(d.tiles.filter((t) => t.count !== undefined)).toEqual([]);
    const known = new Set(["/artifacts.html"]); // smart-trust's own, under its baseurl
    for (const left of rootRelativeLeft(d)) expect(known.has(left.split("=")[1]!)).toBe(true);
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
