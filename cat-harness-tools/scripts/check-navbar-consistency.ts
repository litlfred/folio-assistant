#!/usr/bin/env bun
/**
 * Is every harness's LHS navbar entry themed, and does one artefact wear one
 * glyph across the two surfaces that draw it?
 *
 * @module scripts/check-navbar-consistency
 * @covers none — its subjects are the `<instance>.json` DECLARATIONS and the
 * client that renders them, neither of which is a node in a declared graph.
 * `@covers themes` would be the bean `z6xd` defect: a gate naming a kind it
 * never resolves a directory of.
 *
 * The owner, 2026-09-30: *"i want QA check that each harness LHS navbar header
 * and menus are themed appropriately and has consitent layout/icon/navgation"*.
 *
 * ## The two questions, and why they are not one check
 *
 * A navbar entry gets its picture from one of **two unrelated namespaces**, and
 * conflating them is the mistake this module was written after making:
 *
 * 1. An instance's own `icon` is an **id into that instance's `images` list** —
 *    `sync-docs-harness.ts` resolves it with
 *    `decl.images?.find((i) => i.id === decl.icon)`, so it ends at an SVG file.
 * 2. A directory tile's `tile.icon` is a **name in the client's glyph
 *    registry** — `glyphFor` in `docs/assets/js/docs-ui.js` looks it up in
 *    `TILE_GLYPHS` and falls back to the net when it misses.
 *
 * So "the icon does not resolve" means two different failures with two
 * different repairs, and a check that reported them as one would send the
 * reader to the wrong file. They are separate families below.
 *
 * ## Why the FALLBACK is not a finding, and the tile that takes it is
 *
 * `glyphFor` falling back is deliberate and its docblock defends it: a folio
 * may name a glyph a slightly older platform has not got, and a tile that
 * vanished over that would turn a cosmetic mismatch into a missing navigation
 * entry. So this never grades the fallback.
 *
 * What it grades is a tile name declared **in this repository** against **this
 * repository's** registry. That is not the cross-version case the fallback
 * exists for: it is a name with no drawing, here, now, and the consequence is
 * two different artefacts wearing one picture — which is what the owner
 * reported and what `ob3m` finding 11 measured on a render (18 of 20 tiles
 * drawing the identical outline path).
 *
 * ## Two registries draw the same ids, so they can disagree
 *
 * `ROW_GLYPHS` (the navbar row, in `navbar-row.js`) and `TILE_GLYPHS` (the
 * glass tile panel, in `docs-ui.js`) are separate literals. `ROW_GLYPHS`'s own comment insists on
 * **five distinct drawings** because *"a row where four slots are
 * indistinguishable is a row that says nothing"* — an argument that applies
 * verbatim to the panel and is not enforced there. Where an id appears in both,
 * the two must name the same glyph constant, or one artefact has two pictures
 * depending on which surface you opened.
 *
 * ## Not a second answer to either navbar gate already here
 *
 * Two sibling gates touch the navbar, and this asks neither of their
 * questions. Checked by reading them, 2026-09-30, after `bun run gates`
 * surfaced both — a hand-picked check list had hidden them:
 *
 * | gate | its question | bean |
 * |---|---|---|
 * | `navbar:geometry:check` | do the WIDTHS agree between `lib/navbar-geometry.ts` and the stylesheet rendered from it | `sjic` |
 * | `check:viewer-nav` | WHICH PAGES carry a nav rail at all, gated on regressions only | `edx7` |
 * | this | are the ICONS registered, and do the registry and the instance declaration AGREE | — |
 *
 * Geometry, presence, iconography. They come apart in every direction: a
 * navbar can be the right width with an unregistered icon, a page can be
 * railed with no icon at all, and an icon can be registered on a page that
 * carries no rail. So none subsumes another, and a reader who finds one
 * should not conclude the other two are covered.
 *
 * This paragraph exists because "a second answer to the same question, free
 * to disagree with the first" is the defect this repository names most often,
 * and a gate that has not said which question it is answering leaves the next
 * author to guess.
 *
 * ## Could-not-determine is never green (bean `dh4f`)
 *
 * If either registry literal cannot be located, this **refuses** rather than
 * reporting the families clean. A check blind on its own input has not cleared
 * anything, and a zero it prints in that state is indistinguishable from a pass.
 *
 * Exit codes: 0 report only, or `--check` with no blocking finding · 1
 * `--check` (or `--strict`) with one · 2 could not determine, which includes
 * a declaration that will not load.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  instanceRootsIn,
  readDeclaration,
  siteDirFor,
} from "../../cat-harness/schemas/cat-harness.js";
import { KIND_TILE_ICONS } from "../../cat-harness/scripts/graph-tiles.js";

/**
 * The client that owns both glyph registries, resolved through `siteDirFor`
 * rather than spelled out.
 *
 * It was written `join("cat-harness", "docs", "assets", "js", "docs-ui.js")`,
 * which `check:site-root` rejected: **the output site root is one answer, and a
 * literal is a second one free to disagree.** The declaration owns where a
 * site is written; a script that hardcodes it keeps working right up until an
 * instance moves its `siteDir`, and then reads an absent file — which this
 * check would report as a refusal over a client that had simply relocated.
 *
 * The client belongs to the instance that ships the harness UI, so the root is
 * asked for by name rather than guessed from the scan order.
 */
const CLIENT_INSTANCE = "cat-harness";
const CLIENT_TAIL = join("assets", "js", "docs-ui.js");

/**
 * One `var NAME = { a: A_GLYPH, b: B_GLYPH };` literal, as id -> constant name.
 *
 * Deliberately a text scan and not an import: the file is a browser IIFE with
 * no exports, so there is nothing to import, and evaluating it needs a DOM.
 * The scan is narrow on purpose — a single `var <NAME> = {` through its first
 * `}` — so a shape it does not recognise reads as ABSENT and refuses, rather
 * than as an empty registry that would pass every family below.
 */
function registry(src: string, name: string): Map<string, string> | undefined {
  const open = src.indexOf(`var ${name} = {`);
  if (open < 0) return undefined;
  const close = src.indexOf("}", open);
  if (close < 0) return undefined;
  const body = src.slice(open + `var ${name} = {`.length, close);

  const out = new Map<string, string>();
  for (const m of body.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)/g)) {
    out.set(m[1], m[2]);
  }
  return out.size > 0 ? out : undefined;
}

/** An instance's declared navbar art, as the two namespaces see it. */
interface InstanceArt {
  readonly instance: string;
  /** Root-level `icon`, an id into `images`. */
  readonly icon?: string;
  /** Ids actually present in `images`. */
  readonly imageIds: readonly string[];
  /** Every `directories[].tile.icon`, a glyph-registry name. */
  readonly tileIcons: readonly string[];
  /**
   * Directories declaring a `tile` AT ALL — the denominator `tileIcons` is a
   * numerator of. A tile with no `icon` calls `glyphFor(undefined)` and takes
   * the fallback, so this is how many could name a glyph and how many do.
   */
  readonly tilesDeclared: number;
  /** Tile ids with no `icon`, so sharing the fallback drawing. */
  readonly tilesOnFallback: readonly string[];
  /**
   * Directories this instance declares with graph kind `themes`.
   *
   * The field is **`graphKinds`** and not `graphs`, which cost three wrong
   * measurements in the session that wrote this: a plausible key name read
   * `0 of 20` over a corpus where the answer is 1. Read the declaration, never
   * guess its spelling.
   */
  readonly themeDirs: readonly string[];
}

/**
 * `undefined` when this directory declares nothing; **throws** when it declares
 * something unreadable, which the caller turns into a refusal rather than a
 * finding. An instance whose declaration will not load is one this check cannot
 * judge, and judging the other sixteen and printing a clean verdict would be
 * the `dh4f` defect — a sweep blind on one subject has not cleared the rest.
 */
function artOf(repoRoot: string, root: string): InstanceArt | undefined {
  const decl = readDeclaration(root);
  if (decl === undefined) return undefined;

  const d = decl as unknown as {
    name?: string;
    icon?: string;
    images?: { id?: string }[];
    directories?: { id?: string; path?: string; graphKinds?: string[]; tile?: { icon?: string } }[];
  };

  const tiles = (d.directories ?? []).filter((x) => typeof x.tile === "object" && x.tile !== null);

  return {
    instance: d.name ?? root.slice(repoRoot.length + 1),
    icon: typeof d.icon === "string" ? d.icon : undefined,
    imageIds: (d.images ?? []).flatMap((i) =>
      typeof i.id === "string" ? [i.id] : [],
    ),
    tileIcons: tiles.flatMap((x) =>
      typeof x.tile?.icon === "string" ? [x.tile.icon] : [],
    ),
    tilesDeclared: tiles.length,
    tilesOnFallback: tiles.flatMap((x) =>
      typeof x.tile?.icon === "string" ? [] : [x.id ?? "<no id>"],
    ),
    themeDirs: (d.directories ?? []).flatMap((x) =>
      (x.graphKinds ?? []).includes("themes") ? [x.path ?? x.id ?? "?"] : [],
    ),
  };
}

interface Finding {
  readonly family: string;
  readonly blocking: boolean;
  readonly subject: string;
  readonly detail: string;
}

function main(): number {
  const repoRoot = process.cwd();
  const check = process.argv.includes("--check");
  const strict = process.argv.includes("--strict");

  let client: string;
  try {
    // `siteDirFor` answers RELATIVE to the instance ("docs"), not absolute —
    // measured, after composing it as absolute first and getting the ROOT
    // instance's `docs/` instead of `cat-harness/docs/`.
    const instanceRoot = join(repoRoot, CLIENT_INSTANCE);
    client = join(instanceRoot, siteDirFor(instanceRoot), CLIENT_TAIL);
  } catch (e) {
    // The declaration would not load, so WHERE the client lives is unknown.
    // Refuse rather than fall back to a guessed path: a guess that happened to
    // exist would report the registries clean over a file this check was never
    // pointed at.
    console.error(`✗ cannot resolve ${CLIENT_INSTANCE}'s site directory:`);
    console.error(`  ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
    return 2;
  }

  const shown = client.startsWith(repoRoot) ? client.slice(repoRoot.length + 1) : client;

  let src: string;
  try {
    src = readFileSync(client, "utf8");
  } catch {
    console.error(`✗ could not read ${shown} — the glyph registries live there.`);
    console.error("  Could-not-determine is never green: refusing rather than");
    console.error("  reporting the glyph families clean over a file I did not read.");
    return 2;
  }

  // THE ROW'S REGISTRY IS IN `navbar-row.js`, beside the client (beans `lhvt`,
  // `9rq1`): the row is drawn on pages that never load `docs-ui.js`. Same
  // refusal when it cannot be read.
  const rowFile = join(dirname(client), "navbar-row.js");
  let rowSrc: string;
  try {
    rowSrc = readFileSync(rowFile, "utf8");
  } catch {
    console.error(`✗ could not read ${rowFile} — the row's glyph registry lives there.`);
    return 2;
  }
  const tiles = registry(src, "TILE_GLYPHS");
  const row = registry(rowSrc, "ROW_GLYPHS");
  if (tiles === undefined || row === undefined) {
    console.error(
      `✗ could not locate ${tiles === undefined ? "TILE_GLYPHS" : ""}` +
        `${tiles === undefined && row === undefined ? " and " : ""}` +
        `${row === undefined ? "ROW_GLYPHS" : ""} in ${shown}.`,
    );
    console.error("  Either the literal moved or its shape changed. A registry read");
    console.error("  as empty would pass every family below, so this refuses instead.");
    return 2;
  }

  const roots = instanceRootsIn(repoRoot);
  const art: InstanceArt[] = [];
  for (const r of roots) {
    try {
      const a = artOf(repoRoot, r);
      if (a !== undefined) art.push(a);
    } catch (e) {
      // A refusal, not a finding, and not a crash: the declaration is somebody
      // else's gate to fail (schema validation names the field and the value).
      // What this check owes the reader is that it did not silently judge the
      // rest and call the repository clean.
      console.error(`✗ cannot read the declaration in ${r}:`);
      console.error(`  ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
      console.error("  Refusing: schema validation owns this failure, and a");
      console.error("  verdict over the remaining instances would read as clean.");
      return 2;
    }
  }
  if (art.length === 0) {
    console.error("✗ no instance declaration read — refusing (see `instanceRootsIn`).");
    return 2;
  }

  const findings: Finding[] = [];

  // NO `dangling-instance-icon` FAMILY, and its absence is deliberate.
  //
  // A first draft had one: an `icon` naming no entry in `images`. It was dead
  // code. `readDeclaration` ALREADY throws on exactly that
  // (`schemas/cat-harness.ts`, the `ids.includes(parsed.data.icon)` guard), and
  // its message lists every declared id, which this one did not. So the family
  // could never fire, and had the schema ever stopped checking it, the version
  // here would have been the weaker of two answers to one question — free to
  // disagree with the schema about what a valid declaration is.
  //
  // The test that found it planted the defect and got the schema's error rather
  // than the finding. Reading the code would not have shown it.

  // Family 2 — art shipped and not pointed at. NOT blocking: whether an
  // instance WANTS a navbar mark is the owner's call, and an image may exist
  // for a landing page rather than for the rail. Reported because the gap
  // between "has art" and "wears it" is invisible from either file alone.
  for (const a of art) {
    if (a.icon === undefined && a.imageIds.length > 0) {
      findings.push({
        family: "art-declared-no-icon",
        blocking: false,
        subject: a.instance,
        detail: `${a.imageIds.length} image(s) declared, none named as \`icon\``,
      });
    }
  }

  // Family 3 — a tile name with no drawing in THIS repository's registry, so
  // it takes the fallback and shares a picture with every other miss.
  for (const a of art) {
    for (const name of a.tileIcons) {
      if (!tiles.has(name)) {
        findings.push({
          family: "unregistered-tile-icon",
          blocking: true,
          subject: `${a.instance}: tile.icon=${JSON.stringify(name)}`,
          detail: `absent from TILE_GLYPHS [${[...tiles.keys()].join(", ")}] — falls back`,
        });
      }
    }
  }

  // Family 3, for the KIND fallback — `graph-tiles.ts` gives an undeclared
  // tile its graph kind's icon, so a kind mapped to an undrawn name is the
  // same miss, made for every derived tile of that kind at once.
  for (const [kind, name] of Object.entries(KIND_TILE_ICONS)) {
    if (!tiles.has(name)) {
      findings.push({
        family: "unregistered-tile-icon",
        blocking: true,
        subject: `KIND_TILE_ICONS.${kind}=${JSON.stringify(name)}`,
        detail: `absent from TILE_GLYPHS [${[...tiles.keys()].join(", ")}] — falls back`,
      });
    }
  }

  // Family 3b — a tile that names no glyph, so it takes the fallback and is
  // indistinguishable from every other tile that did the same. ADVISORY: which
  // artefacts deserve their own drawing is an editorial call, and `glyphFor`'s
  // fallback is deliberate. What is NOT editorial is that nothing said how many
  // tiles were on it — `ob3m` finding 11 had to be measured by hand on a render.
  for (const a of art) {
    if (a.tilesOnFallback.length > 0) {
      findings.push({
        family: "tile-without-icon",
        blocking: false,
        subject: a.instance,
        detail:
          `${a.tilesOnFallback.length} of ${a.tilesDeclared} declared tile(s) name no ` +
          `icon, so they share the fallback: ${a.tilesOnFallback.join(", ")}`,
      });
    }
  }

  // Family 4 — one id, two surfaces, two pictures.
  const overlap = [...row.keys()].filter((id) => tiles.has(id));
  for (const id of overlap) {
    if (row.get(id) !== tiles.get(id)) {
      findings.push({
        family: "registry-disagreement",
        blocking: true,
        subject: id,
        detail: `ROW_GLYPHS says ${row.get(id)}, TILE_GLYPHS says ${tiles.get(id)}`,
      });
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const withIcon = art.filter(
    (a) => a.icon !== undefined && a.imageIds.includes(a.icon),
  ).length;

  console.log("Navbar consistency — instance icons and the two glyph registries\n");
  console.log(`  instances read              ${art.length}`);
  console.log(`  ...with a resolving icon    ${withIcon} of ${art.length}`);
  console.log(`  TILE_GLYPHS entries         ${tiles.size}`);
  console.log(`  ROW_GLYPHS entries          ${row.size}`);
  console.log(`  ids drawn by both           ${overlap.length}`);
  const tilesAll = art.reduce((n, a) => n + a.tilesDeclared, 0);
  const tilesNamed = art.reduce((n, a) => n + a.tileIcons.length, 0);
  console.log(`  declared tiles              ${tilesAll}`);
  console.log(`  ...naming a glyph           ${tilesNamed} of ${tilesAll}\n`);

  // NOT the same denominator as `ob3m` finding 11's "18 of 20", and conflating
  // them would be the defect this whole change exists to end. That 20 was
  // counted on a RENDER, where the panel also holds tiles derived from pages
  // rather than from `directories[].tile`. This number is the declaration-side
  // half: of the tiles an instance DECLARES, how many name a drawing. An e2e
  // assertion is what can count the rendered panel; a static check cannot see it.

  // EVERY count above carries its denominator, and the two registry sizes are
  // printed even when no family fires — because "0 disagreements" over an
  // overlap of 0 is not the same verdict as over an overlap of 6, and a reader
  // cannot tell them apart from the finding list alone.
  if (overlap.length === 0) {
    console.log("  NOTE: no id is drawn by both registries, so `registry-disagreement`");
    console.log("        swept an empty domain. That is not a clean result for it.\n");
  }

  const themed = art.filter((a) => a.themeDirs.length > 0);
  console.log(`  declaring a themes graph    ${themed.length} of ${art.length}` +
    (themed.length > 0 ? `  (${themed.map((a) => a.instance).join(", ")})` : ""));
  if (themed.length <= 1) {
    console.log("  NOTE: `v8n5`'s Done-when #2 — a surface must not fall back to the");
    console.log("        platform default for an instance that declares its own theme —");
    console.log("        is read over this set. At a set size of 1 there is nothing to");
    console.log("        COMPARE, so this reports the denominator and issues no verdict.");
    console.log("        The set is iterated rather than hardcoded, so instance #2 is");
    console.log("        covered the day it declares one.");
  }
  // And deliberately NO assertion about which theme may style a given surface.
  // PR #1584 left exactly that open for the owner: the board styles a card only
  // from `sticky`-kind themes, and who-iris owns a `webpage` and a
  // `publication` theme and no `sticky` one. Picking one here would answer a
  // question the owner held, which is not a check's to answer.
  console.log();

  const blocking = findings.filter((f) => f.blocking);
  const advisory = findings.filter((f) => !f.blocking);

  for (const group of [blocking, advisory]) {
    for (const f of group) {
      console.log(`  ${f.blocking ? "✗" : "·"} ${f.family}: ${f.subject}`);
      console.log(`      ${f.detail}`);
    }
  }
  if (findings.length > 0) console.log();

  if (blocking.length === 0 && advisory.length === 0) {
    console.log("✓ no finding — every declared icon resolves and the registries agree.");
  } else {
    console.log(
      `${blocking.length} blocking, ${advisory.length} advisory ` +
        `(advisory fails only under \`--strict\`).`,
    );
  }

  const fail = blocking.length > 0 || (strict && advisory.length > 0);
  return (check || strict) && fail ? 1 : 0;
}

// GUARDED so the module can be imported. Without this, a test importing an
// exported helper runs the CLI and exits the test runner — which is exactly
// what happened to `upload-names.test.ts`: the report printed and the run
// died with no tally. `if (import.meta.main)` is the idiom every other
// importable script here uses.
if (import.meta.main) process.exit(main());
