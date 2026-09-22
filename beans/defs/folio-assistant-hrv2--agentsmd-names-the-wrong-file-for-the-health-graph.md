---
# folio-assistant-hrv2
title: AGENTS.md names the wrong file for the health graph — and the wrong file FAMILY
status: completed
type: bug
priority: normal
created_at: 2026-09-21T16:51:13Z
updated_at: 2026-09-21T17:43:43Z
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
declared, and `AGENTS.md`'s own banner says the file is *"a bootstrap
pointer, not the source of truth"* whose stale entries are **migration debt**.
So the fix is not only the sentence: it is whether anything CHECKS it.
`check:declaration-filename` covers `.ts` and, since `jijc`'s workflow half,
`.yml` — and `AGENTS.md` is neither.

That is the same shape `jijc` just closed one level out: a file class nothing
examines, reported clean because it was never read.

## Done when

- [x] The sentence names `cat-harness/cat-harness.json` and the right family.
- [x] A decision, recorded either way: does the declaration-filename check
      extend to markdown, or is prose deliberately out of scope? *"A rename
      REWORDS prose"* is the existing argument for out-of-scope — but this
      entry is not reworded prose, it is a wrong path a reader will follow.
- [x] Sweep for the same confusion elsewhere in the docs before closing; one
      instance found is not one instance existing.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5, which found it and
did not pivot to it.*

---

## Done 2026-09-21 — and the bean's own second Done-when asked the wrong question

Issue [#766](https://github.com/litlfred/folio-assistant/issues/766).
`bun run gates` **93 of 93** (the set grew by two: the new gate and its
CI-invocation registration).

### The question this bean asked, and why it was aimed at the wrong check

> *does the declaration-filename check extend to markdown, or is prose
> deliberately out of scope?*

Neither answer would have caught this defect. `check:declaration-filename`
hunts the **retired** name `harness.json`. `AGENTS.md` does not name the
retired file — it names `folio-assistant.config.json`, a file that **exists**,
that opens, and that declares no graph at all. **A wrong name is not a retired
name**, and no extension of that gate, to markdown or anywhere, sees it.

Two questions were folded into one and are now separated: the retired-name
markdown backlog is `vzur`, with the order stated (**clear the backlog, then
turn a gate on** — not the reverse).

### What was built instead

`check:declaration-claims` — prose pairing a declared graph id with a
declaration file, verified against the declarations.

**The vocabulary is DERIVED, and that was the decision that mattered.** The
first draft matched one sentence shape and found exactly **one** claim in the
whole corpus: the broken one. A rule fitted to a single example generalises
only as far as its phrasing, and the next such sentence will be worded
differently — leaving a gate reporting a clean run over a corpus of zero.
Anchoring instead on the graph ids the declarations actually declare took the
corpus **1 → 6 on the same tree, and all six were wrong**.

### Four things the build got wrong, each caught by running it

1. **`readDeclaration` threw on this repository's own declaration** — the
   `folio` graph kind is contributed by a dependency and must be registered
   first. The check exited **2, "NOT a pass"**, which is the three-state
   discipline working on its first run. A glob for `*.json` would have skipped
   the file silently and reported a clean run over a corpus missing its largest
   instance.
2. **Declared paths are REPO-relative, not instance-relative.** A draft
   prefixed each with its declaring instance and produced `cat-harness/beans/`
   and `cat-harness/fsh-guts/`, neither of which exists — so nothing was
   pruned and the whole bean store came back into the corpus.
3. **Pruning by first path segment would have skipped `who-iris/` entirely.**
   `library` is declared at `who-iris/library/`, `agent-skills/library/` and
   `folio-assistant-sci/library/`. Three instances silently unexamined,
   reported as clean — `dh4f` arriving through a convenience.
4. **A false positive, found the moment the real defect was fixed.**
   `AGENTS.md`'s actor/role table puts the `` `cat-harness` graph `` in the
   **Skill** row and `scenarios/roles.json` in the **Role** row. Flattened,
   they paired. A table row is now its own block — the same shape as `k59d`'s
   *"an arrow is not always a dependency"* guard, and six of the ten tests are
   false-positive guards for that reason.

One near-miss worth recording because it was one edit away: the filename
pattern rejected anything containing `/`, so writing the clearer path form
(`cat-harness/cat-harness.json`) would have made the claim **invisible** rather
than verified. A silent pass, caused by the correction.

### What is NOT fixed here

`vzur` — 162 occurrences of the retired name across 83 markdown files, four of
them baselined in `scripts/declaration-claims-baseline.json`. Removing a
baseline entry is part of that work: a stale entry fails the gate, so the file
shrinks rather than fossilises.

`fsh-guts/`, `beans/` and every `library/` are excluded, **derived from the
declarations** rather than listed: each is already declared as a place for
retired or foreign material, and a document there naming a retired filename is
correct history.
