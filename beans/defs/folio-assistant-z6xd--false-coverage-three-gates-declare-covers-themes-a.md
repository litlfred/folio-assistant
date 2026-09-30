---
# folio-assistant-z6xd
title: 'FALSE COVERAGE: three gates declare @covers themes and none reads the themes graph — the kind reads covered over ground nothing reaches'
status: todo
type: bug
created_at: 2026-09-30T11:28:43Z
updated_at: 2026-09-30T11:28:43Z
parent: folio-assistant-1swy
---

Found 2026-09-30 during a goal review, and confirmed independently before
being written down.

`bun run audit:coverage` reports the `themes` graph kind as:

```json
{"kind": "themes", "state": "covered", "directories": ["who-iris/themes"],
 "criteria": [], "gates": ["bun run check:theme-art:check",
 "bun run theme:page:check", "bun run themes:css:check"],
 "typed": true, "hasFiles": true}
```

**None of those three gates reads the `themes` graph.** All three read
`cat-harness/schemas/themes.ts` — the platform's own twelve themes, which the
graph-kind registry explicitly says are *not* this graph: *"They are furniture
in `cat-harness/schemas/themes.ts` … a palette read off a WHO style guide is
subject matter, and subject matter does not live in the platform."*

Measured: `grep` for `who-iris/themes`, `graphKinds.*themes` and
`directoriesForGraph.*themes` in `gen-themes-css.ts`, `render-theme-sheet.ts`
and `check-theme-art.ts` — **zero hits in all three**. The one directory
declared for the kind (`who-iris/themes/`, holding `iris-web` and
`who-wpro-publication`) is reached by none of them, and `criteria` is empty.

## This is the defect `@covers` was built to prevent

`audit-coverage`'s own skill says the gate half is **declared rather than
inferred** because inferring it *"would credit a gate that reads `beans/defs/`
incidentally"*. A declaration removes that — but only while the declaration is
TRUE. Here three gates assert coverage of a kind they never open, so the report
reads `covered` over ground nothing reaches. **Worse than an undeclared gate**,
which at least counts itself as a gap and keeps every verdict an upper bound.

**And the first of the three lines was mine.** `gen-themes-css` was annotated
`@covers themes` on 2026-09-24 in the batch that closed bean `3srh`, from the
script's title rather than its scan set — the exact mistake `3srh`'s own summary
says it avoided by *"reading each one's actual SCAN SET rather than its title"*.
Two siblings then copied the pattern onto `render-theme-sheet` and
`check-theme-art`. So the convention's author got its first instance wrong and
the error propagated by imitation, which is the strongest argument for checking
a declaration mechanically rather than trusting it.

## Why it matters now rather than eventually

`themes` is the kind that carries PER-INSTANCE theming, and bean `v8n5`
(2026-09-30) independently measured the consequence: *"The harness surfaces do
not use them. The board tile, the navbar entry and any sticky resolve a `theme`
name against the platform's own themes."* So the one kind whose coverage matters
for GOAL 3's themed harness is the one reading falsely covered.

## Done when

- each of the three either reads the `themes` graph, or its `@covers` names
  what it actually grades (the platform theme module is not a declared graph, so
  `@covers none` with a reason may be the honest answer for all three);
- something reads `who-iris/themes/themes.ts`, or `themes` reports its true
  state — `typed-only` at best, since `ThemeSchema` does validate it;
- a check catches the general case: **a gate declaring `@covers <kind>` that
  never resolves a directory of that kind.** Without that, the next wrong
  declaration is found by a person again. This is the part that stops the class
  rather than the instance.
