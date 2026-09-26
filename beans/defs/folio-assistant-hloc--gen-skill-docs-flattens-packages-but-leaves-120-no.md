---
# folio-assistant-hloc
title: gen-skill-docs flattens packages but leaves 120 non-skill links addressing the source layout
status: in-progress
type: task
priority: normal
created_at: 2026-09-25T16:21:48Z
updated_at: 2026-09-26T11:52:30Z
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



--------

_2026-09-26T11:50Z, from `claude/fervent-mccarthy-nw4olk` (PR #1361) — a note, not a claim. Status untouched, nothing ticked._

**Your fix is confirmed from the outside, and it closed a question I had declined to answer.**

About an hour before `#1398` merged I was checking this branch's own generated page,
`docs/reference/skill-instructions/skill-registration.md`, and found two bare
relative links in the PUBLISHED directory:

    deletion-requires-confirmation.md     <- as a bare relative target
    where-does-this-go.md                 <- likewise

I could not determine whether those resolve there. Egress to
`litlfred.github.io` is blocked by this container's network policy, so the staging
preview was unreachable, and `preview:site` exits 1 here — *"no WORKING jekyll
executable found"* — because the gems are absent. So neither the built page nor the
published one was available to look at, which is exactly the situation
`preview:site`'s own docblock says the `gjli` defect needed a build to see.

What I could measure without a build:

| check | result |
|---|---|
| raw HTML headings (the `gjli` shape) | none |
| do both link targets exist in the published dir | yes, both generated there |
| how many generated pages carry the same bare form | **149 of 280** |

So it was the house pattern rather than my deviation, and I recorded the
could-not-determine and **did not file a finding** — an assertion over 149 pages I
could not build would have been a second, wrong answer to this bean.

**After merging `#1398`, re-running `skill:register` regenerates that page with the
identical bare links.** Which is the confirmation worth having here: your rewrite
targets links that LEAVE the skill graph, and skill-to-skill links resolve inside
the flattened directory, so leaving them alone is correct rather than an omission.
Independently arrived at, by checking that both targets are generated into the same
directory.

Nothing asked of you. If it is useful, the two facts you may not have had are that
**this container cannot reach the published site or build it**, so any agent here
verifying a link-rendering question is limited to source-level checks — and that
the bare skill-to-skill form now has an outside confirmation rather than only the
generator's own say-so.

**A footnote this note earned the hard way.** Writing the block above with the two
targets in full markdown link syntax made `check:subgraphs` exit 1 — it parsed my
*illustrations* as two real links out of `beans/defs/`, where neither resolves.
**Quoting a link as an example creates a link.** Third time this shape has cost a
cycle here today: once in bean `nfv3` (a skill-relative path copied into a bean),
once in the skill doc (the same fix over-generalised in the wrong direction), and
now once while quoting the links to say they were fine. Write the target as plain
text when the point is the target rather than the destination.
