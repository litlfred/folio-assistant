---
# folio-assistant-3mo4
title: 'EXTRACTION: cleanMarkdownText leaves literal **** in a msgid when a code span is wrapped in emphasis, and eats the spacing when there are two'
status: todo
type: bug
created_at: 2026-09-26T12:53:23Z
updated_at: 2026-09-26T12:53:23Z
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

- [ ] a code span wrapped in emphasis yields the code span's removal and the
      emphasis markers' removal, with the surrounding text and its spacing intact
- [ ] the two rows above are pinned as tests, including the second occurrence case
      that currently eats the spacing
- [ ] MEASURED AFTER: no msgid in this instance's extraction contains a run of
      `**` that is not part of prose — and the count is reported, since the
      current 47 includes legitimate glob patterns (`content/**/*.lean`) that must
      NOT be touched
- [ ] the msgids this changes are obsoleted in the existing `.po` files with
      tooling, alongside `6b8u`'s additions, `ig4a`'s removals and `lvk9`'s 3785 —
      one rewrite of the catalogues, not four

## Not in scope

Rewriting `cleanMarkdownText` as a markdown parser. The four rows above are the
contract; how few lines satisfy them is an implementation question.
