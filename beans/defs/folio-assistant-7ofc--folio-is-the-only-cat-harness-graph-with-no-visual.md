---
# folio-assistant-7ofc
title: folio/ is the only cat-harness graph with no visualiser — the owner ruled it needs one, owned by cat-harness
status: todo
type: feature
parent: folio-assistant-6lb8
created_at: 2026-09-22T10:48:40Z
updated_at: 2026-09-22T10:48:40Z
---

Owner, 2026-09-22: *"folio must be in cat-harness and visualizer owned by it. transations too... there should be visualizer."*

Measured against that ruling — the three graphs the ruling names:

| graph | in cat-harness | visualiser declared | present |
|---|---|---|---|
| `library/` | yes | `docs/cat-harness/library/cat-harness/index.html` | yes |
| `translations/` | yes | `docs/translation-status/index.html` | yes |
| **`folio/`** | yes | **none** | — |

So the ruling is already satisfied twice over and once not.

`folio` is the only `renderable` graph kind — it comes out as the website —
which is presumably why nothing asked it for a separate viewer, and why
`check:subgraph-coverage` does not report it. The owner's ruling says that
is not enough: the folio owes a view OF ITS CONTENTS, owned by cat-harness,
the same shape its two siblings already have.

`cat-harness/folio/` holds three files today — `bootstrap.json`,
`cat-harness.json`, `folio-assist-core.json` — the per-instance landing
stickies.

## Done when

- [ ] a generator writes a view of what `folio/` holds
- [ ] `coverage.visualiser` declared on the folio entry, and it resolves
- [ ] the page carries the folio mount, like every other library surface
- [ ] a witness reads the generated page, not a fixture
