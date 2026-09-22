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

import {
  instanceRootFor,
  publishedAssetPath,
  readDeclaration,
  repoRootFor,
  siteDirFor,
  sourceLinks,
} from "../schemas/cat-harness.js";
import { detectRepoUrl } from "../src/core/git-refs.js";
import { resolveThemeBackdrop } from "../schemas/theme.js";
import { themeById } from "../schemas/themes.js";
import { readLandingStickies } from "./ensure-landing-sticky.js";
import { isExternalLink } from "../schemas/landing-sticky.js";

const ROOT = instanceRootFor(import.meta.dir);

/** The forge this checkout points at, or `undefined` when it has none. */
const REPO_URL = detectRepoUrl(repoRootFor(ROOT));

/**
 * The branch the source links point at.
 *
 * `main` rather than the checked-out branch: this data file is generated into
 * a PUBLISHED site, and a link to a feature branch dies when that branch does.
 * A staging preview linking to `main` is right for the same reason — the thing
 * a reader wants to edit is what is live, not what produced this preview.
 */
const SOURCE_BRANCH = "main";

const OUT = join(ROOT, siteDirFor(ROOT), "_data/stickies.json");
const check = process.argv.includes("--check");
const decl = readDeclaration(ROOT);

/**
 * `docs/assets/x.png` → `/assets/x.png`; anything else is passed through.
 *
 * A one-line wrapper, kept so the call sites below read as they did. The
 * IMPLEMENTATION moved to `publishedAssetPath` in `schemas/cat-harness.ts`
 * when the todo board needed the same transform (bean `5y4b`): this copy
 * hardcoded `docs/` where the site directory has a single answer already, and
 * a second hardcoded copy is how an instance that moves its site directory
 * ends up serving one correct path and one 404.
 */
function siteRelative(src: string): string {
  return publishedAssetPath(ROOT, src);
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
  // SQUARE IS THE DEFAULT, and the other two are deviations a content shape has
  // to earn. The owner: *"stickc notes ddefault to squares unless content shape
  // indicates otherwise (then stack)."*
  //
  // The old thresholds made `laptop` the middle band, so a card of ordinary
  // length became landscape by default and the board was three different shapes
  // for no reason a reader could see. Now: square until the words will not fit
  // one, and then the PORTRAIT crop — which is what "stack" means here, a
  // taller card in the same column rather than a wider one.
  //
  // `laptop` is still reachable, by a sticky declaring `shape: "laptop"`. It is
  // no longer something a paragraph falls into.
  return weight < 450 ? "card" : "mobile";
}

/**
 * The role whose clouds are the DEFAULT, per layout.
 *
 * The owner, 2026-09-20: *"default is centered in the various clouds positions
 * of the **default grump cloud** (across three layouts)."*
 *
 * `grumpy-cat`'s backdrop is the `landing` image role, and its three images are
 * the only ones in this instance that declare a `textRegion` — 0.33/0.25 on the
 * laptop crop, 0.13/0.225 on the mobile, 0.30/0.255 on the card. Every other
 * backdrop role (engineer, library, analyst) declares none, so without a
 * fallback their words sit in a generic inset box and the cloud above them is
 * left empty, which is what the first render of this showed.
 */
const DEFAULT_CLOUD_ROLE = "landing";

/**
 * The default cloud for a layout, or `undefined` when even that is unmeasured.
 *
 * **`undefined` rather than a guessed box.** A role nobody measured has no
 * quiet interior to aim at, and inventing one puts the words over the cat's
 * face. The stylesheet's generic inset box is the honest answer in that case,
 * and it is one place rather than one per role.
 *
 * Worth knowing why the borrow is sound HERE and might not be elsewhere: the
 * engineer crops are the same composition as the default one, 1672x941 against
 * 1671x941 and 1254x1254 against 1254x1254 — the same cat in a different
 * costume, so the cloud is in the same place. `library` and `analyst` are
 * different compositions (1669x942, 1024x1536, 1536x1024) and borrow the
 * default only until somebody measures them. That is a fallback, not a claim
 * about those images, and it degrades toward a readable box rather than toward
 * a wrong one.
 */
function defaultCloud(layout: string): unknown {
  return (decl?.images ?? []).find(
    (i) => i.role === DEFAULT_CLOUD_ROLE && i.layout === layout && i.textRegion,
  )?.textRegion;
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
        // The crop's own aspect, so the card can BE that shape rather than
        // letterbox the art inside a shape its text happened to produce. The
        // owner: *"i want stickys to be the same fixd size ... dispalyed
        // content matches layout ratios."*
        aspect: img.width && img.height ? Number((img.width / img.height).toFixed(4)) : null,
        // The cloud, per layout. `null` rather than a guessed box: a role whose
        // art declares no region has no cloud to centre in, and inventing one
        // would put the words over the cat's face on art nobody measured.
        textRegion: img.textRegion ?? defaultCloud(layout) ?? null,
      };
    }
  }
  return {
    id: st.id,
    summary: st.summary,
    comment: st.comment,
    theme: st.theme,
    // WHICH LAYER contributed this card. Carried through to the data file rather
    // than left in the node, because the board is composed and "which layer put
    // this here" is the first question anyone debugging it asks — and the answer
    // has to be available where the page is, not only where the schema is.
    contributedBy: st.contributedBy,
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
    // The sticky's own choice wins over the derivation. The derivation guessed
    // `card` for a note the owner wanted landscape, which is what a heuristic
    // over three examples is worth: a starting point, not an answer.
    shape: st.shape ?? shapeFor(st.comment, st.links),
    // Emitted so the template can place the words without re-deriving anything.
    // Absent fields stay absent rather than becoming defaults here — the
    // stylesheet holds the defaults, in one place.
    text: st.text ?? null,
    // Emitted even when there is no art: the stylesheet composites it over
    // whatever is behind, and a sticky whose theme did not load still wants a
    // readable ground. Degrade toward legible.
    scrim: theme?.backdrop?.scrim ?? null,
    // Absent when there is no github.com `origin`, which is what makes the
    // control absent rather than dead. Spread so the key does not appear at
    // all rather than appearing as `null` — a consumer testing truthiness and
    // one testing presence should agree.
    ...(sourceLinks(REPO_URL, st.declaredIn, SOURCE_BRANCH) ?? {}),
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
