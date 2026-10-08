#!/usr/bin/env bun
/**
 * Generate `themes.css` from the theme nodes.
 *
 * @module scripts/gen-themes-css
 * @covers none — it reads `THEMES`, the PLATFORM's themes, which are declared
 * in code (`schemas/themes.ts`) rather than in a graph directory — the same
 * reason `gen-avatars-css` declares none. It resolves no `themes` directory.
 * This line said `@covers themes` until 2026-09-30 (bean `z6xd`): written
 * from this script's TITLE rather than its scan set, and then copied to two
 * siblings. An instance's own `themes` declaration is explicit that the two
 * are different things — *"These are NOT the platform's twelve themes"*.
 *
 * **The knowledge graph is the source; the stylesheet is a rendering of it.**
 * That is the whole of the owner's *"named css assets in KG rather than
 * hardcoded colors"* — hand-authoring the CSS beside the nodes would give two
 * places to change a colour and no check that they agree, which is the same
 * shape as the 106 hardcoded literals this replaces.
 *
 * `--check` fails when the committed file is stale, so an edited node that was
 * never regenerated fails the build rather than quietly never reaching a
 * reader. Same contract as the skill-docs mirror.
 *
 * ## Instance-declared sticky themes are emitted too (bean `v8n5`)
 *
 * An instance may declare its own sticky theme in a `themes` graph directory
 * (a palette derived from the instance's own sources, say). Before
 * this, `themeByRef` could RESOLVE such a theme for a card while this file
 * emitted no CSS for it, so the card named a theme and rendered on the
 * default. They are found through `instanceStickyThemes` — the same
 * declaration-driven discovery `themeByRef` uses — so this file names no
 * instance and holds no instance's colour: the values arrive from the
 * instance's own `themes.ts` when the generator runs. An instance theme id
 * that collides with a platform id or another instance's is REFUSED with a
 * finding (exit 1), because a card writes the bare id and one selector cannot
 * serve two themes.
 *
 * Exit codes: 0 written or up to date · 1 stale under `--check`, or an
 * instance sticky theme id collides.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { instanceRootFor, readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.js";
import { pageThemeCssVars, themeCssVars, type ResolvedTheme } from "../schemas/theme.js";
import {
  explainStickyThemeConflict,
  instanceStickyThemes,
  instanceWebpageThemes,
  type OwnedStickyTheme,
  type OwnedWebpageTheme,
} from "../schemas/theme-by-ref.js";
import { DEFAULT_THEME_ID, THEMES } from "../schemas/themes.js";

/**
 * Where the stylesheet goes, for the instance rooted at `root`.
 *
 * **Derived, never written down.** The site root is `siteDirFor`'s answer and
 * nobody else's — a literal here would be one more place to fix when the tree
 * moves, and the last such move broke seven links in `AGENTS.md` alone before
 * anyone noticed. `site-dir-single-answer.test.ts` enforces it, and it caught
 * this file on its first run.
 */
export function themesCssPath(root: string): string {
  return join(siteDirFor(root), "assets", "css", "themes.css");
}

/**
 * Where an instance's WEBPAGE theme reaches the site — a `_data` file, not CSS.
 *
 * Bean `7h3u`. A webpage theme dresses ONE instance's pages, so it has to be
 * scoped by URL — and **CSS cannot select on a URL**. The scope therefore has
 * to be applied by whatever knows which page is rendering, which here is
 * Jekyll: `_includes/head_custom.html` matches `page.url` and emits the
 * matching instance's declarations inline.
 *
 * That is also the owner's own instruction for this work — *"reuse all existing
 * justthedocs infra (see sibling work on variable substitution)"*. `_data/` is
 * exactly the pass-through bean `kott` settled for fhir-harness: Jekyll
 * resolves `site.data` as it always has, and no new mechanism is introduced to
 * carry values into a page.
 *
 * Inline in `<head>` rather than a linked stylesheet on purpose: the same
 * first-paint reasoning `head_custom.html` already carries for the colour
 * scheme. A stylesheet arriving after first paint would flash the unthemed
 * colours, which is the defect that file was rewritten to remove.
 */
export function instanceThemesDataPath(root: string): string {
  return join(siteDirFor(root), "_data", "instance-themes.json");
}

/** One sticky theme's three layout blocks. */
function stickyBlock(t: Extract<ResolvedTheme, { kind: "sticky" }>, owner?: string): string {
  const g = t.layouts;
  return [
    `/* ${t.name}${t.description ? ` — ${t.description}` : ""}${owner ? ` [declared by instance ${owner}]` : ""} */`,
    `[data-fa-sticky-theme="${t.id}"] {`,
    `  ${themeCssVars(t)}`,
    `  --fa-sticky-min-width: ${g.laptop.minWidth};`,
    `  --fa-sticky-padding: ${g.laptop.padding};`,
    `  --fa-sticky-font-scale: ${g.laptop.fontScale};`,
    `}`,
    ``,
    `/* ${t.name} — mobile layout. A phone sticky is not a laptop one scaled down. */`,
    `@media (max-width: 40rem) {`,
    `  [data-fa-sticky-theme="${t.id}"] {`,
    `    --fa-sticky-min-width: ${g.mobile.minWidth};`,
    `    --fa-sticky-padding: ${g.mobile.padding};`,
    `    --fa-sticky-font-scale: ${g.mobile.fontScale};`,
    `  }`,
    `}`,
    ``,
    `/* ${t.name} — card layout, for a dense board. */`,
    `[data-fa-sticky-theme="${t.id}"][data-fa-sticky-layout="card"] {`,
    `  --fa-sticky-min-width: ${g.card.minWidth};`,
    `  --fa-sticky-padding: ${g.card.padding};`,
    `  --fa-sticky-font-scale: ${g.card.fontScale};`,
    `}`,
  ].join("\n");
}

/**
 * @param instanceThemes sticky themes declared by instances rather than the
 *   platform, already collision-checked by `instanceStickyThemes`. Emitted
 *   AFTER the platform's, each labelled with its owner.
 */
/**
 * Instance webpage themes, as the data `head_custom.html` scopes by `page.url`.
 *
 * `prefix` is the instance's own name with slashes either side, because an
 * instance's docs answer at `/<name>/` — `smart-trust-docs` carries
 * `instanceRoot: true`, which is what makes that the root of its pages rather
 * than the choice falling to sort order. Derived rather than declared a second
 * time: a prefix field would be a second answer to where an instance's pages
 * live, free to disagree with the declaration.
 */
export function renderInstanceThemesData(themes: readonly OwnedWebpageTheme[]): string {
  return `${JSON.stringify(
    {
      _generated:
        "by scripts/gen-themes-css.ts from every instance's declared `themes` directory — do not hand-edit. " +
        "Consumed by _includes/head_custom.html, which matches page.url against `prefix`.",
      instances: themes.map((o) => ({
        instance: o.instance,
        prefix: `/${o.instance}/`,
        themeId: o.theme.id,
        name: o.theme.name,
        // Already the site's own variable names — see `pageThemeCssVars`, which
        // chose them by measuring what `docs-ui.css` reads and never defines.
        declarations: pageThemeCssVars(o.theme),
      })),
    },
    null,
    2,
  )}\n`;
}

export function renderThemesCss(instanceThemes: readonly OwnedStickyTheme[] = []): string {
  const head = `/* GENERATED by scripts/gen-themes-css.ts from schemas/themes.ts and every
 * instance's declared \`themes\` directory — do not hand-edit.
 *
 * Every value here is a NAMED ROLE (--fa-sticky-surface, -ink, -edge, -accent),
 * never a colour name, so a rule reads as what it does and a theme swap touches
 * this file only. Run \`bun run cat themes:css\` after editing a theme node;
 * \`themes:css:check\` fails the build when this is stale.
 *
 * A theme sets the priority stripe's HUE and never its width: the stripe is a
 * width as well as a colour because colour alone carrying a signal fails
 * WCAG SC 1.4.1, and no theme has a field with which to remove the other
 * channel.
 */\n`;

  // STICKY themes only, and the narrowing is the point rather than a cast.
  //
  // This emits `[data-fa-sticky-theme=...]` with `--fa-sticky-*` properties, so
  // it was always about one surface; it just had no way to say so while every
  // theme had the same geometry. A `publication` theme's layouts are `a4 | a5 |
  // a5Landscape` with trim sizes and margins, and there is no sticky note to
  // give them to — `tsc` refuses `g.laptop` on the union, which is the schema
  // doing the job `data-modelling` step 7 gave it.
  //
  // A `webpage` theme shares the geometry but not this stylesheet: its CSS is
  // the site's, not the note board's. Adding it here would emit sticky
  // properties for a surface that has no stickies.
  const blocks = [
    ...THEMES.flatMap((t) => (t.kind === "sticky" ? [stickyBlock(t)] : [])),
    ...instanceThemes.map((o) => stickyBlock(o.theme, o.instance)),
  ];

  const fallback = [
    `/* The default, applied when nothing has selected a theme. A board with no`,
    ` * theme attribute must still render: an unthemed sticky is a state, not an`,
    ` * error, and leaving it unstyled would make "no selection yet" look broken. */`,
    `.fa-sticky-board:not([data-fa-sticky-theme]) {`,
    `  ${themeCssVars(THEMES.find((t) => t.id === DEFAULT_THEME_ID)!)}`,
    `  --fa-sticky-min-width: 17rem;`,
    `  --fa-sticky-padding: 0.7em 0.8em;`,
    `  --fa-sticky-font-scale: 1;`,
    `}`,
  ].join("\n");

  return `${head}\n${blocks.join("\n\n")}\n\n${fallback}\n`;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  // THE INSTANCE this script belongs to — the one it lives in — not whatever
  // directory the gate was invoked from. Those were the same until the move
  // (bean `wggr`), after which `siteDirFor(cwd)` threw on a `harness.json`
  // that is one directory down.
  const root = instanceRootFor(import.meta.dir);
  const rel = themesCssPath(root);
  const path = join(root, rel);
  // Every instance's sticky themes, by declaration. A collision is refused
  // rather than resolved by order — see `instanceStickyThemes`.
  const platformName = readDeclaration(root)?.name ?? "cat-harness";
  const found = instanceStickyThemes(repoRootFor(root), platformName, new Set(THEMES.map((t) => t.id)));
  if (found.conflicts.length > 0) {
    for (const c of found.conflicts) console.error(`themes.css: ${explainStickyThemeConflict(c)}`);
    process.exit(1);
  }
  const next = renderThemesCss(found.themes);
  // WEBPAGE themes, the second artefact and a different surface. No collision
  // check: a webpage theme is scoped by the instance whose pages it dresses, so
  // two instances sharing an id never meet — see `instanceWebpageThemes`.
  const webpage = instanceWebpageThemes(repoRootFor(root), platformName);
  const dataRel = instanceThemesDataPath(root);
  const dataPath = join(root, dataRel);
  const nextData = renderInstanceThemesData(webpage);
  const count =
    `${THEMES.length} platform themes, ${found.themes.length} instance sticky theme(s), ` +
    `${webpage.length} instance webpage theme(s)`;
  const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
  const currentData = existsSync(dataPath) ? readFileSync(dataPath, "utf8") : undefined;

  if (check) {
    // BOTH artefacts, and each named separately when stale. One message for two
    // files would make a reader open the wrong one — and they have different
    // consumers: the note board reads the CSS, `head_custom.html` reads the data.
    const stale = [
      current === next ? undefined : `themes.css`,
      currentData === nextData ? undefined : `${dataRel}`,
    ].filter((x): x is string => x !== undefined);
    if (stale.length === 0) {
      console.log(`themes.css and instance theme data are up to date (${count})`);
      process.exit(0);
    }
    console.error(`stale — run \`bun run cat themes:css\` and commit: ${stale.join(", ")}`);
    process.exit(1);
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next);
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, nextData);
  console.log(`wrote ${rel} (${count}, default ${DEFAULT_THEME_ID})`);
}
