---
# folio-assistant-mggs
title: 'LANDING: the landing page is a sticky note, minted by bootstrap as its last act'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T05:11:45Z
updated_at: 2026-09-20T08:16:28Z
parent: folio-assistant-o3xy
---

## The ask, owner 2026-09-20 (verbatim)

> i want the landing page to be a sticky note. the sticky note is created
> dynamically on initailzation by cat-harness bootstrap (as last thing). it
> creates an empty folio (if none exists) and attaches to the folio a sticky
> note with grumpy cat background that:
>
> * adds content of the intiatized harness' description

**The bullet list has one item and reads as cut short.** Treated as possibly
incomplete rather than complete — asked, not assumed.

## Why this bean exists

`5oai`'s closing note named this work and deferred it explicitly:

> NOT in this bean and still open elsewhere: the landing page as a page-global
> ThemedTodo, and avatars on content nodes reusing `images[].role` — both were
> queued on this bean's notes but are composition work that depends on the
> anchor rather than being part of it. **They need their own bean if they are
> to be done.**

This is that bean, plus the part that is new today: **bootstrap creates it**.

## What exists already — measured 2026-09-20 on `claude/wonderful-gauss-7frcrw`

The anchor half is **built and merged**, and it was built for this consumer:

- `schemas/note-anchor.ts` — the three-state anchor (`block` / `page` / `none`),
  merged in PR #408. Its module docs cite this exact case as the settling
  argument: *"the landing page is to carry a page-global sticky, and the landing
  page has no block to point at."* So `page` is the state to use, and it exists.
- `schemas/themes.ts` — a **`grumpy-cat` theme already ships** (bean `iurf`,
  PR #405), with `LAYOUTS` covering laptop/mobile/card and the three-layout
  validity rule enforced.
- `CarriedNoteSchema` (`schemas/carried-note.ts`) → `TodoNodeSchema`
  (`schemas/todo.ts`) is the note type; `targetLabel` is live and exercised by
  `test/sticky-todos.e2e.ts`.
- `schemas/avatars.ts` exists.
- `scripts/init-folio.ts` (+ the `folio_init` MCP tool) is the empty-folio
  scaffolder, registered among the **generic** tools precisely because it runs
  before a folio has a content type.
- `bootstrap/workflows/initialize-harness.bpmn` — six activities, the last being
  `A_Install` ("Follow them, at…") into `End_Installed`. **"As last thing"
  lands here**, or as a fifth step in
  `folio-assistant/docs/bootstrap/initialization.md`, which today has four.

## The gap the ask exposes, and it is not where I expected

**`grumpy-cat` is palette-only.** `schemas/themes.ts` gives it
`surface / ink / edge / accent` and nothing else; `grep -n 'avatar\|image\|src'
schemas/theme.ts` returns two hits, both comments about `images[].layout`
vocabulary. So **`Theme` carries no backdrop image**, and "sticky note with
grumpy cat background" cannot be expressed today.

That matters because the owner already ruled on where the image belongs
(`5oai`, 2026-09-19): *"a note can hold the image as part of its theme."* So the
work is **`Theme` gains a backdrop**, not the note body gaining an image.

## The boundary this ask runs into

`AGENTS.md` and `folio-assistant/docs/bootstrap/initialization.md` both state
that **folio-assistant is the platform, not the content**, and that a folio
lives in a *separate* repository. `initialization.md` step 2 is stronger still:
*"Create the directories the declaration names, and **only** those."*
And this repo's own `harness.json` `_comment` says `folio/` **deliberately does
not exist here yet** (pre-split, issue #223).

So "it creates an empty folio (if none exists)" needs a reading before anything
is written. Three are available and they are not close together — see the
question put to the owner 2026-09-20.

## Two open PRs collide with this

- **#458** *bootstrap: a Logger, a log-message sub-process, and the
  already-initialized failure* — edits the same BPMN the new last activity goes
  into, and already owns the "already initialized" branch this needs.
- **#437** *Move the instance under `cat-harness/`, and give the two roots a
  name* — relocates the tree holding `_includes/landing.html`, the file this
  bean rewrites.

Per the owner's standing preference, rebase with merge and check whether either
simplifies this rather than duplicating it.

## Done when

- [ ] the "empty folio" reading is confirmed or corrected by the owner
- [ ] whether the bullet list was cut short is answered
- [ ] `Theme` carries a backdrop image, with the three-layout rule applying to
      it as it does to the rest of a theme, and a test that can actually fire
- [ ] `grumpy-cat` declares the cat artwork as its backdrop, reusing the
      existing `harness.json` `images[]` entries rather than a second vocabulary
- [ ] the landing description is a page-global note (`anchor: page`) rather than
      text composited over page chrome
- [ ] bootstrap creates it as its LAST act, expressed in the BPMN (an activity
      carrying `<folio:skill ref>`) and not only in prose
- [ ] the empty-folio-if-none-exists step is idempotent — a re-initialisation
      does not mint a second sticky (the `beans create` 14,688-duplicate lesson
      applied to a different store)
- [ ] accessibility holds: the description stays real selectable markdown, and
      contrast is measured against the backdrop rather than asserted
- [ ] `alox`'s open judgement items are re-checked, since this rewrites the
      surface they are about

## Not doing unless asked

Avatars on content nodes (`5oai`'s other deferred half) — adjacent, and its own
bean. Retokenising the remaining hardcoded colours in `docs-ui.css`.


_2026-09-20_ — OWNER RULING on the "empty folio" question, verbatim: **"cat-harness initaton craetes the folio/ (called by bootstrap). i want the grumpy cat moved out of bootstrap and into cat harness"**

This is a LAYER statement, the same shape `iurf` established and the owner accepted there ("only comes in cat-harness, not bootstrap" = a layer, not a directory). Two halves:

1. **Who creates `folio/`** — cat-harness initiation, which bootstrap *calls*. Bootstrap hands off; it does not itself create a folio. So the new step belongs in `folio-assistant/docs/bootstrap/initialization.md` (today four steps, becoming five) and in the cat-harness side of the process, NOT in `bootstrap/workflows/initialize-harness.bpmn` whose last activity `A_Install` is precisely the hand-off.
2. **Where the grumpy cat lives** — the cat-harness layer. A bare bootstrap instance gets NO cat and no sticky.

MEASURED, and it changes what "moved" means: **there is no grumpy cat in `bootstrap/` today.** `grep -rin "grumpy\|cat-mark\|landing" bootstrap/` returns ONE hit and it is a false positive — the word "landing" in a prose sentence about a person landing on a directory. The artwork is declared in the ROOT `harness.json` `images[]` and rendered by `folio-assistant/docs/_includes/landing.html`. So this half of the ruling is a **constraint on the new work** (do not put the cat into bootstrap when you build this) rather than a relocation of anything that exists. Recording that explicitly so the next agent does not go hunting for a file to move and conclude the ruling was already satisfied by accident.

A SUSPICION I HAD AND DISPROVED, recorded because it looks like a boundary violation and is not: `bootstrap/harness.json` declares `"graphs": ["cat-harness"]` and a directory id `cat-harness`, which reads as bootstrap naming the layer composed on top of it — something its own `_comment` forbids ("nothing here may import from it"). It is fine. `cat-harness` IS the generic graph-kind name: `schemas/cat-harness.ts:1555` sets `KG_GRAPH_KIND = "cat-harness"` and `GRAPH_KIND_ALIASES` keeps `kg` readable as a deprecated alias. The kind was RENAMED; bootstrap is using the current vocabulary, not reaching upward.

## What creating `folio/` actually means — measured 2026-09-20

The two things that sound the same and are not:

| | what it is |
|---|---|
| **`content/`** | what `scripts/init-folio.ts` scaffolds, in a SEPARATE content repository |
| **`folio/`** | a declared graph DIRECTORY of kind `folio` — the one **renderable** kind |

The ask is the second. `init-folio` is therefore **not** the tool for this step, despite being the obvious candidate: it writes `content/`, `uploads/`, `library/`, a `harness.config.json` and a builder shim for a content repo. Reaching for it would scaffold a folio *repository* where the ruling asks for a folio *graph*.

Three facts that make this step well-defined:

- **`folio` is registered by CORE, not the harness** — `schemas/folio-graph-kind.ts`, and the module docs say why in one line: *"A layer that cannot render must not own the renderable kind."* `registerFolioGraphKind` is idempotent by design.
- **An instance with no `folio/` is explicitly ordinary** — `schemas/cat-harness.ts:29`: *"An instance with no `folio/` directory is completely ordinary; `agentic-harness` is exactly that."* So creating one is an addition, not the repair of a defect, and `initialization.md` step 2's *"create the directories the declaration names, and only those"* is satisfied by DECLARING `folio/` in the same step that creates it.
- **This will be the `folio` kind's FIRST production consumer.** `grep -rn "registerFolioGraphKind\|FOLIO_GRAPH_KIND"` returns hits only in its own module and `cat-harness.test.ts`. Nothing in `src/`, `scripts/` or any `harness.json` uses it. Worth knowing before building on it: the kind is declared and tested but has never been exercised end to end, so the first consumer is also the first proof that a renderable declared graph renders.

## Reading I am proceeding on, stated rather than asked

**The cat is a BACKGROUND of the sticky, not a note attached to it.** `5oai` carries an earlier owner answer — *"the markdown display can be the text without the grumpy cat. grumpy cat is a note on that"* — which reads as a separate attached note. Today's ask says *"a sticky note with grumpy cat background"*. Taking today's as superseding: later, and specific about composition. Flagging rather than burying it, because the two produce different object graphs (one note vs. two) and the earlier answer is the one written into a merged bean.


_2026-09-20_ — TWO OWNER ANSWERS, and the first one dissolves a constraint rather than breaking it.

**CONTENT: "Description + the four onboarding links."** I had flagged this as the option that overflows, on `alox`'s measurement: the declared text region is 53% x 28% of the laptop crop, overflow is rendered rather than clipped (`landing.html` says so deliberately), and `alox` put the four links BELOW the panel for exactly that reason. The owner chose it anyway, and on re-reading it is coherent — the constraint does not apply any more:

> **A sticky note is not a thought cloud.**

`textRegion` exists because the description is composited into the quiet interior of the cat's thought-cloud, and that interior is a fixed shape in a fixed crop. Once the landing page IS a sticky, the STICKY is the container and the cat is its BACKGROUND. A sticky sizes to its content; a cloud interior does not. So the four links do not overflow anything — they make the sticky taller, which is what a sticky does.

CONSEQUENCE FOR THE BUILD, and it is the load-bearing one: **the new landing path must not inherit `textRegion`.** Carrying it over would reimpose the geometry the ask removes, and the failure mode is quiet — the words would clip or spill against a box nobody meant to keep. `textRegion` stays declared in `harness.json` for the OLD composited path and for any instance that still wants it; the sticky path ignores it. That also settles which of the three `landing.html` states the sticky replaces: state 1 (backdrop + region → overlay). States 2 and 3 are about instances with no region and no art, and a sticky needs neither.

SECOND CONSEQUENCE: `alox`'s open item (b) — *"THE ONBOARDING BLOCK IS ON docs/index.md, NOT IN THE CLOUD… it is worth re-checking with the owner because the request said 'the markdown'"* — is now ANSWERED by this ruling. The links belong in the sticky. `alox` should be updated rather than left asking a question the owner has since settled.

**TRACKING: a new GitHub issue, cross-referencing #223.** Per the CRDM rule that a feature is linked to an issue, with the three-way split kept intact: the issue is for stakeholder sign-off, the PR for code review, this bean for the work plan. #223 is referenced rather than reused because creating `folio/` here is a step INTO the pre-split, not the split itself.

## Revised content of the sticky

1. The description from `harness.json` — the derivation chain, as markdown.
2. The four onboarding links, from `alox`'s measured list: the work plan is beans and how to claim one; make your first folio with `bun run init-folio`; document vs paper (`content-types.html`); and the documentation you will never read (`guides/index.html`).

`alox` records that all four are emitted through `relative_url` rather than written relative, because the site is a PROJECT Pages site with `baseurl: /folio-assistant` and link-shaped values that resolve by luck are the whole of bean `blv9`. Whatever emits them from the sticky must keep that.

Still English-only, which is `alox`'s open item (c) and NOT a defect yet — but the sticky is a new surface and this is the moment the strings could be extracted rather than silently never picked up.



_2026-09-20_ — A COVERAGE GAP I AM RECORDING RATHER THAN LETTING 'TESTS GREEN' COVER.

**Nothing automated exercises the rendered landing page.** Measured: `test/a11y.e2e.ts` targets `/_kg/folio-assistant/index.html` and `/_kg/folio-assistant-i18n-fixture/index.html` — the **KG viewer**, not the Jekyll docs site. `grep -rn 'folio-landing|fa-landing|landing.html|jekyll' test/*.e2e.ts playwright.config.ts` returns **nothing**. So the include this bean rewrote has no e2e test, no axe pass, and no snapshot.

That cuts both ways and both matter:

- The rewrite could not have broken the e2e suite, so its green says nothing about this work.
- A new user-facing surface shipped with **no automated coverage**, and the only thing standing behind it is that I built the page and looked at it.

**And looking is what caught everything.** Three defects were invisible to a clean build, 3198 passing tests and every gate: a child combinator that matched nothing (`.fa-sticky--backdrop > .fa-sticky-art`, with the `<img>` a grandchild inside `<picture>`) so the art laid out at 1672px across the page; `object-fit: cover` cutting the cat's head off; and a scrim value that took three renders and two owner corrections to settle. CSS raises no error for a selector that matches nothing, which is precisely why no gate could have found the first.

**What coverage would actually catch.** Not the fade — that is a judgement call and was settled by the owner looking. But the selector bug is mechanical and cheap to catch: a built page plus an assertion that the art element's rendered box is no wider than its card. The rig already exists in this session's scratch work — a minimal Jekyll build over the real `_data/harness.json`, served over HTTP, driven by Playwright with `executablePath: '/opt/pw-browsers/chromium'` because the pinned build is not installed here.

**NOT done in this bean**, deliberately: the folio's e2e config, its fixtures and its CI job are their own change, and bolting a Jekyll build into the existing Playwright project mid-PR would widen a change that is already large. Needs its own bean if it is to be done.

Related: the a11y suite not reaching the docs site at all is bigger than this one page and is worth checking against `alox`, whose open item (a) is that nobody had visually verified the landing fade either.



_2026-09-20_ — PREPARE-MERGE RUN, owner authorized the merge ("mrege").

Generic recipe: working tree clean; base `main` fetched; base had moved one commit and was **merged in** (a PDF added at the repository root — see below); `git merge-tree --write-tree` exits 0, so it merges cleanly; branch pushed at `dbc925a`, 28 commits ahead.

Content type is `document` (`harness.config.json`), which the prepare-merge recipe does not list among its content-specific gates — so the **platform** checks were run and no content-specific suite was skipped silently:

- `bun test` — 3298 pass, 0 fail
- `eslint .` — clean
- `tsc --noEmit -p tsconfig.json` — clean
- generated docs in sync: `gen-schema-docs`, `gen-skill-docs`, `gen-docs-pages`, `landing:data`, `docs:harness` all re-run and left **zero** uncommitted diff
- all **35** package gates green

**A FINDING FROM THE BASE MERGE, not acted on:** main's new commit adds `Publication and information products style guide-info.pdf` **at the repository root**. That is the fifth time content has landed there — after `0301fbd2`, `1b62b57`, `fd84bccc` and `c354719c` — and it is bean `ll11`'s gap: the root is not an instance, so `check-declared-assets` does not scan it and nothing reports the file at all.

By `content-acquisition`'s own rule this is an **unprompted offer** and should be accepted and routed to `uploads/`. I did not move it: relocating somebody's file in the middle of a merge preparation is not what "merge" asked for, and a PDF is a document-ingestion input rather than theme art, so routing it is a judgement about what it is FOR. Flagged to the owner instead.


_2026-09-20_ — **MERGED.** PR #465 merged to `main` as `a8e0cba` on the owner's
explicit authorization ("mrege"), with `mergeable_state: clean` and all three
workflows `success` on `dbc925a` (Code-quality gates, Feature Staging, JSON-LD
drift). Implementation summary posted to issue #464
(`issues/464#issuecomment-5748612673`); **the issue was left open** — an agent
does not close one on its own say-so, and two decisions below are the owner's.

Closing this bean `done`. Three things it deliberately did NOT do, each already
written up above and each needing its own bean rather than a quiet carry-over:

1. **No automated coverage of the rendered landing page.** `a11y.e2e.ts` targets
   the KG viewer; no e2e test or config mentions `landing.html`. The suite's
   green says nothing about this surface — only the screenshots do. The folio's
   e2e config, fixtures and CI job are their own change.
2. **The `folio` graph-kind registration** is a load-time side effect in core, so
   `readDeclaration` is import-order dependent and **52 modules** call a
   declaration reader without the registration import. Every module CI runs is
   covered, so it is latent rather than blocking. Correction to the option I
   recommended on the PR: it would **add** a wrong-direction partition edge,
   because the partition puts `cat-harness.ts` in agentic-harness and
   `folio-graph-kind.ts` in core. Needs re-costing before the owner decides.
3. **The root PDF** is still at the repository root, flagged and untouched —
   `deletion-requires-confirmation` applies to relocation as much as removal.
   Bean `ll11` is where the structural half lives: the root is not an instance,
   so `check-declared-assets` does not scan it and nothing reports the file.
