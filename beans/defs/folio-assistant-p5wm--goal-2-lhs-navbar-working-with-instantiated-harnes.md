---
# folio-assistant-p5wm
title: 'GOAL 2: LHS navbar working with instantiated harness, showing folios with the bootstrap exception, and stickies that move around on the folio'
status: in-progress
type: milestone
priority: high
created_at: 2026-09-20T18:48:29Z
updated_at: 2026-09-20T18:48:29Z
---

The owner's words, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), kept verbatim:

> get LHS navbar working w/ instantiated harness and showing folios (w/
> bootstrap/ exception), stickyes that move around on folio (need reorderion
> of folio/miro objects).

Created on the owner's ruling for bean `wqht`: *"wqht - milesotne"*.

## Epics under this milestone

| epic | why |
|---|---|
| `yj32` | HARNESS AS INTERFACE — a harness instance's default rendering is LHS + docs/ + a themed folio board. This is the goal restated. |
| `o3xy` | UI & ACCESSIBILITY — the rendered site is the artefact a reader judges, and every sticky and navbar bean sits under it. |

## The measurement that sets the starting point

**The navbar does not exist.** `grep -rln navbar` over `cat-harness/schemas`,
`src`, `ui`, `viewer` and `home_page` returns nothing. The left-hand nav today
is just-the-docs' own `.site-nav`, and the only code touching it rewrites
hrefs per locale. So "get the LHS navbar working" is a build, not a fix.

## Critical path, in dependency order — RE-VERIFIED 2026-09-22

**`b5f0` → `603s` → `6lb8` → `supn`.**

Four steps, not eight. Every id in it was checked against the store on
2026-09-22, not carried forward, and re-checked after `hfkl` closed the same
day. The withdrawal is recorded in the next section.

- **`b5f0` first**, and it is not a UI bean: it holds the ruling that settles
  `603s`'s own first open question, which file marks an instance. **That
  ruling now exists** — see §"The ruling `603s` was waiting for" below — so
  this step is a propagation, not a decision.
- **`hfkl` is CLOSED, 2026-09-22**, and was finished before this stream
  started. Its four requirements were re-derived one by one from `origin/main`
  at `b7f8945b`; what held it open was a **duplicated Done-when line** — one
  requirement entered twice, once `[x]` and once `[ ]` with a corrupted tail.
  The reason once given for doing it early was void anyway: *"it unblocks
  `2krx`, which otherwise fires 19 findings on day one"*, and `2krx` has been
  `completed` since 2026-09-20.
- **`o7eq` is this goal's URL layer** — the owner's rule that rendered assets
  live at `<baseurl>/<instance>/<declared graph>/<path>`. It says what each
  navbar section's href *is*. **Shared with GOAL 3** (`yg29` is delivered
  through this navbar at `<baseurl>/who-iris/...`), so it is not this
  milestone's to settle alone.
- **"stickies that move around" is done.** Both halves. See the withdrawal
  table. What is left under `6lb8` is the board itself — pan/zoom, semantic
  zoom to avatars, attachment by relationship — not movement.
- **`gjli` is a standing RULE, not a step.** It is `completed` as a bean
  because the bean that *stated* the rule is finished. The rule it states —
  all UI follows accessibility guidelines — binds every step here and does not
  lift, which is exactly what a chain position cannot express. It was listed as
  "a standing gate on every step" and then written into the chain's sentence,
  where the stale-path rule reads it as work waiting to happen.

## Withdrawn from the path, 2026-09-22, with reasons

Re-verified with `bun run check:stale-paths` on `main` (193 open beans), which
reported this milestone's chain as routing through four finished beans, and
then bean by bean against the store. `k59d` predicted this class and its last
Done-when reserves the repair for this milestone's owner; stream `10uc` is that
owner and this is that repair. **No bean was closed, reopened or deleted here
— only this milestone's belief about them is corrected.**

| withdrawn | status | why it is not a blocker |
|---|---|---|
| `2krx` | `completed` 2026-09-20 | The QA axis shipped, and it shipped *with* bootstrap's exemption as declared data (`renderExemption`). The "19 findings on day one" it was feared for cannot fire. |
| `ivfw` | `completed` 2026-09-21 | Both halves landed — theme-on-unpin 09-20, and the MOVE half 09-21 via one shared `wireMove`, which is what *"the two must agree"* asked for. Its own closing entry records **"Still not done here: nothing."** |
| `5y4b` | `completed` 2026-09-20 | Declared, defaulted and rendered; the "Still open: the RENDER half" section above its close was superseded the same day by *"Done — declared, defaulted, rendered, and looked at"*. Residue is `tfo1`'s crop gap, which is `tfo1`'s. |
| `pb04` | `completed` 2026-09-20 | Its original four unchecked boxes are restated and ticked in the later "Done" section. Edit and view affordances ship from the layered generation pass, absent-not-broken without a GitHub capability. |
| `1hvo` | `completed` 2026-09-20 | The declaration layer this milestone said `603s`'s `avatarRegion` and `5y4b`'s theme "both need" is in place. Its residue is filed as `lps0`. |
| `gjli` | `completed` | Not withdrawn as work — **reclassified**. A standing rule, binding on every step, never a step. |

**Each of the first five carries recorded residue, and none of it is a
blocker.** That is the honest shape: a closed bean cannot be a block that
lifts, so where real work remains it needs an open bean of its own. `tfo1` and
`lps0` already are that, and are not on this path.

## The ruling `603s` was waiting for — settled, REVERSED, and already landed

`603s`'s **first** open question is *"Which file marks an instance —
`harness.json` or `harness.config.json`?"*, and `b5f0` §1 is the same question
with its two answers costed. It is settled. **Read `b5f0` to the end before
quoting it**, because the answer was ruled one way and then reversed:

| date | ruling |
|---|---|
| 2026-09-20 | **REPLACE** — *"1 REPLACE"*. One merged file, `<name>.config.json`; `harness.json` folds into it. Implemented by `6n23`/#695. |
| 2026-09-21 | reconfirmed and **widened** — bootstrap and the `folio-assistant-*` instances are in scope. |
| 2026-09-21 | **REVERSED** — *"rename the stub need cat-harness.config.json and cat-harness/cat-harness.json, same for folio-assistant (instance, declration)"*, and *"1"* when the conflict was put back to the owner. |

**The standing answer is the PAIR, not the merge:**

    <name>.json           the DECLARATION — directories, graphs, dependents,
                          assets, stickies.        readDeclaration()
    <name>.config.json    the CONFIG — contentType, adapter, feedbackDir,
                          viewer, readme.          readHarnessConfig()

The owner took the option `b5f0` §1 had itself described — *"`<name>.json` +
`<name>.config.json` would at least pair them"*. The merge was worth reversing
in §1's own terms: it did not remove the "nothing in either name says which is
which" objection, it **moved** it, leaving two different schemas with two
different readers under one filename shape, told apart only by which directory
they sat in.

**And it has landed.** Measured on this checkout, 2026-09-22: six
`*.config.json` at instantiation roots, paired with `bootstrap/bootstrap.json`,
`cat-harness/cat-harness.json`, `who-iris/who-iris.json`,
`folio-assistant.json`. **No `harness.json` remains** — the single hit,
`cat-harness/docs/_data/harness.json`, is generated data, which `b5f0` names as
not a declaration.

**A filename is no longer fixed, and that is the part a navbar implementer
needs.** `findDeclarationFile(dir)` takes the file whose filename **stem equals
its own declared `name`** (`CONFIG_SUFFIX`, `instanceDeclarationFilename`,
`cat-harness/schemas/cat-harness.ts:145-185`). A declaration is
self-identifying, so a renamed clone still resolves — which is what answered
migration-plan I.8's objection that a per-repo name *"fails silently"*.

**So `603s` question 1 is answered, and `603s`'s own recorded answer is the
stale one.** It shipped `harness-tiles.ts` discovering instances by scanning for
`harness.json` and recorded *"this bean's question 1, answered: `harness.json`
is what names an instance"*. The **code is already correct** —
`harness-tiles.ts:290` calls `findDeclarationFile`, not a literal. Only the
bean's prose still says the retired thing, which is `b5f0`'s own open Done-when:
*"`AGENTS.md`, `zkgs`'s Done-when and `603s`'s recorded answer are corrected, or
each says why it still reads the other way."*

> **Do not quote `hfkl`'s trailer for this.** It records *"the owner ruled
> REPLACE on `b5f0`"* and is dated before the reversal. It was the most
> findable statement of the ruling and it is the wrong one — which is the same
> failure as a stale critical path, one artefact over.

## Blocked on the owner — RE-VERIFIED 2026-09-22

**Four, not six.** Still genuinely waiting:

`yj32` (*"i wanted bootsrap/ harness/ etc as todos, not landing page info"*,
and what the writable store is), `v1hw` (which write path), `h32d`, `g196`.

Plus two that need somebody to **look at a deployed page**: `alox`, and `o3xy`
as a class.

**Withdrawn from this list:**

| withdrawn | why |
|---|---|
| `6lb8` (persistence) | **Ruled, 2026-09-21.** The fear was *"a position is state, `todos/` is committed, so two sessions moving one note is a merge conflict in a generated file"*. `db7g` records the owner narrowing relocation to **this reader's board** — reader-local, `localStorage`, sharing `d1r6`'s path. A position that never leaves one reader's view is not state the folio holds, so there is no second session to conflict with. `6lb8` stays open for the board itself; its persistence question is closed. |
| `jbx2` | `completed` 2026-09-20 — the `library/` visualiser shipped, including the write path the block was about. |
| `rptk` | `completed` 2026-09-21 — the language-bar contrast defect was fixed in both schemes, and the bean names what it does *not* close (`anchorPanelInSidebar` is unreachable CSS, recorded rather than swept). It no longer needs eyes. |

## Done when

- [ ] The LHS navbar shows one themed section per instantiated instance,
      scanned from the root, in dependency order, with bootstrap as the
      declared exception
- [ ] A folio's stickies can be moved, and keep their theme when unpinned
- [ ] The layout works for a two-instance folio and renders without error
      for a zero-instance one
