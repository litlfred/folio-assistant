---
# folio-assistant-9rnf
title: 'DISCOVERY: publishedPairs scans the site root only, so a translated page in a subdirectory is invisible to every catalogue tool'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-27T04:59:40Z
updated_at: 2026-09-27T06:02:12Z
parent: folio-assistant-bzyu
---

## The gap

`publishedPairs` in `cat-harness/content/pipeline/derive-po.ts` reads the site
directory with a single `readdirSync`, so it sees pages at the root and nothing
below it. Measured on `main` at `c6960465301`:

| | |
|---|---|
| published translated pages | **14** |
| of those, found by discovery | 13 (top level) |
| **invisible** | **1** — `guides/agent-onboarding.md`, in ar, es, fr, ru, zh |
| locale-pairs missed | **5** |

`bun run cat-harness/content/pipeline/derive-po.ts` reports `13 page(s) x 5
locale(s)` and the word `agent-onboarding` appears zero times in its output.

## Why it matters more than 1-of-14 suggests

That one page is where **every** stale msgid in the corpus lives. The recursive
staleness measurement finds 41 stale of 6168 across the markdown-sourced
catalogues, and all 41 are in `ar`, `ru` and `fr/agent-onboarding.po` — the page
discovery cannot reach. So the tool that exists to keep catalogues current is
structurally unable to touch the only catalogues that are not.

It is also the reason `lvk9`'s remaining item cannot be discharged by
re-deriving: the better repair is unavailable until this is fixed.

## Same shape as `bjzs`, one level down

`bjzs` records `kg:audit`, `render:bpmn` and `check:workflow-refs` running "at the
root only, so 15 nested instances are counted and none is audited". This is that
defect inside one instance: a scan that stops at the first level, reporting a
confident count over the subset it can see.

**And it is the third artefact in this cluster with the same blind spot.** Two
staleness scripts resolved a catalogue's source as `join(DOCS, page + ".md")` and
so covered top-level pages only — one of them reported "0 of 14 pages differ" and
was used to claim, wrongly, that no catalogue was stranded (see `o29r`). The habit
is treating "the pages" as "the pages I can see without recursing", and it has now
cost a wrong published claim and a missed defect.

## Done when

- [x] `publishedPairs` walks the site directory recursively, skipping locale
      directories at every level rather than only the first
- [x] a page's locale siblings are resolved beside the page, not at the root —
      `guides/ar/agent-onboarding.md` for `guides/agent-onboarding.md`
- [x] MEASURED AFTER: discovery reports 14 pages and names `agent-onboarding`
- [x] a test with a nested fixture page, so the next reader cannot re-introduce
      the root-only scan without a red test
- [x] the `#:` reference a derived catalogue writes is checked: the existing three
      write `agent-onboarding.md` for a page at `docs/guides/agent-onboarding.md`,
      which no resolver can follow without guessing


## Done 2026-09-27 — and item 1 was done DIFFERENTLY from how it is written

Discovery now reports **14 pages x 5 locales** and names `guides/agent-onboarding`.

**Item 1 asked for a recursive walk in `publishedPairs`, and I did not write one.**
`buildTranslationIndex` already walks the site recursively, already skips Jekyll's
`_`-prefixed machinery at every level, and is already what `driftFor` and
`check-translation-catalogue` read. A second recursive walker here would have been
a second answer to "which pairs are published", free to disagree with the first —
and the disagreement surfaces as one gate reporting a catalogue missing that
another reports present. So `publishedPairs` DELEGATES to the index. Recording the
deviation rather than ticking the box quietly, because the next reader will look
for the walk the bean asked for and not find it.

**The two predicates are not the same, which is the thing that had to be checked
rather than assumed.** The old scan decided a page was a translation by WHERE IT
SAT — in a locale directory, with a same-named file beside the root. The index
reads what the page DECLARES: `lang:`, `nav_exclude: true`, and above all
`translation_source:`. Measured in BOTH directions on this corpus, because a
superset check alone would have hidden a drop:

| predicate | pairs |
|---|---|
| layout (recursive) | 70 |
| index (declaration) | 70 |
| found by layout, not by index — would be DROPPED | **0** |
| found by index, not by layout | 0 |

`translationPathFor` composes the translation path from a page name and a locale,
because `derive` is handed those and not the index. It agrees with the index on
**all 70** pairs, with 0 composed paths absent on disk, and a corpus test pins
that at exactly 70 so it cannot go vacuous.

## Item 5's answer is a finding, not a pass

The three committed catalogues DO carry an unfollowable reference — measured:
every `#:` in `ar,fr,ru/agent-onboarding.po` reads `agent-onboarding.md` for a
page at `docs/guides/agent-onboarding.md`. Newly derived output is now correct
(the nested test asserts `docs/guides/deep.md`), but the existing three are only
resolvable because `resolveSource` searches by unique suffix and that suffix
happens to be unique. **It is not guaranteed to be**: 65 of 585 source pages here
share a basename, `getting-started`, `document-ingestion` and `index` among them,
and all three of those are translated today.

## Re-deriving those three is BLOCKED, and not by this bug

With the page visible, all five pairs refuse `count-differs`: source 80
translatable constructs against 79 (ar), 79 (es), 62 (fr), 79 (ru), 78 (zh). So
`lvk9`'s "re-derive after 9rnf" cannot be discharged by this tool — the
translations have drifted structurally from the source, which is a corpus fact for
a human to adjudicate under #206, not something to re-translate around. The 41
`#~` obsoleted entries therefore STAND rather than being superseded.
