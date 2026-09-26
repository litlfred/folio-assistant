---
# folio-assistant-hloc
title: gen-skill-docs flattens packages but leaves 120 non-skill links addressing the source layout
status: completed
type: task
priority: normal
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-26T19:38:18Z
parent: folio-assistant-ahvw
---

Measured 2026-09-25, after `mi97` took `check:subgraphs`' unresolved-link count
in `docs/` from **246** to **120**.

The 120 that remain are NOT published-tree addresses, which is what the
`siteResolved` bucket assumes of them. Classified by target:

| target kind | count |
|---|---|
| directory or generated path | 33 |
| `.md` | 32 |
| `.html` | 19 |
| `.bpmn` | 17 |
| `.ts` | 12 |
| `.json` | 4 |
| `.py` | 4 |

Almost all are in `docs/reference/skill-instructions/`, and they are one
defect with several correct answers. `gen-skill-docs.ts` publishes every skill
into a FLAT directory; `rebaseLinks` (added for `mi97`) repoints a link whose
target is another published skill, and deliberately leaves everything else
alone rather than rewriting it into a path that merely exists. What is left is
every link that leaves the knowledge graph:

- **`.bpmn`** — the generator already publishes a process as
  `processes/<stem>.html` for a skill's OWN process. A `.bpmn` link in a body
  should resolve the same way.
- **`.ts`, `.json`, `.py`** — source files, not site pages. The generator
  already composes GitHub blob URLs for its "source" and "edit" links
  (`repoRelative`, bean `oe98`); a body link to a source file wants the same.
- **`methodologies/*.md`, `docs/proposals/*.md`** — published elsewhere on the
  site, so they want a site-relative path, not a blob URL. Which needs the
  published location of each, the way `rebaseLinks` needs the published name
  of each skill.
- **directories** — a link to `skills/folio-core/` has no single answer.

## Done when

- [ ] Each kind above has a stated treatment, and the generator applies it.
- [ ] A target the generator cannot place is still LEFT ALONE — the rule
      `rebaseLinks` already keeps. A plausible-looking rewrite turns a broken
      link into an undetectable one.
- [ ] The `siteResolved` count falls, and what remains is genuinely the
      published tree (`api/`, generated pages), so the bucket's own
      justification becomes true of its contents.

## Why this is separate from `mi97`

`mi97` was *"these links are one `../` too deep"* — one cause, one repair,
verifiable against disk before it is made. This is four different questions
about where a non-skill artefact lives on the site, and answering them wrong
is worse than leaving the links broken, because a rewritten link stops being
reported.

_2026-09-26T10:39:59Z_ — Claimed by claude/sleepy-rubin-mr6kdu — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## Box 3 answered, 2026-09-26 — and it found the last of this bean's own defect

Box 3 asked that the `siteResolved` count fall and that what remains be
genuinely the published tree. Unmeasurable until now, because 775 translated-page
links (`ahab`) dominated the bucket. With those gone:

| | when this bean was written | now |
|---|---|---|
| `siteResolved` over `docs/` | 340 | **70** |
| `docs/reference/skill-instructions/` — this bean's subject | 76 | **1** |

And the survivors were NOT all published tree. Three remained here, and two
were this bean's own sentence:

```text
harness-requirements.md        ](../../../beans/defs/)
    -> cat-harness/beans/defs/                     MISSING (real: beans/defs/)
milnor-exposition-standard.md  ](../../../folio-assistant-sci/library/milnorlink/)
    -> cat-harness/folio-assistant-sci/...         MISSING (real: folio-assistant-sci/...)
```

(Fenced at column 0. An indented block would leave those `](` link-shaped
and `check:subgraphs` would report this bean as carrying dangling links —
which it did, twice today, in `ahab` and `mi97`. `ig4a`.)

A published page sits one directory DEEPER than the body it was generated
from — `cat-harness/skills/<pkg>/x.md` is three from the repository root,
`cat-harness/docs/reference/skill-instructions/x.md` is four — so
`../../../beans/defs/` is right at the source and lands one level short here.
`rebaseLinks` exists for exactly that.

## Why it missed them, and it was my edit

The matcher required a FILE EXTENSION:

    /\]\((\.{0,2}[^)\s:]*?\.[A-Za-z0-9]+)(#[^)\s]*)?\)/g

A directory target has none, so `](../../../beans/defs/)` never reached
`publishedLocation` at all. I widened that pattern from `\.md` to
`\.[A-Za-z0-9]+` in #1398 — more extensions, still no directories. The case
I added it for hid the case I did not.

Fixed: the matcher accepts a trailing `/` as well, and branch 4 emits
`tree/main/` for a directory rather than `blob/main/`, which GitHub serves
as a 404.

## The third survivor is box 2 working

`kg-navigation.md -> local-kg-navigation.html` is left exactly as written: a
local skill under `.claude/skills/local/` that publishes no page here. So is
`.claude/skills/local/todo-manager.md`'s `../../../skills/folio-core/...`,
which resolves nowhere from its OWN source either — a source defect, correctly
published untouched. An early draft of the new test called both generator
failures; the control that separates them is the same one `ahab` uses, one
directory up.

## Done when — all three

- [x] Each kind has a stated treatment and the generator applies it
- [x] A target the generator cannot place is LEFT ALONE
- [x] The count falls and what remains is genuinely the published tree — 76 -> 1,
      and the 1 is the documented leave-alone
