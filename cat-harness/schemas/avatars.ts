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
  // Owner: *"bootstrap has avatar, so does cat-harness, folio-asst"*.
  //
  // THIS TABLE SERVES TWO KEY SPACES, and the entries below are the second
  // one. `kind-fan` and `gen-avatars-css` key by GRAPH KIND; `harness-tiles`
  // calls `avatarFor(decl.name)` — an INSTANCE's declared name. Most entries
  // are kinds; these three are instances, which is why `check-avatar-coverage`
  // reports them as "an avatar for a kind this instance does not declare" and
  // will go on doing so. That finding is correct about the kind axis and says
  // nothing about the instance axis, which nothing currently checks. Bean
  // `4kj4` is where instance coverage belongs; it is not this table's to
  // assert.
  //
  // THE COMMENT HERE WAS STALE AND COST THE INSTANCE ITS FACE. It read: *"the
  // split (#223) has not happened, so `bootstrap` and `folio-assist-core`
  // exist as layers in the namespace and as nothing in `harness.json`"*. Both
  // halves were false by 2026-09-21 — `bootstrap/harness.json` and
  // `folio-assistant-core/harness.json` both exist and both declare a `name`
  // — and the second is not even the name that was adopted. Measured on
  // 2026-09-21: `avatarFor("folio-assistant-core")` returned GENERIC, the
  // question mark that means "no avatar is declared for this", while the leaf
  // of paper below sat in the table under a spelling nothing carries. A key
  // nobody can reach is worse than a missing one: the coverage check counted
  // it as declared. Bean `hso8`, whose rename this completes.
  "bootstrap": {
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
  // WHO BLUE, AND NO EMBLEM. Owner, 2026-09-23: *"no logo on who-iris icon
  // (for now). just WHO blue"* — reversing their own choice of 2026-09-22,
  // which had the WHO emblem-and-wordmark cropped to the emblem. The image
  // stays declared in `who-iris.json`; only the `icon` pointer to it is gone,
  // so restoring it is one field rather than a re-ingest.
  //
  // 199 is MEASURED from #0093D5, the organisation's blue as `who-iris.json`
  // already records it: rgb(0,147,213), max channel blue, so the hue is
  // 4 + (0-147)/213 sixths of a turn = 198.6°, rounded. Written as an angle
  // rather than as the hex because that is what this table holds and what the
  // stylesheet builds both schemes from — a literal colour here would be
  // legible in one mode and not the other, which is the `y8cm` failure.
  //
  // Without this entry `avatarFor("who-iris")` falls to GENERIC, so the tile
  // would have taken the generic hue and reported a finding — "no avatar
  // declared" is true of an instance nobody has decided about, and this one
  // has been decided about twice.
  "who-iris": {
    // An open book with a band across it — a repository of published
    // documents, which is what IRIS is. Deliberately NOT the emblem: the
    // owner asked for the colour without the logo.
    glyph: "M4 6h6a2 2 0 012 2v10a2 2 0 00-2-2H4zM20 6h-6a2 2 0 00-2 2v10a2 2 0 012-2h6zM4 6v10M20 6v10",
    tone: 199,
    reads: "an open book — a repository of published documents, in WHO blue",
  },
  // ── The three kinds split out of `cat-harness`, 2026-09-21 ──────────────
  //
  // TONES NEAR THE PARENT'S 268 ON PURPOSE. These are the parts of one graph,
  // and a reader scanning a legend should see them as a family rather than as
  // three unrelated kinds that happen to sit together. Far enough apart to
  // tell the three from each other; close enough that none reads as belonging
  // somewhere else.
  skills: {
    // An open book. A Skill is an instruction body, and nothing else here is.
    glyph: "M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zm16 0h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z",
    tone: 256,
    reads: "an open book — the instruction an Actor performs a Task from",
  },
  processes: {
    // Two nodes and a gateway between them: the smallest honest BPMN.
    glyph: "M4 12h4m4 0h4m4 0h.01M6 12a2 2 0 11-4 0 2 2 0 014 0zm14 0a2 2 0 11-4 0 2 2 0 014 0zM12 9l3 3-3 3-3-3z",
    tone: 280,
    reads: "two nodes either side of a diamond — a process and the decision in it",
  },
  scenarios: {
    // Two figures. A Role is a part somebody plays, so the glyph is people
    // rather than a document.
    glyph: "M9 11a3 3 0 100-6 3 3 0 000 6zm0 0c-2.5 0-4 1.5-4 4v4h8v-4c0-2.5-1.5-4-4-4zm8-6a2.5 2.5 0 110 5M17 12c2 0 3 1.5 3 3v4h-3",
    tone: 292,
    reads: "two figures — the Actors and the Roles they take on",
  },
  // THE ROOT INSTANCE, and it had no entry until 2026-09-22 — bean `zc7m`.
  //
  // Owner, reporting it: *"folio assistant icon is messed up still. I want
  // theme like in avaatars"*. It was the GENERIC question mark, which is what
  // `avatarFor` returns for a name nothing declares, and the table's own
  // header has carried the instruction the whole time: *"bootstrap has
  // avatar, so does cat-harness, folio-asst"*. Two of those three were here.
  //
  // TONE 236, between `folio` (224) and `tools` (250), and deliberately near
  // `folio-assistant-core`'s 212 — the same reasoning the three kinds below
  // `cat-harness` are given: these are parts of one graph and a reader
  // scanning a legend should see them as a family. Far enough to tell apart,
  // close enough that neither reads as belonging somewhere else.
  //
  // THE GLYPH IS THE CORE'S LEAF, HELD. `folio-assistant-core` is the leaf of
  // paper; the root instance is what holds one, so this is that leaf inside a
  // frame rather than a second unrelated mark. An instance and its core
  // drawn as two unrelated things would be the same drift the tones avoid.
  "folio-assistant": {
    glyph: "M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2zM8 7h5l3 3v7H8zM13 7v3h3",
    tone: 236,
    reads: "a leaf of paper held in a frame — the folio, and the instance that holds it",
  },
  // Keyed on the DECLARED NAME, which is `folio-assistant-core` — directory
  // and name both spelled in full, per the owner's ruling of 2026-09-20 and
  // as `folio-assistant-core/harness.json` records against itself.
  "folio-assistant-core": {
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
  // THE BOARD AND ITS LAYOUT. Two glyphs because they are two kinds, and the
  // pair says the split: a frame with cards ON it, and the same frame with the
  // cards' POSITIONS marked. A reader who sees them side by side should be
  // able to guess which is the semantic model and which is the interchange.
  boards: {
    // a frame with two cards on it — a diagram OF a folio
    glyph: "M3 5h18v14H3zM7 9h4v6H7zM14 9h3v3h-3z",
    tone: 205,
    reads: "a framed board carrying two cards — a diagram of a folio",
  },
  "board-positions": {
    // the same frame, with crosshairs where the cards go — where, not what
    glyph: "M3 5h18v14H3zM9 12h.01M15 10h.01M9 9v6M15 7v6M6 12h6M12 10h6",
    tone: 205,
    reads: "a board marked with positions — where each note was drawn",
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
  "review-verdicts": {
    glyph: "M5 4h14v16H5zM8 12l3 3 5-6",
    tone: 200,
    reads: "a page with a tick — somebody read this version and judged it",
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
  // A fork in a path: two ways onward, one taken. Methodologies are PARALLEL
  // tracks selected by context, so the glyph shows the choice rather than a
  // procedure — a flowchart or a checklist would draw the wrong idea.
  methodology: {
    glyph: "M12 20V12m0 0L6 6m6 6l6-6M4 4h4m8 0h4",
    tone: 268,
    reads: "a fork in a path — parallel ways to a judgement, one chosen by context",
  },
  // A CHIP, because the subject is the machine rather than what it says. The
  // tempting glyph — a speech bubble, a globe — draws LANGUAGE, and this
  // graph is not about language: it is about which languages somebody has
  // checked a given model is good at. A globe here would read as the
  // translation pipeline, which is a different kind two rows down.
  models: {
    glyph: "M8 8h8v8H8zM4 10h4M4 14h4M16 10h4M16 14h4M10 4v4M14 4v4M10 16v4M14 16v4",
    tone: 300,
    reads: "a chip with its pins — the machine an agent is running on, not what it says",
  },
  // An OPEN BOOK, and the choice is between two readings of "glossary". A tag
  // or a label would draw the `notation` — the code a term carries — which is
  // one field of a concept and not the thing itself. A book draws what a
  // reader does with it: looks a word up. `tone: 84` is unused and sits
  // between `qa`'s green verdict and `library`'s, which is right for a
  // reference rather than a judgement.
  "external-schema": {
    glyph: "M4 6h7v12H4zM13 6h7v12h-7zM11 9h2M11 12h2M11 15h2",
    tone: 208,
    reads: "two bound volumes with the ties between them — somebody else's specification, pinned to an edition, beside what we do with it",
  },
  // A CLASS BOX — a title compartment over an attribute compartment, with an
  // association line leaving it. The one glyph that says "a diagram of shapes"
  // rather than any shape in particular. `tone: 220` was unused, and sits beside
  // `external-schema`'s 208 because both are about the shape of things.
  uml: {
    glyph: "M3 4h9v12H3zM3 8h9M12 10h4M16 7h5v6h-5z",
    tone: 220,
    reads: "a class box with an association leaving it — a diagram of what the nodes are, derived and never drawn by hand",
  },
  glossary: {
    glyph: "M12 7v12M12 7C10 5 7 5 4 6v12c3-1 6-1 8 1M12 7c2-2 5-2 8-1v12c-3-1-6-1-8 1",
    tone: 84,
    reads: "an open book — terms somebody looks up, not terms a machine mints",
  },
  health: {
    glyph: "M3 13h4l2-5 3 10 2-6 2 3h5",
    tone: 4,
    reads: "a trace — the repository's own vital signs, over time",
  },
  // A clipboard with a tick and a cross: a run REPORTING on itself, carrying
  // both outcomes. Deliberately not the `qa` mark and not `health`'s trace —
  // the three are different subjects (an artefact, a repository, an execution)
  // and an avatar that borrowed either would say they are the same question.
  // Angle brackets around a caret: source, as the thing that is written rather
  // than the thing that runs. Deliberately not a terminal prompt or a gear --
  // both read as EXECUTION, and this kind is about code as authored content,
  // which is exactly the distinction `holds: "content"` records.
  code: {
    glyph: "M8 7l-5 5 5 5m8-10l5 5-5 5M13 5l-2 14",
    tone: 268,
    reads: "angle brackets around a slash — source as something written, not something running",
  },
  "qa-report": {
    glyph: "M9 4h6v3H9zM7 6h2m6 0h2a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1zm1.5 7l1.5 1.5L13 11m1 5l3 3m0-3l-3 3",
    tone: 168,
    reads: "a clipboard carrying a tick and a cross — one run's own account of what it did, both outcomes on the same sheet",
  },
  uploads: {
    glyph: "M12 17V5m0 0l-4 4m4-4l4 4M5 19h14",
    tone: 200,
    reads: "an arrow onto a line — something arriving",
  },
  catalogue: {
    // A card index: drawers of cards standing for things that are elsewhere.
    // Deliberately NOT books on a shelf — that is `library`, and the difference
    // between "we have it" and "we know of it" is the point of the kind.
    glyph: "M4 6h16v12H4zM4 10h16M10 6v12M13 13h4M13 15h3",
    tone: 258,
    reads: "a card index — what is known to exist, mostly not held",
  },
  "fhir-artifact-index": {
    // A card index with a braced tail: the `catalogue` drawer, plus the
    // JSON-Schema brace that is the whole reason this kind exists. It quotes
    // `catalogue`'s glyph deliberately — the two are siblings sharing a
    // materialisation model, and an unrelated mark would hide that.
    glyph: "M4 6h12v12H4zM4 10h12M10 6v12M19 7c-1 0-1 2-2 2 1 0 1 2 2 2",
    tone: 168,
    reads: "a card index with a schema brace — an IG's artefacts, known by canonical URL",
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
  themes: {
    // A paint swatch with a corner turned: a theme is a palette APPLIED to a
    // surface, not a palette on its own. Distinct from `voices`, which is also
    // a derived rule set — a voice governs what is SAID, a theme what it is
    // said ON.
    glyph: "M12 3a9 9 0 000 18h2a2 2 0 002-2 2 2 0 012-2h1a4 4 0 004-4 9 9 0 00-11-10zM8 9h.01M7 13h.01M11 7h.01",
    tone: 204,
    reads: "a paint palette — a surface dressed, not the words on it",
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
  proposals: {
    // A lightbulb over a page — an idea argued on paper, not yet agreed.
    // A sub-graph of `docs` (issue #1164), so it shares the page's outline.
    glyph: "M12 3a5 5 0 00-3 9v2h6v-2a5 5 0 00-3-9zM10 17h4M10.5 20h3",
    tone: 38,
    reads: "a lightbulb — an idea being argued, not yet a promise",
  },
  requirements: {
    // A page with two ticked lines — what was agreed, each line checkable.
    // A proposal is MOVED here when its feature ships (issue #1164).
    glyph: "M6 3h12v18H6zM9 8l1.5 1.5L13 7M9 14l1.5 1.5L13 13M15 8h1M15 14h1",
    tone: 148,
    reads: "a page of ticked lines — what the harness promises, each checkable",
  },
  interaction: {
    // A speech bubble with a tick inside — a preference that has been STATED,
    // so nobody has to ask again. The tick is the point: this file exists so
    // that re-asking is a defect (WCAG 2.2 SC 3.3.7, Redundant Entry), not a
    // courtesy skipped.
    glyph: "M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 4v-4a2 2 0 01-1-2zM8.5 10l2 2 4-4",
    tone: 224,
    reads: "a spoken preference, already recorded — do not ask again",
  },
  "issue-marks": {
    // A bookmark at a place in a list — how far this agent has read, and
    // nothing about what it read. Deliberately not a speech bubble: these
    // files hold an id and two timestamps, never a comment body, and a
    // comment glyph would promise a reader something the store does not have.
    glyph: "M7 4h10v16l-5-4-5 4zM4 8h2M4 12h2",
    tone: 28,
    reads: "a bookmark beside a list — how far an agent has read",
  },
  "session-state": {
    // A marker on a line, with the line continuing past it — where one actor
    // is RIGHT NOW, and still moving. Deliberately not a clock: a session is
    // a position, not a duration. Distinct from `memory`'s knot, which is
    // tied and does not move, and from `workflow-state`, which is one token
    // in one diagram rather than an actor across several.
    glyph: "M3 12h18M14 12a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0M18 9l3 3-3 3",
    tone: 64,
    reads: "a marker on a continuing line — where an actor is now",
  },
  memory: {
    // A knot tied in a thread — the oldest mnemonic there is, and the right
    // read for a kind that is fixed rather than accumulating: the knot is
    // already tied. Deliberately NOT a brain, which would say "the agent" and
    // this kind is what the agent CARRIES, not the agent.
    glyph: "M4 12h4m8 0h4M9.5 9.5a3 3 0 000 5M14.5 9.5a3 3 0 010 5M9.5 9.5c2 1 3 1 5 0M9.5 14.5c2-1 3-1 5 0",
    tone: 108,
    reads: "a knot in a thread — a fact tied down, read and not rewritten",
  },
  waiver: {
    // A key handed over, not a key held: the bow is drawn toward the reader.
    // Deliberately NOT a lock or a shield, which say "this is guarded" — a
    // waiver is the opposite act, a gate's owner giving the gate away. The
    // short tail says it opens ONE thing: the gate class it names, never
    // everything. Hue sits beside `memory`, because it is declared over the
    // same directory and a reader should see the kinship before the
    // difference.
    glyph: "M14 10a3 3 0 11-6 0 3 3 0 016 0M14 10h7M18 10v3M21 10v2",
    tone: 132,
    reads: "a key passed across — a confirmation given before it was asked for",
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
