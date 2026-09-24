---
# folio-assistant-vq8g
title: 'THIN DECISION RECORDS: the option counter reads one markdown form, so it calls the two best analyses empty and over-counts a third'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T18:00:40Z
updated_at: 2026-09-23T18:02:56Z
parent: folio-assistant-1xhc
---


`bean-thin-decision-records` counts an options section's **top-level markdown
list items**. That is the detector's own invention: `madr.md` asks for *"at least
two, every one real"* and says nothing about markdown. Measured across the 12
decision records the store has grown to, the rule is wrong in **both**
directions.

## Under-count — and it is the worst kind

`j6t3` and `xgd8` enumerate their options as bold paragraphs:

    **A. Generate the slash commands.** Emit `.claude/commands/<name>.md` …
    *For:* smallest change; the seam exists.
    *Against:* Claude Code only.

Both counted **zero**. And both carry **five** options against the store's
typical three — `xgd8` even states its own count in prose (*"Five, ordered by how
much they add"*) and lists the four criteria it judges them on. So **the two most
developed analyses in the corpus were the two reported empty**, under an action
that reads:

> Either list the options that were weighed, or **drop the section** — an empty
> options section claims an analysis that did not happen.

Following that would have destroyed the best decision records here. That is
worse than `o5qj` and `thux`, where the finding merely could not be cleared; this
one's remedy is actively destructive when the finding is wrong.

## Over-count

`dhvf` writes four options as `### A —` subheadings with Pro/Con/Cost bullets
beneath each. Those bullets are top-level list items, so it counted **ten** for
four options. The threshold (`< 2`) survives that, but the reported number is a
measurement and it was wrong.

## The rule

Three enumeration forms, and the **most structured one present wins**:

1. an option subheading — `### A — …`, `### Option B:`
2. a bold enumerated paragraph — `**A. …**`
3. bare top-level list items

**Never summed.** A section enumerates one way and the other matches are
sub-points of those options; summing `dhvf` gives 14 for 4.

A single capital letter is required after the optional `Option`, so an ordinary
subheading inside the section does not match — `j6t3` really carries
`### Tier 1 — a person types these`, and a looser rule would inflate every bean
that explains its options under headings of their own.

## Measured after the fix

    dhvf   10 -> 4
    j6t3    0 -> 5
    xgd8    0 -> 5
    the other nine   unchanged at 3
    records thin     0

## Done when

- [x] A bold-enumerated options section is counted
- [x] A subheading-enumerated section is counted by its options, not their bullets
- [x] The forms are not summed; the most structured present wins
- [x] An ordinary subheading inside the section is not an option
- [x] The nine records that already worked do not move
- [x] The threshold's basis records both error directions
- [x] Verified over the real store

Parent `1xhc`. Third of the family after `o5qj` and `thux`; surfaced from
[#860](https://github.com/litlfred/folio-assistant/issues/860).
