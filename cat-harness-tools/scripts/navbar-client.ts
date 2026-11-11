/**
 * The browser half of the rail from shared data — bundled into
 * `assets/js/navbar.js` by `gen-navbar-assets.ts`.
 *
 * It runs `renderRailRegions` — the same function the build runs for an audit —
 * over the page's own `#fa-rail` block and the shared data the page loaded just
 * before it (`assets/navbar/rail-<hash>.js`). Loaded `defer`, so it runs after
 * the document is parsed and before `DOMContentLoaded`: `navbar-row.js` and
 * `docs-ui.js`, which start at `DOMContentLoaded`, find the rail already drawn.
 *
 * @module cat-harness/scripts/navbar-client
 */
import { RAIL_PAGE_ID, renderRailRegions, type RailPage } from "./lib/harness-rail.ts";
import { wireNavFolds, wireNavResize } from "./lib/navbar.ts";

declare const self: { FaRailData?: Record<string, string> };

function draw(): void {
  const block = document.getElementById(RAIL_PAGE_ID);
  const nav = document.querySelector('nav.fa-nav[data-fa-rail="pending"]');
  if (!block || !nav) return;
  let page: RailPage;
  try {
    page = {
      ...(JSON.parse(block.textContent || "{}") as Omit<RailPage, "root" | "toRoot">),
      root: block.getAttribute("data-fa-root") ?? ".",
      toRoot: block.getAttribute("data-fa-to-root") ?? ".",
      // Set by a site that composes this one into a larger site (smart-html-jtd).
      ...(block.getAttribute("data-fa-home") ? { home: block.getAttribute("data-fa-home")! } : {}),
      ...(block.getAttribute("data-fa-home-name") ? { homeName: block.getAttribute("data-fa-home-name")! } : {}),
    };
  } catch {
    console.warn("navbar: #fa-rail is not valid JSON; the rail keeps its Home link only.");
    return;
  }
  const shared = self.FaRailData?.[page.data];
  if (typeof shared !== "string") {
    console.warn(`navbar: shared rail data ${page.data} did not load; the rail keeps its Home link only.`);
    return;
  }
  nav.innerHTML = renderRailRegions(shared, page);
  nav.removeAttribute("data-fa-rail");
}

draw();
// The fold toggles on parent rows (owner, 2026-10-15): one delegated handler.
wireNavFolds(document);
// The drag edge (owner, 2026-11-10): after `draw`, which replaces the rail's contents.
wireNavResize(document);
