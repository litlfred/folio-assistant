---
# folio-assistant-hrv2
title: AGENTS.md names the wrong file for the health graph — and the wrong file FAMILY
status: todo
type: bug
priority: normal
created_at: 2026-09-21T16:51:13Z
updated_at: 2026-09-21T16:51:13Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while closing `jijc`'s workflow half, and **not fixed there**
because it is a different file with a different owner.

`AGENTS.md` §"Repository health":

> Results are committed under `test/health/results/`, declared in
> `folio-assistant.config.json` as the `health` graph.

Both halves are wrong, and they are wrong in different ways:

| claim | measured on `main` @ `0fc29b9` |
|---|---|
| the file is `folio-assistant.config.json` | that file exists, and carries `contentType` + `dependencies` — **no `directories` at all** |
| ...so the graph is declared there | the `health` entry is in **`cat-harness/cat-harness.json`**, path `test/health/results/` |

**Two families, not one.** `<instance>/<instance>.json` is the HARNESS
declaration — directories and graph kinds, the file `harness.json` was renamed
to. `<name>.config.json` at a root is the FOLIO config — content type,
dependencies, skills. `AGENTS.md` names the second while describing the first.

## Why this is worth a bean rather than a one-line edit

The same sentence is the one a newcomer reads to find out where anything is
declared, and `AGENTS.md`'s own banner says the file is *"a cat-bootstrap
pointer, not the source of truth"* whose stale entries are **migration debt**.
So the fix is not only the sentence: it is whether anything CHECKS it.
`check:declaration-filename` covers `.ts` and, since `jijc`'s workflow half,
`.yml` — and `AGENTS.md` is neither.

That is the same shape `jijc` just closed one level out: a file class nothing
examines, reported clean because it was never read.

## Done when

- [ ] The sentence names `cat-harness/cat-harness.json` and the right family.
- [ ] A decision, recorded either way: does the declaration-filename check
      extend to markdown, or is prose deliberately out of scope? *"A rename
      REWORDS prose"* is the existing argument for out-of-scope — but this
      entry is not reworded prose, it is a wrong path a reader will follow.
- [ ] Sweep for the same confusion elsewhere in the docs before closing; one
      instance found is not one instance existing.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5, which found it and
did not pivot to it.*
