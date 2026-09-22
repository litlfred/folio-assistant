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
 * Usage:  bun run cat-harness/scripts/sync-docs-harness.ts [--check]
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
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { detectRepoUrl } from "../content/pipeline/readme-toc.js";
import { instanceDeclarationFilename, readDeclaration, siteDirFor } from "../schemas/cat-harness.js";
import { imageForRole, imagesForRole } from "../schemas/kg-node.js";
import { graphTiles, withTileCounts } from "./graph-tiles.js";
import { readTileCounts, type TileCount } from "../schemas/tile-count.js";
import { harnessTiles } from "./harness-tiles.js";
import { siteLinks } from "./site-links.js";


const ROOT = resolve(import.meta.dir, "..");
/**
 * The repository root — where sibling INSTANCES live.
 *
 * `ROOT` is this instance (`cat-harness/`), which owns the published site.
 * Every other initiated harness is a directory beside it, so the tile scan
 * starts one level up. The two are different places and the previous version
 * of this file needed only the first.
 */
const REPO_ROOT = resolve(ROOT, "..");
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

// THE DARK-SCHEME MARK, resolved by ROLE like the small one above.
//
// A separate image rather than a CSS filter on the light one: a filter that
// lightens an arbitrary path is a guess about the result, and the whole
// point of the dark variant is a MEASURED ratio (7.00:1 on the dark sidebar,
// against the light ink's 2.60:1, which is under the 3:1 bar for meaningful
// non-text content).
//
// ABSENT IS A REAL STATE and the templates handle it: an instance that
// declares no `mark-dark` shows its one mark in both schemes, which is what
// every instance did before this existed. `imageForRole` returns undefined
// and nothing downstream has to special-case a folio that never opted in.
const iconDark = imageForRole(decl.images, "mark-dark");
// THE MASK FORM, which replaces the light/dark PAIR when an instance declares
// it. Resolved by role like `mark-dark`, so an instance that declares no mask
// keeps the two-image path and nothing changes for it — absent is a real
// state, the same rule `mark-dark` itself follows.
const iconMask = imageForRole(decl.images, "mark-mask");

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
    // THE AVATAR CROP, already solved into the four values CSS wants.
    //
    // Owner, 2026-09-22: *"use theme avatar not the purply thing"* — the mark
    // in the sidebar header was the `@` glyph; the theme avatar is this art,
    // clipped to the cat, which is what `603s` measured `avatarRegion` for.
    //
    // The arithmetic is done HERE for the same reason `region` above is:
    // computing it in Liquid is worse than computing it in TypeScript. The
    // image is scaled by `1/w` and `1/h` and then offset by `-x` and `-y` OF
    // THE SCALED image, which is why the offsets divide by the same fractions.
    // `navbar.ts`'s `mark()` does the identical sum for the rail — one crop,
    // two renderers, and neither carries a second formula.
    avatar: img.avatarRegion
      ? {
          width: +(100 / img.avatarRegion.w).toFixed(4),
          height: +(100 / img.avatarRegion.h).toFixed(4),
          left: +((-100 * img.avatarRegion.x) / img.avatarRegion.w).toFixed(4),
          top: +((-100 * img.avatarRegion.y) / img.avatarRegion.h).toFixed(4),
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
 * Every declared tile count this site publishes, as `directory id → count`.
 *
 * ## Scanned, not mapped
 *
 * There is no table here saying which projection serves which directory, and
 * there must not be. A projection NAMES the directories it counts for, so the
 * scan reads whatever it finds and a map of guesses cannot go stale. That is
 * what makes `assets/library/index.json` able to declare for both `library`
 * and `uploads` — two tiles over one dataset, `flh4` — without this function
 * knowing anything about either.
 *
 * ## Every failure is ABSENCE, never zero
 *
 * A missing `assets/`, an unreadable file, malformed JSON, a projection that
 * declares nothing: all of them contribute no entry, so the tile renders with
 * no badge. None of them contributes `0`, which would say the graph is empty
 * — the opposite fact. `dh4f`.
 *
 * Unreadable is not reported as a finding HERE because this file's gate is a
 * staleness gate: a projection that cannot be parsed is its own generator's
 * failure and is already red there, and a second voice saying so would be a
 * second answer to whose defect it is.
 */
function scanTileCounts(assetsDir: string): Map<string, TileCount> {
  const out = new Map<string, TileCount>();
  if (!existsSync(assetsDir)) return out;
  for (const d of readdirSync(assetsDir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = join(assetsDir, d.name, "index.json");
    if (!existsSync(file)) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, "utf-8"));
    } catch {
      continue;
    }
    for (const [id, count] of readTileCounts(parsed)) {
      // LAST writer would be arbitrary, so the FIRST is kept and the clash is
      // simply not silent-overwritten. Two projections declaring one
      // directory's count is a defect in the declarations, not something to
      // resolve by directory-read order — which is what `readdirSync` would
      // make it.
      if (!out.has(id)) out.set(id, count);
    }
  }
  return out;
}

const links = siteLinks(decl, repoUrl);
const allHarnesses = harnessTiles(
  REPO_ROOT,
  ROOT,
  readdirSync(REPO_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "node_modules")
    .map((d) => d.name)
    .sort(),
);

/**
 * The row, resolved. Separate from the payload literal because it joins THREE
 * sources -- the resolved icon list on this instance's own tile, that tile's
 * declared visualisations, and `siteLinks` -- and a join inlined in an object
 * literal is a join nobody can test.
 */
function navbarRow(
  harnesses: readonly { name: string; navbarIcons?: string[]; visualisations?: { kind: string; path?: string | null }[] }[],
  self: string | undefined,
  siteLinkList: readonly { id: string; path?: string; url?: string }[],
): { icons: string[]; hrefs: Record<string, string>; folders: { kind: string; path?: string }[] } | null {
  const mine = harnesses.find((h) => h.name === self);
  // UNDETERMINED -> `null`, never `{icons: []}`. "Nobody decided" and "show
  // none" are different answers and the template must be able to tell them
  // apart; `[]` here would report every un-migrated instance as deliberate.
  if (!mine || mine.navbarIcons === undefined) return null;
  const byKind = new Map((mine.visualisations ?? []).map((v) => [v.kind, v.path ?? undefined]));
  const hrefs: Record<string, string> = {};
  for (const icon of mine.navbarIcons) {
    // `kg` is a SITE link rather than a graph of its own -- it is the viewer
    // over the whole instance, which is why `siteLinks` owns it and the
    // visualisation list does not carry it.
    const at =
      icon === "kg"
        ? siteLinkList.find((l) => l.id === "kg")?.path
        : byKind.get(icon);
    // `/processes/index.md` is what the coverage declares and NOT what the
    // built site serves -- Jekyll renders that page at `/processes/`. The tabs
    // have always linked the declared value and therefore 404 on the two kinds
    // that declare an `index.md`; that is a wider defect than this row and is
    // recorded rather than fixed here, because changing what a COVERAGE path
    // means would move every consumer at once.
    //
    // Normalised for this row only: an icon in a six-slot row that 404s is the
    // `pb04` failure with the best possible disguise, since it looks like
    // navigation right up to the click.
    if (at) hrefs[icon] = at.replace(/\/index\.md$/, "/");
  }
  // THIS INSTANCE'S OWN CONTROLLED FOLDERS — owner: *"next on navbar then is
  // is library docs/ and other controlled folders"*. Resolved here beside the
  // icon row because they come from the same tile, and a client that joined
  // the harnesses array itself would be a second answer to "which instance am
  // I" — a question a staging preview's URL prefix already makes hard.
  //
  // A kind with NO path is kept, with no path. `pb04`: declared-and-unrendered
  // is a finding, and dropping it answers "where is qa" with silence.
  const folders = (mine.visualisations ?? []).map((v) =>
    v.path ? { kind: v.kind, path: v.path.replace(/\/index\.md$/, "/") } : { kind: v.kind },
  );
  return { icons: [...mine.navbarIcons], hrefs, folders };
}

const payload = {
  // The SOURCE is the declaration, not `_data/harness.json` -- which is
  // Jekyll's own file, keeps that name, and is what this writes.
  _generated: `scripts/sync-docs-harness.ts — do not hand-edit; edit ${instanceDeclarationFilename(decl.name)}`,
  name: decl.name,
  title: decl.title ?? decl.name,
  description: decl.description ?? "",
  icon: icon ? { src: siteRelative(icon.src), title: icon.title ?? "", description: icon.description ?? "" } : null,
  iconMask: iconMask
    ? { src: siteRelative(iconMask.src), title: iconMask.title ?? "", description: iconMask.description ?? "" }
    : null,
  iconDark: iconDark
    ? { src: siteRelative(iconDark.src), title: iconDark.title ?? "", description: iconDark.description ?? "" }
    : null,
  smallIcon: smallIcon
    ? { src: siteRelative(smallIcon.src), title: smallIcon.title ?? "", description: smallIcon.description ?? "" }
    : null,
  landing,
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
  declaredKinds: [...new Set((decl.directories ?? []).flatMap((d) => d.graphKinds ?? []))].sort(),
  links,
  // ONE FAT TILE PER INITIATED HARNESS, for the left sidebar.
  //
  // Owner, 2026-09-20: *"I still want to see for every initiated harness a
  // themed fat navbar tile, boot strap at bottom, that user can click on. And
  // basic stats/info via icon + bafges. Use existing harness vaiyalizaiin(s)."*
  //
  // It rides THIS file rather than arriving as a second generator, for the
  // reason this file exists at all: Jekyll reads data only from `_data/`, and
  // a second generated file there would want a second staleness gate free to
  // disagree with `docs:harness:check`. One file, one gate, one answer to
  // "what does the site know about this repository's instances".
  //
  // The directory list is read HERE and passed in, so `harness-tiles.ts` takes
  // its candidates from an argument and can be tested against a fixture
  // without a filesystem walk.
  /* THE GRAPH TILES, derived from the visualiser obligation rather than from a
   * second list. One array for BOTH surfaces — Q11: a tile is declared once
   * and says where it shows, never two registries free to disagree about what
   * a tile is. The navbar and the board filter this by `surfaces`. */
  tiles: withTileCounts(
    graphTiles(decl?.directories ?? [], relative(REPO_ROOT, join(ROOT, siteDirFor(ROOT)))),
    scanTileCounts(join(ROOT, siteDirFor(ROOT), "assets")),
  ),
  harnesses: allHarnesses,
  /**
   * THE NAVBAR ICON ROW for THIS instance — which icons, and where each goes.
   *
   * Owner, 2026-09-22: *"max is 6 and one for todos one for beans one for
   * processes viewer/ (the factory flow) one for KG viewer"*, and on where the
   * list lives: *"should be in each harness config which are shown (so some
   * could show none, but make this default in cat-harness that is
   * inherited)."*
   *
   * THE LIST IS RESOLVED, the DESTINATIONS ARE LOOKED UP, and neither is
   * written down here. `resolveNavbarIcons` walks `needs`; the hrefs come from
   * the instance's own declared visualisations and from `siteLinks`. So an
   * icon whose graph this instance does not publish gets NO href and the
   * template renders it as a non-link rather than a dead one -- `pb04`, the
   * same rule the harness tabs and the rail already follow.
   *
   * `close` and `launcher` carry no href ON PURPOSE: they drive controls on
   * the page rather than going anywhere, and giving them one would make them
   * look like navigation.
   */
  navbar: navbarRow(allHarnesses, decl?.name, links),
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
      `Run \`bun run docs:harness\` and commit the result.`,
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, next);
console.log(`Wrote ${relative(ROOT, OUT)} — title "${payload.title}"`);
