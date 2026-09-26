---
# folio-assistant-3sm2
title: 'The t8g3 campaign closed 24 catalogue gaps today and opened 35: the drift gate cannot ratchet while it is held red'
status: in-progress
type: task
priority: high
created_at: 2026-09-26T19:39:54Z
updated_at: 2026-09-26T19:59:57Z
parent: folio-assistant-bzyu
---

Owner chose the route on 2026-09-26: **make the drift gate green rather than move
the masked gates out from behind it** (asked with four options, against `cpss`'s
108 masked checks). Measuring first turned that into a finding: the gate cannot be
brought green by finishing a fixed list, because the list is growing faster than it
is being cleared, and nothing stops it.

## The arithmetic, measured on `8ca9dd71c08` merged into this branch

    70 translation(s) compared, 36 NEWLY drifted, 0 could not be read,
    0 drifted and recorded, 2 uncatalogued and recorded

**`f6r1`'s original 25 are all but done.** The 5 x 5 grid of accessibility /
content-types / contributing / getting-started / installation x ar/es/fr/ru/zh now
carries 24 `.po` files. The only survivor is `zh/getting-started`, which `f6r1`
recorded as refused BY the subsequence guard and needing a human's translation
decision.

**And 35 new instances arrived today.** Seven pages x five locales, every one with
a `.pot` and no `.po`:

    agentic-harness  architecture  beans-and-todos  document-ingestion
    evidence         publication-workflow           skills

First added in two commits, both today, both t8g3 batches:
`438a79d284d` (#1409 — doc-ingestion + agentic-harness + pub-workflow) and
`6ec97bd64ab` (#1404 — architecture + evidence + beans + skills).

So: **24 closed, 35 opened, net +11, and the gate went 25 -> 36.** The campaign
that exists to clear this defect is producing it faster than it clears it.

## Why it can happen at all, which is the part worth fixing

Publishing a translated page and authoring its catalogue are separate steps with
nothing between them. The gate that notices is `translation:drift:check` — and
that gate is **deliberately red**, so:

1. a batch publishes a translated page with no `.po`;
2. the gate that would name it is already failing, so the job's conclusion does not
   change and no reviewer sees a new red;
3. the batch merges, and the count grows silently.

**A gate held red by decision stops being a ratchet.** `cpss` measures one cost of
that redness — 103 gates in the same `set -e` batch never run. This is the second
and it is worse in kind: the red gate cannot even report growth in *its own*
subject.

## What this does NOT propose

- **Not deriving the `.po` from the published text.** `f6r1` measured that on 27
  translations: 19 provably not derivable (segment counts differ by ~20, so
  deriving means deciding which segments went untranslated and which were merged),
  8 undetermined, 0 demonstrated derivable. `pot-for-pages.ts`'s own docblock
  states the doctrine: *"A `.pot` is a translator's INPUT; the gate wants a `.po`,
  which is a translator's OUTPUT. Authoring is human work. Extraction is not."*
  I had reached for exactly the refuted idea — the `.pot` exists, so the
  segmentation is given — and the docblock stopped it. **Whether these 35 align is
  UNMEASURED**, because `f6r1`'s population was the other 27; that measurement is
  worth doing before anyone assumes either way, and it is not the same as deriving.
- **Not adding `UNCATALOGED` entries.** #1364 merged 25, #1384 reverted them on the
  owner's instruction, and that remains #1374's author's call.

## Done when

- [x] the owner has chosen whether to gate the batches (a translated page may not
      be published without its catalogue) or to keep clearing the backlog by hand —
      **both, gate first**, 2026-09-26
- [x] whichever is chosen, the count cannot grow silently while the gate is red —
      `translation:catalogue:check`, ABOVE the drift batch
- [ ] the 35's segment alignment against their `.pot` is measured, so "derivable"
      is a finding rather than an assumption in either direction

## The gate — `translation:catalogue:check`, 2026-09-26

`cat-harness/scripts/check-translation-catalogue.ts`, registered as a CI step
placed ABOVE the drift batch. It asks a **different question over a different
unit**, which is why it is not a second answer to the drift gate:

| gate | unit | question |
|---|---|---|
| `translation:drift:check` | the corpus | is every published translation catalogued and structurally current? |
| this | the CHANGE | does what you are about to merge publish a translation with no catalogue? |

Keying on the diff is what makes it work while the backlog stands, and it needs no
baseline — which matters, because the baseline `UNCATALOGED` would be is the one
#1384 reverted and #1374's author owns.

**One answer, not a copy.** The file -> (locale, page) mapping is `fileForUrl` from
`translation-drift.ts`, now exported with the reason, applied over
`buildTranslationIndex`; the catalogue path is that module's `catalogueFor`.
Composing either here would let the two gates disagree about which file is which
page.

### Falsified against the real event, not a fixture

Three states, and the middle one is the proof:

    --since origin/main                   0 findings, exit 0   (the existing 36 are invisible to it)
    --since 438a79d284d^  (#1409)        15 findings, exit 1   = 3 pages x 5 locales
    --since 6ec97bd64ab^  (both)         35 findings, exit 1   = 15 + 20, the exact population

**35 is the number the drift gate reports.** The gate reproduces the real defect's
whole population when asked about the range that introduced it, and reports nothing
on a range that introduced none. That is stronger than any synthetic case.

### Mutation-tested by hand, three mutations, one test each

    drop the existsSync check          8 pass / 1 fail
    report nothing                    8 pass / 1 fail
    [] instead of undefined on a bad ref   8 pass / 1 fail

Restored: 9 pass / 0 fail. Plus the anti-vacuity assertion `6tkl` requires — the
map must be non-empty, or every run of this gate is vacuously clean.

### Two things deliberately NOT done

- **No `--check` flag and no `artefact-verification` entry.** That checker selects
  on *"invoked with `--check`"*, and this gate verifies no artefact's currency — it
  has no generator and writes nothing. An entry would be a claim about an artefact
  that does not exist. Recorded in the docblock so it does not read as a dodge.
- **Exit 2 is red in CI, on purpose.** If the base ref cannot be fetched the gate
  cannot run, and `nytj`'s rule is that a gate which cannot run must not read as
  green. The step fetches `origin/main` at depth 200 first; if that proves too
  shallow for a long-lived branch, CI says `could not determine` with the reason
  rather than passing blind.
