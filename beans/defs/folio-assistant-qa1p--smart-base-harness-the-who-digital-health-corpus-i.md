---
# folio-assistant-qa1p
title: 'SMART-BASE HARNESS: the WHO digital-health corpus, its methodologies and its voices'
status: scrapped
type: task
priority: high
created_at: 2026-09-22T08:34:56Z
updated_at: 2026-09-22T08:58:46Z
parent: folio-assistant-2yyh
---

Duplicate of `folio-assistant-2yyh`, which carries the same title and body and is the one the child beans (`ve07`, `3gef`, `wkt1`, `qnvy`, `7mi0`, `fgkb`) are parented to.

## Reasons for Scrapping

Created by an invocation that SUCCEEDED while its caller failed: `beans create --json` returned `{"success": true, "bean": {...}}`, the calling shell pipeline read `['id']` off the top level instead of off `bean`, threw `KeyError`, and the agent read the traceback as "the bean was not created" and ran the command again. The store now held two.

This is the exact failure `todo-manager` §"Check before you create" documents — **`beans create` is not idempotent and dedupes on nothing** — reached by a new route: not an unguarded re-run of a loop, but a successful write whose confirmation the caller could not parse. A create whose output is parsed must be treated as having happened until a LIST says otherwise; a parse error is not evidence of a failed write.

Scrapped rather than deleted, per `bean-coordination`: a deleted bean leaves a sibling unable to tell abandonment from accident, and this one is worth keeping because the near-miss is the lesson.
