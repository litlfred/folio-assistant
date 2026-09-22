---
# folio-assistant-yj32
title: 'HARNESS AS INTERFACE: a harness instance''s default rendering is LHS + docs/ + a themed folio board, and it is a KG-DS management system'
status: todo
type: epic
priority: normal
created_at: 2026-09-20T13:47:14Z
updated_at: 2026-09-20T18:48:38Z
parent: folio-assistant-p5wm
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
- ~~**"perhaps writable if writable datastore"** — what IS the writable store?~~
  **ANSWERED 2026-09-20, and the question was malformed.** The owner:

  > when agentic harness has access to githbu repo, that is onen write
  > path/tool. or it could use github api/oauth as another tool, or github
  > connector (e.g. on claude). depends on agent capavbilities and permissions.

  **There is no "the" write path.** There are several TOOLS, and which one a
  session may use is decided by its **capabilities** and its **permissions** —
  which is machinery this repository already has, rather than a new design:

  | tool | capability | what distinguishes it |
  |---|---|---|
  | commit from a checkout | `git-push` | holds a working tree; reach is what the filesystem allows |
  | forge HTTP API | `github-api` *(declared this session)* | no working tree; reach is what the credential was granted |
  | host connector | `github-connector` *(declared this session)* | no credential of its own; reach is what the connector was granted, knowable only by trying |

  `git-push` and `git-read` were already declared. The other two were not, and
  are now — with the detection method each can honestly support: `env-var` for
  the credential, `mcp-probe` for the connector. **Neither probe answers "may I
  write"**; that is a permission on the actor, and a session can hold the
  capability and still be refused. Conflating the two is the mistake the
  role-model skill already warns about — a capability is what the ENVIRONMENT
  provides, a permission is what the ACTOR may do.

  **What this unblocks:** `v1hw`, `jbx2`, `ivfw` and `5y4b`'s render half were
  all waiting on "which write path". They should not choose one. They should
  ask which write tool is available and degrade when none is — which is what
  `CapabilityRef`'s degradation strategies are for. A read-only surface is the
  floor, exactly as the epic's own "*readable, and perhaps writable*" says.
- **Which subgraphs are "display" subgraphs?** Every declared `graphs` entry,
  or an opt-in subset? `uploads` and `library` are declared and have no
  renderer today.
- ~~**"KG-DS"** — confirm this expands to knowledge-graph datastore. It appears
  nowhere in the repository~~ **ANSWERED, and the second half was wrong.**

  The owner confirmed **Knowledge Graph Data Store**, and pointed at the
  sibling that already carries it: `bootstrap/scenarios/roles.json`
  declares a role with exactly that id and title. So the term was in the
  repository all along — only the ACRONYM was absent, and I searched for the
  acronym. Searching for the abbreviation and concluding the concept is
  missing is the mistake to avoid repeating; the concept had a declared
  node.

  **And it names its machine: git.** The role's own description —

  > A git repository, reached either through the git CLI or through a forge's
  > API. It is where a declaration and its graph are READ from and where a new
  > instance's declaration is WRITTEN to. It is `actedUpon`: it holds and
  > serves, and takes no part in deciding what should happen.

  `actorKinds: ["system"]`, `skills: []`, `actedUpon: true`. That bears
  directly on the "what is the writable datastore?" question above: **git is
  the store**, and the role is deliberately skill-less because it decides
  nothing. A design that gave the datastore a skill would be claiming it
  participates in the decision.

## Done when

- [ ] The workflow and its subprocesses exist as BPMN under the `cat-harness`
      graph, with `<folio:skill ref>` on every agent-lane activity, and they
      follow/enable the publication review process rather than sitting beside it.
- [ ] A harness instance renders its docs on its own theme's ground.
- [ ] The four child beans are designed against this rather than separately.

## Not started

Queued per the owner's standing instruction to queue rather than pivot.

---

_2026-09-20, the owner, extending this:_

> after bootsrap, (put in docs) think of each harnmess as add schematics to KG,
> buidling visualtions for it, describeing tools to use/manage it. so each
> harness needs docs/ library/ uploads/ and folio/
>
> with folio/ being your active workspace. you can do things like publish,
> manage process etc from there. each harness has its functions, they defint and
> manage themselves as part of rendering pipeline, etc.
>
> the folio page may have its own theme. but default to dynamic choose layout
> based on display /usability using three mobile/laptop/square as "best" fit.

## What this adds to the epic

**A harness has a JOB, stated in three verbs:** it adds schematics to the KG,
builds visualisations for them, and describes the tools to use and manage them.
That is what makes the four directories a *model* rather than a convention:

| directory | its part of the job |
|---|---|
| `uploads/` | what arrives |
| `library/` | what has been ingested — L1, the thing references resolve through |
| `folio/` | **the active workspace** — publish and manage process from here |
| `docs/` | what is published about it |

**`folio/` as a workspace is the load-bearing change.** It is currently
"authored content of this instance, rendered to a website". Making it the place
you *act* from — publish, manage process — is a different thing from a place you
author, and it is what connects this epic to `v49e` (the workflow view) and
`6lb8` (the board).

**And `qmjh` already encodes half of it.** All four are classified `reproduce`,
so a dependent instance materialises its own — the four-directory model is
already what a new folio gets. `folio-assist-core` declares none of them today,
which the navbar stub shows as three "NOT DECLARED" rows.

## Layout: dynamic by default, a declared theme as the override

> the folio page may have its own theme. but default to dynamic choose layout
> based on display /usability using three mobile/laptop/square as "best" fit.

This is the sticky `shape` rule promoted to the page. It already exists in
embryo and its shortcomings are measured: `shapeFor` picks from content weight
against a threshold of 450, and all three current cards exceed it, so the
"square by default" rule never fires. Rendering at thresholds 450 / 600 / 1600
and measuring clipped text gave 0/32/0, 0/32/57 and 96/127/57 — squaring CLIPS
content.

So "best fit" must be measured against **legibility**, not just aspect: the
existing chooser reads content weight and ignores whether the result overflows.
A page-level version that repeats that would look responsive and cut text off.

## Also from this message, beaned separately

- `2krx` — every declared subgraph needs a visualiser, a documentation entry
  and a governing skill; **19 of this instance's 22 have none**.
- `jbx2` — `library/` visualisation.
- `v49e` — the workflow view, where todos and beans sit in the BPMN/DMN.

## A navbar stub exists

Built over the real declarations and themes, with `who-iris` stubbed as a
declared-but-not-materialised instance, `bootstrap` as the footer, and
local-vs-remote shown per directory. It is a picture to react to, wired to
nothing — the epic's open questions are unanswered and building against a guess
would be the expensive kind of progress.

## OPEN, and deliberately uninterpreted — owner, 2026-09-20

> i wanted bootstrap/ harness/ etc as todos, not landing page info

Said while looking at the live landing page, where each harness renders as a
large informational card — scope, RTFM links, *"The documentation you will
never read"* — with the todo stickies in a separate section below.

**No reading is recorded here on purpose.** Four were put to the owner and the
question was dismissed pending a further instruction, so writing down a
best guess would turn "not yet decided" into "decided", which is the failure
this bean's own KG-DS entry already cost once. The statement is preserved
exactly as given; the next session takes it from the owner, not from here.

What IS settled and can be relied on: the todo board mounts INSIDE the landing
board (`mountTodoBoard`, `docs-ui.js:2020`) by an earlier owner instruction —
*"i want todo board inside of the landing folio/board"* — so whatever the
answer, harness cards and todo stickies already share one surface. `5y4b`
(todo stickies carry theme art) is independent of the answer and can proceed.
