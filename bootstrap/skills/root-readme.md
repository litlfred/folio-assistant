---
name: root-readme
description: >
  Write the repository's root README when there is none, carrying a link to the
  harness that was installed and the overall install status. Never replaces one
  that exists. It runs only once the install has succeeded.
---

# The root README, and the one fact it must carry

**You are the Initiator, and the install has just succeeded.** The repository
now *is* an instance of something, and — unless somebody wrote one before you
got here — nothing at its root says so.

That gap is the reason this step exists. A person landing on the checkout reads
`README.md` first. So does an agent that arrives before it has found any
declaration, which is every agent at cold start. Until this runs, the fact that
the repository has a harness lives in `<name>.json` and in a log, and neither
is where anybody looks first.

## Writing it is not the write the layer rule forbids

You are about to write an `instance-readme`, and that role declares
`layer: context` — **read at session start, never written by a running
process.** Both hold, and the reason is worth having in front of you before you
write anything:

> **Initialisation is not process runtime.**

The rule governs a process operating on an instance that already exists. This
is the act that brings the instance into being. A `context` asset that does not
exist yet has to come from somewhere, and *"never written by a process"* cannot
mean *"never created"* without leaving every instance without one.

The harness states this too, in `content-context-and-state-graphs`. If you find
the two disagreeing, the harness's skill is the source of truth and this file
is the copy that drifted.

## When it is absent — write it

Two things, and **no more**:

1. **A link to the harness that was installed.** Whatever reference the
   Requestor gave when the harness was confirmed, resolved to something clickable.
2. **The overall install status.** Not one line per location dug out of a log —
   the question a reader has is *"is this repository set up, and as what"*, and
   that is what you answer. Say how many locations the install touched and
   whether every one of them succeeded.

Write nothing else. You do not know what this repository is for, what it will
hold, or who is writing it; a paragraph guessing at that is a paragraph its
author has to delete. The harness's own `readme_sync` fills the rest, in marker
pairs, once it is installed.

**Say which locations, when there is more than one.** *"Installed"* over three
locations where one failed is a false statement about the repository, and the
reader who acts on it is the person who set it up.

## When one is already there — do NOT replace it

A repository with a README has one somebody wrote. Overwriting it destroys
authored content in order to state a fact that belongs in a generated region,
which is a bad trade in every case and an unrecoverable one in some.

Add the link and the status **inside a marker pair** instead, so the harness's
`readme_sync` owns that region from then on and the rest of the file stays the
author's. If you cannot tell whether an existing file is authored or a
leftover, it is authored: that is the assumption whose failure mode is a
duplicated sentence rather than a lost page.

## What you do not decide here

Whether the install *succeeded* — the install step decided that, and you are on the
path where it did. Which harness it was — the Requestor decided that. What the
README should eventually say — its author decides that, and you are not its
author.

If the write fails (no permission, a read-only checkout), **say so and end
installed anyway**. The harness is installed; a missing README is a thing a
person can fix in a second, and failing the whole initialisation over it would
throw away the install to report a smaller problem.
