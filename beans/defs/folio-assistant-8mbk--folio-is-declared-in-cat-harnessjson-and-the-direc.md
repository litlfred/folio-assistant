---
# folio-assistant-8mbk
title: folio/ is declared in cat-harness.json and the directory does not exist — the dh4f shape, undocumented this time
status: todo
type: bug
parent: folio-assistant-zzmr
created_at: 2026-09-22T08:21:16Z
updated_at: 2026-09-22T08:21:16Z
---

Measured 2026-09-22 while opening jpjt.

`cat-harness.json` declares 34 directories. Three of them are not on disk:

| id | path | documented? |
|---|---|---|
| `library` | `library/` | YES — the description argues the cost at length (`wwi6`, `a02m`) and says outright "IT IS THE dh4f SHAPE AND THAT IS KNOWN, NOT OVERLOOKED" |
| `translation-sources` | `translations/` | not checked yet |
| `folio` | `folio/` | NO — description is one line: "Authored content of this instance itself... Holds the landing sticky" |

`library` is fine: a deliberate cost, argued, bounded. `folio` is the one
to look at — it claims to HOLD the landing sticky and there is no directory
to hold it in, so a consumer scanning it reports a clean run over nothing.

Second finding, and it is about a bean rather than the code: `j2if` states
"folio/ is deliberately absent from cat-harness.json". That was true when
written and is false now. A bean asserting the opposite of the declaration
is worse than one that says nothing, because the next agent reads it as the
reason not to look.

## Done when

- [ ] establish whether `folio/` should exist here or the declaration should go
- [ ] same question for `translations/`
- [ ] if the declarations stay, they carry the `library` entry's reasoning
- [ ] `j2if`'s stale sentence corrected
- [ ] a check that a declared directory exists, or a recorded reason there is none
