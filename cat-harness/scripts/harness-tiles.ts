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
import { resolveThemeBackdrop } from "../schemas/theme.js";
import { themeById } from "../schemas/themes.js";
import { instanceConfigFilename } from "../schemas/harness-config.js";
import { flattenDependencies } from "./dependency-order.js";
import {
  type CatHarnessDeclaration,
  type NavbarIcon,
  resolveNavbarIcons,
  findDeclarationFile,
  isExemptFrom,
  readDeclaration,
  siteDirFor,
  visualisationsOf,
} from "../schemas/cat-harness.js";
// The `folio` graph kind is registered by CORE. This module is a LIBRARY, so it
// does NOT import that registration: a library's edge is inherited by every
// module that imports it, and the harness may not depend on core. The
// COMMAND that runs carries it — and since #840 every caller does, because
// the trigger sits at the foot of `cat-harness.ts` and a reader lives in that
// module, so loading it is a precondition of calling one.
//
// THIS COMMENT NAMED `check:composition-roots` AS THE GUARANTEE UNTIL
// 2026-09-22, in SEVEN files, AND THAT SCRIPT DOES NOT EXIST. `bun run
// check:composition-roots` exits "Script not found". The safety argument for
// a library omitting the registration rested on a gate nobody built, and no
// gate failed to say so — the same silence this repository keeps paying for.
// It is moot now rather than fixed: #840 made the registration automatic, so
// there is no longer a command that can forget it (bean `z9ax`).

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
  /**
   * The kind's content is materialized: openable, and not editable here.
   *
   * ## The two greys, at this level
   *
   * Absent {@link path} and `readOnly` both render inert and mean different
   * things: the first has nothing to open, the second opens and refuses an
   * edit. The second is the one that offers the copy-out, so collapsing them
   * takes away the only route to working on frozen content.
   *
   * ABSENT IS THREE THINGS AT ONCE HERE, and all three are honestly absent:
   * no directory declaring this kind has answered; or they disagree, which is
   * reported as its own finding rather than resolved by a rule; or nothing
   * here is materialized. None of them is "writable", so none of them earns a
   * `false`.
   */
  readOnly?: boolean;
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
  /**
   * Which icons this instance's navbar row shows, after inheritance.
   *
   * OPTIONAL, and absent means UNDETERMINED — neither this instance nor
   * anything it needs nor the site owner has decided. `[]` is a different
   * answer and means "show none", which the owner asked for by name. A
   * consumer that renders the two the same reports an un-migrated instance as
   * a deliberate one.
   */
  navbarIcons?: NavbarIcon[];
  /**
   * The mark the navbar renders: the theme avatar if there is one, else the
   * instance's own icon, with its crop solved. Absent when neither exists —
   * and the navbar then draws an INITIAL, which is a different answer from a
   * broken image and from a placeholder glyph.
   */
  mark?: { src: string; title: string; crop?: { width: number; height: number; left: number; top: number } };
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
 * site directory removed. An instance whose mount is unknown gets **no icon at
 * all** — the `pb04` rule one layer down: an `<img>` whose `src` 404s is worse
 * than no `<img>`, because a placeholder reads as a broken site rather than as
 * an instance with no art.
 *
 * ## `folioRoot` IS THE WRONG MOUNT FOR THIS, and it shipped
 *
 * This took `folioRoot` — *"`/` for the instance that owns the site,
 * `/<name>/` for one mounted beneath it"* — and that is the instance's FRONT
 * DOOR, which is a different question from where its SITE DIRECTORY lands.
 *
 * MEASURED by running the mount rather than by reading either file:
 *
 *     who-iris/library/  ->  /who-iris/        (1378 files)
 *     who-iris/docs/     ->  /docs/who-iris/   (4 files)
 *
 * `mount-instance-docs` gives every instance a `<kind>/<name>` route
 * unconditionally and a bare `<name>` route to whichever kind claims it first.
 * For who-iris that is the **library**, so `/who-iris/` serves 1,378 corpus
 * files and the front door is not the docs at all. The icon composed against
 * it 404s — confirmed, 404 against 200 for the same asset at
 * `/docs/who-iris/assets/img/who-emblem.svg`.
 *
 * So this composes against the route the site directory ACTUALLY takes: the
 * unconditional `<kind>/<name>` one, from the kind the instance declares for
 * that directory. The site owner keeps `/`, because its docs are the site
 * root and are not mounted at all.
 *
 * The local preview hid it: `preview:site` does not run the mount, so the
 * asset was missing there for an unrelated reason and the wrong URL looked
 * like the same 404.
 */
function publishedIcon(
  instanceDir: string,
  src: string,
  siteMount: string | undefined,
): string | undefined {
  if (siteMount === undefined) return undefined;
  const prefix = `${siteDirFor(instanceDir)}/`;
  if (!src.startsWith(prefix)) return undefined;
  return `${siteMount.replace(/\/$/, "")}/${src.slice(prefix.length)}`;
}

/**
 * Where this instance's SITE DIRECTORY is served from.
 *
 * `/` for the instance that owns the site — the main docs pipeline builds it
 * in place. For every other instance, the `<kind>/<name>` route
 * `mount-instance-docs` always produces, with the kind read from the
 * declaration entry whose path IS the site directory. `undefined` when the
 * instance declares no kind for it, which is a real answer: nothing can be
 * said about where a directory nobody classified will be served.
 */
function siteDirMount(
  decl: CatHarnessDeclaration,
  instanceDir: string,
  ownsSite: boolean,
): string | undefined {
  if (ownsSite) return "/";
  const site = siteDirFor(instanceDir);
  const entry = (decl.directories ?? []).find(
    (d) => (d.path ?? "").replace(/\/$/, "") === site,
  );
  const kind = entry?.graphKinds?.[0];
  return kind === undefined ? undefined : `/${kind}/${decl.name}/`;
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
  /**
   * The SITE-OWNING instance — its declaration and its directory.
   *
   * Needed because theme art is routinely declared by the harness that
   * SUPPLIES it rather than by the instance it is about: `bootstrap` declares
   * a sticky with `theme: bootstrap` and **no images at all**, while
   * `cat-harness` declares the `landing-bootstrap` role's three layouts. That
   * is the inversion `ThemeBackdropSchema` describes — a theme names a ROLE,
   * and whoever holds images for that role supplies the art.
   */
  owner?: { decl: CatHarnessDeclaration; dir: string },
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
      const page = publishedUrlOf(v.ref.slice(sitePrefix.length));
      for (const kind of d.graphKinds ?? []) {
        if (!declared.has(kind)) declared.set(kind, page);
      }
    }
  }

  // CANDIDATES FROM THE DECLARATION, presence checked on disk. Both pages a
  // kind can be published at are considered, because the instance that owns
  // the site elides its own name and every other instance does not — two rules
  // that live in two generators, read here rather than restated.
  /**
   * THE READ-ONLY ANSWER FOR A KIND, resolved across the directories declaring
   * it — and `undefined` when they do not agree.
   *
   * A kind can be declared by more than one directory, so it can be declared
   * read-only by one and writable by another. `who-iris` is exactly that shape
   * one field along: `catalogue/` is frozen and `uploads/` is the drop zone.
   * Picking the first answer would make the listing depend on declaration
   * order; picking `true` if any says so would freeze a kind on the strength of
   * one directory. Disagreement is a THIRD state and it is reported as one —
   * undefined here, and named in a finding below, rather than resolved by a
   * rule nobody chose.
   */
  const readOnlyFor = (kind: string): boolean | undefined => {
    const said = dirs
      .filter((d) => (d.graphKinds ?? []).includes(kind))
      .map((d) => d.readOnly)
      .filter((v): v is boolean => v !== undefined);
    if (said.length === 0) return undefined;
    return said.every((v) => v === said[0]) ? said[0] : undefined;
  };

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
    // READ-ONLY IS ORTHOGONAL TO WHETHER A VIEWER WAS FOUND, and keeping the
    // two independent here is the whole of the two-greys distinction: `path`
    // answers "is there anything to open", `readOnly` answers "may it be
    // edited". Both branches carry it, so a kind never loses its read-only
    // state by failing to resolve a page.
    const ro = readOnlyFor(kind);
    visualisations.push({
      kind,
      ...(path ? { path } : {}),
      ...(ro === undefined ? {} : { readOnly: ro }),
    });
  }
  // TWO REASONS A KIND HAS NO PATH, and they are not the same finding.
  //
  // Discovery above is by CONVENTION — a page at `/<handler>/<kind>/<name>/`
  // or, for the site's owner, `/<kind>/`. A kind can therefore have a viewer
  // that is real, declared and on disk, and still not be found here, because
  // it was published somewhere the convention does not look: an instance's own
  // mounted `docs/`, for example.
  //
  // Reporting both as "no published viewer" makes the artefact assert
  // something false. Measured 2026-09-22: `who-iris/catalogue` gained a viewer
  // at `who-iris/docs/catalogue.html`, declared and resolving — and this
  // finding went on saying nobody had built one, while the declared-ref check
  // twenty lines below reported the same declaration as perfectly fine. Two
  // halves of one file disagreeing about one graph.
  //
  // HALF OF THE DISCOVERY NOW HAPPENS, and the two halves met in a merge
  // (2026-09-22). A declared ref UNDER the published site directory is linked
  // by the `declared` map above: its published path is the ref with the site
  // prefix stripped, so there is nothing to resolve and nothing to guess.
  // Those kinds never reach this block, because they have a `path`.
  //
  // What is left here is the case that genuinely needs `withRoutes`: a ref
  // INSIDE an instance's own tree, which the site build mounts somewhere the
  // strip above cannot compute — `who-iris/docs/catalogue.html` is the
  // measured example. For those the fix is still the DISTINCTION rather than
  // the discovery: naming the case stops the report lying in the meantime,
  // and tells whoever does the routing work which gap they are closing.
  const declaredFor = (kind: string, stagingOnly: boolean): string | undefined => {
    for (const d of dirs) {
      if (!(d.graphKinds ?? []).includes(kind)) continue;
      for (const v of visualisationsOf(d.coverage, d.id)) {
        if ((v.publish === "staging-only") !== stagingOnly) continue;
        if (existsSync(join(siteDir, "..", "..", v.ref))) return v.ref;
      }
    }
    return undefined;
  };

  const unlinked = visualisations.filter((v) => v.path === undefined).map((v) => v.kind);
  // A STAGING-ONLY viewer is unlinked ON PURPOSE, so it is neither of the two
  // gaps below. Saying otherwise would have this generator report the
  // `publish: "staging-only"` design as a defect — which it did for `fsh-guts`
  // the moment the split above started working, and a report that flags an
  // intended state as a finding is the same disease as one that hides a real
  // gap. It is STATED rather than dropped: silence would make "deliberately
  // withheld" indistinguishable from "nobody looked".
  const stagingOnly = unlinked.filter((k) => declaredFor(k, true) !== undefined);
  const rest = unlinked.filter((k) => !stagingOnly.includes(k));
  const undiscovered = rest.filter((k) => declaredFor(k, false) !== undefined);
  const unbuilt = rest.filter((k) => declaredFor(k, false) === undefined);

  if (stagingOnly.length > 0) {
    findings.push(
      `${decl.name}: ${stagingOnly.length} graph(s) declare a staging-only viewer, deliberately ` +
        `not linked on the canonical deploy — ${stagingOnly.join(", ")}. Not a gap.`,
    );
  }

  if (unbuilt.length > 0) {
    /* A RENDER-EXEMPT INSTANCE IS NOT MISSING ANYTHING, and this finding said
     * it was. Bean `sbck`, third done-when.
     *
     * bootstrap declares `renderExemption.of: ["visualiser", ...]` — the
     * owner's 2026-09-20 ruling that the bottom of the stack renders nothing
     * — and this line went on reporting four graphs as gaps against it, which
     * is the state the bean names: "reported as gaps against a layer that is
     * exempt from exactly that, which reads as noise and trains readers to
     * ignore it."
     *
     * `isExemptFrom` is the predicate that already exists for this, and its
     * own doc comment says so: *"the predicate the `2krx` axis calls before
     * raising a no-visualiser finding, so the exemption is read from the
     * declaration rather than from a hardcoded instance name."* This file
     * IMPORTS it and used it for `footer` while the finding twenty lines away
     * did not — one file, two answers to "is this instance excused".
     *
     * STATED, NEVER DROPPED. `2krx` is that an opt-out without a reason per
     * entry becomes a silence list, so the kinds are still named and the
     * exemption's `owes` is named with them: a reader sees what is unrendered
     * AND what the layer carries instead, which is the whole bargain the
     * exemption struck. Same shape as `staging-only` above, for the same
     * reason — an intended state reported as a defect is the same disease as
     * a real gap hidden.
     */
    if (isExemptFrom(decl, "visualiser")) {
      findings.push(
        `${decl.name}: ${unbuilt.length} graph(s) render no viewer — ${unbuilt.join(", ")} — ` +
          `under a declared \`renderExemption\`. Not a gap: it owes ${decl.renderExemption?.owes}`,
      );
    } else {
      findings.push(
        `${decl.name}: declares ${unbuilt.length} graph(s) with no published viewer — ` +
          `${unbuilt.join(", ")}. Declared and not rendered is a gap, not a dead link.`,
      );
    }
  }
  if (undiscovered.length > 0) {
    findings.push(
      `${decl.name}: ${undiscovered.length} graph(s) have a declared viewer that exists but is ` +
        `not at a conventional path, so no tile links it — ` +
        `${undiscovered.map((k) => `${k} (${declaredFor(k, false)})`).join(", ")}. ` +
        `Built and unreachable is a different gap from unbuilt.`,
    );
  }

  // READ-ONLY IS STATED WHETHER OR NOT A VIEWER EXISTS, and that separation is
  // the whole point of the two greys.
  //
  // Every read-only kind in this repository today ALSO lacks a viewer, so a
  // mark that rode the viewer list would render zero times — which is exactly
  // what happened on the first attempt: the mark shipped on the graph-tile
  // surface, `readOnly` is never populated there, and reading the staging
  // deploy found it on 0 of 3 pages. Live CSS, live JS, nothing to style.
  //
  // So the fact goes where it cannot be hidden by the gap. A reader told only
  // "catalogue: no published viewer" learns that nothing opens, and not that
  // what is behind it is frozen and needs a copy-out to work on.
  const frozen = visualisations.filter((v) => v.readOnly === true).map((v) => v.kind);
  if (frozen.length > 0) {
    findings.push(
      `${decl.name}: ${frozen.length} graph(s) hold materialized content and are READ-ONLY — ` +
        `${frozen.join(", ")}. Readable, not editable here: copy one out to your own ` +
        `folio/ to work on it. Separate from whether a viewer is published.`,
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
  // The SITE-DIR mount, not `folio` — see `publishedIcon`. `folio` is the
  // instance's front door, which for who-iris is its 1,378-file library.
  const siteMount = siteDirMount(decl, instanceDir, ownsSite || isRepoRoot);
  const iconSrc = icon ? publishedIcon(instanceDir, icon.src, siteMount) : undefined;
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

  // The instance's theme, from the sticky it contributes about ITSELF. A
  // contribution whose id is this instance is the instance talking about
  // itself, which is the same key `composeContributions` dedupes on.
  // THE INSTANCE'S OWN STICKY — and a card id is NOT the instance name.
  //
  // This matched `st.id === decl.name` and therefore found nothing for
  // `folio-assistant-core`, whose card id is `folio-assist-core`. That is not
  // a stale declaration: `landing-sticky.test.ts` pins the divergence
  // deliberately, because *"a card id is a published identifier on the landing
  // page and the directory is only where the files sit ... which is exactly
  // why it broke when they were assumed to be one string."* The exact
  // assumption, written here one file over, and it cost core its avatar while
  // its theme had been declared all along.
  //
  // THE SET IS ALREADY RIGHT: `decl.stickies` is what THIS instance
  // contributes, so its own card is in there whatever it is called. An exact
  // match still wins where one exists (cat-harness, bootstrap); a lone
  // contribution is taken as the instance's own; and several with no exact
  // match is REPORTED rather than picked from, because choosing by order would
  // make the avatar depend on declaration order.
  const contributed = decl.stickies ?? [];
  const exact = contributed.find((st) => st.id === decl.name);
  const ownSticky = exact ?? (contributed.length === 1 ? contributed[0] : undefined);
  if (exact === undefined && contributed.length > 1) {
    findings.push(
      `${decl.name}: contributes ${contributed.length} stickies and none carries its own name ` +
        `(${contributed.map((st) => st.id).join(", ")}), so which one is this instance's own card ` +
        `cannot be told — showing no theme avatar rather than picking by declaration order.`,
    );
  }
  const theme = ownSticky?.theme === undefined ? undefined : themeById(ownSticky.theme);
  if (ownSticky?.theme !== undefined && theme === undefined) {
    findings.push(
      `${decl.name}: its sticky names theme "${ownSticky.theme}", which is not installed — ` +
        `showing no theme avatar rather than a broken image.`,
    );
  }
  // OWN IMAGES FIRST, THE SITE OWNER'S SECOND — the overlay order this
  // repository uses everywhere else, and the one the theme docs describe: *"an
  // instance declaring its own `landing` images gets its own backdrop"*, with
  // the supplier as the fallback rather than the only answer.
  //
  // MEASURED, and it is why `bootstrap` had no avatar until now: it declares a
  // sticky naming `theme: bootstrap` and **zero images**, while `cat-harness`
  // declares the `landing-bootstrap` role. Resolving against `decl.images`
  // alone found nothing and reported a gap that was not one.
  // `gen-landing-data.ts` has always resolved a contributed sticky's art
  // against the site owner's images, so this is that join rather than a second
  // one — widened by the own-first step, which changes no existing answer
  // because no instance below the owner declares a landing role today.
  const ownCard = theme ? resolveThemeBackdrop(theme, decl.images).art.get("card") : undefined;
  const ownerCard =
    theme && ownCard === undefined && owner
      ? resolveThemeBackdrop(theme, owner.decl.images).art.get("card")
      : undefined;
  const card = ownCard ?? ownerCard;
  // THE PATH FOLLOWS THE SOURCE. An image declared by the site owner is
  // published under the SITE's own root, not under this instance's mount —
  // composing it from `folio` would point at a path the instance does not
  // serve, which is `68au` with the baseurl replaced by the wrong instance.
  const cardSrc = card
    ? ownCard !== undefined
      ? publishedIcon(instanceDir, card.src, siteMount)
      : publishedIcon(owner!.dir, card.src, "/")
    : undefined;
  const themeAvatar =
    card && cardSrc !== undefined
      ? {
          src: cardSrc,
          title: theme!.name,
          ...(card.avatarRegion ? { region: card.avatarRegion } : {}),
          // THE SAME CROP, SOLVED — for a consumer that cannot do arithmetic.
          //
          // `region` is the declaration and `navbar.ts`'s `mark()` solves it
          // itself for a mounted page. The Liquid sidebar cannot: dividing two
          // floats in a template is the kind of thing that silently yields an
          // integer. So the four CSS values are computed here, exactly as
          // `sync-docs-harness.ts` already does for the site title's avatar.
          //
          // Two fields from one declaration, both generated, neither authored
          // — which is why this is not the duplication `sjic` is about. The
          // sum has ONE home; only its output has two shapes.
          ...(card.avatarRegion ? { crop: solveCrop(card.avatarRegion) } : {}),
        }
      : undefined;
  if (card && card.avatarRegion === undefined) {
    // A card with no crop would render the whole 1254px composition in a 32px
    // frame — `603s` measured that and called it "grey mush". Reported rather
    // than rendered: an uncropped card is a declaration gap, not an avatar.
    findings.push(
      `${decl.name}: its theme's card art declares no avatarRegion, so the navbar has no ` +
        `crop to show — the whole card in a 2rem frame is unreadable. Declare one.`,
    );
  }

  // Resolved after both candidates exist. `icon` keeps its own field for
  // `mount-instance-docs.ts`, which builds a NavItem rather than reading this.
  const iconMark =
    iconSrc === undefined
      ? undefined
      : {
          src: iconSrc,
          title: icon?.title ?? "",
          ...(icon?.avatarRegion ? { crop: solveCrop(icon.avatarRegion) } : {}),
        };
  const navMark = themeAvatar ?? iconMark;

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
    // `avatarRegion` rides the ICON too, when the icon image declares one.
    // None does today; the THEME avatar below is where the declared crops
    // actually live. Kept because the two are different questions: an instance
    // may declare a mark that wants cropping without having a theme at all.
    icon:
      iconSrc === undefined
        ? null
        : {
            src: iconSrc,
            title: icon?.title ?? "",
            ...(icon?.avatarRegion ? { region: icon.avatarRegion } : {}),
          },
    // THE THEME AVATAR — *"use theme avatar not the purply thing"*.
    //
    // I reported on 2026-09-22 that the harness->card assignment "does not
    // exist". THAT WAS WRONG, and the correction matters because it was the
    // reason gap 6 was left unwired: the assignment is THEME-MEDIATED and has
    // been all along. An instance contributes a sticky, the sticky names a
    // `theme`, the theme names an `imageRole`, and the instance's own images
    // carry that role per layout. `resolveThemeBackdrop` is the join and it
    // already returns the DeclaredImage, so the `avatarRegion` `603s` measured
    // comes with it. Nothing new is invented here; a chain that existed is
    // read.
    //
    // THE CARD LAYOUT, because it is the square one — 1254x1254 — and
    // `KgImageSchema` refuses a non-square `avatarRegion` in PIXELS. A
    // landscape layout would carry a box that is square in fractions and not
    // in pixels, which is exactly the stretch that refusal exists to stop.
    ...(themeAvatar ? { avatar: themeAvatar } : {}),
    /**
     * THE MARK THE NAVBAR SHOWS, resolved once here rather than branched on in
     * a template.
     *
     * Theme avatar first, the instance's own `icon` second. The precedence is
     * the owner's — *"use theme avatar not the purply thing"* — and it is
     * decided HERE because the alternative is five branches of Liquid
     * (`avatar` with a crop, `avatar` without, `icon` with a crop, `icon`
     * without, initial) that would each have to agree about the order.
     *
     * The crop rides whichever source won, so an ICON may be cropped too:
     * `who-iris` declares the WHO emblem-and-wordmark at 581x178 and an
     * `avatarRegion` taking the leftmost square, which is the emblem. Before
     * this, a region on an icon was carried in the data and rendered by
     * nothing.
     */
    ...(navMark ? { mark: navMark } : {}),
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
  const ownerDecl = readDeclaration(harnessRoot);
  const handler = ownerDecl?.name;
  if (!handler) return [];
  const siteDir = join(harnessRoot, siteDirFor(harnessRoot));

  const tiles: HarnessTile[] = [];
  const decls: { dir: string; decl: CatHarnessDeclaration }[] = [];
  for (const dir of instanceDirs(repoRoot, names)) {
    const decl = readDeclaration(dir);
    if (!decl) continue;
    decls.push({ dir, decl });
  }

  // THE ICON ROW IS RESOLVED OVER THE WHOLE SET, not per tile, because
  // inheritance is a question about the OTHER instances. Owner: *"should be in
  // each harness config which are shown (so some could show none, but make
  // this default in cat-harness that is inherited)."*
  //
  // `handler` is the floor rather than a literal `"cat-harness"`: the
  // site-owning instance is whoever declares this site, and naming it here
  // would be the hardcoded-four-names failure `builtOn` was declared to end.
  const declaredIcons = new Map(decls.map(({ decl }) => [decl.name, decl.navbarIcons]));
  const needsOf = new Map(decls.map(({ decl }) => [decl.name, decl.needs]));

  for (const { dir, decl } of decls) {
    const tile = tileFor(
      decl,
      handler,
      siteDir,
      dir === harnessRoot,
      repoRoot,
      dir === repoRoot,
      dir,
      ownerDecl ? { decl: ownerDecl, dir: harnessRoot } : undefined,
    );
    const icons = resolveNavbarIcons(decl.name, declaredIcons, needsOf, handler);
    // UNDETERMINED IS NOT EMPTY, and the field is omitted rather than set to
    // `[]` so a consumer cannot read "nobody decided" as "show none". That is
    // the distinction `navbarIcons`' own docs are about, and collapsing it
    // here would undo it one layer down.
    if (icons !== undefined) tile.navbarIcons = [...icons];
    tiles.push(tile);
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
/**
 * A source path under the site directory, as the URL the built site serves it at.
 *
 * ## The defect this closes, measured rather than argued
 *
 * This was `replace(/index\.html$/, "")` inline — it handled the `.html` case
 * and silently passed a `.md` path through as if it were a URL. Owner,
 * 2026-09-22: *"fix the .md paths in the harness tabs too."*
 *
 * Swept with a HEAD request per link against a local build, 2026-09-22:
 * **3 of 31** distinct harness-tab links returned 404, and all three were the
 * `index.md` ones — `/processes/index.md`, `/tools/index.md`,
 * `/fsh-guts/index.md`. The other 28 were fine, so this is the whole of it and
 * not a sample.
 *
 * **The declaration was never wrong.** A `coverage` ref names a SOURCE FILE —
 * that is what `resolveCoveragePath` resolves it to, on disk. The bug was
 * treating a source path as a URL, which is a conversion with exactly one
 * correct home: here.
 *
 * ## The rules are Jekyll's, and they were verified, not assumed
 *
 * `_config.yml` sets **no** `permalink`, so Jekyll's default applies. Checked
 * against the built site rather than read off the documentation:
 *
 * | source | served at | measured |
 * |---|---|---|
 * | `processes/index.md` | `/processes/` | 200 |
 * | `tool-graph.md` | `/tool-graph.html` | 200 |
 * | `tool-graph.md` | ~~`/tool-graph/`~~ | **404** |
 *
 * So an `index` leaf addresses as its directory and every other page addresses
 * as itself with an `.html` extension. The second row is why this does not
 * simply strip `.md`: that would have produced `/tool-graph/`, which is a 404
 * this repository would have shipped in place of the one it had.
 *
 * **If a `permalink` is ever set, this becomes wrong** — and it will be wrong
 * silently, because a 404 behind a tab looks like a broken site rather than a
 * stale rule. The test pins the three cases above; a `permalink` added to
 * `_config.yml` should send somebody here.
 */
/**
 * A declared crop, solved into the four values CSS wants.
 *
 * The image is scaled by `1/w` and `1/h` and then offset by `-x` and `-y` OF
 * THE SCALED image, which is why the offsets divide by the same fractions.
 * `navbar.ts`'s `mark()` does the identical sum for a mounted page, and
 * `sync-docs-harness.ts` for the site title.
 *
 * SOLVED IN TYPESCRIPT because the consumer is Liquid, which cannot be trusted
 * to divide two floats without quietly producing an integer.
 */
function solveCrop(r: { x: number; y: number; w: number; h: number }): {
  width: number;
  height: number;
  left: number;
  top: number;
} {
  return {
    width: +(100 / r.w).toFixed(4),
    height: +(100 / r.h).toFixed(4),
    left: +((-100 * r.x) / r.w).toFixed(4),
    top: +((-100 * r.y) / r.h).toFixed(4),
  };
}

export function publishedUrlOf(relPathUnderSite: string): string {
  const withoutIndex = relPathUnderSite.replace(/(^|\/)index\.(html|md)$/, "$1");
  // Only a LEAF page is rewritten. A path already ending in `/` is a
  // directory and addresses as itself.
  return `/${withoutIndex.replace(/\.md$/, ".html")}`;
}

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
