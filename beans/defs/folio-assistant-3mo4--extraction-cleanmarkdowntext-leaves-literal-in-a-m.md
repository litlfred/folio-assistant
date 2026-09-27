---
# folio-assistant-3mo4
title: 'EXTRACTION: cleanMarkdownText leaves literal **** in a msgid when a code span is wrapped in emphasis, and eats the spacing when there are two'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-26T12:53:23Z
updated_at: 2026-09-27T07:20:06Z
parent: folio-assistant-bzyu
---

Found 2026-09-26 while measuring `lvk9`, and **pre-existing rather than introduced
by it** — proven below.

`cleanMarkdownText` strips an inline code span and strips emphasis markers, but
when a code span is WRAPPED in emphasis it does neither cleanly, and it is not
consistent about which way it fails:

| input | output |
|---|---|
| ``` **`clarity-defn-single`** — fail if x ``` | `"**** — fail if x"` |
| `**bold** — fail if x` | `"bold — fail if x"` ✓ |
| ``` `code` — fail if x ``` | `"— fail if x"` ✓ |
| ``` **`a`** and **`b`** both ``` | `"and  both"` |

Row 1 leaves **four literal asterisks** in a msgid a translator is asked to
render. Row 4, the same construct twice in one string, removes everything
including the surrounding words' spacing. Two different wrong answers for one
construct.

## It is pre-existing, and here is the evidence

Extraction on `main`'s behaviour, before `lvk9` touched anything, over
`docs/reference/skill-instructions/definition-clarity-audit.md:118`:

    [118] list-item: "**** — fail if  entries ≥ , or defining-verb"

The `****` is already there. `lvk9` did not create it; it made it **visible in one
msgid instead of split across two**, which is why the parity check used to measure
`lvk9` counts 13 msgids as newly unbalanced. All 13 are this defect surfacing, not
`lvk9` regressing — the same sweep shows **342** genuinely split spans repaired.

## Why it matters beyond tidiness

A msgid is the translator's unit of work and the catalogue's key. A stray `****`
is both noise in the work and part of the key, so:

- a translator is asked to reproduce asterisks that mean nothing;
- and if this is ever fixed, every affected msgid CHANGES, obsoleting those
  entries — so the cost of leaving it grows with every translation added.

`lrbx` established the principle already: offering a translator a string that
should never have been offered *"cost real translator attention"*. Same cost,
different cause.

## Done when

- [x] a code span wrapped in emphasis yields the code span's removal and the
      emphasis markers' removal, with the surrounding text and its spacing intact
- [x] the two rows above are pinned as tests, including the second occurrence case
      that currently eats the spacing
- [x] MEASURED AFTER: no msgid in this instance's extraction contains a run of
      `**` that is not part of prose — and the count is reported, since the
      current 47 includes legitimate glob patterns (`content/**/*.lean`) that must
      NOT be touched
- [ ] the msgids this changes are obsoleted in the existing `.po` files with
      tooling, alongside `6b8u`'s additions, `ig4a`'s removals and `lvk9`'s 3785 —
      one rewrite of the catalogues, not four

## Not in scope

Rewriting `cleanMarkdownText` as a markdown parser. The four rows above are the
contract; how few lines satisfy them is an implementation question.


## Fixed 2026-09-27 — with one Done-when item declined and one deferred

**The mechanism.** Code spans are now tokenised the way Liquid expressions already
were (`\x00CODE<i>\x00`), so emphasis stripping sees something opaque between the
markers instead of nothing. `MD_BOLD_RE` requires `[^*]+`, which is why an emptied
pair survived as literal asterisks.

Reordering the regexes — strip emphasis first, then remove code spans — was
declined. It points `MD_BOLD_RE` at the inside of code spans, where
`content/**/*.lean` lives. A token containing no `*` is unreachable by
construction: a property, not a case that happens to pass.

## The falsifier caught my own prediction being wrong

I predicted exactly 190 msgids would change, the 95 carrying `**` without `****`
would be untouched, and the double-space count would hold at 8188. Measured by
dumping all 46 780 msgids before and after and diffing:

| | predicted | actual |
|---|---|---|
| msgids changed | 190 | **209** |
| carrying `**` but not `****` | 95 | 95 → **76** |
| carrying a double space | 8188 | 8188 → **8202** |

Both surprises are the same defect in a shape this bean did not record. **19
msgids** had TWO emphasis runs, the first wrapping a code span: emptying it let
`MD_BOLD_RE` start one character late and pair the first run's opening `**` with
the SECOND run's closing one, consuming the text between and leaving a stray `*`
at the front and `**` before the punctuation. Real example, verbatim from
`docs/reference/skill-instructions/kg-navigation.md:70`:

    source: **`skill_list`** — every servable skill **with its one-line summary**,
    before: "* — every servable skill with its one-line summary**,"
    after:  "— every servable skill with its one-line summary,"

The +14 double spaces are `a **`x`** b`: with the asterisks gone the two spaces
become adjacent. Expected once seen, and consistent with not collapsing whitespace.

**Verified no content was lost**, over all 209: zero gained an asterisk; 198 are
identical once asterisks and whitespace are normalised; the other 11 differ only
by punctuation re-attaching to its word (`summary ,` → `summary,`), which is the
correct reading of the source.

## Done-when item 3 is DECLINED, and it needs the owner

The item asks that row 4's spacing be fixed. It is not, deliberately. That double
space is not specific to this defect — removing ANY code span leaves one — and
**8188 of 46 780 msgids (17.5 %) already contain one**. Collapsing would obsolete
8188 catalogue entries rather than 12, which is a corpus-wide reformatting
decision rather than a bug fix. This bean was written without that number. The
test pins `"and  both"` as it is, with the reason in its body, so the choice is
visible rather than forgotten. **Put to the owner; unanswered.**

## Done-when item 4 is PARTLY done, and the "one rewrite" instruction is broken

The item asks for one catalogue rewrite covering this, `6b8u`, `ig4a` and `lvk9`
rather than four. Three gates went red on the msgid change and could not be left
red, so: `translation:pot` regenerated 16 stale `.pot` files, `translation:obsolete`
marked **12** stale msgids `#~`, and `translation:block-qa` plus
`translation:status` followed. `6b8u`'s remaining item will cause one more
rewrite. Reporting that rather than pretending the instruction was honoured.

**Nothing was deleted.** Checked as a MULTISET of every non-empty `msgstr`, active
and obsolete, across all 73 `.po` files against `HEAD`: **0 lost, 0 gained.** The
12 entries moved to `#~` carrying their translations, revivable by a human.

## Falsified by breaking

Reverting the fix reddens 4 of the 8 new tests. The other four guard the opposite
direction, the deliberate spacing choice, and the repair that was NOT chosen; each
says in its own body that it passes either way. My first version of the
asymmetric-marker test used a constructed single-run fixture that produced
identical output before and after — it pinned nothing while its comment claimed to
pin the defect. Replaced with the real line.

bun test 12194 pass 0 fail; tsc clean; eslint 0 errors; all 161 gates the `gates`
job runs, 0 failures.
