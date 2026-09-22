/**
 * The number a graph tile shows, DECLARED BY THE PROJECTION.
 *
 * ## Why this is declared and not computed
 *
 * `graph-tiles.ts` builds a tile from the DECLARATION and never from the
 * projection — `flh4`, where *"no projection at my path"* had been collapsed
 * into *"nothing renders this"*, two different facts. A badge has to read the
 * projection, so the split is restated rather than crossed: a tile's
 * EXISTENCE stays declaration-derived, and only its NUMBER is read from here.
 * A live projection with no declared visualiser is still a finding, not a
 * tile.
 *
 * The number itself is declared rather than inferred because **there is no
 * uniform entry count**. Measured across every projection this site published
 * on 2026-09-22:
 *
 * | projection | arrays it holds |
 * |---|---|
 * | `beans` | `items` 459, `findings` 7 |
 * | `library` | `entries` 8, `uploads` 28, `queues` 3 |
 * | `qa` | `families` 7, plus `files`, `unclassified`, `unreadable` |
 * | `schemas` | `roots` 5, `modules` 121, `decls` 842, `edges` 525 |
 * | `todos` | `items` 3 |
 * | `voices` | `directories` 4, `voices` 5 |
 *
 * `schemas` has four plausible answers and `library` three. Worse, `uploads`'
 * meaningful number is not an array length at all — it is WAITING, 20 of 28,
 * and that distinction is the whole of #836. A reader that picked an array by
 * name per graph would be a table of guesses: right the day it was written,
 * and silently wrong the first time a projection changed shape. Only the
 * generator knows which number is the one, so the generator says.
 *
 * ## KEYED BY DIRECTORY, because one projection can serve two tiles
 *
 * This is not a generalisation kept for later — it is the corpus today.
 * `uploads` and `library` are **two tiles over one dataset**: `flh4` settled
 * that the queue block lives in `assets/library/index.json`, *"since two
 * projections over it would be two answers to how many are queued"*, and
 * `gen-uploads-viz.ts` therefore publishes a viewer and no projection of its
 * own. So `assets/library/index.json` owes two different numbers — 8 entries
 * for the corpus tile and 20 waiting for the queue tile — and a single
 * `{count, unit}` per file could serve only one of them.
 *
 * A bare count would also have forced exactly the mistake the split exists to
 * prevent: whichever tile lost would have grown a second projection to hold
 * its number.
 *
 * ## `unit` is not decoration
 *
 * `8` on a tile is ambiguous in a way `8 entries` is not, and the ambiguity is
 * load-bearing here: `library` publishes 8 entries beside 28 uploads, so a
 * bare number on that tile is a number the reader cannot check. The unit is
 * also what reaches the accessible name.
 *
 * ## Absent is a THIRD STATE
 *
 * {@link readTileCounts} yields nothing for a projection that declares no
 * counts, declares malformed ones, or cannot be read — and **never `0`**. An
 * absent count and an empty graph are opposite facts, and `dh4f` is this
 * repository's name for scanning nothing and reporting it clean. Every
 * consumer must render the two differently; the UI does it by drawing no
 * badge at all.
 *
 * A malformed entry is dropped WITHOUT dropping its siblings, so one bad
 * declaration in a shared projection cannot silence the tile beside it.
 *
 * ## A badge is exactly as fresh as its projection, and that is the point
 *
 * The count is read from the projection, so it inherits whatever freshness the
 * projection has. That is the correct coupling rather than a weakness: the
 * badge and the page it opens read the SAME document, so they cannot disagree.
 * A tile that recomputed its own number would be a second answer, which is the
 * `flh4` defect arriving through the badge.
 *
 * It does mean a committed projection's lag shows on the tile. Measured
 * 2026-09-22: `beans/defs/` held 478 files while the committed
 * `assets/beans/index.json` projected 466. That projection is EXISTENCE-gated
 * on purpose — every session writes to `beans/`, so a content gate would go
 * red on a projection fresh on the branch and fresh on main and stale only
 * against their union (bean `d2kp`) — and `docs-site.yml` regenerates before
 * publishing, so a reader fetches the current number even while the committed
 * copy lags.
 *
 * The consequence for anyone checking a badge: a number read from a LOCAL
 * checkout is the committed projection's, not the site's. Compare against the
 * deployed page, or regenerate first.
 *
 * @graphNode schema
 * @module schemas/tile-count
 */

import { z } from "zod";

/** What a projection says about one tile's headline number. */
export interface TileCount {
  /** The headline number. `0` is a legitimate, meaningful value. */
  count: number;
  /**
   * What is being counted, as a noun the reader sees — `"entries"`,
   * `"beans"`, `"waiting"`. Pluralisation is the declarer's, because only it
   * knows whether its unit pluralises regularly.
   */
  unit: string;
}

/** The field a projection carries them in. One name, so a consumer needs no table. */
export const TILE_COUNT_FIELD = "tile" as const;

/**
 * Read a projection's declared counts as `directory id → count`.
 *
 * Deliberately total and deliberately silent: a projection is allowed not to
 * declare any, so an empty result is a normal answer rather than an error.
 * What it must never do is answer `0` for a question it could not read — see
 * the third-state note above.
 *
 * `count` is checked for finiteness rather than for `typeof === "number"`
 * alone, because `NaN` and `Infinity` are numbers and both would render as a
 * badge that means nothing. `unit` is required and must be non-blank: a bare
 * number is the ambiguity this field exists to remove, so a declaration that
 * omits the unit is malformed rather than partially usable.
 *
 * Own properties only. `hasOwnProperty` via `Object.prototype` rather than the
 * instance's, and `Object.keys` rather than `for…in`: `constructor` and
 * `toString` are inherited by every object literal, so a naive walk would mint
 * entries for directories nobody declared. The same trap `glyphFor` carries a
 * note about in `docs-ui.js`.
 */
export function readTileCounts(projection: unknown): Map<string, TileCount> {
  const out = new Map<string, TileCount>();
  if (typeof projection !== "object" || projection === null) return out;
  const raw = (projection as Record<string, unknown>)[TILE_COUNT_FIELD];
  if (typeof raw !== "object" || raw === null) return out;
  for (const id of Object.keys(raw as Record<string, unknown>)) {
    const entry = (raw as Record<string, unknown>)[id];
    if (typeof entry !== "object" || entry === null) continue;
    const { count, unit } = entry as Record<string, unknown>;
    if (typeof count !== "number" || !Number.isFinite(count)) continue;
    if (typeof unit !== "string" || unit.trim() === "") continue;
    out.set(id, { count, unit: unit.trim() });
  }
  return out;
}

/**
 * The value a generator embeds, for one or more directories.
 *
 * It exists so no generator spells the field name itself — the one place a
 * projection and its reader could disagree — and so the keyed shape is
 * obvious at the call site rather than being a nested literal.
 *
 * ```ts
 * ...tileCounts({ library: [entries.length, "entries"],
 *                 uploads: [waiting, "waiting"] })
 * ```
 */
export function tileCounts(
  byDirectory: Readonly<Record<string, readonly [number, string]>>,
): { tile: Record<string, TileCount> } {
  const tile: Record<string, TileCount> = {};
  for (const id of Object.keys(byDirectory)) {
    const [count, unit] = byDirectory[id]!;
    tile[id] = { count, unit };
  }
  return { [TILE_COUNT_FIELD]: tile };
}

/**
 * The field, for a projection schema that is `.strict()` — which every one of
 * them is, deliberately.
 *
 * Adding a field to a projection without declaring it here is not a cosmetic
 * omission: `todo-index`'s own guard is named *"an UNDECLARED field fails —
 * this is what was missing while three landed unnoticed"*, and it caught this
 * field on its first run. A projection's schema is what tells a consumer the
 * document is complete, so a field that publishes without being declared is a
 * field no consumer can rely on.
 *
 * `.optional()` because declaring a count is the projection's choice. A
 * required field would make the third state impossible to express: every
 * projection would have to claim a number, and the ones with nothing
 * meaningful to count would have to invent one.
 *
 * The record is open-keyed — a directory id is not a closed set, and a
 * projection may declare for a directory this schema has never heard of. The
 * VALUES are closed, which is where a malformed declaration actually hides.
 */
export const TileCountsSchema = z
  .record(
    z.string().min(1),
    z.object({ count: z.number().finite(), unit: z.string().min(1) }).strict(),
  )
  .optional();
