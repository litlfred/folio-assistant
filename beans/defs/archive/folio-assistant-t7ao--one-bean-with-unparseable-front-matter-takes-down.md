---
# folio-assistant-t7ao
title: One bean with unparseable front matter takes down the whole store, and 92 gates passed over it
status: completed
type: bug
priority: high
created_at: 2026-09-21T18:54:30Z
updated_at: 2026-09-21T20:20:13Z
parent: folio-assistant-1xhc
---


Found 2026-09-21, by breaking it. Not a hypothetical: the bad bean was mine,
it was committed, and the full gate set passed over it.

## What happened

`224e0beac8` committed `beans/defs/folio-assistant-sqtq--*.md` whose line 8
was a literal `\1` — an unsubstituted sed backreference where `updated_at:`
belonged. `bun run gates --all` was run on that tree: **92 gates, all green.**
It was pushed as `f59f383`.

The next `beans list` in a fresh shell:

```
Error: loading beans: loading .../folio-assistant-sqtq--*.md:
parsing front matter: yaml: line 8: could not find expected ':'
```

Not "that one bean is unreadable" — **no beans at all**. `list`, `roadmap`
and `prime` all fail the same way, because the CLI loads the store as a unit.

## Why this is worse than an ordinary broken file

`beans prime` is the FIRST command in this repo's cold start, named in the
first line of `AGENTS.md`. So one malformed bean means every agent that
starts after it gets no work plan, in the one command whose whole job is to
hand them one. The failure is total, immediate, and attributable to a file
whose author has already moved on.

And it is silent in exactly the wrong place. 195 open beans, a `check:bean-bodies`
that reads titles, bodies, checklists and blockers — and none of it parses
the front matter as YAML. `check-bean-bodies` catches `folded-title`, which
is a front-matter SHAPE defect, so the gap is not that front matter is
unexamined; it is that it is examined by regex, and a regex over a broken
document does not notice the document is broken.

That is `xom7`: a check that cannot fail is indistinguishable from one that
passes. The store was unreadable and the report said 92/92.

## The fix is small and the gate is cheap

One pass over `beans/defs/*.md`: split the `---` fences, hand the block to
the same YAML parser everything else here uses, and report the file and line
on a throw. It is the check `beans` itself cannot provide, because `beans`
cannot report a file it could not load past.

Three states, as ever: parses, does not parse, or could not be read. The
third fails rather than passing.

## Done when

- [ ] a gate parses every bean's front matter as YAML and names the file and
      line when one does not
- [ ] it is wired into `code-quality-gates.yml`, so `gates.ts` picks it up —
      a check that is not in the workflow is `sb6z`'s complaint, one level in
- [ ] a test that FEEDS IT A BROKEN BEAN and asserts it fails. A gate for
      this defect that has never seen the defect is the defect

## Built 2026-09-21 — and it found two defects on `main` on its first run

`bun run gates --all`: **98 gates, green**, with `check:bean-front-matter`
among them.

### TWO conditions, and conflating them would have been wrong

The `yaml` package rejects a duplicate map key; the Go loader inside `beans`
accepts it. So "this file is bad" splits in two, and the discriminator is
whether a TOLERANT parse (`uniqueKeys: false`) still refuses it — measured,
not assumed:

| condition | tolerant parse | what it costs |
|---|---|---|
| `unparseable` | refuses | the whole store, for every reader, now |
| `duplicate-key` | accepts | the file says two things; the winner is the reader's parser |

Only the first is this bean's emergency. Gating the repository on the second
would stop work over somebody else's botched conflict resolution.

### The two it found

Both pre-existing on `main`, both botched merges, neither mine:

- **`1hvo`** — two `title:` lines, so what that bean is CALLED depends on who
  loads it. Introduced by `806baa3a9c`, a merge whose own message says it
  "kept both halves".
- **`7u3g`** — two `updated_at:` lines, which its own body confesses to: it
  fixed the duplicated BLOCK and left the duplicated KEY.

**Not repaired here.** `check-bean-bodies` states the rule this follows —
*"Outstanding defects are repaired by the bean's OWNER, not by this check and
not by whoever ran it"* — and repairing one means CHOOSING which value was
meant, which is a judgement about their work. `7u3g` is `scrapped`, where
touching anything risks reading as resolving a sibling's bean. Both are
baselined by id, so a NEW duplicate fails, and the check says when a baseline
entry no longer matches so a repaired bean does not quietly excuse a fresh
defect under the same id.

### It nearly shipped with the defect it exists to catch

Written first as `repoRootFor(process.cwd())`, it answered `/home/user`, found
no store, and exited **0** with *"no store in this repository"* — over a
repository holding 629 beans. A gate that reports clean because it looked in
the wrong place is `dh4f`, and this one would have shipped wearing its own
fix's clothes. Anchored on the module (`resolve(import.meta.dir, "..")`), as
`check-bean-bodies` does and for the `a6kl` reason.

### Falsified

The fixture is the REAL failure — `sqtq`'s front matter as committed in
`224e0beac8`, line for line, `\1` and all — and the test asserts it is caught
at FILE line 8, which is where a person opens the file to and what `beans`
itself reported. Three mutations, each caught by exactly one test: dropping
the `+1` line offset, making the tolerant parse always succeed, and reporting
an absent store as an empty one.

## Done when — status

- [x] a gate parses every bean's front matter as YAML and names the file and
      line when one does not
- [x] it is wired into `code-quality-gates.yml`, so `gates.ts` picks it up
- [x] a test that FEEDS IT A BROKEN BEAN and asserts it fails
