---
# folio-assistant-tbdg
title: 'main is RED on translation-drift: #1374 published 27 translated pages with no .po catalogue, and the backlog list is not the fix'
status: in-progress
type: bug
created_at: 2026-09-26T04:22:55Z
updated_at: 2026-09-26T08:50:20Z
parent: folio-assistant-1xhc
---


Measured 2026-09-26. `main` is RED on `translation-drift`, independently of
anything else, and it is the SECOND of two unrelated breakages on `main` this
morning.

## The failure, and that it is `main`'s

```
(fail) the real corpus — and the gate can actually fail > no NEW drift, and
       nothing unreadable
Expected 0, Received 27
   error ar/accessibility: published with no `.po` catalogue and not in
   UNCATALOGED — add the catalogue, or record it there with a reason and a date
   ... x27
```

Measured on `origin/main` ALONE, in a clean worktree, at `a0fbdc7ac75` — the
merge of **#1374** (`claude/206-translate-contributing-accessibility`):
`17 pass, 1 fail`. So it is not any PR's; it is the base.

## Five pages x five locales, and the catalogues genuinely do not exist

19 `.po` files exist, covering `index`, `kg-viewer`, `glossary`,
`agent-onboarding` and `crdm-methodology`. #1374 published five NEW pages —
`accessibility`, `content-types`, `contributing`, `getting-started`,
`installation` — across `ar`, `es`, `fr`, `ru`, `zh`, and no catalogue was added
for any of them.

## The gate is RIGHT, and the backlog list is not the remedy

`UNCATALOGED`'s own docblock settles this:

> *"These are a BACKLOG, not a policy. Anything not listed here must have a
> `.po`, so the gate fails on the commit that publishes a new translation
> without one."*

So the gate did exactly its job on exactly the right commit. **Adding 27
`UNCATALOGED` entries would defeat a working gate**, which is the same act as
quarantining a test, and it would convert a backlog of 2 into a backlog of 29
in one commit — retiring the gate by filling its exemption list.

The existing two entries also say why a catalogue cannot simply be generated:

> *"A catalogue cannot be derived from a finished translation without inventing
> the segmentation."*

The translations are finished prose. Recovering a segmented catalogue from them
is authoring work, not a regeneration, and not something an agent should invent
on the author's behalf.

## Why this is blocking more than itself

It sits on `main`, so every open PR inherits it. Concretely: PR #1376 — the fix
for the OTHER breakage (#1365's seven skills landing without their derived
artefacts) — was green on its own branch at 153/153 and went red in CI purely
because CI tests the MERGE. So the two defects are now serialised: `main` cannot
go green until both are resolved, and #1337 (which the owner asked to be merged)
is behind both.

## Not fixable by this session, and why that is stated rather than worked around

Three candidate remedies, and none is an agent's to take:

1. **Write the five catalogues.** Real translation-catalogue authoring across
   five locales. Not derivable, per the note above.
2. **Record 27 `UNCATALOGED` entries.** Defeats the gate; see above. It also
   needs a *reason* per entry, and the only honest reason available to me is
   "so that my unrelated PR can go green", which is not a reason about the
   translations.
3. **Revert #1374 on `main`.** Reverting a sibling's merge is not mine to do,
   and it would discard finished translation work to unblock a gate.

## Done when

- [ ] #1374's author decides between supplying the five catalogues and recording
      the backlog — and if the backlog, with a reason about the TRANSLATIONS and
      a date, not about unblocking CI
- [ ] `translation-drift` is green on `main`, measured in a clean worktree on
      `origin/main` alone rather than on any PR
- [ ] the ordering question is recorded: `main` carried TWO independent
      breakages at once this morning, and the second was only found because a
      PR fixing the first went red in CI. Nothing reported either at the point
      of merge
- [ ] MEASURED AFTER: publishing a translated page with no catalogue still fails
      on the commit that does it — the gate must not have been widened to pass

## Not claimed

Recorded and left `todo`. The session that found it was fixing the unrelated
#1365 breakage and deliberately did not widen that PR to include this.

## SECOND failure from the same merge — the e2e locale-fallback fixture

`main` is red on TWO tests from #1374, not one. Found 2026-09-26 after the first.

```
[chromium] cat-harness/test/nav-locale.e2e.ts:228
  the navbar shows the selected locale > a page with no translation falls back
  to the source language
    waiting for locator('.site-nav a[href="/getting-started.html"]')
    Error: element(s) not found
  698 passed, 1 failed
```

**The test fired exactly as its author designed.** Its fixture docblock says so in
advance:

> *"`getting-started` is a real page of this site that has never been translated.
> If it ever is, this test starts failing loudly rather than silently verifying
> nothing, which is the correct direction to fail in."*

#1374 published `fr/getting-started.md`, so the page the test needs to be
UNTRANSLATED is now translated. Nothing is broken about the test; its premise was
consumed.

## Repairable today, and that is the less interesting half

Measured over `cat-harness/docs/`: **29 source pages, 6 translated in at least one
locale** (`accessibility`, `content-types`, `contributing`, `getting-started`,
`index`, `installation`), leaving **23** with no translation in any locale. So a
replacement fixture exists.

**But naming a real page makes this test a clock rather than a check.** Translation
coverage went from roughly one page to six in a single merge, and the same author
is actively adding more. Whichever of the 23 is picked, the test is red again the
week that page is translated — and the next agent will read the docblock, pick
another page, and reset the clock. Three cycles of that and the docblock is
describing a habit rather than a decision.

The alternative the author should weigh: the test already builds its own nav
markup from a `harness()` template and injects a synthetic
`fa-translation-meta` island. A fixture page that exists only inside that harness
would test the fallback BEHAVIOUR without depending on the corpus's translation
coverage at all. That is a change to their test's design, so it is theirs to make,
not something to impose while fixing an unrelated breakage.

## Why this was not fixed alongside it

It is a one-constant change and it would unblock **nothing**: the drift failure
above is still red, so `main` stays red either way. Fixing one of #1374's two
failures and not the other, inside a PR whose body says it does not fix #1374's,
would make that PR's own account of itself false.

### Adds to "Done when"

- [ ] the e2e fallback fixture is settled by its author — a different named page
      (and the clock accepted, with that stated) or a synthetic page inside
      `harness()` (and the corpus dependency removed)
- [ ] MEASURED AFTER: translating one more real page does not turn this test red

_2026-09-26T08:50:20Z_ — Claimed by claude/wonderful-gauss-7frcrw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
