/**
 * One fat, themed navbar tile per INITIATED HARNESS, with its stats and its
 * existing visualisations.
 *
 * @module scripts/harness-tiles
 *
 * The owner, 2026-09-20:
 *
 * > I still want to see for every initiated harness a themed fat navbar tile,
 * > boot strap at bottom, that user can click on. And basic stats/info via
 * > icon + bafges. Use existing harness vaiyalizaiin(s).
 *
 * Four requirements, and the last one is the constraint that shapes the rest:
 * **nothing here renders a graph.** A tile LINKS to a viewer that already
 * exists, and where none exists it says so rather than linking somewhere.
 *
 * ## "Bootstrap at bottom" is DECLARED, not a name literal
 *
 * `bootstrap/harness.json` carries a `renderExemption` whose reason says
 * it in those words — *"bootstrap IS the navbar footer"* — so the ordering
 * reads {@link isExemptFrom}`(decl, "visualiser")` rather than testing for the
 * string `bootstrap`. A checker that names one instance states a rule true
 * only for the instance somebody remembered, which is the argument that put
 * the exemption in the declaration in the first place (bean `hfkl`).
 *
 * And it falls out correctly rather than by coincidence: an instance exempt
 * from owing a visualiser is exactly an instance whose tile cannot link to
 * one, so the tiles that go to the bottom are the tiles with nothing to open.
 *
 * ## A link is DECLARATION-driven and PRESENCE-checked
 *
 * Bean `zsah`, on the owner's tile ruling, and bean `flh4`, which paid for the
 * distinction: a graph's **declaration** and a **published projection** are
 * two different facts, and `uploads` once rendered as *"nothing publishes a
 * projection for it"* while a working page sat at its declared path.
 *
 * So: the declaration supplies the CANDIDATES — an instance's declared graphs
 * are the only things a tile may claim to show — and the disk decides whether
 * each one is a LINK or a gap. A candidate with no page is reported, never
 * linked. That is `pb04`'s lesson as a rule: a dead link is worse than no
 * link, because it invites a click and then reads as "this site is broken".
 *
 * ## The theme comes from the AVATAR's tone
 *
 * No instance declares a theme today, and inventing a palette per instance
 * would put a second colour vocabulary beside `schemas/theme.ts` — the exact
 * drift that file exists to have ended. `schemas/avatars.ts` already gives
 * every kind a **hue angle**, from which the stylesheet builds both schemes,
 * so a tile themed by its avatar's tone is themed by the mechanism this
 * repository already has. An instance with no avatar of its own takes
 * `GENERIC`, which is reported as a finding rather than rendered as a blank.
 */
import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { GENERIC, avatarFor, hasAvatar } from "../schemas/avatars.js";
import { instanceConfigFilename } from "../schemas/harness-config.js";
import { flattenDependencies } from "./dependency-order.js";
import {
  type CatHarnessDeclaration,
  findDeclarationFile,
  isExemptFrom,
  readDeclaration,
  siteDirFor,
  visualisationsOf,
} from "../schemas/cat-harness.js";
// REQUIRED, for the side effect: `folio` is registered by core on import, and
// this instance declares a folio graph. Without it `readDeclaration` throws on
// a perfectly valid declaration — which is exactly how three inline evals in
// two workflows failed (issue #464, and the comment on `scripts/print-stub.ts`
// that records it). This module reads EVERY instance's declaration, so it is
// more exposed to the omission than a script that reads one.
import "../schemas/folio-graph-kind.js";

/** One number a tile shows as an icon with a badge. */
export type HarnessStat = {
  /** Stable id, so the template picks the glyph rather than parsing a label. */
  id: "directories" | "kinds" | "views";
  /** What a reader is told the number counts. Goes in the accessible name. */
  label: string;
  value: number;
};

/** One viewer a tile can open, or one it cannot. */
export type HarnessVisualisation = {
  /** The declared graph kind this shows. */
  kind: string;
  /** Site-root-relative, for `relative_url`. Absent when nothing is published. */
  path?: string;
};

/** A fat navbar tile for one initiated harness. */
export type HarnessTile = {
  name: string;
  title: string;
  /**
   * What the tile SAYS, which is `title` unless another tile says the same.
   *
   * Owner, 2026-09-21, on the sidebar: two tiles both read `folio-assistant` —
   * the repository root acting as an instance, and `cat-harness`, whose
   * declared title is the product's name. Both link `/`, so a reader could not
   * tell which one they were about to open, or that they were two.
   *
   * A title is a person's choice and is not required to be unique; a LABEL in
   * a list of links has to be, or it is not a label. So the disambiguation
   * happens where the whole set is visible — {@link disambiguate} — rather
   * than by forbidding a title somebody chose.
   */
  label: string;
  description: string;
  /**
   * Exempt from owing a visualiser — the declared reason bootstrap sorts
   * last. See the module docs.
   */
  footer: boolean;
  icon: { src: string; title: string } | null;
  /** Hue angle from the avatar registry — the tile's theme. */
  tone: number;
  /** What the avatar reads as, for the accessible name. */
  reads: string;
  /** Whether the avatar is the instance's own or the generic fallback. */
  genericAvatar: boolean;
  /**
   * INSTANTIATED here, rather than merely present as a dependency.
   *
   * The owner, 2026-09-21: *"only the instiatiated harnesses (not all
   * dependent ones) in teh folio... so repo root has
   * `<harness>.config.json`"*. So the signal is the config at the
   * instantiation root, not the declaration: `harness.json` says what an
   * instance DECLARES, and the config says that the instance is instantiated
   * HERE. Two different facts, and the navbar could not be derived from the
   * declarations alone.
   */
  instantiated: boolean;
  /**
   * Where the tile GOES when clicked — the instance's own themed root when it
   * has one, else its first viewer, else absent and the tile is not a link.
   */
  href?: string;
  /**
   * What {@link href} points AT, which is three different kinds of thing:
   *
   * - `folio`   — the instance's own themed root
   * - `viewer`  — a kind handler's view of one of its graphs
   * - `handled` — a page ANOTHER instance publishes about it, named by its
   *               own `renderExemption.reachableAt`. Only a render-exempt
   *               instance can have this, and it is the last resort.
   */
  hrefKind?: "folio" | "viewer" | "handled";
  stats: HarnessStat[];
  visualisations: HarnessVisualisation[];
  /**
   * The instances this one sits on, as declared. `undefined` is UNDETERMINED
   * — nobody has said — and is a different answer from `[]`, which is an
   * instance asserting it sits on nothing.
   */
  needs?: readonly string[];
  /** Candidates with no published page, and any other honest gap. */
  findings: string[];
};

/**
 * A declared icon's path, as the PUBLISHED site serves it.
 *
 * ## The defect this replaced, measured on the served bytes
 *
 * Owner, 2026-09-21: *"broken image on LHS navbar"*. Read out of
 * `origin/gh-pages`, because egress to the published site is blocked from the
 * build container and the branch is the only place the served bytes can be
 * had:
 *
 * ```
 * <img class="fa-harness-tile__mark"
 *      src="/folio-assistant/STAGING/<branch>/docs/assets/img/icons/cat-mark.svg">
 * ```
 *
 * `docs/` is the instance's site directory, and the site build copies that
 * directory's CONTENTS to the mount — so the declared prefix is exactly what a
 * published URL does not carry. Every reader got a 404 and a placeholder.
 *
 * The old helper was handed the wrong KIND of value and could never have
 * stripped anything: `siteDir` is ABSOLUTE
 * (`/…/cat-harness/docs`) while `icon.src` is relative to the instance
 * (`docs/assets/…`), so the prefix test was false for every input. A helper
 * that silently passes everything through is indistinguishable from one that
 * is working, which is why this now takes the instance's own directory and
 * derives the prefix from its OWN declaration.
 *
 * ## Two parts, because an instance is not always at the site root
 *
 * The published path is the instance's mount plus the asset's path with its
 * site directory removed. `folioRoot` already answers the first — `/` for the
 * instance that owns the site, `/<name>/` for one mounted beneath it — so this
 * takes it rather than re-deriving it, and an instance whose mount is unknown
 * gets **no icon at all**. That is the `pb04` rule one layer down: an `<img>`
 * whose `src` 404s is worse than no `<img>`, because a placeholder reads as a
 * broken site rather than as an instance with no art.
 */
function publishedIcon(instanceDir: string, src: string, mount: string | undefined): string | undefined {
  if (mount === undefined) return undefined;
  const prefix = `${siteDirFor(instanceDir)}/`;
  if (!src.startsWith(prefix)) return undefined;
  return `${mount.replace(/\/$/, "")}/${src.slice(prefix.length)}`;
}

/**
 * Where a subject page for one instance's graph is published.
 *
 * The rule is `gen-library-viz.ts`'s, not a new one:
 * `<site>/<handler>/<kind>/<subject>/`, where the handler is the instance that
 * OWNS the site and the subject is the instance whose assets are shown. Its
 * comment is emphatic about why the subject does not come first — `<base>/
 * who-iris/` is who-iris presenting itself, and a viewer parked there would
 * squat on the instance's own site.
 */
export function subjectPage(handler: string, kind: string, subject: string): string {
  return `/${handler}/${kind}/${subject}/`;
}

/**
 * Where the instance that owns the site publishes its own state graph.
 *
 * `state-visualizer.ts` rule 3: the root instance elides its own name, because
 * its `docs/` is installed by cat-harness rather than by itself. So this is
 * `<base>/<graph>/` with nothing in front of it.
 */
export function ownStatePage(kind: string): string {
  return `/${kind}/`;
}

/**
 * An instance's OWN themed root — `<base>/<name>/` — when it has one.
 *
 * The owner, 2026-09-20, settling the two routes in `mount-instance-docs.ts`:
 *
 * > `/docs/who-iris/` should be the cat-harness handler default for docs.
 * > who-iris themed at `/who-iris/`.
 *
 * and, 2026-09-21, on what a tile should open:
 *
 * > cliking shoud go to folio view, not the schema viweer
 *
 * So the tile's target is the INSTANCE acting as handler for its own name, not
 * a kind handler's default rendering of it. An instance has that root exactly
 * when it has its own `docs/` to mount — which is what `mount-instance-docs`
 * walks — so the test is for that directory rather than for a published page.
 *
 * **Probing the built site would give the wrong answer**, and that is measured
 * rather than assumed: `who-iris/docs/` is generated by the instance's own
 * `gen-iris-pages.ts` and mounted at build time, so a working tree that has
 * not run it carries no `docs/who-iris/` while the published site does. The
 * DECLARATION-shaped question — does this instance have docs of its own? — is
 * the one that survives both.
 *
 * The site owner's root is the site root: `mount-instance-docs` leaves it to
 * the main docs pipeline, unchanged.
 */
function folioRoot(repoRoot: string, name: string, atSiteRoot: boolean): string | undefined {
  if (atSiteRoot) return "/";
  const dir = join(repoRoot, name);
  // The instance's OWN site directory, read from its OWN declaration rather
  // than assumed to be `docs/`. `check:declared-paths` is what caught the
  // literal, and it was right to: an instance may publish from anywhere, and
  // this function would have quietly answered "no folio view" for one that
  // did.
  if (findDeclarationFile(dir) === undefined) return undefined;
  return existsSync(join(dir, siteDirFor(dir))) ? `/${name}/` : undefined;
}

/** Every `harness.json` in the tree: the repository root and one level down. */
function instanceDirs(repoRoot: string, names: readonly string[]): string[] {
  const out: string[] = [];
  if (findDeclarationFile(repoRoot) !== undefined) out.push(repoRoot);
  for (const name of names) {
    const dir = join(repoRoot, name);
    if (dir !== repoRoot && findDeclarationFile(dir) !== undefined) out.push(dir);
  }
  return out;
}

function tileFor(
  decl: CatHarnessDeclaration,
  handler: string,
  siteDir: string,
  ownsSite: boolean,
  repoRoot: string,
  /** This instance IS the repository root — the checkout acting as an instance. */
  isRepoRoot: boolean,
  /** This instance's OWN directory, which is where its declared paths are relative to. */
  instanceDir: string,
): HarnessTile {
  const dirs = decl.directories ?? [];
  const kinds = [...new Set(dirs.flatMap((d) => d.graphKinds ?? []))].sort();
  const findings: string[] = [];

  // WHERE THE SITE IS, repo-relative, computed once. `siteDir` arrives
  // absolute while every declared path is relative to the repository root, so
  // one has to be rebased onto the other; deriving it from the value
  // `harnessTiles` already passed in means this and `handled` below cannot
  // disagree about where the site is.
  const sitePrefix = `${relative(repoRoot, siteDir)}/`;

  /* WHAT THE DECLARATION SAYS, before what the conventions guess.
   *
   * `coverage.visualiser` names the page that renders a directory's graph,
   * and a directory says which kinds it holds — so between them the
   * declaration answers "is this kind viewable" directly. Reading only the
   * two conventional paths made that answer unreachable: `translations/`
   * declared a resolving visualiser at `docs/translation-status/` and the
   * tile's own `directories` list linked it, while `visualisations` two
   * lines away still reported the kind as having no viewer. One question,
   * two answers, free to disagree — and the wrong one is the one that gets
   * counted in a finding.
   *
   * `flh4` is the rule: a DECLARED visualiser that does not resolve is a
   * different defect from no visualiser at all. It has always been reported
   * as such below; what was missing is the other side of it, that one which
   * DOES resolve is a viewer.
   *
   * Only a ref under the published site directory counts. A page that
   * resolves on disk but is not published is not something a tile can open,
   * and claiming it would put a 404 behind the tab — `pb04`.
   */
  const declared = new Map<string, string>();
  for (const d of dirs) {
    for (const v of visualisationsOf(d.coverage, d.id)) {
      if (!v.ref.startsWith(sitePrefix)) continue;
      if (!existsSync(join(repoRoot, v.ref))) continue;
      const page = `/${v.ref.slice(sitePrefix.length).replace(/index\.html$/, "")}`;
      for (const kind of d.graphKinds ?? []) {
        if (!declared.has(kind)) declared.set(kind, page);
      }
    }
  }

  // CANDIDATES FROM THE DECLARATION, presence checked on disk. Both pages a
  // kind can be published at are considered, because the instance that owns
  // the site elides its own name and every other instance does not — two rules
  // that live in two generators, read here rather than restated.
  const visualisations: HarnessVisualisation[] = [];
  for (const kind of kinds) {
    const candidates = ownsSite
      ? [ownStatePage(kind), subjectPage(handler, kind, decl.name)]
      : [subjectPage(handler, kind, decl.name)];
    const found = candidates.find((p) => existsSync(join(siteDir, p, "index.html")));
    // CONVENTION FIRST, declaration as the fallback — and the order is
    // OBSERVABLE, so it is a decision rather than a detail. Exactly one kind
    // in this repository resolves both ways today: cat-harness's `uploads`,
    // which the convention publishes at `/uploads/` and the declaration names
    // at `/cat-harness/library/cat-harness/`. Preferring the declaration
    // would repoint a working link nobody asked about; preferring the
    // convention leaves every existing link exactly where it was and fills
    // only the gaps, which is the whole of what this is for.
    const path = found ?? declared.get(kind);
    if (path) visualisations.push({ kind, path });
    else visualisations.push({ kind });
  }
  const unlinked = visualisations.filter((v) => v.path === undefined).map((v) => v.kind);
  if (unlinked.length > 0) {
    findings.push(
      `${decl.name}: declares ${unlinked.length} graph(s) with no published viewer — ` +
        `${unlinked.join(", ")}. Declared and not rendered is a gap, not a dead link.`,
    );
  }

  // A DECLARED visualiser that does not resolve is `flh4`'s defect, and it is
  // a different finding from "no viewer": one says nobody built it, the other
  // says the declaration is wrong.
  for (const d of dirs) {
    // EVERY declared visualisation, not "the" one: a directory may now declare
    // several — the owner's *"harness can declare >= 1 visualiztion (which
    // then has a title)"* — and checking only the first would report a clean
    // directory whose second viewer is missing.
    for (const v of visualisationsOf(d.coverage, d.id)) {
      if (!existsSync(join(siteDir, "..", "..", v.ref))) {
        findings.push(
          `${decl.name}/${d.id}: declares visualiser "${v.title}" at "${v.ref}", ` +
            `which does not resolve on disk.`,
        );
      }
    }
  }

  // THE OTHER HALF OF `flh4`: a page published for this instance under a kind
  // it does NOT declare. The tile must not link it — the declaration is what
  // decides what a tile claims to show — but staying silent would hide a
  // working viewer behind a rule, which is how "declared and not rendered"
  // and "rendered and not declared" both end up invisible. It is reported so
  // the remedy is one line in a declaration rather than a mystery.
  const handlerDir = join(siteDir, handler);
  if (existsSync(handlerDir)) {
    for (const seg of readdirSync(handlerDir, { withFileTypes: true })) {
      if (!seg.isDirectory() || kinds.includes(seg.name)) continue;
      if (existsSync(join(handlerDir, seg.name, decl.name, "index.html"))) {
        findings.push(
          `${decl.name}: a viewer is published at ${subjectPage(handler, seg.name, decl.name)} ` +
            `for a "${seg.name}" graph this instance does not declare. Declare it and the tile links it.`,
        );
      }
    }
  }

  const own = hasAvatar(decl.name);
  const avatar = own ? avatarFor(decl.name) : GENERIC;
  if (!own) {
    findings.push(`${decl.name}: no avatar declared for this instance — showing the generic mark.`);
  }

  const icon = decl.images?.find((i) => i.id === decl.icon);

  // THE CLICK TARGET: the instance's own themed root FIRST, a kind handler's
  // viewer only when it has none. The owner asked for exactly this — "cliking
  // shoud go to folio view, not the schema viweer" — and the first version got
  // it wrong by taking whichever viewer happened to sort first, which for
  // `detangle` and `large-datasets` is the schema viewer.
  // TWO instances resolve to `/`, and that is this repository rather than a
  // bug: `mount-instance-docs` leaves the site root to the main docs pipeline,
  // which the site-owning harness supplies, and the repository root instance IS
  // the checkout that pipeline publishes. Saying so beats giving one of them a
  // link that 404s — `docs/cat-harness/` has viewers beneath it and no index.
  const folio = folioRoot(repoRoot, decl.name, ownsSite || isRepoRoot);

  // THE ICON, published rather than declared — see `publishedIcon`. Resolved
  // here rather than beside `icon` because it needs the mount, and the mount
  // is `folio`.
  const iconSrc = icon ? publishedIcon(instanceDir, icon.src, folio) : undefined;
  if (icon && iconSrc === undefined) {
    // Reported, never rendered as a placeholder. The instance ASKED for a
    // mark and did not get one, and that is a fact about its declaration
    // rather than about this tile.
    findings.push(
      `${decl.name}: declares icon "${decl.icon}" at ${icon.src}, which this build cannot ` +
        `turn into a published path — the instance has no mount, or the path is not under ` +
        `its declared site directory. Showing no mark rather than a broken image.`,
    );
  }
  const firstViewer = visualisations.find((v) => v.path)?.path;

  /* THE THIRD TARGET, for an instance that renders nothing of its own.
   *
   * bootstrap is instantiated, correctly has no viewer (it declares a
   * `renderExemption` — the owner, 2026-09-20: *"it is exception to
   * harness/layer not having visualtion/workflow visualizer"*), and therefore
   * had no href at all. `nav_footer_custom.html` rendered its tab as a greyed
   * `<span>`, and the owner read that as broken: *"Boostrap should be
   * clicable."*
   *
   * Nothing was wrong with the declaration OR with `pb04`'s rule that a tab
   * with nowhere to go is not a link. What was missing is that the exemption
   * said "I do not render myself" without saying "so go here instead".
   * `reachableAt` is that second half, and it is DECLARED for the same reason
   * the exemption itself is — a checker naming one instance states a rule
   * true only for the instance somebody remembered (`hfkl`).
   *
   * THE FILE IS CHECKED, not composed. A declared path that does not resolve
   * is `flh4`'s defect and a DIFFERENT finding from "nothing is published":
   * one says the declaration is wrong, the other says nobody built it. Both
   * leave the tab unlinked, which is correct either way.
   */
  let handled: string | undefined;
  const reachable = decl.renderExemption?.reachableAt;
  if (folio === undefined && firstViewer === undefined && reachable !== undefined) {
    // `sitePrefix`, the same repo-relative site directory the declared
    // visualisers were rebased onto above — one computation, so the two
    // cannot disagree about where the site is.
    const prefix = sitePrefix;
    const onDisk = join(repoRoot, reachable);
    if (!existsSync(onDisk)) {
      findings.push(
        `${decl.name}: its renderExemption declares \`reachableAt: ${reachable}\`, which is ` +
          `not a file. The tab stays unlinked — a declared path that does not resolve is a ` +
          `wrong declaration, which is a different problem from nothing being published.`,
      );
    } else if (!reachable.startsWith(prefix)) {
      findings.push(
        `${decl.name}: its renderExemption declares \`reachableAt: ${reachable}\`, which is ` +
          `outside the site-owning harness's site directory (${prefix}), so it is not published ` +
          `and cannot be linked to.`,
      );
    } else {
      // `.md` is published as `.html` by Jekyll; anything else is served as
      // it sits. Deriving the extension rather than assuming one keeps this
      // honest if an exemption ever points at an already-built page.
      const rest = reachable.slice(prefix.length);
      handled = `/${rest.replace(/\.md$/, ".html")}`;
    }
  }

  const href = folio ?? firstViewer ?? handled;
  if (folio === undefined && firstViewer !== undefined) {
    findings.push(
      `${decl.name}: has no docs/ of its own, so the tile opens a kind handler's viewer ` +
        `(${firstViewer}) rather than the instance's own themed root.`,
    );
  }
  if (handled !== undefined) {
    findings.push(
      `${decl.name}: renders nothing of its own (render-exempt), so its tab opens the page ` +
        `another instance publishes about it (${handled}), declared as \`reachableAt\`.`,
    );
  }

  return {
    name: decl.name,
    title: decl.title ?? decl.name,
    // Provisional. `disambiguate` is what settles it, because only the whole
    // set can say whether this title identifies anything.
    label: decl.title ?? decl.name,
    description: decl.description ?? "",
    footer: isExemptFrom(decl, "visualiser"),
    ...(decl.needs ? { needs: decl.needs } : {}),
    icon: iconSrc === undefined ? null : { src: iconSrc, title: icon?.title ?? "" },
    tone: avatar.tone,
    reads: avatar.reads,
    genericAvatar: !own,
    instantiated: existsSync(join(repoRoot, instanceConfigFilename(decl.name))),
    ...(href === undefined
      ? {}
      : {
          href,
          hrefKind:
            folio !== undefined
              ? ("folio" as const)
              : firstViewer !== undefined
                ? ("viewer" as const)
                : ("handled" as const),
        }),
    stats: [
      { id: "directories", label: "declared directories", value: dirs.length },
      { id: "kinds", label: "declared graph kinds", value: kinds.length },
      { id: "views", label: "visualisations you can open", value: visualisations.filter((v) => v.path).length },
    ],
    visualisations,
    findings,
  };
}

/**
 * Every initiated harness, as a tile, with the footer instances last.
 *
 * `harnessRoot` is the instance that owns the published site — its `docs/` is
 * the site root, and it supplies the handler segment every subject page sits
 * under. `names` is the directory list to look in, passed rather than globbed
 * so a caller can test this against a fixture without a filesystem walk.
 */
export function harnessTiles(
  repoRoot: string,
  harnessRoot: string,
  names: readonly string[],
): HarnessTile[] {
  // THE SITE OWNER IS READ FIRST, because `siteDirFor` THROWS on a directory
  // with no declaration rather than returning a default — correctly, since a
  // guessed site root would write pages into a directory nobody named. A
  // caller pointed at a tree that has no harness gets no tiles, which is a
  // real answer; an exception here would take down the whole docs sync over a
  // question that has one.
  const handler = readDeclaration(harnessRoot)?.name;
  if (!handler) return [];
  const siteDir = join(harnessRoot, siteDirFor(harnessRoot));

  const tiles: HarnessTile[] = [];
  for (const dir of instanceDirs(repoRoot, names)) {
    const decl = readDeclaration(dir);
    if (!decl) continue;
    tiles.push(
      tileFor(decl, handler, siteDir, dir === harnessRoot, repoRoot, dir === repoRoot, dir),
    );
  }

  return orderTiles(disambiguate(tiles));
}

/**
 * Make every tile's label identify its subject, and say when it did not.
 *
 * A duplicate is qualified with the instance's own directory name, which IS
 * unique — it is the directory the declaration was read from. `folio-assistant`
 * and `folio-assistant (cat-harness)` are then two labels a reader can act on.
 *
 * **The finding is not optional.** Two tiles that read the same and link the
 * same place are indistinguishable from one tile rendered twice, and this
 * repository has already paid for a defect of exactly that shape — a count
 * that was not the thing it counted. Qualifying the label fixes what a reader
 * sees; the finding is what tells somebody a declaration is ambiguous.
 */
export function disambiguate(tiles: readonly HarnessTile[]): HarnessTile[] {
  const byTitle = new Map<string, number>();
  for (const t of tiles) byTitle.set(t.title, (byTitle.get(t.title) ?? 0) + 1);
  return tiles.map((t) => {
    if ((byTitle.get(t.title) ?? 0) < 2) return t;
    // `folio-assistant (folio-assistant)` says nothing twice. When the title
    // IS the directory name there is no further fact to add, so the label is
    // left alone and the other tiles carry the qualifier — which is what makes
    // the pair distinguishable.
    return {
      ...t,
      label: t.name === t.title ? t.title : `${t.title} (${t.name})`,
      findings: [
        ...t.findings,
        `${t.name}: its title "${t.title}" is also another instance's. The tile is ` +
          `labelled with its directory name as well, because a label that does not ` +
          `identify its subject is not a label.`,
      ],
    };
  });
}

const byName = (a: HarnessTile, b: HarnessTile) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/**
 * Top to bottom: the most derived instance first, the floor last.
 *
 * The owner, 2026-09-20, giving the spine in one sentence:
 *
 * > So bootsteap, cat harness, fa-core, f-a, from bottom to top.
 *
 * That is **dependency order, reversed** — the foundation at the bottom and
 * what is built on it above, which is how a layer diagram is drawn everywhere
 * else in this repository. So it is computed from the declared `needs` rather
 * than written out as four names: a list of names would be a rule true only
 * for the instances somebody remembered, which is exactly why
 * `bootstrap`'s footer position is read from its declared exemption
 * instead of from its name.
 *
 * ## The sort is `flattenDependencies`, not a second topological sort
 *
 * `dependency-order.ts` exists because *"a repeatable subprocess is a thing
 * with one implementation"* — its own words, and it names four callers that
 * would otherwise each write their own. This is the fourth. `fatal` is
 * required there because a RUNNER must not inherit a failure policy nobody
 * chose; nothing is run here, so every step takes `false` and the field is
 * carried rather than consulted.
 *
 * ## An instance with no declared layer is UNDETERMINED, and says so
 *
 * `flattenDependencies` is free to put a node that needs nothing first, so an
 * unlabelled instance would land on the floor beside the bootstrap — asserting
 * something nobody declared. They are partitioned out instead and listed
 * above the spine, alphabetically, with a finding. Absent is not `[]`.
 *
 * ## A broken graph does not blank the navbar
 *
 * `flattenDependencies` returns an EMPTY order when it finds a cycle or a
 * missing dependency, which is right for a pipeline — a partial order over a
 * broken graph is the shape that gets run anyway. A sidebar is not a pipeline:
 * showing nothing hides every instance over one typo. So the problems are
 * reported on the tiles and the list falls back to alphabetical, which is
 * undetermined rather than wrong.
 */
export function orderTiles(tiles: readonly HarnessTile[]): HarnessTile[] {
  const known = new Set(tiles.map((t) => t.name));
  const needed = new Set(tiles.flatMap((t) => [...(t.needs ?? [])]));
  const spine = tiles.filter((t) => t.needs !== undefined || needed.has(t.name));
  const unplaced = tiles.filter((t) => !spine.includes(t)).sort(byName);
  for (const t of unplaced) {
    t.findings.push(
      `${t.name}: declares no \`needs\`, so its place in the stack is alphabetical rather than derived.`,
    );
  }

  const { order, problems } = flattenDependencies(
    // Declaration order is what `flattenDependencies` breaks ties on, so the
    // input is sorted by name: two instances on the same layer then read
    // alphabetically instead of in whichever order the directory was walked.
    [...spine].sort(byName).map((t) => ({
      id: t.name,
      needs: (t.needs ?? []).filter((n) => known.has(n)),
      fatal: false,
    })),
  );
  const dangling = spine.flatMap((t) =>
    (t.needs ?? [])
      .filter((n) => !known.has(n))
      .map((n) => `${t.name}: needs "${n}", which names no instance in this tree.`),
  );
  for (const p of [...problems.map((p) => p.detail), ...dangling]) {
    const owner = tiles.find((t) => p.startsWith(`${t.name}:`)) ?? tiles[0];
    owner?.findings.push(p);
  }
  if (problems.length > 0) return [...tiles].sort(byName);

  const byId = new Map(spine.map((t) => [t.name, t]));
  // REVERSED: `flattenDependencies` yields foundation-first, and the owner
  // asked for bottom-to-top.
  const stack = [...order].reverse().map((s) => byId.get(s.id)!);
  // THE MOST DERIVED INSTANCE IS ON TOP, and the undetermined sit under it.
  //
  // The owner, 2026-09-21: *"in reverse dep order (so bootsrap on bottom,
  // folio-asst, on top)"*. The first version put the whole unplaced group
  // above the spine, which left `folio-assistant` eighth from the top — the
  // sentence's two endpoints were both wrong.
  //
  // So the spine's head keeps the top and its floor keeps the bottom, and an
  // instance whose layer nobody declared goes immediately BELOW the head:
  // the only thing known about it is that it is neither the root instance nor
  // the floor. It still carries the finding that says its place is not derived.
  const [head, ...rest] = stack;
  return floorLast(head === undefined ? unplaced : [head, ...unplaced, ...rest]);
}

/**
 * The declared floor goes last, whatever the dependency graph said.
 *
 * TWO RULES THAT AGREE TODAY, kept as two on purpose. The dependency order
 * puts `bootstrap` last because it is what everything sits on; its own
 * `renderExemption` puts it last because *"bootstrap IS the navbar
 * footer"*. In this repository they give the same answer, and a test asserts
 * it.
 *
 * They are not the same rule, though, and collapsing them would lose the one
 * that survives a missing declaration: an instance that declares no `needs`
 * is undetermined and would float to the top of the unplaced group, so a
 * bootstrap whose layer nobody wrote down would land ABOVE everything it
 * underpins. The exemption is the fact that does not depend on the ordering
 * having been declared, so it is applied last and wins.
 *
 * A stable partition rather than a comparator, so two exempt instances keep
 * the order the stack gave them.
 */
function floorLast(tiles: readonly HarnessTile[]): HarnessTile[] {
  return [...tiles.filter((t) => !t.footer), ...tiles.filter((t) => t.footer)];
}
