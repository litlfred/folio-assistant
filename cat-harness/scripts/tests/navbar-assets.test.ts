import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

import { navbarAssetPaths, navbarCssFile, navbarJsFile } from "../gen-navbar-assets.ts";
import { NAVBAR_JS, RAIL_DATA_DIR, expandRail, injectRail, railPageOf } from "../lib/harness-rail.ts";
import { NAVBAR_CSS } from "../lib/navbar.ts";

/**
 * The rail from shared data — bean `lnoy`. Owner, 2026-10-05: *"4. Option 3
 * everywhere"*.
 *
 * The property that matters is ONE DRAWING: a page railed from shared data,
 * once `navbar.js` has run, shows the rail the build would have rendered into
 * it. `expandRail` runs the code `navbar.js` bundles, so comparing it with the
 * server's own rendering compares the two places the drawing runs.
 */
describe("the committed navbar.css and navbar.js are what the generator writes", () => {
  test("navbar.css — run `bun run navbar:assets` if not", () => {
    const { css } = navbarAssetPaths();
    expect(existsSync(css)).toBe(true);
    expect(readFileSync(css, "utf-8")).toBe(navbarCssFile());
  });

  test("navbar.js — run `bun run navbar:assets` if not", async () => {
    const { js } = navbarAssetPaths();
    expect(existsSync(js)).toBe(true);
    expect(readFileSync(js, "utf-8")).toBe(await navbarJsFile());
  });
});

describe("a page railed from shared data", () => {
  const SHELL = "<!doctype html><html><head><title>x</title></head><body><h1>x</h1><h2 id=\"a\">A</h2><h2 id=\"b\">B</h2></body></html>";
  const opts = (toRoot: string) => ({
    instance: "C@T Harness",
    toRoot,
    homeLabel: "folio-assistant",
    links: [
      { label: "Library", href: `${toRoot}/cat-harness/library/`, description: "L1 source content" },
      { label: "Schemas", href: `${toRoot}/cat-harness/schemas/` },
    ],
    harnesses: [{ label: "WHO IRIS", href: `${toRoot}/who-iris/` }],
  });
  const emitted = new Map<string, string>();
  const emit = (file: string, body: string) => emitted.set(file, body);
  const readData = (name: string): string | undefined => {
    const body = emitted.get(`${RAIL_DATA_DIR}/${name}.js`);
    return body === undefined ? undefined : (JSON.parse(body.slice(body.indexOf("]=") + 2, body.lastIndexOf(";"))) as string);
  };
  const navOf = (html: string) => html.slice(html.indexOf('<nav class="fa-nav"'), html.indexOf("</nav>") + 6);

  test("draws EXACTLY the rail the build renders — one drawing", () => {
    for (const depth of ["..", "../..", "../../.."]) {
      const server = injectRail(SHELL, opts(depth))!;
      const shared = injectRail(SHELL, { ...opts(depth), emitRailData: emit })!;
      expect(navOf(expandRail(shared, readData))).toBe(navOf(server));
    }
  });

  test("pages at different depths share ONE data file", () => {
    emitted.clear();
    injectRail(SHELL, { ...opts(".."), emitRailData: emit });
    injectRail(SHELL, { ...opts("../../.."), emitRailData: emit });
    expect(emitted.size).toBe(1);
  });

  test("carries only its own block, a Home link, and three links — not the rail's markup", () => {
    const plain = injectRail(SHELL, opts("../.."))!;
    const shared = injectRail(SHELL, { ...opts("../.."), emitRailData: emit })!;
    expect(shared.length).toBeLessThan(plain.length / 4);
    expect(shared).toContain(`<link rel="stylesheet" href="../../${NAVBAR_CSS}">`);
    expect(shared).toContain(`<script src="../../${NAVBAR_JS}" defer></script>`);
    expect(shared).toMatch(/<script src="\.\.\/\.\.\/assets\/navbar\/rail-[a-z0-9]+\.js" defer><\/script>/);
    expect(shared).toContain('<a href="../../">folio-assistant</a>');
    expect(railPageOf(shared)?.documentIndex?.items.length).toBe(2);
  });

  test("its own row is 'you are here', not a link to itself", () => {
    const shared = injectRail(SHELL, { ...opts(".."), here: "/cat-harness/library/", emitRailData: emit })!;
    const nav = navOf(expandRail(shared, readData));
    expect(nav).not.toContain('href="../cat-harness/library/"');
    expect(nav).toContain('href="../cat-harness/schemas/"');
  });
});
