---
name: determine-intent
description: >-
  Turn what the human wants into an INSTANCE REFERENCE — the one input the
  bootstrap process needs. Not a menu of content types: the named instance's
  own declaration answers the type, the knowledge graph and the voice.
---

# Determining intent

> Skill id: `determine-intent` · Package: `bootstrap`

## What you are producing

**One instance reference.** A repository coordinate such as
`litlfred/cat-harness` or `litlfred/f-a-sci`. That is the entire output.

> **"make this repo into a `litlfred/f-a-sci` instance"** → intent is
> `litlfred/f-a-sci`. Done.

## Why it is not a content type

The tempting design is to ask *what kind of repository is this — a folio, a
DAK, an IG?* and produce a value from a closed set. That is weaker, and the
difference is not stylistic:

- **An enum is a second answer.** The upstream instance's declaration already
  says what kind of thing it is. Recording that again here creates a value
  free to disagree with the declaration it came from.
- **One reference answers three questions.** Naming `litlfred/f-a-sci` yields
  the content type, the knowledge graph to load, and the editorial voice —
  because all three are in **its** declaration. Asking three questions gets
  the same answer for three times the typing.
- **It scales to instances nobody has enumerated.** A closed set cannot name a
  repository created tomorrow.

## Asking

Ask only when you do not already have a reference. When you must ask, ask for
the **one** thing:

> Which instance should this repository be an instance of? (for example
> `litlfred/cat-harness`)

If the human answers with a *kind* rather than a reference — "a folio", "a
DAK" — that is not an answer to this question. Say which instances you know of
and ask them to pick one, rather than inventing a mapping from kind to
repository: a mapping you invent is a fourth place the answer is written down.

## What you must NOT do with it

**Do not write this repository's declaration yet.** The order is
**reference → read theirs → write ours → cache**, and it is load-bearing:
writing a declaration before reading the upstream one leaves a window in which
this repository claims to be something it is not, and every consumer that
reads a declaration would believe it.

Hand the reference back to the process. Reading the upstream declaration is
the next step, not yours.
