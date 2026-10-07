---
# folio-assistant-3sm2
title: 'A gate held red by decision cannot ratchet its own subject — so the catalogue question is asked of the CHANGE (the 25→36 growth claim is RETRACTED: it was a mutant''s output)'
status: completed
type: task
priority: high
created_at: 2026-09-26T19:39:54Z
updated_at: 2026-09-27T05:06:39Z
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

(The `## Done when` list for this bean is at the END of the file, ticked in place
after the corrections below. One list, never two — `check:bean-bodies`.)

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

## Part 2: the alignment measurement — 2026-09-26

Run with the repository's OWN extractor (`extractMarkdown` from `pot-extract.ts`)
on both sides: the source page and each translated page. Measurement only; nothing
derived, nothing written.

### Segment counts

    agentic-harness        src= 235   ar:=235  es:=235  fr:=235  ru:=235  zh:=235
    architecture           src=  60   ar:+1    es:=60   fr:=60   ru:=60   zh:=60
    beans-and-todos        src=  75   ar:=75   es:=75   fr:=75   ru:=75   zh:=75
    document-ingestion     src=  95   ar:=95   es:=95   fr:=95   ru:=95   zh:-2
    evidence               src=  82   ar:=82   es:=82   fr:=82   ru:=82   zh:=82
    publication-workflow   src= 368   ar:=368  es:=368  fr:=368  ru:=368  zh:=368
    skills                 src= 146   ar:+1    es:=146  fr:=146  ru:=146  zh:=146

**32 of 35 match exactly.** The three that do not are `ar/architecture` (+1),
`ar/skills` (+1) and `zh/document-ingestion` (-2).

### Equal count is necessary, not sufficient — so the pairing was tested

A dropped segment plus a split segment balances the count while destroying the
alignment. Two further measurements over the 32, 5004 segments in all:

| measurement | result |
|---|---|
| identical-text ANCHORS — positions whose text is byte-identical, i.e. untranslated code, identifiers, proper nouns, which must line up if the pairing is real | **462 (9.2%)** |
| pairs where any translation's text belongs to a NEIGHBOURING source slot (off-by-one shift) | **0** |
| pairs with ZERO anchors, so unverifiable by this method | **3** — `es`/`ru`/`zh` architecture |

### The partition, and it is three states not two

    29 of 35   equal count + anchors + no shift        positive alignment evidence
     3 of 35   equal count, NO anchors                 COULD NOT TELL by this method
     3 of 35   unequal count                           not pairable without a decision

The middle row is reported rather than folded into either side. `es/ru/zh
architecture` have 60 segments each and not one byte-identical position, so this
method has nothing to test the pairing with; that is a limit of the method, not a
verdict about the pages.

### What this does and does not overturn

`f6r1` measured 27 translations and found 19 provably not derivable, 0 demonstrated
derivable, on segment gaps of **~20**. That measurement stands — and this is a
**different regime**, not a contradiction: those were finished translations of pages
whose structure had moved on, while these 35 were produced from their sources in the
same batch hours ago, so the segmentation survived. The gaps here are 0, +1, +1, -2.

**It does NOT follow that they should be auto-derived**, and this bean does not
propose it. `pot-for-pages.ts`'s doctrine — *"a `.pot` is a translator's INPUT, a
`.po` is their OUTPUT; authoring is human work"* — is about provenance, not
alignment. A `.po` written from a published page records "this is the translation of
that msgid", and if the page is machine output then the catalogue asserts machine
output as a translation. That is a decision about what the corpus claims, and it
belongs to whoever owns issue #206.

What changed is only the input to that decision: the answer was *0 of 27
demonstrated derivable*, and for this population it is **29 of 35 with positive
alignment evidence**.

## THE GATE IS GREEN, and my measurement's method had a blind spot — 2026-09-26 20:2x

Merged main and re-measured. `translation:drift:check` now reports:

    70 translation(s) compared, 0 NEWLY drifted, 0 could not be read,
    0 drifted and recorded, 8 uncatalogued and recorded
    ✓ no NEW drift

**A sibling authored 30 of the 35 catalogues while this gate was being built**, and
recorded the remaining 5 in `UNCATALOGED` with per-page reasons. So the owner's
chosen route — make the drift gate green — is achieved, by them, not by this bean.
Closed on evidence rather than authorship.

Two consequences worth stating:

- **`cpss`'s 103 masked gates are now unmasked.** The batch's third command was the
  thing stopping it; with the drift green the rest of that `set -e` block runs for
  the first time in as long as it stood red.
- **This gate's value went up, not down.** It was built to stop the growth that made
  the backlog unclearable; with the backlog cleared, it is what keeps it cleared.
  A ratchet matters most immediately after somebody has done the work by hand.

### MY MEASUREMENT WAS INSUFFICIENT, and their reasons say how

The five remaining entries are `ar/architecture`, `ar/skills`,
`ar/publication-workflow`, `zh/publication-workflow` and `zh/skills`. Two of those
reasons are **`msgid-conflict`**:

> `zh/skills` — "Skills" occurs more than once and is translated "技能" and "技能数"
> at construct 89 … Needs `msgctxt`
>
> `zh/publication-workflow` — "Editor / author" is translated "编辑 / 作者" and
> "Editor / author（编辑 / 作者）" at construct 298 … a msgid-keyed `.po` cannot hold both

**Both were inside my "positive alignment evidence" set.** `zh/publication-workflow`
measured `=368` and `zh/skills` measured `=146` — equal counts, anchors present, no
off-by-one shift. My three tests were count, anchors and shift, and **none of them
tests msgid UNIQUENESS**: a page can align perfectly, position for position, and
still be impossible to store in a msgid-keyed catalogue because one source string
appears twice with two different translations.

So the honest correction to part 2:

| I reported | actually |
|---|---|
| 29 of 35 with positive alignment evidence | 29 aligned, **of which at least 2 are not derivable anyway** |
| 3 could not tell | unchanged |
| 3 unequal count | unchanged |

"Equal count is necessary, not sufficient" was the right instinct and I applied it
one level too shallow: I tested that the pairing was sound and not that the RESULT
could exist. The sibling's guard — added after `f6r1` found the same case masked by
`count-differs` — is the test I should have run.

**A measurement is only as strong as the failure modes it enumerates**, and mine
enumerated three of four. That is worse than the count being stale, because a stale
count announces itself and a missing failure mode does not.

## Done when

- [x] the owner has chosen whether to gate the batches or keep clearing by hand —
      **both, gate first**, 2026-09-26
- [x] the count cannot grow silently while the gate is red —
      `translation:catalogue:check`, ABOVE the drift batch
- [x] the 35's segment alignment is measured — done, and **corrected above**: the
      method missed msgid uniqueness, so 2 of the 29 were misclassified


# CORRECTION 2026-09-26 21:3x — the growth claim is WITHDRAWN. I published a mutant's output as the gate's.

This bean asserted that the catalogue backlog went **25 -> 36 today, net +11**,
and that *"35 is the number the drift gate reports"*. **Both are false, and the
second was false when it was written.** The gate is still right; its
justification is smaller and different.

## What the numbers actually are

Separating the gate's two conditions, which is what I failed to do:

    range             added   publish a translation   of those, NO .po
    6ec97bd64ab^       257            35                      5
    438a79d284d^       172            15                      2
    origin/main          4             0                      0

**35 and 15 are the "added file publishes a translation" counts. The FINDINGS
were 5 and 2.** The table in this bean and in #1422 presents 35 and 15 as
findings.

**Where they came from.** One of the three hand-mutations used to test this gate
was *"drop the `existsSync` check"* — and a mutant that reports every added
translated page regardless of its catalogue returns exactly 35 and 15. The
mutation testing worked; I then carried the mutant's output into the report as
the gate's. That is the whole error, and it is worse than an arithmetic slip
because the mutant was *built to produce* the number that made the case.

## The corpus backlog SHRANK, and the remainder is the hard core

`translation:drift:check` on this head: **70 compared, 0 NEWLY drifted, 8
uncatalogued and recorded.** Not 36.

`f6r1`'s population was **27**, not the 25 this bean said — 25 is the count of
`UNCATALOGED` entries #1364 merged and #1384 reverted, a different set that I
conflated with it. So the trajectory is **27 -> 8**, downward, over the period
this bean characterised as growth.

The 8 that remain are diagnosed by the drift gate itself, and they are the
classes `f6r1` called provably not derivable: 2 published-and-structurally-current
but untracked, 3 `count-differs`, 3 `msgid-conflict` needing `msgctxt`. The
campaign cleared the mechanical cases and left the ones that need a human
decision — the opposite of the picture this bean painted.

My 5 findings are a **subset** of those 8; the other 3 were published before
`6ec97bd64ab` and are therefore outside the range, which is the gate keying on
the change working as intended.

## What survives, and it is enough to keep the gate

1. **The mechanism argument, which never rested on a count.** A job stops at its
   first failing step, so a gate held red by decision cannot report GROWTH in its
   own subject: a batch adding to the set it reports leaves the job red either
   way and no reviewer sees a new red. That is an argument about control flow, and
   it is unaffected by every retraction above.
2. **The gate finds real instances.** 5 on `6ec97bd64ab^`, exit 1, each naming a
   page and the catalogue to author; 0 on the current change, exit 0. Both
   verified on this head.
3. **The alignment measurement is untouched**, and the reason is worth stating
   because it uses the same 35. There, 35 is the count of published translations
   added in those batches — the population the measurement needed, and the
   correct use of the number. It is only the *findings* reading that was wrong.

## The falsification command in #1422 is wrong and is being corrected

    bun run translation:catalogue:check -- --since 6ec97bd64ab^

is offered there with *"it should report 35"*. **It reports 5.** And its output
DECAYS as catalogues are authored, because `uncatalogued` tests `existsSync` in
the working tree rather than at the historical commit — correct for the question
"will this land a publication with no catalogue", but it means the command is a
moving target and never was a fixed falsification. The stable one is the unit
tests over the temp-dir fixture, which decide the three cases by construction.


## The alignment measurement survives `o29r`, and for the strongest reason

#1433 (`o29r`) fixes `MD_ITALIC_UNDER_RE` in `pot-extract.ts`, which was pairing
**any** two underscores in one extracted string as an `_emphasis_` span and
deleting both — so `$a_1$ and $b_2$` extracted as `$a1$ and $b2$`. This
measurement ran `extractMarkdown` over the same corpus, so every figure in it
was computed through the broken extractor. Re-measured rather than argued:

| | original extractor | with `o29r`'s regex |
|---|---|---|
| pairs with equal count | 32 | **32** |
| segments across them | 5004 | **5004** |
| identical-text anchors | 462 (9.2 %) | **462 (9.2 %)** |
| pairs showing any off-by-one shift | 0 | **0** |
| pairs with zero anchors | 3 | **3** |

**Identical is worthless unless the harness could have seen a difference**, so
that was measured too, and it is the part that settles it:

- over the **42 files** this bean measured (35 translations + their 7 sources),
  **0 of 6,366** segments change under the fix;
- over **all of `cat-harness/docs`**, **230 of 46,452** change, in **69 files**.

So the harness is sensitive — it detects 230 — and **not one of them lands on
the pages this bean measured.** The caveat does not apply because the defect
does not occur there, which is a better answer than "the method is robust to
it": robustness would have to be argued, absence is observed.

230 is **my own count**, against `o29r`'s reported 229 for the same corpus. The
difference of one is unexplained and not chased: it changes nothing here, and
quoting their number as confirmed when I measured a different one would be the
failure this repository has a rule about.


## `o29r` has MERGED, so the caveat above is now verified rather than predicted

The note above was written against #1433 as an open PR, with its regex applied by
hand to a scratch copy of `pot-extract.ts`. It merged as `c6960465301`, so the
question can be asked of the code that actually ships.

Re-run on `main`'s own extractor after merging it into this branch
(`6b4c89309ed`), whose regex is `/(?<!\w)_([^_]+)_(?!\w)/g`:

| | published above | against the MERGED extractor |
|---|---|---|
| pairs with equal count | 32 | **32** |
| segments across them | 5004 | **5004** |
| identical-text anchors | 462 (9.2 %) | **462 (9.2 %)** |
| pairs showing any off-by-one shift | 0 | **0** |
| pairs with zero anchors | 3 | **3** |

Byte-identical. Their landed form simplified the lookbehind from `[_\w]` — what
was tested here — to `\w`, and in JavaScript `\w` already contains `_`, so the two
character classes are the same set and the hand-applied test was equivalent to
what shipped. **Stated because it had to be checked, not assumed**: a regex that
"looks the same" is exactly the kind of thing this bean has already been wrong
about once.
