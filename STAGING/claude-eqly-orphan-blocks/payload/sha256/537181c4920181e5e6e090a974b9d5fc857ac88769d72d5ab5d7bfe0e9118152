---
$schema: folio-todo/v1
id: human-todos-page-says-not-built-yet
summary: "The human-todos page still says 'Not built yet' — the store now exists"
status: open
priority: high
origin: agent
# THEME, chosen by judgement from this todo's content (bean `5y4b`).
# The subject is a DOCUMENTATION page whose text disagrees with the store behind it. `library` is the theme for knowledge-graph discussion, content and data modelling, which is what a docs page saying the wrong thing about a graph is.
theme: library
createdAt: 2026-09-19
targetLabel: sec:beans-and-todos-human-todos
identities:
  - github:litlfred
references:
  - kind: bean
    id: folio-assistant-h32d
artefacts:
  - kind: pull-request
    id: "336"
  - kind: pull-request
    id: "314"
---
`content/docs/beans-and-todos/human-todos.md` opens **"Not built yet"**, and
that is no longer true. `todos/` is a declared graph with items on disk, a
reader, a published JSON index and a board on the site.

This todo is attached to that block, so it renders beside the sentence it
contradicts. That is the per-page assignment working on a real case rather
than a demonstration — the page is genuinely stale and somebody has to decide
what it should say now.

## What the page still gets RIGHT, and must not lose

Three of its four claims survive, and they are the valuable part:

- **"Do not repurpose beans for it."** Still correct, and now structural:
  `beans/` and `todos/` are separate declared graphs.
- **When a todo is shown.** Still undecided. This PR answers it for the
  navbar and the board; it does not answer whether an open item should
  surface unasked, and the page's objection stands — surfacing every item on
  every turn is noise, surfacing none is a list nobody reads.
- **How one is retired.** Still undecided. `TodoStatus` carries `resolved`
  and `wontfix`, but nothing retires one, and the page's point holds: a
  person abandoning a reminder is ordinary and needs no ceremony, so the bean
  rules do not transfer.

## What has changed and needs writing down

- **How a person creates one** is answered in the worst way: by an agent
  writing a file. There is no human path at all yet.
- The 2×2 the page is missing — memory against workflow management, human
  against agent — with the empty quadrant named.

## Done when

The page says what is true. Cheapest correct move is an edit to that block,
not a rewrite: strike "Not built yet", keep the three open questions, add
what now exists and who created it.

Every todo carries a pencil to exactly this file, so the edit is one click
from where the stale sentence renders.
