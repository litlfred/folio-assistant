---
# folio-assistant-t7ao
title: One bean with unparseable front matter takes down the whole store, and 92 gates passed over it
status: todo
type: bug
priority: high
created_at: 2026-09-21T18:54:30Z
updated_at: 2026-09-21T18:54:49Z
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
