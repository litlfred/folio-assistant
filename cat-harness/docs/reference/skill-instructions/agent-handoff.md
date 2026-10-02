---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'One task, two agents, one human between them'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/agent-handoff.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/agent-handoff.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/agent-handoff.md){: .fa-edit-source }

{% raw %}
# One task, two agents, one human between them

Two agents, two environments: the **coordinator** can see the work, but it
cannot do one step, usually because of network or credentials. The
**executor** can do that step, but it has none of the coordinator's context.
Often the only link between them is a person, retyping. Every rule below is
about that gap.

This is not [`bean-coordination`](bean-coordination.md), which governs sibling
sessions sharing one store and racing for one claim. It is not
[`dispatch-agent`](dispatch-agent.md) either: that governs subagents you spawn
and can read directly. Here you **cannot see the executor's checkout**. The
only things you will ever see are what it pushes and what it posts.

**Needs** the `beans` CLI on both sides (`cat-harness/scripts/install-beans.sh`)
and `bun run beans:claim`. An executor without them reports that it is
blocked; it does not edit bean files by hand.

## Why this exists: bean `mac1`, 2026-10-02

The cloud session could restore and verify an FHIR AST cache, but it could not
build one, because `packages.fhir.org` was blocked. It wrote bean `mac1` for a
local agent on the owner's Mac: re-seed two caches, done when `verify` passes
on a fresh clone. The handoff went wrong in five ways, and all five were
visible only from outside:

| what happened | the rule it breaks |
|---|---|
| the executor worked in another checkout (`folio-assistant-backup`) and created **its own** bean, so two files on one branch now carry the id `mac1` | §1, claim the handed bean and never create one |
| the bean said "STOP and report the counts" without saying where, so the coordinator had to add a channel mid-flight, and the owner asked *"hopefully your bean told where to coordinate"* | §2, the report channel is in the bean from the start |
| one cache was seeded from `5891a22` while the IG's `main` was `e151a4d`, because the executor's checkout was behind | §4, pin the inputs and check them first |
| the executor closed `mac1` on its own build log, and `verify` on a fresh clone failed for **both** caches | §5, the verifier closes |
| the coordinator "approved" a `--force` in a PR comment that the bean itself forbade | §6, only the owner grants an exception |

## 1. One bean, one writer, and the receiver claims it

Before you hand off, write down who may write what. Put it in the bean as a
`## Roles` table, so the executor reads it in the bean rather than hearing it
from a person:

| role | who | writes |
|---|---|---|
| coordinator | the session that opened the bean | the bean's **instructions**, written before the claim; the parent and related beans; the verification record |
| executor | the agent named in the bean | **only** the handed bean, from the claim onward: its holder note, `## Progress`, `## Evidence`, the `ready-to-close` tag |
| verifier | whoever can run the check in `## Done when`, usually the coordinator | the verification result and the close |
| owner | the person | any exception to a boundary (§6) |

**The executor claims the handed bean and never runs `beans create` for the
handed work.** If `beans show <id>` finds nothing, it is in the wrong branch
or the wrong checkout. That is a **stop-and-report**, not a cue to recreate
the bean: a fresh `beans create` mints a new id, or, as with `mac1`, a second
file under an id someone typed by hand, and now two beans answer one question.

**After the claim, the coordinator never edits the bean.** The claim writes to
the bean file, so a concurrent edit is a merge conflict on exactly the file
both agents care about. Anything the coordinator learns after the claim goes
to the report channel (§2).

## 2. The report channel is in the bean, from the start

Give the bean a `## Report to` section that names ONE place: a PR or issue
both agents can reach. Then give the exact one-line formats, so the
coordinator can act on a report without having to interpret it:

```
<id>: started <what> at <input revisions>
<id>: done <what> <result sha/count>
<id>: refused <what> <the numbers>        ← stop here
<id>: blocked <step> <error>              ← stop here
```

The chat is **not** a channel. The coordinator cannot read the executor's
chat, and the person relaying it should not have to. The person is a reader
of the channel, not a router between the two agents.

**The executor re-reads the channel before each irreversible step** (a push,
a seed, a release). That is how a correction posted after the claim reaches it.

## 3. The human pastes one line, never the instructions

Everything the executor needs is in the bean, **on the branch**. What the
person relays is a single command line:

```
reset; cd ~/<repos>/<repo> && git fetch && git switch <branch> && git pull && bun run beans:claim <id>
```

If the handoff needs more pasted text than that, **the bean is incomplete:
fix the bean**. Pasted instructions carry no revision, cannot be updated, and
are not where the next agent looks.

The coordinator also says **which checkout** that line runs in: the
canonical clone, not a backup or a stale copy. `mac1`'s executor worked in
`folio-assistant-backup`, which is how its bean ended up beside the original
instead of claiming it.

## 4. Pin the inputs, and check them before acting

Name the expected revision of every input in the bean: each repository the
step reads, the toolchain branch, and the base it builds from. The executor
prints what it actually has and **stops on a mismatch**:

```
expected  smart-base main = e151a4d   have 5891a22   → STOP, report, do not build
```

Where the claim is reproducibility (a cache, a digest, a release), do the
step **from a fresh clone**. A long-lived checkout carries untracked files,
local edits and line-ending conversions that a clean clone does not, and the
consumer will have a clean clone. In `mac1`, smart-trust's recorded digest
(`e9eb867e…`) matched nothing a clean clone of the same commit computes
(`c1023d82…`).

## 5. The executor's measurement is evidence, not the close

`## Done when` names the check that decides the bean, and **where** it runs.
If that check runs anywhere other than the executor's own tree (a fresh
clone, another environment, CI), the executor cannot close the bean:

- the executor tags it `ready-to-close` and quotes under `## Evidence` what it
  measured. This is the third state of
  [`bean-coordination`](bean-coordination.md) §"When you cannot re-derive it
  yourself";
- the **verifier** runs the named check and closes the bean, or records the
  failure and reopens the work.

A build log saying "678 resources, 671 edges" is the executor's view of its
own tree. `mac1`'s criterion was `verify` on a fresh clone, and it failed
while the log read clean.

## 6. Only the owner grants an exception

A boundary in the bean ("never `--force`", "push only to `fhir-ast/*`", "never
`main`") is the owner's. A coordinating agent **cannot waive it**, even when
the waiver looks safe, and even in a PR comment the executor will read as
authoritative. Put the question to the owner with the numbers, and let the
executor stop until the answer comes. An agent's "approval" is a second voice
claiming the owner's authority, and an executor has no way to tell the two
apart.

## Checklist: the bean you hand over

- [ ] `## Roles`: coordinator, executor, verifier, owner (§1)
- [ ] the exact branch, and the canonical checkout the line runs in (§3)
- [ ] the one paste-able line: `switch` + `pull` + `beans:claim <id>` (§3)
- [ ] `## Report to`: one PR or issue, with the line formats (§2)
- [ ] `## Inputs`: every expected revision, and "stop on mismatch" (§4)
- [ ] fresh clone, where reproducibility is the claim (§4)
- [ ] `## Done when`: the check, **where** it runs, and **who** closes (§5)
- [ ] boundaries, with "exceptions: owner only" (§6)

## Checklist: the executor, before the first irreversible step

- [ ] `beans show <id>` finds the handed bean on this branch; if not, stop
- [ ] claimed with `bun run beans:claim <id>`, with no `beans create`
- [ ] inputs printed and matched against `## Inputs`
- [ ] report channel re-read for corrections
- [ ] after the step: report in the channel's format, tag `ready-to-close`
      with `## Evidence` unless you can run the `## Done when` check yourself
{% endraw %}
