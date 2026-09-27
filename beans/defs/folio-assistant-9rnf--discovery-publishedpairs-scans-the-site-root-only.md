---
# folio-assistant-9rnf
title: 'DISCOVERY: publishedPairs scans the site root only, so a translated page in a subdirectory is invisible to every catalogue tool'
status: todo
type: bug
priority: normal
created_at: 2026-09-27T04:59:40Z
updated_at: 2026-09-27T05:00:01Z
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

- [ ] `publishedPairs` walks the site directory recursively, skipping locale
      directories at every level rather than only the first
- [ ] a page's locale siblings are resolved beside the page, not at the root —
      `guides/ar/agent-onboarding.md` for `guides/agent-onboarding.md`
- [ ] MEASURED AFTER: discovery reports 14 pages and names `agent-onboarding`
- [ ] a test with a nested fixture page, so the next reader cannot re-introduce
      the root-only scan without a red test
- [ ] the `#:` reference a derived catalogue writes is checked: the existing three
      write `agent-onboarding.md` for a page at `docs/guides/agent-onboarding.md`,
      which no resolver can follow without guessing
