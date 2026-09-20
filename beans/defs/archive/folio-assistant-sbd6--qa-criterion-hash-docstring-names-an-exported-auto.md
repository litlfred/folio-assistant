---
# folio-assistant-sbd6
title: qa-criterion-hash docstring names an exported *_AUTOMATED_CHECKERS record the code never looks for
status: completed
type: bug
priority: low
created_at: 2026-08-24T19:37:21Z
updated_at: 2026-08-24T19:37:21Z
---

`content/pipeline/qa-criterion-hash.ts`, module docstring, section "What is hashed".

It said the criterion's dispatch entry is *"its property in the exported
`*_AUTOMATED_CHECKERS` record"*. The code has never cared about the record's
name, nor whether it is exported. `findCriterionEntry` walks the whole source
file and takes the first `PropertyAssignment` whose **key** equals the criterion
id, in any object literal at any depth:

```ts
if (ts.isPropertyAssignment(node) && keyText(node.name) === criterionId) {
  found = node;
```

## Why the sentence was expensive

A session (2026-08-24) chasing a hash question read that sentence as a contract,
went looking for which module exported a `*_AUTOMATED_CHECKERS` record, and
audited naming conventions that carry no weight. The real behaviour has two
consequences the old sentence hid, and both matter:

- a dispatch table named anything at all is found, so there is no convention to
  keep;
- a property with that key **somewhere else in the module** would be found
  first, since the walk stops at the first match. That is the actual sharp edge,
  and the docstring pointed away from it.

## Fixed

Docstring corrected on `claude/gracious-dijkstra-0ijp2l`, including an explicit
note that the old wording was wrong so the next reader does not re-derive it
from an old checkout. Code unchanged. Gate: `./scripts/tests/run-tests.sh`
**808 pass, 0 fail** — the documented baseline, unchanged.
