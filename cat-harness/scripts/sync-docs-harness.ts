/**
 * Put the instance's own title, description and mark where Jekyll can read them.
 *
 * just-the-docs draws `site.title` at the top of the left sidebar, and this
 * repo had `title: folio-assistant` written into `docs/_config.yml` by hand —
 * a second answer to "what is this instance called", free to disagree with the
 * declaration at the root and, on 2026-09-18, doing exactly that. The
 * declaration is the source; this copies the reader-facing part of it into
 * `docs/_data/harness.json`, which `docs/_includes/title.html` renders.
 *
 * Usage:  bun run scripts/sync-docs-harness.ts [--check]
 *
 * `--check` writes nothing and exits 1 if the copy is stale, for CI.
 *
 * ## Why a copy at all
 *
 * Jekyll reads data only from `_data/`, and `harness.json` belongs at the
 * repository root where every other consumer looks for it. Symlinking it in
 * would work on a developer's machine and not in the Pages build. So: one
 * generated file, gated, rather than a second authored one.
 *
 * ## Site-relative, not repo-relative
 *
 * `images[].src` is repo-relative (`docs/assets/…`) because that is what a
 * reader of the declaration can open. The site serves `docs/` AS its root, so
 * the same file is at `/assets/…` once published. The conversion happens here,
 * once, rather than in the Liquid template where it would be invisible.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { detectRepoUrl } from "../content/pipeline/readme-toc.js";
import { readDeclaration, siteDirFor } from "../schemas/cat-harness.js";
import { imageForRole, imagesForRole } from "../schemas/kg-node.js";
import { siteLinks } from "./site-links.js";

import { readLandingStickies } from "./ensure-landing-sticky.js";
import { isExternalLink } from "../schemas/landing-sticky.js";
import { resolveThemeBackdrop } from "../schemas/theme.js";
import { themeById } from "../schemas/themes.js";

const ROOT = resolve(import.meta.dir, "..");
const OUT = join(ROOT, siteDirFor(ROOT), "_data/harness.json");
const check = process.argv.includes("--check");

/** `docs/assets/x.svg` → `/assets/x.svg`; anything else is passed through. */
function siteRelative(src: string): string {
  return src.startsWith("docs/") ? `/${src.slice("docs/".length)}` : src;
}

const decl = readDeclaration(ROOT);
if (!decl) {
  console.error(`No declaration at ${ROOT}. Nothing to sync.`);
  process.exit(2);
}

const icon = decl.images?.find((i) => i.id === decl.icon);

// The SMALL mark, resolved by ROLE rather than by the declared `icon` id,
// because the two answer different questions and the site needs both.
//
// `icon` is what the instance calls its mark — one id, the instance's choice.
// But a mark is rendered at two sizes that want different DRAWINGS: the
// sidebar at 24 px and a browser tab at 16 px cannot carry the detail a mark
// shown large can. `role: "browser-icon"` is the declaration already saying
// which image is drawn for that, and until 2026-09-19 nothing read it.
//
// Absent is FINE and is not guessed around: an instance declaring no
// `browser-icon` gets `null` here, and the templates fall back to `icon`.
// Substituting the large mark silently is how a 24 px blob ships.
const smallIcon = imageForRole(decl.images, "browser-icon");

// The landing backdrop's variants, keyed by layout, so the template can pick
// by viewport rather than parse a filename. An instance with none gets `{}`,
// and the template renders its description plainly — see `landing.html`, which
// treats a missing backdrop as a reason to draw no overlay rather than as a
// reason to guess where the quiet part of an image it does not have might be.
const landing: Record<string, unknown> = {};
for (const [layout, img] of imagesForRole(decl.images, "landing")) {
  landing[layout] = {
    src: siteRelative(img.src),
    width: img.width ?? null,
    height: img.height ?? null,
    // Percentages, because that is what CSS wants and computing them in
    // Liquid is worse than computing them here.
    region: img.textRegion
      ? {
          x: +(img.textRegion.x * 100).toFixed(3),
          y: +(img.textRegion.y * 100).toFixed(3),
          w: +(img.textRegion.w * 100).toFixed(3),
          h: +(img.textRegion.h * 100).toFixed(3),
        }
      : null,
    title: img.title ?? "",
    description: img.description ?? "",
  };
}

/**
 * Where the header's action tiles point.
 *
 * Resolved through `siteLinks`, which computes from `artefactStub` and
 * `renderingPath` — so the tile agrees with what the Pages workflow actually
 * publishes. The previous answer was `'/kg/' | relative_url` written into
 * `head_custom.html`, a path composed by convention that had never resolved.
 *
 * `path` is site-ROOT-relative and the template applies `relative_url` to it,
 * which is what makes it correct under this site's `/folio-assistant/`
 * baseurl. `url` is absolute and is printed as-is.
 *
 * ## "Could not determine" keeps the previous answer
 *
 * The forge URL is read from `git remote get-url origin` rather than written
 * down a second time — `harness.config.json` already argues the case for this
 * repo's Pages address ("resolve it, do not compose it"), and the same holds
 * for its repository address. But this file is COMMITTED and gated by
 * `--check`, and a checkout with no git (a release tarball, a container that
 * copied the tree in) would otherwise drop a link that is perfectly good and
 * report the committed file as stale. So an undetectable remote KEEPS
 * whatever the file already says. Absent and unknown are different, and the
 * previous answer is the better of the two things to do with unknown.
 */
const detected = detectRepoUrl(ROOT);
let repoUrl = detected;
if (!repoUrl && existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, "utf-8")) as { links?: { id: string; url?: string }[] };
    repoUrl = prev.links?.find((l) => l.id === "source")?.url;
    if (repoUrl) {
      console.warn(
        `sync-docs-harness: could not read git remote "origin"; keeping the ` +
          `repository URL already in docs/_data/harness.json (${repoUrl}).`,
      );
    }
  } catch {
    // An unreadable previous file is not a reason to fail: it is about to be
    // rewritten anyway, and the source link is simply absent this run.
  }
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
  const resolved = theme ? resolveThemeBackdrop(theme, decl.images) : undefined;
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
  _generated: "scripts/sync-docs-harness.ts — do not hand-edit; edit harness.json",
  name: decl.name,
  title: decl.title ?? decl.name,
  description: decl.description ?? "",
  icon: icon ? { src: siteRelative(icon.src), title: icon.title ?? "", description: icon.description ?? "" } : null,
  smallIcon: smallIcon
    ? { src: siteRelative(smallIcon.src), title: smallIcon.title ?? "", description: smallIcon.description ?? "" }
    : null,
  landing,
  stickies,
  // THE KINDS THIS INSTANCE DECLARES — for the avatar fan (bean `4kj4`).
  //
  // Owner: *"shows the DECLared kinds for that instance, not inheritance."*
  // That is a real distinction and not a shade of one: `resolveDirectories`
  // overlays a dependency's directories onto an instance's, so the EFFECTIVE
  // set is strictly larger than the declared set. Reading the resolved set
  // here would show a reader kinds this repository never claimed, which is
  // the opposite of what the panel is for.
  //
  // So: `decl.directories` as authored, before any resolution. Sorted and
  // de-duplicated, because a directory may hold several graphs and two
  // directories may hold the same one — `schemas/` declares both `schemas`
  // and `cat-harness`.
  declaredKinds: [...new Set((decl.directories ?? []).flatMap((d) => d.graphs ?? []))].sort(),
  links: siteLinks(decl, repoUrl),
};
const next = `${JSON.stringify(payload, null, 2)}\n`;
const current = existsSync(OUT) ? readFileSync(OUT, "utf-8") : "";

if (check) {
  if (current === next) {
    console.log(`${relative(ROOT, OUT)} is up to date`);
    process.exit(0);
  }
  console.error(
    `docs/_data/harness.json is stale.\n` +
      `Run \`bun run scripts/sync-docs-harness.ts\` and commit the result.`,
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, next);
console.log(`Wrote ${relative(ROOT, OUT)} — title "${payload.title}"`);
