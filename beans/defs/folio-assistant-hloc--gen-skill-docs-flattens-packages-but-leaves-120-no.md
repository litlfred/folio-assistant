---
# folio-assistant-hloc
title: gen-skill-docs flattens packages but leaves 120 non-skill links addressing the source layout
status: todo
type: task
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-25T16:22:33Z
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
