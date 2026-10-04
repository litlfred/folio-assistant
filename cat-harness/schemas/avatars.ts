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

import { defaultGraphKinds } from "./graph-kind-registry";

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
  // SMART-BASE — THE SAME WHO BLUE, AND FOR THE SAME REASON. Owner,
  // 2026-09-23: *"smart-base avatar: use who-iris route, WHO blue no logo"*,
  // taking the route this instance's exemption had named as open and
  // preferable rather than leaving it exempt.
  //
  // TONE 199 IS SHARED WITH `who-iris` ON PURPOSE, not by oversight. It is
  // measured from the same #0093D5 — the organisation's own blue — and these
  // are two instances of the SAME organisation's material. A reader scanning
  // the navbar should see them as a family; giving smart-base a near-miss hue
  // would assert a distinction that does not exist. The registry requires
  // distinct GLYPHS, not distinct tones, and that is the right constraint:
  // the glyph says which instance, the tone says whose.
  //
  // And no emblem, which is the whole of "the who-iris route": an
  // organisation's published colour with a neutral glyph is not inventing its
  // identity, where cropping its logo would be.
  "smart-base": {
    // A broad base with three narrowing courses above it — the layer the rest
    // of the stack rests on. smart-base is exactly that: `fhir-harness` sits
    // under it, and `smart-ig` (and the IGs that need it) is built on top,
    // so the glyph reads the instance's position rather than its subject.
    glyph: "M3 18h18M6 14h12M9 10h6M11 6h2",
    tone: 199,
    reads: "a broad base under narrowing courses — the layer the SMART stack rests on, in WHO blue",
  },
  "who-iris": {
    // An open book with a band across it — a repository of published
    // documents, which is what IRIS is. The FALLBACK mark since 2026-10-04:
    // the owner restored the WHO emblem as who-iris's declared `icon`
    // (bean `2vpn`), which `harness-tiles.ts` prefers; this glyph draws only
    // where the emblem cannot. It was the mark itself from 2026-09-23, when
    // the owner asked for the colour without the logo.
    glyph: "M4 6h6a2 2 0 012 2v10a2 2 0 00-2-2H4zM20 6h-6a2 2 0 00-2 2v10a2 2 0 012-2h6zM4 6v10M20 6v10",
    tone: 199,
    reads: "an open book — a repository of published documents, in WHO blue",
  },
  // ── The instances that had NO mark, 2026-10-04 (bean `2vpn`) ───────────
  //
  // Owner: *"all needs to be consistent and consolidated"*, then, offered a
  // glyph per instance, chose *"Glyphs I propose"*. Until these, each drew its
  // LETTER in the navbar — the floor for a harness with no mark. A `-tools`
  // instance takes its parent's tone on purpose: `kind-register` reads a
  // shared tone as a family colour, and that is what a tools layer is.
  "smart-ig": {
    // A page with a folded corner and lines — an implementation guide.
    glyph: "M6 3h9l3 3v15H6zM15 3v3h3M9 11h6M9 15h6",
    tone: 229,
    reads: "a published guide page — the IG built on the SMART base",
  },
  "smart-immunizations": {
    // A syringe: plunger, barrel, needle.
    glyph: "M18 3l3 3M16 5l3 3M17.5 6.5L9 15l-3 1 1-3 8.5-8.5M10 10l4 4M6 18l-3 3",
    tone: 352,
    reads: "a syringe — the immunization guide",
  },
  "folio-assistant-sci": {
    // A conical flask with a fill line — the scientific-paper profile.
    glyph: "M9 3h6M10 3v6l-5 9a2 2 0 002 3h10a2 2 0 002-3l-5-9V3M7 15h10",
    tone: 56,
    reads: "a laboratory flask — folios that are scientific papers",
  },
  "fhir-harness": {
    // A flame, for FHIR's own pun on its name.
    glyph: "M12 3c1 4 5 6 5 11a5 5 0 01-10 0c0-3 2-4 2-7 1 1 2 2 3 4 0-3 0-5 0-8z",
    tone: 10,
    reads: "a flame — the FHIR implementation-guide harness",
  },
  "cat-openapi": {
    // A pair of braces — an interface described as data.
    glyph: "M9 4c-2 0-3 1-3 3v2c0 1-1 2-2 3 1 1 2 2 2 3v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1 1 2 2 3-1 1-2 2-2 3v2c0 2-1 3-3 3",
    tone: 76,
    reads: "braces — an API described as data",
  },
  "cat-harness-tools": {
    // A wrench — what implements the harness's tool definitions.
    glyph: "M14.5 5.5a4 4 0 005 5L11 19a2.1 2.1 0 01-3-3l8.5-8.5a4 4 0 01-2-2zM8.5 16.5h.01",
    tone: 268,
    reads: "a wrench, in cat-harness's colour — the code that implements its tools",
  },
  "bootstrap-tools": {
    // A trowel — the tool that plants bootstrap's seed.
    glyph: "M12 3v9M8 12h8l-1 5a3 3 0 01-6 0z",
    tone: 96,
    reads: "a trowel, in bootstrap's colour — the code that implements bootstrap's tools",
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
  policies: {
    // A shield with a tick: what is permitted, and to whom. ODRL policies,
    // issue #1180.
    glyph: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zm-3.5 9l2.5 2.5 4.5-4.5",
    tone: 304,
    reads: "a shield with a tick — what each Actor is permitted to do",
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
  // THE QUEUE FEEDING A TRAIN. Three queued items on the left converging into
  // one line that carries on right — the queue's whole shape in one glyph: the
  // decisions are per pull request, the train they feed is one. Deliberately
  // NOT a list: a list would read as the store, and what this kind records is
  // an ORDER somebody decided (bean `hfag`).
  "merge-queue": {
    glyph: "M5 7h5M5 12h5M5 17h5M10 7q4 0 4 5M10 17q4 0 4-5M10 12h9",
    tone: 205,
    reads: "three queued items converging into one line — a queue feeding a train",
  },
  // A NOTE pinned to a bean: the bean's outline with a slip beside it, because
  // a note is an addendum to a bean and never a bean of its own (bean `m61r`).
  "bean-notes": {
    glyph: "M8 5c4 0 6 3 6 7s-2 7-6 7c2-3 2-4 2-7s0-4-2-7zM16 8h4v8h-4zM17 11h2M17 13h2",
    tone: 40,
    reads: "a bean with a slip of paper beside it — an addendum, not a second item",
  },
  // A SURVEY of a commit window. Two endpoint marks with a span between them,
  // because the two edge commits ARE the artefact: a survey whose window
  // cannot be pinned tells a reader nothing about today (bean `6ptx`).
  "session-survey": {
    glyph: "M5 12h14M5 9v6M19 9v6M9 5h6",
    tone: 168,
    reads: "a span between two marked endpoints — the window a survey covers",
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
  attestations: {
    glyph: "M6 3h12v18H6zM9 8h6M9 12h6M10 17l2 2 3-4",
    tone: 28,
    reads: "a signed sheet — a judgement somebody recorded, kept apart from what a script derives",
  },

  "qa-checkers": {
    // A magnifier over a tick: code that judges content against a criterion.
    // Bean riit, step 3b.
    glyph: "M10 4a6 6 0 1 1 0 12a6 6 0 0 1 0-12zM14.5 14.5L20 20M7.5 10l2 2 3.5-3.5",
    tone: 96,
    reads: "a magnifier over a tick — a QA checker, declared by the harness whose code it is",
  },
  "pipeline-plugins": {
    // A plug entering a socket: an implementation filling a generic slot.
    // Bean riit, step 3b.
    glyph: "M4 12h6M10 8h4v8h-4zM14 10h3M14 14h3M17 7v10h3",
    tone: 300,
    reads: "a plug in a socket — a pipeline slot filled by the harness that owns the code",
  },
  "block-kinds": {
    // Three stacked blocks with a tag on the top one: each kind a node,
    // labelled by its prefix. Bean riit, step 2.
    glyph: "M5 15h14v4H5zM5 10h14v4H5zM5 5h9v4H5zM16 5l3 2-3 2",
    tone: 32,
    reads: "stacked blocks, the top one tagged — block kinds, each declared by the harness that owns it",
  },
  validators: {
    // A check mark inside a shield: code that judges a node, declared as a node.
    // Bean riit.
    glyph: "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM8.5 12.5l2.5 2.5 4.5-5M12 3v2",
    tone: 132,
    reads: "a shield with a tick — a validator, declared by the harness whose code it is",
  },
  kinds: {
    // A stack of three cards, the top one tagged: a graph whose nodes are the
    // KINDS of the other graphs. Bean dmx1.
    glyph: "M5 8h12v11H5zM7 5h12v11M9 2h12v11M8 12h6M8 15h4",
    tone: 300,
    reads: "a stack of type cards — the graph kinds a harness declares it owns",
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
  // A SEALED ENVELOPE with a pin through its corner: somebody else's
  // declaration, received and kept unopened at the commit it was pinned to.
  // Not `external-schema`'s two volumes — that is a specification we read and
  // apply; this is a snapshot we hold and never edit. `tone: 216` is unused and
  // sits between `external-schema`'s 208 and `uml`'s 220, all three being
  // about the shape of something defined elsewhere.
  "substrate-snapshot": {
    glyph: "M3 7h14v11H3zM3 7l7 6 7-6M17 4l4 4M19 6l-3 3",
    tone: 216,
    reads: "a sealed envelope, pinned — another Knowledge Graph's declaration, kept byte for byte at the commit it was subscribed at",
  },
  // A LIST OF ENTRIES, each a short code tag beside a longer line: a code and
  // what it means, which is the whole of a code list. Deliberately not the
  // glossary's book — a book is looked up; a code list is CHOSEN from, closed,
  // and every entry carries its definition. `tone: 180` is unused and sits
  // between the reference tones and `external-schema`'s 208.
  "code-list": {
    glyph: "M4 6h3v2H4zM9 7h11M4 11h3v2H4zM9 12h11M4 16h3v2H4zM9 17h11",
    tone: 180,
    reads: "a closed list of codes, each beside its meaning — values chosen from, never free text",
  },
  // A CROSSWALK — a column of source rows, lines crossing to a column of
  // target rows. Bean `k74z`: one value carried into several vocabularies.
  // `tone: 120` was unused, and is far from `code-list`'s 180 so the two
  // "tables of codes" kinds are not confused at a glance.
  "vocab-mapping": {
    glyph: "M3 6h4M3 12h4M3 18h4M8 6l8 6M8 12l8-6M8 18h8M17 6h4M17 12h4M17 18h4",
    tone: 120,
    reads: "a crosswalk — source rows on the left, lines crossing to target rows on the right — one value carried into another vocabulary",
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
  // The harness's swimlane-role ledger, renamed from `glossary` on 2026-09-23:
  // three lanes with a tag on one, the terms a process's swimlanes define.
  "swimlane-glossary": {
    glyph: "M3 6h18M3 12h18M3 18h18M15 9h5v6h-5z",
    tone: 92,
    reads: "three swimlanes with a tag — the roles a process's lanes define",
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







  "binary-release": {
    // A sealed carton with its strap. Deliberately NOT the `uploads` arrow —
    // that is something arriving, and a release is something that WENT, under
    // a version, whether or not a byte of it was ever fetched here. The mark
    // stands for the record of the carton rather than the carton: the kind
    // holds a digest and a size and never the bytes.
    glyph: "M4 9l8-4 8 4v7l-8 4-8-4zM4 9l8 4m8-4l-8 4m0 0v7M8 7l8 4",
    tone: 24,
    reads: "a sealed carton with its strap — what shipped under a version, recorded by digest and size, never by its bytes",
  },
  "test-plan": {
    // A checklist of empty boxes: what must be shown, before anybody has run
    // it. Deliberately empty — a plan carries no verdicts, and a ticked box
    // would say it did.
    glyph: "M6 4h12v16H6zM8 8h2v2H8zM12 9h4M8 12h2v2H8zM12 13h4M8 16h2v2H8zM12 17h4",
    tone: 140,
    reads: "a checklist with its boxes empty — what a system must show, before any run",
  },
  "test-report": {
    // The same checklist with its boxes filled in, one ticked and one crossed:
    // the plan's form, completed by a run. Quotes `test-plan`'s glyph on
    // purpose, as `ig-metadata-index` quotes its sibling's.
    glyph: "M6 4h12v16H6zM8 8l1 1 2-2M12 9h4M8 12l2 2m0-2l-2 2M12 13h4M8 16l1 1 2-2M12 17h4",
    tone: 110,
    reads: "the plan's checklist filled in — one run's verdicts against one plan, never a tally across plans",
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
  "voice-vendors": {
    // The `voices` microphone with a small tag hung on it: the same voice,
    // specialised for one vendor. A sub-graph of `voices` (bean rkqp), so it
    // keeps the parent's outline and a nearby tone, as `proposals` does
    // under `docs`.
    glyph: "M10 4a3 3 0 013 3v4a3 3 0 01-6 0V7a3 3 0 013-3zM5 11a5 5 0 0010 0M10 16v4M16 6h5v5h-5zM18.5 8.5h.01",
    tone: 312,
    reads: "a microphone with a tag — an editorial voice specialised for one vendor",
  },
  "document-kinds": {
    // A page outline with ruled sections: a document kind is a STRUCTURE to
    // fill — the headings are fixed, the content is not. Distinct from
    // `docs`, which is written pages; this is the shape a page must take.
    glyph: "M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4",
    tone: 268,
    reads: "a page outline with its sections ruled in — a structure to fill, not a page written",
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
  "auto-docs": {
    // A page of BULLETED ENTRIES, not a page of prose. A sub-graph of `docs`
    // (bean `xsrv`), so it keeps that kind's folded-corner outline — the family
    // resemblance is the point, since these pages ARE docs pages — and then
    // says the one thing that distinguishes it: every line has a marker before
    // it, because an index is a list of other things rather than an argument.
    //
    // Deliberately NOT a gear or a refresh arrow, the obvious glyphs for
    // "generated". Those say how the page was made; the reader of a tile wants
    // to know what it IS. `docs` does not depict a writer either.
    glyph: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h.01M11.5 12h5M9 15h.01M11.5 15h5M9 18h.01M11.5 18h3",
    // 340, and the first choice of 164 was WRONG — found by rendering it beside
    // its siblings rather than by reading the table. 164 is green, and so is
    // `requirements` at 148, with 156 and 168 also taken: two page-shaped
    // glyphs in near-identical greens, told apart only by bullets against
    // ticks, which is not a distinction that survives tile size.
    //
    // 340 is the largest clearance left in the table — 20° from both 320 and
    // 0, where every other gap is 16° or less. Measured over the 45 distinct
    // tones in use, not estimated.
    tone: 340,
    reads: "a page of bulleted entries — an index of what another graph holds",
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

/**
 * A kind DECLARED as a node (bean dmx1) carries its own avatar, so this table
 * is not a second central registry for kinds it does not list.
 */
function declaredAvatar(kind: string): Avatar | undefined {
  return defaultGraphKinds.get(kind)?.avatar;
}

/** Has this kind got an avatar of its own? */
export function hasAvatar(kind: string): boolean {
  return Object.prototype.hasOwnProperty.call(AVATARS, kind) || declaredAvatar(kind) !== undefined;
}

/** The avatar for a kind, falling back to {@link GENERIC}. */
export function avatarFor(kind: string): Avatar {
  return AVATARS[kind] ?? declaredAvatar(kind) ?? GENERIC;
}

/** Every kind that has one: this table's, in declaration order, then the declared kinds'. */
export function avatarKinds(): string[] {
  const listed = Object.keys(AVATARS);
  return [...listed, ...defaultGraphKinds.names().filter((k) => !listed.includes(k) && declaredAvatar(k) !== undefined)];
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
