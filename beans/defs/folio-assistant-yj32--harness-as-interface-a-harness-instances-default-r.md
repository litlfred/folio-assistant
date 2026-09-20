---
# folio-assistant-yj32
title: 'HARNESS AS INTERFACE: a harness instance''s default rendering is LHS + docs/ + a themed folio board, and it is a KG-DS management system'
status: todo
type: epic
created_at: 2026-09-20T13:47:14Z
updated_at: 2026-09-20T13:47:14Z
---


Owner, 2026-09-20, verbatim — this is the largest architectural statement in
the session and paraphrasing it would lose the parts that constrain the design:

> these avatars should aslso be the default display background for their
> corresponding docs/ (ghpages) rendering, on which panels and folios and what
> not renders. kindof like the shared miro board background... the harness
> instnace displays docs and its miro board with the thematic background. thats
> a default rendefint of a harness isntanccs. LHS + docs/ = docuemnation
> pipleline renderign for ghpages/justthedoccs + folio/miro like board for
> accessing and authroiing/reviewing content,etc. managing pipeline w/ todos/
> beans/. it is a viusal represntation readable interace (and perhaps werirtable
> interface if wrtiable datastore). document this workflow and its subprcess as
> cat-harness following /enabling the publication review pocess. it is a KG-DS
> management system. tools add content visualation editing etc.

## What it says, unpacked

1. **A theme's avatar becomes the docs BACKGROUND**, not just its sticky's
   backdrop. `cat-harness` renders its docs on the grumpy-hoodie ground,
   `bootstrap` on the desert, `operations` on the construction site. The
   scrim work already done is what makes this legible — the ratios were
   measured over PURE BLACK precisely because arbitrary art sits behind.
2. **A harness instance has a DEFAULT RENDERING**, and it is one thing with two
   halves: the LHS nav plus `docs/` (the just-the-docs documentation pipeline)
   **and** a folio/Miro-like board for accessing, authoring and reviewing
   content, with `todos/` and `beans/` managing the pipeline.
3. **It is a readable interface, and perhaps a writable one** — "if wrtiable
   datastore" is a conditional, not a promise. Read-only is the floor.
4. **Document the workflow and its subprocesses as cat-harness**, following and
   enabling the publication review process. That means BPMN under the
   `cat-harness` graph, not prose.
5. **It is a KG-DS management system** — a knowledge-graph datastore management
   system. Tools add content visualisation, editing, and so on.

## This is the parent of four beans already open

Typed as an **epic** because it is the thing those four are parts of, and
designing them separately is how they end up disagreeing:

| bean | its part of this |
|---|---|
| `603s` | the LHS: one themed section per instance, dependency-ordered, collapsed = info, open = docs nav + that instance's declared display subgraphs |
| `6lb8` | the board itself: resizable, semantic zoom to avatars, always collapsible to linear just-the-docs |
| `pb04` | the affordances ON content in that board — edit and view, gated on the pipeline's GitHub capability |
| `7po1` | `workflows/state` owning the beans+todos skills, which is item 2's "managing pipeline w/ todos/ beans/" |

## What is already true, measured

- **Themes carry their art per layout with measured text regions** — seven
  backdrop roles, six complete (`landing-architecture` still lacks its mobile
  crop, which is the one thing stopping `check:theme-art:check` gating).
- **Scrims are measured over pure black**, 9.25–9.36:1, so art behind text is
  already an honest AAA case rather than a hope.
- **The board exists in embryo**: `.fa-landing-board` renders one card per
  instance, and `mountTodoBoard` now mounts the todo board INSIDE it.
- **`todos/` stickies already carry `editHref`** (`/edit/main/<path>`, composed
  at build time). Landing stickies do not. That asymmetry is `pb04`.

## Open questions, all the owner's

- **Where does the background live?** A theme's `backdrop` is currently a
  sticky-scoped concept. Making it the page ground is a different CSS surface
  (`body`, or a board element) and possibly a different crop set — a sticky's
  crop is chosen for a CARD, and a page is a different aspect entirely.
- **"perhaps writable if writable datastore"** — what IS the writable store?
  gh-pages is static. The artifact database, a local server, or a GitHub write
  path through the editor links are three different answers with three
  different security postures.
- **Which subgraphs are "display" subgraphs?** Every declared `graphs` entry,
  or an opt-in subset? `uploads` and `library` are declared and have no
  renderer today.
- **"KG-DS"** — confirm this expands to knowledge-graph datastore. It appears
  nowhere in the repository, and inventing an expansion for an acronym in a
  published document is how a wrong one becomes canon.

## Done when

- [ ] The workflow and its subprocesses exist as BPMN under the `cat-harness`
      graph, with `<folio:skill ref>` on every agent-lane activity, and they
      follow/enable the publication review process rather than sitting beside it.
- [ ] A harness instance renders its docs on its own theme's ground.
- [ ] The four child beans are designed against this rather than separately.

## Not started

Queued per the owner's standing instruction to queue rather than pivot.
