/**
 * How a GRAPH-TYPOLOGY row looks and is named in the navbar — one answer for the
 * rail on mounted pages and the Jekyll sidebar alike.
 *
 * @module scripts/lib/graph-typology-nav
 *
 * Bean `yag0`, folded into `v8n5` by the owner's ruling of 2026-09-30. On
 * 2026-09-23 the owner clicked who-iris's `docs` row meaning `library`. The two
 * rows sat adjacent, each a ONE-LETTER glyph (`D`, `L` — the kind's initial)
 * beside a bare kind word, and at rest the strip shows the glyphs only. The
 * initial is not even distinct across kinds: `catalogue` and `code` were both
 * `C`.
 *
 * So each kind row now gets, from sources that already exist rather than a
 * table written here:
 *
 *   - a **distinct glyph** — the kind's own SVG mark from `schemas/avatars.ts`,
 *     which already draws `library` as books on a shelf and `docs` as a page
 *     under a magnifier, and its **hue** from the same entry, so two adjacent
 *     rows differ in shape AND colour;
 *   - a **full accessible name** — the kind word, then the head of the kind's
 *     own `summary` from the graph-typology registry and the instance it belongs
 *     to (`library — L1 source content, who-iris`). The kind word stays the
 *     visible label, so the accessible name CONTAINS the visible one (WCAG SC
 *     2.5.3), and the words still carry the meaning without the colour (SC
 *     1.4.1, the `j66n` rule: a hue never removes the second channel).
 *
 * A kind with no registered avatar falls back to its initial, exactly as
 * before — the glyph is an improvement where one exists, never a new gap.
 */
import { avatarFor, hasAvatar } from "../../schemas/avatars.js";
import { defaultGraphTypologies } from "../../schemas/cat-harness.js";

/**
 * The first clause of a kind's registered summary — up to the first dash,
 * colon, semicolon or full stop — with code backticks removed. `undefined`
 * when the kind is not registered or has no summary.
 */
export function kindSummaryHead(kind: string): string | undefined {
  const summary = defaultGraphTypologies.get(kind)?.summary;
  if (!summary) return undefined;
  const head = summary.split(/\s+(?:—|--)\s+|[.:;](?:\s|$)/)[0]!.replace(/`/g, "").trim();
  return head === "" ? undefined : head;
}

/** What a graph-typology navbar row carries besides its href: mark, hue and description. */
export interface GraphTypologyRowDecor {
  icon?: string;
  glyphPath?: string;
  tone?: number;
  description?: string;
}

/**
 * The mark and accessible description for one kind's row.
 *
 * @param kind     the declared graph typology — also the row's visible label
 * @param instance the instance whose graph the row opens, named in the
 *                 description so two harnesses' `library` rows are told apart
 */
export function graphTypologyRowDecor(kind: string, instance?: string): GraphTypologyRowDecor {
  const head = kindSummaryHead(kind);
  const description = [head, instance].filter((x): x is string => Boolean(x)).join(", ");
  const mark: GraphTypologyRowDecor = hasAvatar(kind)
    ? { glyphPath: avatarFor(kind).glyph, tone: avatarFor(kind).tone }
    : { icon: kind.slice(0, 1).toUpperCase() };
  return { ...mark, ...(description ? { description } : {}) };
}
