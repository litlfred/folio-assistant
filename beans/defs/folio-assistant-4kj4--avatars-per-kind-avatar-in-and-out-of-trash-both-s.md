---
# folio-assistant-4kj4
title: 'AVATARS: per-kind avatar, in and out of trash, both schemes, with a QA axis for coverage'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T11:08:23Z
updated_at: 2026-09-19T15:29:04Z
parent: folio-assistant-o3xy
---

Owner, 2026-09-19:

> each content type should have an avatar in and out of trash. dark and
> light mode. see work on themes by sibling for stickies.

and, when asked whether that meant folio content types or `fsh-guts` node
kinds:

> if more than one kind then it fades through the avatars in a loop. issues
> with that? also make sure needed accesabily modes. QA sidescares if avatar
> thems not fully done

## The fade loop — three issues, raised because the owner asked

**1. An auto-playing loop fails WCAG 2.2.2 (Pause, Stop, Hide).** Content
that moves automatically for more than five seconds must be pausable,
stoppable or hideable. A perpetual cross-fade has no end, so it needs a
control or it must not autoplay. `folio-assistant-gjli` makes accessibility
a standing rule here, so this is conformance and not taste.

**2. `prefers-reduced-motion` is exactly this case.** A cross-fade is the
canonical trigger, and under that setting the loop must not run — which
means a static presentation has to exist anyway. **The static form is a
prerequisite for the loop, not an alternative to it.**

**3. It is slower to read than a static badge, and mute to a screen reader.**
Five kinds at two seconds is ten seconds to learn what something is, and you
must catch the cycle's start. A screen reader cannot cycle at all: the
accessible name must state every kind at once, so the loop conveys nothing
to it.

## Proposed, keeping the intent

A **static fan** of overlapping avatars with `+N` on overflow — the
participant-list pattern — and the fade loop as an **accelerator on hover or
focus**: user-initiated, so 2.2.2 is satisfied, and suppressed entirely
under `prefers-reduced-motion`. The animation lands where it is charming and
nothing depends on it to be legible.

Not yet agreed; the owner asked for issues and these are the issues.

## Theming

Follow the existing dual guard in `docs-ui.css`: `:root[data-fa-scheme="…"]`
for the explicit choice, plus `@media (prefers-color-scheme: …)` with
`:root:not([data-fa-scheme="…"])` for the system default. Both schemes, both
trash states.

## Coverage is a QA axis, not a promise

Owner: *"QA sidescares if avatar thems not fully done."* Every
(kind × in/out of trash × light/dark) cell that has no asset is a **finding
in a QA sidecar**, the same shape as the block, script and KG sweeps.

That is the third-state discipline this repo applies everywhere: a missing
avatar must read as MISSING, never as a blank the viewer silently tolerates.
It also makes the open-ended `kind` vocabulary safe — a new kind with no art
shows up as a finding rather than as nothing.

## Done when

- [ ] one avatar per kind, in and out of trash, in both schemes
- [ ] a generic fallback exists, because `kind` is deliberately open
- [ ] multi-kind presentation is decided (fan vs loop) and accessible:
      reduced-motion respected, accessible name lists every kind
- [ ] a QA criterion reports every uncovered cell, with sidecars
- [ ] contrast checked against both schemes, not assumed

## Depends on

`folio-assistant-uv09` for the trash side, and the multi-kind question above
needs the owner's answer before the loop is built either way.

## Clarified by owner, 2026-09-19 — the fan IS the panel, and it shows DECLARED kinds

> ok. openning fan is panel. shows the DECLared kinds for that instance, not
> inheritance. all kinds need an avatary. bootstrap has avatar, so does
> cat-harness, folio-asst, sticky/todo, etc.

**Opening the fan opens a panel.** Not a tooltip and not a cycling badge —
the fan is the closed state, the panel is the open one.

**It shows what THIS instance declares, not what it inherits.** That is a
real distinction in the model: `resolveDependencyTree` overlays a
dependency's directories onto an instance's, so the effective set is larger
than the declared set. The panel reads the instance's OWN
`harness.json.directories`, before inheritance.

**Every kind needs an avatar** — including the layer identities the owner
named: `bootstrap`, `cat-harness`, `folio-asst`, and `sticky`/`todo`.

## The three multiplicities, measured 2026-09-19

Answering the owner's question, "clarify how node can be declared multiple
kinds". The word *node* does different jobs at different levels:

| level | multiple kinds? | evidence |
|---|---|---|
| **instance** | yes — many | 11 declared directories in this repo, 11 distinct kinds |
| **directory** | yes, occasionally | `graphs` is `z.array(z.string()).min(1)`. **One** directory uses it: `schemas/` → `["schemas", "cat-harness"]` |
| **file** | **no — exactly one** | the file declares itself with a single `$schema` |

`schemas/` holds two because a schema **is** a KG node rather than an island
beside one. That is the only live multi-kind directory, and therefore the
only place a multi-avatar presentation currently has anything to show.

**A file cannot carry two kinds, and that is deliberate.**
`ContentDirectorySchema` carries a long rejection of a `locale` field on the
same grounds: a declaration states what to EXPECT in a directory, and the
files declare what they ARE. A per-file kind list would restate in the
directory what every file already says — one fact in two places, free to
drift.

So the fade-loop question is narrower than it first looked: it applies to a
DIRECTORY holding several kinds, and today that is one directory.

## Consequence to design around: fsh-guts must not appear in a published fan

`fsh-guts` is a declared kind, so a fan built naively from the declaration
would list the trashcan on the published site — which
`folio-assistant-uv09` exists to prevent. The published fan must read the
STRIPPED graph, and the dead-fish icon under settings
(`folio-assistant-7vhe`) is the separate door. Two routes, and only one of
them is in the graph.


---

**Re-parented to `o3xy` (UI & ACCESSIBILITY), 2026-09-19.** It hung off
`t0i3` (the fsh-guts store), which said something true — this is fsh-guts
work — and which `check-bean-parents` correctly refuses: a feature cannot
parent a feature, and the roadmap needs an epic. The relationship is recorded
here because the hierarchy can no longer carry it: **this depends on `t0i3`,
which is where the store and its JSON-LD endpoint live.**


## Owner's answer, 2026-09-19: **all three** — and they layer

Asked to choose between a fan, an autoplaying fade, and a fade on hover, the
owner answered **"1 2 3"**. That is not three conflicting choices; it is the
stack this bean's own analysis said was needed:

| layer | what it does |
|---|---|
| the fan | every kind visible AT ONCE — the base presentation |
| the cycle | an emphasis moving through them, with a pause control |
| hover / focus | drives the same emphasis, user-initiated |

**Nothing is conveyed by the motion.** The fan is complete when still and
the accessible name lists every kind in one string; the cycle only moves a
highlight over a display a reader can already read.

That is what makes an autoplaying loop defensible here, and it retires this
bean's own objection #3 — "slower to read than a static badge, and mute to a
screen reader" was an objection to a **cycling badge** (one slot, swapping),
not to a cycling highlight over a complete fan. Objections #1 (2.2.2) and #2
(reduced motion) stand and are both honoured: a pause control exists whenever
the loop can run, and the static form is the reduced-motion presentation.

**`prefers-reduced-motion` is checked in BOTH places** — the script never
starts the timer, the stylesheet never transitions. Either alone is a bug:
CSS-only leaves a timer mutating the DOM invisibly, script-only leaves the
transition live on whatever else changes. The query is also watched LIVE, so
a reader who turns the setting on mid-session has the loop stop rather than
having to reload.

**No pause control when there is nothing to pause** — one kind, or reduced
motion. A button saying "pause" beside something already still tells a reader
there is motion they cannot see.


## Built — and two bugs the specs caught that the diff did not show

**A `<button>` inside a `<button>`.** The pause control was appended to the
fan, and the fan is the face of the open button. The parser closes the outer
one, so the whole control never survived to the DOM — a spec clicked pause
and found `.fa-kind-fan` did not exist. They are siblings in a row now. It is
an accessibility fault in its own right: nested interactive controls have no
sane keyboard order and no agreed name computation.

**`var built` shadowed `buildViews`'s memoisation flag.** My local
`var built = buildKindFan(...)` hoists over the outer `var built = false`, so
`if (built) return` would have read `undefined` and rebuilt every view on
every launcher open. eslint found it by reporting the OUTER variable as
unused — a subtler symptom than the cause.

## And one where the SPEC was wrong, not the code

The reduced-motion block used `test.use({ reducedMotion: "reduce" })` and all
three tests failed. Probing `matchMedia` in the page returned **false**: the
fixture never reached it, so the spec was reporting a defect in correct code.
Switched to `page.emulateMedia`, which is also the honest shape — the script
reads the query at mount, so the emulation has to precede `setContent`, and a
fixture hides that ordering.

A fourth test came out of it: turning reduced-motion on MID-SESSION stops the
loop, which the fixture could not have exercised at all.

Separately, `toHaveCSS("transition-duration", "0s")` failed against `1e-06s`
— Chromium's reporting under this emulation. Asserting the literal was wrong;
it now asserts the property (under 0.05s), which is what "no transition"
means and what distinguishes it from the 0.4s animated path.

20 e2e specs.

## Owner, 2026-09-20: there is always an avatar, even when there is none

> (always have default blank/themecolor if no avatar. etc)

So **absence of an avatar is not absence of a mark.** An instance, role or
kind with no declared avatar gets a BLANK one drawn in its theme's colour,
rather than a gap, a placeholder glyph, or a fallback to somebody else's
avatar.

Three reasons this is the right default rather than a cosmetic one, and each
is a rule this repository already applies elsewhere:

1. **A gap and a missing declaration look identical.** An avatar slot that
   renders nothing cannot be told from one whose art failed to resolve — the
   `dh4f` shape, in the navbar. A themed blank is a DETERMINED empty: it says
   "this instance has no avatar" rather than saying nothing.
2. **Falling back to another avatar is worse than blank.** `themes.test.ts`
   already records the analogous case: a theme naming an image role nothing
   declares renders palette-only, and `resolveThemeBackdrop` refuses an
   INCOMPLETE backdrop wholesale rather than serving two thirds of it. The
   same argument applies here — a borrowed avatar misattributes.
3. **The theme colour is already resolved at that point.** A blank in the
   theme's own colour needs no new art, no new asset pipeline and no new
   declaration; it is the palette the surrounding chrome is already using.

## Done when

- [ ] Every avatar consumer has a no-avatar path that draws a themed blank —
      the navbar, the landing stickies, and the KG viewer.
- [ ] The blank takes the colour from the RESOLVED theme, so an instance
      inheriting a parent theme gets the parent's colour rather than a
      hardcoded neutral.
- [ ] A test asserts the blank renders for an instance with no declared
      avatar, and that it is NOT the same mark as any declared one — a
      fallback that happens to pick a real avatar would pass a weaker test.
- [ ] `check:avatar-coverage` reports "blank (no avatar declared)" as its own
      state, distinct from both "declared" and "could not determine".
