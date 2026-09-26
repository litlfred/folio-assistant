---
# folio-assistant-tbdg
title: 'main is RED on translation-drift: #1374 published 27 translated pages with no .po catalogue, and the backlog list is not the fix'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-26T04:22:55Z
updated_at: 2026-09-26T11:23:13Z
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


## MEASURED 2026-09-26 — 7 of the 25 catalogues are derivable, and the other 18 are a REAL FINDING

The remedy this bean called for ("the catalogues are the fix") is partly
mechanisable, and the part that is not turns out to be the more important half.

`content/pipeline/derive-po.ts` runs the SAME deterministic extractor
(`extractMarkdown`) over a source page and its published translation and pairs
entries by position. That is reading one segmentation rather than inventing a
second — which is why the `UNCATALOGED` docblock's reason ("a catalogue cannot be
derived from a finished translation without inventing the segmentation") is nearly
right rather than right: it holds for a translation you can only read as prose.

### The split

| outcome | pairs |
|---|---|
| kind sequence identical — derived | **7** |
| count matches but kinds diverge — REFUSED | **2** |
| count differs — refused | **16** |

Seven catalogues written (`{ar,es,fr}/content-types.po`,
`{ar,es,fr,ru}/contributing.po`), each marked **UNOFFICIAL** in its header
because #206 defines official as human sign-off and a script's output is not
that. Independent corroboration: `translation:drift:check` findings went
**25 → 18** with no NEW drift reported on the seven — the gate now reads them as
catalogued pages and finds them consistent, which a wrongly-aligned catalogue
would not have produced.

### The middle row is why the check is the KIND SEQUENCE and not the count

My first hypothesis was a count match. It was **refuted by measurement**: only 9
of 25 pairs match by count, and `PotEntry` carried no structural field to verify
the alignment with, so a count was all there was to check. Adding
`PotEntryKind` (8 named kinds; a new producer must DECIDE, the rule this repo
applies to graph kinds) then caught **2 of those 9** as structurally divergent:
`fr/accessibility` at construct 32 and `ru/getting-started` at construct 53, both
pairing a source **paragraph** against a translated **table-cell**.

A count-only check would have written two catalogues pairing a paragraph's msgid
with a table cell's text, and **nothing downstream would have noticed** — a `.po`
is well-formed whatever it claims. The extra field earned itself on its first run.

### What a matching kind sequence does NOT prove

Necessary, not sufficient: two adjacent paragraphs could have swapped and the
sequence would still match. Stated in the module docblock rather than hidden,
because a caller deciding whether to trust the output needs it.

### The 18 refusals are drift the MISSING catalogue was hiding

This is the finding, and it is larger than the gate failure that surfaced it. A
refusal means the published translation does not have the same SHAPE as its
source, so no positional alignment is sound. `translation-drift` could only ever
report "no catalogue" on these pages — the absence was **masking** a structural
divergence, so the red gate was under-reporting rather than over-reporting.

`zh` is systematically short on all five pages, which is a pattern rather than
five accidents and points at one producer. Split out as its own bean: correcting
or re-translating those pages is content work, not catalogue work, and it needs
the owner's call on which.

### Adds to "Done when"

- [x] the 7 soundly-derivable catalogues exist, marked unofficial
- [ ] the 18 refused pairs are dispositioned (see the child bean)


### CORRECTION, same day — the 18 refusals are NOT 18 findings about translations

The section above says *"The 18 refusals are drift the MISSING catalogue was
hiding"* and treats every one as a divergence the translator introduced. **That is
wrong for half of them**, and I established it by measuring rather than by reading
the refusals again.

Re-running both sides with `MD_MIN_TEXT_LEN` at 1 instead of 3:

| refusal | pairs |
|---|---|
| artefact of the extractor's own threshold — vanishes at min 1 | **9** |
| substantive — the translation really carries less | **9** |

**Both kind divergences are in the first group.** `fr/accessibility` and
`ru/getting-started` align exactly (`firstKindDivergence === -1`) once the
threshold is out of the way. So the sentence above calling them "the measured
justification for checking kinds at all" was right about the *check* and wrong
about the *cause*: they are misaligned, a count-only check would have shipped two
wrong catalogues, and the reason they are misaligned is this repository's
extractor, not the translators.

The mechanism, on a real cell of `docs/installation.md`: stripping code spans
leaves `", "` (2 characters) in English and `"، و"` (3) in Arabic, so an
identical 4×7 table yields 66 constructs in `ar` against 65 in English. It runs
the other way for Chinese, where `否` is one character and is dropped while `non`
and `нет` are kept — which is the actual reason `zh` looked "systematically
short", and that reading was partly a threshold too.

Split into three beans so each has an owner and none of them is this one:

- `6b8u` — the character threshold (7 count mismatches + both kind divergences)
- `ig4a` — indented code fences extracted as prose (74 code fragments offered to
  translators, 16 real strings hidden), found in the same sweep
- `7x8o` — the 9 that survive: `zh` short on all five pages, and `es`/`ru`
  `accessibility` short by the same 13

The claim that survives intact is the one that matters for this bean: the missing
catalogue was **masking** a real divergence on 9 pages, so this gate was
*under*-reporting. The remedy is 7 catalogues plus `7x8o`, and never 27
`UNCATALOGED` entries.

_2026-09-26T08:50:20Z_ — Claimed by claude/wonderful-gauss-7frcrw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## CI found two defects in my own work that local runs could not — both about time

`bun run gates` was green on these because it runs ONE tree. CI runs the PR
**merged with `main` as it is now**, and `main` here moves every few minutes.

### 1. I pinned a measurement in a test, and an unrelated edit falsified it

The test read:

```ts
expect(r.derived).toHaveLength(10);
expect(r.refused).toHaveLength(15);
```

CI failed it, **correctly**. `main` edited `docs/installation.md` while this
branch was open — adding two constructs about Windows and Git Bash — so
`ar/installation` stopped aligning and the pair became **9 / 16**. Nothing in
`derive-po.ts` regressed.

The claim that equality was protecting — *the two extractor fixes moved alignment
from 7 to 10, three more rather than the nine I first inferred* — is a **dated
historical measurement**, and its home is the module docblock with the tree each
number was taken on. Pinning history in an assertion makes every source edit look
like a regression, which is how a real signal gets ignored.

Replaced with what is actually invariant: alignment is partial (non-zero at both
ends, so it cannot pass vacuously) and **no pair diverges by KIND** — the part
that is about this module rather than about the corpus.

### 2. `write` replaced existing catalogues unconditionally — on the artefact #206 protects

`writeFileSync` with no existence check. So a second `--write` would have silently
replaced every catalogue, including one **signed off by a human** — #206's own
definition of *official* — or hand-corrected after this tool produced it. The diff
would have read as a regeneration rather than as a deletion.

That is `deletion-requires-confirmation` applied to a writer, and I wrote the
writer without applying it. Now it **skips and reports**:

```
Wrote 0 file(s).

Left 9 existing catalogue(s) ALONE. One may carry a human's sign-off
or hand corrections, and replacing it is not this tool's call. Pass --overwrite
if you have decided:
```

`overwrite` is never the default, and the CLI spells it as its own flag so
choosing it is a separate act from choosing to write. Re-running is now
idempotent. Two tests: a stand-in human edit survives a re-run, and `--overwrite`
replaces only when asked.

### `ar/installation.po` is still sound, checked rather than assumed

Since `main` edited its source after I derived it, I compared the committed
catalogue against the current extraction: **0 msgids no longer in the source**, and
**2 source constructs with no msgid** — the two `main` added. So it is
**incomplete, not wrong**, which is exactly how a catalogue is supposed to age, and
the drift gate agrees (it is not among the 15). Kept: deleting it would take drift
from 15 back to 16, and it mistranslates nothing.

This is the shape of `lvk9`'s stale-on-edit problem arriving early, from a
different direction: a catalogue's msgids are a function of the source's wrapping
AND of its content, and only the second kind of change should invalidate a
translation.
