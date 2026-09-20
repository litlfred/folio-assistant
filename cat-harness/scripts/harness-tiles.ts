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
 * `cat-bootstrap/harness.json` carries a `renderExemption` whose reason says
 * it in those words — *"cat-bootstrap IS the navbar footer"* — so the ordering
 * reads {@link isExemptFrom}`(decl, "visualiser")` rather than testing for the
 * string `cat-bootstrap`. A checker that names one instance states a rule true
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
import { join } from "node:path";

import { GENERIC, avatarFor, hasAvatar } from "../schemas/avatars.js";
import { flattenDependencies } from "./dependency-order.js";
import {
  type CatHarnessDeclaration,
  isExemptFrom,
  readDeclaration,
  siteDirFor,
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
  description: string;
  /**
   * Exempt from owing a visualiser — the declared reason cat-bootstrap sorts
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

/** `docs/assets/x.svg` → `/assets/x.svg`, matching `sync-docs-harness`. */
function siteRelative(src: string, siteDir: string): string {
  const prefix = `${siteDir}/`;
  return src.startsWith(prefix) ? `/${src.slice(prefix.length)}` : src;
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

/** Every `harness.json` in the tree: the repository root and one level down. */
function instanceDirs(repoRoot: string, names: readonly string[]): string[] {
  const out: string[] = [];
  if (existsSync(join(repoRoot, "harness.json"))) out.push(repoRoot);
  for (const name of names) {
    const dir = join(repoRoot, name);
    if (dir !== repoRoot && existsSync(join(dir, "harness.json"))) out.push(dir);
  }
  return out;
}

function tileFor(
  decl: CatHarnessDeclaration,
  handler: string,
  siteDir: string,
  ownsSite: boolean,
): HarnessTile {
  const dirs = decl.directories ?? [];
  const kinds = [...new Set(dirs.flatMap((d) => d.graphs ?? []))].sort();
  const findings: string[] = [];

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
    if (found) visualisations.push({ kind, path: found });
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
    const declared = d.coverage?.visualiser;
    if (declared && !existsSync(join(siteDir, "..", "..", declared))) {
      findings.push(
        `${decl.name}/${d.id}: declares visualiser "${declared}", which does not resolve on disk.`,
      );
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

  return {
    name: decl.name,
    title: decl.title ?? decl.name,
    description: decl.description ?? "",
    footer: isExemptFrom(decl, "visualiser"),
    ...(decl.needs ? { needs: decl.needs } : {}),
    icon: icon ? { src: siteRelative(icon.src, siteDir), title: icon.title ?? "" } : null,
    tone: avatar.tone,
    reads: avatar.reads,
    genericAvatar: !own,
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
    tiles.push(tileFor(decl, handler, siteDir, dir === harnessRoot));
  }

  return orderTiles(tiles);
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
 * `cat-bootstrap`'s footer position is read from its declared exemption
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
  return floorLast([...unplaced, ...stack]);
}

/**
 * The declared floor goes last, whatever the dependency graph said.
 *
 * TWO RULES THAT AGREE TODAY, kept as two on purpose. The dependency order
 * puts `cat-bootstrap` last because it is what everything sits on; its own
 * `renderExemption` puts it last because *"cat-bootstrap IS the navbar
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
