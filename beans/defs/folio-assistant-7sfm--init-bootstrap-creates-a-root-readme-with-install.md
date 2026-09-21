---
# folio-assistant-7sfm
title: 'INIT: bootstrap creates a root README with install status — and says why creation at initialisation is not a process write'
status: todo
type: task
created_at: 2026-09-21T05:50:07Z
updated_at: 2026-09-21T05:50:07Z
parent: folio-assistant-zzmr
---


Carved out of `ie9l` when issue #592 was closed (2026-09-21, owner's word).
Two of `ie9l`'s six `Done when` boxes, together because `ie9l` itself showed
they are one thing.

Owner, on `ie9l`:

> whwn cat-harness boostrap init takes over it creates README.md if it does
> not exist and add link and overall harness install statue.

**Neither box was started.** Nothing in `cat-bootstrap`'s initialisation
writes a root README, and the rule below is written nowhere — grepped
`skills/` and `docs/` on 2026-09-21, no match.

## Why the two are one bean

`ie9l` found an apparent contradiction in its own asks and resolved it:

> Ask 3 says bootstrap init **creates** README.md if absent — a write. Ask 6
> says it is an asset **like memories** — context, never written by a
> process. Both hold, because **initialisation is not process runtime.**

So whoever implements the write must also state the rule, in the same change,
or the next reader finds a `context` graph being written and calls it a
defect. Splitting them is how the statement never gets written.

## Done when

[ ] `cat-bootstrap`'s initialisation creates a root `README.md` when absent
[ ] It carries the link and the overall harness install status
[ ] Wherever this lands, it states that creation at INITIALISATION is not a
    process write — `content-context-and-state-graphs` is the likely home
