---
name: create-sticky-note
description: Draft a sticky note from the conversation, choose its theme and its place, preview it, and only then attach it to a node.
---

# Create a sticky note

A sticky note is a **carried note**: something a person or agent sticks onto the
knowledge graph. This skill turns a moment in a conversation into one — drafting
the words, choosing the theme, deciding where it goes — and **shows it before it
is attached to anything**.

> it will use input from use in drafting message of sticky note (either by
> interpretation of that context, or direct quotation). it will then determine
> where to place it … it should also preview sticky note … before confriming it
> and assigning to node
>
> — owner, 2026-09-20

## The one rule that makes this safe

**Preview, confirm, then attach — in that order, always.**

A sticky lands in committed state: `todos/items/` is a graph a person reads,
and `folio/` is rendered to a website. Writing first and asking afterwards means
the wrong note is already in somebody's list. The preview costs one exchange and
is never skipped, not for a short note and not for an obvious one.

**An unattached sticky is a legitimate outcome.** Previewed, looked at, and left
where it is. That is not a failed run — a note nobody needed is cheapest when it
never reached the graph.

## The six steps

### 1. Read the context, and say what you took from it

Name the moment the sticky is about: a ruling, a measurement, a question that
went unanswered, a thing somebody will need again. If you cannot name it, there
is no sticky to make.

### 2. Draft the words — quote, or interpret, and SAY WHICH

Two modes, and the choice is reported rather than silent:

| | when | how |
|---|---|---|
| **direct quotation** | the words carry information their paraphrase loses — a joke, a term of art, a ruling's exact scope | verbatim, down to the spelling. |
| **interpretation** | the point is clear but scattered across several turns, or the original was a fragment | write it plainly, and keep any phrase that was doing work. |

**Prefer quotation when in doubt.** This repository has paid for the opposite:
*"please be introduced to a cat who acquires things, for whatever purpose, maybe
somebody knows"* is a joke that carries a real gloss, and *"the documentation you
will never read"* is honestly true of every thorough docs site. Sanding either
into a product sentence would have lost the only part that told a reader
anything.

A `summary` is derived from the body's first line unless the note needs its own.
Two fields the author must keep in step is one field that drifts.

### 3. Choose the theme — a judgement, not a lookup

> no formal role/theme mapping per se. that is authoring (human/agentic)
> decision/judgement
>
> — owner, 2026-09-20

So there is no table to consult here, and adding one would contradict a ruling.
Choose from what the note is *doing*: the shipped themes are `grumpy-cat`,
`engineer`, `library`, `analyst`, plus the palette-only `pale-sage`,
`dusty-carolina`, their `-fade` variants, and the two high-contrast themes.
`schemas/themes.ts` is the list; **state the reason for the one you picked**, in
a clause.

Two mechanical facts worth knowing before choosing:

- A theme whose art the instance does not declare resolves to **palette only**,
  not to a broken image — `resolveThemeBackdrop` reports that third state rather
  than serving art that is not there.
- An incomplete backdrop is refused **wholesale**. Two of three layouts renders
  as *no* art, not two thirds. Check `bun run check:theme-art` if you are about
  to rely on a role you have not seen render.

### 4. Decide where it goes — `todos/` is the default, not the only answer

| destination | when | what it becomes |
|---|---|---|
| **`todos/items/`** — the default | somebody has an outstanding item | a `folio-todo/v1` node: `status`, `priority`, `origin`, plus the tags below |
| **`todos/feedback/`** | it is about a specific block, with the submitter's identity | the content-review feedback workflow the `todo-review` skill reads |
| **`folio/`** | it belongs on a rendered page | a landing sticky — but a *page's* sticky is a layer's **contribution**, so it is declared in that layer's `<name>.json`, not written here |
| **nowhere** | it was worth showing and not worth keeping | previewed in the conversation and left there |

**`todos/` is not `beans/`, and this is the line the repository keeps paying to
redraw.** A todo is a *person's* outstanding item; a bean is the *agent* work
plan. `AGENTS.md` forbids standing a second work plan beside `beans/`, so a
sticky that is really agent work is a bean — use `todo-manager`, not this.

### 5. Bind it to the graph

A `CarriedNote` carries its attachments, and each is optional:

- `anchor` — page-global (`{kind: "page", page}`), a block (`{kind: "block",
  block}`), or `none`. Absent is a fourth state and means *not yet placed*.
- `roles`, `processes`, `tasks` — what it is about in the process model.
- `identities` — who it is assigned to, as `provider:id` (`github:litlfred`).
  **Assignment is a tag, not a transfer**: it says who should see it, and the
  person has not agreed to anything by being named.
- `references` — KG corpus nodes by `{kind, id}`: a bean, a block, a skill.
- `artefacts` — files and external things.

Leave out what you do not know. An empty `identities` is *unassigned*, which is
a real answer; a guessed one is a false one.

### 6. Preview, on the surface the reader is on

**In the conversation** when that is where the decision is being made — render
it as it will read, not as a JSON dump. Show the theme, the placement and the
assignment as a header, then the body as a reader sees it.

**On the knowledge graph** when the note is one of many, or when its look
matters — build the page and screenshot it. A rendered artefact cannot be
assessed from a description of it, and this repository has the measurement:
three defects in the sticky board were invisible to a green suite and visible
the moment somebody looked.

Then **ask**, and attach only on a yes.

## Worked example — an unattached one

Asked for a sticky about reading the documentation, explicitly **not** in
`todos/`:

1. **Context** — orientation. Somebody arriving at this repository asks a
   question the guides answer.
2. **Words — interpretation, with one quotation kept.** No ruling to quote, so
   the body is written; but *"the documentation you will never read"* is kept
   verbatim, because the repository's own landing sticky already says it and it
   is the honest expectation.
3. **Theme — `grumpy-cat`.** RTFM is a grumpy sentiment and the cat is the one
   that carries it. Judgement, stated; no table consulted.
4. **Placement — none.** Explicitly not `todos/`: nobody has an outstanding item
   here, and filing it would put a signpost in somebody's task list.
5. **Bindings — none.** `identities` empty, so unassigned. One `artefacts` entry
   pointing at the docs site is what the note is *for*.
6. **Preview in the conversation**, and stop. There is nothing to confirm,
   because there is nothing to attach.

## What this skill does not do

- **It does not write a landing-page sticky.** Those are a layer's contribution,
  declared in its declaration — see `sticky-contribution.ts`.
- **It does not create beans.** Agent work is `todo-manager`'s.
- **It does not delete or overwrite a sticky it did not make.** Editing somebody
  else's note is the `deletion-requires-confirmation` case.
