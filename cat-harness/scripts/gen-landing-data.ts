#!/usr/bin/env bun
/**
 * The landing stickies, as a data file Jekyll can read.
 *
 * @module scripts/gen-landing-data
 *
 * ## Why this is a separate script from `sync-docs-harness.ts`
 *
 * It was part of it, and that was a **layering violation I introduced**.
 * `repo-partition --edges` reported two wrong-direction edges out of
 * `sync-docs-harness.ts` (agentic-harness) into `ensure-landing-sticky.ts` and
 * `schemas/landing-sticky.ts` (folio-assist-core): the harness reaching up into
 * core's content nodes.
 *
 * The fix is not an exemption, it is the right owner. **Core owns the folio
 * graph**, so core writes the folio content's data file; the harness keeps
 * writing the instance's own declaration data. Each script now imports only
 * downward.
 *
 * ## Resolved HERE, not in Liquid
 *
 * A sticky names a theme by id; the theme names an image ROLE; the instance's
 * `images[]` answers what that role's three crops are. Following that chain in
 * a template means a `where` over two collections per sticky per layout, and
 * Liquid cannot REPORT a broken link in it — it renders empty.
 * `resolveThemeBackdrop` returns the three-state answer and refuses a partial
 * resolution wholesale, so the template gets a flat already-decided structure
 * and the decisions stay where they can be tested.
 *
 * `--check` fails when the committed file is stale, the same contract
 * `sync-docs-harness.ts` and the CSS generators use.
 *
 * Exit codes: 0 written or up to date · 1 stale under `--check`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { instanceRootFor, readDeclaration, siteDirFor } from "../schemas/cat-harness.js";
// `folio` is registered by CORE on import, and this instance declares a folio
// graph; without it `readDeclaration` throws on a valid declaration.
import "../schemas/folio-graph-kind.js";
import { resolveThemeBackdrop } from "../schemas/theme.js";
import { themeById } from "../schemas/themes.js";
import { readLandingStickies } from "./ensure-landing-sticky.js";
import { isExternalLink } from "../schemas/landing-sticky.js";

const ROOT = instanceRootFor(import.meta.dir);
const OUT = join(ROOT, siteDirFor(ROOT), "_data/stickies.json");
const check = process.argv.includes("--check");
const decl = readDeclaration(ROOT);

/** `docs/assets/x.png` → `/assets/x.png`; anything else is passed through. */
function siteRelative(src: string): string {
  return src.startsWith("docs/") ? `/${src.slice("docs/".length)}` : src;
}

/**
 * The landing stickies, each with its theme's art already resolved.
 *
 * ## Resolved HERE, not in Liquid
 *
 * A sticky names a theme by id; the theme names an image ROLE; the instance's
 * `images[]` answers what that role's three crops are. Following that chain in
 * a template would mean a Liquid `where` over two collections per sticky per
 * layout, and Liquid has no way to REPORT that a link in the chain is missing —
 * it renders empty. `resolveThemeBackdrop` returns the three-state answer
 * (`none` / `missing` / complete), and a partial resolution is refused
 * wholesale rather than serving a wide crop to a phone.
 *
 * So the template gets a flat, already-decided structure and the decisions stay
 * where they can be tested.
 *
 * An unknown theme id degrades to no art rather than failing the build: whether
 * a theme is installed is a question about the instance's theme set, which a
 * sticky cannot see, and `theme.ts` already says resolution happens at render
 * time "where a missing theme degrades rather than failing the page".
 */
/**
 * Which crop a sticky's art should be, chosen from the shape of its CONTENT.
 *
 * The owner: *"auto chose layout based on content shape."* The three crops are
 * genuinely different shapes — landscape, portrait, square — and until now the
 * choice was made by viewport alone, which meant a two-line sticky and a
 * twelve-line one got the same wide crop on a laptop and neither fitted.
 *
 * Weight, not character count: a link costs far more vertical space than its
 * own text, because it is a block with a note under it. The constant is a
 * rough line-height's worth, which is what makes four links weigh more than the
 * paragraph above them — as they should, since they are what makes that card
 * tall.
 *
 * Thresholds are chosen against the three stickies that exist, which is honest
 * rather than universal: a short note is square, a paragraph is wide, and
 * anything that will run down the page takes the tall crop. They will need
 * revisiting when a sticky lands between two of them, and a sticky can always
 * override by declaring its own.
 */
function shapeFor(comment: string, links: readonly { label: string; note?: string }[]): string {
  const weight =
    comment.length +
    links.reduce((n, l) => n + l.label.length + (l.note?.length ?? 0) + 40, 0);
  if (weight < 250) return "card";
  if (weight < 450) return "laptop";
  return "mobile";
}

const stickies = readLandingStickies(ROOT).map((st) => {
  const theme = themeById(st.theme);
  const resolved = theme ? resolveThemeBackdrop(theme, decl?.images) : undefined;
  const art: Record<string, unknown> = {};
  if (resolved && resolved.art.size > 0) {
    for (const [layout, img] of resolved.art) {
      art[layout] = {
        src: siteRelative(img.src),
        width: img.width ?? null,
        height: img.height ?? null,
      };
    }
  }
  return {
    id: st.id,
    summary: st.summary,
    comment: st.comment,
    theme: st.theme,
    // Split so the template never has to ask whether to apply `relative_url`:
    // doing so to an absolute URL breaks it, and omitting it on a site path
    // drops the baseurl. `isExternalLink` reads it off the URL scheme, which
    // cannot disagree with the value the way a hand-set flag can.
    links: st.links.map((l) => ({
      label: l.label,
      href: l.href,
      note: l.note ?? "",
      external: isExternalLink(l),
    })),
    art,
    // The crop this sticky's CONTENT wants, as opposed to the one its viewport
    // wants. The template uses it as the default and still lets a narrow screen
    // override — a tall phone should not be handed a landscape crop just
    // because the text is short.
    shape: shapeFor(st.comment, st.links),
    // Emitted even when there is no art: the stylesheet composites it over
    // whatever is behind, and a sticky whose theme did not load still wants a
    // readable ground. Degrade toward legible.
    scrim: theme?.backdrop?.scrim ?? null,
  };
});

const payload = {
  _generated: "scripts/gen-landing-data.ts — do not hand-edit; edit the sticky nodes under folio/",
  stickies,
};

const next = `${JSON.stringify(payload, null, 2)}\n`;
const current = existsSync(OUT) ? readFileSync(OUT, "utf-8") : undefined;

if (check) {
  if (current === next) {
    console.log(`stickies.json is up to date (${stickies.length} sticky/ies)`);
    process.exit(0);
  }
  console.error("docs/_data/stickies.json is stale — run `bun run landing:data` and commit");
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, next);
console.log(`wrote ${OUT.replace(ROOT + "/", "")} (${stickies.length} sticky/ies)`);
