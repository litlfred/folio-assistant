---
# folio-assistant-hloc
title: gen-skill-docs flattens packages but leaves 120 non-skill links addressing the source layout
status: todo
type: task
priority: normal
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-26T11:26:11Z
parent: folio-assistant-ahvw
blocked_by:
    - folio-assistant-ahab
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

- [x] Each kind above has a stated treatment, and the generator applies it.
      `publishedLocation`, four ordered branches. Two REUSED rather than
      invented: the process-page path the generator already composed, and the
      `repoRelative` blob URL from `oe98`.
- [x] A target the generator cannot place is still LEFT ALONE — the rule
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


## Landed as `40b33b4e973` (PR #1398) — but this bean is NOT complete

Boxes 1 and 2 are done and verified. **Box 3 is not**, and it is left unticked
deliberately rather than stretched to fit.

It asks that the `siteResolved` count fall AND that what remains be "genuinely
the published tree (api/, generated pages), so the bucket's own justification
becomes true of its contents". The first half happened: **340 → 267**, every
kind this bean names at zero. The second half did not. What remains is 213
`.html`, 34 directories and 20 `.svg` — and **225 of the 267 are translated
pages**, which is bean `ahab`, a different generator and a different cause.

So the bucket's justification is still false of its contents, and saying
otherwise would be the `rsi6` shape: a completed bean holding live work.

## What landed

- `publishedLocation` — four ordered branches, each resolved against disk and
  looked up, none composed. `undefined` leaves the link exactly as written so
  it stays a finding rather than becoming a plausible 404.
- **340 → 267**; `.md`, `.bpmn`, `.ts`, `.sh`, `.py`, `.json`, `.dmn` at zero.
  858 links resolved in the published tree, none dangling. The one flag is
  `Y.md`, a literal inside backticks in prose — the leave-alone rule working.
- Falsified by hiding `docs/processes/crdm-requirements.md` and confirming the
  rewritten `.bpmn` link reverted to untouched; restoring brought it back.

## Two premises in this bean were WRONG, and following either would have harmed

**The count.** This bean records 120 after `mi97` took it from 246. It reads
**340** — higher than the pre-`mi97` figure. Not a regression, a different
population: 225 translated-page links (bean `ahab`) against 76 here.

**The treatment for `methodologies/*.md`.** This bean says they are "published
elsewhere on the site, so they want a site-relative path".
`cat-harness/docs/methodologies/` holds **only `index.md`** — those nine
publish nowhere. Obeying this bean would have composed nine links to pages that
do not exist, which is the exact failure it warns about two paragraphs earlier.
They get blob URLs.

## Still open

Box 3, blocked on `ahab`. When the 225 translated-page links are resolved at
their cause, re-measure `siteResolved` and check whether the remainder is
finally the published tree it claims to be — **re-derived, not quoted from
here**, since this bean's own count has now been wrong once.
