/**
 * An avatar for every declared kind — in and out of the trash, in both
 * schemes.
 *
 * Owner, 2026-09-19: *"each content type should have an avatar in and out of
 * trash. dark and light mode"*, and then: *"all kinds need an avatary.
 * bootstrap has avatar, so does cat-harness, folio-asst, sticky/todo, etc."*
 *
 * ## The glyph is a MASK, not an image or an inline `<svg>`
 *
 * Each avatar is one path, served through `mask-image`, so the colour comes
 * from `background-color` — which means a scheme swap is a CSS custom
 * property and not a second set of assets. Two schemes times two trash
 * states times sixteen kinds would otherwise be 64 files to keep in step,
 * and the one that fell behind would be invisible until somebody looked at
 * it in the wrong mode.
 *
 * It also keeps the glyph out of JavaScript: `docs-ui.js` sets
 * `data-fa-kind` and the stylesheet does the rest, so the fan works with no
 * script at all.
 *
 * ## The trash state is DERIVED, and that is deliberate
 *
 * Not sixteen more drawings. An item in the trash is the same thing, discarded
 * — so it is the same glyph, muted, under the crumple overlay that
 * `d1r6` already established as the discard mark. Drawing each one twice
 * would let the pair drift, and a "discarded proposal" that looked like a
 * different object than a "proposal" would be saying something false.
 *
 * What that costs: trash coverage is automatic, so the QA axis cannot find a
 * missing trash cell. It checks the thing that CAN be missing — a kind with
 * no glyph — and asserts the derivation exists rather than pretending to
 * measure it. A criterion that cannot fail is worse than no criterion,
 * because it reads as coverage.
 *
 * ## `kind` is open, so there is a fallback and it is reported
 *
 * `BASE_GRAPH_KINDS` is an open registry and `fsh-guts` node kinds are open
 * by design. An unknown kind gets {@link GENERIC} and shows up as a QA
 * finding — never as a blank, which is the third-state rule applied to art.
 *
 * @module schemas/avatars
 * @graphNode schema
 */

/**
 * One avatar.
 *
 * `tone` is a HUE ANGLE, not a colour. The stylesheet builds both schemes
 * from it — a light surface and a dark one — so a kind cannot be legible in
 * one mode and invisible in the other, which is the `y8cm` / `rptk` failure
 * this repo already carries twice.
 */
export interface Avatar {
  /** SVG path data, drawn in a 24×24 box. */
  glyph: string;
  /** Hue angle in degrees, 0–359. */
  tone: number;
  /** Why this mark, for the next person deciding whether to change it. */
  reads: string;
}

/** Drawn in a 24×24 viewBox. Kept simple: these render at 20–28px. */
export const AVATARS: Readonly<Record<string, Avatar>> = {
  // ── The layer identities the owner named ───────────────────────────
  //
  // Owner: *"bootstrap has avatar, so does cat-harness, folio-asst"*. Two of
  // these three are NOT graph kinds this repo declares — the split (#223) has
  // not happened, so `bootstrap` and `folio-assist-core` exist as layers in
  // the namespace and as nothing in `harness.json`.
  //
  // They are here anyway, and `check-avatar-coverage` reports them as
  // `avatar-has-kind` findings rather than pruning them. Drawing art for a
  // layer before its directory exists is the right way round: the alternative
  // is a split that lands with three blank avatars, discovered by a reader.
  // The finding is the honest record that they are ahead of the declaration.
  bootstrap: {
    // A seed with a shoot: the graph an agent reads before it knows anything.
    glyph: "M12 21c0-5 0-7 0-9m0 0c-3 0-5-2-5-5 3 0 5 2 5 5zm0 0c3 0 5-2 5-5-3 0-5 2-5 5z",
    tone: 96,
    reads: "a seed germinating — the first thing, before anything else is known",
  },
  "cat-harness": {
    // Cat ears over a frame. The harness, and the repo's own joke.
    glyph: "M4 9V6l3 2h10l3-2v3m0 0v9H4V9zM8 13h.01M16 13h.01M10 17h4",
    tone: 268,
    reads: "a framed face with ears — the harness the instance is held in",
  },
  "folio-assist-core": {
    glyph: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5",
    tone: 212,
    reads: "a leaf of paper with lines — the folio itself",
  },

  // THE ONE RENDERABLE KIND, and the one this whole platform exists for.
  //
  // Registered by `schemas/folio-graph-kind.ts` ON IMPORT rather than sitting
  // in `BASE_GRAPH_KINDS`, which is why it was missing from the first draft
  // of this registry and why `check-avatar-coverage` now seeds from the base
  // table explicitly: a check that reads only the live registry reports a
  // clean run whenever the module that registers a kind was not imported.
  folio: {
    glyph: "M4 5h7v14H4zM13 5h7v14h-7zM11 5v14M7 9h1M16 9h1",
    tone: 224,
    reads: "an open folio, two leaves — the authored content itself",
  },

  // ── Stores and graphs ──────────────────────────────────────────────
  beans: {
    glyph: "M9 5c4 0 7 3 7 7s-3 7-7 7c2-3 3-4 3-7s-1-4-3-7z",
    tone: 28,
    reads: "a single bean, kidney-shaped — one item of the work plan",
  },
  "bean-defs": {
    glyph: "M9 5c4 0 7 3 7 7s-3 7-7 7c2-3 3-4 3-7s-1-4-3-7zM4 9h2M4 15h2",
    tone: 28,
    reads: "a bean with margin rules — the definitions rather than the store",
  },
  "workflow-state": {
    glyph: "M5 7h5v5H5zM14 12h5v5h-5zM10 9h4v6",
    tone: 188,
    reads: "two boxes and a flow between them, with a token part-way",
  },
  todos: {
    glyph: "M5 4h11l3 3v13H5zM16 4v3h3M8 12l2 2 4-4",
    tone: 48,
    reads: "a sticky with a tick",
  },
  "todo-items": {
    glyph: "M5 4h11l3 3v13H5zM16 4v3h3M8 11h7M8 15h4",
    tone: 48,
    reads: "a sticky with lines — the items rather than the board",
  },
  "todo-feedback": {
    glyph: "M4 6h16v9H9l-4 4v-4H4zM9 10h6",
    tone: 320,
    reads: "a speech bubble — a remark about the work, not the work",
  },
  tools: {
    glyph: "M14 4a4 4 0 00-5 5l-5 5 2 2 5-5a4 4 0 005-5l-2 2-2-2 2-2z",
    tone: 250,
    reads: "a spanner — a Tool definition, the thing that does the work",
  },
  schemas: {
    glyph: "M12 3l8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4",
    tone: 156,
    reads: "stacked layers — a shape things conform to",
  },
  qa: {
    glyph: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4",
    tone: 140,
    reads: "a shield with a tick — a verdict about an artefact",
  },
  health: {
    glyph: "M3 13h4l2-5 3 10 2-6 2 3h5",
    tone: 4,
    reads: "a trace — the repository's own vital signs, over time",
  },
  uploads: {
    glyph: "M12 17V5m0 0l-4 4m4-4l4 4M5 19h14",
    tone: 200,
    reads: "an arrow onto a line — something arriving",
  },
  library: {
    glyph: "M5 4h4v16H5zM11 4h3v16h-3zM16 5l3 15-2 .4L14 5.4z",
    tone: 36,
    reads: "books on a shelf — what was read, not what was written",
  },
  voices: {
    glyph: "M12 4a3 3 0 013 3v4a3 3 0 01-6 0V7a3 3 0 013-3zM7 11a5 5 0 0010 0M12 16v4",
    tone: 292,
    reads: "a microphone — an editorial voice",
  },
  "translation-sources": {
    glyph: "M4 6h7M7 6v2c0 3-1 5-3 6M6 10c1 3 3 4 5 5M13 19l4-10 4 10M15 16h5",
    tone: 176,
    reads: "a glyph and an A — one language against another",
  },
  docs: {
    // The one renderable kind the harness owns. Distinct from `folio`, which is
    // core's: the difference is the SUBJECT, not the format, so the glyph is a
    // page WITH a magnifier over it — documentation ABOUT something — rather
    // than a plain page, which would read as "any content".
    glyph: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h4",
    tone: 212,
    reads: "a page with a folded corner — documentation about the graph itself",
  },
  "fsh-guts": {
    // The trashcan itself is a kind. Distinct from the trash STATE below.
    glyph: "M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13M11 11v6M14 11v6",
    tone: 16,
    reads: "a bin — the trashcan that is kept, as a kind in its own right",
  },
};

/**
 * What an unknown kind gets.
 *
 * A question mark rather than a blank or a generic dot, because the point is
 * that the viewer does NOT know what this is. A neutral shape would read as
 * a deliberate choice; this reads as a gap, which is what it is.
 */
export const GENERIC: Avatar = {
  glyph: "M9 9a3 3 0 114 3v2m0 3h.01",
  tone: 0,
  reads: "a question mark — no avatar is declared for this kind",
};

/** Has this kind got an avatar of its own? */
export function hasAvatar(kind: string): boolean {
  return Object.prototype.hasOwnProperty.call(AVATARS, kind);
}

/** The avatar for a kind, falling back to {@link GENERIC}. */
export function avatarFor(kind: string): Avatar {
  return AVATARS[kind] ?? GENERIC;
}

/** Every kind that has one, in declaration order. */
export function avatarKinds(): string[] {
  return Object.keys(AVATARS);
}

/**
 * The crumple overlay for the trash state — `d1r6`'s discard mark.
 *
 * ONE overlay over every kind, rather than a second drawing per kind. See
 * the module header: a discarded proposal must read as a proposal that was
 * discarded, not as a different object.
 */
export const TRASH_OVERLAY =
  "M6 8l4 4-3 2 5 3M15 9l-2 3 4 1";
