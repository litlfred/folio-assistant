---
# folio-assistant-xo3t
title: 'STATE PAGES: a third of the registry descriptions render markdown backticks literally'
status: completed
type: task
parent: folio-assistant-o3xy
created_at: 2026-09-20T22:53:52Z
updated_at: 2026-09-20T22:53:52Z
---

`registry()` in `state-visualizer.ts` writes each graph's declared description through `esc()` only, so the markdown backticks in it reach the page as literal characters: "what the daily sweep under \`test/health/\` wrote".

Measured 2026-09-20 across both declarations: **12 of 34** declared descriptions carry a backtick in the first sentence — the part the registry shows — so this is a third of the rows on every state dashboard, not an isolated one. Found by looking at the rendered page; invisible in a diff.

The fix is ordering, not parsing: escape first so any `<` in the description becomes an entity, THEN turn the surviving backtick pairs into `<code>`. The only raw angle brackets are the ones the code introduces.

## Done when
- [x] Backticked spans in a declared description render as code, not as backticks
- [x] A description containing angle brackets is still escaped — `<bib-slug>/` is in the corpus and would be the injection if the order were reversed
- [x] An unpaired backtick is left alone rather than swallowing the rest of the line

## Summary of Changes

`describe()` in `state-visualizer.ts`: escape first, then turn the surviving
backtick pairs into `<code>`. The angle brackets the function emits are the
only raw ones, so a description cannot inject markup by either route.

Not a markdown parser — only the one span type that occurs in this field.

**The order is the whole fix, and the corpus proves it rather than a
hypothetical**: `library` is declared as "one `<bib-slug>/` per ingested
document", so substituting before escaping would emit the code element as
text and leave the description's own brackets live. Falsified in both
directions: reversing the order fails 3 tests, making the match greedy fails
4.

Zero literal backticks remain in the registry rows of all six dashboards.

