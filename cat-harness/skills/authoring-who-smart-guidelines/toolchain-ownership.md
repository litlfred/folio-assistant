---
name: toolchain-ownership
description: >
  Taking ownership of the WHO smart-base scripts in a litlfred fork, rewriting
  them to the Skill I/O contract, and the one gate that governs when a script
  may actually move. Read before touching, copying or rewriting any upstream
  smart-base script.
---

# toolchain-ownership

> Skill id: `toolchain-ownership` · Package: `authoring-who-smart-guidelines` ·
> Beans `uhkv`, `wm63`

How the WHO SMART toolchain stops living in an IG and starts living in the
harness — without becoming a fork nobody can merge back.

## The owner's instruction, verbatim

2026-09-22:

> take ownership of the scrips in litlfred/smart-base, rewrite as needed to fit
> better, adhere to Skill i/o requirements, fit in tools, etc. only move scripts
> when a proper tool /skill in pprocess

and the goal it serves:

> want to slowly get smart-base back to a more conventional IG state w/p tooling

## The gate, and it is the whole skill

> **A script moves only when a Tool node, a skill and a process step that binds
> them all exist for it.**

Three artefacts, all three, before a single line of Python relocates. Not two.
The Tool node says what it consumes and produces; the skill says how and when a
person or agent performs it; the process step is what actually *hands it out*.

**Why all three, rather than the Tool node alone.** A Tool with no process step
is unreachable — bean `y1w9` measured 113 skills bound to no role or process,
so nothing hands them to an agent. Moving a script into that state does not
migrate it; it hides it. The script would leave a place where a workflow runs
it every build and arrive somewhere nothing runs it at all, and both repositories
would look healthy.

**What the gate is NOT.** It is not a bar on declaring. Declaring is free and
should run ahead — `smart-base/tools/` already carries nine Tool nodes for
scripts that still execute upstream, and that is the intended steady state for
now: **declare here, execute upstream, until the execution moves too.**

## Declaring is not vendoring, and the older rule stands

[`smart-base-tools`](smart-base-tools.md) says *load it; never vendor it* — a
copy of the Python would be a second, drifting toolchain. **That rule is about
copies of the code and nothing here weakens it.** A Tool node is a declaration;
it duplicates no implementation.

The migration this skill governs is the one case where code does eventually
move, and the difference from vendoring is the difference between a **cutover**
and a **copy**: after a move, exactly one repository runs that script. If both
do, the move has not happened and a fork has.

## Where ownership lives

`litlfred/smart-base` — a fork, taken so the scripts can be rewritten without
waiting on upstream review.

> **It does not exist yet.** Searched 2026-09-22: no `litlfred/smart-base`.
> Recorded rather than assumed, because every instruction below is conditional
> on it and an agent that infers the fork exists will rewrite into thin air.
> `WorldHealthOrganization/smart-base` is read-only from here.

**Nothing at `WorldHealthOrganization/*` changes.** This is pre-work in
`litlfred/*`, which is also why `dak.json` → `dak.config.json` is ours alone
until upstream follows.

## What "adhere to Skill I/O requirements" means concretely

A rewritten script must be describable by its Tool node without hedging:

- **Declared inputs and outputs**, each with a type from the shared vocabulary
  — not "it reads the repository and writes some files".
- **A determined empty is distinguishable from a failure.** The upstream
  scripts mostly get this right already: they report `files_expected` against
  `files_missing`, which is what makes "this DAK has no DMN" different from
  "the DMN directory was not found". Do not lose it in a rewrite.
- **Exit status means something.** Several upstream steps warn and continue
  when their script is absent, so a missing capability reads as a clean run.
  That is the `ci-health` rule — *could not check is never green* — and it is
  the single most common thing to fix while rewriting.
- **No hidden fetch.** Upstream scripts `curl` themselves from smart-base
  `main` at build time, so a downstream build changes without its repository
  changing. A rewritten script does not fetch itself.

## Rewrite in this order

1. **Declare** the Tool node against the script as it is today. Declaring an
   aspiration produces a node that describes nothing.
2. **Write the skill**, and only then discover whether the capability is one
   thing or two — `update_sushi_config.py` is four jobs in one script, and a
   skill written honestly is where that becomes obvious.
3. **Bind it** in a process, in the lane whose role performs it.
4. **Then** rewrite and move, with a cutover.

Steps 1–3 are reversible and cheap. Step 4 is neither.

## What is already declared

`smart-base/tools/` — nine nodes, none moved. `fhir-harness/tools/` — the two
`Library` strippers, which are not DAK-shaped and belong to the base layer; see
[`smart-stack-layering`](smart-stack-layering.md).

The count is deliberately not repeated elsewhere. Count the directory.
